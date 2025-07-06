# Metakocka Integration Documentation

## Overview

The CRM Mind system integrates with Metakocka ERP to provide a unified platform for AI-driven communication and business operations. This integration enables bidirectional synchronization of products, contacts, and sales documents, as well as AI-enhanced email processing with Metakocka context.

## Core Components

### 1. API Client and Service Layer

- **MetakockaClient**: Low-level API client for direct Metakocka API calls
- **MetakockaService**: Business logic layer for credential management
- **Error logging system**: Comprehensive error tracking and resolution

### 2. Data Synchronization Services

- **Products**: Bidirectional sync between CRM and Metakocka
- **Contacts**: Bidirectional sync with partner mapping
- **Sales Documents**: Bidirectional sync with document mapping
- **Inventory**: Read-only access to Metakocka inventory data

### 3. Email/AI Integration

- Email metadata enrichment with Metakocka data
- AI context building using Metakocka entities
- Email templates with Metakocka placeholders
- AI-powered response generation with Metakocka context

## Setup and Configuration

### Credentials Management

1. Navigate to the Metakocka integration settings page
2. Enter your Metakocka company ID and secret key
3. Test the connection to verify credentials
4. Save the credentials to enable integration features

### Database Tables

The integration uses the following database tables:

- `metakocka_credentials`: Stores API credentials
- `metakocka_product_mappings`: Maps CRM products to Metakocka products
- `metakocka_contact_mappings`: Maps CRM contacts to Metakocka partners
- `metakocka_sales_document_mappings`: Maps CRM sales documents to Metakocka documents
- `metakocka_error_logs`: Tracks errors and their resolution status

## Documentation

- [Metakocka API Documentation](https://metakocka.com/api/)
- [Metakocka Error Log Management](./metakocka-error-log-management.md)
- [Bidirectional Sales Document Sync](./bidirectional-sales-document-sync.md)

## User Interface Components

### Product Synchronization

- **SyncProductButton**: Individual product sync with status indicators
- **SyncAllProductsButton**: Bulk sync functionality

### Contact Synchronization

- **SyncContactButton**: Individual contact sync with status indicators
- **SyncAllContactsButton**: Bulk sync functionality

### Sales Document Synchronization

- **SyncSalesDocumentButton**: Individual document sync from CRM to Metakocka with status indicators
- **SyncAllSalesDocumentsButton**: Bulk sync from CRM to Metakocka functionality
- **SyncFromMetakockaButton**: Sync documents from Metakocka to CRM with unsynced count display
- **SalesDocumentSyncSection**: Comprehensive sync status display and actions
- **SalesDocumentBulkSyncUI**: Bulk selection and sync interface

### Error Management

- **Error logs page**: View and manage integration errors
- **Error resolution UI**: Resolve individual or bulk errors
- **Error statistics dashboard**: Monitor error trends

## API Endpoints

### Product Endpoints

```
/api/products/sync (POST) - Sync single product to Metakocka
/api/products/sync/bulk (POST) - Sync multiple products to Metakocka
/api/products/sync (GET) - Get product sync status
/api/products/sync-from-metakocka (GET) - Get unsynced products from Metakocka
/api/products/sync-from-metakocka (POST) - Sync single product from Metakocka
/api/products/sync-all-from-metakocka (POST) - Sync multiple products from Metakocka
```

### Contact Endpoints

```
/api/integrations/metakocka/contacts/sync-to-metakocka (POST) - Sync single contact to Metakocka
/api/integrations/metakocka/contacts/sync-to-metakocka?bulk=true (POST) - Sync multiple contacts to Metakocka
/api/integrations/metakocka/contacts/mappings (GET) - Get contact mapping status
/api/integrations/metakocka/contacts/sync-from-metakocka (GET) - Get unsynced partners from Metakocka
/api/integrations/metakocka/contacts/sync-from-metakocka (POST) - Sync single contact from Metakocka
/api/integrations/metakocka/contacts/sync-all-from-metakocka (POST) - Sync multiple contacts from Metakocka
```

### Sales Document Endpoints

```
/api/integrations/metakocka/sales-documents/sync (POST) - Sync single sales document to Metakocka
/api/integrations/metakocka/sales-documents/sync-bulk (POST) - Sync multiple sales documents to Metakocka
/api/integrations/metakocka/sales-documents/sync (GET) - Get sales document sync status
/api/integrations/metakocka/sales-documents/sync-from-metakocka (GET) - Get unsynced sales documents from Metakocka
/api/integrations/metakocka/sales-documents/sync-from-metakocka (POST) - Sync single sales document from Metakocka
/api/integrations/metakocka/sales-documents/sync-all-from-metakocka (POST) - Sync multiple sales documents from Metakocka
```

### Error Management Endpoints

```
/api/integrations/metakocka/logs (GET) - Get error logs with optional filters
/api/integrations/metakocka/logs/:id/resolve (POST) - Resolve a single error log
/api/integrations/metakocka/logs/bulk-resolve (POST) - Resolve multiple error logs
/api/integrations/metakocka/logs/export (GET) - Export error logs to CSV
/api/integrations/metakocka/logs/stats (GET) - Get error statistics
```

### Email/AI Integration Endpoints

```
/api/emails/:id/metakocka-context (GET) - Get Metakocka context for an email
/api/ai/generate-response (POST) - Generate AI response with Metakocka context
/api/emails/templates/populate (POST) - Populate email template with Metakocka data
```

## Testing

### Test Scripts

The following test scripts are available in the `tests/metakocka` directory:

1. **Product Sync Testing**
   - Script: `test-product-sync.js`
   - Runner: `run-product-sync-test.sh`
   - Tests bidirectional product synchronization

2. **Contact Sync Testing**
   - Script: `test-contact-sync.js`
   - Runner: `run-contact-sync-test.sh`
   - Tests bidirectional contact synchronization

3. **Sales Document Sync Testing**
   - Script: `test-sales-document-sync.js`
   - Runner: `run-sales-document-sync-test.sh`
   - Tests bidirectional sales document synchronization

4. **Error Management Testing**
   - Script: `test-error-log-management.js`
   - Runner: `run-error-log-test.sh`
   - Tests error logging, filtering, resolution, and export

5. **Email/AI Integration Testing**
   - Script: `test-email-metakocka-integration.js`
   - Runner: `run-email-metakocka-test.sh`
   - Tests email enrichment, AI context building, and response generation

### Running Tests

To run a test script:

1. Navigate to the test directory:
   ```bash
   cd tests/metakocka
   ```

2. Copy the sample environment file and update with your credentials:
   ```bash
   cp product-sync-test.env.sample .env
   # Edit .env with your credentials
   ```

3. Run the test script using the provided shell runner:
   ```bash
   ./run-product-sync-test.sh
   ```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Metakocka credentials are correct
   - Check that the credentials are active in Metakocka
   - Ensure the company ID matches the secret key

2. **Sync Failures**
   - Check error logs for specific error messages
   - Verify that required fields are present in both systems
   - Check for data format inconsistencies

3. **API Rate Limiting**
   - Implement retry logic for bulk operations
   - Spread large sync operations over time

### Error Resolution

1. Navigate to the error logs page
2. Review error details and context
3. Take appropriate action to fix the underlying issue
4. Mark the error as resolved with resolution notes

## Best Practices

1. **Initial Setup**
   - Start with small data sets for initial synchronization
   - Verify data integrity after initial sync
   - Configure error notifications

2. **Ongoing Operations**
   - Regularly check error logs
   - Perform bulk syncs during off-peak hours
   - Keep credentials secure and updated

3. **Data Management**
   - Maintain consistent naming conventions across systems
   - Regularly audit mappings for orphaned records
   - Document custom field mappings

## Future Enhancements

1. **Multi-Tenancy Improvements**
   - Organization-based credential mapping
   - Tenant isolation for all operations

2. **Advanced AI Features**
   - Predictive inventory management
   - Sales forecasting with Metakocka data
   - Automated document classification

3. **UI Enhancements**
   - Unified dashboard for all Metakocka integrations
   - Visual sync status indicators
   - Interactive data mapping tools
