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
  const suppliers = await fetchSuppliers();
  const supplier = suppliers.find(s => s.id === id);
  if (!supplier) {
    throw new Error('Supplier not found');
  }
  return supplier;
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
  
  const response = await fetch('/api/suppliers/upload-document', {
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
  const response = await fetch(`/api/suppliers/upload-document?supplierId=${supplierId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch supplier documents');
  }
  
  return response.json();
};

/**
 * Parse and save an email
 */
export const parseSupplierEmail = async (
  emailContent: string,
  productTags: string[] = [],
  supplierId?: string
): Promise<SupplierEmail> => {
  const response = await fetch('/api/suppliers/parse-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      emailContent,
      productTags,
      supplierId,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to parse email');
  }
  
  return response.json();
};

/**
 * Fetch emails for a supplier
 */
export const fetchSupplierEmails = async (supplierId?: string): Promise<SupplierEmail[]> => {
  const url = supplierId ? `/api/suppliers/parse-email?supplierId=${supplierId}` : '/api/suppliers/parse-email';
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch supplier emails');
  }
  
  return response.json();
};

/**
 * Submit a query to the AI assistant
 */
export const querySupplierAI = async (query: string): Promise<{
  queryId: string;
  results: SupplierQueryResult[];
  aiResponse: string;
}> => {
  const response = await fetch('/api/suppliers/query', {
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
  
  return response.json();
};

/**
 * Fetch query history
 */
export const fetchQueryHistory = async (): Promise<SupplierQuery[]> => {
  const response = await fetch('/api/suppliers/query');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch query history');
  }
  
  return response.json();
};

/**
 * Fetch a specific query by ID
 */
export const fetchQueryById = async (queryId: string): Promise<SupplierQuery> => {
  const response = await fetch(`/api/suppliers/query?id=${queryId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch query');
  }
  
  return response.json();
};
