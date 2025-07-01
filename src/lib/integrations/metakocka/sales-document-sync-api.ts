/**
 * Client-side API functions for Metakocka sales document synchronization
 */

/**
 * Get sync status for a sales document
 * @param documentId Sales document ID
 * @returns Sync status response
 */
export async function getSalesDocumentSyncStatus(documentId: string) {
  const response = await fetch(`/api/integrations/metakocka/sales-documents/sync?documentId=${documentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get sales document sync status');
  }
  
  return response.json();
}

/**
 * Get sync status for multiple sales documents
 * @param documentIds Array of sales document IDs
 * @returns Sync status response with mappings
 */
export async function getBulkSalesDocumentSyncStatus(documentIds: string[]) {
  const response = await fetch(`/api/integrations/metakocka/sales-documents/sync?documentIds=${documentIds.join(',')}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get bulk sales document sync status');
  }
  
  return response.json();
}

/**
 * Sync a sales document to Metakocka
 * @param documentId Sales document ID
 * @returns Sync response with Metakocka ID
 */
export async function syncSalesDocument(documentId: string) {
  const response = await fetch('/api/integrations/metakocka/sales-documents/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ documentId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sync sales document');
  }
  
  return response.json();
}

/**
 * Sync multiple sales documents to Metakocka
 * @param documentIds Array of sales document IDs
 * @returns Sync result with success/failure counts
 */
export async function syncMultipleSalesDocuments(documentIds: string[]) {
  const response = await fetch('/api/integrations/metakocka/sales-documents/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ documentIds }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sync multiple sales documents');
  }
  
  return response.json();
}

/**
 * Sync all sales documents to Metakocka
 * @returns Sync result with success/failure counts
 */
export async function syncAllSalesDocuments() {
  const response = await fetch('/api/integrations/metakocka/sales-documents/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to sync all sales documents');
  }
  
  return response.json();
}

/**
 * Get unsynced sales documents from Metakocka
 * @returns List of unsynced sales documents
 */
export async function getUnsyncedSalesDocumentsFromMetakocka() {
  try {
    const response = await fetch('/api/integrations/metakocka/sales-documents/sync-from-metakocka', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get unsynced sales documents');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting unsynced sales documents:', error);
    throw error;
  }
}

/**
 * Sync a single sales document from Metakocka to CRM
 * @param metakockaId Metakocka document ID
 * @returns Sync result
 */
export async function syncSalesDocumentFromMetakocka(metakockaId: string) {
  try {
    const response = await fetch('/api/integrations/metakocka/sales-documents/sync-from-metakocka', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metakockaId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sync sales document from Metakocka');
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing sales document from Metakocka:', error);
    throw error;
  }
}

/**
 * Sync multiple or all sales documents from Metakocka to CRM
 * @param metakockaIds Optional array of Metakocka document IDs to sync
 * @returns Sync result
 */
export async function syncSalesDocumentsFromMetakocka(metakockaIds?: string[]) {
  try {
    const response = await fetch('/api/integrations/metakocka/sales-documents/sync-all-from-metakocka', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metakockaIds }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sync sales documents from Metakocka');
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing sales documents from Metakocka:', error);
    throw error;
  }
}
