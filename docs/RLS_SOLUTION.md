# Email RLS Solution for NextAuth + Supabase

## The Problem

The application uses **NextAuth** for authentication, but the Supabase RLS policies were checking `auth.uid()` which is a **Supabase Auth** function. Since users authenticate through NextAuth, not Supabase Auth, `auth.uid()` always returns null, causing the RLS policies to fail and block all access.

## The Solution

Since NextAuth and Supabase Auth are separate systems, we need a different approach:

### 1. **API-Level Security**
- All email access goes through Next.js API routes
- Each API route validates the NextAuth session using `getServerSession()`
- The API routes use the service role client (which bypasses RLS) but manually filter data by `user_id`

### 2. **RLS Configuration**
- RLS is enabled on the tables to prevent direct access
- Service role (used by API routes) can access everything
- Anon role is completely blocked
- The actual security enforcement happens at the API level, not at the database level

### 3. **Secure Client Wrapper**
Created `/src/lib/supabase/secure-client.ts` which:
- Validates the NextAuth session
- Automatically filters queries by the authenticated user's ID
- Provides safe methods for CRUD operations on emails and email accounts

## Implementation

### Step 1: Fix RLS Policies

Run the fix script:
```bash
npm run fix:email-rls
```

Or manually call the API:
```bash
curl -X POST http://localhost:3000/api/fix-email-rls
```

### Step 2: Use Secure Client in API Routes

Instead of using the raw Supabase client, use the secure wrapper:

```typescript
import { createSecureEmailClient } from '@/lib/supabase/secure-client';

export async function GET() {
  const client = await createSecureEmailClient();
  
  // This automatically filters by the authenticated user
  const { data: emails, error } = await client.getEmails();
  
  return NextResponse.json({ emails });
}
```

### Step 3: Validate Session in All Email Routes

Every email-related API route should:
1. Get the session using `getServerSession(authOptions)`
2. Check that `session.user.id` exists
3. Use that ID to filter database queries

Example:
```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Use session.user.id to filter queries
const { data } = await supabase
  .from('email_accounts')
  .select('*')
  .eq('user_id', session.user.id);
```

## Security Considerations

1. **Never expose service role key** to the client
2. **Always validate session** in API routes before database access
3. **Use the secure client wrapper** for consistency
4. **Filter by user_id** in all queries
5. **Enable RLS** to prevent direct database access

## Testing

1. Check that RLS is enabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('emails', 'email_accounts');
```

2. Verify policies are in place:
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('emails', 'email_accounts');
```

3. Test API access:
- Authenticated users should see only their emails
- Unauthenticated requests should get 401 errors
- Direct database access (without service role) should be blocked

## Migration Path

If you later want to switch to Supabase Auth:
1. Migrate user accounts from NextAuth to Supabase Auth
2. Update RLS policies to use `auth.uid()`
3. Remove the session validation from API routes
4. Use Supabase client directly with user JWT
