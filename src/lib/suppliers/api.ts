/**
 * Client-side API functions for supplier management
 */
import { Supplier, SupplierDocument, SupplierEmail, SupplierQuery, SupplierQueryResult } from '@/types/supplier';

/**
 * Fetch all suppliers
 */
export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const response = await fetch('/api/suppliers');
  if (!response.ok) {
    throw new Error('Failed to fetch suppliers');
  }
  return response.json();
};

/**
 * Fetch a supplier by ID
 */
export const fetchSupplierById = async (id: string): Promise<Supplier> => {
  const response = await fetch(`/api/suppliers?id=${id}`);
  if (!response.ok) {
    throw new Error('Supplier not found');
  }
  return response.json();
};

/**
 * Create a new supplier
 */
export const createSupplier = async (supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> => {
  const response = await fetch('/api/suppliers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(supplierData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create supplier');
  }
  
  return response.json();
};

/**
 * Update an existing supplier
 */
export const updateSupplier = async (supplier: Supplier): Promise<Supplier> => {
  const response = await fetch('/api/suppliers', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(supplier),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update supplier');
  }
  
  return response.json();
};

/**
 * Delete a supplier
 */
export const deleteSupplier = async (id: string): Promise<void> => {
  const response = await fetch(`/api/suppliers?id=${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete supplier');
  }
};

/**
 * Upload a document for a supplier
 */
export const uploadSupplierDocument = async (
  file: File,
  supplierId: string,
  documentType: string
): Promise<SupplierDocument> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('supplierId', supplierId);
  formData.append('documentType', documentType);
  
  const response = await fetch('/api/suppliers/documents', {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload document');
  }
  
  return response.json();
};

/**
 * Fetch documents for a supplier
 */
export const fetchSupplierDocuments = async (supplierId: string): Promise<SupplierDocument[]> => {
  const response = await fetch(`/api/suppliers/documents?supplierId=${supplierId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch supplier documents');
  }
  
  return response.json();
};

/**
 * Delete a document
 */
export const deleteSupplierDocument = async (documentId: string): Promise<void> => {
  const response = await fetch(`/api/suppliers/documents?id=${documentId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete document');
  }
};

/**
 * Create and save an email
 */
export const createSupplierEmail = async (
  supplierId: string,
  senderEmail: string,
  subject: string,
  body: string,
  senderName?: string,
  receivedDate?: string,
  productTags: string[] = [],
  metadata: Record<string, any> = {}
): Promise<SupplierEmail> => {
  const response = await fetch('/api/suppliers/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      supplierId,
      senderEmail,
      senderName,
      subject,
      body,
      receivedDate,
      productTags,
      metadata
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create email');
  }
  
  return response.json();
};

/**
 * Fetch emails for a supplier
 */
export const fetchSupplierEmails = async (supplierId: string): Promise<SupplierEmail[]> => {
  const response = await fetch(`/api/suppliers/emails?supplierId=${supplierId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch supplier emails');
  }
  
  return response.json();
};

/**
 * Delete a supplier email
 */
export const deleteSupplierEmail = async (emailId: string): Promise<void> => {
  const response = await fetch(`/api/suppliers/emails?id=${emailId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete email');
  }
};

/**
 * Submit a query to the AI assistant
 * The enhanced version now includes product and pricing data in the AI context
 */
export const querySupplierAI = async (query: string): Promise<{
  queryId: string;
  results: SupplierQueryResult[];
  aiResponse: string;
  contextData?: {
    products?: any[];
    pricing?: any[];
    documents?: any[];
  };
}> => {
  // First, submit the query to create it
  const response = await fetch('/api/suppliers/queries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process query');
  }
  
  const queryResponse = await response.json();
  const queryId = queryResponse.id;
  
  // Then immediately fetch the query with its results
  const queryDetailsResponse = await fetch(`/api/suppliers/queries?id=${queryId}`);
  
  if (!queryDetailsResponse.ok) {
    throw new Error('Failed to fetch query results');
  }
  
  const queryDetails = await queryDetailsResponse.json();
  
  // Extract context data if available
  const contextData = queryDetails.contextData || {
    products: [],
    pricing: [],
    documents: []
  };
  
  // Return in the format expected by the SupplierAIChat component
  return {
    queryId: queryId,
    results: queryDetails.results || [],
    aiResponse: queryResponse.aiResponse || queryDetails.query?.ai_response || 'No response available',
    contextData
  };
};

/**
 * Fetch query history
 */
export const fetchQueryHistory = async (): Promise<SupplierQuery[]> => {
  const response = await fetch('/api/suppliers/queries');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch query history');
  }
  
  return response.json();
};

/**
 * Fetch a specific query by ID
 */
export const fetchQueryById = async (queryId: string): Promise<{
  query: SupplierQuery;
  results: SupplierQueryResult[];
}> => {
  const response = await fetch(`/api/suppliers/queries?id=${queryId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch query');
  }
  
  return response.json();
};

/**
 * Delete a query
 */
export const deleteQuery = async (queryId: string): Promise<void> => {
  const response = await fetch(`/api/suppliers/queries?id=${queryId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete query');
  }
};
