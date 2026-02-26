/**
 * Check and fix categories in the database
 * Run with: node scripts/check-and-fix-categories.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixCategories() {
  console.log('🔍 Checking categories...\n');

  // Check existing categories
  const { data: existing, error: fetchError } = await supabase
    .from('categories')
    .select('*')
    .order('is_sticky', { ascending: false })
    .order('sort_order');

  if (fetchError) {
    console.error('❌ Error fetching categories:', fetchError.message);
    return;
  }

  console.log(`Found ${existing?.length || 0} existing categories\n`);

  if (existing && existing.length > 0) {
    console.log('📋 Current categories:');
    console.table(existing.map(c => ({
      id: c.id,
      name: c.name,
      sticky: c.is_sticky ? '📌' : '',
      important: c.is_important ? '⚠️' : '',
      sort: c.sort_order,
      threads: c.thread_count
    })));
  }

  console.log('\n' + '='.repeat(80));
  console.log('📝 INSTRUCTIONS TO FIX:');
  console.log('='.repeat(80));
  console.log('\n1. Go to your Supabase Dashboard');
  console.log('2. Navigate to: SQL Editor');
  console.log('3. Click: New Query');
  console.log('4. Copy and paste the SQL from:');
  console.log('   supabase/migrations/20240121_ensure_sticky_categories.sql');
  console.log('5. Click: Run');
  console.log('\nOR run this SQL directly:\n');
  
  const sql = `
-- Temporarily disable RLS
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Insert sticky categories
INSERT INTO public.categories (id, name, description, icon, thread_count, post_count, last_activity, is_sticky, is_important, sort_order, created_at) VALUES
  ('announcements', '📢 Announcements', 'Official announcements, updates, and important news', 'Newspaper', 0, 0, NOW(), true, true, 1, NOW()),
  ('rules-guidelines', '📋 Rules & Guidelines', 'Forum rules and community guidelines', 'Shield', 0, 0, NOW(), true, true, 2, NOW()),
  ('getting-started', '🚀 Getting Started', 'New member introductions and guides', 'Rocket', 0, 0, NOW(), true, false, 3, NOW()),
  ('general', 'General Discussion', 'Off-topic conversations and community talk', 'MessageSquare', 0, 0, NOW(), false, false, 100, NOW()),
  ('tech-support', 'Technical Support', 'Get help with coding and technical issues', 'Wrench', 0, 0, NOW(), false, false, 101, NOW())
ON CONFLICT (id) DO UPDATE SET
  is_sticky = EXCLUDED.is_sticky,
  is_important = EXCLUDED.is_important,
  sort_order = EXCLUDED.sort_order,
  name = EXCLUDED.name;

-- Re-enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT id, name, is_sticky, is_important, sort_order FROM public.categories ORDER BY is_sticky DESC, sort_order;
`;

  console.log(sql);
  console.log('\n' + '='.repeat(80));
}

checkAndFixCategories().catch(console.error);
