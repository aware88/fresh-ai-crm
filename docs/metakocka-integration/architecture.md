# Metakocka Integration Architecture

This document provides a detailed overview of the architecture for the Metakocka ERP integration with the Fresh AI CRM system.

## System Architecture

The Metakocka integration follows a modular, layered architecture designed for flexibility, maintainability, and scalability:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Fresh AI CRM Frontend                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                         API Layer                               │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Auth API    │  │ Data Sync API│  │ Email Integration API  │  │
│  └─────────────┘  └──────────────┘  └────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Integration Layer                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Auth Module │  │ Data Sync    │  │ Email Enrichment       │  │
│  └─────────────┘  └──────────────┘  └────────────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │ Error Logger│  │ Mapping      │  │ AI Context Builder     │  │
│  └─────────────┘  └──────────────┘  └────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Metakocka API Client                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
                        Metakocka ERP API
```

## Key Components

### 1. Authentication Layer

**Purpose**: Securely manage Metakocka API credentials and authenticate API requests.

**Components**:
- `credentials.ts`: Manages storage and retrieval of Metakocka API credentials
- `serviceToken.ts`: Handles service-level authentication for background processes
- Authentication middleware for API routes

**Database Tables**:
- `metakocka_credentials`: Stores API keys and company IDs for each user

### 2. Data Synchronization Layer

**Purpose**: Handle bidirectional data flow between CRM and Metakocka.

**Components**:
- Contact synchronization modules
- Sales document synchronization modules
- Product synchronization modules

**Database Tables**:
- `metakocka_contact_mappings`: Maps CRM contacts to Metakocka contacts
- `metakocka_sales_document_mappings`: Maps CRM sales documents to Metakocka documents
- `metakocka_product_mappings`: Maps CRM products to Metakocka products

### 3. Email Integration Layer

**Purpose**: Enrich emails with Metakocka data and provide AI context.

**Components**:
- `email-enricher.ts`: Extracts Metakocka-related information from emails
- `email-context-builder.ts`: Builds rich context from Metakocka data for AI processing
- `email-templates.ts`: Manages email templates with Metakocka placeholders

**Database Tables**:
- `email_metakocka_contact_mappings`: Links emails to Metakocka contacts
- `email_metakocka_document_mappings`: Links emails to Metakocka documents
- `email_templates`: Stores email templates with Metakocka placeholders

### 4. AI Layer

**Purpose**: Provide AI-powered features using Metakocka data.

**Components**:
- AI context builder
- AI response generator
- Template processing engine

## Data Flow

### Contact Synchronization Flow

1. User initiates contact sync (CRM → Metakocka)
2. System retrieves contact data from CRM database
3. Data is transformed to Metakocka format
4. Contact is created/updated in Metakocka via API
5. Mapping record is created/updated in CRM database
6. Sync status is returned to user

### Email Enrichment Flow

1. New email is received in the system
2. Email content is analyzed for Metakocka entities
3. Metakocka API is queried for related data
4. Email is enriched with Metakocka metadata
5. Mappings are created between email and Metakocka entities
6. AI context is built using the enriched data

## API Endpoints

### Authentication API

- `POST /api/metakocka/credentials`: Store Metakocka credentials
- `GET /api/metakocka/credentials`: Retrieve Metakocka credentials
- `DELETE /api/metakocka/credentials`: Remove Metakocka credentials

### Contact Sync API

- `POST /api/metakocka/contacts/sync`: Sync a contact to Metakocka
- `GET /api/metakocka/contacts/mappings`: Get contact mappings
- `POST /api/metakocka/contacts/import`: Import contacts from Metakocka

### Sales Document API

- `POST /api/metakocka/sales-documents/sync`: Sync a sales document to Metakocka
- `GET /api/metakocka/sales-documents/mappings`: Get sales document mappings
- `POST /api/metakocka/sales-documents/import`: Import sales documents from Metakocka

### Email Integration API

- `POST /api/emails/metakocka`: Process an email for Metakocka metadata
- `GET /api/emails/metakocka`: Get Metakocka metadata for an email
- `GET /api/emails/ai-context`: Get AI context for an email with Metakocka data
- `POST /api/emails/ai-context`: Generate AI response using Metakocka context
- `GET /api/emails/templates`: Get email templates with Metakocka placeholders
- `POST /api/emails/templates`: Create/apply email templates with Metakocka data

## Security Considerations

1. **Credential Storage**: Metakocka credentials are encrypted in the database
2. **Authentication**: All API endpoints require authentication
3. **Multi-tenancy**: Data is isolated by user/company
4. **Service Token**: Background processes use a secure service token

## Error Handling

The integration includes a comprehensive error logging system:
- `error-logger.ts`: Logs errors with context for troubleshooting
- Error retry mechanisms for transient failures
- User-friendly error messages in the UI

## Database Schema

See [Database Schema](./database-schema.md) for detailed information on the database tables used by the Metakocka integration.
