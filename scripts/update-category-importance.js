/**
 * Update category to set is_important to false
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

async function updateCategory() {
  console.log('🔧 Updating category...\n');

  try {
    const categoryId = 'cat-1772393286633-b85du2';
    
    console.log(`Updating category ${categoryId}...`);
    
    const { data, error } = await supabase
      .from('categories')
      .update({ is_important: false })
      .eq('id', categoryId)
      .select();

    if (error) {
      console.error('❌ Error updating:', error);
      process.exit(1);
    }

    console.log('✅ Update result:', data);

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
      process.exit(1);
    }

    console.log('\n📊 Verified category data:');
    console.log(`   Name: ${verifyData.name}`);
    console.log(`   is_important: ${verifyData.is_important}`);
    console.log(`   is_sticky: ${verifyData.is_sticky}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateCategory();
