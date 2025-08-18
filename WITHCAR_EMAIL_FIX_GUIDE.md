# WithCar Email Connection Fix Guide

## 🎯 Problem Summary

The WithCar organization is experiencing issues connecting the `negozio@withcar.it` email account to the CRM system. The IT team reported:

- **Error 404**: "This page could not be found" when trying to delete the existing email connection
- **Root Cause**: `negozio@withcar.it` is a **shared mailbox** that requires access through a licensed Microsoft 365 user
- **Solution**: Use a licensed user account to access the shared mailbox

## 📧 Email Accounts Involved

| Email | Type | Purpose |
|-------|------|---------|
| `negozio@withcar.it` | Shared Mailbox | Target email for customer communications |
| `zarfin.jakupovic@withcar.si` | Licensed User | Licensed account to access shared mailbox |

## 🔧 Solution Overview

Microsoft 365 shared mailboxes cannot be accessed directly. They require:
1. A licensed Microsoft 365 user account for authentication
2. Proper permissions granted to the licensed user
3. Access through Microsoft Graph API using the licensed user's OAuth token

## 📋 Step-by-Step Fix

### Step 1: Clean Up Existing Problematic Entries

```bash
npm run fix:withcar-email
```

This script will:
- ✅ Analyze current email account entries
- ✅ Remove problematic `negozio@withcar.it` entries causing 404 errors
- ✅ Show detailed setup instructions

### Step 2: Microsoft 365 Admin Configuration

**A) Grant Shared Mailbox Access:**
1. Login to [Microsoft 365 Admin Center](https://admin.microsoft.com)
2. Go to **Teams & groups** > **Shared mailboxes**
3. Find and select: `negozio@withcar.it`
4. Click **Edit** > **Members**
5. Add member: `zarfin.jakupovic@withcar.si`
6. Grant permissions:
   - ✅ **Full access** (read emails)
   - ✅ **Send as** (send emails)

**B) Verify Application Permissions:**
1. Go to [Azure AD Admin Center](https://aad.portal.azure.com)
2. Navigate to **App registrations**
3. Find your CRM application
4. Ensure these **API permissions** are granted:
   - `Mail.Read` (Delegated)
   - `Mail.Send` (Delegated) 
   - `Mail.ReadWrite` (Delegated)
5. Click **Grant admin consent** if needed

### Step 3: Connect Licensed User Account

1. **Login to CRM**: Access your CRM system
2. **Navigate to Settings**: Go to **Settings** > **Email Accounts**
3. **Connect Microsoft Account**: Click **"Connect Microsoft Account"**
4. **Authenticate**: Login with `zarfin.jakupovic@withcar.si`
5. **Grant Permissions**: Accept all requested permissions
6. **Verify Connection**: Ensure the account appears as connected

### Step 4: Fetch Emails from Shared Mailbox

```bash
npm run fetch:withcar-shared
```

This script will:
- ✅ Use the licensed user's OAuth token
- ✅ Access both the licensed user's mailbox and shared mailbox
- ✅ Fetch emails from `negozio@withcar.it` 
- ✅ Store emails in database for AI processing

## 🧪 Testing & Verification

### Test Connection
```bash
# Test the email connection
npm run fetch:withcar-shared
```

**Expected Output:**
```
📮 WITHCAR SHARED MAILBOX FETCHER
═══════════════════════════════════════════════════════════
🔐 Licensed User: zarfin.jakupovic@withcar.si
📧 Shared Mailbox: negozio@withcar.it

✅ Access token is valid
✅ Licensed user mailbox accessible (6 folders)
✅ Shared mailbox accessible (4 folders)
📊 Total emails fetched: 150
```

### Verify Database Storage
Check that emails are properly stored with:
- ✅ Correct organization ID (WithCar)
- ✅ Proper metadata (`withcar_import: true`)
- ✅ Source tracking (`withcar_source: 'shared'`)

## 🔧 Troubleshooting

### Issue: Authentication Error (401)
**Cause**: OAuth token expired or invalid
**Solution**:
1. Reconnect the licensed user account
2. Go to Settings > Email Accounts
3. Disconnect and reconnect `zarfin.jakupovic@withcar.si`

### Issue: Permission Error (403)
**Cause**: Licensed user lacks access to shared mailbox
**Solution**:
1. Verify Step 2A was completed correctly
2. Wait up to 60 minutes for permissions to propagate
3. Check that both "Full access" and "Send as" are granted

### Issue: Shared Mailbox Not Found
**Cause**: Incorrect mailbox address or permissions
**Solution**:
1. Verify `negozio@withcar.it` exists in Microsoft 365
2. Ensure it's configured as a shared mailbox
3. Check spelling and domain name

## 📊 Expected Results

After successful setup:

1. **Email Fetching**: 
   - Inbox emails from `negozio@withcar.it`
   - Sent emails from `negozio@withcar.it`
   - Historical emails (up to 100 per folder)

2. **Database Storage**:
   - Emails stored in `emails` table
   - Linked to WithCar organization
   - Tagged for AI processing

3. **AI Processing**:
   - Automatic email classification
   - Response generation in multiple languages
   - Integration with Metakocka API

## 🚀 Production Deployment

Once testing is successful:

1. **Schedule Regular Fetching**:
   ```bash
   # Add to cron job or scheduler
   0 */6 * * * cd /path/to/crm && npm run fetch:withcar-shared
   ```

2. **Monitor Performance**:
   - Check logs for errors
   - Verify email processing rates
   - Monitor API rate limits

3. **Backup Configuration**:
   - Document all settings
   - Export OAuth configuration
   - Save permission settings

## 📞 Support Information

If issues persist:

1. **CRM Support**: Contact your CRM system administrator
2. **Microsoft Support**: Use Microsoft 365 admin support
3. **IT Team**: Coordinate with WithCar IT team for permissions

## 🔄 Alternative Approaches

If the shared mailbox approach doesn't work:

1. **App Password Method**: Create app-specific password for IMAP
2. **Email Forwarding**: Forward emails to a licensed account
3. **Alias Configuration**: Set up `negozio@withcar.it` as alias for licensed user

---

**Last Updated**: December 2024  
**Status**: Ready for Implementation  
**Priority**: High - Resolves critical email connectivity issue







