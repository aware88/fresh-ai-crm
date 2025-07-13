/**
 * Metakocka Sales Document Synchronization Service
 * 
 * Handles synchronization of sales documents (invoices, offers) between the CRM and Metakocka
 */
import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { 
  MetakockaClient, 
  MetakockaService, 
  MetakockaError, 
  MetakockaErrorType,
  MetakockaSalesDocument,
  MetakockaSalesDocumentType,
  MetakockaSalesDocumentItem,
  MetakockaSalesDocumentStatus
} from './index';
import { Database } from '@/types/supabase';
import { ProductSyncService } from './product-sync';
import { ContactSyncService } from './contact-sync';
import { MetakockaErrorLogger, LogCategory } from './error-logger';
import { MetakockaCache } from './metakocka-cache';
import { MetakockaRetryHandler } from './metakocka-retry-handler';
import {
  SalesDocumentMapping as SalesDocumentMappingType,
  SyncStatus,
  SyncDirection
} from './types/sales-document-mapping';

// Type for CRM sales document
type SalesDocument = Database['public']['Tables']['sales_documents']['Row'];

// Type for CRM sales document item
type SalesDocumentItem = Database['public']['Tables']['sales_document_items']['Row'];

// Type for sync result
interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{
    documentId: string;
    error: string;
  }>;
}

// Type for document mapping
interface SalesDocumentMapping {
  id?: string;
  documentId: string;
  metakockaId: string;
  metakockaDocumentType: string;
  metakockaDocumentNumber?: string | null;
  lastSyncedAt?: string;
  syncStatus?: string;
  syncError?: string | null;
}

/**
 * Sales Document Synchronization Service
 */
export class SalesDocumentSyncService {
  /**
   * Convert CRM sales document to Metakocka format
   * @param document CRM sales document
   * @param items Document items in Metakocka format
   * @returns Metakocka sales document
   */
  private static convertToMetakocka(
    document: SalesDocument,
    items: MetakockaSalesDocumentItem[]
  ): MetakockaSalesDocument {
    // Create base document
    const metakockaDocument: MetakockaSalesDocument = {
      // Basic document info
      doc_type: this.getMetakockaDocumentType(document.document_type) as MetakockaSalesDocumentType,
      partner_id: document.customer_id || undefined,
      // Handle missing properties with safe defaults
      title: (document as any).title || document.document_number || '',
      doc_date: (document as any).issue_date || document.document_date || new Date().toISOString().split('T')[0],
      due_date: document.due_date || '',
      status_id: document.status || 'draft',
      doc_number: document.document_number || '',
      notes: document.notes || '',
      
      // Document items
      sales_items: items,
    };
    
    // Safely add metadata fields if they exist
    if (document.metadata && typeof document.metadata === 'object') {
      const metadata = document.metadata as any;
      if (metadata.payment_method) {
        metakockaDocument.payment_method = metadata.payment_method;
      }
      if (metadata.currency_code) {
        metakockaDocument.currency_code = metadata.currency_code;
      }
    }
    
    return metakockaDocument;
  }
  
  /**
   * Get Metakocka document type from CRM document type
   * @param documentType CRM document type
   * @returns Metakocka document type
   */
  private static getMetakockaDocumentType(documentType: string): MetakockaSalesDocumentType {
    // Map CRM document types to Metakocka document types
    const typeMap: Record<string, MetakockaSalesDocumentType> = {
      'invoice': MetakockaSalesDocumentType.INVOICE,
      'quote': MetakockaSalesDocumentType.OFFER,
      'order': MetakockaSalesDocumentType.ORDER,
      'receipt': MetakockaSalesDocumentType.RECEIPT,
      'credit_note': MetakockaSalesDocumentType.CREDIT_NOTE,
      'debit_note': MetakockaSalesDocumentType.DEBIT_NOTE,
      'proforma': MetakockaSalesDocumentType.PROFORMA,
      'advance': MetakockaSalesDocumentType.ADVANCE,
    };
    
    return typeMap[documentType] || MetakockaSalesDocumentType.INVOICE; // Default to invoice if not found
  }
  
  /**
   * Get the API endpoint for a document type
   * @param documentType Metakocka document type
   * @returns API endpoint path
   */
  private static getEndpointForDocumentType(documentType: MetakockaSalesDocumentType): string {
    // Map document types to API endpoints
    const endpointMap: Record<MetakockaSalesDocumentType, string> = {
      [MetakockaSalesDocumentType.INVOICE]: 'sales-bill',
      [MetakockaSalesDocumentType.OFFER]: 'offer',
      [MetakockaSalesDocumentType.ORDER]: 'sales-order',
      [MetakockaSalesDocumentType.RECEIPT]: 'receipt',
      [MetakockaSalesDocumentType.CREDIT_NOTE]: 'sales-return',
      [MetakockaSalesDocumentType.DEBIT_NOTE]: 'debit-note',
      [MetakockaSalesDocumentType.PROFORMA]: 'pro-forma',
      [MetakockaSalesDocumentType.ADVANCE]: 'advance',
    };
    
    return endpointMap[documentType] || 'sales-bill'; // Default to sales-bill if not found
  }
  
  /**
   * Get sales document mapping between CRM and Metakocka
   * @param documentId CRM document ID
   * @param userId User ID
   * @returns Mapping object if found, null otherwise
   */
  private static async getSalesDocumentMapping(
    documentId: string,
    userId: string
  ): Promise<SalesDocumentMapping | null> {
    try {
      const supabase = await createLazyServerClient();
      
      const { data, error } = await supabase
        .from('metakocka_sales_document_mappings')
        .select('*')
        .eq('crm_document_id', documentId)
        .eq('user_id', userId)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return {
        id: data.id,
        crmDocumentId: data.crm_document_id,
        metakockaId: data.metakocka_id,
        userId: data.user_id,
        status: data.status,
        lastSyncedAt: data.last_synced_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error) {
      console.error('Error getting sales document mapping:', error);
      return null;
    }
  }
  
  /**
   * Save or update sales document mapping
   * @param documentId CRM document ID
   * @param metakockaId Metakocka document ID
   * @param userId User ID
   * @param status Sync status
   * @param metakockaDocumentType Metakocka document type
   * @param metakockaDocumentNumber Metakocka document number
   * @param errorMessage Error message if status is 'error'
   * @returns Saved mapping ID
   */
  static async saveSalesDocumentMapping(
    documentId: string,
    metakockaId: string,
    userId: string,
    status: SyncStatus = SyncStatus.SYNCED,
    metakockaDocumentType?: MetakockaSalesDocumentType,
    metakockaDocumentNumber?: string,
    errorMessage?: string
  ): Promise<string> {
    try {
      const supabase = await createLazyServerClient();
      
      // Check if mapping already exists
      const { data: existingMapping, error: findError } = await supabase
        .from('metakocka_sales_document_mappings')
        .select('id')
        .eq('document_id', documentId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (findError) {
        throw new Error(`Failed to check for existing mapping: ${findError.message}`);
      }
      
      const now = new Date().toISOString();
      
      if (existingMapping) {
        // Update existing mapping
        const updateData: Partial<SalesDocumentMappingType> = {
          metakocka_id: metakockaId,
          last_synced_at: now,
          sync_status: status,
          sync_error: status === SyncStatus.ERROR ? errorMessage || 'Sync failed' : null,
        };
        
        // Add optional fields if provided
        if (metakockaDocumentType) {
          updateData.metakocka_document_type = metakockaDocumentType;
        }
        
        if (metakockaDocumentNumber) {
          updateData.metakocka_document_number = metakockaDocumentNumber;
        }
        
        const { error: updateError } = await supabase
          .from('metakocka_sales_document_mappings')
          .update(updateData)
          .eq('id', existingMapping.id);
        
        if (updateError) {
          throw new Error(`Failed to update mapping: ${updateError.message}`);
        }
        
        return existingMapping.id;
      } else {
        // Create new mapping
        const insertData: Partial<SalesDocumentMappingType> = {
          document_id: documentId,
          metakocka_id: metakockaId,
          user_id: userId,
          last_synced_at: now,
          sync_status: status,
          sync_direction: SyncDirection.CRM_TO_METAKOCKA,
          sync_error: status === SyncStatus.ERROR ? errorMessage || 'Sync failed' : null,
        };
        
        // Add optional fields if provided
        if (metakockaDocumentType) {
          insertData.metakocka_document_type = metakockaDocumentType;
        }
        
        if (metakockaDocumentNumber) {
          insertData.metakocka_document_number = metakockaDocumentNumber;
        }
        
        const { data: newMapping, error: insertError } = await supabase
          .from('metakocka_sales_document_mappings')
          .insert(insertData)
          .select('id')
          .single();
        
        if (insertError || !newMapping) {
          throw new Error(`Failed to create mapping: ${insertError?.message || 'Unknown error'}`);
        }
        
        return newMapping.id;
      }
    } catch (error) {
      console.error('Error saving sales document mapping:', error);
      throw error;
    }
  }
  
  /**
   * Sync a single sales document to Metakocka
   * @param userId User ID
   * @param document CRM sales document
   * @param items Document items
   * @returns Metakocka document ID
   */
  static async syncSalesDocumentToMetakocka(
    userId: string,
    document: SalesDocument,
    items: SalesDocumentItem[]
  ): Promise<string> {
    try {
      // Log operation start
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Starting sync of sales document ${document.id} to Metakocka`,
        { userId, documentId: document.id }
      );

      // Get client for user
      const client = await MetakockaService.getClientForUser(userId, true);
      const mapping = await this.getSalesDocumentMapping(document.id, userId);

      // Get document type
      const documentType = this.getMetakockaDocumentType(document.document_type);

      // Get client from Metakocka if available
      let metakockaClientId = null;
      if (document.customer_id) {
        const contactMapping = await ContactSyncService.getContactMapping(
          document.customer_id,
          userId
        );
        if (contactMapping && contactMapping.metakockaId) {
          metakockaClientId = contactMapping.metakockaId;
        }
      }

      // Prepare document items
      const countCode = 'KOS'; // Default count code
      
      // Prepare document items with proper type conversion
      const documentItems = await Promise.all(
        items.map(async (item) => {
          // Get product mapping if available
          let productId = null;
          if (item.product_id) {
            const productMapping = await ProductSyncService.getProductMapping(
              item.product_id,
              userId
            );
            if (productMapping && productMapping.metakockaId) {
              productId = productMapping.metakockaId;
            }
          }

          // Convert to Metakocka item format with string values where required
          return {
            count_code: countCode,
            name: item.description || '', // Use description as name
            amount: String(item.quantity || 1), // Convert to string
            price: String(item.unit_price || 0), // Convert to string
            discount: item.metadata && typeof item.metadata === 'object' ? 
              String((item.metadata as any).discount || 0) : '0', // Get discount from metadata safely
            tax_rate: String(item.tax_rate || 0), // Convert to string
            notes: item.description || '',
            product_id: productId || undefined
          } as MetakockaSalesDocumentItem;
        })
      );

      const metakockaDocument = this.convertToMetakocka(document, documentItems);

      // Use retry handler for API calls
      return await MetakockaRetryHandler.executeWithRetry(async () => {
        let metakockaId = '';
        let documentNumber = '';

        if (mapping && mapping.metakockaId) {
          // Update existing document
          const endpoint = this.getEndpointForDocumentType(documentType);
          
          // Update existing document
          const response = await client.updateSalesDocument({
            id_dokument: mapping.metakockaId,
            ...metakockaDocument
          }, endpoint);
          
          metakockaId = mapping.metakockaId;
          documentNumber = response.doc_number || '';
          
          MetakockaErrorLogger.logInfo(
            LogCategory.SYNC,
            `Successfully updated Metakocka sales document ${metakockaId}`,
            { userId, documentId: document.id, metakockaId }
          );
        } else {
          // Create new document
          const endpoint = this.getEndpointForDocumentType(documentType);
          
          // Create new document
          const response = await client.createSalesDocument(metakockaDocument, endpoint);
          metakockaId = response.opr_code || '';
          documentNumber = response.doc_number || '';
          
          if (!metakockaId) {
            throw new Error('Failed to get Metakocka document ID from response');
          }
          
          MetakockaErrorLogger.logInfo(
            LogCategory.SYNC,
            `Successfully created Metakocka sales document ${metakockaId}`,
            { userId, documentId: document.id, metakockaId }
          );
        }

        // Save mapping with all details
        await this.saveSalesDocumentMapping(
          document.id,
          metakockaId,
          userId,
          SyncStatus.SYNCED,
          documentType,
          documentNumber
        );
        
        return metakockaId;
      }, {
        userId,
        operationName: 'syncSalesDocumentToMetakocka',
        documentId: document.id,
        details: { operation: 'single-document-sync-to-metakocka' }
      });
    } catch (error: any) { // Add type annotation for error
      // Log error
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Error syncing sales document to Metakocka: ${error instanceof Error ? error.message : String(error)}`,
        { userId, documentId: document.id }
      );
      
      // Check if document exists in Metakocka
      const mapping = await this.getSalesDocumentMapping(document.id, userId);
      if (mapping && mapping.metakockaId) {
        // Update mapping status to error
        await this.saveSalesDocumentMapping(
          document.id,
          mapping.metakockaId,
          userId,
          SyncStatus.ERROR,
          mapping.metakockaDocumentType as MetakockaSalesDocumentType,
          mapping.metakockaDocumentNumber,
          error instanceof Error ? error.message : String(error)
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Sync multiple sales documents to Metakocka
   * @param userId User ID
   * @param documentIds Optional array of document IDs to sync (if not provided, all documents will be synced)
   * @returns Sync result
   */
  static async syncSalesDocumentsToMetakocka(
    userId: string,
    documentIds?: string[]
  ): Promise<SyncResult> {
    const syncResult: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };
    
    try {
      // Get documents to sync
      const supabase = await createLazyServerClient();
      
      let query = supabase
        .from('sales_documents')
        .select('*')
        .eq('user_id', userId);
      
      // Filter by document IDs if provided
      if (documentIds && documentIds.length > 0) {
        query = query.in('id', documentIds);
      }
      
      const { data: documents, error } = await query;
      
      if (error || !documents) {
        throw new Error(`Failed to fetch sales documents: ${error?.message || 'Unknown error'}`);
      }
      
      // Process each document
      for (const document of documents) {
        try {
          // Get document items
          const { data: items, error: itemsError } = await supabase
            .from('sales_document_items')
            .select('*')
            .eq('document_id', document.id);
          
          if (itemsError || !items) {
            throw new Error(`Failed to fetch document items: ${itemsError?.message || 'Unknown error'}`);
          }
          
          // Check if document already exists in Metakocka
          const mapping = await this.getSalesDocumentMapping(document.id, userId);
          
          // Sync document
          await this.syncSalesDocumentToMetakocka(userId, document, items);
          
          // Update result counters
          if (mapping) {
            syncResult.updated++;
          } else {
            syncResult.created++;
          }
        } catch (error) {
          syncResult.failed++;
          syncResult.errors.push({
            documentId: document.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      
      // Update overall success flag
      syncResult.success = syncResult.failed === 0;
      
      return syncResult;
    } catch (error) {
      console.error('Error syncing sales documents to Metakocka:', error);
      
      return {
        success: false,
        created: 0,
        updated: 0,
        failed: 1,
        errors: [{
          documentId: 'batch',
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
      };
    }
  }
  
  /**
   * Get sales document mapping by CRM document ID
   * @param documentId CRM document ID
   * @param userId User ID
   * @returns Document mapping or null if not found
   */
  static async getSalesDocumentMapping(documentId: string, userId: string): Promise<SalesDocumentMapping | null> {
    const cacheKey = `document_mapping_${documentId}`;
    const cachedMapping = MetakockaCache.get<SalesDocumentMapping>(cacheKey, userId);
    
    if (cachedMapping) {
      MetakockaErrorLogger.logInfo(
        LogCategory.CACHE,
        `Retrieved document mapping from cache for ${documentId}`,
        { userId, documentId }
      );
      return cachedMapping;
    }
    
    const supabase = await createLazyServerClient();
    
    // Check for mapping in the dedicated table
    const { data, error } = await supabase
      .from('metakocka_sales_document_mappings')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      // Check for legacy mapping in the document metadata
      const { data: legacyData, error: legacyError } = await supabase
        .from('sales_documents')
        .select('id, metadata')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();
      
      if (legacyError || !legacyData || !legacyData.metadata) {
        return null;
      }
      
      const metadata = legacyData.metadata as any;
      
      if (metadata.metakockaId) {
        // Migrate legacy mapping to the new table
        const mapping: SalesDocumentMapping = {
          documentId: legacyData.id,
          metakockaId: metadata.metakockaId,
          metakockaDocumentType: metadata.documentType || MetakockaSalesDocumentType.INVOICE,
          metakockaDocumentNumber: metadata.documentNumber || null,
        };
        
        // Save to the new table
        await this.saveSalesDocumentMapping(
          mapping.documentId,
          mapping.metakockaId,
          userId,
          SyncStatus.SYNCED,
          mapping.metakockaDocumentType as MetakockaSalesDocumentType,
          mapping.metakockaDocumentNumber
        );
        
        return mapping;
      }
      
      return null;
    }
    
    return {
      id: data.id,
      documentId: data.document_id,
      metakockaId: data.metakocka_id,
      metakockaDocumentType: data.metakocka_document_type,
      metakockaDocumentNumber: data.metakocka_document_number,
      lastSyncedAt: data.last_synced_at,
      syncStatus: data.sync_status,
      syncError: data.sync_error,
    };
  }
  
  /**
   * Get sales document mappings for multiple documents
   * @param documentIds Array of CRM document IDs
   * @param userId User ID
   * @returns Array of document mappings
   */
  static async getSalesDocumentMappings(documentIds: string[], userId: string): Promise<SalesDocumentMapping[]> {
    if (!documentIds.length) {
      return [];
    }
    
    const supabase = await createLazyServerClient();
    
    // Get mappings from the dedicated table
    const { data, error } = await supabase
      .from('metakocka_sales_document_mappings')
      .select('*')
      .in('document_id', documentIds)
      .eq('user_id', userId);
    
    if (error || !data) {
      return [];
    }
    
    // Check for any missing mappings that might be in legacy format
    const mappedDocumentIds = data.map((item: any) => item.document_id);
    const unmappedDocumentIds = documentIds.filter(id => !mappedDocumentIds.includes(id));
    
    if (unmappedDocumentIds.length > 0) {
      // Check for legacy mappings
      const { data: legacyData, error: legacyError } = await supabase
        .from('sales_documents')
        .select('id, metadata')
        .in('id', unmappedDocumentIds)
        .eq('user_id', userId);
      
      if (!legacyError && legacyData) {
        const legacyMappings = legacyData
          .filter((item: any) => item.metadata && (item.metadata as any).metakockaId)
          .map((item: any) => {
            const metadata = item.metadata as any;
            return {
              documentId: item.id,
              metakockaId: metadata.metakockaId,
              metakockaDocumentType: metadata.documentType || MetakockaSalesDocumentType.INVOICE,
              metakockaDocumentNumber: metadata.documentNumber || null,
            };
          });
        
        // Migrate legacy mappings to the new table
        for (const mapping of legacyMappings) {
          await this.saveSalesDocumentMapping(
            mapping.documentId,
            mapping.metakockaId,
            mapping.metakockaDocumentType as MetakockaSalesDocumentType,
            userId,
            mapping.metakockaDocumentNumber
          );
        }
        
        // Add legacy mappings to the result
        return [
          ...data.map((item: any) => ({
            id: item.id,
            documentId: item.document_id,
            metakockaId: item.metakocka_id,
            metakockaDocumentType: item.metakocka_document_type,
            metakockaDocumentNumber: item.metakocka_document_number,
            lastSyncedAt: item.last_synced_at,
            syncStatus: item.sync_status,
            syncError: item.sync_error,
          })),
          ...legacyMappings,
        ];
      }
    }
    
    return data.map((item: any) => ({
      id: item.id,
      documentId: item.document_id,
      metakockaId: item.metakocka_id,
      metakockaDocumentType: item.metakocka_document_type,
      metakockaDocumentNumber: item.metakocka_document_number,
      lastSyncedAt: item.last_synced_at,
      syncStatus: item.sync_status,
      syncError: item.sync_error,
    }));
  }
  
  /**
   * Save sales document mapping
   * @param documentId CRM document ID
   * @param metakockaId Metakocka document ID
   * @param metakockaDocumentType Metakocka document type
   * @param userId User ID
   * @param metakockaDocumentNumber Optional Metakocka document number
   * @param syncStatus Optional sync status
   * @param syncError Optional sync error
   */
  static async saveSalesDocumentMapping(
    documentId: string,
    metakockaId: string,
    metakockaDocumentType: MetakockaSalesDocumentType,
    userId: string,
    metakockaDocumentNumber: string | null = null,
    syncStatus: string = 'synced',
    syncError: string | null = null
  ): Promise<void> {
    const supabase = await createLazyServerClient();
    
    // Check if mapping already exists
    const { data, error } = await supabase
      .from('metakocka_sales_document_mappings')
      .select('id')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .single();
    
    const now = new Date().toISOString();
    
    if (error || !data) {
      // Create new mapping
      const { error: insertError } = await supabase
        .from('metakocka_sales_document_mappings')
        .insert({
          user_id: userId,
          document_id: documentId,
          metakocka_id: metakockaId,
          metakocka_document_type: metakockaDocumentType,
          metakocka_document_number: metakockaDocumentNumber,
          last_synced_at: now,
          created_at: now,
          updated_at: now,
          sync_status: syncStatus,
          sync_error: syncError,
        });
      
      if (insertError) {
        throw insertError;
      }
    } else {
      // Update existing mapping
      const { error: updateError } = await supabase
        .from('metakocka_sales_document_mappings')
        .update({
          metakocka_id: metakockaId,
          metakocka_document_type: metakockaDocumentType,
          metakocka_document_number: metakockaDocumentNumber,
          last_synced_at: now,
          updated_at: now,
          sync_status: syncStatus,
          sync_error: syncError,
        })
        .eq('id', data.id);
      
      if (updateError) {
        throw updateError;
      }
    }
  }

  /**
   * Sync a single sales document from Metakocka to CRM
   * @param userId User ID
   * @param metakockaId Metakocka document ID
   * @returns CRM document ID
   */
  static async syncSalesDocumentFromMetakocka(
    userId: string,
    metakockaId: string
  ): Promise<string> {
    try {
      // Log the sync attempt
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Starting sync of Metakocka document ${metakockaId} to CRM`,
        { userId, metakockaId }
      );
      
      // Get Metakocka client for user
      const client = await MetakockaService.getClientForUser(userId);
      
      // Get document from Metakocka with retry logic
      let metakockaDocument;
      try {
        metakockaDocument = await MetakockaRetryHandler.withRetry(() => 
          client.getSalesDocument(metakockaId)
        );
      } catch (error) {
        MetakockaErrorLogger.logError(
          LogCategory.SYNC,
          `Failed to get sales document from Metakocka: ${error instanceof Error ? error.message : String(error)}`,
          { userId, metakockaId, error }
        );
        throw new MetakockaError(
          MetakockaErrorType.API_ERROR,
          `Failed to get sales document from Metakocka: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error }
        );
      }
      
      if (!metakockaDocument) {
        throw new Error(`Document not found in Metakocka: ${metakockaId}`);
      }
      
      // Check if document already exists in CRM
      const supabase = await createLazyServerClient();
      const { data: existingMapping } = await supabase
        .from('metakocka_sales_document_mappings')
        .select('document_id')
        .eq('metakocka_id', metakockaId)
        .eq('user_id', userId)
        .single();
      
      // Get or create customer in CRM
      let customerId = null;
      if (metakockaDocument.partner_id) {
        try {
          // Try to find existing contact mapping
          const { data: contactMapping } = await supabase
            .from('metakocka_contact_mappings')
            .select('contact_id')
            .eq('metakocka_id', metakockaDocument.partner_id)
            .eq('user_id', userId)
            .single();
          
          if (contactMapping) {
            customerId = contactMapping.contact_id;
          } else {
            // Sync contact from Metakocka
            customerId = await ContactSyncService.syncContactFromMetakocka(
              userId,
              metakockaDocument.partner_id
            );
          }
        } catch (error) {
          MetakockaErrorLogger.logError(
            LogCategory.SYNC,
            `Failed to sync contact for sales document: ${error instanceof Error ? error.message : String(error)}`,
            { userId, metakockaId, partnerId: metakockaDocument.partner_id, error }
          );
        }
      }
      
      // Prepare document data
      const documentData: any = {
        user_id: userId,
        document_type: this.mapMetakockaDocumentType(metakockaDocument.doc_type),
        document_number: metakockaDocument.doc_number || `MK-${metakockaId.substring(0, 8)}`,
        document_date: metakockaDocument.doc_date || new Date().toISOString().split('T')[0],
        due_date: metakockaDocument.due_date,
        status: this.mapMetakockaDocumentStatus(metakockaDocument.status_id),
        customer_id: customerId,
        currency: metakockaDocument.currency_code || 'EUR',
        subtotal: metakockaDocument.sum_base || 0,
        tax_amount: metakockaDocument.sum_tax || 0,
        total_amount: metakockaDocument.sum_all || 0,
        notes: metakockaDocument.notes || '',
        updated_at: new Date().toISOString(),
      };
      
      let documentId: string;
      
      if (existingMapping && existingMapping.document_id) {
        // Update existing document
        documentId = existingMapping.document_id;
        
        const { error: updateError } = await supabase
          .from('sales_documents')
          .update(documentData)
          .eq('id', documentId);
        
        if (updateError) {
          throw new Error(`Failed to update sales document: ${updateError.message}`);
        }
        
        // Delete existing items to replace with new ones
        await supabase
          .from('sales_document_items')
          .delete()
          .eq('document_id', documentId);
        
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          `Updated CRM sales document ${documentId} from Metakocka document ${metakockaId}`,
          { userId, documentId, metakockaId }
        );
      } else {
        // Create new document
        const { data: newDocument, error: insertError } = await supabase
          .from('sales_documents')
          .insert(documentData)
          .select('id')
          .single();
        
        if (insertError || !newDocument) {
          throw new Error(`Failed to create sales document: ${insertError?.message || 'No ID returned'}`);
        }
        
        documentId = newDocument.id;
        
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          `Created new CRM sales document ${documentId} from Metakocka document ${metakockaId}`,
          { userId, documentId, metakockaId }
        );
      }
      
      // Create document items
      if (metakockaDocument.sales_document_items && metakockaDocument.sales_document_items.length > 0) {
        const items = metakockaDocument.sales_document_items.map((item: any, index: number) => {
          // Try to find product mapping
          let productId = null;
          
          return {
            document_id: documentId,
            user_id: userId,
            product_id: productId,
            name: item.name || `Item ${index + 1}`,
            description: item.notes || '',
            quantity: item.amount || 1,
            unit_price: item.price || 0,
            tax_rate: item.tax_rate || 0,
            discount: item.discount || 0,
            total: item.sum || 0,
            position: index + 1,
          };
        });
        
        // Insert items
        const { error: itemsError } = await supabase
          .from('sales_document_items')
          .insert(items);
        
        if (itemsError) {
          MetakockaErrorLogger.logError(
            LogCategory.SYNC,
            `Failed to insert sales document items: ${itemsError.message}`,
            { userId, documentId, metakockaId, error: itemsError }
          );
        }
      }
      
      // Save or update mapping
      await this.saveSalesDocumentMapping(
        documentId,
        metakockaId,
        metakockaDocument.doc_type,
        userId,
        metakockaDocument.doc_number || null,
        'synced'
      );
      
      return documentId;
    } catch (error) {
      // Log the error
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Error syncing Metakocka document ${metakockaId} to CRM: ${error instanceof Error ? error.message : String(error)}`,
        { userId, metakockaId, error }
      );
      
      throw error;
    }
  }

  /**
   * Sync multiple sales documents from Metakocka to CRM
   * @param userId User ID
   * @param metakockaIds Optional array of Metakocka document IDs to sync
   * @returns Sync result
   */
  static async syncSalesDocumentsFromMetakocka(
    userId: string,
    metakockaIds?: string[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };
    
    try {
      // Log the sync attempt
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Starting sync of sales documents from Metakocka to CRM`,
        { userId, metakockaIds: metakockaIds?.length || 'all' }
      );
      
      // Get Metakocka client for user
      const client = await MetakockaService.getClientForUser(userId);
      
      // Get documents from Metakocka
      let metakockaDocuments: any[] = [];
      try {
        if (metakockaIds && metakockaIds.length > 0) {
          // Get specific documents
          metakockaDocuments = await Promise.all(
            metakockaIds.map(async (id) => {
              try {
                return await client.getSalesDocument(id);
              } catch (error) {
                result.failed++;
                result.errors.push({
                  documentId: id,
                  error: error instanceof Error ? error.message : String(error),
                });
                return null;
              }
            })
          );
          
          // Filter out nulls
          metakockaDocuments = metakockaDocuments.filter(Boolean);
        } else {
          // Get all documents
          metakockaDocuments = await client.listSalesDocuments();
        }
      } catch (error) {
        MetakockaErrorLogger.logError(
          LogCategory.SYNC,
          `Failed to get sales documents from Metakocka: ${error instanceof Error ? error.message : String(error)}`,
          { userId, error }
        );
        throw error;
      }
      
      if (!metakockaDocuments || metakockaDocuments.length === 0) {
        return result;
      }
      
      // Get existing mappings
      const supabase = await createLazyServerClient();
      const { data: mappings } = await supabase
        .from('metakocka_sales_document_mappings')
        .select('metakocka_id, document_id')
        .eq('user_id', userId);
      
      const mappingMap = new Map();
      if (mappings) {
        mappings.forEach((mapping: any) => {
          mappingMap.set(mapping.metakocka_id, mapping.document_id);
        });
      }
      
      // Process each document
      for (const doc of metakockaDocuments) {
        try {
          const existingDocumentId = mappingMap.get(doc.mk_id);
          
          // Sync document
          const documentId = await this.syncSalesDocumentFromMetakocka(userId, doc.mk_id);
          
          // Update counters
          if (existingDocumentId) {
            result.updated++;
          } else {
            result.created++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            documentId: doc.mk_id,
            error: error instanceof Error ? error.message : String(error),
          });
          
          MetakockaErrorLogger.logError(
            LogCategory.SYNC,
            `Failed to sync Metakocka document ${doc.mk_id} to CRM: ${error instanceof Error ? error.message : String(error)}`,
            { userId, metakockaId: doc.mk_id, error }
          );
        }
      }
      
      // Update overall success flag
      result.success = result.failed === 0;
      
      // Log the result
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Completed sync of sales documents from Metakocka to CRM`,
        { 
          userId, 
          details: {
            created: result.created,
            updated: result.updated,
            failed: result.failed,
            total: result.created + result.updated + result.failed
          }
        }
      );
      
      return result;
    } catch (error) {
      // Log the error
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Error syncing sales documents from Metakocka to CRM: ${error instanceof Error ? error.message : String(error)}`,
        { userId, error }
      );
      
      return {
        success: false,
        created: 0,
        updated: 0,
        failed: 1,
        errors: [{
          documentId: 'batch',
          error: error instanceof Error ? error.message : String(error),
        }],
      };
    }
  }

  /**
   * Get unsynced sales documents from Metakocka
   * @param userId User ID
   * @returns List of unsynced sales documents
   */
  static async getUnsyncedSalesDocumentsFromMetakocka(userId: string): Promise<any[]> {
    try {
      // Check cache first
      const cacheKey = 'unsynced_sales_documents';
      const cachedDocuments = MetakockaCache.get<any[]>(cacheKey, userId);
      
      if (cachedDocuments) {
        MetakockaErrorLogger.logInfo(
          LogCategory.CACHE,
          'Retrieved unsynced sales documents from cache',
          { userId, details: { count: cachedDocuments.length } }
        );
        return cachedDocuments;
      }
      
      // Log the attempt
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        'Getting unsynced sales documents from Metakocka',
        { userId }
      );
      
      // Get Metakocka client for user
      const client = await MetakockaService.getClientForUser(userId);
      
      // Get all sales documents from Metakocka with retry logic
      const documents = await MetakockaRetryHandler.executeWithRetry(
        () => client.listSalesDocuments(),
        { userId, operationName: 'listSalesDocuments', details: { operation: 'list-sales-documents' } }
      );
      
      if (!documents || documents.length === 0) {
        return [];
      }
      
      // Get existing mappings
      const supabase = await createLazyServerClient();
      const { data: mappings, error: mappingsError } = await supabase
        .from('metakocka_sales_document_mappings')
        .select('metakocka_id')
        .eq('user_id', userId);
      
      if (mappingsError) {
        MetakockaErrorLogger.logError(
          LogCategory.SYNC,
          `Failed to get sales document mappings: ${mappingsError.message}`,
          { userId, error: mappingsError }
        );
        return [];
      }
      
      // Filter out documents that are already synced
      const syncedIds = mappings ? mappings.map((m: any) => m.metakocka_id) : [];
      const unsyncedDocuments = documents.filter((d: any) => !syncedIds.includes(d.mk_id));
      
      // Cache the result for 5 minutes
      MetakockaCache.set(cacheKey, unsyncedDocuments, userId, { ttlSeconds: 300 });
      
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Found ${unsyncedDocuments.length} unsynced sales documents in Metakocka`,
        { userId, details: { total: documents.length, unsynced: unsyncedDocuments.length } }
      );
      
      return unsyncedDocuments;
    } catch (error) {
      // Log the error
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Error getting unsynced sales documents from Metakocka: ${error instanceof Error ? error.message : String(error)}`,
        { userId, error }
      );
      
      return [];
    }
  }

  /**
   * Map Metakocka document type to CRM document type
   * @param metakockaType Metakocka document type
   * @returns CRM document type
   */
  private static mapMetakockaDocumentType(metakockaType: string): string {
    switch (metakockaType) {
      case MetakockaSalesDocumentType.INVOICE:
        return 'invoice';
      case MetakockaSalesDocumentType.OFFER:
        return 'offer';
      case MetakockaSalesDocumentType.ORDER:
        return 'order';
      case MetakockaSalesDocumentType.PROFORMA:
        return 'proforma';
      default:
        return 'invoice';
    }
  }

  /**
   * Map Metakocka document status to CRM document status
   * @param statusId Metakocka status ID
   * @returns CRM document status
   */
  private static mapMetakockaDocumentStatus(statusId: string): string {
    switch (statusId) {
      case MetakockaSalesDocumentStatus.DRAFT:
        return 'draft';
      case MetakockaSalesDocumentStatus.CONFIRMED:
        return 'confirmed';
      case MetakockaSalesDocumentStatus.PAID:
        return 'paid';
      case MetakockaSalesDocumentStatus.CANCELED:
        return 'canceled';
      default:
        return 'draft';
    }
  }
}
