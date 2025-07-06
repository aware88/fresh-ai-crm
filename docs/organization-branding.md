# Organization Branding System

## Overview

The Organization Branding system allows customization of the visual appearance and branding elements for each organization in the CRM Mind platform. This enables a white-label experience where each organization can maintain its own brand identity within the application.

## Database Schema

### Table: organization_branding

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | Foreign key to organizations table |
| logo_url | TEXT | URL to the organization's logo |
| primary_color | TEXT | Primary brand color (hex code) |
| secondary_color | TEXT | Secondary brand color (hex code) |
| accent_color | TEXT | Accent color for highlights (hex code) |
| font_family | TEXT | Font family for the UI |
| custom_css | TEXT | Custom CSS for additional styling |
| custom_domain | TEXT | Custom domain for the organization |
| favicon_url | TEXT | URL to the organization's favicon |
| email_header_image_url | TEXT | URL to image used in email headers |
| email_footer_text | TEXT | Text to be displayed in email footers |
| login_background_url | TEXT | URL to background image for login page |
| created_at | TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | Record last update timestamp |
| created_by | UUID | User who created the record |
| updated_by | UUID | User who last updated the record |

## API Endpoints

### GET /api/admin/organizations/[id]/branding

Retrieve branding settings for a specific organization.

**Authorization:** Requires admin privileges

**Response:**
```json
{
  "branding": {
    "id": "uuid",
    "organization_id": "uuid",
    "logo_url": "https://example.com/logo.png",
    "primary_color": "#1a56db",
    "secondary_color": "#4f46e5",
    "accent_color": "#2563eb",
    "font_family": "Inter, system-ui, sans-serif",
    "custom_css": ".custom-class { color: red; }",
    "custom_domain": "app.example.com",
    "favicon_url": "https://example.com/favicon.ico",
    "email_header_image_url": "https://example.com/email-header.png",
    "email_footer_text": "© 2025 Example Company. All rights reserved.",
    "login_background_url": "https://example.com/login-bg.jpg",
    "created_at": "2025-07-01T12:00:00Z",
    "updated_at": "2025-07-01T12:00:00Z"
  }
}
```

### PUT /api/admin/organizations/[id]/branding

Update branding settings for a specific organization.

**Authorization:** Requires admin privileges

**Request Body:**
```json
{
  "logo_url": "https://example.com/logo.png",
  "primary_color": "#1a56db",
  "secondary_color": "#4f46e5",
  "accent_color": "#2563eb",
  "font_family": "Inter, system-ui, sans-serif",
  "custom_css": ".custom-class { color: red; }",
  "custom_domain": "app.example.com",
  "favicon_url": "https://example.com/favicon.ico",
  "email_header_image_url": "https://example.com/email-header.png",
  "email_footer_text": "© 2025 Example Company. All rights reserved.",
  "login_background_url": "https://example.com/login-bg.jpg"
}
```

**Response:**
```json
{
  "branding": {
    "id": "uuid",
    "organization_id": "uuid",
    "logo_url": "https://example.com/logo.png",
    "primary_color": "#1a56db",
    "secondary_color": "#4f46e5",
    "accent_color": "#2563eb",
    "font_family": "Inter, system-ui, sans-serif",
    "custom_css": ".custom-class { color: red; }",
    "custom_domain": "app.example.com",
    "favicon_url": "https://example.com/favicon.ico",
    "email_header_image_url": "https://example.com/email-header.png",
    "email_footer_text": "© 2025 Example Company. All rights reserved.",
    "login_background_url": "https://example.com/login-bg.jpg",
    "created_at": "2025-07-01T12:00:00Z",
    "updated_at": "2025-07-01T12:00:00Z"
  }
}
```

## UI Components

### OrganizationBranding.tsx

The main component for managing organization branding settings in the admin panel. Located at `/src/app/admin/organizations/[id]/components/OrganizationBranding.tsx`.

Features:
- Form for editing all branding settings
- Live preview of selected colors
- Image URL validation and preview
- Custom CSS editor

## Testing

### API Testing

A comprehensive test script is available at `/tests/organization-branding.test.js`. This script tests:

1. Retrieving organization branding settings
2. Updating organization branding settings
3. Verifying that updates were saved correctly
4. Verifying theme application in the UI

To run the tests:

```bash
# Make the script executable if needed
chmod +x scripts/run-branding-tests.sh

# Run the tests
./scripts/run-branding-tests.sh
```

### Test Dependencies

- Node.js 16+
- Playwright for end-to-end testing
- Environment variables set in `.env.test`

## Integration Points

### Theme Provider

The branding settings are used by the Theme Provider component to apply organization-specific styling throughout the application.

### Email Templates

Email templates use the branding settings to customize the appearance of emails sent from the system.

### Login Page

The login page uses the branding settings to display organization-specific logos and background images.

## Security

Access to branding settings is restricted by Row Level Security policies:

1. Only organization members can view their organization's branding
2. Only organization admins can modify their organization's branding
3. System admins can view and modify all organization branding

## Future Enhancements

1. Image upload functionality for logos and other images
2. Theme preview in the branding settings page
3. Template selection for pre-defined color schemes
4. Custom font upload capability
5. CSS validation and linting in the custom CSS editor
