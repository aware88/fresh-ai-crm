import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { PostgrestError } from '@supabase/supabase-js';

export interface NotificationPreference {
  user_id: string;
  notification_type: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export class NotificationPreferencesService {
  /**
   * Get notification preferences for a user
   */
  async getUserPreferences(userId: string): Promise<{ data: NotificationPreference[] | null; error: PostgrestError | null }> {
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);
    
    return { data, error };
  }

  /**
   * Get notification preference for a specific type
   */
  async getPreferenceByType(userId: string, type: string): Promise<{ data: NotificationPreference | null; error: PostgrestError | null }> {
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('notification_type', type)
      .single();
    
    return { data, error };
  }

  /**
   * Update or create a notification preference
   */
  async upsertPreference(preference: NotificationPreference): Promise<{ data: NotificationPreference | null; error: PostgrestError | null }> {
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(preference)
      .select()
      .single();
    
    return { data, error };
  }

  /**
   * Update multiple notification preferences at once
   */
  async upsertPreferences(preferences: NotificationPreference[]): Promise<{ data: NotificationPreference[] | null; error: PostgrestError | null }> {
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(preferences)
      .select();
    
    return { data, error };
  }

  /**
   * Get all available notification types
   */
  async getNotificationTypes(): Promise<{ data: { type: string }[] | null; error: PostgrestError | null }> {
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .from('notification_templates')
      .select('type')
      .order('type');
    
    return { data, error };
  }

  /**
   * Get notification templates with details
   */
  async getNotificationTemplates(): Promise<{ data: any[] | null; error: PostgrestError | null }> {
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('type');
    
    return { data, error };
  }
}
