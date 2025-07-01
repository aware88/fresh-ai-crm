/**
 * Metakocka Logs API Client
 * 
 * Client-side API functions for interacting with the Metakocka logs API
 * Provides methods for fetching, filtering, and resolving log entries
 */
import { LogLevel, LogCategory } from './error-logger';

// Interface for log filter options
export interface LogFilter {
  level?: LogLevel;
  category?: LogCategory;
  userId?: string;
  contactId?: string;
  metakockaId?: string;
  fromDate?: Date;
  toDate?: Date;
  resolved?: boolean;
  page?: number;
  pageSize?: number;
}

// Interface for log pagination metadata
export interface LogPagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Interface for log entry from the API
export interface LogEntryResponse {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: any;
  user_id?: string;
  tenant_id?: string;
  resolved: boolean;
  resolution_notes?: string;
  resolution_timestamp?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// Interface for log statistics
export interface LogStatistics {
  totalErrors: number;
  byCategory: Record<string, number>;
  byDay: Record<string, number>;
  resolutionRate: number;
}

/**
 * Fetch Metakocka integration logs with optional filtering
 * @param filter Optional filter criteria
 * @returns Promise resolving to logs and pagination metadata
 */
export async function fetchMetakockaLogs(filter?: LogFilter): Promise<{
  logs: LogEntryResponse[];
  pagination: LogPagination;
}> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filter?.level) {
      params.append('level', filter.level);
    }
    
    if (filter?.category) {
      params.append('category', filter.category);
    }
    
    if (filter?.userId) {
      params.append('userId', filter.userId);
    }
    
    if (filter?.contactId) {
      params.append('contactId', filter.contactId);
    }
    
    if (filter?.metakockaId) {
      params.append('metakockaId', filter.metakockaId);
    }
    
    if (filter?.fromDate) {
      params.append('fromDate', filter.fromDate.toISOString());
    }
    
    if (filter?.toDate) {
      params.append('toDate', filter.toDate.toISOString());
    }
    
    if (filter?.resolved !== undefined) {
      params.append('resolved', filter.resolved.toString());
    }
    
    if (filter?.page) {
      params.append('page', filter.page.toString());
    }
    
    if (filter?.pageSize) {
      params.append('pageSize', filter.pageSize.toString());
    }
    
    // Make the API request
    const response = await fetch(`/api/integrations/metakocka/logs?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Metakocka logs:', error);
    throw error;
  }
}

/**
 * Resolve a Metakocka integration log entry
 * @param logId ID of the log entry to resolve
 * @param notes Optional resolution notes
 * @returns Promise resolving to success status
 */
export async function resolveMetakockaLog(logId: string, notes?: string): Promise<boolean> {
  try {
    const response = await fetch('/api/integrations/metakocka/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        logId,
        notes,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to resolve log: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error resolving Metakocka log:', error);
    throw error;
  }
}

/**
 * Fetch Metakocka integration error statistics
 * @param timeframe Timeframe in days (default: 7)
 * @returns Promise resolving to error statistics
 */
export async function fetchMetakockaErrorStats(timeframe: number = 7): Promise<LogStatistics> {
  try {
    const response = await fetch(`/api/integrations/metakocka/logs/stats?timeframe=${timeframe}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch error statistics: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching Metakocka error statistics:', error);
    throw error;
  }
}

/**
 * Resolve multiple Metakocka integration log entries in bulk
 * @param logIds Array of log entry IDs to resolve
 * @param notes Optional resolution notes (will be applied to all logs)
 * @returns Promise resolving to success status and counts
 */
export async function bulkResolveMetakockaLogs(
  logIds: string[], 
  notes?: string
): Promise<{ 
  success: boolean; 
  resolved: number; 
  failed: number; 
}> {
  try {
    const response = await fetch('/api/integrations/metakocka/logs/bulk-resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        logIds,
        notes,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to bulk resolve logs: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error bulk resolving Metakocka logs:', error);
    throw error;
  }
}

/**
 * Update tags for a Metakocka integration log entry
 * @param logId ID of the log entry to update tags for
 * @param tags Array of tag strings to set for the log entry
 * @returns Promise resolving to success status
 */
export async function updateLogTags(logId: string, tags: string[]): Promise<boolean> {
  try {
    const response = await fetch('/api/integrations/metakocka/logs/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        logId,
        tags,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update log tags: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error updating log tags:', error);
    throw error;
  }
}
