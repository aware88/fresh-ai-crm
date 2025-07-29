# Supabase Auth Security Setup

## Enable Leaked Password Protection

To resolve the final security warning "Leaked Password Protection Disabled", you need to enable this feature in your Supabase dashboard.

### Steps to Enable:

1. **Go to Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard
   - Select your project

2. **Access Authentication Settings**
   - Click on "Authentication" in the left sidebar
   - Go to "Settings" tab
   - Look for "Password Settings" section

3. **Enable Leaked Password Protection**
   - Find the "Leaked Password Protection" toggle
   - Enable it to check passwords against HaveIBeenPwned.org database
   - This prevents users from using compromised passwords

4. **Configure Password Strength (Optional)**
   - Set minimum password length (recommended: 8+ characters)
   - Enable special character requirements
   - Enable number requirements
   - Enable uppercase/lowercase requirements

### Benefits:

✅ **Enhanced Security**: Prevents use of compromised passwords  
✅ **Real-time Protection**: Checks against HaveIBeenPwned database  
✅ **User Safety**: Protects users from credential stuffing attacks  
✅ **Compliance**: Meets security best practices  

### Note:

This setting must be configured through the Supabase dashboard UI - it cannot be set via SQL or API calls.

Once enabled, the security warning will be resolved in your next Supabase linter check.

## Verification

After enabling, run the Supabase linter again to confirm all security warnings are resolved:

```bash
# The linter should now show no security warnings
```

All security issues should now be resolved! 🔒 