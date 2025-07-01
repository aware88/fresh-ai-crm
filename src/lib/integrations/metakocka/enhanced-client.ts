/**
 * Enhanced Metakocka API Client
 * 
 * Extends the base Metakocka client with improved error handling, retry mechanisms,
 * and detailed logging for better reliability and maintainability.
 */
import { MetakockaClient } from './client';
import { MetakockaCredentials, MetakockaError, MetakockaErrorType } from './types';
import { MetakockaRetryHandler, RetryConfig, DEFAULT_RETRY_CONFIG } from './metakocka-retry-handler';
import { LogCategory, MetakockaErrorLogger as ErrorLogger } from './error-logger';

/**
 * Enhanced Metakocka API Client with retry capabilities
 */
export class EnhancedMetakockaClient extends MetakockaClient {
  private userId: string;
  private retryConfig: RetryConfig;
  
  /**
   * Create a new Enhanced Metakocka API client
   * @param credentials API credentials for authentication
   * @param userId User ID for context in error logging
   * @param retryConfig Optional custom retry configuration
   */
  constructor(
    credentials: MetakockaCredentials,
    userId: string,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ) {
    super(credentials);
    this.userId = userId;
    this.retryConfig = retryConfig;
    
    // Enhance methods with retry logic
    this.enhanceMethods();
  }
  
  /**
   * Apply retry logic to key methods
   */
  private enhanceMethods(): void {
    // Wrap key methods with retry logic
    const methodsToEnhance: Array<keyof MetakockaClient> = [
      'addProduct',
      'updateProduct',
      'listProducts',
      'checkInventory',
      'getProductInventory',
      'createSalesDocument',
      'updateSalesDocument',
      'getSalesDocument',
      'listSalesDocuments',
      'addPartner',
      'updatePartner',
      'getPartner',
      'listPartners',
      'searchPartners'
    ];
    
    for (const methodName of methodsToEnhance) {
      const originalMethod = this[methodName] as Function;
      
      if (typeof originalMethod === 'function') {
        // Create a wrapped version with retry logic
        this[methodName] = MetakockaRetryHandler.wrapWithRetry(
          originalMethod.bind(this),
          methodName,
          (args) => this.getContextFromArgs(methodName, args),
          this.retryConfig
        );
      }
    }
  }
  
  /**
   * Extract context information from method arguments for logging
   */
  private getContextFromArgs(methodName: string, args: any[]): any {
    const context: any = {
      userId: this.userId,
      details: { methodName }
    };
    
    // Extract relevant IDs based on method name and arguments
    if (methodName.includes('Partner')) {
      // For partner-related methods
      if (args[0] && typeof args[0] === 'object' && args[0].mk_id) {
        context.metakockaId = args[0].mk_id;
      } else if (args[0] && typeof args[0] === 'string') {
        context.metakockaId = args[0]; // For getPartner, deletePartner
      }
    } else if (methodName.includes('SalesDocument')) {
      // For document-related methods
      if (args[0] && typeof args[0] === 'object' && args[0].mk_id) {
        context.documentId = args[0].mk_id;
      } else if (args[0] && typeof args[0] === 'string') {
        context.documentId = args[0]; // For getSalesDocument, deleteSalesDocument
      }
    } else if (methodName.includes('Product')) {
      // For product-related methods
      if (args[0] && typeof args[0] === 'object' && args[0].mk_id) {
        context.details.productId = args[0].mk_id;
      } else if (args[0] && typeof args[0] === 'string') {
        context.details.productId = args[0]; // For getProduct, deleteProduct
      }
    }
    
    return context;
  }
  
  /**
   * Test the API connection with enhanced error handling
   * @returns True if connection is successful
   * @throws MetakockaError on failure
   */
  async testConnection(): Promise<boolean> {
    return MetakockaRetryHandler.executeWithRetry(
      () => super.testConnection(),
      {
        userId: this.userId,
        operationName: 'testConnection',
        details: { testing: true }
      },
      this.retryConfig
    );
  }
}
