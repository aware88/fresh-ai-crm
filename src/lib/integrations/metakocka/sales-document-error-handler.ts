/**
 * Sales Document Error Handler
 * Specialized error handling and logging for sales document sync operations
 */

import { MetakockaError } from './error-logger';
import { SalesDocument, SalesDocumentMapping } from '@/types/sales-document';
import { updateSalesDocumentMapping } from '@/lib/sales-documents/data';

/**
 * Error codes specific to sales document operations
 */
export enum SalesDocumentErrorCode {
  CONVERSION_ERROR = 'sales_document_conversion_error',
  VALIDATION_ERROR = 'sales_document_validation_error',
  API_ERROR = 'sales_document_api_error',
  MAPPING_ERROR = 'sales_document_mapping_error',
  SYNC_ERROR = 'sales_document_sync_error',
  NOT_FOUND = 'sales_document_not_found',
  UNAUTHORIZED = 'sales_document_unauthorized',
  UNKNOWN_ERROR = 'sales_document_unknown_error'
}

/**
 * Handle a sales document sync error and update the mapping status
 * @param error The error that occurred
 * @param mapping The sales document mapping to update
 * @returns Updated mapping with error information
 */
export async function handleSalesDocumentSyncError(
  error: Error | MetakockaError,
  mapping: SalesDocumentMapping
): Promise<SalesDocumentMapping> {
  let errorCode = SalesDocumentErrorCode.UNKNOWN_ERROR;
  let errorMessage = error.message || 'An unknown error occurred during sales document sync';
  let errorDetails = {};

  // Extract more detailed error information if available
  if (error instanceof MetakockaError) {
    errorCode = error.code as SalesDocumentErrorCode;
    errorMessage = error.message;
    errorDetails = error.details || {};
  }

  // Log the error for monitoring and debugging
  console.error(`Sales document sync error (${errorCode}):`, errorMessage, errorDetails);

  // Update the mapping with error information
  const updatedMapping = await updateSalesDocumentMapping(mapping.id!, {
    sync_status: 'error',
    sync_error: errorMessage,
    metadata: {
      ...mapping.metadata,
      last_error: {
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }
    }
  });

  return updatedMapping;
}

/**
 * Validate a sales document before syncing
 * @param document The sales document to validate
 * @throws MetakockaError if validation fails
 */
export function validateSalesDocument(document: SalesDocument): void {
  const errors: string[] = [];

  // Required fields
  if (!document.document_type) {
    errors.push('Document type is required');
  }

  if (!document.document_date) {
    errors.push('Document date is required');
  }

  if (!document.customer_name) {
    errors.push('Customer name is required');
  }

  if (document.total_amount === undefined || document.total_amount === null) {
    errors.push('Total amount is required');
  }

  if (document.tax_amount === undefined || document.tax_amount === null) {
    errors.push('Tax amount is required');
  }

  if (!document.currency) {
    errors.push('Currency is required');
  }

  // Validate items if present
  if (document.items && document.items.length > 0) {
    document.items.forEach((item, index) => {
      if (!item.description) {
        errors.push(`Item ${index + 1}: Description is required`);
      }

      if (item.quantity === undefined || item.quantity === null) {
        errors.push(`Item ${index + 1}: Quantity is required`);
      }

      if (item.unit_price === undefined || item.unit_price === null) {
        errors.push(`Item ${index + 1}: Unit price is required`);
      }

      if (item.tax_rate === undefined || item.tax_rate === null) {
        errors.push(`Item ${index + 1}: Tax rate is required`);
      }

      if (item.tax_amount === undefined || item.tax_amount === null) {
        errors.push(`Item ${index + 1}: Tax amount is required`);
      }

      if (item.total_amount === undefined || item.total_amount === null) {
        errors.push(`Item ${index + 1}: Total amount is required`);
      }
    });
  } else {
    errors.push('At least one item is required');
  }

  // Throw validation error if any errors found
  if (errors.length > 0) {
    throw new MetakockaError(
      SalesDocumentErrorCode.VALIDATION_ERROR,
      'Sales document validation failed',
      { errors }
    );
  }
}

/**
 * Update the sync status of a sales document mapping
 * @param mapping The sales document mapping to update
 * @param status The new sync status
 * @param metadata Optional additional metadata
 * @returns Updated mapping
 */
export async function updateSyncStatus(
  mapping: SalesDocumentMapping,
  status: 'synced' | 'pending' | 'error' | 'needs_review',
  metadata?: Record<string, any>
): Promise<SalesDocumentMapping> {
  const updatedMapping = await updateSalesDocumentMapping(mapping.id!, {
    sync_status: status,
    last_synced_at: new Date().toISOString(),
    metadata: {
      ...mapping.metadata,
      ...metadata,
      last_status_update: {
        status,
        timestamp: new Date().toISOString()
      }
    }
  });

  return updatedMapping;
}

/**
 * Track sync history for a sales document
 * @param mapping The sales document mapping
 * @param success Whether the sync was successful
 * @param details Optional details about the sync operation
 * @returns Updated mapping with sync history
 */
export async function trackSyncHistory(
  mapping: SalesDocumentMapping,
  success: boolean,
  details?: Record<string, any>
): Promise<SalesDocumentMapping> {
  // Get existing sync history or create new array
  const existingMetadata = mapping.metadata || {};
  const syncHistory = existingMetadata.sync_history || [];

  // Add new sync history entry
  syncHistory.unshift({
    timestamp: new Date().toISOString(),
    success,
    details: details || {}
  });

  // Keep only the last 10 entries to avoid metadata growing too large
  const trimmedHistory = syncHistory.slice(0, 10);

  // Update mapping with new sync history
  const updatedMapping = await updateSalesDocumentMapping(mapping.id!, {
    metadata: {
      ...existingMetadata,
      sync_history: trimmedHistory
    }
  });

  return updatedMapping;
}
