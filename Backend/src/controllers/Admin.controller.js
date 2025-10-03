import { connectSupabase, connectSupabaseAdmin } from "../db/supabaseClient.js";
import multer from "multer";

const supabase = connectSupabase();
const supabaseAdmin = connectSupabaseAdmin();

const storage = multer.memoryStorage();
export const upload = multer({ storage });

const createCourse = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    // Verify if user is admin
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (userError || !userRecord?.is_admin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    const { title, description, price, category, prerequisites, objectives } = req.body;
    const thumbnailFile = req.file;

    if (!title || !price) {
      return res.status(400).json({ message: "Title and price are required" });
    }

    let thumbnailUrl = null;

    if (thumbnailFile) {
      const fileExt = thumbnailFile.originalname.split(".").pop();
      const fileName = `course-thumbnails/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("course-thumbnails")
        .upload(fileName, thumbnailFile.buffer, {
          contentType: thumbnailFile.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error("Thumbnail upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload thumbnail" });
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("course-thumbnails")
        .getPublicUrl(fileName);

      thumbnailUrl = publicUrlData.publicUrl;
    }

    // Create course with actual user ID
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .insert([
        {
          title,
          description: description || null,
          price: parseFloat(price),
          category: category || null,
          prerequisites: prerequisites || null,
          objectives: objectives ? JSON.parse(objectives) : null,
          thumbnail: thumbnailUrl,
          created_by: user.id, // Use actual user ID instead of DUMMY_USER_ID
          status: 'active'
        }
      ])
      .select()
      .single();

    if (courseError) {
      console.error("Course creation error:", courseError);
      return res.status(500).json({ message: "Failed to create course" });
    }

    res.status(201).json({
      message: "Course created successfully",
      course
    });

  } catch (err) {
    console.error("Course creation error:", err);
    res.status(500).json({
      message: "Internal server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Delete a course
const deleteCourse = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const { data: userRecord } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!userRecord?.is_admin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    const { id } = req.params;

    // Delete course contents first
    const { error: contentDeleteError } = await supabaseAdmin
      .from("course_contents")
      .delete()
      .eq("course_id", id);

    if (contentDeleteError) {
      return res.status(500).json({ error: "Failed to delete course contents" });
    }

    // Then delete the course
    const { error: courseDeleteError } = await supabaseAdmin
      .from("courses")
      .delete()
      .eq("id", id);

    if (courseDeleteError) {
      return res.status(400).json({ error: courseDeleteError.message });
    }

    res.status(200).json({ message: "Course and its contents deleted successfully" });
  } catch (err) {
    console.error("Course deletion error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all courses
const getCourses = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
  } catch (err) {
    console.error("Get courses error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a single course by ID
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Course not found" });
    
    res.status(200).json(data);
  } catch (err) {
    console.error("Get course error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Edit a course
const editCourse = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const { data: userRecord } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!userRecord?.is_admin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    const { id } = req.params;
    const { title, description, price, category, prerequisites, objectives } = req.body;
    const thumbnailFile = req.file;

    // Validate required fields
    if (!title || !description || !price || !category || !prerequisites || !objectives) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let updates = {
      title,
      description,
      price: Number(price),
      category,
      prerequisites,
      objectives: typeof objectives === 'string' ? JSON.parse(objectives) : objectives,
      updated_at: new Date().toISOString()
    };

    // If new thumbnail is provided, upload it
    if (thumbnailFile) {
      const fileExt = thumbnailFile.originalname.split(".").pop();
      const fileName = `thumbnails/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("course-thumbnails")
        .upload(fileName, thumbnailFile.buffer, {
          contentType: thumbnailFile.mimetype,
          upsert: false
        });

      if (uploadError) {
        return res.status(500).json({ error: uploadError.message });
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("course-thumbnails")
        .getPublicUrl(fileName);

      updates.thumbnail = publicUrlData.publicUrl;
    }

    const { data, error } = await supabaseAdmin
      .from("courses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: "Course not found" });

    res.status(200).json({
      message: "Course updated successfully",
      course: data
    });
  } catch (err) {
    console.error("Course update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update the getCourseContents function
const getCourseContents = async (req, res) => {
  try {
    // Log the full request headers
    console.log('Request headers:', req.headers);
    console.log('CourseId from params:', req.params.courseId);
    
    const token = req.headers.authorization?.split(" ")[1];
    console.log('Extracted token:', token?.substring(0, 20) + '...');
    
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    // Log user authentication attempt
    console.log('Attempting to authenticate user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('Authentication error:', authError);
      return res.status(401).json({ 
        message: "Unauthorized - Invalid token",
        details: authError.message
      });
    }

    if (!user) {
      console.log('No user found with token');
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    console.log('Authenticated user ID:', user.id);

    // Verify admin status
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error('User lookup error:', userError);
      return res.status(500).json({ 
        error: "Failed to verify admin status",
        details: userError.message 
      });
    }

    if (!userRecord?.is_admin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    const { courseId } = req.params;
    console.log('Fetching contents for course:', courseId);

    // Check if course exists first
    const { data: courseExists, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", courseId)
      .single();

    if (courseError || !courseExists) {
      console.error('Course lookup error:', courseError);
      return res.status(404).json({ error: "Course not found" });
    }

    // Fetch course contents
    const { data, error } = await supabase
      .from("course_contents")
      .select(`
        id,
        course_id,
        module_name,
        lesson_title,
        file_url,
        file_type,
        order_number,
        created_at
      `)
      .eq("course_id", courseId)
      .order("order_number", { ascending: true });

    if (error) {
      console.error('Content fetch error:', error);
      return res.status(500).json({ 
        error: "Failed to fetch course contents",
        details: error.message 
      });
    }

    console.log(`Successfully found ${data?.length || 0} content items`);
    return res.status(200).json(data || []);

  } catch (err) {
    console.error("Detailed error:", {
      message: err.message,
      stack: err.stack,
      details: err
    });
    return res.status(500).json({ 
      error: "Internal server error",
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// Delete course content (DB only, no storage)
const deleteCourseContent = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized - No token" });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: "Unauthorized" });

    const { data: userRecord } = await supabase.from("users").select("*").eq("id", user.id).single();
    if (!userRecord?.is_admin) return res.status(403).json({ message: "Admins only" });

    const { contentId } = req.params;
    const { error } = await supabaseAdmin.from("course_contents").delete().eq("id", contentId);

    if (error) return res.status(400).json({ error: error.message });

    res.status(200).json({ message: "Content deleted" });
  } catch (err) {
    console.error("Delete content error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

const uploadCourseContent = async (req, res) => {
  try {
    console.log("=== Upload Course Content Debug ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("File:", req.file);
    console.log("Params:", req.params);

    // 1. Token validation
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.log("❌ No token provided");
      return res.status(401).json({ message: "Unauthorized - No token" });
    }

    console.log("✅ Token found:", token.substring(0, 20) + "...");

    // 2. User authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError) {
      console.log("❌ Auth error:", authError);
      return res.status(401).json({ 
        message: "Unauthorized - Invalid token",
        error: authError.message 
      });
    }

    if (!user) {
      console.log("❌ No user found");
      return res.status(401).json({ message: "Unauthorized - User not found" });
    }

    console.log("✅ User authenticated:", user.id);

    // 3. Admin check
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.log("❌ User lookup error:", userError);
      return res.status(500).json({ 
        error: "Failed to verify admin status",
        details: userError.message 
      });
    }

    if (!userRecord?.is_admin) {
      console.log("❌ User is not admin:", userRecord);
      return res.status(403).json({ message: "Admins only" });
    }

    console.log("✅ Admin verified");

    // 4. Parameter validation
    const { courseId } = req.params;
    const { module_name, lesson_title, order_number, embed_url } = req.body;

    console.log("Parameters:", { courseId, module_name, lesson_title, order_number, embed_url });

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    if (!lesson_title?.trim()) {
      return res.status(400).json({ message: "Lesson title is required" });
    }

    // 5. Course existence check
    const { data: courseExists, error: courseCheckError } = await supabase
      .from("courses")
      .select("id, title")
      .eq("id", courseId)
      .single();

    if (courseCheckError) {
      console.log("❌ Course check error:", courseCheckError);
      return res.status(500).json({ 
        error: "Failed to verify course",
        details: courseCheckError.message 
      });
    }

    if (!courseExists) {
      console.log("❌ Course not found:", courseId);
      return res.status(404).json({ error: "Course not found" });
    }

    console.log("✅ Course exists:", courseExists.title);

    // 6. File/URL validation
    if (req.file && embed_url?.trim()) {
      return res.status(400).json({ 
        message: "Cannot upload both file and embed URL. Please choose one." 
      });
    }

    if (!req.file && !embed_url?.trim()) {
      return res.status(400).json({ 
        message: "Either file or YouTube embed URL is required" 
      });
    }

    let finalUrl = "";
    let fileType = "";

    // 7. Handle file upload
    if (req.file) {
      console.log("📁 Processing file upload...");
      
      const allowedTypes = [
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
        'application/pdf',
        'image/jpeg', 'image/png', 'image/gif', 'image/webp'
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          message: `File type ${req.file.mimetype} not allowed. Allowed: video, PDF, images` 
        });
      }

      const fileExt = req.file.originalname.split(".").pop()?.toLowerCase();
      const fileName = `course-contents/${courseId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      console.log("Uploading file:", fileName);

      const { error: uploadError } = await supabaseAdmin.storage
        .from("course-contents")
        .upload(fileName, req.file.buffer, { 
          contentType: req.file.mimetype,
          cacheControl: '3600',
          upsert: false 
        });

      if (uploadError) {
        console.log("❌ File upload error:", uploadError);
        return res.status(500).json({ 
          error: "File upload failed",
          details: uploadError.message 
        });
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from("course-contents")
        .getPublicUrl(fileName);

      finalUrl = publicUrlData.publicUrl;
      
      // Determine file type
      if (req.file.mimetype.startsWith("video/")) {
        fileType = "video";
      } else if (req.file.mimetype === "application/pdf") {
        fileType = "pdf";
      } else if (req.file.mimetype.startsWith("image/")) {
        fileType = "image";
      } else {
        fileType = "other";
      }

      console.log("✅ File uploaded:", finalUrl);
    }
    // 8. Handle embed URL
    else if (embed_url?.trim()) {
      console.log("🔗 Processing embed URL...");
      
      const url = embed_url.trim();
      
      // Basic URL validation
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      finalUrl = url;
      fileType = "video"; // Assuming embed URLs are videos
      
      console.log("✅ Embed URL processed:", finalUrl);
    }

    // 9. Database insertion
    const insertData = {
      course_id: courseId,
      module_name: module_name?.trim() || null,
      lesson_title: lesson_title.trim(),
      file_url: finalUrl,
      file_type: fileType,
      order_number: order_number ? parseInt(order_number, 10) : 0,
      created_at: new Date().toISOString(),
    };

    console.log("💾 Inserting data:", insertData);

    const { data, error: insertError } = await supabaseAdmin
      .from("course_contents")
      .insert([insertData])
      .select()
      .single();

    if (insertError) {
      console.log("❌ Database insert error:", insertError);
      return res.status(500).json({ 
        error: "Failed to save content",
        details: insertError.message,
        hint: insertError.hint 
      });
    }

    console.log("✅ Content saved successfully:", data.id);

    res.status(201).json({ 
      message: "Content uploaded successfully", 
      content: data 
    });

  } catch (err) {
    console.error("💥 Unexpected error in uploadCourseContent:", {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    
    res.status(500).json({ 
      error: "Internal server error",
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err 
      })
    });
  }
};  

export { 
  createCourse, 
  deleteCourse, 
  editCourse, 
  getCourses, 
  getCourseById,
  uploadCourseContent, 
  getCourseContents, 
  deleteCourseContent,
};