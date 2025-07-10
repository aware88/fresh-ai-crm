# Production Deployment Guide for Fresh AI CRM

This guide will walk you through deploying the Fresh AI CRM application to production using Render.

## Prerequisites

1. A Supabase account and project set up
2. A Render account
3. Domain name (e.g., helloaris.com) with DNS access

## Deployment Steps

### 1. Set Up Supabase

Ensure your Supabase project is properly configured:

1. Create a new Supabase project (or use existing one)
2. Run all database migrations:
   ```bash
   npm run db:migrate
   ```
3. Set up authentication providers in Supabase dashboard
4. Configure RLS policies for your tables
5. Note your Supabase URL and API keys

### 2. Configure Environment Variables on Render

When deploying to Render, you'll need to set up the following environment variables:

```
# Application Configuration
NODE_ENV=production
PORT=10000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# NextAuth Configuration
NEXTAUTH_URL=https://helloaris.com
NEXTAUTH_SECRET=your_nextauth_secret

# Email Configuration (if needed)
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@helloaris.com

# Application Secrets
APP_SECRET=your_application_secret
ENCRYPTION_KEY=your_encryption_key

# Feature Flags
NEXT_PUBLIC_ENABLE_EMAIL_INTEGRATION=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Logging
LOG_LEVEL=info
ENABLE_DEBUG_LOGS=false
```

### 3. Deploy to Render

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Select the repository and branch
4. Configure the service:
   - Name: aris-crm
   - Environment: Node
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
   - Set all environment variables from the list above

### 4. Connect Your Domain

1. In Render dashboard, go to your web service
2. Navigate to "Settings" > "Custom Domain"
3. Add your domain (helloaris.com)
4. Follow Render's instructions to update DNS records

### 5. Set Up SSL

Render automatically provisions SSL certificates for custom domains. Ensure your DNS is properly configured to allow certificate validation.

### 6. Verify Deployment

1. Visit your domain (https://helloaris.com)
2. Test sign-up and sign-in functionality
3. Verify that all backend API endpoints are working correctly

## Connecting Landing Page to Backend

If you have a separate landing page that needs to connect to your backend:

1. Update API endpoints in your landing page code to point to your production backend
2. Ensure CORS is properly configured in your backend to allow requests from your landing page domain
3. Set up proper authentication flow between the landing page and backend

## Monitoring and Maintenance

1. Set up monitoring using Render's built-in monitoring tools
2. Configure alerts for any service disruptions
3. Regularly check logs for any errors or issues

## Troubleshooting

If you encounter issues with your deployment:

1. Check Render logs for any build or runtime errors
2. Verify all environment variables are correctly set
3. Ensure your Supabase project is properly configured
4. Test API endpoints using tools like Postman or cURL
