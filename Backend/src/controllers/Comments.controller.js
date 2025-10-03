import { connectSupabase, connectSupabaseAdmin } from '../db/supabaseClient.js';

const supabase = connectSupabase();
const supabaseAdmin = connectSupabaseAdmin();

// Get comments for a content
const getContentComments = async (req, res) => {
  try {
    const { contentId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: "Invalid token" });

    // Fetch comments
    const { data: comments, error: commentsError } = await supabaseAdmin
      .from('lesson_comments')
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user:user_id (
          id,
          email,
          full_name
        )
      `)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
      return res.status(500).json({ message: "Failed to fetch comments" });
    }

    res.json(comments);
  } catch (error) {
    console.error('Error in getContentComments:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create a new comment
const createComment = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { content } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Unauthorized" });
    if (!content?.trim()) return res.status(400).json({ message: "Comment content is required" });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: "Invalid token" });

    // Insert comment
    const { data: comment, error: commentError } = await supabaseAdmin
      .from('lesson_comments')
      .insert([{
        content_id: contentId,
        user_id: user.id,
        content: content.trim()
      }])
      .select(`
        id,
        content,
        created_at,
        updated_at,
        user:user_id (
          id,
          email,
          full_name
        )
      `)
      .single();

    if (commentError) {
      console.error('Error creating comment:', commentError);
      return res.status(500).json({ message: "Failed to create comment" });
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error in createComment:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { getContentComments, createComment };
