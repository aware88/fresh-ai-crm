/**
 * Metakocka Service
 * 
 * Provides core functionality for Metakocka integration services
 */
import { MetakockaErrorLogger, LogCategory } from './error-logger';
import { MetakockaApiService } from './api-service';

// Base class for Metakocka-related services
export class MetakockaService {
  protected apiService: MetakockaApiService;
  protected organizationId: string;

  constructor(organizationId: string, secretKey: string, companyId: string) {
    this.apiService = new MetakockaApiService(secretKey, companyId);
    this.organizationId = organizationId;
  }

  /**
   * Fetch entity details from Metakocka
   * @param entityType Type of entity (contact, product, etc.)
   * @param id Entity ID
   */
  async getEntityDetails(entityType: string, id: string) {
    try {
      const response = await this.apiService.get(`/${entityType}/${id}`);
      return response;
    } catch (error) {
      MetakockaErrorLogger.logError(
        LogCategory.API, 
        `Failed to get ${entityType} details for ID: ${id}`,
        { metakockaId: id, error }
      );
      throw error;
    }
  }

  /**
   * Search for entities in Metakocka
   * @param entityType Type of entity (contact, product, etc.)
   * @param query Search query
   */
  async searchEntities(entityType: string, query: Record<string, any>) {
    try {
      const response = await this.apiService.post(`/${entityType}/search`, query);
      return response;
    } catch (error) {
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Failed to search ${entityType} with query`,
        { details: { query }, error }
      );
      throw error;
    }
  }

  /**
   * Get the organization ID
   */
  getOrganizationId(): string {
    return this.organizationId;
  }
}
