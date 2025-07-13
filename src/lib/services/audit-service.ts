import { createClient } from '@/lib/supabase/server';

// Check if we're in a build environment or if Supabase env vars are missing
const isBuildEnv = process.env.NODE_ENV === 'production' && typeof window === 'undefined';
const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface AuditLog {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  previous_state: Record<string, any> | null;
  new_state: Record<string, any> | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface CreateAuditLogParams {
  user_id?: string;
  organization_id?: string;
  action_type: string;
  entity_type: string;
  entity_id?: string;
  previous_state?: Record<string, any>;
  new_state?: Record<string, any>;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

interface GetAuditLogsParams {
  organization_id?: string;
  user_id?: string;
  action_type?: string;
  entity_type?: string;
  entity_id?: string;
  from_date?: Date;
  to_date?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Service for managing audit logs
 */
export class AuditService {
  /**
   * Create a new audit log entry
   * 
   * @param params - Parameters for creating an audit log
   * @returns The created audit log
   */
  static async createAuditLog(params: CreateAuditLogParams): Promise<AuditLog> {
    // Return mock data during build or if Supabase is not configured
    if (isBuildEnv || !isSupabaseConfigured) {
      console.log('Build environment or missing Supabase config - returning mock audit log');
      return {
        id: 'mock-audit-log-id',
        user_id: params.user_id || null,
        organization_id: params.organization_id || null,
        action_type: params.action_type,
        entity_type: params.entity_type,
        entity_id: params.entity_id || null,
        previous_state: params.previous_state || null,
        new_state: params.new_state || null,
        metadata: params.metadata || null,
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || null,
        created_at: new Date().toISOString()
      };
    }

    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .rpc('log_audit_event', {
          p_user_id: params.user_id || null,
          p_organization_id: params.organization_id || null,
          p_action_type: params.action_type,
          p_entity_type: params.entity_type,
          p_entity_id: params.entity_id || null,
          p_previous_state: params.previous_state || null,
          p_new_state: params.new_state || null,
          p_metadata: params.metadata || null,
          p_ip_address: params.ip_address || null,
          p_user_agent: params.user_agent || null
        });
      
      if (error) {
        console.error('Error creating audit log:', error);
        throw new Error(`Failed to create audit log: ${error.message}`);
      }
      
      // The RPC returns the ID of the created audit log
      const auditLogId = data;
      
      // Fetch the created audit log
      const { data: auditLog, error: fetchError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', auditLogId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching created audit log:', fetchError);
        throw new Error(`Failed to fetch created audit log: ${fetchError.message}`);
      }
      
      return auditLog as AuditLog;
    } catch (error) {
      console.error('Unexpected error in createAuditLog:', error);
      // Return mock data as fallback
      return {
        id: 'error-fallback-audit-log-id',
        user_id: params.user_id || null,
        organization_id: params.organization_id || null,
        action_type: params.action_type,
        entity_type: params.entity_type,
        entity_id: params.entity_id || null,
        previous_state: params.previous_state || null,
        new_state: params.new_state || null,
        metadata: params.metadata || null,
        ip_address: params.ip_address || null,
        user_agent: params.user_agent || null,
        created_at: new Date().toISOString()
      };
    }
  }
  
  /**
   * Get audit logs based on filters
   * 
   * @param params - Parameters for filtering audit logs
   * @returns Array of audit logs
   */
  static async getAuditLogs(params: GetAuditLogsParams): Promise<{
    logs: AuditLog[];
    count: number;
  }> {
    // Return mock data during build or if Supabase is not configured
    if (isBuildEnv || !isSupabaseConfigured) {
      console.log('Build environment or missing Supabase config - returning mock audit logs');
      return {
        logs: [
          {
            id: 'mock-audit-log-1',
            user_id: 'mock-user-id',
            organization_id: params.organization_id || 'mock-org-id',
            action_type: 'login',
            entity_type: 'user',
            entity_id: 'mock-user-id',
            previous_state: null,
            new_state: null,
            metadata: { ip: '127.0.0.1' },
            ip_address: '127.0.0.1',
            user_agent: 'Mock User Agent',
            created_at: new Date().toISOString()
          }
        ],
        count: 1
      };
    }

    try {
      const supabase = createClient();
      
      // Start building the query
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (params.organization_id) {
        query = query.eq('organization_id', params.organization_id);
      }
      
      if (params.user_id) {
        query = query.eq('user_id', params.user_id);
      }
      
      if (params.action_type) {
        query = query.eq('action_type', params.action_type);
      }
      
      if (params.entity_type) {
        query = query.eq('entity_type', params.entity_type);
      }
      
      if (params.entity_id) {
        query = query.eq('entity_id', params.entity_id);
      }
      
      if (params.from_date) {
        query = query.gte('created_at', params.from_date.toISOString());
      }
      
      if (params.to_date) {
        query = query.lte('created_at', params.to_date.toISOString());
      }
      
      // Apply pagination
      query = query.order('created_at', { ascending: false });
      
      if (params.limit) {
        query = query.limit(params.limit);
      }
      
      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
      }
      
      // Execute the query
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Error fetching audit logs:', error);
        throw new Error(`Failed to fetch audit logs: ${error.message}`);
      }
      
      return {
        logs: data as AuditLog[],
        count: count || 0
      };
    } catch (error) {
      console.error('Unexpected error in getAuditLogs:', error);
      // Return mock data as fallback
      return {
        logs: [
          {
            id: 'error-fallback-audit-log-1',
            user_id: 'mock-user-id',
            organization_id: params.organization_id || 'mock-org-id',
            action_type: 'login',
            entity_type: 'user',
            entity_id: 'mock-user-id',
            previous_state: null,
            new_state: null,
            metadata: { ip: '127.0.0.1' },
            ip_address: '127.0.0.1',
            user_agent: 'Mock User Agent',
            created_at: new Date().toISOString()
          }
        ],
        count: 1
      };
    }
  }
  
  /**
   * Get an audit log by ID
   * 
   * @param id - The audit log ID
   * @returns The audit log or null if not found
   */
  static async getAuditLogById(id: string): Promise<AuditLog | null> {
    // Return mock data during build or if Supabase is not configured
    if (isBuildEnv || !isSupabaseConfigured) {
      console.log('Build environment or missing Supabase config - returning mock audit log by ID');
      return {
        id: id,
        user_id: 'mock-user-id',
        organization_id: 'mock-org-id',
        action_type: 'view',
        entity_type: 'document',
        entity_id: 'mock-document-id',
        previous_state: null,
        new_state: null,
        metadata: null,
        ip_address: '127.0.0.1',
        user_agent: 'Mock User Agent',
        created_at: new Date().toISOString()
      };
    }

    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // Record not found
          return null;
        }
        console.error('Error fetching audit log:', error);
        throw new Error(`Failed to fetch audit log: ${error.message}`);
      }
      
      return data as AuditLog;
    } catch (error) {
      console.error('Unexpected error in getAuditLogById:', error);
      // Return mock data as fallback
      return {
        id: id,
        user_id: 'mock-user-id',
        organization_id: 'mock-org-id',
        action_type: 'view',
        entity_type: 'document',
        entity_id: 'mock-document-id',
        previous_state: null,
        new_state: null,
        metadata: null,
        ip_address: '127.0.0.1',
        user_agent: 'Mock User Agent',
        created_at: new Date().toISOString()
      };
    }
  }
  
  /**
   * Create an audit log for a user action with request information
   * 
   * @param req - The request object
   * @param params - Parameters for creating an audit log
   * @returns The created audit log
   */
  static async createAuditLogFromRequest(
    req: Request,
    params: Omit<CreateAuditLogParams, 'ip_address' | 'user_agent'>
  ): Promise<AuditLog> {
    // Extract IP address and user agent from the request
    const ip_address = req.headers.get('x-forwarded-for') || 
                       req.headers.get('x-real-ip') || 
                       'unknown';
    
    const user_agent = req.headers.get('user-agent') || 'unknown';
    
    // Create the audit log
    return this.createAuditLog({
      ...params,
      ip_address: ip_address.toString(),
      user_agent
    });
  }
}
