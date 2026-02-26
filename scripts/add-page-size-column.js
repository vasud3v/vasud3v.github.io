// Simple script to display the SQL needed to add page_size column
// Run with: node scripts/add-page-size-column.js

console.log('🔄 Adding page_size column to profile_customizations table...\n');
console.log('⚠️  Please run the following SQL in your Supabase SQL Editor:\n');
console.log('---SQL START---');
console.log(`
-- Add page_size column to profile_customizations table
ALTER TABLE public.profile_customizations
ADD COLUMN IF NOT EXISTS page_size INTEGER DEFAULT 8;

-- Add check constraint to ensure page_size is valid
ALTER TABLE public.profile_customizations
DROP CONSTRAINT IF EXISTS page_size_valid;

ALTER TABLE public.profile_customizations
ADD CONSTRAINT page_size_valid CHECK (page_size IN (4, 8, 12, 16, 20, 24));
`);
console.log('---SQL END---\n');
console.log('📝 Or copy from: supabase/migrations/20240104_add_page_size_to_profile_customizations.sql\n');
console.log('✅ After running the SQL, restart your dev server to pick up the changes.');

