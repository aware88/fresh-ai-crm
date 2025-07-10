/**
 * Client-side API functions for Metakocka sales document synchronization
 * 
 * These functions handle all API calls for bidirectional sync between CRM and Metakocka
 * with comprehensive error handling, retry logic, and detailed logging.
 */

/**
 * Get sync status for a sales document
 * @param documentId Sales document ID
 * @returns Sync status response
 */
/**
 * Get sync status for a sales document
 * @param documentId Sales document ID
 * @returns Sync status response
 */
export async function getSalesDocumentSyncStatus(documentId: string) {
  try {
    const response = await fetch(`/api/integrations/metakocka/sales-documents/sync?documentId=${documentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Invalid response' }));
      throw new Error(errorData.message || errorData.error || `Failed to get sync status (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting sales document sync status:', error);
    throw error;
  }
}

/**
 * Get sync status for multiple sales documents
 * @param documentIds Array of sales document IDs
 * @returns Sync status response with mappings
 */
/**
 * Get sync status for multiple sales documents
 * @param documentIds Array of sales document IDs
 * @returns Sync status response with mappings
 */
export async function getBulkSalesDocumentSyncStatus(documentIds: string[]) {
  try {
    // Handle empty array case
    if (!documentIds || documentIds.length === 0) {
      return { mappings: [] };
    }
    
    // Split into batches of 50 if there are many IDs to avoid URL length limits
    if (documentIds.length > 50) {
      console.log(`Large batch of ${documentIds.length} documents detected, splitting into smaller batches`);
      const results = { mappings: [] };
      
      // Process in batches of 50
      for (let i = 0; i < documentIds.length; i += 50) {
        const batch = documentIds.slice(i, i + 50);
        const batchResult = await getBulkSalesDocumentSyncStatus(batch);
        results.mappings = [...results.mappings, ...batchResult.mappings];
      }
      
      return results;
    }
    
    const response = await fetch(`/api/integrations/metakocka/sales-documents/sync?documentIds=${documentIds.join(',')}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Invalid response' }));
      throw new Error(errorData.message || errorData.error || `Failed to get bulk sync status (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting bulk sales document sync status:', error);
    throw error;
  }
}

/**
 * Sync a sales document to Metakocka
 * @param documentId Sales document ID
 * @returns Sync response with Metakocka ID
 */
/**
 * Sync a sales document to Metakocka
 * @param documentId Sales document ID
 * @returns Sync response with Metakocka ID
 */
export async function syncSalesDocument(documentId: string) {
  try {
    const response = await fetch('/api/integrations/metakocka/sales-documents/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documentId }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Invalid response' }));
      throw new Error(errorData.message || errorData.error || `Failed to sync document (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing sales document:', error);
    throw error;
  }
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
 * @returns Sync result with success/failure counts and details
 */
export async function syncSalesDocumentsFromMetakocka(metakockaIds?: string[]) {
  try {
    // If we have a dedicated bulk endpoint in the future, use it here
    // For now, we'll implement an optimized version of individual syncs
    
    if (!metakockaIds || metakockaIds.length === 0) {
      // Get all unsynced documents first
      const unsyncedResult = await getUnsyncedSalesDocumentsFromMetakocka();
      metakockaIds = unsyncedResult.data?.documents?.map((doc: any) => doc.id) || [];
      
      if (metakockaIds.length === 0) {
        return {
          total: 0,
          synced: 0,
          failed: 0,
          details: [],
          message: "No unsynced documents found"
        };
      }
    }
    
    // Prepare results object
    const results = {
      total: metakockaIds.length,
      synced: 0,
      failed: 0,
      details: [] as Array<{id: string; success: boolean; documentId?: string; error?: string}>
    };
    
    // Use Promise.allSettled for parallel processing with concurrency control
    // Process in batches of 5 to avoid overwhelming the server
    const batchSize = 5;
    
    for (let i = 0; i < metakockaIds.length; i += batchSize) {
      const batch = metakockaIds.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(id => {
        return syncSalesDocumentFromMetakocka(id)
          .then(result => ({ id, success: true, documentId: result.documentId }))
          .catch(error => ({ 
            id, 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          }));
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Process batch results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const syncResult = result.value;
          results.details.push(syncResult);
          
          if (syncResult.success) {
            results.synced++;
          } else {
            results.failed++;
          }
        } else {
          // This shouldn't happen due to the catch in the promise, but just in case
          results.failed++;
          results.details.push({
            id: batch[index],
            success: false,
            error: result.reason || 'Unknown error'
          });
        }
      });
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < metakockaIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error syncing sales documents from Metakocka:', error);
    throw error;
  }
}
