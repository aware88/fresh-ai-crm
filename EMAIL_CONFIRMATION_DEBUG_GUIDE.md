# Email Confirmation Debug Guide

## 🔍 Issue Analysis

Based on user reports, email confirmation is failing after clicking "Confirm email" in both development and production environments.

## 🛠️ Debugging Steps

### 1. Check Supabase Email Template Configuration

**Go to Supabase Dashboard:**
1. Navigate to **Authentication** → **Email Templates**
2. Check the **Confirm signup** template
3. Ensure the confirmation URL is set to: `{{ .RedirectTo }}`

**Correct Template:**
```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .RedirectTo }}">Confirm your mail</a></p>
```

**❌ Wrong Template (old):**
```html
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your mail</a></p>
```

### 2. Check Site URL Configuration

**In Supabase Dashboard:**
1. Go to **Settings** → **API**
2. Check **Site URL** is set correctly:
   - **Development**: `http://localhost:3000`
   - **Production**: `https://your-production-domain.com`

### 3. Verify Email Redirect URL in Signup API

**Check `/api/auth/signup/route.ts`:**
```typescript
const { data: userData, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { /* metadata */ },
    emailRedirectTo: `${baseUrl}/auth/confirm`, // This should be dynamic
  },
});
```

### 4. Test Different Confirmation Methods

The enhanced confirmation page now supports multiple formats:
- **Token-based**: `access_token` + `refresh_token`
- **Hash-based**: `token_hash` + `type=signup`
- **Simple token**: `token` + `type=signup`
- **Confirmation token**: `confirmation_token`
- **OAuth code**: `code` parameter

### 5. Enable Debug Mode

1. Sign up with a test email
2. Check email for confirmation link
3. Click the link and observe:
   - Browser console logs
   - Debug information displayed on confirmation page
   - URL parameters in the confirmation link

## 🔧 Common Fixes

### Fix 1: Update Email Template
```html
<!-- Use this in Supabase Email Templates -->
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .RedirectTo }}">Confirm your mail</a></p>
```

### Fix 2: Ensure Correct Site URL
- Development: `http://localhost:3000`
- Production: Your actual domain (no trailing slash)

### Fix 3: Check CORS Settings
In Supabase Dashboard → **Settings** → **API**:
- Add your domains to **Additional URLs**

### Fix 4: Verify DNS and SSL
- Ensure your production domain has valid SSL
- Check DNS propagation

## 🧪 Testing Steps

### Test in Development:
1. Start local server: `npm run dev`
2. Sign up with a test email
3. Check email and click confirmation link
4. Should redirect to `/auth/confirm` with proper parameters

### Test in Production:
1. Deploy latest changes
2. Sign up with a test email
3. Check email and click confirmation link
4. Monitor for any errors in browser console

## 🚨 Emergency Workaround

If users are stuck with unconfirmed accounts:

### Manual Confirmation (Admin):
1. Go to Supabase Dashboard
2. **Authentication** → **Users**
3. Find the user and click **Send confirmation email**

### Or use SQL (Admin only):
```sql
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'user@example.com';
```

## 📊 Monitoring

### Check Logs:
1. **Browser Console**: Look for JavaScript errors
2. **Supabase Logs**: Check authentication logs
3. **Server Logs**: Monitor API responses

### Common Error Messages:
- "Invalid confirmation link"
- "Token expired"
- "User not found"
- "Confirmation failed"

## ✅ Resolution Checklist

- [ ] Email template uses `{{ .RedirectTo }}`
- [ ] Site URL configured correctly
- [ ] Signup API uses dynamic `emailRedirectTo`
- [ ] Confirmation page handles multiple token formats
- [ ] CORS settings include all domains
- [ ] SSL certificate valid (production)
- [ ] DNS propagation complete (production)

## 🔄 Next Steps

1. Apply the fixes above
2. Test in development environment
3. Deploy to production
4. Test with real email addresses
5. Monitor user feedback

If issues persist, check the debug information displayed on the confirmation page for specific error details. 