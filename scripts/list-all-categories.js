/**
 * List all categories and their properties
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listCategories() {
  console.log('📋 Listing all categories...\n');

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }

    if (data && data.length > 0) {
      console.log(`Found ${data.length} categories:\n`);
      data.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name}`);
        console.log(`   ID: ${cat.id}`);
        console.log(`   Description: ${cat.description}`);
        console.log(`   is_important: ${cat.is_important}`);
        console.log(`   is_sticky: ${cat.is_sticky}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No categories found.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listCategories();
