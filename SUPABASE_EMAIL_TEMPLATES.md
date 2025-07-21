# 🔧 Supabase Email Templates Configuration

## 🎯 The Problem
All Supabase email links (magic links, password reset, confirmation) redirect to `https://helloaris.com` instead of `https://app.helloaris.com` because of incorrect Site URL and email template configuration.

## ✅ Complete Fix

### Step 1: Update Site URL
**In Supabase Dashboard > Authentication > URL Configuration:**

```
Site URL: https://app.helloaris.com
```

### Step 2: Update Redirect URLs
**Remove ALL existing URLs and add ONLY these:**

```
# Production URLs
https://app.helloaris.com/auth/confirm
https://app.helloaris.com/reset-password
https://app.helloaris.com/auth/callback
https://app.helloaris.com

# Development URLs (optional)
http://localhost:3000/auth/confirm
http://localhost:3000/reset-password  
http://localhost:3000/auth/callback
http://localhost:3000
```

### Step 3: Fix Email Templates
**In Supabase Dashboard > Authentication > Email Templates:**

#### **Confirm Signup Template**
```html
<h2>Welcome to ARIS! 🎉</h2>
<p>Thank you for signing up! To complete your registration, please confirm your email address by clicking the button below:</p>

<p style="margin: 30px 0;">
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup" 
     style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
    Confirm your email
  </a>
</p>

<p style="color: #666666; font-size: 14px;">
  Or copy and paste this URL into your browser:<br>
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup">{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup</a>
</p>

<p style="color: #999999; font-size: 12px; margin-top: 30px;">
  If you didn't sign up for ARIS, you can safely ignore this email.
</p>
```

#### **Magic Link Template**
```html
<h2>Sign in to ARIS</h2>
<p>Click the button below to sign in to your account:</p>

<p style="margin: 30px 0;">
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=magiclink" 
     style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
    Sign in to ARIS
  </a>
</p>

<p style="color: #666666; font-size: 14px;">
  Or copy and paste this URL into your browser:<br>
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=magiclink">{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=magiclink</a>
</p>

<p style="color: #999999; font-size: 12px; margin-top: 30px;">
  If you didn't request this sign-in link, you can safely ignore this email.
</p>
```

#### **Reset Password Template**
```html
<h2>Reset your ARIS password</h2>
<p>You requested to reset your password. Click the button below to set a new password:</p>

<p style="margin: 30px 0;">
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery" 
     style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
    Reset password
  </a>
</p>

<p style="color: #666666; font-size: 14px;">
  Or copy and paste this URL into your browser:<br>
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery</a>
</p>

<p style="color: #999999; font-size: 12px; margin-top: 30px;">
  If you didn't request a password reset, you can safely ignore this email.
</p>
```

#### **Email Change Template**
```html
<h2>Confirm your new email address</h2>
<p>You requested to change your email address. Click the button below to confirm your new email:</p>

<p style="margin: 30px 0;">
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email_change" 
     style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
    Confirm new email
  </a>
</p>

<p style="color: #666666; font-size: 14px;">
  Or copy and paste this URL into your browser:<br>
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email_change">{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email_change</a>
</p>

<p style="color: #999999; font-size: 12px; margin-top: 30px;">
  If you didn't request this email change, you can safely ignore this email.
</p>
```

## 🎯 Key Points

1. **Use `{{ .RedirectTo }}`** - This gets the URL from your API calls with `emailRedirectTo`
2. **Never use `{{ .SiteURL }}`** - This uses the Site URL setting which may be wrong
3. **Include token parameters** - `?token_hash={{ .TokenHash }}&type=signup`
4. **Consistent styling** - Professional appearance across all emails
5. **Clear instructions** - Users know exactly what to do

## 🚀 Expected Result

After these changes:
- ✅ **All email links** point to `https://app.helloaris.com`
- ✅ **Magic links work** for sign-in
- ✅ **Password reset works** properly
- ✅ **Email confirmation works** for new signups
- ✅ **Consistent user experience** across all auth flows

## 🔍 Testing

1. **Update Supabase configuration** as shown above
2. **Wait 5 minutes** for changes to propagate
3. **Test each email type:**
   - Sign up with new email
   - Request password reset
   - Try magic link sign-in
4. **Verify all links** point to `app.helloaris.com`

This will fix ALL your Supabase email redirect issues! 🎉 