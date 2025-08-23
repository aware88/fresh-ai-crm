# Enable Leaked Password Protection in Supabase Auth

## Issue
Supabase Auth's leaked password protection is currently disabled. This feature prevents users from using compromised passwords by checking against HaveIBeenPwned.org database.

## Solution
This setting must be enabled through the Supabase Dashboard as it's an Auth configuration, not a database setting.

### Steps to Enable:

1. **Access Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `fresh-ai-crm`

2. **Navigate to Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Go to "Settings" tab
   - Look for "Password Security" section

3. **Enable Leaked Password Protection**
   - Find the "Leaked Password Protection" toggle
   - Enable the setting
   - Save changes

### What this does:
- Checks user passwords against HaveIBeenPwned.org database during registration and password changes
- Prevents users from using passwords that have been compromised in data breaches
- Enhances overall security of the application

### Alternative: API Configuration
If you have access to the Supabase Management API, you can also enable this programmatically:

```bash
# Using Supabase CLI (if available)
supabase projects api-settings --project-ref your-project-ref --leaked-password-protection true
```

### Verification
After enabling, you can verify the setting by:
1. Checking the Authentication Settings in the dashboard
2. Testing password registration with a known compromised password (it should be rejected)

## Status
⚠️ **MANUAL ACTION REQUIRED**: This must be configured through the Supabase Dashboard by a project administrator.

## Security Impact
- **Before**: Users could potentially use compromised passwords
- **After**: System will reject passwords found in breach databases, significantly improving security posture
