# Metakocka Integration Implementation Plan

## Overview

This document outlines the plan to apply consistent patterns for retry logic, error handling, and security across all Metakocka integration components. The implementation will be done in phases to ensure stability and proper testing at each step.

## Phase 1: Documentation and Security Review (Completed)

- ✅ Created comprehensive documentation for contact sync functionality
- ✅ Performed security review of `ContactSyncFromMetakockaService`
- ✅ Established security guidelines for Metakocka integration

## Phase 2: Sales Document Sync Service Improvements

### 2.1 Apply Retry Logic to Sales Document Sync

Apply the same retry pattern used in `ContactSyncFromMetakockaService` to the sales document sync service:

```typescript
// Before
static async syncSalesDocumentToMetakocka(userId: string, documentId: string): Promise<string> {
  try {
    // Sync logic
  } catch (error) {
    console.error('Error syncing sales document:', error);
    throw error;
  }
}

// After
static async syncSalesDocumentToMetakocka(
  userId: string, 
  documentId: string,
  retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<string> {
  return MetakockaRetryHandler.executeWithRetry(
    async () => {
      // Sync logic
    },
    {
      userId,
      operationName: 'syncSalesDocumentToMetakocka',
      documentId,
      details: { operation: 'single-document-sync' }
    },
    retryConfig
  );
}
```

### 2.2 Improve Error Handling in Sales Document Sync

Replace console.error calls with structured error logging:

```typescript
// Before
console.error('Error syncing sales document:', error);

// After
ErrorLogger.logError(LogCategory.SYNC, 'Error syncing sales document', {
  userId,
  documentId,
  details: { operation: 'single-document-sync' },
  error
});
```

### 2.3 Ensure Multi-tenant Isolation

Verify that all database queries include user filtering:

```typescript
// Before
const { data, error } = await supabase
  .from('sales_documents')
  .select('*')
  .eq('id', documentId);

// After
const { data, error } = await supabase
  .from('sales_documents')
  .select('*')
  .eq('id', documentId)
  .eq('user_id', userId);
```

## Phase 3: Product Sync Service Improvements

Apply the same patterns to the product sync service:

1. Add retry logic to all sync methods
2. Replace console.error with structured error logging
3. Ensure multi-tenant isolation in all database queries
4. Add proper result aggregation for bulk operations

## Phase 4: UI Component Improvements

### 4.1 Improve Type Safety in Button Components

```typescript
// Before
onSyncComplete?: (result: any) => void;

// After
interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  errors?: Array<{ id: string; error: string }>;
}

onSyncComplete?: (result: SyncResult) => void;
```

### 4.2 Add Error Handling to API Client Functions

```typescript
// Before
export async function syncAllContacts() {
  const response = await fetch('/api/integrations/metakocka/contacts/sync-all-to-metakocka', {
    method: 'POST',
  });
  return response.json();
}

// After
export async function syncAllContacts(): Promise<SyncResult> {
  try {
    const response = await fetch('/api/integrations/metakocka/contacts/sync-all-to-metakocka', {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('API client error in syncAllContacts:', error);
    throw error;
  }
}
```

### 4.3 Improve Console Error Logging in UI Components

Replace direct console.error calls with a structured client-side logger:

```typescript
// Before
console.error('Error syncing all contacts:', err);

// After
import { logClientError } from '@/lib/error-logging';

logClientError('Error syncing all contacts', {
  operation: 'syncAllContacts',
  error: err
});
```

## Phase 5: API Endpoint Improvements

### 5.1 Add Consistent Error Handling to API Routes

```typescript
// Before
export async function POST(request: Request) {
  try {
    // API logic
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// After
export async function POST(request: Request) {
  try {
    // API logic
  } catch (error) {
    const errorId = await logServerError('metakocka.syncContacts', error);
    return Response.json({ 
      error: 'Failed to sync contacts', 
      errorId,
      details: error instanceof Error ? error.message : undefined 
    }, { status: 500 });
  }
}
```

### 5.2 Add Rate Limiting to API Routes

Implement rate limiting for all sync endpoints to prevent abuse:

```typescript
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 10,
  limit: 10, // 10 requests per minute
});

export async function POST(request: Request) {
  try {
    // Apply rate limiting
    await limiter.check(request);
    
    // API logic
  } catch (error) {
    if (error.status === 429) {
      return Response.json({ error: 'Too many requests' }, { status: 429 });
    }
    // Other error handling
  }
}
```

## Phase 6: Testing and Validation

### 6.1 Create Validation Scripts for All Sync Services

Extend the validation approach used for contact sync to other services:

- Create `validate-sales-document-sync.js`
- Create `validate-product-sync.js`

### 6.2 Update Test Scripts

Update all test scripts to include validation mode:

- Update `test-sales-document-sync.js`
- Update `test-product-sync.js`

### 6.3 Create Integration Tests

Develop integration tests that verify the end-to-end functionality:

- Test bidirectional sync for all entity types
- Test error handling and retry logic
- Test multi-tenant isolation

## Phase 7: Scaling Preparations

### 7.1 Implement Batch Processing

For bulk operations, implement proper batching to handle large datasets:

```typescript
async function syncInBatches(items: string[], batchSize: number = 50): Promise<SyncResult> {
  const result: SyncResult = { success: true, created: 0, updated: 0, failed: 0, errors: [] };
  
  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResult = await syncBatch(batch);
    
    // Aggregate results
    result.created += batchResult.created;
    result.updated += batchResult.updated;
    result.failed += batchResult.failed;
    if (batchResult.errors) result.errors.push(...batchResult.errors);
  }
  
  return result;
}
```

### 7.2 Add Monitoring and Metrics

Implement monitoring for sync operations:

- Track success/failure rates
- Measure sync duration
- Monitor API rate limits
- Set up alerts for repeated failures

### 7.3 Implement Caching

Add caching for frequently accessed data:

- Cache mapping lookups
- Cache entity metadata
- Implement proper cache invalidation

## Timeline

- Phase 2: Sales Document Sync Improvements - 2 days
- Phase 3: Product Sync Improvements - 2 days
- Phase 4: UI Component Improvements - 1 day
- Phase 5: API Endpoint Improvements - 2 days
- Phase 6: Testing and Validation - 3 days
- Phase 7: Scaling Preparations - 3 days

Total estimated time: 13 days

## Success Criteria

1. All sync services implement consistent retry logic
2. All operations properly enforce multi-tenant isolation
3. Structured error logging is used throughout the application
4. All UI components handle errors gracefully
5. API endpoints include proper rate limiting and error handling
6. Validation scripts verify all implementation requirements
7. The application can handle large datasets efficiently
8. Monitoring is in place to track performance and errors
