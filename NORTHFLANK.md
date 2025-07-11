# Fresh AI CRM - Northflank Deployment Guide

This guide provides instructions for deploying Fresh AI CRM to Northflank while maintaining Render as a backup deployment option.

## Prerequisites

- Northflank account
- Git repository access
- Supabase project with proper configuration

## Configuration Files

The following files have been added/modified for Northflank deployment:

1. **Dockerfile** - Container definition for the application
2. **northflank.yaml** - Northflank service configuration
3. **next.config.js** - Updated with `output: 'standalone'` for containerized deployment
4. **.dockerignore** - Excludes unnecessary files from the Docker build

## Deployment Steps

### 1. Create a Northflank Project

1. Log in to your Northflank account
2. Create a new project (e.g., "fresh-ai-crm")
3. Connect your Git repository

### 2. Configure Environment Variables

Set up the following environment variables in Northflank:

```
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
NEXTAUTH_URL=https://your-northflank-domain.northflank.app (or your custom domain)
NEXTAUTH_SECRET=your_nextauth_secret
APP_SECRET=your_application_secret
ENCRYPTION_KEY=your_encryption_key
NEXT_PUBLIC_ENABLE_EMAIL_INTEGRATION=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
LOG_LEVEL=info
ENABLE_DEBUG_LOGS=false
```

### 3. Create a PostgreSQL Addon (Optional)

If you want to use Northflank's managed PostgreSQL instead of Supabase:

1. Create a PostgreSQL addon in your Northflank project
2. Connect it to your service
3. Update your environment variables to use this database

### 4. Deploy the Service

1. Create a new service in your Northflank project
2. Use the Dockerfile deployment option
3. Configure resources (CPU, memory) based on your needs
4. Set up health checks to monitor your application
5. Configure auto-scaling if needed

### 5. Set Up Custom Domain (Optional)

1. Add your custom domain in the Northflank dashboard
2. Configure DNS settings as instructed
3. Update `NEXTAUTH_URL` environment variable to match your custom domain

## Advantages of Northflank Deployment

1. **Longer-running serverless functions** - Supports the 30-second timeout needed for email processing
2. **Managed database addon** - Included in the free Developer Sandbox
3. **Auto-scaling** - Scales based on demand
4. **Health monitoring** - Built-in health checks
5. **Resource control** - Fine-grained control over CPU and memory allocation

## Keeping Render as Backup

To maintain Render as a backup deployment option:

1. Keep the `render.yaml` file in your repository
2. Maintain a separate Git branch for Render-specific configurations
3. The Dockerfile and Northflank configurations won't interfere with Render deployment

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Docker build logs
   - Ensure all dependencies are properly installed

2. **Runtime Errors**
   - Check application logs in Northflank dashboard
   - Verify all environment variables are set correctly

3. **Database Connection Issues**
   - Check database connection string
   - Verify network policies allow connections

## Monitoring and Maintenance

- Use Northflank's built-in monitoring tools
- Set up alerts for critical metrics
- Regularly check application logs for errors

## Rollback Procedure

If you need to roll back to Render:

1. Ensure your Render deployment is up to date
2. Update DNS settings to point to your Render deployment
3. Verify application functionality after the switch
