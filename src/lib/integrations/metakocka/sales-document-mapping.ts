/**
 * Utility functions for managing sales document mappings between CRM and Metakocka
 */

import { createServerClient } from '@/lib/supabase/server';
import { 
  SalesDocumentMapping, 
  SalesDocumentMappingDB, 
  CreateSalesDocumentMappingInput,
  UpdateSalesDocumentMappingInput,
  SyncStatus
} from './types/sales-document-mapping';
import { MetakockaErrorLogger, LogCategory } from './error-logger';

/**
 * Convert database mapping to API mapping
 */
export function convertDbMappingToApiMapping(dbMapping: SalesDocumentMappingDB): SalesDocumentMapping {
  return {
    id: dbMapping.id,
    documentId: dbMapping.document_id,
    metakockaId: dbMapping.metakocka_id,
    metakockaDocumentType: dbMapping.metakocka_document_type as any,
    metakockaDocumentNumber: dbMapping.metakocka_document_number,
    metakockaStatus: dbMapping.metakocka_status,
    syncDirection: dbMapping.sync_direction,
    lastSyncedAt: dbMapping.last_synced_at,
    syncStatus: dbMapping.sync_status,
    syncError: dbMapping.sync_error,
    metadata: dbMapping.metadata
  };
}

/**
 * Get sales document mapping by CRM document ID
 * @param documentId CRM document ID
 * @param userId User ID
 * @returns Sales document mapping or null if not found
 */
export async function getSalesDocumentMapping(
  documentId: string, 
  userId: string
): Promise<SalesDocumentMapping | null> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('metakocka_sales_document_mappings')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return convertDbMappingToApiMapping(data as SalesDocumentMappingDB);
  } catch (error) {
    MetakockaErrorLogger.logError(
      LogCategory.MAPPING,
      `Failed to get sales document mapping for document ${documentId}`,
      { userId, documentId, error }
    );
    return null;
  }
}

/**
 * Get sales document mappings for multiple documents
 * @param documentIds Array of CRM document IDs
 * @param userId User ID
 * @returns Array of sales document mappings
 */
export async function getSalesDocumentMappings(
  documentIds: string[], 
  userId: string
): Promise<SalesDocumentMapping[]> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('metakocka_sales_document_mappings')
      .select('*')
      .in('document_id', documentIds)
      .eq('user_id', userId);
    
    if (error || !data) {
      return [];
    }
    
    return data.map(item => convertDbMappingToApiMapping(item as SalesDocumentMappingDB));
  } catch (error) {
    MetakockaErrorLogger.logError(
      LogCategory.MAPPING,
      `Failed to get sales document mappings for ${documentIds.length} documents`,
      { userId, documentIds, error }
    );
    return [];
  }
}

/**
 * Get sales document mapping by Metakocka ID
 * @param metakockaId Metakocka document ID
 * @param userId User ID
 * @returns Sales document mapping or null if not found
 */
export async function getSalesDocumentMappingByMetakockaId(
  metakockaId: string, 
  userId: string
): Promise<SalesDocumentMapping | null> {
  try {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('metakocka_sales_document_mappings')
      .select('*')
      .eq('metakocka_id', metakockaId)
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return convertDbMappingToApiMapping(data as SalesDocumentMappingDB);
  } catch (error) {
    MetakockaErrorLogger.logError(
      LogCategory.MAPPING,
      `Failed to get sales document mapping for Metakocka document ${metakockaId}`,
      { userId, metakockaId, error }
    );
    return null;
  }
}

/**
 * Create a new sales document mapping
 * @param input Mapping input data
 * @param userId User ID
 * @returns Created mapping or null if creation failed
 */
export async function createSalesDocumentMapping(
  input: CreateSalesDocumentMappingInput, 
  userId: string
): Promise<SalesDocumentMapping | null> {
  try {
    const supabase = await createServerClient();
    
    // Log the creation attempt
    MetakockaErrorLogger.logInfo(
      LogCategory.MAPPING,
      `Creating sales document mapping for document ${input.documentId} to Metakocka document ${input.metakockaId}`,
      { userId, documentId: input.documentId, metakockaId: input.metakockaId }
    );
    
    const { data, error } = await supabase
      .from('metakocka_sales_document_mappings')
      .insert({
        user_id: userId,
        document_id: input.documentId,
        metakocka_id: input.metakockaId,
        metakocka_document_type: input.metakockaDocumentType,
        metakocka_document_number: input.metakockaDocumentNumber,
        metakocka_status: input.metakockaStatus,
        sync_direction: input.syncDirection || 'crm_to_metakocka',
        sync_status: 'synced',
        last_synced_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (error) {
      MetakockaErrorLogger.logError(
        LogCategory.MAPPING,
        `Failed to create sales document mapping: ${error.message}`,
        { userId, input, error }
      );
      return null;
    }
    
    return convertDbMappingToApiMapping(data as SalesDocumentMappingDB);
  } catch (error) {
    MetakockaErrorLogger.logError(
      LogCategory.MAPPING,
      `Exception creating sales document mapping`,
      { userId, input, error }
    );
    return null;
  }
}

/**
 * Update a sales document mapping
 * @param documentId CRM document ID
 * @param input Update data
 * @param userId User ID
 * @returns Updated mapping or null if update failed
 */
export async function updateSalesDocumentMapping(
  documentId: string, 
  input: UpdateSalesDocumentMappingInput, 
  userId: string
): Promise<SalesDocumentMapping | null> {
  try {
    const supabase = await createServerClient();
    
    // Prepare update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    if (input.syncStatus) {
      updateData.sync_status = input.syncStatus;
    }
    
    if (input.syncError !== undefined) {
      updateData.sync_error = input.syncError;
    }
    
    if (input.metakockaStatus) {
      updateData.metakocka_status = input.metakockaStatus;
    }
    
    if (input.metakockaDocumentNumber) {
      updateData.metakocka_document_number = input.metakockaDocumentNumber;
    }
    
    if (input.syncDirection) {
      updateData.sync_direction = input.syncDirection;
    }
    
    if (input.metadata) {
      updateData.metadata = input.metadata;
    }
    
    // If updating to synced status, update last_synced_at
    if (input.syncStatus === 'synced') {
      updateData.last_synced_at = new Date().toISOString();
    }
    
    // Log the update attempt
    MetakockaErrorLogger.logInfo(
      LogCategory.MAPPING,
      `Updating sales document mapping for document ${documentId}`,
      { userId, documentId, updateData }
    );
    
    const { data, error } = await supabase
      .from('metakocka_sales_document_mappings')
      .update(updateData)
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .select('*')
      .single();
    
    if (error) {
      MetakockaErrorLogger.logError(
        LogCategory.MAPPING,
        `Failed to update sales document mapping: ${error.message}`,
        { userId, documentId, input, error }
      );
      return null;
    }
    
    return convertDbMappingToApiMapping(data as SalesDocumentMappingDB);
  } catch (error) {
    MetakockaErrorLogger.logError(
      LogCategory.MAPPING,
      `Exception updating sales document mapping`,
      { userId, documentId, input, error }
    );
    return null;
  }
}

/**
 * Update sales document mapping status
 * @param documentId CRM document ID
 * @param userId User ID
 * @param status New sync status
 * @param error Optional error message
 * @returns Updated mapping or null if update failed
 */
export async function updateSalesDocumentMappingStatus(
  documentId: string, 
  userId: string, 
  status: SyncStatus, 
  error?: string
): Promise<SalesDocumentMapping | null> {
  return updateSalesDocumentMapping(
    documentId, 
    { 
      syncStatus: status, 
      syncError: error 
    }, 
    userId
  );
}

/**
 * Delete a sales document mapping
 * @param documentId CRM document ID
 * @param userId User ID
 * @returns True if deletion was successful
 */
export async function deleteSalesDocumentMapping(
  documentId: string, 
  userId: string
): Promise<boolean> {
  try {
    const supabase = await createServerClient();
    
    // Log the deletion attempt
    MetakockaErrorLogger.logInfo(
      LogCategory.MAPPING,
      `Deleting sales document mapping for document ${documentId}`,
      { userId, documentId }
    );
    
    const { error } = await supabase
      .from('metakocka_sales_document_mappings')
      .delete()
      .eq('document_id', documentId)
      .eq('user_id', userId);
    
    if (error) {
      MetakockaErrorLogger.logError(
        LogCategory.MAPPING,
        `Failed to delete sales document mapping: ${error.message}`,
        { userId, documentId, error }
      );
      return false;
    }
    
    return true;
  } catch (error) {
    MetakockaErrorLogger.logError(
      LogCategory.MAPPING,
      `Exception deleting sales document mapping`,
      { userId, documentId, error }
    );
    return false;
  }
}
