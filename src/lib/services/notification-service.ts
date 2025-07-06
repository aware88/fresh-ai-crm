import { createClient } from '@/lib/supabase/server';
import { PostgrestError } from '@supabase/supabase-js';

export interface Notification {
  id?: string;
  user_id: string;
  organization_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'billing' | 'trial' | 'system' | 
        'subscription_trial_ending' | 'subscription_payment_failed' | 
        'subscription_upgraded' | 'subscription_renewal';
  read: boolean;
  action_url?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(notification: Omit<Notification, 'id' | 'read' | 'created_at'>): Promise<{ data: Notification | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        read: false
      })
      .select()
      .single();
    
    return { data, error };
  }

  /**
   * Create notifications for all users in an organization
   */
  async createOrganizationNotification(
    organizationId: string,
    notification: Omit<Notification, 'id' | 'read' | 'created_at' | 'user_id' | 'organization_id'>
  ): Promise<{ success: boolean; error: PostgrestError | null }> {
    const supabase = createClient();
    
    // Get all users in the organization
    const { data: users, error: usersError } = await supabase
      .from('organization_users')
      .select('user_id')
      .eq('organization_id', organizationId);
    
    if (usersError || !users) {
      return { success: false, error: usersError };
    }
    
    // Create notifications for each user
    const notificationPromises = users.map(user => {
      return this.createNotification({
        user_id: user.user_id,
        organization_id: organizationId,
        ...notification
      });
    });
    
    try {
      await Promise.all(notificationPromises);
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: error as PostgrestError };
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, limit = 20): Promise<{ data: Notification[] | null; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return { data, error };
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    
    return { success: !error, error };
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error: PostgrestError | null }> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    
    return { success: !error, error };
  }
}
