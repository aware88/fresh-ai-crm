/**
 * Sales Documents Database Functions
 */
import { createClient } from '@/lib/supabase/client';
import { SalesDocument, SalesDocumentItem, SalesDocumentMapping } from '@/types/sales-document';

/**
 * Create a new sales document
 * @param document Sales document data
 * @returns Created sales document
 */
export async function createSalesDocument(document: SalesDocument): Promise<SalesDocument> {
  const supabase = createClient();
  
  // Create the document without items first
  const { data, error } = await supabase
    .from('sales_documents')
    .insert({
      user_id: document.user_id,
      document_type: document.document_type,
      document_number: document.document_number,
      document_date: document.document_date,
      due_date: document.due_date,
      customer_id: document.customer_id,
      customer_name: document.customer_name,
      customer_address: document.customer_address,
      customer_email: document.customer_email,
      total_amount: document.total_amount,
      tax_amount: document.tax_amount,
      currency: document.currency,
      status: document.status,
      notes: document.notes,
      metadata: document.metadata
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create sales document: ${error.message}`);
  }

  const createdDocument = data as SalesDocument;

  // If there are items, create them
  if (document.items && document.items.length > 0) {
    const items = document.items.map(item => ({
      ...item,
      document_id: createdDocument.id
    }));

    const { error: itemsError } = await supabase
      .from('sales_document_items')
      .insert(items);

    if (itemsError) {
      throw new Error(`Failed to create sales document items: ${itemsError.message}`);
    }
  }

  // Return the created document with items
  return {
    ...createdDocument,
    items: document.items
  };
}

/**
 * Update an existing sales document
 * @param id Document ID
 * @param document Sales document data
 * @returns Updated sales document
 */
export async function updateSalesDocument(id: string, document: Partial<SalesDocument>): Promise<SalesDocument> {
  const supabase = createClient();
  
  // Update the document
  const { data, error } = await supabase
    .from('sales_documents')
    .update({
      document_type: document.document_type,
      document_number: document.document_number,
      document_date: document.document_date,
      due_date: document.due_date,
      customer_id: document.customer_id,
      customer_name: document.customer_name,
      customer_address: document.customer_address,
      customer_email: document.customer_email,
      total_amount: document.total_amount,
      tax_amount: document.tax_amount,
      currency: document.currency,
      status: document.status,
      notes: document.notes,
      metadata: document.metadata,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update sales document: ${error.message}`);
  }

  // If there are items, handle them
  if (document.items) {
    // First, delete existing items
    const { error: deleteError } = await supabase
      .from('sales_document_items')
      .delete()
      .eq('document_id', id);

    if (deleteError) {
      throw new Error(`Failed to delete existing sales document items: ${deleteError.message}`);
    }

    // Then, create new items
    const items = document.items.map(item => ({
      ...item,
      document_id: id
    }));

    const { error: itemsError } = await supabase
      .from('sales_document_items')
      .insert(items);

    if (itemsError) {
      throw new Error(`Failed to create sales document items: ${itemsError.message}`);
    }
  }

  // Return the updated document with items
  return {
    ...data,
    items: document.items
  } as SalesDocument;
}

/**
 * Get a sales document by ID
 * @param id Document ID
 * @returns Sales document
 */
export async function getSalesDocumentById(id: string): Promise<SalesDocument | null> {
  const supabase = createClient();
  
  // Get the document
  const { data, error } = await supabase
    .from('sales_documents')
    .select()
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get sales document: ${error.message}`);
  }

  // Get the document items
  const { data: items, error: itemsError } = await supabase
    .from('sales_document_items')
    .select()
    .eq('document_id', id);

  if (itemsError) {
    throw new Error(`Failed to get sales document items: ${itemsError.message}`);
  }

  // Return the document with items
  return {
    ...data,
    items: items || []
  } as SalesDocument;
}

/**
 * Get all sales documents for the current user
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
  const supabase = createClient();
  
  // Build the query
  let query = supabase
    .from('sales_documents')
    .select();

  // Apply filters
  if (filters?.documentType) {
    query = query.eq('document_type', filters.documentType);
  }
  
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }
  
  if (filters?.startDate) {
    query = query.gte('document_date', filters.startDate);
  }
  
  if (filters?.endDate) {
    query = query.lte('document_date', filters.endDate);
  }

  // Execute the query
  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get sales documents: ${error.message}`);
  }

  return data as SalesDocument[];
}

/**
 * Delete a sales document
 * @param id Document ID
 * @returns Success status
 */
export async function deleteSalesDocument(id: string): Promise<boolean> {
  const supabase = createClient();
  
  // Delete the document (items will be deleted via cascade)
  const { error } = await supabase
    .from('sales_documents')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete sales document: ${error.message}`);
  }

  return true;
}

/**
 * Create a sales document mapping
 * @param mapping Sales document mapping data
 * @returns Created mapping
 */
export async function createSalesDocumentMapping(mapping: SalesDocumentMapping): Promise<SalesDocumentMapping> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('metakocka_sales_document_mappings')
    .insert({
      user_id: mapping.user_id,
      document_id: mapping.document_id,
      metakocka_id: mapping.metakocka_id,
      metakocka_document_type: mapping.metakocka_document_type,
      metakocka_document_number: mapping.metakocka_document_number,
      metakocka_status: mapping.metakocka_status,
      sync_direction: mapping.sync_direction,
      sync_status: mapping.sync_status,
      sync_error: mapping.sync_error,
      metadata: mapping.metadata
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create sales document mapping: ${error.message}`);
  }

  return data as SalesDocumentMapping;
}

/**
 * Update a sales document mapping
 * @param id Mapping ID
 * @param mapping Sales document mapping data
 * @returns Updated mapping
 */
export async function updateSalesDocumentMapping(id: string, mapping: Partial<SalesDocumentMapping>): Promise<SalesDocumentMapping> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('metakocka_sales_document_mappings')
    .update({
      metakocka_document_number: mapping.metakocka_document_number,
      metakocka_status: mapping.metakocka_status,
      sync_direction: mapping.sync_direction,
      sync_status: mapping.sync_status,
      sync_error: mapping.sync_error,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: mapping.metadata
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update sales document mapping: ${error.message}`);
  }

  return data as SalesDocumentMapping;
}

/**
 * Get a sales document mapping by document ID
 * @param documentId Document ID
 * @returns Sales document mapping
 */
export async function getSalesDocumentMappingByDocumentId(documentId: string): Promise<SalesDocumentMapping | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('metakocka_sales_document_mappings')
    .select()
    .eq('document_id', documentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get sales document mapping: ${error.message}`);
  }

  return data as SalesDocumentMapping;
}

/**
 * Get a sales document mapping by Metakocka ID
 * @param metakockaId Metakocka ID
 * @returns Sales document mapping
 */
export async function getSalesDocumentMappingByMetakockaId(metakockaId: string): Promise<SalesDocumentMapping | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('metakocka_sales_document_mappings')
    .select()
    .eq('metakocka_id', metakockaId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get sales document mapping: ${error.message}`);
  }

  return data as SalesDocumentMapping;
}

/**
 * Delete a sales document mapping
 * @param id Mapping ID
 * @returns Success status
 */
export async function deleteSalesDocumentMapping(id: string): Promise<boolean> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('metakocka_sales_document_mappings')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete sales document mapping: ${error.message}`);
  }

  return true;
}
