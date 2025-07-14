# Email Integration - Developer Documentation

This document provides technical details about the email integration implementation in CRM Mind.

## Architecture Overview

The email integration supports multiple providers (Google Gmail, Microsoft Outlook, IMAP/SMTP) with OAuth 2.0 authorization code flow for Gmail and Outlook, and traditional IMAP/SMTP for other providers. The implementation consists of:

1. **Frontend Components**:
   - Unified email accounts settings page for connecting/disconnecting all email providers
   - Email client UI for viewing and managing emails

2. **Backend Services**:
   - OAuth authentication endpoints for Google and Microsoft
   - IMAP/SMTP connection endpoints
   - Unified email account management

## Key Components

### Frontend

- **Email Accounts Page**: `/src/app/settings/email-accounts/page.tsx`
  - Displays all connected email accounts
  - Provides connect/disconnect functionality for all providers
  - Handles OAuth success/error messages

### Backend

- **OAuth Endpoints**:
  - Google: `/src/app/api/auth/google/connect` and `/src/app/api/auth/google/callback`
  - Microsoft: `/src/app/api/auth/outlook/connect` and `/src/app/api/auth/outlook/callback`
  - IMAP: `/src/app/api/auth/imap/connect`

- **Email Status API**:
  - Status: `/src/app/api/email/status/route.ts`

## Authentication Flow

### OAuth Flow (Google & Microsoft)
1. User initiates connection from settings page
2. System redirects to OAuth provider endpoint with required scopes
3. User authenticates with provider and grants permissions
4. Provider redirects back to our callback URL with authorization code
5. Backend exchanges code for access and refresh tokens
6. Tokens are securely stored in the `email_accounts` database table
7. User is redirected back to settings page with success message

### IMAP/SMTP Flow
1. User enters email credentials in the settings form
2. System validates the credentials
3. Credentials are encrypted and stored in the `email_accounts` table
4. Connection is tested and user receives feedback

## Database Schema

All email accounts are stored in the unified `email_accounts` table:

```sql
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  provider_type TEXT NOT NULL, -- 'google', 'microsoft', 'imap'
  
  -- OAuth fields (for Google/Microsoft)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- IMAP/SMTP fields
  username TEXT,
  password_encrypted TEXT,
  imap_host TEXT,
  imap_port INTEGER,
  imap_security TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_security TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies to ensure users can only access their own accounts
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own email accounts" ON email_accounts
  USING (auth.uid() = user_id);
```

## API Endpoints

### Email Status
- `GET /api/email/status` - Get all connected email accounts for the current user

### OAuth Endpoints
- `GET /api/auth/google/connect` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Handle Google OAuth callback
- `GET /api/auth/outlook/connect` - Initiate Microsoft OAuth flow
- `GET /api/auth/outlook/callback` - Handle Microsoft OAuth callback

### IMAP/SMTP Endpoints
- `POST /api/auth/imap/connect` - Connect IMAP/SMTP account

## Required Environment Variables

```
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# NextAuth
NEXTAUTH_URL=your_app_url
NEXTAUTH_SECRET=your_nextauth_secret
```

## OAuth Scopes

### Google Gmail
- `openid` - Basic OpenID Connect
- `email` - Email address
- `profile` - Basic profile information
- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/gmail.modify` - Modify emails

### Microsoft Outlook
- `offline_access` - For refresh tokens
- `User.Read` - Basic profile information
- `Mail.Read` - Read emails
- `Mail.ReadWrite` - Read and write emails
- `Mail.Send` - Send emails
- `Calendars.Read` - Read calendar events
- `Contacts.Read` - Read contacts

## Security Considerations

1. **Token Storage**: OAuth tokens are stored securely in the database with RLS policies
2. **Password Encryption**: IMAP/SMTP passwords are encrypted before storage
3. **State Parameter**: OAuth state parameter prevents CSRF attacks
4. **Token Refresh**: OAuth tokens are automatically refreshed when expired
5. **User Isolation**: RLS policies ensure users can only access their own accounts

## Error Handling

- OAuth errors are caught and displayed to the user
- Token refresh failures trigger automatic disconnection
- IMAP/SMTP connection errors are reported with specific details
- API rate limiting is handled with exponential backoff

## Testing

Use the test endpoints to verify email account connections:
- `/settings/email-accounts/test/{account_id}` - Test specific account connection
