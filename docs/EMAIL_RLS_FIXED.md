# ✅ Email RLS Security - FIXED

## Problem Solved

The email tables (`emails` and `email_accounts`) now have proper Row-Level Security (RLS) configured to work with NextAuth authentication.

## Current Security Model

### 1. **Database Level (RLS)**
- ✅ RLS is **ENABLED** on both `emails` and `email_accounts` tables
- ✅ **Service role** has full access (used by API routes)
- ✅ **Anon role** is completely blocked
- ✅ **Authenticated role** is completely blocked (since we use NextAuth, not Supabase Auth)

### 2. **API Level (NextAuth)**
All email access goes through Next.js API routes that:
1. Validate the NextAuth session using `getServerSession(authOptions)`
2. Extract the user ID from the session
3. Use the service role client to access the database
4. Filter all queries by the authenticated user's ID

### 3. **Security Layers**
```
Browser Request
    ↓
NextAuth Session Check (API Route)
    ↓
Service Role Client (Bypasses RLS)
    ↓
Manual user_id Filtering
    ↓
Database (RLS blocks direct access)
```

## Key Files

### Security Implementation
- `/src/lib/supabase/secure-client.ts` - Secure wrapper for email operations
- `/src/lib/auth/validate-session.ts` - Session validation helpers
- `/src/app/api/fix-email-rls/route.ts` - RLS management API

### Migration & Scripts
- `/supabase/migrations/20250201000001_fix_email_rls_for_nextauth.sql` - RLS migration
- `/scripts/apply-rls-migration.js` - Apply migration script
- `/scripts/verify-email-rls.js` - Verification script

## How It Works

### Example: Fetching User's Emails

```typescript
// In API route
import { createSecureEmailClient } from '@/lib/supabase/secure-client';

export async function GET() {
  // This validates the session automatically
  const client = await createSecureEmailClient();
  
  // Automatically filtered by authenticated user
  const { data: emails } = await client.getEmails();
  
  return NextResponse.json({ emails });
}
```

### Manual Approach (if needed)

```typescript
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET() {
  // 1. Validate session
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Use service role client
  const supabase = createServiceRoleClient();

  // 3. Filter by user_id
  const { data } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('user_id', session.user.id);

  return NextResponse.json({ data });
}
```

## Testing

### Verify RLS is Working

```bash
# Run verification script
node scripts/verify-email-rls.js
```

Expected output:
- RLS: ENABLED on both tables
- Policies: Service role has access, anon/authenticated blocked
- Anon test: Access blocked ✅

### Test in Application

1. **Authenticated User**: Should see only their emails
2. **Unauthenticated Request**: Should get 401 error
3. **Direct Database Access**: Should be blocked (except service role)

## Security Checklist

✅ RLS enabled on `emails` table  
✅ RLS enabled on `email_accounts` table  
✅ Service role policies created  
✅ Anon access blocked  
✅ Authenticated role blocked (we use NextAuth)  
✅ All API routes validate NextAuth session  
✅ Queries filtered by user_id  
✅ Service role key not exposed to client  

## Important Notes

1. **Never expose the service role key** to the client
2. **Always validate session** before database access
3. **Use the secure client wrapper** for consistency
4. **All email access** must go through API routes

## Future Migration to Supabase Auth

If you later switch from NextAuth to Supabase Auth:

1. Update RLS policies to use `auth.uid()`:
```sql
CREATE POLICY "Users can view their own emails"
ON public.emails
FOR SELECT
TO authenticated
USING (
  email_account_id IN (
    SELECT id FROM public.email_accounts 
    WHERE user_id = auth.uid()
  )
);
```

2. Remove session validation from API routes
3. Use Supabase client with user JWT directly

## Troubleshooting

### If emails are not accessible:
1. Check that the user is authenticated
2. Verify the user has email accounts in the database
3. Check API route is validating session correctly
4. Run `node scripts/verify-email-rls.js` to check RLS status

### If RLS needs to be reapplied:
```bash
node scripts/apply-rls-migration.js
```

## Summary

The email security is now properly configured with a two-layer approach:
1. **RLS at database level** prevents direct access
2. **NextAuth at API level** validates user identity

All email data is secure and properly isolated per user! 🎉
