/**
 * Metakocka API Client
 * 
 * A TypeScript client for interacting with the Metakocka API.
 * Handles authentication, request formatting, and error handling.
 */
import axios, { AxiosError, AxiosInstance } from 'axios';
import { 
  MetakockaCredentials, 
  MetakockaBaseResponse,
  MetakockaError,
  MetakockaErrorType,
  MetakockaProduct,
  MetakockaProductResponse,
  MetakockaPartner,
  MetakockaPartnerResponse,
  InventoryCheckRequest,
  InventoryCheckResponse,
  MetakockaSalesDocument,
  MetakockaSalesDocumentResponse,
  MetakockaSalesDocumentType,
  MetakockaSalesDocumentStatus
} from './types';

export class MetakockaClient {
  private axiosInstance: AxiosInstance;
  private credentials: MetakockaCredentials;
  
  /**
   * Create a new Metakocka API client
   * @param credentials API credentials for authentication
   */
  constructor(credentials: MetakockaCredentials) {
    this.credentials = credentials;
    
    // Set default API endpoint if not provided
    const apiEndpoint = credentials.apiEndpoint || 'https://main.metakocka.si/rest/eshop/v1/json/';
    
    // Create axios instance with default configuration
    this.axiosInstance = axios.create({
      baseURL: apiEndpoint,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
    });
  }
  
  /**
   * Make a request to the Metakocka API
   * @param endpoint API endpoint to call
   * @param data Request data
   * @returns API response
   * @throws MetakockaError on failure
   */
  private async request<T extends MetakockaBaseResponse>(
    endpoint: string, 
    data: Record<string, any> = {}
  ): Promise<T> {
    try {
      // Add authentication credentials to every request
      const requestData = {
        ...data,
        secret_key: this.credentials.secretKey,
        company_id: this.credentials.companyId,
      };
      
      // Make the API call
      const response = await this.axiosInstance.post<T>(endpoint, requestData);
      
      // Check for API errors (opr_code !== "0" indicates an error)
      if (response.data.opr_code !== "0") {
        const errorMessage = response.data.opr_desc_app || 
                            response.data.opr_desc || 
                            'Unknown Metakocka API error';
                            
        // Determine error type based on error code
        let errorType = MetakockaErrorType.UNKNOWN;
        if (response.data.opr_code === "1") {
          errorType = MetakockaErrorType.AUTHENTICATION;
        } else if (response.data.opr_code === "2") {
          errorType = MetakockaErrorType.VALIDATION;
        } else if (parseInt(response.data.opr_code) >= 100) {
          // Application errors are >= 100 according to docs
          errorType = MetakockaErrorType.VALIDATION;
        }
        
        throw new MetakockaError(
          errorMessage,
          errorType,
          response.data.opr_code,
          response.data
        );
      }
      
      return response.data;
    } catch (error) {
      // Handle axios errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // Handle network errors
        if (!axiosError.response) {
          throw new MetakockaError(
            'Network error while connecting to Metakocka API',
            MetakockaErrorType.NETWORK,
            'NETWORK_ERROR',
            error
          );
        }
        
        // Handle HTTP errors
        const status = axiosError.response.status;
        let errorType = MetakockaErrorType.UNKNOWN;
        let errorMessage = 'Unknown error occurred';
        
        if (status === 401 || status === 403) {
          errorType = MetakockaErrorType.AUTHENTICATION;
          errorMessage = 'Authentication failed with Metakocka API';
        } else if (status === 404) {
          errorType = MetakockaErrorType.NOT_FOUND;
          errorMessage = 'Requested resource not found in Metakocka API';
        } else if (status >= 500) {
          errorType = MetakockaErrorType.SERVER;
          errorMessage = 'Metakocka API server error';
        }
        
        throw new MetakockaError(
          errorMessage,
          errorType,
          `HTTP_${status}`,
          error
        );
      }
      
      // Re-throw MetakockaError instances
      if (error instanceof MetakockaError) {
        throw error;
      }
      
      // Handle any other errors
      throw new MetakockaError(
        'Unknown error occurred while calling Metakocka API',
        MetakockaErrorType.UNKNOWN,
        'UNKNOWN_ERROR',
        error
      );
    }
  }
  
  /**
   * Add a new product to Metakocka
   * @param product Product data
   * @returns API response with product ID
   */
  async addProduct(product: MetakockaProduct): Promise<MetakockaProductResponse> {
    return this.request<MetakockaProductResponse>('product_add', product);
  }
  
  /**
   * Update an existing product in Metakocka
   * @param product Product data with mk_id
   * @returns API response
   */
  async updateProduct(product: MetakockaProduct): Promise<MetakockaBaseResponse> {
    if (!product.mk_id) {
      throw new MetakockaError(
        'Product ID (mk_id) is required for updates',
        MetakockaErrorType.VALIDATION
      );
    }
    
    return this.request<MetakockaBaseResponse>('product_update', product);
  }
  
  /**
   * Delete a product from Metakocka
   * @param productId Metakocka product ID
   * @returns API response
   */
  async deleteProduct(productId: string): Promise<MetakockaBaseResponse> {
    return this.request<MetakockaBaseResponse>('product_delete', { mk_id: productId });
  }
  
  /**
   * Get a list of products from Metakocka
   * @returns API response with products
   */
  async listProducts(): Promise<any> {
    return this.request<any>('product_list', {});
  }
  
  /**
   * Check inventory levels for products
   * @param productCodes Array of product codes or single product code
   * @returns Inventory data for requested products
   */
  async checkInventory(
    productCodes: string | string[]
  ): Promise<InventoryCheckResponse> {
    // Format product codes as array if single string provided
    const codes = Array.isArray(productCodes) ? productCodes : [productCodes];
    
    const request: InventoryCheckRequest = {
      product_list: codes.map(code => ({ code }))
    };
    
    return this.request<InventoryCheckResponse>('product_check_inventory', request);
  }
  
  /**
   * Get detailed inventory data for a specific product
   * @param productId Metakocka product ID
   * @returns Inventory data including quantity on hand, reserved, and available
   */
  async getProductInventory(productId: string) {
    // First get the product details to get the code
    const productDetails = await this.request<any>('product_get', { mk_id: productId });
    
    if (!productDetails || !productDetails.product_list || productDetails.product_list.length === 0) {
      throw new MetakockaError(
        `Product not found with ID: ${productId}`,
        MetakockaErrorType.NOT_FOUND
      );
    }
    
    const productCode = productDetails.product_list[0].code;
    
    // Now check inventory using the code
    const inventoryData = await this.checkInventory(productCode);
    
    if (!inventoryData || !inventoryData.product_list || inventoryData.product_list.length === 0) {
      throw new MetakockaError(
        `Inventory data not found for product: ${productCode}`,
        MetakockaErrorType.NOT_FOUND
      );
    }
    
    const inventory = inventoryData.product_list[0];
    
    return {
      product_id: productId,
      product_code: productCode,
      quantity_on_hand: parseFloat(inventory.amount_on_warehouse || '0'),
      quantity_reserved: parseFloat(inventory.amount_reserved || '0'),
      quantity_available: parseFloat(inventory.amount_available || '0'),
      warehouse_id: inventory.warehouse_id,
      warehouse_name: inventory.warehouse_name
    };
  }
  
  /**
   * Create a sales document in Metakocka (invoice, offer, order, proforma)
   * @param document Sales document data
   * @returns API response with document ID and number
   */
  async createSalesDocument(document: MetakockaSalesDocument): Promise<MetakockaSalesDocumentResponse> {
    // Determine the endpoint based on document type
    let endpoint: string;
    switch (document.doc_type) {
      case MetakockaSalesDocumentType.INVOICE:
        endpoint = 'put_sales_bill';
        break;
      case MetakockaSalesDocumentType.OFFER:
        endpoint = 'put_sales_offer';
        break;
      case MetakockaSalesDocumentType.ORDER:
        endpoint = 'put_sales_order';
        break;
      case MetakockaSalesDocumentType.PROFORMA:
        endpoint = 'put_sales_bill_proforma';
        break;
      default:
        throw new MetakockaError(
          `Unsupported document type: ${document.doc_type}`,
          MetakockaErrorType.VALIDATION
        );
    }
    
    return this.request<MetakockaSalesDocumentResponse>(endpoint, document);
  }
  
  /**
   * Update an existing sales document in Metakocka
   * @param document Sales document data with mk_id
   * @returns API response
   */
  async updateSalesDocument(document: MetakockaSalesDocument): Promise<MetakockaSalesDocumentResponse> {
    if (!document.mk_id) {
      throw new MetakockaError(
        'Document ID (mk_id) is required for updates',
        MetakockaErrorType.VALIDATION
      );
    }
    
    // Determine the endpoint based on document type
    let endpoint: string;
    switch (document.doc_type) {
      case MetakockaSalesDocumentType.INVOICE:
        endpoint = 'update_sales_bill';
        break;
      case MetakockaSalesDocumentType.OFFER:
        endpoint = 'update_sales_offer';
        break;
      case MetakockaSalesDocumentType.ORDER:
        endpoint = 'update_sales_order';
        break;
      case MetakockaSalesDocumentType.PROFORMA:
        endpoint = 'update_sales_bill_proforma';
        break;
      default:
        throw new MetakockaError(
          `Unsupported document type: ${document.doc_type}`,
          MetakockaErrorType.VALIDATION
        );
    }
    
    return this.request<MetakockaSalesDocumentResponse>(endpoint, document);
  }
  
  /**
   * Get a sales document by ID
   * @param documentId Metakocka document ID
   * @param documentType Type of document to retrieve
   * @returns API response with document details
   */
  async getSalesDocument(documentId: string, documentType: MetakockaSalesDocumentType): Promise<any> {
    // Determine the endpoint based on document type
    let endpoint: string;
    switch (documentType) {
      case MetakockaSalesDocumentType.INVOICE:
        endpoint = 'get_sales_bill';
        break;
      case MetakockaSalesDocumentType.OFFER:
        endpoint = 'get_sales_offer';
        break;
      case MetakockaSalesDocumentType.ORDER:
        endpoint = 'get_sales_order';
        break;
      case MetakockaSalesDocumentType.PROFORMA:
        endpoint = 'get_sales_bill_proforma';
        break;
      default:
        throw new MetakockaError(
          `Unsupported document type: ${documentType}`,
          MetakockaErrorType.VALIDATION
        );
    }
    
    return this.request<any>(endpoint, { mk_id: documentId });
  }
  
  /**
   * Delete a sales document from Metakocka
   * @param documentId Metakocka document ID
   * @param documentType Type of document to delete
   * @returns API response
   */
  async deleteSalesDocument(documentId: string, documentType: MetakockaSalesDocumentType): Promise<MetakockaBaseResponse> {
    // Determine the endpoint based on document type
    let endpoint: string;
    switch (documentType) {
      case MetakockaSalesDocumentType.INVOICE:
        endpoint = 'delete_sales_bill';
        break;
      case MetakockaSalesDocumentType.OFFER:
        endpoint = 'delete_sales_offer';
        break;
      case MetakockaSalesDocumentType.ORDER:
        endpoint = 'delete_sales_order';
        break;
      case MetakockaSalesDocumentType.PROFORMA:
        endpoint = 'delete_sales_bill_proforma';
        break;
      default:
        throw new MetakockaError(
          `Unsupported document type: ${documentType}`,
          MetakockaErrorType.VALIDATION
        );
    }
    
    return this.request<MetakockaBaseResponse>(endpoint, { mk_id: documentId });
  }
  
  /**
   * List sales documents of a specific type
   * @param documentType Type of documents to list
   * @param filters Optional filters (date range, status, etc.)
   * @returns API response with documents list
   */
  async listSalesDocuments(
    documentType: MetakockaSalesDocumentType,
    filters: Record<string, any> = {}
  ): Promise<any> {
    // Determine the endpoint based on document type
    let endpoint: string;
    switch (documentType) {
      case MetakockaSalesDocumentType.INVOICE:
        endpoint = 'list_sales_bill';
        break;
      case MetakockaSalesDocumentType.OFFER:
        endpoint = 'list_sales_offer';
        break;
      case MetakockaSalesDocumentType.ORDER:
        endpoint = 'list_sales_order';
        break;
      case MetakockaSalesDocumentType.PROFORMA:
        endpoint = 'list_sales_bill_proforma';
        break;
      default:
        throw new MetakockaError(
          `Unsupported document type: ${documentType}`,
          MetakockaErrorType.VALIDATION
        );
    }
    
    return this.request<any>(endpoint, filters);
  }
  
  /**
   * Test the API connection
   * @returns True if connection is successful
   * @throws MetakockaError on failure
   */
  /**
   * Add a new partner (contact) to Metakocka
   * @param partner Partner data
   * @returns API response with partner ID
   */
  async addPartner(partner: MetakockaPartner): Promise<MetakockaPartnerResponse> {
    return this.request<MetakockaPartnerResponse>('partner_add', partner);
  }
  
  /**
   * Update an existing partner in Metakocka
   * @param partner Partner data with mk_id
   * @returns API response
   */
  async updatePartner(partner: MetakockaPartner): Promise<MetakockaBaseResponse> {
    if (!partner.mk_id) {
      throw new MetakockaError(
        'Partner ID (mk_id) is required for updates',
        MetakockaErrorType.VALIDATION
      );
    }
    
    return this.request<MetakockaBaseResponse>('partner_update', partner);
  }
  
  /**
   * Delete a partner from Metakocka
   * @param partnerId Metakocka partner ID
   * @returns API response
   */
  async deletePartner(partnerId: string): Promise<MetakockaBaseResponse> {
    return this.request<MetakockaBaseResponse>('partner_delete', { mk_id: partnerId });
  }
  
  /**
   * Get a list of partners from Metakocka
   * @returns API response with partners
   */
  async listPartners(): Promise<any> {
    return this.request<any>('partner_list', {});
  }
  
  /**
   * Get a partner by ID or code
   * @param idOrCode Partner ID or code
   * @param isCode Whether the provided value is a code (true) or ID (false)
   * @returns API response with partner details
   */
  async getPartner(idOrCode: string, isCode: boolean = false): Promise<any> {
    const param = isCode ? { count_code: idOrCode } : { mk_id: idOrCode };
    return this.request<any>('partner_get', param);
  }
  
  /**
   * Search for partners by name or other criteria
   * @param query Search query (e.g., name, email)
   * @returns API response with matching partners
   */
  async searchPartners(query: string): Promise<any> {
    return this.request<any>('partner_search', { query });
  }
  
  async testConnection(): Promise<boolean> {
    try {
      // Make a lightweight API call to test credentials
      await this.listProducts();
      return true;
    } catch (error) {
      if (error instanceof MetakockaError) {
        throw error;
      }
      throw new MetakockaError(
        'Failed to connect to Metakocka API',
        MetakockaErrorType.UNKNOWN,
        'CONNECTION_TEST_FAILED',
        error
      );
    }
  }
}
