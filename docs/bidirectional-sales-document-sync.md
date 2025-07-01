# Bidirectional Sales Document Synchronization

## Overview

The bidirectional sales document synchronization feature allows you to keep sales documents in sync between Fresh AI CRM and Metakocka. This document explains how to use this feature, its capabilities, and how to troubleshoot common issues.

## Features

- **CRM to Metakocka Sync**: Push sales documents from Fresh AI CRM to Metakocka
- **Metakocka to CRM Sync**: Pull sales documents from Metakocka to Fresh AI CRM
- **Bulk Synchronization**: Sync multiple documents at once
- **Sync Status Tracking**: Monitor the sync status of each document
- **Error Handling**: Robust error handling with detailed logs
- **Retry Logic**: Automatic retries with exponential backoff for failed sync operations

## Prerequisites

1. **Metakocka Integration Setup**: Ensure your Metakocka integration is properly configured with valid API credentials
2. **User Permissions**: Users must have appropriate permissions to sync sales documents

## Using the UI Components

### Sales Documents List Page

The sales documents list page includes several UI components for document synchronization:

1. **Sync From Metakocka Button**: Located in the top action bar, this button allows you to:
   - View the count of unsynced documents in Metakocka
   - Sync all unsynced documents from Metakocka to CRM

2. **Sync All Sales Documents Button**: Also in the top action bar, this button allows you to:
   - Sync all CRM sales documents to Metakocka
   - View the progress of the bulk sync operation

3. **Individual Sync Buttons**: Each sales document card includes a sync button that allows you to:
   - Sync an individual document to Metakocka
   - View the sync status of the document

### Sales Document Detail Page

The sales document detail page includes a sync status section that shows:

- Current sync status
- Last sync timestamp
- Metakocka document ID (if synced)
- Sync action buttons

## API Endpoints

### CRM to Metakocka

```
POST /api/integrations/metakocka/sales-documents/sync
Body: { documentId: "your-document-id" }
```

Syncs a single sales document from CRM to Metakocka.

```
POST /api/integrations/metakocka/sales-documents/sync-bulk
Body: { documentIds: ["id1", "id2", ...] }
```

Syncs multiple sales documents from CRM to Metakocka.

### Metakocka to CRM

```
GET /api/integrations/metakocka/sales-documents/sync-from-metakocka
```

Gets a list of unsynced sales documents from Metakocka.

```
POST /api/integrations/metakocka/sales-documents/sync-from-metakocka
Body: { metakockaId: "metakocka-document-id" }
```

Syncs a single sales document from Metakocka to CRM.

```
POST /api/integrations/metakocka/sales-documents/sync-all-from-metakocka
```

Syncs all unsynced sales documents from Metakocka to CRM.

### Status Checking

```
GET /api/integrations/metakocka/sales-documents/sync?documentId=your-document-id
```

Gets the sync status of a specific sales document.

## Testing

A comprehensive test script is available to verify the bidirectional sync functionality:

```bash
cd tests/metakocka
cp bidirectional-sync-test.env.sample .env
# Update the .env file with your authentication token
./run-bidirectional-sync-test.sh
```

The test script verifies:
1. Creating a test sales document in CRM
2. Syncing the document to Metakocka
3. Verifying the document exists in Metakocka
4. Syncing the document back from Metakocka to CRM
5. Verifying the document in CRM

## Troubleshooting

### Common Issues

1. **Sync Failures**
   - Check your Metakocka API credentials
   - Verify that the document has all required fields for Metakocka
   - Check the error logs for detailed error messages

2. **Missing Documents**
   - Ensure that the document meets Metakocka's requirements
   - Check if the document has been deleted in either system

3. **Duplicate Documents**
   - This can happen if a document is synced multiple times
   - Use the mapping status API to check if a document is already mapped

### Error Logs

Detailed error logs are available in the Metakocka Error Log Management system. These logs include:

- Error type and message
- Document IDs
- User context
- Timestamp
- Stack trace (for technical users)

## Best Practices

1. **Regular Sync**: Regularly sync your documents to keep both systems up to date
2. **Check Sync Status**: Always check the sync status before making changes to a document
3. **Handle Errors**: Address sync errors promptly to prevent data inconsistencies
4. **Test Changes**: Test any changes to document structure with the test script

## Security Considerations

- All sync operations are scoped to the current user's organization
- API endpoints require proper authentication
- Sensitive data is properly sanitized before syncing

## Future Enhancements

- Automated scheduled sync
- Conflict resolution for simultaneous edits
- Enhanced reporting on sync status
- Webhook support for real-time updates
