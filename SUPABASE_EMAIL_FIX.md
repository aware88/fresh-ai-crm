# 🚨 CRITICAL: Supabase Email Confirmation Fix

## **Problem Identified**
Your confirmation email tokens are coming back as `null` because of incorrect Supabase email template configuration.

## **Root Cause**
Supabase email templates need to use the correct parameter names for confirmation tokens.

## **Solution Steps**

### **Step 1: Fix Supabase Email Template**

1. **Go to Supabase Dashboard** → Authentication → Email Templates
2. **Find "Confirm signup" template**
3. **Update the confirmation link to use:**

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard">
  Confirm your signup
</a>
```

**NOT:**
```html
<a href="{{ .SiteURL }}/auth/confirm?token={{ .Token }}&type=signup">
  Confirm your signup
</a>
```

### **Step 2: Verify Site URL Configuration**

In Supabase Dashboard → Authentication → Settings:

- **Site URL**: `https://app.helloaris.com` ✅
- **Redirect URLs**: 
  - `https://app.helloaris.com/auth/confirm` ✅
  - `http://localhost:3000/auth/confirm` ✅

### **Step 3: Test the Fix**

1. **Delete the test user** from Supabase
2. **Sign up again** with `tim.mak@bulknutrition.eu`
3. **Check the confirmation email** - it should now have proper tokens

### **Step 4: Alternative - Update Confirmation Page**

If the template fix doesn't work, update your confirmation page to handle multiple token formats:

```typescript
// Extract URL parameters - handle multiple token formats
const token_hash = searchParams.get('token_hash');
const token = searchParams.get('token');
const confirmation_token = searchParams.get('confirmation_token');
const type = searchParams.get('type');

// Try different token parameter names
const actualToken = token_hash || token || confirmation_token;
```

## **Why This Happens**

Supabase uses different parameter names in different contexts:
- `token_hash` - Most common for email confirmations
- `token` - Alternative format
- `confirmation_token` - Some templates use this

Your current template is likely using the wrong parameter name.

## **Production Verification**

After fixing the template:
1. **Test signup flow** in production
2. **Check email delivery** 
3. **Verify confirmation works**
4. **Monitor for any remaining issues**

## **Next Steps**

1. **Fix the email template** in Supabase Dashboard
2. **Test the signup flow**
3. **If still broken**, update the confirmation page code
4. **Deploy and verify** in production

---

**Priority: CRITICAL** - This affects all new user signups in production. 