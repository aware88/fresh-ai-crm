import { createClient } from '@/lib/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

export type ErrorLogStatus = 'new' | 'in_progress' | 'resolved';
export type EntityType = 'product' | 'contact' | 'sales_document';

export interface ErrorLog {
  id: string;
  user_id: string;
  organization_id: string;
  organization_name?: string;
  entity_type: EntityType;
  entity_id: string;
  entity_name?: string;
  operation: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details: any;
  created_at: string;
  tags: string[];
  error_code?: string;
  assigned_to?: string | null;
  resolution?: string | null;
  error_status?: ErrorLogStatus;
}

export interface ErrorLogFilter {
  organizations?: string[];
  entityTypes?: string[];
  statuses?: string[];
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
  tags?: string[];
}

export class MetakockaLogService {
  private supabase = createClient();

  /**
   * Fetch error logs with optional filtering
   */
  async getErrorLogs(filters?: ErrorLogFilter): Promise<{ data: ErrorLog[] | null; error: PostgrestError | null }> {
    let query = this.supabase
      .from('metakocka_integration_logs')
      .select(`
        *,
        organizations!inner(name)
      `)
      .eq('status', 'error');

    // Apply filters if provided
    if (filters) {
      if (filters.organizations && filters.organizations.length > 0) {
        query = query.in('organization_id', filters.organizations);
      }

      if (filters.entityTypes && filters.entityTypes.length > 0) {
        query = query.in('entity_type', filters.entityTypes);
      }

      if (filters.statuses && filters.statuses.length > 0) {
        query = query.in('error_status', filters.statuses);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters.tags && filters.tags.length > 0) {
        // For array overlap (any tags match)
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.searchQuery) {
        query = query.or(
          `message.ilike.%${filters.searchQuery}%,entity_name.ilike.%${filters.searchQuery}%,error_code.ilike.%${filters.searchQuery}%`
        );
      }
    }

    // Sort by most recent first
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    // Transform the data to match our ErrorLog interface
    const transformedData = data?.map(item => ({
      ...item,
      organization_name: item.organizations?.name,
      error_status: item.error_status || 'new'
    })) as ErrorLog[] | null;

    return { data: transformedData, error };
  }

  /**
   * Get a single error log by ID
   */
  async getErrorLogById(id: string): Promise<{ data: ErrorLog | null; error: PostgrestError | null }> {
    const { data, error } = await this.supabase
      .from('metakocka_integration_logs')
      .select(`
        *,
        organizations!inner(name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return { data: null, error };
    }

    const transformedData = {
      ...data,
      organization_name: data.organizations?.name,
      error_status: data.error_status || 'new'
    } as ErrorLog;

    return { data: transformedData, error: null };
  }

  /**
   * Update the status of an error log
   */
  async updateErrorLogStatus(
    id: string, 
    errorStatus: ErrorLogStatus, 
    resolution?: string,
    assignedTo?: string
  ): Promise<{ data: ErrorLog | null; error: PostgrestError | null }> {
    const updates: any = { error_status: errorStatus };
    
    if (resolution !== undefined) {
      updates.resolution = resolution;
    }
    
    if (assignedTo !== undefined) {
      updates.assigned_to = assignedTo;
    }

    const { data, error } = await this.supabase
      .from('metakocka_integration_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Bulk update error logs status
   */
  async bulkUpdateErrorLogStatus(
    ids: string[], 
    errorStatus: ErrorLogStatus, 
    resolution?: string
  ): Promise<{ success: boolean; error: PostgrestError | null }> {
    const updates: any = { error_status: errorStatus };
    
    if (resolution !== undefined) {
      updates.resolution = resolution;
    }

    const { error } = await this.supabase
      .from('metakocka_integration_logs')
      .update(updates)
      .in('id', ids);

    return { success: !error, error };
  }

  /**
   * Get error log statistics
   */
  async getErrorLogStats(): Promise<{ 
    totalErrors: number; 
    newErrors: number;
    inProgressErrors: number;
    resolvedErrors: number;
    organizationCount: number;
    error: PostgrestError | null 
  }> {
    // Get total count
    const { count: totalCount, error: totalError } = await this.supabase
      .from('metakocka_integration_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'error');

    // Get new errors count
    const { count: newCount, error: newError } = await this.supabase
      .from('metakocka_integration_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'error')
      .eq('error_status', 'new');

    // Get in progress errors count
    const { count: inProgressCount, error: inProgressError } = await this.supabase
      .from('metakocka_integration_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'error')
      .eq('error_status', 'in_progress');

    // Get resolved errors count
    const { count: resolvedCount, error: resolvedError } = await this.supabase
      .from('metakocka_integration_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'error')
      .eq('error_status', 'resolved');

    // Get unique organization count
    const { data: orgs, error: orgsError } = await this.supabase
      .from('metakocka_integration_logs')
      .select('organization_id')
      .eq('status', 'error')
      .distinct();

    const error = totalError || newError || inProgressError || resolvedError || orgsError;

    return {
      totalErrors: totalCount || 0,
      newErrors: newCount || 0,
      inProgressErrors: inProgressCount || 0,
      resolvedErrors: resolvedCount || 0,
      organizationCount: orgs?.length || 0,
      error
    };
  }

  /**
   * Export error logs as CSV
   */
  async exportErrorLogsAsCsv(filters?: ErrorLogFilter): Promise<string> {
    const { data } = await this.getErrorLogs(filters);
    
    if (!data || data.length === 0) {
      return 'No data to export';
    }

    // CSV header
    const headers = [
      'ID',
      'Organization',
      'Entity Type',
      'Entity Name',
      'Error Code',
      'Message',
      'Status',
      'Created At',
      'Resolution'
    ];

    // Convert data to CSV rows
    const rows = data.map(log => [
      log.id,
      log.organization_name || log.organization_id,
      log.entity_type,
      log.entity_name || log.entity_id,
      log.error_code || '',
      log.message,
      log.error_status,
      new Date(log.created_at).toLocaleString(),
      log.resolution || ''
    ]);

    // Combine header and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return csvContent;
  }
}

export const metakockaLogService = new MetakockaLogService();
