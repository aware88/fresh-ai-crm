# OAuth Setup Guide: Google & Microsoft Sign-In

## Overview

This guide will help you add Google and Microsoft OAuth authentication to your Supabase-powered CRM application.

## Part 1: Supabase Dashboard Configuration

### 1. Google OAuth Setup

#### Step 1: Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client IDs**
5. Configure OAuth consent screen if not done already
6. Set Application type to **Web application**
7. Add authorized redirect URIs:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
8. Save and copy the **Client ID** and **Client Secret**

#### Step 2: Configure in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** and click **Configure**
4. Enable Google provider
5. Enter your **Client ID** and **Client Secret**
6. Save configuration

### 2. Microsoft OAuth Setup

#### Step 1: Create Microsoft App Registration
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **New registration**
4. Set name (e.g., "CRM Mind Auth")
5. Set supported account types (usually "Accounts in any organizational directory and personal Microsoft accounts")
6. Set redirect URI to:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
7. Click **Register**
8. Copy the **Application (client) ID**
9. Go to **Certificates & secrets** → **New client secret**
10. Copy the secret **Value** (not the ID)

#### Step 2: Configure in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Azure (Microsoft)** and click **Configure**
4. Enable Azure provider
5. Enter your **Client ID** and **Client Secret**
6. Save configuration

## Part 2: Frontend Implementation

### 1. Update Environment Variables

Add to your `.env.local`:

```env
# OAuth Configuration (optional - for custom implementations)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_MICROSOFT_CLIENT_ID=your-microsoft-client-id
```

### 2. Update Authentication Component

Create or update your sign-in component:

```typescript
// components/auth/SignInForm.tsx
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { FcGoogle } from 'react-icons/fc';
import { SiMicrosoft } from 'react-icons/si';

export default function SignInForm() {
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const handleOAuthSignIn = async (provider: 'google' | 'azure') => {
    try {
      setLoading(provider);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('OAuth sign-in error:', error.message);
        alert('Sign-in failed. Please try again.');
      }
    } catch (error) {
      console.error('OAuth sign-in error:', error);
      alert('Sign-in failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-sm">
      <div className="space-y-3">
        <Button
          onClick={() => handleOAuthSignIn('google')}
          disabled={loading !== null}
          variant="outline"
          className="w-full flex items-center gap-3 h-12"
        >
          <FcGoogle className="w-5 h-5" />
          {loading === 'google' ? 'Signing in...' : 'Continue with Google'}
        </Button>

        <Button
          onClick={() => handleOAuthSignIn('azure')}
          disabled={loading !== null}
          variant="outline"
          className="w-full flex items-center gap-3 h-12"
        >
          <SiMicrosoft className="w-5 h-5 text-blue-600" />
          {loading === 'azure' ? 'Signing in...' : 'Continue with Microsoft'}
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Your existing email/password form goes here */}
    </div>
  );
}
```

### 3. Create OAuth Callback Handler

Create `app/auth/callback/route.ts`:

```typescript
// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=oauth_error`);
      }

      // Optional: Create user profile or organization if needed
      if (data.user && data.session) {
        // Handle user creation/organization setup here if needed
        console.log('User signed in:', data.user.email);
      }

      // Redirect to dashboard or intended page
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=oauth_error`);
    }
  }

  // No code provided, redirect to sign-in
  return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in`);
}
```

### 4. Install Required Dependencies

```bash
npm install react-icons
# or
yarn add react-icons
```

## Part 3: Advanced Configuration

### 1. Custom Scopes (Optional)

For more user information, you can request additional scopes:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    scopes: 'openid email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
});
```

### 2. Handle User Metadata

After OAuth sign-in, you can access user metadata:

```typescript
// In your callback handler or after sign-in
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  const userMetadata = user.user_metadata;
  console.log('User info:', {
    name: userMetadata.full_name || userMetadata.name,
    email: user.email,
    avatar: userMetadata.avatar_url || userMetadata.picture,
    provider: userMetadata.provider,
  });
}
```

### 3. Organization Setup Integration

If you want to create organizations during OAuth sign-up:

```typescript
// In your callback handler
if (data.user && data.session) {
  // Check if user already has an organization
  const { data: existingMembership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', data.user.id)
    .single();

  if (!existingMembership) {
    // Create default organization for new OAuth users
    const orgName = `${data.user.user_metadata.full_name || data.user.email}'s Organization`;
    const orgSlug = `org-${data.user.id.slice(0, 8)}`;

    const response = await fetch('/api/admin/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: orgName,
        slug: orgSlug,
        admin_user_id: data.user.id,
        subscription_plan: 'free'
      }),
    });

    if (!response.ok) {
      console.error('Failed to create organization for OAuth user');
    }
  }
}
```

## Part 4: Testing

### 1. Test Google OAuth
1. Go to your sign-in page
2. Click "Continue with Google"
3. Complete Google authentication
4. Verify you're redirected to dashboard
5. Check Supabase Auth users table

### 2. Test Microsoft OAuth
1. Go to your sign-in page
2. Click "Continue with Microsoft"
3. Complete Microsoft authentication
4. Verify you're redirected to dashboard
5. Check Supabase Auth users table

## Part 5: Security Considerations

### 1. Domain Verification
- Verify your domain in Google Cloud Console
- Add your domain to Azure App Registration

### 2. CORS Configuration
- Ensure your domain is added to Supabase CORS settings
- Check redirect URIs are correctly configured

### 3. Rate Limiting
- Consider implementing rate limiting for auth attempts
- Monitor for suspicious OAuth activity

## Troubleshooting

### Common Issues:

1. **Redirect URI Mismatch**
   - Ensure redirect URIs match exactly in provider settings
   - Check for trailing slashes and protocol (https vs http)

2. **Missing Scopes**
   - Verify required scopes are requested
   - Check provider-specific scope requirements

3. **Callback Errors**
   - Check callback route is correctly implemented
   - Verify error handling in callback

4. **User Creation Issues**
   - Ensure RLS policies allow user creation
   - Check organization setup logic

This setup will give you a professional OAuth implementation with Google and Microsoft sign-in options alongside your existing email authentication!













