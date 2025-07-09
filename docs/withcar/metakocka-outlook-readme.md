# Metakocka Outlook Email Client

## Overview

The Metakocka Outlook Email Client is a comprehensive replacement for Microsoft Outlook within the CRM Mind system. This implementation provides a seamless email experience integrated with CRM data, enabling users to manage all their email communication without leaving the CRM environment.

## Features

The implementation is organized into four sprints, each focusing on specific feature sets:

### Sprint 1: Email Client Enhancements

- **Email Comments**: Collaborative commenting on emails
- **Email Signatures**: Create and manage multiple HTML signatures
- **Email Attachments**: Advanced attachment handling with drag-and-drop
- **Email Language Detection**: Automatic detection of email language
- **Email Composition**: Rich email composition with reply, forward, and draft support

### Sprint 2: Email Organization

- **Country Filter**: Filter emails by sender country
- **Status Mapping**: Map email content patterns to status labels
- **Prompt Rules Editor**: Create AI prompt rules for automated responses

### Sprint 3: Advanced Logic

- **Magento Integration**: Connect emails with Magento e-commerce data
- **RAG (Retrieval-Augmented Generation)**: Enhance responses with relevant information
- **AI Fallback**: Generate AI-powered responses when needed

### Sprint 4: External Channels

- **Facebook Inbox**: Integrate Facebook Messenger conversations

## Architecture

The email client is built on several key technologies:

- **Microsoft Graph API**: Core email functionality
- **Next.js**: Frontend framework
- **React**: UI components
- **Tailwind CSS**: Styling
- **Supabase**: Database and authentication

## Integration Points

### Metakocka Integration

The email client integrates with Metakocka data to provide context-aware email handling:

- **Products & Inventory**: Product details, inventory levels, availability status
- **Contacts**: Contact information, type, history, and preferences
- **Sales Documents**: Document details, line items, status, and history
- **Orders**: Order details, line items, fulfillment status, inventory allocation

### Microsoft Graph Integration

- **Authentication**: OAuth 2.0 with Microsoft Entra ID
- **Email Operations**: Read, send, reply, forward
- **Attachments**: Upload, download, view
- **Calendar**: View and manage events
- **Contacts**: Sync and manage contacts

## Getting Started

### Prerequisites

- Node.js 16+
- Microsoft 365 account with appropriate permissions
- Metakocka API credentials
- Facebook Developer account (for Facebook Inbox)

### Configuration

1. Set up Microsoft Graph API credentials in your environment variables
2. Configure Metakocka API connection settings
3. Set up Facebook App credentials (for Facebook Inbox)

### Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Documentation

For detailed documentation on each component and feature, refer to:

- [Email Features Documentation](./email-features-documentation.md)
- [Microsoft Graph Integration](./microsoft-graph-integration.md)
- [Microsoft Graph Implementation](./microsoft-graph-implementation.md)
- [Microsoft Graph README](./microsoft-graph-readme.md)

## Testing

The implementation includes comprehensive testing:

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- -t "Email Client"
```

## Future Enhancements

- Additional external channel integrations (WhatsApp, SMS)
- Enhanced AI capabilities
- Advanced filtering and search
- Mobile optimization
- Offline support

## Contributors

- CRM Mind Development Team

## License

Proprietary - All rights reserved
