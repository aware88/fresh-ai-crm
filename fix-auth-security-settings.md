# Fix Auth Security Settings

## Enable Leaked Password Protection

To enable leaked password protection in Supabase Auth:

### Method 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings**
3. Scroll down to **Security** section
4. Find **Password Protection** settings
5. Toggle ON **"Check against HaveIBeenPwned database"**
6. Save the changes

### Method 2: Via Supabase CLI (if available)

```bash
supabase settings update --auth-enable-leaked-password-protection=true
```

### Method 3: Via REST API

```bash
curl -X PATCH 'https://api.supabase.com/v1/projects/{project-id}/config/auth' \
  -H 'Authorization: Bearer {access-token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "SECURITY_PASSWORD_STRENGTH_ENABLED": true,
    "SECURITY_PASSWORD_LEAKED_PROTECTION_ENABLED": true
  }'
```

## What This Does

- Checks user passwords against the HaveIBeenPwned database during registration and password changes
- Prevents users from using passwords that have been compromised in data breaches
- Enhances overall security of your application
- This is a warning-level issue, so it won't break functionality but improves security

## Additional Security Recommendations

1. **Password Strength**: Ensure minimum password requirements are set
2. **MFA**: Consider enabling Multi-Factor Authentication
3. **Session Management**: Configure appropriate session timeouts
4. **Email Verification**: Ensure email verification is required for new accounts

## Notes

- This setting only affects new password creations/changes
- Existing users with compromised passwords will need to change their passwords
- The check happens in real-time during password submission
- No user data is sent to HaveIBeenPwned - only password hashes are checked








