/**
 * Script to add sticky and important categories to the forum
 * Run with: node scripts/add-sticky-categories.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addStickyCategories() {
  console.log('🚀 Adding sticky and important categories...\n');

  const categories = [
    {
      id: 'announcements',
      name: 'Announcements',
      description: 'Official announcements, updates, and important news from the team',
      icon: 'Newspaper',
      is_sticky: true,
      is_important: true,
      sort_order: 1,
    },
    {
      id: 'rules-guidelines',
      name: 'Rules & Guidelines',
      description: 'Forum rules, community guidelines, and best practices',
      icon: 'Shield',
      is_sticky: true,
      is_important: false,
      sort_order: 2,
    },
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'New to the forum? Start here for introductions and helpful guides',
      icon: 'Rocket',
      is_sticky: true,
      is_important: false,
      sort_order: 3,
    },
  ];

  for (const category of categories) {
    console.log(`📌 Processing: ${category.name}`);
    
    const { data, error } = await supabase
      .from('categories')
      .upsert(
        {
          ...category,
          thread_count: 0,
          post_count: 0,
          last_activity: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select();

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ✅ ${category.is_important ? 'Important & ' : ''}Sticky category added/updated`);
    }
  }

  // Update sort order for non-sticky categories
  console.log('\n📊 Updating sort order for other categories...');
  const { error: updateError } = await supabase
    .from('categories')
    .update({ sort_order: 100 })
    .not('id', 'in', `(${categories.map(c => `'${c.id}'`).join(',')})`)
    .lt('sort_order', 100);

  if (updateError) {
    console.error(`   ❌ Error: ${updateError.message}`);
  } else {
    console.log('   ✅ Sort order updated');
  }

  // Verify the changes
  console.log('\n📋 Current categories:');
  const { data: allCategories, error: fetchError } = await supabase
    .from('categories')
    .select('id, name, is_sticky, is_important, sort_order')
    .order('is_sticky', { ascending: false })
    .order('is_important', { ascending: false })
    .order('sort_order');

  if (fetchError) {
    console.error(`   ❌ Error: ${fetchError.message}`);
  } else {
    console.table(allCategories);
  }

  console.log('\n✨ Done! Refresh your forum to see the changes.');
}

addStickyCategories().catch(console.error);
