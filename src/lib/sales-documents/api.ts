/**
 * Sales Documents API Client Functions
 */
import { SalesDocument, SalesDocumentMapping, SalesDocumentSyncResult, BulkSalesDocumentSyncResult } from '@/types/sales-document';

/**
 * Create a new sales document
 * @param document Sales document data
 * @returns Created sales document
 */
export async function createSalesDocument(document: SalesDocument): Promise<SalesDocument> {
  const response = await fetch('/api/sales-documents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create sales document');
  }

  return response.json();
}

/**
 * Update an existing sales document
 * @param id Document ID
 * @param document Sales document data
 * @returns Updated sales document
 */
export async function updateSalesDocument(id: string, document: Partial<SalesDocument>): Promise<SalesDocument> {
  const response = await fetch(`/api/sales-documents/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(document),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update sales document');
  }

  return response.json();
}

/**
 * Get a sales document by ID
 * @param id Document ID
 * @returns Sales document
 */
export async function getSalesDocumentById(id: string): Promise<SalesDocument> {
  const response = await fetch(`/api/sales-documents/${id}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get sales document');
  }

  return response.json();
}

/**
 * Get all sales documents
 * @param filters Optional filters
 * @returns List of sales documents
 */
export async function getSalesDocuments(filters?: {
  documentType?: string;
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<SalesDocument[]> {
  // Build query string from filters
  const queryParams = new URLSearchParams();
  
  if (filters?.documentType) {
    queryParams.append('documentType', filters.documentType);
  }
  
  if (filters?.status) {
    queryParams.append('status', filters.status);
  }
  
  if (filters?.customerId) {
    queryParams.append('customerId', filters.customerId);
  }
  
  if (filters?.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  
  if (filters?.endDate) {
    queryParams.append('endDate', filters.endDate);
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/api/sales-documents?${queryString}` : '/api/sales-documents';
  
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get sales documents');
  }

  return response.json();
}

/**
 * Delete a sales document
 * @param id Document ID
 * @returns Success status
 */
export async function deleteSalesDocument(id: string): Promise<boolean> {
  const response = await fetch(`/api/sales-documents/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete sales document');
  }

  return true;
}

/**
 * Sync a sales document with Metakocka
 * @param documentId Document ID
 * @returns Sync result
 */
export async function syncSalesDocument(documentId: string): Promise<SalesDocumentSyncResult> {
  const response = await fetch(`/api/sales-documents/${documentId}/sync`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sync sales document');
  }

  return response.json();
}

/**
 * Sync all sales documents with Metakocka
 * @param filters Optional filters
 * @returns Bulk sync result
 */
export async function syncAllSalesDocuments(filters?: {
  documentType?: string;
  status?: string;
}): Promise<BulkSalesDocumentSyncResult> {
  // Build query string from filters
  const queryParams = new URLSearchParams();
  
  if (filters?.documentType) {
    queryParams.append('documentType', filters.documentType);
  }
  
  if (filters?.status) {
    queryParams.append('status', filters.status);
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/api/sales-documents/sync-all?${queryString}` : '/api/sales-documents/sync-all';
  
  const response = await fetch(url, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sync all sales documents');
  }

  return response.json();
}

/**
 * Get the sync status of a sales document
 * @param documentId Document ID
 * @returns Sales document mapping
 */
export async function getSalesDocumentSyncStatus(documentId: string): Promise<SalesDocumentMapping | null> {
  const response = await fetch(`/api/sales-documents/${documentId}/sync-status`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get sales document sync status');
  }

  return response.json();
}
