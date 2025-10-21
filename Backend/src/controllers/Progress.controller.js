import { connectSupabase, connectSupabaseAdmin } from '../db/supabaseClient.js';

const supabase = connectSupabase();
const supabaseAdmin = connectSupabaseAdmin();

// Get progress for a course
const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: "Invalid token" });

    // Get all content IDs for the course
    const { data: courseContents, error: contentsError } = await supabaseAdmin
      .from('course_contents')
      .select('*')
      .eq('course_id', courseId)
      .order('order_number');

    if (contentsError) {
      console.error('Error fetching course contents:', contentsError);
      return res.status(500).json({ message: "Failed to fetch course contents" });
    }

    // Get progress for this user and course
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('course_progress')
      .select('*')
      .eq('user_id', user.id)
      .in('content_id', courseContents.map(content => content.id));

    if (progressError) {
      console.error('Error fetching progress:', progressError);
      return res.status(500).json({ message: "Failed to fetch progress" });
    }

    // Calculate progress
    const totalContents = courseContents.length;
    const completedContents = progress.filter(p => p.completed).length;
    const overallProgress = totalContents > 0 ? (completedContents / totalContents) * 100 : 0;

    // Create a map of content progress
    const contentProgress = progress.reduce((acc, p) => {
      acc[p.content_id] = {
        completed: p.completed,
        watch_time: p.watch_time || 0,
        last_position: p.last_position || 0
      };
      return acc;
    }, {});

    res.json({
      total: totalContents,
      completed: completedContents,
      progress: Math.round(overallProgress),
      contentProgress,
      contents: courseContents
    });

  } catch (error) {
    console.error('Error in getCourseProgress:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update progress for a content
const updateProgress = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { completed, watchTime } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: "Invalid token" });

    // Upsert progress without last_watched_at
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('course_progress')
      .upsert({
        user_id: user.id,
        content_id: contentId,
        completed: completed ?? false,
        watch_time: watchTime ?? 0
      }, { onConflict: 'user_id,content_id' })
      .select()
      .single();

    if (progressError) {
      console.error('Error updating progress:', progressError);
      return res.status(500).json({ message: "Failed to update progress" });
    }

    res.json(progress);
  } catch (error) {
    console.error('Error in updateProgress:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { getCourseProgress, updateProgress };