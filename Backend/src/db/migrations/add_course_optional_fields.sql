-- Adds optional fields used by the app. Run in Supabase SQL editor.
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS certification_preview text,
ADD COLUMN IF NOT EXISTS instructors text[];

-- Optionally ensure objectives/prerequisites types if needed
-- ALTER TABLE public.courses ALTER COLUMN objectives TYPE text[] USING objectives::text[];
-- ALTER TABLE public.courses ALTER COLUMN prerequisites TYPE text[] USING prerequisites::text[];
