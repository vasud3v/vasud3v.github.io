#!/usr/bin/env node

/**
 * Clear Seed Data Script
 * 
 * This script clears all dummy/seed data from your Supabase database.
 * 
 * Usage:
 *   node scripts/clear-seed-data.js
 * 
 * Or add to package.json:
 *   "clear-seed": "node scripts/clear-seed-data.js"
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧹 Clear Seed Data Script\n');
console.log('This script will help you remove all dummy data from your Supabase database.\n');

const migrationPath = join(__dirname, '../supabase/migrations/20240103_clear_seed_data.sql');

if (!existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  process.exit(1);
}

const sqlContent = readFileSync(migrationPath, 'utf8');

console.log('📋 To clear the seed data, you have two options:\n');

console.log('Option 1: Using Supabase CLI (Recommended)');
console.log('  1. Make sure you have Supabase CLI installed');
console.log('  2. Run: supabase db push\n');

console.log('Option 2: Using Supabase Dashboard');
console.log('  1. Go to https://app.supabase.com');
console.log('  2. Select your project');
console.log('  3. Go to SQL Editor');
console.log('  4. Copy and paste the SQL below:\n');

console.log('─'.repeat(80));
console.log(sqlContent);
console.log('─'.repeat(80));

console.log('\n✅ After running the SQL, your database will be clean and ready for real data!');
console.log('💡 Tip: You can also find this SQL in: supabase/migrations/20240103_clear_seed_data.sql\n');
