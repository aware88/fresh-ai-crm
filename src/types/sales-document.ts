/**
 * Sales document types for the CRM system
 */

export type SalesDocumentType = 'invoice' | 'offer' | 'order' | 'proforma';
export type SalesDocumentStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type SyncDirection = 'crm_to_metakocka' | 'metakocka_to_crm' | 'bidirectional';
export type SyncStatus = 'synced' | 'pending' | 'error' | 'needs_review';

/**
 * Sales document item interface
 */
export interface SalesDocumentItem {
  id?: string;
  document_id?: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
}

/**
 * Sales document interface
 */
export interface SalesDocument {
  id?: string;
  user_id?: string;
  document_type: SalesDocumentType;
  document_number?: string;
  document_date: string; // ISO date string
  due_date?: string; // ISO date string
  customer_id?: string;
  customer_name: string;
  customer_address?: string;
  customer_email?: string;
  total_amount: number;
  tax_amount: number;
  currency: string;
  status: SalesDocumentStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
  items?: SalesDocumentItem[];
}

/**
 * Sales document mapping interface
 */
export interface SalesDocumentMapping {
  id?: string;
  user_id?: string;
  document_id: string;
  metakocka_id: string;
  metakocka_document_type: string;
  metakocka_document_number?: string;
  metakocka_status?: string;
  sync_direction: SyncDirection;
  last_synced_at?: string;
  created_at?: string;
  updated_at?: string;
  sync_status: SyncStatus;
  sync_error?: string;
  metadata?: Record<string, any>;
}

/**
 * Metakocka sales document interface
 */
export interface MetakockaSalesDocument {
  id?: string;
  id_dokument?: string; // Metakocka document ID
  st_dokumenta?: string; // Document number
  tip_dokumenta: string; // Document type (e.g., "izdani_racun", "ponudba")
  status_dokumenta?: string; // Document status
  partner_id?: string; // Partner ID
  partner_naziv: string; // Partner name
  partner_naslov?: string; // Partner address
  partner_email?: string; // Partner email
  datum_dokumenta: string; // Document date (ISO format)
  datum_valute?: string; // Due date (ISO format)
  znesek_brez_ddv?: number; // Amount without VAT
  znesek_z_ddv: number; // Amount with VAT
  znesek_ddv: number; // VAT amount
  valuta: string; // Currency
  opombe?: string; // Notes
  postavke: MetakockaSalesDocumentItem[]; // Line items
  [key: string]: any; // Allow additional fields
}

/**
 * Metakocka sales document item interface
 */
export interface MetakockaSalesDocumentItem {
  id?: string;
  produkt_id?: string; // Product ID
  naziv: string; // Description
  kolicina: number; // Quantity
  cena: number; // Price
  ddv_stopnja: number; // VAT rate
  znesek_ddv: number; // VAT amount
  znesek_z_ddv: number; // Amount with VAT
  [key: string]: any; // Allow additional fields
}

/**
 * Sales document sync result interface
 */
export interface SalesDocumentSyncResult {
  success: boolean;
  documentId?: string;
  metakockaId?: string;
  error?: string;
  errorCode?: string;
  errorDetails?: Record<string, any>;
}

/**
 * Bulk sales document sync result interface
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
