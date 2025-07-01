# Metakocka Contact Synchronization

This document describes the bidirectional contact synchronization between Fresh AI CRM and Metakocka.

## Overview

The contact synchronization feature allows contacts to be synchronized between Fresh AI CRM and Metakocka in both directions:

1. **CRM → Metakocka**: Sync contacts from Fresh AI CRM to Metakocka
2. **Metakocka → CRM**: Sync partners from Metakocka to Fresh AI CRM

## Architecture

The synchronization is handled by two main service classes:

- `ContactSyncToMetakockaService`: Handles syncing contacts from CRM to Metakocka
- `ContactSyncFromMetakockaService`: Handles syncing partners from Metakocka to CRM

## Key Features

### Retry Logic

All sync operations are wrapped with retry logic using the `MetakockaRetryHandler` class:

```typescript
return MetakockaRetryHandler.executeWithRetry(
  async () => {
    // Sync operation logic
  },
  {
    userId,
    operationName: 'syncContactFromMetakocka',
    metakockaId,
    details: { operation: 'single-contact-sync-from-metakocka' }
  },
  retryConfig
);
```

The retry handler provides:
- Configurable retry attempts
- Exponential backoff with jitter
- Detailed error logging

### Error Handling

Errors are logged using the `MetakockaErrorLogger` under the `SYNC` category:

```typescript
ErrorLogger.logError(LogCategory.SYNC, 'Error syncing contacts from Metakocka', {
  userId,
  metakockaId: 'batch',
  details: { contactCount: metakockaIds?.length || 0 },
  error
});
```

### Multi-tenant Isolation

All operations enforce multi-tenant isolation by filtering with `userId`:

```typescript
const { data: mapping, error: mappingError } = await supabase
  .from('metakocka_contact_mappings')
  .select('contact_id')
  .eq('metakocka_id', metakockaId)
  .eq('user_id', userId)
  .single();
```

## API Endpoints

### CRM → Metakocka

- **Single Contact Sync**: `POST /api/integrations/metakocka/contacts/sync-to-metakocka`
  - Body: `{ "contactId": "your_contact_id" }`

- **Bulk Contact Sync**: `POST /api/integrations/metakocka/contacts/sync-to-metakocka?bulk=true`
  - Body: `{ "contactIds": ["your_contact_id"] }`

### Metakocka → CRM

- **Single Contact Sync**: `POST /api/integrations/metakocka/contacts/sync-from-metakocka`
  - Body: `{ "metakockaId": "your_metakocka_id" }`

- **Get Unsynced Partners**: `GET /api/integrations/metakocka/contacts/sync-from-metakocka`

- **Bulk Contact Sync**: `POST /api/integrations/metakocka/contacts/sync-all-from-metakocka`
  - Body: `{ "metakockaIds": ["your_metakocka_id"] }`

### Mappings

- **Get Contact Mapping**: `GET /api/integrations/metakocka/contacts/mappings?contactId=your_contact_id`

- **Get All Contact Mappings**: `GET /api/integrations/metakocka/contacts/mappings`

## Testing

The contact synchronization can be tested using the `test-contact-sync.js` script in the `tests/metakocka` directory.

### Prerequisites

Before running the tests:

1. Set up environment variables:
   - `AUTH_TOKEN`: Valid authentication token
   - `CONTACT_ID`: Actual contact ID from the database
   - `METAKOCKA_ID`: (Optional) Metakocka partner ID for reverse sync testing

2. Run the test script:
   ```bash
   cd tests/metakocka
   ./run-contact-sync-test.sh
   ```

## Best Practices

1. **Error Handling**: Always wrap operations with try-catch blocks and log errors with appropriate context
2. **Retry Logic**: Use `MetakockaRetryHandler.executeWithRetry` for all API operations
3. **Multi-tenant Isolation**: Always include `userId` in database queries and API calls
4. **Parameter Validation**: Validate input parameters before making API calls
5. **Result Aggregation**: For bulk operations, aggregate results including success/failure counts
