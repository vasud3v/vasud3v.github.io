/**
 * Apply Follow and Messaging System Fix
 * 
 * This script applies the database migration for the follow and messaging system.
 * It reads the SQL file and executes it against your Supabase database.
 * 
 * Usage:
 *   node scripts/apply-follow-messaging-fix.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🚀 Starting Follow and Messaging System Migration...\n');

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, '..', 'supabase', 'scripts', 'APPLY_FOLLOW_MESSAGING_FIX.sql');
    console.log('📖 Reading SQL file:', sqlPath);
    const sql = readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements (rough split, may need refinement)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === ';') {
        continue;
      }

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist')) {
            console.log(`⚠️  Warning: ${error.message.substring(0, 100)}...`);
          } else {
            console.error(`❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully executed: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`⚠️  Errors encountered: ${errorCount} statements`);
    }
    console.log('='.repeat(60) + '\n');

    // Verify tables were created
    console.log('🔍 Verifying tables...\n');
    await verifyTables();

    console.log('\n✨ Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Test the follow button on user profiles');
    console.log('2. Test sending messages between users');
    console.log('3. Check /follow-requests page');
    console.log('4. Verify real-time updates work\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nPlease apply the SQL manually via Supabase Dashboard:');
    console.error('1. Go to SQL Editor in Supabase Dashboard');
    console.error('2. Copy contents of supabase/scripts/APPLY_FOLLOW_MESSAGING_FIX.sql');
    console.error('3. Paste and run in SQL Editor\n');
    process.exit(1);
  }
}

async function verifyTables() {
  const tables = ['user_follows', 'conversations', 'conversation_participants', 'messages'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Table '${table}': NOT FOUND`);
      } else {
        console.log(`✅ Table '${table}': EXISTS (${count || 0} rows)`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ERROR - ${err.message}`);
    }
  }
}

// Run the migration
applyMigration();
