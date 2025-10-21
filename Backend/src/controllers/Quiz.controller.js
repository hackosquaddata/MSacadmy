import { connectSupabase, connectSupabaseAdmin } from '../db/supabaseClient.js';

const supabase = connectSupabase();
const supabaseAdmin = connectSupabaseAdmin();

// Get quiz for a content
export const getQuiz = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { data, error } = await supabaseAdmin
      .from('course_contents')
      .select('id, lesson_title, quiz')
      .eq('id', contentId)
      .single();

    if (error) {
      console.error('Quiz fetch error:', error);
      return res.status(500).json({ message: 'Failed to fetch quiz' });
    }
    if (!data || !data.quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Do not leak correct answers
    const safe = {
      id: data.id,
      title: data.lesson_title,
      questions: (data.quiz?.questions || []).map(q => ({
        id: q.id,
        text: q.text,
        options: q.options,
        type: q.type || 'single'
      })),
      meta: data.quiz?.meta || {}
    };
    res.json(safe);
  } catch (e) {
    console.error('Error in getQuiz:', e);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Submit quiz answers
export const submitQuiz = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { answers } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ message: 'Invalid token' });

    const { data: content, error } = await supabaseAdmin
      .from('course_contents')
      .select('id, quiz, course_id')
      .eq('id', contentId)
      .single();

    if (error) {
      console.error('Quiz fetch error:', error);
      return res.status(500).json({ message: 'Failed to fetch quiz' });
    }
    if (!content || !content.quiz) return res.status(404).json({ message: 'Quiz not found' });

    // Evaluate
    const questions = content.quiz.questions || [];
    let correct = 0;
    const details = [];
    for (const q of questions) {
      const userAns = answers?.[q.id];
      const correctAns = q.answer;
      const isCorrect = JSON.stringify(userAns) === JSON.stringify(correctAns);
      if (isCorrect) correct += 1;
      details.push({ id: q.id, correct: isCorrect });
    }
    const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;

    // Mark as completed if pass threshold (default 70)
    const passMark = content.quiz?.meta?.passMark ?? 70;
    const completed = score >= passMark;

    await supabaseAdmin
      .from('course_progress')
      .upsert({ user_id: user.id, content_id: contentId, completed, watch_time: 0 }, { onConflict: 'user_id,content_id' })
      .select();

    res.json({ score, correct, total: questions.length, details, completed });
  } catch (e) {
    console.error('Error in submitQuiz:', e);
    res.status(500).json({ message: 'Internal server error' });
  }
};
