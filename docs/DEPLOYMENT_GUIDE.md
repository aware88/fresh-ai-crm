# CRM Mind Deployment Guide

## Overview

This guide provides instructions for deploying CRM Mind to production environments. CRM Mind is designed to be deployed on modern cloud platforms with support for Node.js applications.

## Prerequisites

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Supabase account (for authentication and storage)
- OpenAI API key
- Stripe account (for subscription management)
- Domain name (for production deployment)

## Deployment Options

### 1. Automated Deployment Script

CRM Mind includes a deployment script that handles the entire deployment process:

```bash
./scripts/deployment/deploy.sh [environment]
```

This script:
- Builds the application
- Runs database migrations
- Creates a versioned release
- Updates the symlink to the current release
- Restarts the application service

### 2. Manual Deployment

If you prefer to deploy manually, follow these steps:

1. **Build the application**:
   ```bash
   npm ci
   npm run build
   ```

2. **Run database migrations**:
   ```bash
   npm run migrate:deploy
   ```

3. **Start the application**:
   ```bash
   npm start
   ```

### 3. Docker Deployment

CRM Mind can also be deployed using Docker:

1. **Build the Docker image**:
   ```bash
   docker build -t crm-mind .
   ```

2. **Run the container**:
   ```bash
   docker run -p 3000:3000 --env-file .env.production crm-mind
   ```

## Environment Configuration

Create a `.env.production` file with the following variables:

```
# Core
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key
OPENAI_MAX_TOKENS=1000

# Email
RESEND_API_KEY=your-resend-api-key
ALERT_EMAIL_FROM=alerts@your-domain.com

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Monitoring
LOG_LEVEL=info
LOG_DIR=/var/log/crm-mind
METRICS_PORT=9100
SENTRY_DSN=your-sentry-dsn
```

## Database Setup

1. **Create a PostgreSQL database**:
   ```sql
   CREATE DATABASE crm_mind;
   ```

2. **Run migrations**:
   ```bash
   npm run migrate:deploy
   ```

## Domain Configuration

1. **Configure your domain DNS**:
   - Add an A record pointing to your server IP
   - Add CNAME records for subdomains if needed

2. **Set up SSL**:
   - Use Let's Encrypt for free SSL certificates
   ```bash
   certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

## Monitoring Setup

CRM Mind includes a monitoring setup script:

```bash
./scripts/deployment/monitoring-setup.sh
```

This script sets up:
- Winston for logging
- Prometheus for metrics
- Sentry for error tracking
- Health check endpoints

## Scaling Considerations

### Horizontal Scaling

For high-traffic deployments, consider:

1. **Load Balancer**: Deploy multiple instances behind a load balancer
2. **Database Scaling**: Use connection pooling and read replicas
3. **Caching**: Implement Redis for caching frequently accessed data
4. **CDN**: Use a CDN for static assets

### Vertical Scaling

For moderate traffic:

1. **Increase Server Resources**: Add more CPU/RAM to your server
2. **Database Optimization**: Tune PostgreSQL for better performance

## Backup Strategy

1. **Database Backups**:
   ```bash
   pg_dump crm_mind > backup_$(date +%Y%m%d).sql
   ```

2. **Automated Backups**:
   - Set up a cron job for daily backups
   - Store backups off-site or in cloud storage

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check database credentials
   - Verify network connectivity
   - Check firewall rules

2. **API Rate Limiting**:
   - Adjust rate limits in environment variables
   - Implement caching for frequent API calls

3. **Memory Issues**:
   - Adjust Node.js memory limit: `NODE_OPTIONS=--max-old-space-size=4096`

## Security Best Practices

1. **Keep Dependencies Updated**:
   ```bash
   npm audit
   npm update
   ```

2. **Enable Security Headers**:
   - Content-Security-Policy
   - X-XSS-Protection
   - X-Frame-Options

3. **Regular Security Audits**:
   - Run security scans
   - Review access logs

## Conclusion

Following this guide will help you deploy CRM Mind securely and efficiently. For additional support, refer to the documentation or contact the development team.
