/**
 * Sales Document Sync Manager
 * Manages the synchronization process between CRM and Metakocka sales documents
 * with comprehensive error handling and status tracking
 */

import { SalesDocumentSyncService } from './sales-document-sync-service';
import { 
  handleSalesDocumentSyncError, 
  validateSalesDocument,
  updateSyncStatus,
  trackSyncHistory
} from './sales-document-error-handler';
import { MetakockaError } from './error-logger';
import { getMetakockaCredentials } from './credentials';
import { 
  SalesDocument, 
  SalesDocumentMapping,
  SalesDocumentSyncResult,
  BulkSalesDocumentSyncResult
} from '@/types/sales-document';
import { 
  getSalesDocumentById,
  getSalesDocuments,
  getSalesDocumentMappingByDocumentId,
  createSalesDocumentMapping,
  updateSalesDocumentMapping,
  updateSalesDocument
} from '@/lib/sales-documents/data';

/**
 * Sales Document Sync Manager
 * Handles the entire sync process with error handling and status tracking
 */
export class SalesDocumentSyncManager {
  /**
   * Sync a single sales document with Metakocka
   * @param documentId CRM sales document ID
   * @param userId User ID for credential lookup
   * @returns Sync result
   */
  public static async syncDocument(documentId: string, userId: string): Promise<SalesDocumentSyncResult> {
    try {
      // Get the sales document
      const document = await getSalesDocumentById(documentId);
      if (!document) {
        return {
          success: false,
          documentId,
          error: 'Sales document not found',
          errorCode: 'not_found'
        };
      }

      // Validate the document
      validateSalesDocument(document);

      // Get Metakocka credentials
      const credentials = await getMetakockaCredentials(userId);
      if (!credentials) {
        return {
          success: false,
          documentId,
          error: 'Metakocka credentials not found',
          errorCode: 'credentials_not_found'
        };
      }

      // Create sync service
      const syncService = new SalesDocumentSyncService(
        credentials.secret_key,
        credentials.company_id
      );

      // Get or create mapping
      let mapping = await getSalesDocumentMappingByDocumentId(documentId);
      
      if (mapping) {
        // Update status to pending
        mapping = await updateSyncStatus(mapping, 'pending');
      } else {
        // Create new mapping
        mapping = await createSalesDocumentMapping({
          user_id: userId,
          document_id: documentId,
          metakocka_id: '', // Will be filled after successful sync
          metakocka_document_type: document.document_type,
          sync_direction: 'crm_to_metakocka',
          sync_status: 'pending'
        });
      }

      // Perform sync operation
      let result: SalesDocumentSyncResult;
      
      if (mapping.metakocka_id) {
        // Update existing document in Metakocka
        result = await syncService.updateInMetakocka(document, mapping.metakocka_id);
      } else {
        // Create new document in Metakocka
        result = await syncService.createInMetakocka(document);
      }

      // Handle sync result
      if (result.success && result.metakockaId) {
        // Update mapping with successful sync
        await updateSalesDocumentMapping(mapping.id!, {
          metakocka_id: result.metakockaId,
          sync_status: 'synced',
          sync_error: null,
          last_synced_at: new Date().toISOString()
        });

        // Track sync history
        await trackSyncHistory(mapping, true, {
          operation: mapping.metakocka_id ? 'update' : 'create',
          metakocka_id: result.metakockaId
        });

        return {
          success: true,
          documentId,
          metakockaId: result.metakockaId
        };
      } else {
        // Handle sync failure
        await handleSalesDocumentSyncError(
          new MetakockaError(
            result.errorCode || 'sync_error',
            result.error || 'Unknown sync error',
            result.errorDetails || {}
          ),
          mapping
        );

        // Track sync history
        await trackSyncHistory(mapping, false, {
          error: result.error,
          errorCode: result.errorCode,
          errorDetails: result.errorDetails
        });

        return {
          success: false,
          documentId,
          error: result.error,
          errorCode: result.errorCode,
          errorDetails: result.errorDetails
        };
      }
    } catch (error) {
      console.error('Error in syncDocument:', error);
      
      // Try to update mapping if possible
      try {
        const mapping = await getSalesDocumentMappingByDocumentId(documentId);
        if (mapping) {
          await handleSalesDocumentSyncError(
            error instanceof Error ? error : new Error(String(error)),
            mapping
          );
        }
      } catch (mappingError) {
        console.error('Error updating mapping:', mappingError);
      }

      return {
        success: false,
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorCode: error instanceof MetakockaError ? error.code : 'unknown_error'
      };
    }
  }

  /**
   * Sync multiple sales documents with Metakocka
   * @param userId User ID for credential lookup
   * @param filters Optional filters to select documents
   * @returns Bulk sync result
   */
  public static async syncAllDocuments(
    userId: string,
    filters?: {
      documentType?: string;
      status?: string;
    }
  ): Promise<BulkSalesDocumentSyncResult> {
    const result: BulkSalesDocumentSyncResult = {
      success: true,
      created: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    try {
      // Get all sales documents matching filters
      const documents = await getSalesDocuments({
        ...filters,
        // Add any additional filters if needed
      });

      if (documents.length === 0) {
        return {
          ...result,
          success: true
        };
      }

      // Process each document
      for (const document of documents) {
        try {
          // Skip documents without an ID
          if (!document.id) {
            result.failed++;
            result.errors.push({
              documentId: 'unknown',
              error: 'Document ID is missing'
            });
            continue;
          }

          // Sync the document
          const syncResult = await this.syncDocument(document.id, userId);

          if (syncResult.success) {
            // Check if it was a create or update operation
            const mapping = await getSalesDocumentMappingByDocumentId(document.id);
            
            // If the mapping was just created in this operation, count as created
            if (mapping && mapping.created_at === mapping.last_synced_at) {
              result.created++;
            } else {
              result.updated++;
            }
          } else {
            result.failed++;
            result.errors.push({
              documentId: document.id,
              error: syncResult.error || 'Unknown error'
            });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            documentId: document.id || 'unknown',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Set overall success based on failures
      result.success = result.failed === 0;

      return result;
    } catch (error) {
      console.error('Error in syncAllDocuments:', error);
      
      return {
        success: false,
        created: 0,
        updated: 0,
        failed: documents?.length || 0,
        errors: [{
          documentId: 'batch',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }]
      };
    }
  }

  /**
   * Get a sales document from Metakocka and update the CRM version
   * @param metakockaId Metakocka document ID
   * @param documentType Document type
   * @param userId User ID for credential lookup
   * @returns Sync result
   */
  public static async importFromMetakocka(
    metakockaId: string,
    documentType: string,
    userId: string
  ): Promise<SalesDocumentSyncResult> {
    try {
      // Get Metakocka credentials
      const credentials = await getMetakockaCredentials(userId);
      if (!credentials) {
        return {
          success: false,
          error: 'Metakocka credentials not found',
          errorCode: 'credentials_not_found'
        };
      }

      // Create sync service
      const syncService = new SalesDocumentSyncService(
        credentials.secret_key,
        credentials.company_id
      );

      // Get document from Metakocka
      const document = await syncService.getFromMetakocka(metakockaId, documentType);

      // Add user ID to document
      document.user_id = userId;

      // Create or update the document in CRM
      const createdDocument = await updateSalesDocument(document.id || '', document);

      // Create or update mapping
      let mapping = await getSalesDocumentMappingByDocumentId(createdDocument.id!);
      
      if (mapping) {
        // Update existing mapping
        mapping = await updateSalesDocumentMapping(mapping.id!, {
          metakocka_id: metakockaId,
          metakocka_document_type: documentType,
          sync_direction: 'metakocka_to_crm',
          sync_status: 'synced',
          sync_error: null,
          last_synced_at: new Date().toISOString()
        });
      } else {
        // Create new mapping
        mapping = await createSalesDocumentMapping({
          user_id: userId,
          document_id: createdDocument.id!,
          metakocka_id: metakockaId,
          metakocka_document_type: documentType,
          sync_direction: 'metakocka_to_crm',
          sync_status: 'synced'
        });
      }

      // Track sync history
      await trackSyncHistory(mapping, true, {
        operation: 'import',
        metakocka_id: metakockaId
      });

      return {
        success: true,
        documentId: createdDocument.id,
        metakockaId
      };
    } catch (error) {
      console.error('Error in importFromMetakocka:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorCode: error instanceof MetakockaError ? error.code : 'unknown_error'
      };
    }
  }
}
