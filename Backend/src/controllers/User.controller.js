import { connectSupabase, connectSupabaseAdmin } from '../db/supabaseClient.js';

const supabase = connectSupabase();
const supabaseAdmin = connectSupabaseAdmin();

const signupUser = async (req, res) => {
  try {
    const { email, password, full_name, is_admin = false } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "Missing email, password, or full_name" });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, is_admin },
      },
    });

    if (error) return res.status(400).json({ error: error.message });

    // Insert user into your "users" table with the same UID
    const { error: dbError } = await supabase.from("users").insert([
      {
        id: data.user.id,
        email,
        full_name,
        is_admin,
      },
    ]);

    if (dbError) return res.status(500).json({ error: dbError.message });

    return res.status(200).json({ message: "User signed up", user: data.user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({ message: error.message });
    }

    if (!data.session || !data.session.access_token) {
      return res.status(401).json({ message: "Login failed - No session created" });
    }

    // Return the structured response
    res.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role
      },
      message: "Login successful"
    });

  } catch (err) {
    console.error('Server error during login:', err);
    res.status(500).json({ message: "An error occurred during login" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: "Unauthorized" });

    const { data: userData, error: dbError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (dbError) return res.status(500).json({ error: dbError.message });

    return res.status(200).json({ user: userData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCourse = async (req,res)=>{

  try {
    const {error,data}=await supabase.from("courses").select("*");

    if(error) return res.status(400).json({error:error.message});

    res.status(200).json(data)
  }
   catch (error) {
    
    res.status(500).json({error:"server error"})
  }

}

const checkCourseAccess = async (req, res) => {
  console.log('Starting course access check');
  try {
    const { courseId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];
    console.log('Course ID:', courseId);

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user from token
    let user;
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error) throw error;
      user = data.user;
      console.log('User authenticated:', user.id);
    } catch (authError) {
      console.error('Auth error:', authError);
      return res.status(401).json({ message: "Invalid token" });
    }

    if (!user) {
      console.log('No user found');
      return res.status(401).json({ message: "No user found" });
    }

    // Check enrollment first
    console.log('Checking enrollment');
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('id, status, created_at')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .single();

    if (enrollmentError) {
      console.error('Enrollment error:', enrollmentError);
      if (enrollmentError.code === 'PGRST116') {
        return res.status(403).json({ message: "Not enrolled in this course" });
      }
      throw enrollmentError;
    }

    if (!enrollment) {
      console.log('No active enrollment found');
      return res.status(403).json({ message: "Not enrolled in this course" });
    }

    console.log('Enrollment verified:', enrollment.id);

      // Now fetch course and content
      const { data: course, error: courseError } = await supabaseAdmin
        .from('courses')
        .select('id, title, description, thumbnail, price')
        .eq('id', courseId)
        .single();

      if (courseError) {
        console.error('Course fetch error:', courseError);
        throw courseError;
      }

      if (!course) {
        console.log('Course not found');
        return res.status(404).json({ message: "Course not found" });
      }

      // Fetch course content
      const { data: courseContent, error: contentError } = await supabaseAdmin
        .from('course_contents')
        .select('*')
        .eq('course_id', courseId)
        .order('order_number');

      if (contentError) {
        console.error('Content fetch error:', contentError);
        throw contentError;
      }

      console.log('Course content fetched successfully');      // Organize content
      const organizedContent = (course.modules || [])
        .sort((a, b) => (a.order_number || 0) - (b.order_number || 0))
        .map(module => ({
          id: module.id,
          title: module.title,
          description: module.description,
          order: module.order_number || 0,
          lessons: (module.lessons || [])
            .sort((a, b) => (a.order_number || 0) - (b.order_number || 0))
            .map(lesson => ({
              id: lesson.id,
              title: lesson.title,
              description: lesson.description,
              type: lesson.type,
              url: lesson.content_url,
              order: lesson.order_number || 0
            }))
        }));

      // Send response
      res.json({
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          price: course.price
        },
        content: courseContent || [],
        enrollment: {
          id: enrollment.id,
          status: enrollment.status,
          enrolledAt: enrollment.created_at
        }
      });

    } catch (error) {
      console.error('Error in course content fetch:', error);
      res.status(500).json({ message: "Failed to fetch course content" });
    }
};




const getEnrolledCourses = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ message: "Invalid token" });
    }

    console.log('Fetching enrolled courses for user:', user.id);
    
    // First get enrolled courses
    const { data: enrolledCourses, error: enrolledError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        status,
        course_id,
        course:courses (id, title, description, thumbnail, price)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (enrolledError) {
      console.error('Error fetching enrolled courses:', enrolledError);
      return res.status(500).json({ message: 'Failed to fetch enrolled courses', error: enrolledError });
    }

    if (!enrolledCourses?.length) {
      return res.json([]);
    }

    // Fetch course contents for each enrolled course
    const coursesWithContent = await Promise.all(
      enrolledCourses.map(async (enrollment) => {
        // Get course contents
        const { data: contents, error: contentsError } = await supabaseAdmin
          .from('course_contents')
          .select('*')
          .eq('course_id', enrollment.course_id)
          .order('order_number');

        if (contentsError) {
          console.error('Error fetching course contents:', contentsError);
          throw contentsError;
        }

        return {
          id: enrollment.course.id,
          title: enrollment.course.title,
          description: enrollment.course.description,
          thumbnail: enrollment.course.thumbnail,
          price: enrollment.course.price,
          contents: contents || [],
          enrollment: {
            id: enrollment.id,
            status: enrollment.status
          }
        };
      })
    ).catch(error => {
      console.error('Error processing courses:', error);
      throw error;
    });

    if (enrolledError) {
      console.error('Error fetching enrolled courses:', enrolledError);
      return res.status(500).json({ message: 'Failed to fetch enrolled courses' });
    }

    if (!enrolledCourses) {
      return res.json([]);
    }

    // Transform and clean up the data
    const formattedCourses = enrolledCourses.map(enrollment => {
      const course = enrollment.courses;
      if (!course) return null;

      // Calculate progress
      let totalLessons = 0;
      let completedLessons = 0;

      if (course.modules) {
        course.modules.forEach(module => {
          if (module.lessons) {
            module.lessons.forEach(lesson => {
              totalLessons++;
              if (lesson.completed) {
                completedLessons++;
              }
            });
          }
        });
      }

      const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      // Sort modules and lessons by order_number
      if (course.modules) {
        course.modules.sort((a, b) => (a.order_number || 0) - (b.order_number || 0));
        course.modules.forEach(module => {
          if (module.lessons) {
            module.lessons.sort((a, b) => (a.order_number || 0) - (b.order_number || 0));
          }
        });
      }

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        progress: progress,
        modules: course.modules || []
      };
    }).filter(Boolean); // Remove any null entries

    // Calculate progress and prepare final response
    const coursesWithProgress = coursesWithContent.map(course => {
      const totalContent = course.contents?.length || 0;
      const completedContent = course.contents?.filter(item => item.completed)?.length || 0;
      
      return {
        ...course,
        progress: totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0
      };
    });

    console.log('Sending response with', coursesWithProgress.length, 'courses');
    res.json(coursesWithProgress);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export { signupUser, loginUser, getCurrentUser, getCourse,checkCourseAccess,getEnrolledCourses };