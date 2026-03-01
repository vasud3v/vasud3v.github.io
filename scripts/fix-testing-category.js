/**
 * Fix the testing category by setting is_important to false
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTestingCategory() {
  console.log('🔧 Fixing testing category...\n');

  try {
    // Update the testing category to not be important
    const { data, error } = await supabase
      .from('categories')
      .update({ is_important: false })
      .eq('name', 'testing')
      .select();

    if (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }

    if (data && data.length > 0) {
      console.log('✅ Successfully updated testing category!');
      console.log(`   Category: ${data[0].name}`);
      console.log(`   is_important: ${data[0].is_important}`);
      console.log('\n✨ The category should now appear in the Create Thread modal!');
    } else {
      console.log('⚠️  No category named "testing" found.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixTestingCategory();
