# Production Password Reset Fix

## The Problem

You were experiencing "Invalid Token" errors when trying to reset passwords in production. This is a common issue with Supabase password reset flows in production environments.

### Root Causes

1. **Email Client Pre-fetching**: Email clients like Outlook, Gmail, and others scan links for security purposes, consuming single-use tokens before users click them.

2. **URL Configuration Mismatch**: The redirect URLs and environment variables weren't properly configured for production.

3. **Token Handling**: The original implementation didn't handle token verification optimally for production environments.

## The Solution

### 1. Fixed Environment Variables

**Production Environment Variables** (`production.env`):
```env
NEXTAUTH_URL=https://app.helloaris.com
NEXT_PUBLIC_APP_URL=https://app.helloaris.com
```

**Development Environment Variables** (`test.env`):
```env
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Updated Password Reset Flow

#### Changes Made:

1. **Immediate Token Verification**: Instead of waiting for form submission, we now verify the OTP token immediately when the reset page loads.

2. **Session-Based Password Update**: After token verification, we use the authenticated session to update the password, not the token.

3. **Proper Cookie Configuration**: NextAuth cookies now use secure settings in production and insecure in development.

### 3. Supabase Configuration

Make sure your Supabase Auth settings have these redirect URLs:
- `https://app.helloaris.com/reset-password`
- `https://app.helloaris.com/auth/callback`
- `https://app.helloaris.com/auth/confirm`

Site URL should be: `https://app.helloaris.com`

## How It Works Now

### Password Reset Process:

1. **User requests reset**: Enters email on forgot password page
2. **Email sent**: Supabase sends email with reset link to `https://app.helloaris.com/reset-password?token_hash=...&type=recovery`
3. **Token verification**: When user clicks link, the reset page immediately verifies the token and establishes a session
4. **Password update**: User enters new password, which is updated using the authenticated session
5. **Cleanup**: User is signed out and redirected to login page

### Key Improvements:

- **Email client proof**: Immediate token verification prevents pre-fetching issues
- **Better error handling**: Clear error messages for expired or invalid tokens
- **Secure production setup**: Proper cookie configuration for HTTPS
- **Session management**: Clean session handling prevents token reuse issues

## Testing the Fix

### To test in production:

1. Go to `https://app.helloaris.com/signin`
2. Click "Forgot Password?"
3. Enter `tim.mak88@gmail.com`
4. Check your email for the reset link
5. Click the reset link immediately when received
6. Enter your new password
7. You should be redirected to sign in with success message

### If you still get "Invalid Token":

1. **Request a fresh reset**: Don't reuse old reset emails
2. **Click immediately**: Use the reset link as soon as you receive the email
3. **Check spam folder**: Make sure the email isn't in spam
4. **Try incognito mode**: Sometimes browser caching can interfere

## Environment Setup for Production

Make sure your production environment (Northflank/Vercel/etc.) has these environment variables set:

```env
NEXTAUTH_URL=https://app.helloaris.com
NEXT_PUBLIC_APP_URL=https://app.helloaris.com
NEXT_PUBLIC_SUPABASE_URL=https://ehhaeqmwolhnwylnqdto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXTAUTH_SECRET=KE+bXEMEH1roRkxlzAMSiv/VxRO3sryfmqmE1FU0PHA=
```

## Files Modified

1. `src/app/reset-password/page.tsx` - Updated token verification logic
2. `src/app/forgot-password/page.tsx` - Fixed redirect URL
3. `src/app/api/auth/[...nextauth]/route.ts` - Updated cookie configuration
4. `production.env` - Created production environment template

## User Account Status

The user `tim.mak88@gmail.com` exists in your production Supabase database and should now be able to reset their password successfully using this improved flow.

## Next Steps

1. Deploy these changes to production
2. Update your production environment variables
3. Test the password reset flow
4. The user should now be able to sign in normally

The password reset should now work reliably in production without the "Invalid Token" errors you were experiencing. 