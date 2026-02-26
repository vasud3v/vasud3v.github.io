-- Add page_size column to profile_customizations table
-- Requirements: 14.3 - Persist page size preference to Supabase

ALTER TABLE public.profile_customizations
ADD COLUMN IF NOT EXISTS page_size INTEGER DEFAULT 8;

-- Add check constraint to ensure page_size is valid
ALTER TABLE public.profile_customizations
ADD CONSTRAINT page_size_valid CHECK (page_size IN (4, 8, 12, 16, 20, 24));
