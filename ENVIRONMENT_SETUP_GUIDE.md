# Environment Setup Guide

## 🎯 The Problem
Your production emails aren't working because:
1. **NEXTAUTH_URL mismatch** in Northflank
2. **Mixed dev/prod URLs** in Supabase
3. **Email template getting wrong redirect URL**

## 🔧 Complete Fix

### Step 1: Fix Northflank Environment Variables

**CHANGE this in Northflank:**
```
❌ NEXTAUTH_URL=https://public--aris--kbjxqzmz14yd.code.run
✅ NEXTAUTH_URL=https://app.helloaris.com
```

**Keep all other variables the same.**

### Step 2: Clean Up Supabase Redirect URLs

**In Supabase Dashboard > Authentication > URL Configuration:**

**REMOVE these old URLs:**
- `https://public--aris--kbjxqzmz14yd.code.run/*` (ALL of them)

**KEEP ONLY these URLs:**
```
# For Development
http://localhost:3000/auth/confirm
http://localhost:3000
http://127.0.0.1:3000/auth/confirm
http://127.0.0.1:3000

# For Production  
https://app.helloaris.com/auth/confirm
https://app.helloaris.com
```

### Step 3: Create .env.local for Development

Create `.env.local` in your project root:

```env
# Development Environment Variables
# This file is for LOCAL DEVELOPMENT ONLY

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration - SAME PROJECT FOR DEV AND PROD
NEXT_PUBLIC_SUPABASE_URL=https://ehhaeqmwolhnwylnqdto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoaGFlcW13b2xobnd5bG5xZHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDYzMDYsImV4cCI6MjA2NTEyMjMwNn0.NTEF0Gm7vIfHUMTnKrX9I4vcFyR6Faur6VOrKmcXQFM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoaGFlcW13b2xobnd5bG5xZHRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0NjMwNiwiZXhwIjoyMDY1MTIyMzA2fQ.9w93pq4uAv3Qe2v44_cD6eDDrZilsxX1WjBjJ6dDUyA

# Email Configuration
EMAIL_PASS=your_email_password_here
EMAIL_USER=your_email_user_here
IMAP_HOST=imap.gmail.com
IMAP_PORT=993

# NextAuth Configuration - DEV
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://127.0.0.1:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Password Encryption Key
PASSWORD_ENCRYPTION_KEY=your_password_encryption_key_here
```

### Step 4: Deploy and Test

1. **Update Northflank** with the correct NEXTAUTH_URL
2. **Clean Supabase URLs** as shown above
3. **Deploy** the changes
4. **Wait 2-3 minutes** for changes to propagate
5. **Test signup** at `https://app.helloaris.com/signup`

## 🎯 Why This Will Work

1. **Correct NEXTAUTH_URL** → Email template gets right redirect URL
2. **Clean Supabase URLs** → No confusion about where to redirect
3. **Separate dev/prod** → Development still works locally

## 🚀 Expected Result

After these changes:
- ✅ Production signup → Email sent with correct confirmation link
- ✅ Development still works on localhost
- ✅ No more URL confusion
- ✅ Users can actually confirm their emails

## 📝 Key Points

- **Same Supabase project** for dev and prod (users are separated by environment)
- **Different NEXTAUTH_URL** for dev vs prod
- **Clean redirect URLs** prevent confusion
- **Email template uses {{ .RedirectTo }}** which gets URL from NEXTAUTH_URL 