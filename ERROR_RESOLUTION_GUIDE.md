# 🔧 Error Resolution Guide

**Date**: November 5, 2025  
**Status**: Issues Identified & Solutions Provided

---

## 📋 Error Summary

You're experiencing three types of errors in your console:

### 1. **Browser Extension Errors** (Not Critical)
```
Unchecked runtime.lastError: The message port closed before a response was received.
```
- **Cause**: Browser extensions (e.g., password managers, ad blockers) trying to communicate with your page
- **Impact**: None on your application
- **Solution**: Ignore these or disable extensions during development

### 2. **Database Table Missing Errors** (Critical - 500 Status)
```
Failed to load resource: the server responded with a status of 500 ()
- /rest/v1/material_comments?select=*&material_id=eq.xxx...
- /rest/v1/project_history?select=*&project_id=eq.xxx...
```
- **Cause**: Tables `material_comments` and `project_history` don't exist in your Supabase database
- **Impact**: Collaboration features (comments, history) completely broken
- **Solution**: Run the migration SQL file

### 3. **Prices Query Error** (Critical - 400 Status)
```
Failed to load resource: the server responded with a status of 400 ()
- /rest/v1/prices?select=*
```
- **Cause**: Likely RLS (Row Level Security) policy issue or missing filter
- **Impact**: Price loading may fail
- **Solution**: Check RLS policies and ensure proper filtering

---

## 🚀 Step-by-Step Resolution

### Step 1: Apply Database Migration

The migration file has been created at:
```
supabase/migrations/002_collaboration_tables.sql
```

**Option A: Using Supabase CLI (Recommended)**

```bash
# Navigate to your project
cd /Users/sowax/Desktop/COMPACHANTIER/CascadeProjects/windsurf-project

# Login to Supabase (if not already)
npx supabase login

# Link your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
npx supabase db push
```

**Option B: Using Supabase Dashboard**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Open the file `supabase/migrations/002_collaboration_tables.sql`
5. Copy the entire content
6. Paste it into the SQL Editor
7. Click **Run**

### Step 2: Verify Tables Were Created

Run this query in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('material_comments', 'project_history', 'project_collaborators');

-- Check row counts
SELECT 
  'material_comments' as table_name, COUNT(*) as row_count FROM material_comments
UNION ALL
SELECT 
  'project_history', COUNT(*) FROM project_history
UNION ALL
SELECT 
  'project_collaborators', COUNT(*) FROM project_collaborators;
```

Expected result: All three tables should be listed.

### Step 3: Verify RLS Policies

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('material_comments', 'project_history', 'project_collaborators', 'prices')
ORDER BY tablename, policyname;
```

### Step 4: Test the Application

1. **Refresh your browser** (hard refresh: Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. **Open DevTools Console** (F12)
3. **Navigate to a project page**
4. **Check for errors**:
   - Material comments should load without 500 errors
   - Project history should load without 500 errors
   - Prices should load without 400 errors

---

## 🔍 Debugging Specific Errors

### Error: "material_comments" 500 Error

**Symptoms:**
```
Error loading comments: Object
ebmgtfftimezuuxxzyjm.supabase.co/rest/v1/material_comments?select=*&material_id=eq.xxx: 500
```

**Root Cause:**
- Table doesn't exist in database
- Or RLS policy is blocking access

**Verification:**
```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'material_comments'
);

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'material_comments';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'material_comments';
```

**Fix:**
Apply the migration file (Step 1 above).

---

### Error: "project_history" 500 Error

**Symptoms:**
```
Error loading history: Object
ebmgtfftimezuuxxzyjm.supabase.co/rest/v1/project_history?select=*&project_id=eq.xxx: 500
```

**Root Cause:**
- Table doesn't exist in database
- Or RLS policy is blocking access

**Verification:**
```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'project_history'
);
```

**Fix:**
Apply the migration file (Step 1 above).

---

### Error: "prices" 400 Error

**Symptoms:**
```
Error adding price: Object
ebmgtfftimezuuxxzyjm.supabase.co/rest/v1/prices?select=*: 400
```

**Root Cause:**
- RLS policy might be too restrictive
- Missing required fields in query
- Invalid data being inserted

**Verification:**
```sql
-- Check prices table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'prices'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'prices';

-- Test a simple query
SELECT * FROM prices LIMIT 1;
```

**Potential Fixes:**

1. **Check if user is authenticated:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  console.error("User not authenticated");
  return;
}
```

2. **Verify RLS policies allow INSERT:**
```sql
-- Check if current user can insert
SELECT has_table_privilege(current_user, 'prices', 'INSERT');
```

3. **Add better error handling:**
```typescript
const { data, error } = await supabase
  .from('prices')
  .insert({...})
  .select();

if (error) {
  console.error('Detailed error:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  console.error('Error details:', error.details);
}
```

---

## 🛡️ RLS Policy Troubleshooting

If you're still getting 400/500 errors after applying migrations:

### Temporarily Disable RLS (Development Only!)

```sql
-- WARNING: Only for debugging! Re-enable after testing!
ALTER TABLE material_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE prices DISABLE ROW LEVEL SECURITY;
```

If this fixes the issue, the problem is with your RLS policies.

### Re-enable RLS and Fix Policies

```sql
-- Re-enable RLS
ALTER TABLE material_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

-- Add permissive policies for testing
CREATE POLICY "Allow all for authenticated users (temp)"
  ON material_comments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## 📊 Database Schema Verification

Run this comprehensive check:

```sql
-- Complete database health check
SELECT 
  t.table_name,
  t.table_type,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.table_name) as policy_count,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = t.table_name) as rls_enabled
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN (
    'projects', 'materials', 'prices', 'suppliers', 
    'material_comments', 'project_history', 'project_collaborators'
  )
ORDER BY t.table_name;
```

Expected output:
```
table_name              | column_count | policy_count | rls_enabled
------------------------|--------------|--------------|------------
material_comments       | 10           | 4            | true
materials               | 8            | 2            | true
prices                  | 10           | 2            | true
project_collaborators   | 10           | 4            | true
project_history         | 9            | 2            | true
projects                | 5            | 4            | true
suppliers               | 10           | 2            | true
```

---

## 🧪 Testing After Fix

### Test 1: Material Comments
```typescript
// In browser console
const { data, error } = await supabase
  .from('material_comments')
  .select('*')
  .limit(1);

console.log('Comments test:', { data, error });
```

### Test 2: Project History
```typescript
// In browser console
const { data, error } = await supabase
  .from('project_history')
  .select('*')
  .limit(1);

console.log('History test:', { data, error });
```

### Test 3: Prices
```typescript
// In browser console
const { data, error } = await supabase
  .from('prices')
  .select('*, supplier:suppliers(*)')
  .limit(1);

console.log('Prices test:', { data, error });
```

---

## 🔄 If Issues Persist

### 1. Check Supabase Service Status
Visit: https://status.supabase.com/

### 2. Check Your Environment Variables
```bash
# Verify these are set correctly
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Regenerate TypeScript Types
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

### 4. Clear Browser Cache
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Or clear all cache in browser settings

### 5. Check Supabase Logs
1. Go to Supabase Dashboard
2. Navigate to **Logs** → **Postgres Logs**
3. Look for errors around the time of your requests

---

## ✅ Success Checklist

After applying fixes, verify:

- [ ] No 500 errors in console
- [ ] No 400 errors in console
- [ ] Material comments load and display
- [ ] Project history loads and displays
- [ ] Prices load and display
- [ ] Can add new comments
- [ ] Can add new prices
- [ ] Real-time updates work
- [ ] All RLS policies are enabled

---

## 📞 Need More Help?

If you're still experiencing issues:

1. **Check the Supabase logs** in your dashboard
2. **Share the exact error message** from the console
3. **Verify your Supabase project is active** (not paused)
4. **Check your subscription limits** (free tier has limits)

---

## 🎯 Summary

**Main Issue**: Missing database tables (`material_comments`, `project_history`)

**Solution**: Apply the migration file at `supabase/migrations/002_collaboration_tables.sql`

**Expected Result**: All collaboration features working without errors

**Time to Fix**: 5-10 minutes

---

**Status**: ✅ Migration file created  
**Next Step**: Apply migration to Supabase database  
**Priority**: High (blocking collaboration features)
