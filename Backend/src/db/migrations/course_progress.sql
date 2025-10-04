-- Drop the table if it exists (this will automatically drop associated policies)
DROP TABLE IF EXISTS course_progress CASCADE;

-- Create the course_progress table
CREATE TABLE course_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id UUID NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    watch_time INTEGER DEFAULT 0, -- For video content, tracks time watched in seconds
    last_position INTEGER DEFAULT 0, -- For video content, tracks last position in seconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_progress_updated_at
    BEFORE UPDATE ON course_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own progress"
ON course_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their ownn progress"
ON course_progress
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON course_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all progress"
ON course_progress
FOR ALL
USING (
    auth.uid() IN (
        SELECT id FROM auth.users
        WHERE (raw_user_meta_data->>'is_admin')::boolean = true
    )
);

-- Create indexes for better performance
CREATE INDEX idx_course_progress_user_id ON course_progress(user_id);
CREATE INDEX idx_course_progress_content_id ON course_progress(content_id);
CREATE INDEX idx_course_progress_user_content ON course_progress(user_id, content_id);