# Organization Setup Guide for CRM Mind

## Overview

CRM Mind supports both individual users and organization-based multi-tenant usage. This document outlines the implementation of the streamlined organization setup process, including sign-up flow, role assignments, and subscription management.

## User Types and Access Models

CRM Mind supports two primary user types:

1. **Individual Users**: Single-user accounts with personal workspaces
2. **Organization Users**: Users belonging to an organization with role-based access control

### Access Model Comparison

| Feature | Individual Users | Organization Users |
|---------|-----------------|-------------------|
| Authentication | Email/password | Email/password |
| Workspace | Personal workspace | Shared organization workspace |
| Subscription | Individual subscription | Organization-wide subscription |
| User Management | Self-managed | Admin-managed with role assignments |
| Billing | Individual billing | Consolidated organization billing |
| Data Isolation | Personal data only | Organization-wide data with role-based access |

## Sign-Up Flow

The enhanced sign-up flow now supports both individual and organization-based registration:

### Individual User Sign-Up
1. User navigates to the sign-up page
2. User selects the "Individual" tab
3. User enters personal details (name, email, password)
4. User submits the form
5. User receives email confirmation
6. Upon confirmation, user can access their personal workspace

### Organization Admin Sign-Up
1. User navigates to the sign-up page
2. User selects the "Organization Admin" tab
3. User enters personal details (name, email, password)
4. User checks "I am creating an organization"
5. User enters organization details:
   - Organization name
   - Organization slug (auto-generated but editable)
   - Subscription plan selection
6. User submits the form
7. System creates user account and organization simultaneously
8. User receives email confirmation
9. Upon confirmation, user can access the organization workspace as an admin

## Organization Creation Process

When a user signs up as an organization admin, the following happens behind the scenes:

1. User account is created in Supabase authentication
2. Organization record is created with the specified name and slug
3. User is assigned to the organization with admin role
4. User is granted both "admin" and "owner" roles for full control
5. Subscription plan is assigned to the organization

## Role-Based Access Control

CRM Mind implements a comprehensive role-based access control system:

### Default Roles

1. **Owner**: Full system access with all permissions
2. **Admin**: Administrative access with user management capabilities
3. **Member**: Standard user with limited administrative capabilities
4. **Guest**: Limited access for external collaborators

### Role Assignment

- During organization creation, the creating user is automatically assigned both "admin" and "owner" roles
- Organization admins can invite additional users and assign appropriate roles
- Roles can be modified in the organization settings by users with admin permissions

## Subscription Management

Organizations can select from multiple subscription tiers:

1. **Free**: Basic features with limited usage
2. **Starter**: Essential features for small teams
3. **Pro**: Advanced features for growing businesses
4. **Business**: Enterprise-grade features with higher limits
5. **Enterprise**: Custom solutions with dedicated support

### Subscription Features

- Each tier includes different feature sets and usage limits
- Feature flags control access to premium features based on subscription tier
- User and contact limits are enforced based on subscription tier
- Subscription can be upgraded/downgraded in organization settings

## Organization Settings

After organization creation, admins can configure additional settings:

### Branding Configuration
- Upload organization logo
- Set brand colors and theme
- Configure email templates

### User Management
- Invite new users to the organization
- Assign and modify user roles
- Manage user permissions

### Subscription Management
- View current subscription details
- Upgrade or downgrade subscription
- Manage billing information

## Best Practices

### For Individual Users
- Select the "Individual" tab during sign-up
- Manage personal subscription based on feature needs
- Upgrade to organization account if team collaboration is needed

### For Organization Admins
- Select the "Organization Admin" tab during sign-up
- Choose a descriptive organization name and memorable slug
- Select appropriate subscription tier based on team size and needs
- Configure branding and invite team members after initial setup
- Assign appropriate roles based on user responsibilities

## Technical Implementation

The organization setup flow is implemented through the following components:

1. **Enhanced Sign-Up Form**: Tabs for individual vs. organization sign-up with conditional fields
2. **Organization API**: Endpoint for creating organizations with admin assignment
3. **Role Service**: Automatic role assignment for organization admins
4. **Subscription Service**: Tier-based feature access control

## Troubleshooting

### Common Issues

1. **Email Confirmation Not Received**
   - Check spam folder
   - Verify email address is correct
   - Contact support if issue persists

2. **Organization Creation Failed**
   - Verify organization slug is unique
   - Ensure all required fields are completed
   - Check for network connectivity issues

3. **Role Assignment Issues**
   - Verify user has confirmed their email
   - Check organization permissions
   - Contact system administrator

## Conclusion

The streamlined organization setup process simplifies the onboarding experience for both individual users and organizations. By integrating user creation, organization setup, and role assignment into a single flow, CRM Mind provides a seamless experience that gets users up and running quickly while maintaining proper security and access controls.
