/**
 * Metakocka API Service
 * 
 * Handles API communication with the Metakocka service
 */

import { MetakockaError } from './error-logger';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export class MetakockaApiService {
  private baseUrl = 'https://main.metakocka.si/rest/v1';
  private secretKey: string;
  private companyId: string;
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  constructor(secretKey: string, companyId: string) {
    this.secretKey = secretKey;
    this.companyId = companyId;
  }

  /**
   * Set the base URL for API requests
   * @param url New base URL
   */
  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Make a GET request to the Metakocka API
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns API response
   */
  public async get<T = any>(endpoint: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, params);
  }

  /**
   * Make a POST request to the Metakocka API
   * @param endpoint API endpoint
   * @param data Request body
   * @returns API response
   */
  public async post<T = any>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, {}, data);
  }

  /**
   * Make a PUT request to the Metakocka API
   * @param endpoint API endpoint
   * @param data Request body
   * @returns API response
   */
  public async put<T = any>(endpoint: string, data: any = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, {}, data);
  }

  /**
   * Make a DELETE request to the Metakocka API
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns API response
   */
  public async delete<T = any>(endpoint: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, params);
  }

  /**
   * Make a request to the Metakocka API with retry logic
   * @param method HTTP method
   * @param endpoint API endpoint
   * @param params Query parameters
   * @param data Request body
   * @returns API response
   */
  private async request<T = any>(
    method: string,
    endpoint: string,
    params: Record<string, string> = {},
    data: any = null
  ): Promise<ApiResponse<T>> {
    // Add authentication parameters
    params = {
      ...params,
      secret_key: this.secretKey,
      company_id: this.companyId
    };

    // Build URL with query parameters
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
    
    const url = `${this.baseUrl}/${endpoint}${queryString ? '?' + queryString : ''}`;
    
    // Request options
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Add body for POST and PUT requests
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    // Implement retry logic
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.maxRetries) {
      try {
        const response = await fetch(url, options);
        const statusCode = response.status;
        
        // Handle different response codes
        if (response.ok) {
          const responseData = await response.json();
          return { success: true, data: responseData, statusCode };
        } else {
          let errorMessage = `HTTP error ${statusCode}`;
          
          try {
            // Try to parse error response
            const errorBody = await response.json();
            errorMessage = errorBody.message || errorBody.error || errorMessage;
          } catch (e) {
            // If can't parse JSON, use text
            errorMessage = await response.text() || errorMessage;
          }
          
          // Throw error to be caught by retry logic
          throw new MetakockaError(errorMessage, statusCode);
        }
      } catch (error: any) {
        lastError = error;
        attempts++;
        
        // Don't retry for certain status codes or if max retries reached
        if (
          error instanceof MetakockaError && 
          (error.statusCode === 401 || error.statusCode === 403 || error.statusCode === 404) ||
          attempts >= this.maxRetries
        ) {
          break;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempts - 1)));
      }
    }

    // Return error after all retries failed
    return { 
      success: false, 
      error: lastError?.message || 'Unknown error occurred',
      statusCode: lastError instanceof MetakockaError ? lastError.statusCode : undefined
    };
  }
}
