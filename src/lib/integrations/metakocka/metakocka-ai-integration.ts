/**
 * Metakocka AI Integration
 * 
 * This module provides functions to integrate Metakocka data into the AI context system.
 * It fetches inventory, product, and sales document data from Metakocka and formats it
 * for use in AI processing.
 */

import { InventoryService } from './inventory-service';
import { MetakockaService } from './service';
import { Database } from '@/types/supabase';

// Define types for the mappings
type ProductMapping = {
  id: string;
  product_id: string;
  metakocka_id: string;
  last_synced: string;
  products?: {
    id: string;
    name: string;
    sku?: string | null;
    category?: string | null;
  } | null;
};

type ContactMapping = {
  id: string;
  contact_id: string;
  metakocka_id: string;
  last_synced: string;
  contacts?: {
    id: string;
    firstname: string;
    lastname: string;
    email?: string | null;
    company?: string | null;
  } | null;
};

type SalesDocumentMapping = {
  id: string;
  sales_document_id: string;
  metakocka_id: string;
  last_synced: string;
  sales_documents?: {
    id: string;
    document_type: string;
    document_number?: string | null;
    document_date?: string | null;
    customer_name?: string | null;
    total_amount?: number | null;
  } | null;
};

// Import client dynamically to avoid circular dependencies
function createClient() {
  const { createClient } = require('@/lib/supabase/client');
  return createClient();
}

/**
 * Get Metakocka product data for a specific user
 * @param userId User ID
 * @returns Formatted product data for AI context
 */
export async function getMetakockaProductData(userId: string) {
  const supabase = createClient();
  
  // Get product mappings for this user
  const { data: mappings, error } = await supabase
    .from('metakocka_product_mappings')
    .select(`
      id,
      product_id,
      metakocka_id,
      last_synced,
      products (*)
    `)
    .eq('user_id', userId);
  
  if (error || !mappings) {
    console.error('Error fetching product mappings:', error);
    return [];
  }
  
  // Get inventory data for these products
  const productIds = mappings.map((mapping: ProductMapping) => mapping.product_id);
  let inventoryData: any[] = [];
  
  try {
    inventoryData = await InventoryService.getProductsInventory(userId, productIds);
  } catch (error) {
    console.error('Error fetching inventory data:', error);
  }
  
  // Format the data for AI context
  return mappings.map(mapping => {
    const inventory = inventoryData.find(inv => inv.productId === mapping.product_id) || null;
    
    return {
      id: mapping.product_id,
      metakockaId: mapping.metakocka_id,
      name: mapping.products?.name || 'Unknown Product',
      sku: mapping.products?.sku || null,
      category: mapping.products?.category || null,
      lastSynced: mapping.last_synced,
      inventory: inventory ? {
        quantityOnHand: inventory.quantityOnHand || 0,
        quantityReserved: inventory.quantityReserved || 0,
        quantityAvailable: inventory.quantityAvailable || 0,
        lastUpdated: inventory.lastUpdated
      } : null
    };
  });
}

/**
 * Get Metakocka contact data for a specific user
 * @param userId User ID
 * @returns Formatted contact data for AI context
 */
export async function getMetakockaContactData(userId: string) {
  const supabase = createClient();
  
  // Get contact mappings for this user
  const { data: mappings, error } = await supabase
    .from('metakocka_contact_mappings')
    .select(`
      id,
      contact_id,
      metakocka_id,
      last_synced,
      contacts (*)
    `)
    .eq('user_id', userId);
  
  if (error || !mappings) {
    console.error('Error fetching contact mappings:', error);
    return [];
  }
  
  // Format the data for AI context
  return mappings.map(mapping => {
    return {
      id: mapping.contact_id,
      metakockaId: mapping.metakocka_id,
      name: mapping.contacts ? `${mapping.contacts.firstname} ${mapping.contacts.lastname}` : 'Unknown Contact',
      email: mapping.contacts?.email || null,
      company: mapping.contacts?.company || null,
      lastSynced: mapping.last_synced
    };
  });
}

/**
 * Get Metakocka sales document data for a specific user
 * @param userId User ID
 * @returns Formatted sales document data for AI context
 */
export async function getMetakockaSalesDocumentData(userId: string) {
  const supabase = createClient();
  
  // Get sales document mappings for this user
  const { data: mappings, error } = await supabase
    .from('metakocka_sales_document_mappings')
    .select(`
      id,
      sales_document_id,
      metakocka_id,
      last_synced,
      sales_documents (*)
    `)
    .eq('user_id', userId);
  
  if (error || !mappings) {
    console.error('Error fetching sales document mappings:', error);
    return [];
  }
  
  // Format the data for AI context
  return mappings.map(mapping => {
    return {
      id: mapping.sales_document_id,
      metakockaId: mapping.metakocka_id,
      documentType: mapping.sales_documents?.document_type || 'Unknown',
      documentNumber: mapping.sales_documents?.document_number || null,
      documentDate: mapping.sales_documents?.document_date || null,
      customerName: mapping.sales_documents?.customer_name || null,
      totalAmount: mapping.sales_documents?.total_amount || null,
      lastSynced: mapping.last_synced
    };
  });
}

/**
 * Get comprehensive Metakocka data for AI context
 * @param userId User ID
 * @returns Formatted Metakocka data for AI context
 */
export async function getMetakockaDataForAIContext(userId: string) {
  // Check if the user has Metakocka credentials
  const supabase = createClient();
  const { data: credentials } = await supabase
    .from('metakocka_credentials')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (!credentials) {
    return null; // User doesn't have Metakocka integration
  }
  
  // Fetch all Metakocka data in parallel
  const [products, contacts, salesDocuments] = await Promise.all([
    getMetakockaProductData(userId),
    getMetakockaContactData(userId),
    getMetakockaSalesDocumentData(userId)
  ]);
  
  return {
    products,
    contacts,
    salesDocuments,
    hasMetakockaIntegration: true,
    lastUpdated: new Date().toISOString()
  };
}
