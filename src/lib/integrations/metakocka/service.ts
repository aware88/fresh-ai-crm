/**
 * Metakocka Integration Service
 * 
 * Provides high-level functions for interacting with Metakocka API
 * and manages credentials from the database.
 * Includes enhanced error handling and retry mechanisms.
 */
import { createServerClient } from '../../../lib/supabase/server';
import { MetakockaClient } from './client';
import { EnhancedMetakockaClient } from './enhanced-client';
import { MetakockaCredentials, MetakockaError, MetakockaErrorType } from './types';
import { MetakockaRetryHandler, RetryConfig, DEFAULT_RETRY_CONFIG } from './metakocka-retry-handler';
import { LogCategory, MetakockaErrorLogger as ErrorLogger } from './error-logger';
import { cookies } from 'next/headers';

/**
 * Service for managing Metakocka integration
 */
export class MetakockaService {
  /**
   * Get Metakocka credentials for the current user
   * @returns Metakocka credentials or null if not found
   */
  static async getUserCredentials(userId: string): Promise<MetakockaCredentials | null> {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('metakocka_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      companyId: data.company_id,
      secretKey: data.secret_key,
      apiEndpoint: data.api_endpoint,
    };
  }
  
  /**
   * Create or update Metakocka credentials for a user
   * @param userId User ID
   * @param credentials Metakocka credentials
   * @returns Success status
   */
  static async saveCredentials(
    userId: string,
    credentials: MetakockaCredentials
  ): Promise<boolean> {
    const supabase = createServerClient();
    
    // Check if credentials already exist
    const { data: existingCreds } = await supabase
      .from('metakocka_credentials')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (existingCreds) {
      // Update existing credentials
      const { error } = await supabase
        .from('metakocka_credentials')
        .update({
          company_id: credentials.companyId,
          secret_key: credentials.secretKey,
          api_endpoint: credentials.apiEndpoint,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
      
      return !error;
    } else {
      // Create new credentials
      const { error } = await supabase
        .from('metakocka_credentials')
        .insert({
          user_id: userId,
          company_id: credentials.companyId,
          secret_key: credentials.secretKey,
          api_endpoint: credentials.apiEndpoint,
        });
      
      return !error;
    }
  }
  
  /**
   * Delete Metakocka credentials for a user
   * @param userId User ID
   * @returns Success status
   */
  static async deleteCredentials(userId: string): Promise<boolean> {
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('metakocka_credentials')
      .delete()
      .eq('user_id', userId);
    
    return !error;
  }
  
  /**
   * Test Metakocka credentials
   * @param credentials Metakocka credentials to test
   * @returns True if connection is successful
   * @throws MetakockaError on failure
   */
  static async testCredentials(credentials: MetakockaCredentials): Promise<boolean> {
    try {
      const client = new MetakockaClient(credentials);
      return await client.testConnection();
    } catch (error) {
      if (error instanceof MetakockaError) {
        throw error;
      }
      throw new MetakockaError(
        'Failed to test Metakocka credentials',
        MetakockaErrorType.UNKNOWN,
        'TEST_FAILED',
        error
      );
    }
  }
  
  /**
   * Get a Metakocka client for the current user
   * @param userId User ID
   * @param useEnhanced Whether to use the enhanced client with retry logic (default: true)
   * @param retryConfig Optional custom retry configuration
   * @returns Metakocka client instance
   * @throws Error if no credentials are found
   */
  static async getClientForUser(
    userId: string, 
    useEnhanced: boolean = true,
    retryConfig?: RetryConfig
  ): Promise<MetakockaClient> {
    try {
      const credentials = await this.getUserCredentials(userId);
      
      if (!credentials) {
        const error = new Error('No Metakocka credentials found for this user');
        ErrorLogger.logError(LogCategory.AUTH, error.message, { userId });
        throw error;
      }
      
      // Return enhanced client with retry logic if requested
      if (useEnhanced) {
        return new EnhancedMetakockaClient(
          credentials, 
          userId, 
          retryConfig || DEFAULT_RETRY_CONFIG
        );
      }
      
      // Return standard client
      return new MetakockaClient(credentials);
    } catch (error) {
      // Log the error
      ErrorLogger.logError(
        LogCategory.AUTH, 
        `Failed to create Metakocka client: ${error instanceof Error ? error.message : String(error)}`,
        { userId }
      );
      throw error;
    }
  }
  
  /**
   * Get an instance of the MetakockaService
   * This is a convenience method for compatibility with the inventory service
   * @param userId User ID
   * @param useEnhanced Whether to use the enhanced client with retry logic (default: true)
   * @returns MetakockaClient instance
   */
  static async getInstance(userId: string, useEnhanced: boolean = true): Promise<MetakockaClient> {
    return this.getClientForUser(userId, useEnhanced);
  }
}
