# Metakocka Outlook Email Client Documentation

This document provides comprehensive documentation for the Metakocka Outlook replacement email client implemented within CRM Mind. The implementation spans four sprints, each focusing on specific feature sets to create a complete email solution that fully replaces Outlook for users within the CRM.

## Table of Contents

1. [Overview](#overview)
2. [Sprint 1: Email Client Enhancements](#sprint-1-email-client-enhancements)
3. [Sprint 2: Email Organization](#sprint-2-email-organization)
4. [Sprint 3: Advanced Logic](#sprint-3-advanced-logic)
5. [Sprint 4: External Channels](#sprint-4-external-channels)
6. [Integration with Metakocka](#integration-with-metakocka)
7. [Microsoft Graph API Integration](#microsoft-graph-api-integration)
8. [Development and Maintenance](#development-and-maintenance)

## Overview

The Metakocka Outlook replacement email client is a comprehensive solution that integrates directly with Microsoft Graph API to provide a full-featured email experience within the CRM Mind. The client supports all essential email functionality while adding CRM-specific features like contact enrichment, sales document linking, and AI-powered assistance.

### Key Features

- Complete email management (read, compose, reply, forward)
- Email organization with tags, filters, and status mapping
- Attachment handling and signature management
- AI-powered features (language detection, RAG, response generation)
- External channel integration (Facebook)
- Metakocka data integration
- Microsoft Graph API integration

## Sprint 1: Email Client Enhancements

### Email Comments

The `EmailComments` component allows users to view and add comments to emails, facilitating team collaboration and knowledge sharing.

**Features:**
- Add, view, and manage comments on emails
- User avatars and timestamps for each comment
- Loading and error states
- Pagination for large comment threads

**Usage:**
```jsx
<EmailComments emailId="email-123" />
```

### Email Signatures

The `EmailSignature` component enables users to create, manage, and use multiple email signatures.

**Features:**
- Create and edit HTML signatures
- Set default signature
- Select signatures when composing emails
- Compact mode for quick selection

**Usage:**
```jsx
<EmailSignature onSelect={handleSignatureSelect} compact={true} />
```

### Email Attachments

The `EmailAttachments` component provides a comprehensive solution for handling email attachments.

**Features:**
- Display attachments with appropriate icons based on file type
- Upload attachments via drag-and-drop or file browser
- Download attachments
- Remove attachments (in non-read-only mode)
- Progress indicators for uploads

**Usage:**
```jsx
<EmailAttachments 
  attachments={emailAttachments} 
  onAdd={handleAddAttachment}
  onRemove={handleRemoveAttachment}
  readOnly={false}
/>
```

### Email Language Detection

The `EmailLanguageDetection` component automatically detects the language of email content.

**Features:**
- Automatic language detection from email body
- Confidence score display
- Support for multiple languages

**Usage:**
```jsx
<EmailLanguageDetection content={emailBody} />
```

### Email Composition

The `EmailCompose` component provides a full-featured email composition interface.

**Features:**
- Support for new email, reply, reply all, and forward modes
- Rich text editing
- Attachment handling
- Signature insertion
- Recipient validation
- CC and BCC fields

**Usage:**
```jsx
<EmailCompose 
  mode="reply" 
  originalEmail={email} 
  onSend={handleSendEmail} 
  onCancel={handleCancel} 
/>
```

## Sprint 2: Email Organization

### Email Country Filter

The `EmailCountryFilter` component allows filtering emails by sender country.

**Features:**
- Multi-select country filtering
- Country search functionality
- Flag icons for visual identification
- Clear filter option

**Usage:**
```jsx
<EmailCountryFilter onFilterChange={handleCountryFilterChange} />
```

### Email Status Mapping

The `EmailStatusMapping` component enables mapping email text patterns to status labels.

**Features:**
- Define text patterns that map to specific statuses
- Prioritize mappings with drag-and-drop reordering
- Add, edit, and delete mappings
- Color-coded status badges

**Usage:**
```jsx
<EmailStatusMapping />
```

### Email Prompt Rules Editor

The `EmailPromptRulesEditor` component allows creating AI prompt rules for automatic response generation.

**Features:**
- Create and manage prompt rules
- Define trigger patterns for rule activation
- Set custom AI prompts for different scenarios
- Enable/disable rules
- Rule prioritization

**Usage:**
```jsx
<EmailPromptRulesEditor />
```

## Sprint 3: Advanced Logic

### Magento Integration

The `MagentoIntegration` component connects email communication with Magento e-commerce data.

**Features:**
- View customer orders from Magento
- Display order details, status, and items
- Link emails to relevant orders
- Real-time order status updates

**Usage:**
```jsx
<MagentoIntegration emailAddress="customer@example.com" onOrderSelect={handleOrderSelect} />
```

### RAG (Retrieval-Augmented Generation)

The `EmailRAGProcessor` component enhances email responses with relevant information from various sources.

**Features:**
- Retrieve relevant information based on email content
- Source information from knowledge base, previous emails, FAQs, and documents
- Display relevance scores
- Expandable information cards

**Usage:**
```jsx
<EmailRAGProcessor 
  emailContent={emailBody} 
  onResultsReady={handleRAGResults} 
  autoProcess={true} 
/>
```

### AI Fallback

The `EmailAIFallback` component generates AI-powered responses when needed.

**Features:**
- Generate contextual email responses
- Copy responses to clipboard
- Use generated responses directly
- Loading and error states

**Usage:**
```jsx
<EmailAIFallback 
  emailContent={emailBody} 
  emailSubject={emailSubject} 
  senderEmail={senderEmail} 
  onResponseGenerated={handleResponseGenerated} 
/>
```

## Sprint 4: External Channels

### Facebook Inbox

The `FacebookInbox` component integrates Facebook Messenger conversations into the CRM.

**Features:**
- View and manage Facebook Messenger conversations
- Send and receive messages
- Display conversation history
- Handle attachments
- Real-time updates

**Usage:**
```jsx
<FacebookInbox />
```

## Integration with Metakocka

The email client integrates with Metakocka data to provide context-aware email handling.

### Metakocka AI Context Integration

The system integrates Metakocka data into the AI context for document and query processing:

- **Products & Inventory**: Product details, inventory levels, availability status
- **Contacts**: Contact information, type, history, and preferences
- **Sales Documents**: Document details, line items, status, and history
- **Orders**: Order details, line items, fulfillment status, inventory allocation

### Multi-tenant Awareness

All integrations maintain strict multi-tenant isolation:

- User ID filtering for data isolation
- Supabase RLS policies
- AI context building respects user ownership

## Microsoft Graph API Integration

The email client uses Microsoft Graph API for core email functionality.

### Authentication

- OAuth 2.0 authentication with Microsoft Entra ID
- Token storage and refresh mechanisms
- Delegated permissions model

### API Usage

- Email retrieval and sending
- Attachment handling
- Calendar integration
- Contact management

## Development and Maintenance

### Component Structure

The email client follows a modular component structure:

- Core components in `src/components/email`
- Microsoft Graph integration in `src/lib/microsoft-graph`
- API routes in `src/app/api/email`
- Pages in `src/app/email`

### Testing

Comprehensive testing infrastructure is available:

- Unit tests for components
- Integration tests for API routes
- End-to-end tests for workflows

### Future Enhancements

Potential areas for future development:

- Additional external channel integrations (WhatsApp, SMS)
- Enhanced AI capabilities
- Advanced filtering and search
- Mobile optimization
- Offline support

---

## Appendix: API Reference

### Email API Routes

- `GET /api/email` - List emails
- `GET /api/email/:id` - Get email by ID
- `POST /api/email` - Send new email
- `PUT /api/email/:id` - Update email
- `DELETE /api/email/:id` - Delete email

### Comments API Routes

- `GET /api/email/:id/comments` - Get comments for an email
- `POST /api/email/:id/comments` - Add comment to an email
- `DELETE /api/email/:id/comments/:commentId` - Delete comment

### Attachments API Routes

- `GET /api/email/:id/attachments` - List attachments
- `POST /api/email/:id/attachments` - Upload attachment
- `GET /api/email/:id/attachments/:attachmentId` - Download attachment
- `DELETE /api/email/:id/attachments/:attachmentId` - Delete attachment

### Facebook API Routes

- `GET /api/facebook/conversations` - List conversations
- `GET /api/facebook/conversations/:id/messages` - Get messages
- `POST /api/facebook/conversations/:id/messages` - Send message
