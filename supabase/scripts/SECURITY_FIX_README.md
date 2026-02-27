# Security Fixes for Supabase Linter Warnings

## Overview
This directory contains SQL scripts to fix all security warnings from Supabase's database linter.

## Execution Order

Run these scripts in order:

### 1. ENABLE_RLS_ON_TABLES.sql
Enables Row Level Security on three tables that have policies but RLS disabled:
- `profile_customizations`
- `thread_bookmarks`
- `thread_watches`

### 2. FIX_ALL_SECURITY_WARNINGS.sql
Comprehensive fix for remaining security issues:
- Converts SECURITY DEFINER views to SECURITY INVOKER
- Adds `SET search_path` to all functions (prevents search path injection attacks)
- Fixes overly permissive RLS policy on `post_views` table

## Issues Fixed

### Critical (ERROR level)
- ✅ RLS policies exist but RLS not enabled (3 tables)
- ✅ SECURITY DEFINER views (2 views)
- ✅ Overly permissive RLS policy on post_views

### Warnings
- ✅ Function search_path mutable (7 functions)
- ℹ️ Leaked password protection (configure in Supabase Auth settings)

## Manual Steps

After running the SQL scripts:

1. Leaked password protection (Pro Plan and above only):
   - This feature is only available on Supabase Pro Plan and above
   - If you're on Pro Plan, enable it in: Authentication → Configuration
   - Free tier users can ignore this warning

## Final Status

After running both scripts, you should have:
- ✅ All RLS enabled on tables with policies
- ✅ All views converted to SECURITY INVOKER
- ✅ All functions have immutable search_path
- ✅ Post views RLS policy restricted to authenticated users
- ℹ️ Leaked password protection (Pro Plan feature only)

## Verification

Each script includes verification queries at the end to confirm the fixes were applied correctly.
