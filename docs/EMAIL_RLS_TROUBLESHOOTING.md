# Email RLS Troubleshooting Guide

## Issue Fixed: Email Metadata Not Found Error

We've fixed an issue where emails were showing "No content available" and errors like:
```
Error: Email metadata not found for <015601dc18c1$0a692550$1f3b6ff0$@hlbfinservis.com>
```

## Root Cause

1. The RLS (Row Level Security) policies were applied to `emails` and `email_accounts` tables, but not to the `email_index` table
2. The client code was using joins between tables that were blocked by RLS
3. The error occurred when trying to mark emails as read/unread or view email content

## Solution Applied

1. Added RLS policies to the `email_index` table
2. Modified the code to avoid joins that could be blocked by RLS
3. Created scripts and API routes to fix the issues

## How to Fix

### Option 1: Run the Fix Script

```bash
# Run from the project root
npm run fix:email-index
```

### Option 2: Call the API Route

```bash
# With curl
curl -X POST http://localhost:3000/api/email/fix-email-index

# Or visit in browser (while logged in)
http://localhost:3000/api/email/fix-email-index
```

## Verifying the Fix

After applying the fix:

1. Restart the Next.js server
2. Log in to the application
3. Try viewing emails and marking them as read/unread
4. Check the browser console for any errors

## Changes Made

1. Added RLS to `email_index` table:
   ```sql
   ALTER TABLE public.email_index ENABLE ROW LEVEL SECURITY;
   ```

2. Created policies for service role access:
   ```sql
   CREATE POLICY "Service role can manage email_index"
   ON public.email_index
   FOR ALL
   TO service_role
   USING (true)
   WITH CHECK (true);
   ```

3. Modified code to avoid joins:
   - Updated `optimized-email-service.ts` to fetch email metadata and account data separately
   - Updated `read-status/route.ts` to check permissions without joins

## Security Model

Our security model now consistently applies to all email-related tables:

1. RLS is enabled on `emails`, `email_accounts`, and `email_index` tables
2. Service role has full access (used by API routes)
3. Anon and authenticated roles are blocked
4. All access goes through API routes that validate NextAuth sessions

## If Issues Persist

If you're still experiencing issues:

1. Check the browser console for specific errors
2. Look at the server logs for database errors
3. Verify that the user has access to the email accounts
4. Try running both fix scripts:
   ```bash
   npm run fix:email-rls-direct
   npm run fix:email-index
   ```

## NextAuth vs Supabase Auth

Currently, we're using NextAuth for authentication while our database uses Supabase. This creates a disconnect that requires our custom security approach.

### Current Approach (NextAuth)
- Authentication handled by NextAuth
- Database security enforced at API level
- RLS policies grant access only to service role
- API routes validate NextAuth session and filter by user_id

### Alternative (Supabase Auth)
If you want to switch to Supabase Auth in the future:
1. Migrate users from NextAuth to Supabase Auth
2. Update RLS policies to use `auth.uid()` directly
3. Simplify API routes to use client-side Supabase queries

This would eliminate the need for the complex security approach we're currently using.
