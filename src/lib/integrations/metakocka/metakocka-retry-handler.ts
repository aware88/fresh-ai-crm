/**
 * Metakocka Retry Handler
 * 
 * Provides enhanced error handling and retry mechanisms for Metakocka API calls
 * to improve reliability and maintainability of the integration.
 */

import { MetakockaError, MetakockaErrorType } from './types';
import { LogCategory, MetakockaErrorLogger as ErrorLogger } from './error-logger';

// Configuration for retry behavior
export interface RetryConfig {
  // Maximum number of retry attempts
  maxRetries: number;
  
  // Base delay between retries in milliseconds
  baseDelayMs: number;
  
  // Whether to use exponential backoff (increases delay with each retry)
  useExponentialBackoff: boolean;
  
  // Maximum delay between retries in milliseconds
  maxDelayMs: number;
  
  // Error types that should trigger a retry
  retryableErrorTypes: MetakockaErrorType[];
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000, // 1 second
  useExponentialBackoff: true,
  maxDelayMs: 10000, // 10 seconds
  retryableErrorTypes: [
    MetakockaErrorType.NETWORK,
    MetakockaErrorType.SERVER
  ]
};

/**
 * Metakocka Retry Handler
 * 
 * Provides methods to execute API calls with retry logic and enhanced error handling
 */
export class MetakockaRetryHandler {
  /**
   * Execute a function with retry logic
   * 
   * @param operation The async function to execute
   * @param context Context information for logging
   * @param config Retry configuration (optional, uses default if not provided)
   * @returns The result of the operation
   * @throws MetakockaError if all retries fail
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: {
      userId?: string;
      operationName: string;
      contactId?: string;
      documentId?: string;
      metakockaId?: string;
      details?: Record<string, any>;
    },
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: MetakockaError | null = null;
    let attempt = 0;
    
    while (attempt <= config.maxRetries) {
      try {
        // If this isn't the first attempt, log that we're retrying
        if (attempt > 0) {
          ErrorLogger.logInfo(
            LogCategory.API,
            `Retrying ${context.operationName} (attempt ${attempt} of ${config.maxRetries})`,
            {
              userId: context.userId,
              contactId: context.contactId,
              documentId: context.documentId,
              metakockaId: context.metakockaId,
              details: {
                ...context.details,
                retryAttempt: attempt,
                maxRetries: config.maxRetries
              }
            }
          );
        }
        
        // Execute the operation
        return await operation();
      } catch (error) {
        // Convert to MetakockaError if it's not already
        const mkError = error instanceof MetakockaError 
          ? error 
          : new MetakockaError(
              error instanceof Error ? error.message : String(error),
              MetakockaErrorType.UNKNOWN,
              'UNKNOWN',
              error
            );
        
        lastError = mkError;
        
        // Check if we should retry based on error type
        const shouldRetry = config.retryableErrorTypes.includes(mkError.type) && 
                          attempt < config.maxRetries;
        
        // Log the error
        ErrorLogger.logMetakockaError(mkError, {
          userId: context.userId,
          contactId: context.contactId,
          metakockaId: context.metakockaId,
          details: {
            ...context.details,
            operationName: context.operationName,
            retryAttempt: attempt,
            willRetry: shouldRetry
          }
        });
        
        // If we shouldn't retry, rethrow the error
        if (!shouldRetry) {
          throw mkError;
        }
        
        // Calculate delay for next retry
        const delay = this.calculateRetryDelay(attempt, config);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increment attempt counter
        attempt++;
      }
    }
    
    // If we get here, we've exhausted all retries
    throw lastError || new MetakockaError(
      `Failed to execute ${context.operationName} after ${config.maxRetries} attempts`,
      MetakockaErrorType.UNKNOWN
    );
  }
  
  /**
   * Calculate the delay before the next retry attempt
   * 
   * @param attempt Current attempt number (0-based)
   * @param config Retry configuration
   * @returns Delay in milliseconds
   */
  private static calculateRetryDelay(attempt: number, config: RetryConfig): number {
    if (config.useExponentialBackoff) {
      // Calculate exponential backoff with jitter
      // Formula: baseDelay * (2^attempt) * (0.5 + random(0, 0.5))
      const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
      const jitter = 0.5 + Math.random() * 0.5; // Random value between 0.5 and 1
      return Math.min(exponentialDelay * jitter, config.maxDelayMs);
    } else {
      // Use fixed delay
      return config.baseDelayMs;
    }
  }
  
  /**
   * Create a wrapped version of a client method with retry logic
   * 
   * @param method The client method to wrap
   * @param methodName Name of the method (for logging)
   * @param contextProvider Function to extract context from method arguments
   * @param config Retry configuration
   * @returns Wrapped method with retry logic
   */
  static wrapWithRetry<T extends (...args: any[]) => Promise<any>>(
    method: T,
    methodName: string,
    contextProvider: (args: Parameters<T>) => {
      userId?: string;
      contactId?: string;
      documentId?: string;
      metakockaId?: string;
      details?: Record<string, any>;
    },
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      const context = contextProvider(args);
      
      return this.executeWithRetry(
        () => method(...args),
        {
          operationName: methodName,
          ...context
        },
        config
      ) as ReturnType<T>;
    }) as T;
  }
}
