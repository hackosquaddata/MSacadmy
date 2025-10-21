import { connectSupabase, connectSupabaseAdmin } from "../db/supabaseClient.js";
import multer from "multer";

const supabase = connectSupabase();
const supabaseAdmin = connectSupabaseAdmin();

const storage = multer.memoryStorage();
// Allow only expected mimetypes and cap file size (200MB)
const allowedTypes = new Set([
  'image/jpeg', 'image/png', 'image/webp',
  'video/mp4', 'video/webm', 'video/ogg',
  'application/pdf'
]);
export const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype) return cb(null, false);
    if (allowedTypes.has(file.mimetype) || file.mimetype.startsWith('video/')) return cb(null, true);
    return cb(new Error('Unsupported file type'));
  }
});

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

    // Verify if user is admin (use service-role client to bypass RLS)
    const { data: userRecord, error: userError } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (userError || !userRecord?.is_admin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

  const { title, description, price, category, prerequisites, objectives, duration, instructors } = req.body;
    // Using upload.fields in routes, files are in req.files
    const thumbnailFile = req.files?.thumbnail?.[0];
    const certPreviewFile = req.files?.certification_preview?.[0];

    if (!title || !price || !description || !category) {
      return res.status(400).json({ message: "Title, price, description and category are required" });
    }

  let thumbnailUrl = null;
  let certPreviewUrl = null;

    if (thumbnailFile) {
  const bucket = 'course-thumbnails';
      const fileExt = thumbnailFile.originalname.split('.').pop();
      const fileName = `${bucket}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Try upload, and create bucket if missing then retry once
      const tryUpload = async () => {
        const { error } = await supabaseAdmin.storage
          .from(bucket)
          .upload(fileName, thumbnailFile.buffer, {
            contentType: thumbnailFile.mimetype,
            upsert: false,
          });
        return { error };
      };

      let { error: uploadError } = await tryUpload();
      if (uploadError) {
        const msg = uploadError?.message || '';
        if (/not found|does not exist|No such file or directory/i.test(msg)) {
          try {
            // Create public bucket then retry
            await supabaseAdmin.storage.createBucket(bucket, { public: true });
            ({ error: uploadError } = await tryUpload());
          } catch (e) {
            console.error('Bucket creation failed:', e);
          }
        }
      }

      if (uploadError) {
        console.error('Thumbnail upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload thumbnail', details: uploadError.message });
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(fileName);
      thumbnailUrl = publicUrlData.publicUrl;
    }
    // If no thumbnail uploaded, use a safe default to satisfy NOT NULL schema
    if (!thumbnailUrl) {
      thumbnailUrl = 'https://placehold.co/600x400?text=Course';
    }

    // Optional certification preview upload
    if (certPreviewFile) {
      const bucket = 'course-certifications';
      const fileExt = certPreviewFile.originalname.split('.').pop();
      const fileName = `${bucket}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const tryUpload = async () => {
        const { error } = await supabaseAdmin.storage
          .from(bucket)
          .upload(fileName, certPreviewFile.buffer, {
            contentType: certPreviewFile.mimetype,
            upsert: false,
          });
        return { error };
      };

      let { error: uploadError } = await tryUpload();
      if (uploadError) {
        const msg = uploadError?.message || '';
        if (/not found|does not exist|No such file or directory/i.test(msg)) {
          try {
            await supabaseAdmin.storage.createBucket(bucket, { public: true });
            ({ error: uploadError } = await tryUpload());
          } catch (e) {
            console.error('Bucket creation failed (cert):', e);
          }
        }
      }

      if (uploadError) {
        console.error('Certification preview upload error:', uploadError);
      } else {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from(bucket)
          .getPublicUrl(fileName);
        certPreviewUrl = publicUrlData.publicUrl;
      }
    }

    // Normalize prerequisites: store as text to match current schema (NOT NULL text)
    let prerequisitesValue = '';
    try {
      if (typeof prerequisites === 'string') prerequisitesValue = prerequisites.trim();
      else if (Array.isArray(prerequisites)) prerequisitesValue = prerequisites.filter(Boolean).join(', ');
    } catch (e) { prerequisitesValue = ''; }

  let parsedObjectives = [];
    try {
      if (typeof objectives === 'string' && objectives.trim()) parsedObjectives = JSON.parse(objectives);
      else if (Array.isArray(objectives)) parsedObjectives = objectives;
    } catch (e) {
      parsedObjectives = [];
    }

    // Normalize instructors to array of strings if provided
    let parsedInstructors = null;
    try {
      if (typeof instructors === 'string' && instructors.trim()) {
        // Either JSON array string or single value comma-separated
        try {
          const maybeJson = JSON.parse(instructors);
          parsedInstructors = Array.isArray(maybeJson) ? maybeJson : [String(maybeJson)];
        } catch {
          parsedInstructors = instructors.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (Array.isArray(instructors)) {
        parsedInstructors = instructors;
      }
    } catch (e) {
      parsedInstructors = null;
    }

    // Create course with actual user ID
    let insertPayload = {
          title,
          description: description || null,
          price: parseFloat(price),
          category: category || null,
      prerequisites: prerequisitesValue || '',
          objectives: parsedObjectives,
          thumbnail: thumbnailUrl,
          certification_preview: certPreviewUrl || null,
          instructors: parsedInstructors,
          created_by: user.id, // Use actual user ID instead of DUMMY_USER_ID
          status: 'active'
        };
    let { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .insert([ insertPayload ])
      .select()
      .single();

    if (courseError) {
      // Retry without optional columns if schema doesn't have them
      const msg = courseError?.message || '';
      const code = courseError?.code || '';
      const isUndefinedColumn = code === '42703' || /undefined column|column .* does not exist/i.test(msg);
      if (isUndefinedColumn) {
        const minimal = { ...insertPayload };
        delete minimal.certification_preview;
        delete minimal.instructors;
        delete minimal.duration;
        ({ data: course, error: courseError } = await supabaseAdmin
          .from('courses')
          .insert([ minimal ])
          .select()
          .single());
      }
    }

    if (courseError) {
      console.error("Course creation error:", courseError);
      return res.status(500).json({
        message: "Failed to create course",
        details: courseError?.message || courseError
      });
    }

    res.status(201).json({
      message: "Course created successfully",
      course
    });

  } catch (err) {
    console.error("Course creation error:", err);
    res.status(500).json({
      message: "Internal server error",
      details: err?.message
    });
  }
};

// Delete a course
const deleteCourse = async (req, res) => {
  try {
    // Debug: show masked Authorization header for troubleshooting
    const authHeader = req.headers.authorization;
    console.log('DELETE /api/admin/courses/:id - Authorization header:', authHeader ? `${authHeader.substring(0, 20)}...` : authHeader);

    const token = authHeader?.split(" ")[1];
    if (!token) {
      console.warn('Unauthorized: No token provided in Authorization header');
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const { data: getUserData, error: authError } = await supabase.auth.getUser(token);
    console.log('supabase.auth.getUser result:', { user: getUserData?.user ? { id: getUserData.user.id, email: getUserData.user.email } : null, authError });

    const user = getUserData?.user;
    if (authError || !user) {
      console.warn('Unauthorized: supabase.auth.getUser failed or returned no user', authError);
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    // Fetch full user record using admin client (bypass RLS)
    const { data: userRecord } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!userRecord?.is_admin) {
      console.warn('Forbidden: user is not admin in users table', { authUserId: user.id, userRecord });
      return res.status(403).json({ message: "Forbidden - Admin access required. Check users table is_admin for this user." });
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

    // Use admin client to read users table for edit permissions
    const { data: userRecord } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!userRecord?.is_admin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    const { id } = req.params;
  const { title, description, price, category, prerequisites, objectives, duration, instructors } = req.body;
    const thumbnailFile = req.files?.thumbnail?.[0];
    const certPreviewFile = req.files?.certification_preview?.[0];

    // Validate required fields: require at minimum title, price, description, category
    if (!title || !price || !description || !category) {
      return res.status(400).json({ message: "Title, price, description and category are required" });
    }

    // Normalize prerequisites as text for current schema
    let prerequisitesValue = '';
    try {
      if (typeof prerequisites === 'string') prerequisitesValue = prerequisites.trim();
      else if (Array.isArray(prerequisites)) prerequisitesValue = prerequisites.filter(Boolean).join(', ');
    } catch (e) { prerequisitesValue = ''; }

    let parsedObjectives = [];
    try {
      if (typeof objectives === 'string' && objectives.trim()) parsedObjectives = JSON.parse(objectives);
      else if (Array.isArray(objectives)) parsedObjectives = objectives;
    } catch (e) {
      parsedObjectives = [];
    }

    let updates = {
      title,
      description,
      price: Number(price),
      category,
      prerequisites: prerequisitesValue,
      objectives: parsedObjectives,
      // duration omitted; column may not exist in current schema
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

    // If new certification preview provided, upload
    if (certPreviewFile) {
      const fileExt = certPreviewFile.originalname.split(".").pop();
      const fileName = `certifications/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("course-certifications")
        .upload(fileName, certPreviewFile.buffer, {
          contentType: certPreviewFile.mimetype,
          upsert: false
        });
      if (!uploadError) {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from("course-certifications")
          .getPublicUrl(fileName);
        updates.certification_preview = publicUrlData.publicUrl;
      }
    }

    // Instructors
    if (typeof instructors !== 'undefined') {
      try {
        let parsed = null;
        if (typeof instructors === 'string' && instructors.trim()) {
          try { parsed = JSON.parse(instructors); }
          catch { parsed = instructors.split(',').map(s => s.trim()).filter(Boolean); }
        } else if (Array.isArray(instructors)) parsed = instructors;
        updates.instructors = parsed;
      } catch {}
    }

    let { data, error } = await supabaseAdmin
      .from("courses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      // Retry without optional columns if undefined_column
      const msg = error?.message || '';
      const code = error?.code || '';
      const isUndefinedColumn = code === '42703' || /undefined column|column .* does not exist/i.test(msg);
      if (isUndefinedColumn) {
        const minimal = { ...updates };
        delete minimal.certification_preview;
        delete minimal.instructors;
        delete minimal.duration;
        ({ data, error } = await supabaseAdmin
          .from('courses')
          .update(minimal)
          .eq('id', id)
          .select()
          .single());
      }
    }
    if (error) {
      console.error('Course update DB error:', error);
      return res.status(400).json({ error: error.message, details: process.env.NODE_ENV === 'development' ? error : undefined });
    }
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
    // Admin auth check
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: 'Invalid token' });
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!userRecord?.is_admin) return res.status(403).json({ message: 'Forbidden' });
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

  // Handle Dailymotion video
  if (embed_url) {
      let idCandidate = embed_url.trim();
      try {
        if (/dailymotion\.com\/video\//i.test(embed_url)) {
          // e.g., https://www.dailymotion.com/video/x7u5g4_example?param=1
          const after = embed_url.split('/video/')[1] || '';
          idCandidate = after.split(/[\?_]/)[0];
        } else if (/dai\.ly\//i.test(embed_url)) {
          // e.g., https://dai.ly/x7u5g4
          const after = embed_url.split('dai.ly/')[1] || '';
          idCandidate = after.split(/[\?]/)[0];
        }
        // else: if it's already an ID, keep as-is
      } catch {}

      // Build Dailymotion embed URL
      const cleanId = (idCandidate || '').replace(/[^a-zA-Z0-9]/g, '');
      contentData.file_type = 'video';
      contentData.embed_url = `https://www.dailymotion.com/embed/video/${cleanId}`;
      contentData.file_url = null;
    }
    // Handle MCQ Quiz JSON (no file)
    else if (req.body && req.body.quiz) {
      try {
        const quizJson = typeof req.body.quiz === 'string' ? JSON.parse(req.body.quiz) : req.body.quiz;
        contentData.file_type = 'quiz';
        contentData.quiz = quizJson;
        contentData.embed_url = null;
        contentData.file_url = null;
      } catch (e) {
        console.error('Invalid quiz JSON payload:', e);
        return res.status(400).json({ message: 'Invalid quiz payload' });
      }
    }
    // Handle file upload
    else if (req.file) {
      try {
        const safeName = String(req.file.originalname || 'file')
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .slice(0, 100);
        const fileName = `${courseId}/${Date.now()}-${safeName}`;
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
    } else {
      return res.status(400).json({ message: 'No content provided (video URL, quiz, or file required)' });
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
    // Admin auth check
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: 'Invalid token' });
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!userRecord?.is_admin) return res.status(403).json({ message: 'Forbidden' });
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
    // Admin auth check
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: 'Invalid token' });
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!userRecord?.is_admin) return res.status(403).json({ message: 'Forbidden' });

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

export { listEnrollmentsByCourse, revokeEnrollment };

// List enrollments for a specific course (admin)
const listEnrollmentsByCourse = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: 'Invalid token' });

    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userRecord?.is_admin) return res.status(403).json({ message: 'Forbidden' });

    const { courseId } = req.params;

    // Preferred: use FK relationships if present
    let { data, error } = await supabaseAdmin
      .from('enrollments')
      .select('id, user_id, status, created_at, courses(id,title,thumbnail), users(id,full_name,email)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Enrollments join failed, falling back to manual enrichment:', error?.message || error);
      // Fallback: fetch base enrollments, then hydrate user and course info
      const { data: base, error: baseErr } = await supabaseAdmin
        .from('enrollments')
        .select('id, user_id, status, created_at, course_id')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });
      if (baseErr) {
        console.error('Base enrollments fetch error:', baseErr);
        return res.status(500).json({ message: 'Failed to fetch enrollments' });
      }

      // Fetch course once
      let course = null;
      const { data: courseRow } = await supabaseAdmin
        .from('courses')
        .select('id,title,thumbnail')
        .eq('id', courseId)
        .single();
      if (courseRow) course = courseRow;

      // Fetch user records in batch
      const userIds = Array.from(new Set((base || []).map(r => r.user_id).filter(Boolean)));
      let usersMap = new Map();
      if (userIds.length) {
        const { data: usersRows } = await supabaseAdmin
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);
        if (usersRows) {
          for (const u of usersRows) usersMap.set(u.id, u);
        }
      }

      data = (base || []).map(r => ({
        id: r.id,
        user_id: r.user_id,
        status: r.status,
        created_at: r.created_at,
        courses: course ? { id: course.id, title: course.title, thumbnail: course.thumbnail } : null,
        users: usersMap.get(r.user_id) || null,
      }));
    }

    // Normalize keys to match frontend expectations (en.user and en.course)
    const normalized = (data || []).map(row => ({
      id: row.id,
      user_id: row.user_id,
      status: row.status,
      created_at: row.created_at,
      user: row.user || row.users || null,
      course: row.course || row.courses || null,
    }));

    res.json(normalized);
  } catch (err) {
    console.error('listEnrollmentsByCourse error:', err);
    res.status(500).json({ message: 'Failed to fetch enrollments' });
  }
};

// Revoke (delete) an enrollment by ID (admin)
const revokeEnrollment = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: 'Invalid token' });

    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userRecord?.is_admin) return res.status(403).json({ message: 'Forbidden' });

    const { enrollmentId } = req.params;
    const { error } = await supabaseAdmin
      .from('enrollments')
      .delete()
      .eq('id', enrollmentId);

    if (error) return res.status(500).json({ message: 'Failed to revoke enrollment' });
    res.json({ message: 'Enrollment revoked' });
  } catch (err) {
    console.error('revokeEnrollment error:', err);
    res.status(500).json({ message: 'Failed to revoke enrollment' });
  }
};