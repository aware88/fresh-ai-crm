# Organization Management Documentation

## Overview

The CRM Mind organization management system provides a comprehensive interface for administrators to manage multiple organizations within the white-label CRM platform. This document covers the organization management UI, API endpoints, and key features.

## Admin Organization Management UI

### Pages

1. **Organization List** (`/admin/organizations`)
   - Displays all organizations with key information
   - Allows filtering and searching
   - Provides links to view, edit, or create organizations

2. **Organization Details** (`/admin/organizations/[id]`)
   - Shows comprehensive organization information
   - Tabbed interface for different aspects of the organization:
     - Details: Basic organization information
     - Branding: Logo, colors, and custom domain settings
     - Features: Feature flag toggles
     - Users: User management
     - Subscription: Subscription status and management

3. **Create Organization** (`/admin/organizations/new`)
   - Form to create a new organization
   - Auto-generates slug from name
   - Validates slug uniqueness

4. **Edit Organization** (`/admin/organizations/[id]/edit`)
   - Form to edit basic organization details
   - Updates name and slug

### Key Features

#### Branding Management

The branding tab allows administrators to customize the look and feel of each organization's instance:

- **Logo URL**: Set a custom logo for the organization
- **Primary Color**: Set the main brand color
- **Secondary Color**: Set the secondary brand color
- **Custom Domain**: Configure a custom domain for the organization's instance

#### Feature Flag Management

The features tab provides toggles to enable or disable specific features for each organization:

- AI Assistant
- Document Processing
- Advanced Analytics
- Metakocka Integration
- Email Templates
- Bulk Operations
- Custom Fields
- API Access

#### User Management

The users tab displays all users associated with the organization and provides options to:

- View user details
- Edit user information
- Invite new users
- Assign roles to users

#### Subscription Management

The subscription tab shows the organization's current subscription status and provides options to:

- View subscription details
- Manage subscription plans
- View billing history

## API Endpoints

### Organizations

- `GET /api/admin/organizations` - List all organizations
- `POST /api/admin/organizations` - Create a new organization
- `GET /api/admin/organizations/[id]` - Get a specific organization
- `PUT /api/admin/organizations/[id]` - Update a specific organization
- `DELETE /api/admin/organizations/[id]` - Delete a specific organization

### Organization Branding

- `GET /api/admin/organizations/[id]/branding` - Get organization branding
- `PUT /api/admin/organizations/[id]/branding` - Update organization branding

### Organization Features

- `GET /api/admin/organizations/[id]/features` - Get organization feature flags
- `PUT /api/admin/organizations/[id]/features` - Update organization feature flags

### Organization Users

- `GET /api/admin/organizations/[id]/users` - Get users for an organization
- `POST /api/admin/organizations/[id]/users` - Add a user to an organization

## Data Model

### Organizations Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Organization name |
| slug | TEXT | URL-friendly identifier |
| branding | JSONB | Branding settings (logo, colors, domain) |
| feature_flags | JSONB | Enabled/disabled features |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### User Organizations Table

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | Reference to users table |
| organization_id | UUID | Reference to organizations table |
| created_at | TIMESTAMP | Creation timestamp |

## Required Permissions

The following permissions are required to access the organization management features:

- `admin.organizations.view` - View organizations
- `admin.organizations.create` - Create organizations
- `admin.organizations.edit` - Edit organizations
- `admin.organizations.delete` - Delete organizations
- `admin.organizations.users.manage` - Manage organization users

## Best Practices

1. **Unique Slugs**: Ensure organization slugs are unique as they are used in URLs and API endpoints.

2. **Feature Flag Management**: Only enable features that the organization's subscription plan supports.

3. **Custom Domains**: When setting up custom domains, ensure DNS records are properly configured.

4. **User Roles**: Assign appropriate roles to users based on their responsibilities within the organization.

5. **Branding Consistency**: Ensure that branding elements (logo, colors) are consistent with the organization's brand guidelines.

## Testing

To test the organization management functionality:

1. Create a new organization
2. Edit the organization details
3. Configure branding settings
4. Toggle feature flags
5. Add users to the organization
6. Verify that all changes are saved correctly

## Future Enhancements

1. **Bulk Operations**: Add support for bulk operations on organizations (e.g., bulk enable/disable features)

2. **Organization Templates**: Create organization templates with predefined settings

3. **Advanced User Management**: Enhance user management with more detailed role assignments and permissions

4. **Analytics Dashboard**: Add an analytics dashboard for organization-level metrics

5. **Custom Email Templates**: Allow customization of email templates per organization
