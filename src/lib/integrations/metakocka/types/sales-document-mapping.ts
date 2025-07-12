/**
 * Types for Metakocka sales document mappings
 */

/**
 * Direction of synchronization between CRM and Metakocka
 */
export type SyncDirection = 'crm_to_metakocka' | 'metakocka_to_crm' | 'bidirectional';

/**
 * Enum for sync direction constants
 */
export const SyncDirection = {
  CRM_TO_METAKOCKA: 'crm_to_metakocka' as SyncDirection,
  METAKOCKA_TO_CRM: 'metakocka_to_crm' as SyncDirection,
  BIDIRECTIONAL: 'bidirectional' as SyncDirection
};

/**
 * Status of synchronization
 */
export type SyncStatus = 'synced' | 'pending' | 'error' | 'needs_review';

/**
 * Enum for sync status constants
 */
export const SyncStatus = {
  SYNCED: 'synced' as SyncStatus,
  PENDING: 'pending' as SyncStatus,
  ERROR: 'error' as SyncStatus,
  NEEDS_REVIEW: 'needs_review' as SyncStatus
};

/**
 * Metakocka document types
 */
export type MetakockaDocumentType = 'sales_order' | 'invoice' | 'offer' | 'proforma';

/**
 * Mapping between CRM sales document and Metakocka document
 */
export interface SalesDocumentMapping {
  id: string;
  documentId: string;
  metakockaId: string;
  metakockaDocumentType: MetakockaDocumentType;
  metakockaDocumentNumber?: string;
  metakockaStatus?: string;
  syncDirection: SyncDirection;
  lastSyncedAt: string;
  syncStatus: SyncStatus;
  syncError?: string;
  metadata?: Record<string, any>;
}

/**
 * Database representation of sales document mapping
 */
export interface SalesDocumentMappingDB {
  id: string;
  user_id: string;
  document_id: string;
  metakocka_id: string;
  metakocka_document_type: string;
  metakocka_document_number?: string;
  metakocka_status?: string;
  sync_direction: SyncDirection;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
  sync_error?: string;
  metadata?: Record<string, any>;
}

/**
 * Input for creating a new sales document mapping
 */
export interface CreateSalesDocumentMappingInput {
  documentId: string;
  metakockaId: string;
  metakockaDocumentType: MetakockaDocumentType;
  metakockaDocumentNumber?: string;
  metakockaStatus?: string;
  syncDirection?: SyncDirection;
}

/**
 * Input for updating a sales document mapping
 */
export interface UpdateSalesDocumentMappingInput {
  syncStatus?: SyncStatus;
  syncError?: string;
  metakockaStatus?: string;
  metakockaDocumentNumber?: string;
  syncDirection?: SyncDirection;
  metadata?: Record<string, any>;
}

/**
 * Result of a sync operation
 */
export interface SalesDocumentSyncResult {
  success: boolean;
  documentId: string;
  metakockaId?: string;
  message?: string;
  error?: string;
}

/**
 * Result of a bulk sync operation
 */
export interface BulkSalesDocumentSyncResult {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{
    documentId: string;
    error: string;
  }>;
}
