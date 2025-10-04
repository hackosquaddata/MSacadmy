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

// Get course contents
const getCourseContents = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const { data: contents, error } = await supabaseAdmin
      .from('course_contents')
      .select('*')
      .eq('course_id', courseId)
      .order('module_order', { ascending: true })
      .order('order_number', { ascending: true });

    if (error) {
      console.error('Error fetching course contents:', error);
      return res.status(500).json({ message: 'Failed to fetch course contents' });
    }

    // Group contents by module
    const moduleMap = contents.reduce((acc, content) => {
      if (!acc[content.module_name]) {
        acc[content.module_name] = {
          module_id: content.module_id,
          module_name: content.module_name,
          module_order: content.module_order,
          contents: []
        };
      }
      acc[content.module_name].contents.push(content);
      return acc;
    }, {});

    const organizedContents = Object.values(moduleMap);
    res.json(organizedContents);
  } catch (error) {
    console.error('Error in getCourseContents:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Upload course content
const uploadCourseContent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { 
      module_name, 
      lesson_title, 
      order_number,
      module_order,
      is_preview,
      embed_url,
      file_type 
    } = req.body;

    // Prepare content data
    const contentData = {
      course_id: courseId,
      module_name,
      lesson_title,
      order_number: parseInt(order_number) || 0,
      module_order: parseInt(module_order) || 0,
      is_preview: is_preview === 'true',
    };

    // Handle YouTube video
    if (embed_url) {
      const videoId = embed_url.includes('watch?v=') 
        ? embed_url.split('watch?v=')[1]
        : embed_url.includes('youtu.be/') 
          ? embed_url.split('youtu.be/')[1]
          : embed_url;
          
      // Clean up video ID by removing any extra parameters
      const cleanVideoId = videoId.split('&')[0];
      
      contentData.file_type = 'video';
      contentData.embed_url = `https://www.youtube.com/embed/${cleanVideoId}`;
      contentData.file_url = null;
    }
    // Handle file upload
    else if (req.file) {
      try {
        const fileName = `${courseId}/${Date.now()}-${req.file.originalname}`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from('course-content')
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            cacheControl: '3600'
          });

        if (uploadError) {
          console.error('File upload error:', uploadError);
          return res.status(500).json({ 
            message: 'Failed to upload file',
            details: uploadError.message 
          });
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('course-content')
          .getPublicUrl(fileName);

        contentData.file_url = publicUrl;
        contentData.file_type = req.file.mimetype.includes('video') ? 'video' : 'pdf';
        contentData.embed_url = null; // Clear embed_url for uploaded files
      } catch (uploadError) {
        console.error('Storage error:', uploadError);
        return res.status(500).json({ 
          message: 'Storage error',
          details: uploadError.message 
        });
      }
    }

    // Insert content
    const { data: content, error: contentError } = await supabaseAdmin
      .from('course_contents')
      .insert(contentData)
      .select()
      .single();

    if (contentError) {
      console.error('Content insert error:', contentError);
      return res.status(500).json({ message: 'Failed to create content' });
    }

    res.status(201).json(content);
  } catch (error) {
    console.error('Error in uploadCourseContent:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete course content
const deleteCourseContent = async (req, res) => {
  try {
    const { contentId } = req.params;

    // Get content info first to delete file if exists
    const { data: content, error: fetchError } = await supabaseAdmin
      .from('course_contents')
      .select('file_url, module_id')
      .eq('id', contentId)
      .single();

    if (fetchError) {
      console.error('Error fetching content:', fetchError);
      return res.status(500).json({ message: 'Failed to fetch content' });
    }

    // Delete file from storage if exists
    if (content?.file_url) {
      const filePathMatch = content.file_url.match(/course-content\/(.+)/);
      if (filePathMatch) {
        const filePath = filePathMatch[1];
        await supabaseAdmin.storage
          .from('course-content')
          .remove([filePath]);
      }
    }

    // Delete content record
    const { error: deleteError } = await supabaseAdmin
      .from('course_contents')
      .delete()
      .eq('id', contentId);

    if (deleteError) {
      console.error('Error deleting content:', deleteError);
      return res.status(500).json({ message: 'Failed to delete content' });
    }

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error in deleteCourseContent:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    // Verify admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: "Invalid token" });

    // Get total number of unique students from enrollments
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('enrollments')
      .select('user_id')
      .eq('status', 'active');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return res.status(500).json({ message: "Failed to fetch students" });
    }

    // Get unique student count
    const uniqueStudents = [...new Set(students.map(s => s.user_id))].length;

    // Calculate total revenue from enrollments
    const { data: revenue, error: revenueError } = await supabaseAdmin
      .from('enrollments')
      .select('amount_paid')
      .eq('status', 'active');

    if (revenueError) {
      console.error('Error fetching revenue:', revenueError);
      return res.status(500).json({ message: "Failed to fetch revenue" });
    }

    const totalRevenue = revenue.reduce((sum, item) => sum + (item.amount_paid || 0), 0);

    res.json({
      totalStudents: uniqueStudents,
      totalRevenue: totalRevenue
    });

  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({ message: "Internal server error" });
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
  getDashboardStats
};