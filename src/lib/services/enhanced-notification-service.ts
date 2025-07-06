import { createClient } from '@/lib/supabase/server';
import { PostgrestError } from '@supabase/supabase-js';
import { NotificationService, Notification } from './notification-service';
import { EmailService } from './email-service';
import { NotificationPreferencesService } from './notification-preferences-service';

export class EnhancedNotificationService extends NotificationService {
  private emailService: EmailService;
  private preferencesService: NotificationPreferencesService;

  constructor() {
    super();
    this.emailService = new EmailService();
    this.preferencesService = new NotificationPreferencesService();
  }

  /**
   * Create a notification with preference checking and email integration
   */
  async createEnhancedNotification(notification: Omit<Notification, 'id' | 'read' | 'created_at'>): Promise<{ 
    data: { notification: Notification | null; emailQueued: boolean }; 
    error: PostgrestError | null 
  }> {
    try {
      const supabase = createClient();
      
      // Check user's notification preferences
      const { data: preference } = await this.preferencesService.getPreferenceByType(
        notification.user_id,
        notification.type
      );
      
      // Default to enabled if no preference is set
      const inAppEnabled = preference?.in_app_enabled ?? true;
      const emailEnabled = preference?.email_enabled ?? true;
      
      let notificationData: Notification | null = null;
      let emailQueued = false;
      
      // Create in-app notification if enabled
      if (inAppEnabled) {
        const { data, error } = await super.createNotification(notification);
        if (error) {
          return { data: { notification: null, emailQueued: false }, error };
        }
        notificationData = data;
      }
      
      // Send email notification if enabled
      if (emailEnabled) {
        // Get notification template for better formatting
        const { data: templates } = await supabase
          .from('notification_templates')
          .select('*')
          .eq('type', notification.type)
          .single();
        
        // Format email content
        let emailSubject = notification.title;
        let emailBody = notification.message;
        
        if (templates) {
          // Use template for better formatting
          emailBody = `<h1>${notification.title}</h1><p>${notification.message}</p>`;
          
          // Add action button if URL is provided
          if (notification.action_url) {
            emailBody += `<p><a href="${notification.action_url}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">View Details</a></p>`;
          }
          
          // Add footer
          emailBody += `<p style="color: #6B7280; font-size: 12px; margin-top: 20px;">This is an automated notification from Fresh AI CRM.</p>`;
        }
        
        // Queue email
        const { error: emailError } = await this.emailService.queueNotificationEmail({
          userId: notification.user_id,
          organizationId: notification.organization_id,
          subject: emailSubject,
          body: emailBody,
          metadata: {
            notification_type: notification.type,
            notification_id: notificationData?.id,
            ...notification.metadata
          }
        });
        
        if (!emailError) {
          emailQueued = true;
        }
      }
      
      return { 
        data: { 
          notification: notificationData, 
          emailQueued 
        }, 
        error: null 
      };
    } catch (error) {
      return { 
        data: { notification: null, emailQueued: false }, 
        error: error as PostgrestError 
      };
    }
  }

  /**
   * Create notifications for all users in an organization with preference checking
   */
  async createEnhancedOrganizationNotification(
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
    
    // Create notifications for each user based on their preferences
    const notificationPromises = users.map(user => {
      return this.createEnhancedNotification({
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
}
