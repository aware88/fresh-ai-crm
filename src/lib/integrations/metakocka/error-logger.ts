/**
 * Metakocka Error Logger
 * 
 * A centralized error logging service for Metakocka integration
 * Handles structured logging of errors, warnings, and sync status events
 */
import { MetakockaError, MetakockaErrorType } from './types';

// Re-export MetakockaError and MetakockaErrorType for backward compatibility
export { MetakockaError, MetakockaErrorType };

// Log levels for different types of messages
export enum LogLevel {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  DEBUG = 'debug',
}

// Log categories for organizing logs
export enum LogCategory {
  SYNC = 'sync',
  API = 'api',
  AUTH = 'auth',
  MAPPING = 'mapping',
  GENERAL = 'general',
  CACHE = 'cache',
}

// Interface for log context
export interface LogContext {
  userId?: string;
  contactId?: string;
  documentId?: string;
  documentIds?: string[];
  metakockaId?: string;
  error?: any;
  input?: any;
  updateData?: any;
  details?: Record<string, any>;
}

// Interface for log entries
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: LogContext;
}

/**
 * Metakocka Error Logger Service
 * 
 * Handles structured logging of errors, warnings, and sync status events
 * for the Metakocka integration
 */
export class MetakockaErrorLogger {
  private static logs: LogEntry[] = [];
  private static maxLogs: number = 1000; // Maximum number of logs to keep in memory
  
  /**
   * Add a log entry to the logs array
   * @param logEntry The log entry to add
   */
  private static addLog(logEntry: LogEntry): void {
    this.logs.push(logEntry);
    
    // Trim logs if they exceed the maximum
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Log an error
   * @param category Log category
   * @param message Error message
   * @param context Additional context
   */
  static logError(category: LogCategory, message: string, context?: LogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category,
      message,
      context
    };

    this.addLog(logEntry);
    console.error(`[METAKOCKA ERROR] [${category}] ${message}`, context);

    // TODO: Add error reporting to a monitoring service
  }

  /**
   * Log a warning
   * @param category Log category
   * @param message Warning message
   * @param context Additional context
   */
  static logWarning(category: LogCategory, message: string, context?: LogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARNING,
      category,
      message,
      context
    };

    this.addLog(logEntry);
    console.warn(`[METAKOCKA WARNING] [${category}] ${message}`, context);
  }

  /**
   * Log an info message
   * @param category Log category
   * @param message Info message
   * @param context Additional context
   */
  static logInfo(category: LogCategory, message: string, context?: LogContext): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category,
      message,
      context
    };

    this.addLog(logEntry);
    console.info(`[METAKOCKA INFO] [${category}] ${message}`, context);
  }

  /**
   * Log a debug message
   * @param category Log category
   * @param message Debug message
   * @param context Additional context
   */
  static logDebug(category: LogCategory, message: string, context?: LogContext): void {
    // Only log debug messages in development
    if (process.env.NODE_ENV === 'development') {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        category,
        message,
        context
      };

      this.addLog(logEntry);
      console.debug(`[METAKOCKA DEBUG] [${category}] ${message}`, context);
    }
  }

  /**
   * Log a Metakocka API error
   * @param error MetakockaError instance
   * @param details Additional details
   */
  static logMetakockaError(
    error: MetakockaError,
    details?: {
      userId?: string;
      contactId?: string;
      metakockaId?: string;
      details?: Record<string, any>;
    }
  ): void {
    let category = LogCategory.API;

    // Determine category based on error type
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

    this.logError(
      category,
      error.message,
      {
        userId: details?.userId,
        contactId: details?.contactId,
        metakockaId: details?.metakockaId,
        error: {
          code: error.code,
          type: error.type,
          // Include the original error if available
          originalError: error.originalError
        },
        details: details?.details
      }
    );
  }

  /**
   * Log a sync event
   * @param success Whether the sync was successful
   * @param message Event message
   * @param details Additional details
   */
  static logSyncEvent(
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
    }
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.WARNING;
    
    const logEntry: LogEntry = {
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
      }
    };
    
    this.addLog(logEntry);
    
    // Also log to console for development
    if (success) {
      console.info(`[METAKOCKA SYNC] ${message}`);
    } else {
      console.warn(`[METAKOCKA SYNC] ${message}`);
    }
  }

  /**
   * Get logs by filter
   * @param filter Filter options
   * @returns Filtered logs
   */
  static getLogsByFilter(filter: {
    level?: LogLevel;
    category?: LogCategory;
    userId?: string;
    contactId?: string;
    documentId?: string;
    metakockaId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];
    
    if (filter.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }
    
    if (filter.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filter.category);
    }
    
    if (filter.userId) {
      filteredLogs = filteredLogs.filter(log => log.context?.userId === filter.userId);
    }
    
    if (filter.contactId) {
      filteredLogs = filteredLogs.filter(log => log.context?.contactId === filter.contactId);
    }
    
    if (filter.documentId) {
      filteredLogs = filteredLogs.filter(log => log.context?.documentId === filter.documentId);
    }
    
    if (filter.metakockaId) {
      filteredLogs = filteredLogs.filter(log => log.context?.metakockaId === filter.metakockaId);
    }
    
    if (filter.fromDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filter.fromDate!);
    }
    
    if (filter.toDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= filter.toDate!);
    }
    
    return filteredLogs;
  }
  
  /**
   * Get all logs
   * @param filter Optional filter criteria
   * @returns Filtered logs
   */
  static getLogs(filter?: {
    level?: LogLevel;
    category?: LogCategory;
    userId?: string;
    contactId?: string;
    metakockaId?: string;
    startDate?: Date;
    endDate?: Date;
  }): LogEntry[] {
    if (!filter) {
      return this.logs;
    }
    
    return this.getLogsByFilter({
      level: filter.level,
      category: filter.category,
      userId: filter.userId,
      contactId: filter.contactId,
      metakockaId: filter.metakockaId,
      fromDate: filter.startDate,
      toDate: filter.endDate
    });
  }
  
  /**
   * Clear all logs
   */
  static clearLogs(): void {
    this.logs = [];
  }
}
