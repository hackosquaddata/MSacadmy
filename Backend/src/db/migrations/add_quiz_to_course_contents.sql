-- Adds a JSONB column to store MCQ quizzes for course contents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'course_contents' AND column_name = 'quiz'
  ) THEN
    ALTER TABLE course_contents
    ADD COLUMN quiz JSONB;
  END IF;
END $$;
