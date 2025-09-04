# Production OAuth Configuration Guide

**Critical:** These steps must be completed before deploying to production (app.helloaris.com)

## Current Status ⚠️
- **Development:** OAuth configured for `localhost:3000` 
- **Production:** Requires domain updates for `app.helloaris.com`

## Required Changes for Production

### 1. Environment Variables (Northflank) ✅

Update these environment variables in Northflank:

```bash
# Base URL - CRITICAL!
NEXTAUTH_URL=https://app.helloaris.com

# Microsoft OAuth (if using)
MICROSOFT_CLIENT_ID=your_microsoft_app_id
MICROSOFT_CLIENT_SECRET=your_microsoft_app_secret
MICROSOFT_TENANT_ID=common  # or your specific tenant

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 2. Microsoft Azure App Registration Updates ⚠️

**In Azure Portal > App registrations > Your App:**

1. **Redirect URIs** - Add production URL:
   - Remove: `http://localhost:3000/api/auth/outlook/callback`
   - Add: `https://app.helloaris.com/api/auth/outlook/callback`

2. **Web Platform Configuration:**
   - Redirect URI: `https://app.helloaris.com/api/auth/outlook/callback`
   - Logout URL: `https://app.helloaris.com/auth/signout`

3. **API Permissions** (keep existing):
   - `Mail.Read`
   - `Mail.Send` (if sending emails)
   - `User.Read`

### 3. Google Cloud Console Updates ⚠️

**In Google Cloud Console > APIs & Services > Credentials:**

1. **OAuth 2.0 Client IDs** - Update your web application:
   - **Authorized origins**: Add `https://app.helloaris.com`
   - **Authorized redirect URIs**: 
     - Remove: `http://localhost:3000/api/auth/google/callback`
     - Add: `https://app.helloaris.com/api/auth/google/callback`

### 4. Code Changes ✅ (Already Fixed)

The following files have been updated to use dynamic URLs:
- ✅ `/src/app/api/auth/outlook/callback/route.ts` - Now uses `getBaseUrl(request)`
- ✅ `/src/app/api/auth/google/callback/route.ts` - Already uses `BASE_URL` from environment
- ✅ `/src/app/api/auth/imap/connect/route.ts` - No hardcoded URLs

## Testing Checklist

### Before Production Deployment:
- [ ] Update Azure App Registration redirect URIs
- [ ] Update Google OAuth credentials redirect URIs  
- [ ] Set `NEXTAUTH_URL=https://app.helloaris.com` in Northflank
- [ ] Deploy to production
- [ ] Test Microsoft OAuth flow on production
- [ ] Test Google OAuth flow on production
- [ ] Test IMAP account creation on production
- [ ] Verify subscription limits work on production

### After Production Deployment:
- [ ] Verify multi-email account system works
- [ ] Test email account switcher
- [ ] Verify subscription limit enforcement
- [ ] Test primary/secondary account roles

## Deployment Steps

### Step 1: Update OAuth Provider Settings
1. **Microsoft Azure**: Update redirect URIs to production domain
2. **Google Cloud Console**: Update authorized origins and redirect URIs

### Step 2: Update Northflank Environment Variables
```bash
NEXTAUTH_URL=https://app.helloaris.com
# Keep all other OAuth client IDs and secrets the same
```

### Step 3: Deploy to Production
1. Push changes to GitHub
2. Northflank will auto-deploy
3. Test OAuth flows immediately after deployment

### Step 4: Test Multi-Email System
1. Try adding Gmail account
2. Try adding Outlook account  
3. Try adding IMAP account
4. Test subscription limits (Starter: 1, Pro: 2, Premium: 3)
5. Test account switching in Email dashboard

## Troubleshooting

### OAuth Redirect Errors
**Error:** "Redirect URI mismatch"
**Fix:** Ensure OAuth provider settings match production domain exactly

### Environment Variable Issues  
**Error:** OAuth flows redirect to localhost
**Fix:** Verify `NEXTAUTH_URL=https://app.helloaris.com` in Northflank

### Subscription Limits Not Working
**Error:** Users can add unlimited accounts
**Fix:** Check database migration for `email_accounts` table with `organization_id`

## Security Notes

1. **Never commit OAuth secrets** to git repository
2. **Use HTTPS only** in production redirects
3. **Validate redirect URIs** in OAuth provider settings
4. **Monitor OAuth usage** in provider dashboards
5. **Rotate secrets regularly** for security

## Domain Verification

Some OAuth providers require domain verification:
- **Microsoft**: May require domain ownership verification
- **Google**: Verify domain in Google Search Console

---

**Status:** Ready for production deployment once OAuth providers are updated with production domain.
**Last Updated:** 2025-01-01