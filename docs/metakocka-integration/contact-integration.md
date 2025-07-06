# Metakocka Contact Integration

This document provides a detailed overview of the contact integration between the CRM Mind system and Metakocka ERP.

## Overview

The contact integration enables bidirectional synchronization of contact data between the CRM system and Metakocka ERP. This ensures that contact information is consistent across both systems, providing a unified view of customer data.

## Key Features

1. **Bidirectional Sync**: Synchronize contacts in both directions (CRM → Metakocka and Metakocka → CRM)
2. **Bulk Operations**: Support for both single contact and bulk contact synchronization
3. **Mapping Management**: Maintain relationships between CRM contacts and Metakocka contacts
4. **Field Mapping**: Intelligent mapping of contact fields between systems
5. **Conflict Resolution**: Handle conflicts when contact data differs between systems
6. **Error Handling**: Comprehensive error handling and reporting

## Architecture

The contact integration follows this architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Contact Synchronization Flow                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Contact Selected/Created                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Data Transformation                         │
│  - Map CRM fields to Metakocka fields                          │
│  - Validate required fields                                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    Metakocka API Interaction                    │
│  - Create/update contact in Metakocka                           │
│  - Handle API responses and errors                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Mapping Management                          │
│  - Create/update mapping record                                 │
│  - Store Metakocka contact ID                                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Status Reporting                            │
│  - Return sync status to user                                   │
│  - Log sync activity                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Contact Transformer

**Purpose**: Transform contact data between CRM and Metakocka formats.

**Key Functions**:
- Map CRM contact fields to Metakocka contact fields
- Handle special fields (e.g., address formatting)
- Validate required fields
- Format data according to Metakocka API requirements

**Implementation**: `src/lib/integrations/metakocka/contact-transformer.ts`

### 2. Contact Synchronizer

**Purpose**: Synchronize contacts between CRM and Metakocka.

**Key Functions**:
- Send contact data to Metakocka API
- Retrieve contact data from Metakocka API
- Handle API responses and errors
- Manage retry logic for failed operations

**Implementation**: `src/lib/integrations/metakocka/contact-sync.ts`

### 3. Mapping Manager

**Purpose**: Manage mappings between CRM contacts and Metakocka contacts.

**Key Functions**:
- Create/update mapping records
- Retrieve mapping information
- Handle mapping conflicts
- Clean up orphaned mappings

**Implementation**: `src/lib/integrations/metakocka/mapping-manager.ts`

### 4. Bulk Processor

**Purpose**: Handle bulk contact synchronization operations.

**Key Functions**:
- Process multiple contacts in batches
- Track progress of bulk operations
- Handle partial failures
- Report bulk operation results

**Implementation**: `src/lib/integrations/metakocka/bulk-processor.ts`

## Database Schema

### Metakocka Contact Mappings

```sql
CREATE TABLE metakocka_contact_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  metakocka_id VARCHAR(255) NOT NULL,
  metakocka_type VARCHAR(50) NOT NULL,
  sync_status VARCHAR(50) NOT NULL DEFAULT 'synced',
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX idx_metakocka_contact_mappings_contact_id ON metakocka_contact_mappings(contact_id);
CREATE INDEX idx_metakocka_contact_mappings_metakocka_id ON metakocka_contact_mappings(metakocka_id);
```

## Field Mapping

| CRM Field | Metakocka Field | Notes |
|-----------|----------------|-------|
| name | name | Required |
| email | email | Primary email |
| phone | phone | Primary phone |
| address | address | Formatted as street, city, postal_code |
| country | country | ISO country code |
| company_name | company_name | For business contacts |
| tax_number | tax_id | VAT or tax identification number |
| notes | notes | Contact notes |
| website | website | Company website |

## API Endpoints

### Contact Synchronization

- `POST /api/metakocka/contacts/sync`: Sync a contact to Metakocka
  - Request: `{ contactId: string }`
  - Response: `{ success: boolean, data: { mappingId: string, metakockaId: string } }`

### Bulk Contact Synchronization

- `POST /api/metakocka/contacts/bulk-sync`: Sync multiple contacts to Metakocka
  - Request: `{ contactIds: string[] }`
  - Response: `{ success: boolean, data: { total: number, succeeded: number, failed: number, results: [] } }`

### Contact Mapping Retrieval

- `GET /api/metakocka/contacts/mappings`: Get contact mappings
  - Request: `?contactId=<contact_id>` or `?metakockaId=<metakocka_id>`
  - Response: `{ success: boolean, data: { id, contactId, metakockaId, metakockaType, syncStatus, lastSyncedAt } }`

### Contact Import

- `POST /api/metakocka/contacts/import`: Import a contact from Metakocka
  - Request: `{ metakockaId: string }`
  - Response: `{ success: boolean, data: { contactId: string, mappingId: string } }`

### Bulk Contact Import

- `POST /api/metakocka/contacts/bulk-import`: Import multiple contacts from Metakocka
  - Request: `{ metakockaIds: string[] }` or `{ importAll: boolean }`
  - Response: `{ success: boolean, data: { total: number, imported: number, failed: number, results: [] } }`

## Error Handling

The contact integration includes comprehensive error handling:

1. **Validation Errors**: Proper validation of contact data before synchronization
2. **API Errors**: Handling of Metakocka API errors with appropriate error messages
3. **Conflict Resolution**: Detection and resolution of conflicts between CRM and Metakocka data
4. **Retry Logic**: Automatic retry for transient errors
5. **Error Logging**: Detailed error logging for troubleshooting

## Testing

The contact integration can be tested using the `test-contact-sync.js` script located in the `tests/metakocka` directory, which verifies:

1. Single contact sync (CRM → Metakocka)
2. Bulk contact sync (CRM → Metakocka)
3. Contact mapping status retrieval
4. Single contact sync (Metakocka → CRM)
5. Bulk contact sync (Metakocka → CRM)

### Running the Tests

To run the contact sync tests:

1. Navigate to the `tests/metakocka` directory
2. Copy the `contact-sync-test.env.sample` file to `.env`
3. Update the following values in the `.env` file:
   - `AUTH_TOKEN`: A valid authentication token for API requests
   - `CONTACT_ID`: An actual contact ID from the CRM database
   - `METAKOCKA_ID`: (Optional) A Metakocka partner ID for reverse sync testing
4. Run the test script using the provided shell script:
   ```bash
   ./run-contact-sync-test.sh
   ```

The script will execute all test cases and provide detailed output for each API call, including request details, response status, and response data. Any errors encountered during testing will be clearly indicated.

### Manual Testing

You can also test the API endpoints manually using the curl commands included as comments at the end of the `test-contact-sync.js` file.

See the [Testing Guide](./testing-guide.md) for more comprehensive testing instructions and additional test scenarios.

## Recent Changes

- Added support for bulk contact synchronization
- Improved error handling and reporting
- Enhanced field mapping for better data consistency
- Added retry logic for transient API errors
- Implemented conflict resolution for bidirectional sync

## Open Tasks

- Add support for contact deletion synchronization
- Enhance conflict resolution with user-configurable rules
- Implement periodic automatic synchronization
- Add support for contact merging
- Improve performance for large contact datasets
