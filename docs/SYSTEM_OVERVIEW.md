# CRM Mind System Overview

## Introduction

CRM Mind is a comprehensive customer relationship management system with AI-powered features, Metakocka ERP integration, and white-label capabilities. This document provides an overview of the system architecture, components, and deployment process.

## System Architecture

CRM Mind follows a modern web application architecture with the following key components:

1. **Frontend**: Next.js-based React application with server-side rendering
2. **Backend**: Next.js API routes and serverless functions
3. **Database**: PostgreSQL with Supabase for authentication and storage
4. **AI Integration**: OpenAI API for document processing and email assistance
5. **ERP Integration**: Metakocka API for business operations
6. **Subscription Management**: Stripe API for billing and subscriptions

## Core Components

### Admin Dashboard

The admin dashboard provides comprehensive management capabilities:

- **Organization Management**: Create, view, edit, and delete organizations
- **User Management**: Manage users across organizations
- **Subscription Management**: View and manage subscription plans and status
- **Analytics**: View system-wide analytics and metrics
- **Role-Based Access Control**: Granular permission system for admin functions

Access the admin dashboard at `/admin`.

### Subscription System

CRM Mind uses a tiered subscription model with the following features:

- **Subscription Plans**: Multiple tiers with different feature sets
- **Feature Flags**: Control access to features based on subscription level
- **User/Contact Limits**: Enforce usage limits based on subscription
- **Billing Integration**: Seamless integration with Stripe for payments
- **Trial Support**: Free trial period for new organizations

Key database tables:
- `subscription_plans`: Available subscription plans
- `organization_subscriptions`: Organization subscription records
- `subscription_invoices`: Billing records

### White-Label System

The white-label system allows organizations to customize the CRM appearance:

- **Branding**: Custom logo, colors, and fonts
- **Domain Customization**: Support for custom domains
- **Email Branding**: Customized email templates and signatures
- **UI Theming**: Dynamic theme application throughout the application

Key database tables:
- `organization_branding`: Stores branding settings for each organization

### Metakocka Integration

CRM Mind integrates deeply with the Metakocka ERP system:

- **Bidirectional Sync**: Sync products, contacts, and sales documents
- **Inventory Management**: Real-time inventory data from Metakocka
- **AI Context Enhancement**: Enrich AI responses with ERP data
- **Error Logging**: Comprehensive error tracking and management

Key database tables:
- `metakocka_credentials`: API credentials for Metakocka
- `metakocka_product_mappings`: Product sync mappings
- `metakocka_contact_mappings`: Contact sync mappings
- `metakocka_sales_document_mappings`: Sales document sync mappings

## Deployment Process

CRM Mind can be deployed using the provided deployment script:

```bash
./scripts/deployment/deploy.sh [environment]
```

The deployment process includes:

1. Building the application
2. Running database migrations
3. Creating a versioned release
4. Updating the symlink to the current release
5. Restarting the application service

## Monitoring

CRM Mind includes comprehensive monitoring capabilities:

- **Logging**: Winston-based logging with rotation
- **Metrics**: Prometheus metrics for system performance
- **Error Tracking**: Sentry integration for error reporting
- **Health Checks**: API endpoint for system health monitoring

Set up monitoring using the provided script:

```bash
./scripts/deployment/monitoring-setup.sh
```

## Security

CRM Mind implements several security measures:

- **Row-Level Security**: Database-level access control
- **Role-Based Access**: Permission system for user actions
- **API Authentication**: JWT-based authentication for all API calls
- **Webhook Verification**: Signature verification for webhooks
- **Data Isolation**: Multi-tenant data isolation

## Database Migrations

Database schema changes are managed through migration files in `src/lib/db/migrations/`. To apply migrations:

```bash
npm run migrate:deploy
```

## API Documentation

API endpoints are organized by feature area:

- `/api/admin/*`: Admin dashboard endpoints
- `/api/organizations/*`: Organization management
- `/api/users/*`: User management
- `/api/subscriptions/*`: Subscription management
- `/api/integrations/metakocka/*`: Metakocka integration
- `/api/ai/*`: AI processing endpoints

## Next Steps

1. **Testing**: Run the comprehensive test suite
2. **Performance Optimization**: Identify and optimize bottlenecks
3. **Feature Expansion**: Add additional AI capabilities
4. **Mobile Support**: Enhance mobile responsiveness
