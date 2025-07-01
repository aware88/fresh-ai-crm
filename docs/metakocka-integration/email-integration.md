# Metakocka Email Integration

This document provides a detailed overview of the email integration with Metakocka in the Fresh AI CRM system.

## Overview

The Metakocka email integration enables enriching email communications with relevant Metakocka data, creating bidirectional references between emails and Metakocka entities, building AI context using Metakocka data, and generating AI-powered responses that incorporate Metakocka information.

## Key Features

1. **Email Metadata Enrichment**: Automatically extract and associate Metakocka contacts and documents mentioned in emails
2. **Bidirectional References**: Create and maintain mappings between emails and Metakocka entities
3. **AI Context Building**: Generate rich context for AI processing using Metakocka data
4. **Email Templates**: Create and use email templates with Metakocka data placeholders
5. **AI Response Generation**: Generate AI-powered email responses that incorporate Metakocka context

## Architecture

The email integration consists of several components:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Email Processing Flow                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Email Received/Selected                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Email Content Analysis                      │
│  - Extract potential Metakocka entities (contacts, documents)   │
│  - Identify references to invoices, payments, products          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    Metakocka Data Retrieval                     │
│  - Query Metakocka API for related entities                     │
│  - Fetch contact details, document information                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Email Metadata Enrichment                   │
│  - Create mappings between email and Metakocka entities         │
│  - Store enriched metadata in the database                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                       AI Context Building                       │
│  - Combine email content with Metakocka data                    │
│  - Format context for AI processing                             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    Template Processing/AI Response              │
│  - Apply templates with Metakocka placeholders                  │
│  - Generate AI response using context                           │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Email Processor

**Purpose**: Analyze email content and extract potential Metakocka entities.

**Key Functions**:
- Extract email metadata (sender, recipient, subject, body)
- Identify potential references to Metakocka contacts and documents
- Detect mentions of invoices, payments, and products

**Implementation**: `src/lib/emails/metakocka-processor.ts`

### 2. Metakocka Data Retriever

**Purpose**: Fetch relevant data from Metakocka based on email content.

**Key Functions**:
- Query Metakocka API for contacts matching email addresses
- Retrieve document information based on references in the email
- Fetch product details mentioned in the email

**Implementation**: `src/lib/integrations/metakocka/data-retriever.ts`

### 3. Email Metadata Enricher

**Purpose**: Enrich email with Metakocka data and create mappings.

**Key Functions**:
- Create mappings between email and Metakocka contacts
- Create mappings between email and Metakocka documents
- Store enriched metadata in the database

**Implementation**: `src/lib/emails/metakocka-enricher.ts`

### 4. AI Context Builder

**Purpose**: Build rich context for AI processing using Metakocka data.

**Key Functions**:
- Combine email content with Metakocka contact data
- Include relevant document information in the context
- Format context for AI processing

**Implementation**: `src/lib/ai/context-builder.ts`

### 5. Email Template Processor

**Purpose**: Process email templates with Metakocka data placeholders.

**Key Functions**:
- Replace Metakocka placeholders with actual data
- Format template output for email response
- Handle missing data gracefully

**Implementation**: `src/lib/emails/template-processor.ts`

### 6. AI Response Generator

**Purpose**: Generate AI-powered email responses using Metakocka context.

**Key Functions**:
- Process AI context with email content
- Generate appropriate response based on email and Metakocka data
- Format response for sending

**Implementation**: `src/lib/ai/response-generator.ts`

## Database Schema

### Email Metakocka Contact Mappings

```sql
CREATE TABLE email_metakocka_contact_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  metakocka_contact_id VARCHAR(255) NOT NULL,
  metakocka_contact_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

### Email Metakocka Document Mappings

```sql
CREATE TABLE email_metakocka_document_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  metakocka_document_id VARCHAR(255) NOT NULL,
  metakocka_document_type VARCHAR(50) NOT NULL,
  metakocka_document_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

## API Endpoints

### Email Processing

- `POST /api/emails/metakocka`: Process an email for Metakocka metadata
  - Request: `{ emailId: string }`
  - Response: `{ success: boolean, data: { ... } }`

### Email Metadata Retrieval

- `GET /api/emails/metakocka`: Get Metakocka metadata for an email
  - Request: `?emailId=<email_id>`
  - Response: `{ success: boolean, data: { email_metakocka_contact_mappings: [], email_metakocka_document_mappings: [] } }`

### AI Context

- `GET /api/emails/ai-context`: Get AI context for an email with Metakocka data
  - Request: `?emailId=<email_id>`
  - Response: `{ success: boolean, data: { aiContext: string } }`

### AI Response Generation

- `POST /api/emails/ai-context`: Generate AI response using Metakocka context
  - Request: `{ emailId: string, prompt: string }`
  - Response: `{ success: boolean, data: { response: string } }`

### Email Templates

- `GET /api/emails/templates`: Get email templates with Metakocka placeholders
  - Response: `{ success: boolean, data: [ { id, name, subject, body } ] }`

- `POST /api/emails/templates`: Create email template with Metakocka placeholders
  - Request: `{ name: string, subject: string, body: string }`
  - Response: `{ success: boolean, data: { id, name, subject, body } }`

- `POST /api/emails/templates/apply`: Apply template with Metakocka data
  - Request: `{ emailId: string, templateId: string }`
  - Response: `{ success: boolean, data: { subject: string, body: string } }`

## Testing

The email integration can be tested using the `test-email-metakocka-full-flow.js` script, which verifies all aspects of the integration:

1. Email metadata enrichment
2. Bidirectional references
3. AI context building
4. Email templates
5. AI response generation

See the [Testing Guide](./testing-guide.md) for detailed instructions on running the tests.

## Placeholders for Email Templates

The following Metakocka placeholders are available for email templates:

- `{{metakocka.contact.name}}`: Contact name from Metakocka
- `{{metakocka.contact.email}}`: Contact email from Metakocka
- `{{metakocka.contact.phone}}`: Contact phone from Metakocka
- `{{metakocka.document.number}}`: Document number from Metakocka
- `{{metakocka.document.date}}`: Document date from Metakocka
- `{{metakocka.document.dueDate}}`: Document due date from Metakocka
- `{{metakocka.document.total}}`: Document total amount from Metakocka
- `{{metakocka.document.status}}`: Document status from Metakocka

## Error Handling

The email integration includes comprehensive error handling:

1. **Missing Credentials**: Graceful handling when Metakocka credentials are not available
2. **API Errors**: Proper handling of Metakocka API errors
3. **Data Mapping Errors**: Handling of errors in mapping email data to Metakocka entities
4. **Template Processing Errors**: Graceful handling of missing data for placeholders

## Recent Changes

- Added comprehensive error handling in the AI response generation
- Improved template processing with better placeholder handling
- Enhanced AI context building with more Metakocka data
- Added testing script for the full email integration flow

## Open Tasks

- Improve error reporting in the UI
- Add support for more Metakocka document types
- Enhance AI context with historical email interactions
- Add support for bulk email processing
