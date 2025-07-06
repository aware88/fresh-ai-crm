# Microsoft Graph Integration for Fresh AI CRM

## Overview

This document provides a comprehensive guide to the Microsoft Graph API integration implemented in Fresh AI CRM. The integration enables users to access and manage their Microsoft 365 resources (email, calendar, contacts) directly within the CRM, creating a seamless experience that eliminates the need to switch between applications.

## Features

### Email Integration
- Full Outlook replacement within the CRM
- View, read, send, and manage emails
- Email enrichment with Metakocka data
- Integration with existing email analysis tools

### Calendar Integration
- View and manage calendar events
- Create new meetings and appointments
- Weekly calendar view

### Contacts Integration
- View and manage Microsoft contacts
- Search and filter contacts
- View detailed contact information

## Technical Implementation

### Authentication

The integration uses OAuth 2.0 with Microsoft Entra ID (formerly Azure AD) for authentication. The authentication flow is handled by NextAuth.js with the Microsoft provider.

#### Setup Requirements

1. Register an application in the Microsoft Entra ID admin center
2. Configure the following environment variables:
   - `MICROSOFT_CLIENT_ID`
   - `MICROSOFT_CLIENT_SECRET`
   - `NEXTAUTH_URL`

### Token Management

Access and refresh tokens are securely stored in the database using the `microsoft_tokens` table. The `MicrosoftTokenService` handles token storage, retrieval, and automatic refresh when tokens expire.

### API Structure

#### Email API
- `GET /api/emails` - Fetch emails from Microsoft Graph
- `GET /api/emails/[messageId]` - Get a specific email
- `PATCH /api/emails/[messageId]` - Update email properties (e.g., mark as read)
- `POST /api/emails/send` - Send a new email

#### Calendar API
- `GET /api/calendar` - Fetch calendar events
- `POST /api/calendar` - Create a new calendar event
- `GET /api/calendar/[eventId]` - Get a specific event
- `PATCH /api/calendar/[eventId]` - Update an event
- `DELETE /api/calendar/[eventId]` - Delete an event

#### Contacts API
- `GET /api/contacts/microsoft` - Fetch contacts
- `POST /api/contacts/microsoft` - Create a new contact
- `GET /api/contacts/microsoft/[contactId]` - Get a specific contact
- `PATCH /api/contacts/microsoft/[contactId]` - Update a contact
- `DELETE /api/contacts/microsoft/[contactId]` - Delete a contact

### UI Components

#### Email Components
- `OutlookClient.tsx` - Main Outlook client component
- `EmailList.tsx` - Email list view
- `EmailDetail.tsx` - Email detail view

#### Calendar Components
- `CalendarView.tsx` - Weekly calendar view

#### Contacts Components
- `ContactsList.tsx` - Contacts list and detail view

#### Navigation
- `MicrosoftGraphNav.tsx` - Navigation component for Microsoft 365 features

### Integration with Metakocka

The Microsoft Graph email integration is enriched with Metakocka data using the `outlook-email-enricher.ts` service, which:

1. Converts Microsoft Graph emails to the internal email format
2. Uses the existing email enrichment logic to add Metakocka context
3. Provides batch processing capabilities for email enrichment

## Usage

### Accessing Microsoft 365 Features

1. Navigate to the Microsoft 365 dashboard at `/dashboard/microsoft`
2. Use the navigation to access Email, Calendar, or Contacts
3. Sign in with Microsoft when prompted (if not already authenticated)

### Email

- View emails at `/email/outlook`
- Click on an email to view its details
- Use the "New Email" button to compose a new message

### Calendar

- View calendar at `/calendar`
- Navigate between weeks using the navigation buttons
- View event details by clicking on an event

### Contacts

- View contacts at `/contacts/microsoft`
- Search for contacts using the search box
- Click on a contact to view details

## Development

### Adding New Features

To extend the Microsoft Graph integration:

1. Use the `MicrosoftGraphService` class for API calls
2. Ensure proper authentication using `getServerSession()`
3. Follow the existing pattern for API routes and UI components

### Testing

Test the integration by:

1. Ensuring proper authentication flow
2. Verifying API responses
3. Testing UI components with different data scenarios

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Microsoft Entra ID application configuration
   - Check environment variables
   - Ensure proper scopes are configured

2. **API Errors**
   - Check browser console for error messages
   - Verify token refresh mechanism
   - Check API request format

3. **UI Issues**
   - Verify component props
   - Check data loading states
   - Test with different screen sizes

## Future Enhancements

- Email composition UI with rich text editor
- Email templates integration
- Advanced calendar features (recurring events, meeting scheduling)
- Contact synchronization with Metakocka
- Microsoft Teams integration
