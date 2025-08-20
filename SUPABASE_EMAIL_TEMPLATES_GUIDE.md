# Supabase Email Templates Configuration

## 🎯 Issue Summary

**Problem**: The invite email template in Supabase is generic and doesn't match the branded confirmation email.

**Current Templates**:
- ✅ **Confirmation Email**: Branded with ARIS styling and proper redirect
- ❌ **Invitation Email**: Generic template with basic styling

## 📧 Current Templates Analysis

### ✅ Confirmation Email (Working Well)
```html
<h2>Confirm your signup</h2>
<p>Welcome to ARIS! 🎉</p>
<p>Thank you for signing up! To complete your registration, please confirm your email address by clicking the link below:</p>
<p style="margin: 30px 0;">
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard" 
     style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; 
            text-decoration: none; border-radius: 6px; display: inline-block; 
            font-weight: bold;">
    Confirm your email
  </a>
</p>
<p style="color: #999999; font-size: 14px;">
  If you didn't sign up for ARIS, you can safely ignore this email.
</p>
```

### ❌ Invitation Email (Needs Update)
```html
<h2>You have been invited</h2>
<p>You have been invited to create a user on {{ .SiteURL }}. Follow this link to accept the invite:</p>
<p><a href="{{ .ConfirmationURL }}">Accept the invite</a></p>
```

## 🔧 How to Fix Email Templates

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Email Templates**

### Step 2: Update Invitation Email Template

Replace the current invitation template with this branded version:

```html
<h2>You've been invited to join ARIS! 🎉</h2>
<p>Hello!</p>
<p>You have been invited to join <strong>ARIS</strong>, a powerful AI-powered CRM system. To accept your invitation and create your account, please click the button below:</p>

<p style="margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; 
            text-decoration: none; border-radius: 6px; display: inline-block; 
            font-weight: bold;">
    Accept Invitation & Create Account
  </a>
</p>

<p>After clicking the link, you'll be able to:</p>
<ul>
  <li>✅ Set up your secure password</li>
  <li>✅ Access your organization's CRM</li>
  <li>✅ Connect your email accounts</li>
  <li>✅ Start managing contacts and communications</li>
</ul>

<p style="color: #999999; font-size: 14px;">
  If you didn't expect this invitation or have any questions, please contact the person who invited you or our support team.
</p>

<p style="color: #999999; font-size: 12px; margin-top: 30px;">
  This invitation was sent from {{ .SiteURL }}
</p>
```

### Step 3: Update Other Templates (Optional)

You might also want to update:

#### Password Recovery Email
```html
<h2>Reset your ARIS password</h2>
<p>Hello!</p>
<p>We received a request to reset your password for your ARIS account. Click the button below to create a new password:</p>

<p style="margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; 
            text-decoration: none; border-radius: 6px; display: inline-block; 
            font-weight: bold;">
    Reset Password
  </a>
</p>

<p style="color: #999999; font-size: 14px;">
  If you didn't request a password reset, you can safely ignore this email.
</p>
```

#### Magic Link Email
```html
<h2>Sign in to ARIS</h2>
<p>Hello!</p>
<p>Click the button below to sign in to your ARIS account:</p>

<p style="margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; 
            text-decoration: none; border-radius: 6px; display: inline-block; 
            font-weight: bold;">
    Sign In to ARIS
  </a>
</p>

<p style="color: #999999; font-size: 14px;">
  This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.
</p>
```

## 🎨 Template Variables Available

Supabase provides these variables for email templates:

- `{{ .SiteURL }}` - Your site URL
- `{{ .ConfirmationURL }}` - The confirmation/action URL
- `{{ .TokenHash }}` - Token hash for manual URL construction
- `{{ .Token }}` - Raw token (less secure, use TokenHash instead)
- `{{ .RedirectTo }}` - Redirect URL after confirmation
- `{{ .Email }}` - User's email address

## ✅ Expected Results

After updating the templates:

1. **Branded Experience**: All emails will have consistent ARIS branding
2. **Clear Call-to-Action**: Prominent buttons instead of plain links
3. **Better UX**: More informative and welcoming content
4. **Professional Look**: Styled emails that match your application

## 🔧 Testing the Templates

After updating:

1. **Test Invitation**: Try inviting a user (like Zarfin) again
2. **Test Confirmation**: Create a test signup to verify confirmation email
3. **Test Recovery**: Try password reset flow
4. **Check Spam**: Ensure emails don't go to spam folder

## 📞 Support

If you need help with the templates:
1. Check Supabase documentation on email templates
2. Test with a personal email first
3. Monitor email delivery and spam scores
4. Contact Supabase support if emails aren't being delivered

---

**Note**: Email template changes take effect immediately. Test with a non-production email first to ensure the formatting looks correct.




