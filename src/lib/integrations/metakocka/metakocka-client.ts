/**
 * Metakocka Client
 * 
 * Specialized client for interacting with Metakocka API directly
 */
import { MetakockaApiService } from './api-service';
import { MetakockaErrorLogger, LogCategory } from './error-logger';

export interface MetakockaClientConfig {
  secretKey: string;
  companyId: string;
  baseUrl?: string;
}

// Singleton client instance for shared use
let sharedClient: MetakockaClient | null = null;

// Convenience functions for external use
export async function fetchMetakockaContact(id: string, config: MetakockaClientConfig) {
  const client = sharedClient || new MetakockaClient(config);
  if (!sharedClient) sharedClient = client;
  return client.getContact(id);
}

export async function fetchMetakockaProduct(id: string, config: MetakockaClientConfig) {
  const client = sharedClient || new MetakockaClient(config);
  if (!sharedClient) sharedClient = client;
  return client.getProduct(id);
}

export async function fetchMetakockaDocument(id: string, config: MetakockaClientConfig) {
  const client = sharedClient || new MetakockaClient(config);
  if (!sharedClient) sharedClient = client;
  // Using search method instead of direct apiService access
  return client.search('sales_bill', { id });
}

export class MetakockaClient {
  private apiService: MetakockaApiService;
  
  constructor(config: MetakockaClientConfig) {
    this.apiService = new MetakockaApiService(
      config.secretKey, 
      config.companyId,
      config.baseUrl
    );
  }

  /**
   * Get contact by ID
   */
  async getContact(id: string) {
    try {
      return await this.apiService.get(`/contact/${id}`);
    } catch (error) {
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Failed to get contact with ID ${id}`,
        { contactId: id, error }
      );
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(id: string) {
    try {
      return await this.apiService.get(`/product/${id}`);
    } catch (error) {
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Failed to get product with ID ${id}`,
        { productId: id, error }
      );
      throw error;
    }
  }

  /**
   * Search for entities
   */
  async search(path: string, query: Record<string, any>) {
    try {
      return await this.apiService.post(`/${path}/search`, query);
    } catch (error) {
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Failed to search ${path} with query`,
        { query, error }
      );
      throw error;
    }
  }

  /**
   * Create entity
   */
  async create(path: string, data: Record<string, any>) {
    try {
      return await this.apiService.post(`/${path}`, data);
    } catch (error) {
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Failed to create ${path}`,
        { data, error }
      );
      throw error;
    }
  }

  /**
   * Update entity
   */
  async update(path: string, id: string, data: Record<string, any>) {
    try {
      return await this.apiService.put(`/${path}/${id}`, data);
    } catch (error) {
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Failed to update ${path} with ID ${id}`,
        { id, data, error }
      );
      throw error;
    }
  }
}
