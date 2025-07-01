# Metakocka Sales Document Integration

This document provides a detailed overview of the sales document integration between the Fresh AI CRM system and Metakocka ERP.

## Overview

The sales document integration enables the synchronization of sales documents (invoices, offers, orders) between the CRM system and Metakocka ERP. This ensures that sales data is consistent across both systems, providing a unified view of customer transactions.

## Key Features

1. **Bidirectional Sync**: Synchronize sales documents in both directions (CRM → Metakocka and Metakocka → CRM)
2. **Multiple Document Types**: Support for various document types (invoices, offers, orders, etc.)
3. **Line Item Synchronization**: Detailed synchronization of document line items
4. **Status Tracking**: Track document status across systems
5. **Document Linking**: Maintain relationships between CRM and Metakocka documents
6. **Document Generation**: Create new documents in Metakocka from CRM data

## Architecture

The sales document integration follows this architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                 Sales Document Synchronization Flow             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                   Sales Document Selected/Created               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Data Transformation                         │
│  - Map CRM fields to Metakocka fields                          │
│  - Transform line items                                         │
│  - Validate required fields                                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    Metakocka API Interaction                    │
│  - Create/update document in Metakocka                          │
│  - Handle API responses and errors                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Mapping Management                          │
│  - Create/update mapping record                                 │
│  - Store Metakocka document ID                                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Status Reporting                            │
│  - Return sync status to user                                   │
│  - Log sync activity                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Sales Document Transformer

**Purpose**: Transform sales document data between CRM and Metakocka formats.

**Key Functions**:
- Map CRM document fields to Metakocka document fields
- Transform line items and pricing information
- Handle tax calculations
- Format data according to Metakocka API requirements

**Implementation**: `src/lib/integrations/metakocka/sales-document-transformer.ts`

### 2. Sales Document Synchronizer

**Purpose**: Synchronize sales documents between CRM and Metakocka.

**Key Functions**:
- Send document data to Metakocka API
- Retrieve document data from Metakocka API
- Handle API responses and errors
- Manage retry logic for failed operations

**Implementation**: `src/lib/integrations/metakocka/sales-document-sync.ts`

### 3. Mapping Manager

**Purpose**: Manage mappings between CRM sales documents and Metakocka documents.

**Key Functions**:
- Create/update mapping records
- Retrieve mapping information
- Handle mapping conflicts
- Clean up orphaned mappings

**Implementation**: `src/lib/integrations/metakocka/document-mapping-manager.ts`

### 4. Document Status Tracker

**Purpose**: Track and update document status across systems.

**Key Functions**:
- Monitor document status changes
- Propagate status updates between systems
- Handle status conflicts
- Provide status history

**Implementation**: `src/lib/integrations/metakocka/document-status-tracker.ts`

## Database Schema

### Sales Documents Table

```sql
CREATE TABLE sales_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type VARCHAR(50) NOT NULL,
  document_number VARCHAR(100),
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  due_date DATE,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  subtotal_amount DECIMAL(15, 2) NOT NULL,
  tax_amount DECIMAL(15, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX idx_sales_documents_contact_id ON sales_documents(contact_id);
CREATE INDEX idx_sales_documents_document_type ON sales_documents(document_type);
CREATE INDEX idx_sales_documents_status ON sales_documents(status);
```

### Metakocka Sales Document Mappings

```sql
CREATE TABLE metakocka_sales_document_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES sales_documents(id) ON DELETE CASCADE,
  metakocka_id VARCHAR(255) NOT NULL,
  metakocka_type VARCHAR(50) NOT NULL,
  metakocka_status VARCHAR(50),
  metakocka_document_number VARCHAR(100),
  sync_status VARCHAR(50) NOT NULL DEFAULT 'synced',
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX idx_metakocka_sales_document_mappings_document_id ON metakocka_sales_document_mappings(document_id);
CREATE INDEX idx_metakocka_sales_document_mappings_metakocka_id ON metakocka_sales_document_mappings(metakocka_id);
```

## Document Type Mapping

| CRM Document Type | Metakocka Document Type |
|-------------------|------------------------|
| invoice | issued_invoice |
| offer | offer |
| order | sales_order |
| credit_note | credit_note |
| proforma | proforma_invoice |

## Field Mapping

| CRM Field | Metakocka Field | Notes |
|-----------|----------------|-------|
| document_number | doc_number | Generated by Metakocka if not provided |
| contact_id | partner_id | Requires contact mapping |
| issue_date | doc_date | Required |
| due_date | due_date | Optional |
| currency | currency_code | ISO currency code |
| subtotal_amount | sum_basic | Before tax |
| tax_amount | sum_tax | Tax amount |
| total_amount | sum_all | Total with tax |
| status | status_id | Status mapping applied |
| notes | notes | Document notes |

## Status Mapping

| CRM Status | Metakocka Status |
|------------|-----------------|
| draft | draft |
| sent | sent |
| paid | paid |
| overdue | overdue |
| canceled | canceled |

## API Endpoints

### Sales Document Synchronization

- `POST /api/metakocka/sales-documents/sync`: Sync a sales document to Metakocka
  - Request: `{ documentId: string }`
  - Response: `{ success: boolean, data: { mappingId: string, metakockaId: string } }`

### Bulk Sales Document Synchronization

- `POST /api/metakocka/sales-documents/bulk-sync`: Sync multiple sales documents to Metakocka
  - Request: `{ documentIds: string[] }`
  - Response: `{ success: boolean, data: { total: number, succeeded: number, failed: number, results: [] } }`

### Sales Document Mapping Retrieval

- `GET /api/metakocka/sales-documents/mappings`: Get sales document mappings
  - Request: `?documentId=<document_id>` or `?metakockaId=<metakocka_id>`
  - Response: `{ success: boolean, data: { id, documentId, metakockaId, metakockaType, metakockaStatus, syncStatus, lastSyncedAt } }`

### Sales Document Import

- `POST /api/metakocka/sales-documents/import`: Import a sales document from Metakocka
  - Request: `{ metakockaId: string, metakockaType: string }`
  - Response: `{ success: boolean, data: { documentId: string, mappingId: string } }`

### Sales Document Status Update

- `POST /api/metakocka/sales-documents/status`: Update sales document status
  - Request: `{ documentId: string, status: string }`
  - Response: `{ success: boolean, data: { documentId: string, status: string, metakockaStatus: string } }`

## Error Handling

The sales document integration includes comprehensive error handling:

1. **Validation Errors**: Proper validation of document data before synchronization
2. **API Errors**: Handling of Metakocka API errors with appropriate error messages
3. **Line Item Errors**: Special handling for line item synchronization issues
4. **Retry Logic**: Automatic retry for transient errors
5. **Error Logging**: Detailed error logging for troubleshooting

## Testing

The sales document integration can be tested using the `test-sales-document-sync.js` script, which verifies:

1. Single sales document sync (CRM → Metakocka)
2. Bulk sales document sync (CRM → Metakocka)
3. Sales document mapping status retrieval
4. Single sales document sync (Metakocka → CRM)
5. Error handling and status tracking

See the [Testing Guide](./testing-guide.md) for detailed instructions on running the tests.

## UI Components

The sales document integration includes several UI components for seamless user interaction:

### 1. SyncSalesDocumentButton

**Purpose**: Provides individual document sync functionality with status indicators.

**Features**:
- Visual status indicators (synced, not synced, error, in progress)
- Tooltip with sync status and timestamp
- Error handling with user-friendly messages
- Success/failure notifications

**Implementation**: `src/components/integrations/metakocka/SyncSalesDocumentButton.tsx`

### 2. SyncAllSalesDocumentsButton

**Purpose**: Enables bulk synchronization of sales documents.

**Features**:
- Initiates sync for all eligible documents
- Progress indication
- Summary of results (success/failure counts)
- Error handling with detailed feedback

**Implementation**: `src/components/integrations/metakocka/SyncAllSalesDocumentsButton.tsx`

### 3. SalesDocumentSyncSection

**Purpose**: Provides comprehensive sync status display and actions.

**Features**:
- Detailed sync status information
- Last sync timestamp
- Error details with troubleshooting guidance
- Individual and bulk sync actions

**Implementation**: `src/components/integrations/metakocka/SalesDocumentSyncSection.tsx`

### 4. SalesDocumentBulkSyncUI

**Purpose**: Advanced interface for selecting and syncing multiple documents.

**Features**:
- Document selection with checkboxes
- Batch sync operations
- Progress tracking
- Detailed status reporting

**Implementation**: `src/components/integrations/metakocka/SalesDocumentBulkSyncUI.tsx`

## Integration Points

The sales document sync UI is integrated at these key points:

1. **Sales Document List Page**: 
   - Individual sync buttons for each document
   - Bulk sync option in the header
   - Status indicators for each document
   - Path: `src/app/dashboard/sales-documents/page.tsx`

2. **Sales Document Detail Page**: 
   - Detailed sync section with comprehensive status
   - Sync action button
   - Sync history information
   - Path: `src/app/dashboard/sales-documents/[id]/page.tsx`

## Recent Changes

- Completed UI integration for sales document synchronization
- Added comprehensive sync status display components
- Implemented bulk selection and sync interface
- Added visual indicators for sync status
- Improved error handling and user feedback
- Enhanced field mapping for better data consistency
- Added retry logic for transient API errors
- Implemented document status tracking

## Open Tasks

- Add support for document deletion synchronization
- Enhance line item synchronization with product mappings
- Implement periodic automatic synchronization
- Add support for document attachments
- Improve performance for large document datasets
