/**
 * Types for Metakocka API integration
 */

/**
 * Metakocka API credentials
 */
export interface MetakockaCredentials {
  companyId: string;
  secretKey: string;
  apiEndpoint?: string;
}

/**
 * Base response structure from Metakocka API
 */
export interface MetakockaBaseResponse {
  opr_code: string;
  opr_time_ms?: string;
  opr_desc?: string;
  opr_desc_app?: string;
  opr_code_app?: string;
}

/**
 * Error response from Metakocka API
 */
export interface MetakockaErrorResponse extends MetakockaBaseResponse {
  opr_code: string; // Will be non-zero
}

/**
 * Product response from Metakocka API
 */
export interface MetakockaProductResponse extends MetakockaBaseResponse {
  mk_id?: string;
  count_code?: string;
}

/**
 * Product data structure for Metakocka API
 */
export interface MetakockaProduct {
  count_code: string;
  code?: string;
  name: string;
  name_desc?: string;
  unit: string;
  service: string; // 'true' or 'false' as string
  sales: string; // 'true' or 'false' as string
  purchasing?: string; // 'true' or 'false' as string
  height?: string;
  depth?: string;
  weight?: string;
  mk_id?: string; // Only for updates
}

/**
 * Inventory check request
 */
export interface InventoryCheckRequest {
  product_list: Array<{ code: string }>;
}

/**
 * Inventory check response
 */
export interface InventoryCheckResponse extends MetakockaBaseResponse {
  product_list?: Array<{
    code: string;
    mk_id?: string;
    amount_on_warehouse?: string;
    amount_reserved?: string;
    amount_available?: string;
    warehouse_id?: string;
    warehouse_name?: string;
  }>;
}

/**
 * Partner (contact) response from Metakocka API
 */
export interface MetakockaPartnerResponse extends MetakockaBaseResponse {
  mk_id?: string;
  count_code?: string;
}

/**
 * Partner (contact) data structure for Metakocka API
 */
export interface MetakockaPartner {
  count_code: string;
  name: string;
  street?: string;
  post_number?: string;
  place?: string;
  country?: string;
  email?: string;
  phone?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  tax_number?: string;
  partner_type?: string; // 'B' for business, 'P' for person
  sales?: string; // 'true' or 'false' as string
  purchasing?: string; // 'true' or 'false' as string
  mk_id?: string; // Only for updates
}

/**
 * Sales document response from Metakocka API
 */
export interface MetakockaSalesDocumentResponse extends MetakockaBaseResponse {
  mk_id?: string;
  doc_number?: string;
}

/**
 * Sales document types supported by Metakocka API
 */
export enum MetakockaSalesDocumentType {
  INVOICE = 'sales_bill',
  OFFER = 'offer',
  ORDER = 'sales_order',
  PROFORMA = 'sales_bill_proforma'
}

/**
 * Sales document status values
 */
export enum MetakockaSalesDocumentStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  DELETED = 'deleted'
}

/**
 * Sales document item structure for Metakocka API
 */
export interface MetakockaSalesDocumentItem {
  mk_id?: string;
  count_code: string;
  name: string;
  amount: string;
  price: string;
  discount_percent?: string;
  tax_rate?: string;
  notes?: string;
}

/**
 * Sales document data structure for Metakocka API
 */
export interface MetakockaSalesDocument {
  mk_id?: string;
  doc_type: MetakockaSalesDocumentType;
  partner_mk_id?: string;
  partner_count_code?: string;
  doc_number?: string;
  doc_date: string;
  doc_due_date?: string;
  doc_vat_date?: string;
  status?: MetakockaSalesDocumentStatus;
  title?: string;
  notes?: string;
  currency_code?: string;
  doc_created_email?: string;
  sales_pricelist_code?: string;
  warehouse_code?: string;
  sales_document_items: MetakockaSalesDocumentItem[];
}

/**
 * Metakocka API error types
 */
export enum MetakockaErrorType {
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  NETWORK = 'network',
  UNKNOWN = 'unknown',
}

/**
 * Custom error class for Metakocka API errors
 */
export class MetakockaError extends Error {
  public type: MetakockaErrorType;
  public code: string;
  public originalError?: any;

  constructor(
    message: string,
    type: MetakockaErrorType = MetakockaErrorType.UNKNOWN,
    code: string = '',
    originalError?: any
  ) {
    super(message);
    this.name = 'MetakockaError';
    this.type = type;
    this.code = code;
    this.originalError = originalError;
  }
}
