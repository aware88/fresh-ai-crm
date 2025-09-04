import { createClient } from '@/utils/supabase/client';
import { createServerClient } from '@/utils/supabase/server';

export type ActivityAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'invite' | 'assign_role' | 'reset_password' | 'other';

export type EntityType = 
  | 'user' 
  | 'organization' 
  | 'product' 
  | 'contact' 
  | 'email' 
  | 'document' 
  | 'sales_document' 
  | 'subscription' 
  | 'feature_flag' 
  | 'metakocka_integration' 
  | 'other';

export interface ActivityLogData {
  user_id: string;
  action: ActivityAction;
  entity_type: EntityType;
  entity_id?: string;
  details?: Record<string, any>;
  organization_id?: string;
}

/**
 * Client-side activity logger
 */
export const logActivity = async (data: ActivityLogData): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.rpc('log_user_activity', {
      p_user_id: data.user_id,
      p_action: data.action,
      p_entity_type: data.entity_type,
      p_entity_id: data.entity_id || null,
      p_details: data.details || null,
      p_organization_id: data.organization_id || null
    });

    if (error) {
      console.error('Error logging activity:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error logging activity:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
};

/**
 * Server-side activity logger
 */
export const logActivityServer = async (data: ActivityLogData): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = await createServerClient();
    
    const { error } = await supabase.rpc('log_user_activity', {
      p_user_id: data.user_id,
      p_action: data.action,
      p_entity_type: data.entity_type,
      p_entity_id: data.entity_id || null,
      p_details: data.details || null,
      p_organization_id: data.organization_id || null
    });

    if (error) {
      console.error('Error logging activity on server:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error logging activity on server:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
};

/**
 * Get user activity logs
 */
export const getUserActivityLogs = async (userId: string, page = 1, limit = 10) => {
  try {
    const supabase = await createClient();
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('user_activity_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching activity logs:', error);
      return { logs: [], total: 0, error: error.message };
    }

    return { 
      logs: data || [], 
      total: count || 0,
      hasMore: count ? offset + limit < count : false
    };
  } catch (err) {
    console.error('Unexpected error fetching activity logs:', err);
    return { 
      logs: [], 
      total: 0, 
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
};
