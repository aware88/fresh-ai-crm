import { SubscriptionService } from './subscription-service';
import { NotificationService } from './notification-service';
import { createServerClient } from '@/lib/supabase/server';

export class SubscriptionNotificationService {
  private subscriptionService: SubscriptionService;
  private notificationService: NotificationService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
    this.notificationService = new NotificationService();
  }

  /**
   * Send notifications for subscriptions that are about to expire
   * This should be called by a scheduled job
   */
  async sendTrialExpirationNotifications(): Promise<{ success: boolean; processed: number }> {
    const supabase = await createServerClient();
    const now = new Date();
    
    // Find trials that expire in 3 days
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysDate = threeDaysFromNow.toISOString().split('T')[0];
    
    // Query for trials expiring in 3 days
    const { data: expiringTrials, error } = await supabase
      .from('organization_subscriptions')
      .select('*, organizations(name)')
      .eq('status', 'trialing')
      .gte('trial_end', now.toISOString())
      .lte('trial_end', threeDaysFromNow.toISOString());
    
    if (error || !expiringTrials) {
      console.error('Error fetching expiring trials:', error);
      return { success: false, processed: 0 };
    }
    
    // Send notifications for each expiring trial
    let successCount = 0;
    for (const trial of expiringTrials) {
      const daysLeft = Math.ceil((new Date(trial.trial_end).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      const { success } = await this.notificationService.createOrganizationNotification(
        trial.organization_id,
        {
          title: 'Trial Expiring Soon',
          message: `Your trial for ${trial.organizations.name} will expire in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Upgrade now to continue using all features.`,
          type: 'subscription_trial_ending',
          action_url: `/settings/billing?org=${trial.organization_id}`,
          metadata: {
            subscription_id: trial.id,
            trial_end: trial.trial_end,
            days_left: daysLeft
          }
        }
      );
      
      if (success) successCount++;
    }
    
    return { success: true, processed: successCount };
  }

  /**
   * Send notifications for failed payments
   * This should be called by a webhook handler
   */
  async sendFailedPaymentNotification(organizationId: string, invoiceUrl?: string): Promise<{ success: boolean }> {
    const { data: subscription } = await this.subscriptionService.getOrganizationSubscription(organizationId);
    
    if (!subscription) {
      return { success: false };
    }
    
    const { success } = await this.notificationService.createOrganizationNotification(
      organizationId,
      {
        title: 'Payment Failed',
        message: 'Your latest payment has failed. Please update your payment method to avoid service interruption.',
        type: 'subscription_payment_failed',
        action_url: invoiceUrl || `/settings/billing?org=${organizationId}`,
        metadata: {
          subscription_id: subscription.id,
          invoice_url: invoiceUrl,
          payment_date: new Date().toISOString()
        }
      }
    );
    
    return { success };
  }

  /**
   * Send notifications for successful subscription upgrades
   */
  async sendSubscriptionUpgradeNotification(organizationId: string, planName: string): Promise<{ success: boolean }> {
    const { success } = await this.notificationService.createOrganizationNotification(
      organizationId,
      {
        title: 'Subscription Upgraded',
        message: `Your subscription has been successfully upgraded to the ${planName} plan. Enjoy your new features!`,
        type: 'subscription_upgraded',
        action_url: `/settings/billing?org=${organizationId}`,
        metadata: {
          plan_name: planName,
          upgrade_date: new Date().toISOString()
        }
      }
    );
    
    return { success };
  }

  /**
   * Send notifications for upcoming subscription renewals
   * This should be called by a scheduled job
   */
  /**
   * Send notification for new subscription welcome
   */
  async sendSubscriptionWelcomeNotification(organizationId: string): Promise<{ success: boolean }> {
    const { data: subscription } = await this.subscriptionService.getOrganizationSubscription(organizationId);
    
    if (!subscription) {
      return { success: false };
    }
    
    // Get plan details
    const { data: plan } = await this.subscriptionService.getSubscriptionPlanById(subscription.subscription_plan_id);
    
    const planName = plan?.name || 'Premium';
    
    const { success } = await this.notificationService.createOrganizationNotification(
      organizationId,
      {
        title: 'Welcome to Your New Subscription',
        message: `Your ${planName} subscription is now active. Thank you for subscribing to Fresh AI CRM!`,
        type: 'subscription_upgraded', // Using existing notification type
        action_url: `/settings/billing?org=${organizationId}`,
        metadata: {
          plan_name: planName,
          subscription_date: new Date().toISOString()
        }
      }
    );
    
    return { success };
  }

  /**
   * Send notification for subscription cancellation
   */
  async sendSubscriptionCanceledNotification(organizationId: string): Promise<{ success: boolean }> {
    const { success } = await this.notificationService.createOrganizationNotification(
      organizationId,
      {
        title: 'Subscription Canceled',
        message: 'Your subscription has been canceled. You will continue to have access until the end of your current billing period.',
        type: 'subscription_payment_failed', // Using existing notification type as a substitute for cancellation
        action_url: `/settings/billing?org=${organizationId}`,
        metadata: {
          canceled_date: new Date().toISOString()
        }
      }
    );
    
    return { success };
  }

  async sendRenewalReminders(): Promise<{ success: boolean; processed: number }> {
    const supabase = await createServerClient();
    const now = new Date();
    
    // Find subscriptions that renew in 7 days
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Query for subscriptions renewing in 7 days
    const { data: renewingSubscriptions, error } = await supabase
      .from('organization_subscriptions')
      .select('*, organizations(name), subscription_plans(name, price)')
      .eq('status', 'active')
      .gte('current_period_end', now.toISOString())
      .lte('current_period_end', sevenDaysFromNow.toISOString());
    
    if (error || !renewingSubscriptions) {
      console.error('Error fetching renewing subscriptions:', error);
      return { success: false, processed: 0 };
    }
    
    // Send notifications for each renewing subscription
    let successCount = 0;
    for (const subscription of renewingSubscriptions) {
      const renewalDate = new Date(subscription.current_period_end).toLocaleDateString();
      
      const { success } = await this.notificationService.createOrganizationNotification(
        subscription.organization_id,
        {
          title: 'Subscription Renewal Reminder',
          message: `Your ${subscription.subscription_plans.name} subscription for ${subscription.organizations.name} will renew on ${renewalDate} for $${subscription.subscription_plans.price}.`,
          type: 'subscription_renewal',
          action_url: `/settings/billing?org=${subscription.organization_id}`,
          metadata: {
            subscription_id: subscription.id,
            plan_name: subscription.subscription_plans.name,
            renewal_date: subscription.current_period_end,
            price: subscription.subscription_plans.price
          }
        }
      );
      
      if (success) successCount++;
    }
    
    return { success: true, processed: successCount };
  }
}
