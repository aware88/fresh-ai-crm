# Email Confirmation Debug Guide

## 🚨 CRITICAL ISSUE IDENTIFIED

**Problem**: All URL parameters are `null` in confirmation links, indicating the Supabase email template is not configured correctly.

## 🔍 Issue Analysis

Based on user reports, email confirmation is failing after clicking "Confirm email" in both development and production environments. The debug information shows all parameters as `null`, which means the confirmation link doesn't contain the required tokens.

## 🛠️ IMMEDIATE FIX REQUIRED

### 1. **CRITICAL**: Update Supabase Email Template

**Go to Supabase Dashboard:**
1. Navigate to **Authentication** → **Email Templates**
2. Click on **Confirm signup** template
3. **REPLACE THE ENTIRE TEMPLATE** with this:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .RedirectTo }}">Confirm your mail</a></p>

<p>Or copy and paste this URL into your browser:</p>
<p>{{ .RedirectTo }}</p>
```

**❌ WRONG Template (causes null parameters):**
```html
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your mail</a></p>
```

**❌ ALSO WRONG (old format):**
```html
<p><a href="{{ .SiteURL }}/auth/confirm">Confirm your mail</a></p>
```

### 2. **CRITICAL**: Check Site URL Configuration

**In Supabase Dashboard:**
1. Go to **Settings** → **API**
2. Check **Site URL** is set correctly:
   - **Development**: `http://localhost:3000`
   - **Production**: `https://your-production-domain.com` (NO trailing slash)

### 3. **CRITICAL**: Verify Redirect URLs

**In Supabase Dashboard:**
1. Go to **Authentication** → **URL Configuration**
2. Add these to **Redirect URLs**:
   - `http://localhost:3000/auth/confirm`
   - `https://your-production-domain.com/auth/confirm`

## 🔧 Alternative Fix (If Template Doesn't Work)

If the `{{ .RedirectTo }}` doesn't work, try this template:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your mail</a></p>

<p>If the link doesn't work, copy and paste this URL:</p>
<p>{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup</p>
```

## 🧪 Testing Steps

### Immediate Test:
1. **Update the email template** (most critical step)
2. **Sign up with a test email**
3. **Check the confirmation email**
4. **Verify the link contains parameters** like:
   - `token_hash=xyz123`
   - `type=signup`
   - OR `access_token` and `refresh_token`

### Expected URL Format:
```
https://yourdomain.com/auth/confirm?token_hash=abc123&type=signup
```
OR
```
https://yourdomain.com/auth/confirm?access_token=xyz&refresh_token=abc&type=signup
```

## 🚨 Emergency Workaround

If users are stuck with unconfirmed accounts:

### Manual Confirmation (Admin):
1. Go to Supabase Dashboard
2. **Authentication** → **Users**
3. Find the user and manually set `email_confirmed_at`

### SQL Fix (Admin only):
```sql
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'user@example.com';
```

## 📊 Root Cause Analysis

The issue occurs because:
1. **Email template** is not using the correct Supabase variables
2. **RedirectTo** parameter is not being properly passed
3. **Site URL** might be misconfigured
4. **Redirect URLs** are not whitelisted

## ✅ Resolution Checklist

**CRITICAL (Do First):**
- [ ] Email template uses `{{ .RedirectTo }}` or proper token format
- [ ] Site URL configured correctly (no trailing slash)
- [ ] Redirect URLs added to whitelist

**Secondary:**
- [ ] Signup API uses dynamic `emailRedirectTo`
- [ ] Confirmation page handles multiple token formats
- [ ] CORS settings include all domains
- [ ] SSL certificate valid (production)
- [ ] DNS propagation complete (production)

## 🔄 Step-by-Step Fix Process

1. **FIRST**: Update Supabase email template (most important)
2. **SECOND**: Verify Site URL configuration
3. **THIRD**: Add redirect URLs to whitelist
4. **FOURTH**: Test with a new signup
5. **FIFTH**: Check confirmation email contains parameters

## 📧 Expected Email Content

After fixing, the confirmation email should contain a link like:
```
https://yourdomain.com/auth/confirm?token_hash=abc123xyz&type=signup
```

When clicked, the debug page should show:
```json
{
  "token_hash": "abc123xyz",
  "type": "signup",
  "access_token": null,
  "refresh_token": null,
  // ... other parameters
}
```

## 🆘 If Still Not Working

1. Check Supabase logs in dashboard
2. Try different email template formats
3. Verify email provider settings
4. Contact Supabase support with your project details

**The key is fixing the email template - this is the root cause of the null parameters!** 