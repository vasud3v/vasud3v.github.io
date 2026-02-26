# Database Migrations

This folder contains Supabase database migrations.

## Clearing Seed Data

The database was initially seeded with dummy data for testing. To remove all seed data and start with a clean database:

### Option 1: Using Supabase CLI (Recommended)

```bash
# Apply the clear seed data migration
supabase db push
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `20240103_clear_seed_data.sql`
4. Paste and run the SQL

### Option 3: Manual SQL Execution

Connect to your database and run:

```sql
-- Run the contents of 20240103_clear_seed_data.sql
```

## What Gets Cleared

The clear seed data migration removes:
- All seed users (u1-u8: cyb3rn0va, null_ptr, rootkit_dev, etc.)
- All seed threads and posts
- All seed categories (except creates one default "General Discussion" category)
- All seed polls and votes
- All related data (bookmarks, watches, reactions, etc.)

## After Clearing

After clearing the seed data:
1. Your database will be clean with only the schema
2. One default "General Discussion" category will exist
3. Real users can sign up and create content
4. No dummy data will be shown in the application

## Seed Data File

The original seed data file has been renamed to `20240102_seed_forum_data.sql.disabled` to prevent it from running again. If you need to restore seed data for testing, rename it back to `.sql`.
