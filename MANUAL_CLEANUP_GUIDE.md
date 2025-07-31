# 🧹 Manual Database Cleanup Guide

## Option 1: Using Supabase Dashboard (Recommended)

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Users**
3. Find the users you want to delete:
   - `tim.mak88@gmail.com`
   - `test@example.com`
   - `tim.mak@bulknutrition.eu`

### Step 2: Delete Users
1. Click on each user
2. Click **"Delete user"** button
3. Confirm the deletion
4. This will automatically clean up most associated data

### Step 3: Clean Up Remaining Data (if needed)
1. Go to **Table Editor**
2. Check these tables for orphaned data:
   - `organizations` - delete any orphaned organizations
   - `organization_members` - delete any remaining memberships
   - `user_preferences` - delete any remaining preferences
   - `ai_profiler` - delete any remaining profiler data
   - `contacts` - delete any remaining contacts
   - `email_accounts` - delete any remaining email accounts
   - `email_analysis_history` - delete any remaining history

## Option 2: Using SQL Script

### Step 1: Run the SQL Script
1. Go to **SQL Editor** in Supabase dashboard
2. Copy and paste the contents of `cleanup-database.sql`
3. Click **"Run"** to execute the script

### Step 2: Verify Cleanup
The script will show you the remaining users after cleanup.

## Option 3: Using Node.js Script

### Step 1: Install Dependencies
```bash
npm install @supabase/supabase-js dotenv
```

### Step 2: Set Environment Variables
Make sure your `.env` file has:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Run the Script
```bash
node cleanup-users.js
```

## Option 4: Complete Database Reset (Nuclear Option)

If you want to start completely fresh:

### Step 1: Backup Important Data
1. Export any important data you want to keep
2. Note down your current configuration

### Step 2: Reset Database
1. Go to **Settings > Database** in Supabase
2. Click **"Reset database"**
3. Confirm the reset
4. This will delete ALL data and reset to initial state

### Step 3: Re-run Migrations
After reset, you'll need to re-run your database migrations to recreate the schema.

## Verification

After cleanup, verify that:
- ✅ No unwanted users exist in `auth.users`
- ✅ No orphaned organizations exist
- ✅ No orphaned data in related tables
- ✅ Authentication works for new users

## Notes

- **Service Role Key**: Required for admin operations like deleting users
- **Cascade Deletes**: Supabase may not automatically cascade deletes, so manual cleanup might be needed
- **Backup**: Always backup important data before major cleanup operations
- **Testing**: Test the application after cleanup to ensure everything works correctly 