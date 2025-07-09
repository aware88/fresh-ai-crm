# Bulk Nutrition Organization Setup

This directory contains scripts to set up and verify the Bulk Nutrition organization in the CRM Mind system. These scripts help you create the organization, configure branding, set up an admin user, and verify RBAC policies.

## Prerequisites

Before running these scripts, make sure you have:

1. A running instance of the CRM Mind application
2. An admin user with appropriate permissions
3. The Bulk Nutrition logo file (PNG format)
4. Node.js and npm installed

## Available Scripts

### 1. Organization Setup

The `setup-bulk-nutrition.js` script creates the Bulk Nutrition organization in the system, configures branding colors, and sets up the subscription plan.

```bash
./run-bulk-nutrition-setup.sh
```

### 2. Logo Upload

The `upload-bulk-nutrition-logo.js` script uploads the Bulk Nutrition logo and updates the organization's branding.

```bash
./run-logo-upload.sh
```

### 3. Admin User Creation

The `create-bulk-nutrition-admin.js` script creates an admin user for the Bulk Nutrition organization with appropriate roles and permissions.

```bash
./run-create-admin.sh
```

### 4. RBAC Verification

The `verify-bulk-nutrition-rbac.js` script verifies that the RBAC policies are correctly set up for the Bulk Nutrition organization.

```bash
./run-rbac-verification.sh
```

### 5. Organization Setup Test

The `organization-setup-test.mjs` script provides comprehensive testing of the organization setup flow, including user creation, organization creation, role assignment, and permission verification.

```bash
./run-organization-setup-test.sh
```

### 6. Manual Organization Verification

The `manual-organization-test.js` script can be run in the browser console after signing up as an organization admin to verify that the organization was created correctly with proper role assignments and subscription plan.

## Configuration

All scripts use a `.env` file for configuration. Each script will create a sample `.env` file if one doesn't exist. Edit this file to provide:

- `AUTH_TOKEN`: Your authentication token (required)
- `API_BASE_URL`: The base URL of your API (default: http://localhost:3000/api)
- `ORGANIZATION_ID`: The ID of the Bulk Nutrition organization (optional if ORGANIZATION_SLUG is provided)
- `ORGANIZATION_SLUG`: The slug of the Bulk Nutrition organization (default: bulk-nutrition)
- `ADMIN_EMAIL`: The email address for the admin user
- `LOGO_PATH`: The path to the Bulk Nutrition logo file

## Recommended Setup Process

### Automated Setup (Using Scripts)

1. **Create the organization**:
   ```bash
   ./run-bulk-nutrition-setup.sh
   ```

2. **Upload the logo**:
   - Place your logo file in the `../assets/` directory as `bulk-nutrition-logo.png`
   - Run:
   ```bash
   ./run-logo-upload.sh
   ```

3. **Create an admin user**:
   - Edit the `.env` file to set `ADMIN_EMAIL`
   - Run:
   ```bash
   ./run-create-admin.sh
   ```

4. **Verify RBAC policies**:
   ```bash
   ./run-rbac-verification.sh
   ```

### Streamlined Setup (Using the UI)

1. **Navigate to the sign-up page** and select the "Organization Admin" tab

2. **Complete the sign-up form** with:
   - Your personal details
   - Organization name
   - Organization slug (auto-generated from name)
   - Subscription plan

3. **Verify the setup** using one of these methods:
   - Run the automated test:
     ```bash
     ./run-organization-setup-test.sh
     ```
   - Use the manual verification script in the browser console after signing up:
     ```javascript
     // Copy and paste the contents of manual-organization-test.js
     ```

## Troubleshooting

### Authentication Issues

If you encounter authentication errors:
- Make sure your `AUTH_TOKEN` is valid and has not expired
- Verify that your user has admin permissions

### Organization Already Exists

If the organization already exists:
- The setup script will detect this and provide the existing organization ID
- You can continue with the logo upload and admin user creation using the existing organization

### Logo Upload Issues

If logo upload fails:
- Check that the logo file exists at the specified path
- Verify that your storage provider is properly configured
- Ensure the file is in a supported format (PNG recommended)

### Admin User Creation Issues

If admin user creation fails:
- Check if the user already exists (the script will update roles if so)
- Verify that your email configuration is correct for sending invitations

## Multi-Tenant Architecture

The CRM Mind system uses a multi-tenant architecture with the following characteristics:

1. **Data Isolation**: Organizations are isolated by `organization_id`
2. **RBAC System**: Users have roles and permissions within organizations
3. **Subscription Tiers**: Control feature access and usage limits
4. **White-Labeling**: Allows custom branding per organization

## Streamlined Organization Setup

The system now supports a streamlined organization setup process:

1. **Integrated Sign-Up Flow**: Users can create an organization during sign-up by selecting the "Organization Admin" tab
2. **Automatic Role Assignment**: The creating user is automatically assigned admin and owner roles
3. **Subscription Selection**: Users can select a subscription plan during organization creation
4. **Deferred Branding**: Organization branding (logo, colors) can be configured after initial setup

### Benefits of the New Flow

- **Simplified Onboarding**: Organizations can be created in a single flow without manual scripts
- **Reduced Friction**: Users can get started immediately without waiting for admin setup
- **Consistent Role Assignment**: Automatic role assignment ensures proper permissions
- **Subscription Integration**: Subscription plan is set during organization creation

For detailed documentation on the organization setup process, see:
- [Organization Setup Guide](/docs/organization-setup-guide.md)
- [Organization Setup Implementation](/docs/organization-setup-implementation.md)

The scripts in this directory are still available for automated setup or for cases where manual organization creation is required.
