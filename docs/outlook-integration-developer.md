# Outlook Integration - Developer Documentation

This document provides technical details about the Outlook email integration implementation in CRM Mind.

## Architecture Overview

The Outlook integration uses Microsoft Graph API with OAuth 2.0 authorization code flow to authenticate users and access their email data. The implementation consists of:

1. **Frontend Components**:
   - Email settings page for connecting/disconnecting Outlook accounts
   - Email client UI for viewing and managing emails

2. **Backend Services**:
   - OAuth authentication endpoints
   - Token management service
   - Microsoft Graph API service

## Key Components

### Frontend

- **Email Settings Page**: `/src/app/settings/email/page.tsx`
  - Displays connection status
  - Provides connect/disconnect functionality
  - Handles OAuth success/error messages

- **Outlook Email Client**: `/src/components/email/outlook/OutlookClient.tsx`
  - Displays emails from connected account
  - Provides email management functionality

### Backend

- **OAuth Endpoints**:
  - Connect: `/src/app/api/auth/outlook/connect/route.ts`
  - Callback: `/src/app/api/auth/outlook/callback/route.ts`

- **Email Settings API**:
  - Status: `/src/app/api/settings/email/status/route.ts`
  - Disconnect: `/src/app/api/settings/email/disconnect/route.ts`

- **Services**:
  - Token Management: `MicrosoftTokenService`
  - Graph API: `MicrosoftGraphService`

## Authentication Flow

1. User initiates connection from settings page
2. System redirects to Microsoft OAuth endpoint with required scopes
3. User authenticates with Microsoft and grants permissions
4. Microsoft redirects back to our callback URL with authorization code
5. Backend exchanges code for access and refresh tokens
6. Tokens are securely stored in the database
7. User is redirected back to settings page with success message

## Database Schema

Tokens are stored in the `microsoft_tokens` table:

```sql
CREATE TABLE microsoft_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies to ensure users can only access their own tokens
ALTER TABLE microsoft_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own tokens" ON microsoft_tokens
  USING (auth.uid() = user_id);
```

## Microsoft Graph API

The integration uses the following Microsoft Graph API endpoints:

- `/me` - Get user profile information
- `/me/messages` - Get user emails
- `/me/sendMail` - Send emails

## Required Environment Variables

```
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=your_app_url
```

## OAuth Scopes

The following scopes are requested:
- `offline_access` - For refresh tokens
- `User.Read` - Basic profile information
- `Mail.Read` - Read emails
- `Mail.Send` - Send emails
- `Contacts.Read` - Read contacts
- `Calendars.Read` - Read calendar events

## Security Considerations

1. **Token Storage**: Access and refresh tokens are stored securely in the database with RLS policies
2. **State Parameter**: OAuth state parameter is used to prevent CSRF attacks
3. **Refresh Tokens**: Tokens are automatically refreshed when expired
4. **Revocation**: Tokens can be revoked by disconnecting the account

## Error Handling

- OAuth errors are caught and displayed to the user
- Token refresh failures trigger automatic disconnection
- API rate limiting is handled with exponential backoff

## Future Enhancements

1. **Email Composition**: Add UI for composing new emails
2. **Email Threading**: Improve email thread visualization
3. **Contact Integration**: Better integration with CRM contacts
4. **Calendar Integration**: Add calendar event management

## Testing

To test the Outlook integration:

1. Set up the required environment variables
2. Start the development server
3. Navigate to the email settings page
4. Test connection flow with a Microsoft account
5. Verify token storage in the database
6. Test email retrieval and sending functionality

## Troubleshooting

- Check browser console for frontend errors
- Verify API responses in network tab
- Ensure environment variables are correctly set
- Check database for token storage issues
