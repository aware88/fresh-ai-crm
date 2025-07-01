// Client-side API functions for supplier documents

export interface SupplierDocument {
  id: string;
  supplier_id: string;
  file_name: string;
  file_type: string;
  document_type: string;
  file_path: string;
  upload_date: string;
  metadata?: Record<string, any>;
  processing_status?: string;
  extracted_data?: Record<string, any>;
  processing_metadata?: Record<string, any>;
  processing_error?: string;
  processed_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

// Function to get documents pending review
export async function fetchDocumentsPendingReview(): Promise<SupplierDocument[]> {
  try {
    const response = await fetch('/api/suppliers/documents/process?status=pending_review');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error fetching documents pending review');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching documents pending review:', error);
    throw error;
  }
}

export interface DocumentUploadResponse {
  success: boolean;
  document: SupplierDocument;
  url: string;
}

// Fetch documents for a supplier
export async function fetchSupplierDocuments(supplierId: string): Promise<SupplierDocument[]> {
  try {
    const response = await fetch(`/api/suppliers/documents?supplierId=${supplierId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error fetching supplier documents');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching supplier documents:', error);
    throw error;
  }
}

// Upload a document for a supplier
export async function uploadSupplierDocument(
  file: File,
  supplierId: string,
  documentType: string
): Promise<DocumentUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('supplierId', supplierId);
    formData.append('documentType', documentType);
    
    const response = await fetch('/api/suppliers/documents/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error uploading document');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading supplier document:', error);
    throw error;
  }
}

// Delete a supplier document
export async function deleteSupplierDocument(documentId: string): Promise<void> {
  try {
    const response = await fetch(`/api/suppliers/documents?id=${documentId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error deleting document');
    }
  } catch (error) {
    console.error('Error deleting supplier document:', error);
    throw error;
  }
}

// Process a document with AI
export async function processDocumentWithAI(documentId: string): Promise<SupplierDocument> {
  try {
    const response = await fetch('/api/suppliers/documents/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        documentId,
        status: 'processing' 
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error processing document');
    }
    
    const result = await response.json();
    return result.document;
  } catch (error) {
    console.error('Error processing document with AI:', error);
    throw error;
  }
}

// Update document processing status
export async function updateDocumentStatus(
  documentId: string, 
  status: string,
  extractedData?: Record<string, any>
): Promise<SupplierDocument> {
  try {
    const response = await fetch('/api/suppliers/documents/process', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        documentId, 
        approved: status === 'approved',
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error updating document status');
    }
    
    const result = await response.json();
    return result.document;
  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
}
