# Microsoft Graph API Integration Plan for Outlook Replacement

## Overview

This document outlines the approach for integrating Microsoft Graph API to create a full Outlook replacement email client within Fresh AI CRM. The integration will enable users to access their Outlook emails, calendar, and contacts directly within the CRM, with additional Metakocka-specific features.

## Integration Approaches

We've identified two potential approaches for the Outlook integration:

### Approach 1: Custom Microsoft Graph API Integration

**Description**: Build a custom email client using direct Microsoft Graph API calls with MSAL.js for authentication.

**Pros**:
- Full control over UI/UX and feature implementation
- Deeper integration with existing CRM features
- Custom business logic for Metakocka-specific requirements

**Cons**:
- Longer development time
- More complex maintenance
- Need to build UI components from scratch

### Approach 2: Microsoft Graph Toolkit Integration

**Description**: Use the Microsoft Graph Toolkit components to quickly embed Microsoft 365 experiences.

**Pros**:
- Faster implementation
- Pre-built UI components (agenda, search results, etc.)
- Automatic handling of authentication and caching
- Microsoft 365-like experience out of the box

**Cons**:
- Less customization flexibility
- Potential integration challenges with existing CRM UI
- May require additional work for Metakocka-specific features

## Authentication Requirements

### Microsoft Entra ID App Registration

1. Register an application in the [Microsoft Entra admin center](https://entra.microsoft.com/)
2. Configure the following:
   - Application ID (client ID)
   - Redirect URI (callback URL)
   - Required permissions for Microsoft Graph API
   - Client secret or certificate for authentication

### Required Microsoft Graph Permissions

**Delegated Permissions** (user context):
- `Mail.Read` - Read user mail
- `Mail.ReadWrite` - Read and write user mail
- `Mail.Send` - Send mail as a user
- `Calendars.Read` - Read user calendars
- `Calendars.ReadWrite` - Read and write user calendars
- `Contacts.Read` - Read user contacts
- `Contacts.ReadWrite` - Read and write user contacts

**Application Permissions** (service context, if needed):
- `Mail.Read` - Read mail in all mailboxes
- `Mail.ReadWrite` - Read and write mail in all mailboxes
- `Mail.Send` - Send mail as any user

## Integration with Existing Authentication System

The Fresh AI CRM currently uses NextAuth.js with Supabase adapter for authentication. We'll need to:

1. Add Microsoft Graph as an OAuth provider in NextAuth.js configuration
2. Store Microsoft Graph access tokens securely
3. Implement token refresh mechanism
4. Handle multi-tenant isolation for Microsoft Graph data

## Technical Implementation Plan

### Phase 1: Authentication Setup

1. Register Microsoft Entra ID application
2. Configure NextAuth.js with Microsoft provider
3. Implement token storage and refresh mechanism
4. Create Microsoft Graph client service

### Phase 2: Core Email Functionality

1. Implement email fetching and listing
2. Add email reading interface
3. Implement email composition and sending
4. Add email reply, forward, and threading

### Phase 3: Calendar and Contacts

1. Implement calendar view and event management
2. Add contact listing and management
3. Integrate calendar with email functionality

### Phase 4: Metakocka Integration

1. Enhance emails with Metakocka metadata
2. Implement AI-powered email analysis
3. Add Metakocka-specific features (tags, comments, etc.)

## Recommended Approach

Based on the requirements for a full Outlook replacement with deep Metakocka integration, we recommend a hybrid approach:

1. Use **Custom Microsoft Graph API Integration** for core functionality to ensure full control over the UI/UX and deep integration with Metakocka features

2. Leverage **Microsoft Graph Toolkit components** selectively for specific features where they provide significant development advantages (e.g., calendar views, people picker)

This hybrid approach will provide the best balance between development speed and customization flexibility.

## Next Steps

1. Create Microsoft Entra ID application registration
2. Set up MSAL.js integration with NextAuth.js
3. Implement basic email fetching and display
4. Evaluate Microsoft Graph Toolkit components for specific features
