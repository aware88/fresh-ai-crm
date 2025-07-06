import { createClient } from '@/lib/supabase/server';
import { EnhancedNotificationService } from '@/lib/services/enhanced-notification-service';
import { SubscriptionService } from '@/lib/services/subscription-service';

export class NotificationJobs {
  private notificationService: EnhancedNotificationService;
  private subscriptionService: SubscriptionService;

  constructor() {
    this.notificationService = new EnhancedNotificationService();
    this.subscriptionService = new SubscriptionService();
  }

  /**
   * Process subscription renewal reminders
   * Sends notifications for subscriptions renewing in the next 7 days
   */
  async processRenewalReminders(): Promise<{ processed: number; errors: number }> {
    const supabase = createClient();
    let processed = 0;
    let errors = 0;

    try {
      // Get subscriptions renewing in the next 7 days
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const { data: subscriptions, error } = await supabase
        .from('organization_subscriptions')
        .select('*, organizations(id, name)')
        .eq('status', 'active')
        .lt('current_period_end', sevenDaysFromNow.toISOString())
        .gt('current_period_end', new Date().toISOString());

      if (error) {
        console.error('Error fetching subscriptions for renewal reminders:', error);
        return { processed: 0, errors: 1 };
      }

      // Process each subscription
      for (const subscription of subscriptions || []) {
        try {
          // Get organization admin users
          const { data: orgUsers } = await supabase
            .from('organization_users')
            .select('user_id')
            .eq('organization_id', subscription.organization_id)
            .eq('role', 'admin');

          if (!orgUsers || orgUsers.length === 0) continue;

          // Format renewal date
          const renewalDate = new Date(subscription.current_period_end).toLocaleDateString();
          
          // Send notification to each admin
          for (const orgUser of orgUsers) {
            await this.notificationService.createEnhancedNotification({
              user_id: orgUser.user_id,
              organization_id: subscription.organization_id,
              type: 'subscription_renewal',
              title: 'Subscription Renewal Reminder',
              message: `Your subscription for ${subscription.organizations.name} will renew on ${renewalDate}.`,
              action_url: `/dashboard/billing`,
              metadata: {
                subscription_id: subscription.id,
                renewal_date: subscription.current_period_end,
                plan: subscription.plan_id
              }
            });
          }
          
          processed++;
        } catch (err) {
          console.error(`Error processing renewal reminder for subscription ${subscription.id}:`, err);
          errors++;
        }
      }

      return { processed, errors };
    } catch (err) {
      console.error('Error in processRenewalReminders job:', err);
      return { processed, errors: errors + 1 };
    }
  }

  /**
   * Process trial ending reminders
   * Sends notifications for trials ending in the next 3 days
   */
  async processTrialEndingReminders(): Promise<{ processed: number; errors: number }> {
    const supabase = createClient();
    let processed = 0;
    let errors = 0;

    try {
      // Get trials ending in the next 3 days
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      
      const { data: subscriptions, error } = await supabase
        .from('organization_subscriptions')
        .select('*, organizations(id, name)')
        .eq('status', 'trialing')
        .lt('trial_end', threeDaysFromNow.toISOString())
        .gt('trial_end', new Date().toISOString());

      if (error) {
        console.error('Error fetching trials for ending reminders:', error);
        return { processed: 0, errors: 1 };
      }

      // Process each trial subscription
      for (const subscription of subscriptions || []) {
        try {
          // Get organization admin users
          const { data: orgUsers } = await supabase
            .from('organization_users')
            .select('user_id')
            .eq('organization_id', subscription.organization_id)
            .eq('role', 'admin');

          if (!orgUsers || orgUsers.length === 0) continue;

          // Format trial end date
          const trialEndDate = new Date(subscription.trial_end).toLocaleDateString();
          const daysLeft = Math.ceil((new Date(subscription.trial_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          // Send notification to each admin
          for (const orgUser of orgUsers) {
            await this.notificationService.createEnhancedNotification({
              user_id: orgUser.user_id,
              organization_id: subscription.organization_id,
              type: 'subscription_trial_ending',
              title: 'Trial Period Ending Soon',
              message: `Your trial for ${subscription.organizations.name} will end in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Subscribe now to continue using all features.`,
              action_url: `/dashboard/billing`,
              metadata: {
                subscription_id: subscription.id,
                trial_end_date: subscription.trial_end,
                days_left: daysLeft
              }
            });
          }
          
          processed++;
        } catch (err) {
          console.error(`Error processing trial ending reminder for subscription ${subscription.id}:`, err);
          errors++;
        }
      }

      return { processed, errors };
    } catch (err) {
      console.error('Error in processTrialEndingReminders job:', err);
      return { processed, errors: errors + 1 };
    }
  }

  /**
   * Process payment failure notifications
   * Sends notifications for recent payment failures
   */
  async processPaymentFailureNotifications(): Promise<{ processed: number; errors: number }> {
    const supabase = createClient();
    let processed = 0;
    let errors = 0;

    try {
      // Get recent payment failures (last 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const { data: invoices, error } = await supabase
        .from('subscription_invoices')
        .select('*, organization_subscriptions(organization_id, organizations(name))')
        .eq('status', 'failed')
        .gt('created_at', oneDayAgo.toISOString())
        .is('notification_sent', null); // Only get ones where notification hasn't been sent

      if (error) {
        console.error('Error fetching failed payments:', error);
        return { processed: 0, errors: 1 };
      }

      // Process each failed invoice
      for (const invoice of invoices || []) {
        try {
          const organizationId = invoice.organization_subscriptions.organization_id;
          const organizationName = invoice.organization_subscriptions.organizations.name;
          
          // Get organization admin users
          const { data: orgUsers } = await supabase
            .from('organization_users')
            .select('user_id')
            .eq('organization_id', organizationId)
            .eq('role', 'admin');

          if (!orgUsers || orgUsers.length === 0) continue;
          
          // Send notification to each admin
          for (const orgUser of orgUsers) {
            await this.notificationService.createEnhancedNotification({
              user_id: orgUser.user_id,
              organization_id: organizationId,
              type: 'subscription_payment_failed',
              title: 'Payment Failed',
              message: `We were unable to process your payment for ${organizationName}. Please update your payment method to avoid service interruption.`,
              action_url: `/dashboard/billing`,
              metadata: {
                invoice_id: invoice.id,
                amount: invoice.amount,
                attempt_count: invoice.attempt_count
              }
            });
          }
          
          // Mark notification as sent
          await supabase
            .from('subscription_invoices')
            .update({ notification_sent: new Date().toISOString() })
            .eq('id', invoice.id);
          
          processed++;
        } catch (err) {
          console.error(`Error processing payment failure notification for invoice ${invoice.id}:`, err);
          errors++;
        }
      }

      return { processed, errors };
    } catch (err) {
      console.error('Error in processPaymentFailureNotifications job:', err);
      return { processed, errors: errors + 1 };
    }
  }
}
