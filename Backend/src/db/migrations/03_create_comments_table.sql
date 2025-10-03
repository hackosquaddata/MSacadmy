CREATE TABLE public.lesson_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id uuid REFERENCES course_contents(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments for lessons they have access to" ON public.lesson_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN course_contents cc ON cc.course_id = e.course_id
            WHERE cc.id = lesson_comments.lesson_id
            AND e.user_id = auth.uid()
            AND e.status = 'active'
        )
    );

CREATE POLICY "Users can create comments for lessons they have access to" ON public.lesson_comments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN course_contents cc ON cc.course_id = e.course_id
            WHERE cc.id = lesson_comments.lesson_id
            AND e.user_id = auth.uid()
            AND e.status = 'active'
        )
    );