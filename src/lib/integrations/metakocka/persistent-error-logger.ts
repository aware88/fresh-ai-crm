/**
 * Metakocka Persistent Error Logger
 * 
 * An enhanced error logging service for Metakocka integration that persists logs to the database
 * Extends the in-memory logger with database storage capabilities
 */
import { createClient } from '@supabase/supabase-js';
import { MetakockaError, MetakockaErrorType } from './types';
import { LogLevel, LogCategory, LogContext, LogEntry, MetakockaErrorLogger } from './error-logger';

// Interface for database log entry
export interface DbLogEntry extends LogEntry {
  id?: string;
  user_id?: string;
  tenant_id?: string;
  resolved?: boolean;
  resolution_notes?: string;
  resolution_timestamp?: string;
}

/**
 * Metakocka Persistent Error Logger Service
 * 
 * Extends the in-memory logger with database storage capabilities
 * Provides methods for storing, retrieving, and managing logs in the database
 */
export class MetakockaPersistentErrorLogger extends MetakockaErrorLogger {
  private static supabase: any;
  private static initialized = false;
  private static readonly TABLE_NAME = 'metakocka_integration_logs';
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static retryQueue: { entry: DbLogEntry, attempts: number }[] = [];
  
  /**
   * Initialize the persistent logger
   * @param supabaseUrl Supabase URL
   * @param supabaseKey Supabase key
   */
  static initialize(supabaseUrl: string, supabaseKey: string): void {
    if (this.initialized) return;
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.initialized = true;
    
    // Process any queued entries
    this.processRetryQueue();
  }
  
  /**
   * Check if the logger is initialized
   * @returns True if initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Log an error and persist to database
   * @param category Log category
   * @param message Error message
   * @param context Additional context
   * @param tenantId Optional tenant ID for multi-tenant isolation
   */
  static async logErrorPersistent(
    category: LogCategory, 
    message: string, 
    context?: LogContext,
    tenantId?: string
  ): Promise<void> {
    // First log to in-memory store
    super.logError(category, message, context);
    
    // Then persist to database
    const dbLogEntry: DbLogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category,
      message,
      context,
      user_id: context?.userId,
      tenant_id: tenantId,
      resolved: false
    };
    
    await this.persistLogEntry(dbLogEntry);
  }
  
  /**
   * Log a Metakocka API error and persist to database
   * @param error MetakockaError instance
   * @param details Additional details
   * @param tenantId Optional tenant ID for multi-tenant isolation
   */
  static async logMetakockaErrorPersistent(
    error: MetakockaError,
    details?: {
      userId?: string;
      contactId?: string;
      metakockaId?: string;
      details?: Record<string, any>;
    },
    tenantId?: string
  ): Promise<void> {
    // First log to in-memory store
    super.logMetakockaError(error, details);
    
    // Determine category based on error type
    let category = LogCategory.API;
    switch (error.type) {
      case MetakockaErrorType.AUTHENTICATION:
        category = LogCategory.AUTH;
        break;
      case MetakockaErrorType.VALIDATION:
        category = LogCategory.MAPPING;
        break;
      default:
        category = LogCategory.API;
    }
    
    // Then persist to database
    const dbLogEntry: DbLogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category,
      message: error.message,
      context: {
        userId: details?.userId,
        contactId: details?.contactId,
        metakockaId: details?.metakockaId,
        error: {
          code: error.code,
          type: error.type,
          originalError: error.originalError
        },
        details: details?.details
      },
      user_id: details?.userId,
      tenant_id: tenantId,
      resolved: false
    };
    
    await this.persistLogEntry(dbLogEntry);
  }
  
  /**
   * Log a sync event and persist to database
   * @param success Whether the sync was successful
   * @param message Event message
   * @param details Additional details
   * @param tenantId Optional tenant ID for multi-tenant isolation
   */
  static async logSyncEventPersistent(
    success: boolean,
    message: string,
    details?: {
      userId?: string;
      contactId?: string;
      metakockaId?: string;
      created?: number;
      updated?: number;
      failed?: number;
      details?: Record<string, any>;
    },
    tenantId?: string
  ): Promise<void> {
    // First log to in-memory store
    super.logSyncEvent(success, message, details);
    
    const level = success ? LogLevel.INFO : LogLevel.WARNING;
    
    // Then persist to database
    const dbLogEntry: DbLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: LogCategory.SYNC,
      message,
      context: {
        userId: details?.userId,
        contactId: details?.contactId,
        metakockaId: details?.metakockaId,
        details: {
          success,
          created: details?.created || 0,
          updated: details?.updated || 0,
          failed: details?.failed || 0,
          ...details?.details,
        }
      },
      user_id: details?.userId,
      tenant_id: tenantId,
      resolved: success // Auto-resolve successful sync events
    };
    
    await this.persistLogEntry(dbLogEntry);
  }
  
  /**
   * Persist a log entry to the database
   * @param entry Log entry to persist
   */
  private static async persistLogEntry(entry: DbLogEntry): Promise<void> {
    if (!this.initialized) {
      console.warn('[METAKOCKA LOGGER] Not initialized, adding to retry queue');
      this.addToRetryQueue(entry);
      return;
    }
    
    try {
      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .insert(entry);
      
      if (error) {
        console.error('[METAKOCKA LOGGER] Failed to persist log entry:', error);
        this.addToRetryQueue(entry);
      }
    } catch (err) {
      console.error('[METAKOCKA LOGGER] Error persisting log entry:', err);
      this.addToRetryQueue(entry);
    }
  }
  
  /**
   * Add a log entry to the retry queue
   * @param entry Log entry to retry
   */
  private static addToRetryQueue(entry: DbLogEntry): void {
    this.retryQueue.push({ entry, attempts: 0 });
    
    // Schedule processing of the retry queue
    setTimeout(() => this.processRetryQueue(), 5000);
  }
  
  /**
   * Process the retry queue
   */
  private static async processRetryQueue(): Promise<void> {
    if (!this.initialized || this.retryQueue.length === 0) return;
    
    const currentQueue = [...this.retryQueue];
    this.retryQueue = [];
    
    for (const item of currentQueue) {
      if (item.attempts >= this.MAX_RETRY_ATTEMPTS) {
        console.error('[METAKOCKA LOGGER] Max retry attempts reached for log entry:', item.entry);
        continue;
      }
      
      try {
        const { error } = await this.supabase
          .from(this.TABLE_NAME)
          .insert(item.entry);
        
        if (error) {
          console.error('[METAKOCKA LOGGER] Failed to persist log entry on retry:', error);
          this.retryQueue.push({ entry: item.entry, attempts: item.attempts + 1 });
        }
      } catch (err) {
        console.error('[METAKOCKA LOGGER] Error persisting log entry on retry:', err);
        this.retryQueue.push({ entry: item.entry, attempts: item.attempts + 1 });
      }
    }
    
    // If there are still items in the queue, schedule another processing
    if (this.retryQueue.length > 0) {
      setTimeout(() => this.processRetryQueue(), 30000); // Longer delay for retries
    }
  }
  
  /**
   * Get logs from the database
   * @param filter Filter options
   * @param tenantId Optional tenant ID for multi-tenant isolation
   * @returns Promise resolving to filtered logs
   */
  static async getPersistedLogs(
    filter?: {
      level?: LogLevel;
      category?: LogCategory;
      userId?: string;
      contactId?: string;
      metakockaId?: string;
      fromDate?: Date;
      toDate?: Date;
      resolved?: boolean;
    },
    tenantId?: string
  ): Promise<DbLogEntry[]> {
    if (!this.initialized) {
      console.error('[METAKOCKA LOGGER] Not initialized');
      return [];
    }
    
    try {
      let query = this.supabase
        .from(this.TABLE_NAME)
        .select('*');
      
      // Apply tenant filter for multi-tenant isolation
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      // Apply filters
      if (filter?.level) {
        query = query.eq('level', filter.level);
      }
      
      if (filter?.category) {
        query = query.eq('category', filter.category);
      }
      
      if (filter?.userId) {
        query = query.eq('user_id', filter.userId);
      }
      
      if (filter?.resolved !== undefined) {
        query = query.eq('resolved', filter.resolved);
      }
      
      if (filter?.fromDate) {
        query = query.gte('timestamp', filter.fromDate.toISOString());
      }
      
      if (filter?.toDate) {
        query = query.lte('timestamp', filter.toDate.toISOString());
      }
      
      // Add order by timestamp descending
      query = query.order('timestamp', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[METAKOCKA LOGGER] Failed to fetch logs:', error);
        return [];
      }
      
      // Apply additional filters that require context parsing
      let filteredLogs = data;
      
      if (filter?.contactId) {
        filteredLogs = filteredLogs.filter(log => {
          try {
            const context = typeof log.context === 'string' 
              ? JSON.parse(log.context) 
              : log.context;
            return context?.contactId === filter.contactId;
          } catch (err) {
            return false;
          }
        });
      }
      
      if (filter?.metakockaId) {
        filteredLogs = filteredLogs.filter(log => {
          try {
            const context = typeof log.context === 'string' 
              ? JSON.parse(log.context) 
              : log.context;
            return context?.metakockaId === filter.metakockaId;
          } catch (err) {
            return false;
          }
        });
      }
      
      return filteredLogs;
    } catch (err) {
      console.error('[METAKOCKA LOGGER] Error fetching logs:', err);
      return [];
    }
  }
  
  /**
   * Mark a log entry as resolved
   * @param logId ID of the log entry
   * @param notes Resolution notes
   * @param tenantId Optional tenant ID for multi-tenant isolation
   * @returns Promise resolving to success status
   */
  static async resolveLogEntry(
    logId: string, 
    notes?: string,
    tenantId?: string
  ): Promise<boolean> {
    if (!this.initialized) {
      console.error('[METAKOCKA LOGGER] Not initialized');
      return false;
    }
    
    try {
      let query = this.supabase
        .from(this.TABLE_NAME)
        .update({
          resolved: true,
          resolution_notes: notes || '',
          resolution_timestamp: new Date().toISOString()
        })
        .eq('id', logId);
      
      // Apply tenant filter for multi-tenant isolation
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { error } = await query;
      
      if (error) {
        console.error('[METAKOCKA LOGGER] Failed to resolve log entry:', error);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('[METAKOCKA LOGGER] Error resolving log entry:', err);
      return false;
    }
  }
  
  /**
   * Get error statistics
   * @param timeframe Timeframe in days (default: 7)
   * @param tenantId Optional tenant ID for multi-tenant isolation
   * @returns Promise resolving to error statistics
   */
  static async getErrorStatistics(
    timeframe: number = 7,
    tenantId?: string
  ): Promise<{
    totalErrors: number;
    byCategory: Record<string, number>;
    byDay: Record<string, number>;
    resolutionRate: number;
  }> {
    if (!this.initialized) {
      console.error('[METAKOCKA LOGGER] Not initialized');
      return {
        totalErrors: 0,
        byCategory: {},
        byDay: {},
        resolutionRate: 0
      };
    }
    
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - timeframe);
    
    try {
      let query = this.supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('level', LogLevel.ERROR)
        .gte('timestamp', fromDate.toISOString());
      
      // Apply tenant filter for multi-tenant isolation
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[METAKOCKA LOGGER] Failed to fetch error statistics:', error);
        return {
          totalErrors: 0,
          byCategory: {},
          byDay: {},
          resolutionRate: 0
        };
      }
      
      // Calculate statistics
      const totalErrors = data.length;
      const resolvedErrors = data.filter(log => log.resolved).length;
      const resolutionRate = totalErrors > 0 ? resolvedErrors / totalErrors : 0;
      
      // Group by category
      const byCategory: Record<string, number> = {};
      data.forEach(log => {
        const category = log.category;
        byCategory[category] = (byCategory[category] || 0) + 1;
      });
      
      // Group by day
      const byDay: Record<string, number> = {};
      data.forEach(log => {
        const date = new Date(log.timestamp).toISOString().split('T')[0];
        byDay[date] = (byDay[date] || 0) + 1;
      });
      
      return {
        totalErrors,
        byCategory,
        byDay,
        resolutionRate
      };
    } catch (err) {
      console.error('[METAKOCKA LOGGER] Error fetching error statistics:', err);
      return {
        totalErrors: 0,
        byCategory: {},
        byDay: {},
        resolutionRate: 0
      };
    }
  }
}
