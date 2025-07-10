# Metakocka Integration Documentation

This document provides comprehensive information about the Metakocka integration with our CRM system, focusing on the bidirectional sales document synchronization feature.

## Overview

The Metakocka integration allows for seamless synchronization of sales documents between your CRM and Metakocka accounting system. The integration supports:

- **Bidirectional Sync**: Full support for CRM ↔ Metakocka document synchronization
- **Bulk Operations**: Sync multiple documents at once
- **Status Tracking**: Track sync status and history
- **Error Handling**: Comprehensive error handling with detailed logging
- **Multi-tenant**: Proper user isolation in all operations

## Setup Requirements

1. **Metakocka API Credentials**:
   - API Key
   - API URL
   - Company ID

2. **Environment Variables**:
   ```
   METAKOCKA_API_KEY=your_api_key
   METAKOCKA_API_URL=https://api.metakocka.si/rest/v1
   METAKOCKA_COMPANY_ID=your_company_id
   ```

3. **User Permissions**:
   - Users must be members of an organization to access the sync features
   - Admin permissions are required for bulk operations

## Using the Integration

### Sales Document Synchronization

#### Individual Document Sync (CRM → Metakocka)

1. Navigate to a sales document detail page
2. Click the sync button (refresh icon)
3. The system will:
   - Convert the document to Metakocka format
   - Send it to Metakocka API
   - Store the mapping between CRM and Metakocka IDs
   - Update the sync status

#### Bulk Document Sync (CRM → Metakocka)

1. Go to the sales documents list page
2. Click "Sync All Documents" button
3. The system will sync all documents and provide progress updates

#### Individual Document Sync (Metakocka → CRM)

1. Navigate to the Metakocka integration page
2. Select a document from the "Unsynced Documents" list
3. Click "Import to CRM"
4. The system will create a new sales document in the CRM

#### Bulk Document Sync (Metakocka → CRM)

1. Navigate to the Metakocka integration page
2. Click "Import All Documents"
3. The system will import all unsynced documents from Metakocka

## UI Components

The integration provides several UI components:

1. **SyncSalesDocumentButton**: Button for syncing individual documents
   - Shows sync status (synced, not synced, error)
   - Displays last sync time in tooltip
   - Provides visual feedback during sync

2. **SyncAllSalesDocumentsButton**: Button for bulk sync operations
   - Shows progress indicator
   - Provides detailed success/failure counts
   - Offers retry functionality for failed operations

## Error Handling

The integration includes comprehensive error handling:

- **API Errors**: Detailed logging of API communication errors
- **Validation Errors**: Data validation before sync attempts
- **Retry Logic**: Automatic retry for transient failures
- **User Feedback**: Clear error messages in the UI
- **Logging**: All errors are logged for troubleshooting

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Verify your Metakocka API credentials
   - Check that your API key has sufficient permissions

2. **Sync Failures**:
   - Ensure all required fields are completed in the sales document
   - Check for special characters that may cause validation issues
   - Verify that related entities (contacts, products) are also synced

3. **Performance Issues**:
   - Bulk operations are processed in batches to avoid overwhelming the API
   - For large datasets, consider using scheduled sync jobs

### Logs

All sync operations are logged with detailed information:

- Sync direction (CRM → Metakocka or Metakocka → CRM)
- Document IDs in both systems
- Timestamp
- Success/failure status
- Error details if applicable

## Testing

The integration includes comprehensive test scripts:

1. **Simple Test**: Mock-based testing without real API calls
   ```bash
   cd tests/metakocka
   ./run-simple-test.sh
   ```

2. **Full Test Suite**: Tests with real API calls
   ```bash
   cd tests/metakocka
   ./run-full-test-suite.sh
   ```

3. **Environment Generator**: Helper to create test environment
   ```bash
   cd tests/metakocka
   ./run-env-generator.sh
   ```

## Architecture

The integration follows a layered architecture:

1. **UI Layer**: React components for user interaction
2. **API Layer**: Next.js API routes for server-side operations
3. **Service Layer**: Core business logic for sync operations
4. **Data Layer**: Database operations for storing sync state

### Key Dependencies

- Supabase for authentication and database operations
- Metakocka API client for communication with Metakocka
- ProductSyncService and ContactSyncService for related data sync

## Future Enhancements

Planned improvements for the integration:

1. Dedicated bulk sync API endpoint for Metakocka → CRM sync
2. Webhook support for real-time updates
3. Enhanced conflict resolution for bidirectional sync
4. Scheduled background sync jobs
5. More detailed sync history and audit logs

## Support

For issues with the Metakocka integration:

1. Check the logs for detailed error information
2. Run the test scripts to verify API connectivity
3. Contact support with the error details and logs
