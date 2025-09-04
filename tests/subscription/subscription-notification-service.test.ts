import { SubscriptionNotificationService } from '@/lib/services/subscription-notification-service';
import { NotificationService } from '@/lib/services/notification-service';
import { SubscriptionService } from '@/lib/services/subscription-service';

// Mock dependencies
jest.mock('@/lib/services/notification-service');
jest.mock('@/lib/services/subscription-service');

// Create mock instances
const mockNotificationService = {
  createOrganizationNotification: jest.fn().mockResolvedValue([{ id: 'notification-1' }]),
} as jest.Mocked<NotificationService>;

const mockSubscriptionService = {
  getExpiringTrialSubscriptions: jest.fn(),
  getUpcomingRenewals: jest.fn(),
  getOrganizationSubscription: jest.fn(),
} as jest.Mocked<SubscriptionService>;

describe('SubscriptionNotificationService', () => {
  let subscriptionNotificationService: SubscriptionNotificationService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create the service and inject mocks
    subscriptionNotificationService = new SubscriptionNotificationService();
    (subscriptionNotificationService as any).notificationService = mockNotificationService;
    (subscriptionNotificationService as any).subscriptionService = mockSubscriptionService;
  });
  
  describe('sendTrialExpirationNotifications', () => {
    it('should send notifications for subscriptions expiring soon', async () => {
      const mockExpiringSubscriptions = [
        {
          id: 'sub-1',
          organization_id: 'org-1',
          status: 'trialing',
          current_period_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
          subscription_plan: { name: 'Pro Plan' }
        },
        {
          id: 'sub-2',
          organization_id: 'org-2',
          status: 'trialing',
          current_period_end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
          subscription_plan: { name: 'Business Plan' }
        },
      ];
      
      mockSubscriptionService.getExpiringTrialSubscriptions = jest.fn().mockResolvedValue(mockExpiringSubscriptions);
      mockNotificationService.createOrganizationNotification = jest.fn().mockResolvedValue([{ id: 'notification-1' }]);
      
      const result = await subscriptionNotificationService.sendTrialExpirationNotifications();
      
      expect(mockSubscriptionService.getExpiringTrialSubscriptions).toHaveBeenCalled();
      expect(mockNotificationService.createOrganizationNotification).toHaveBeenCalledTimes(2);
      
      // Check first notification
      expect(mockNotificationService.createOrganizationNotification).toHaveBeenNthCalledWith(
        1,
        'org-1',
        expect.objectContaining({
          title: 'Your Pro Plan trial is ending soon',
          message: 'Your trial period will end in 2 days. Upgrade now to continue using all features.',
          type: 'subscription_trial_ending',
          action_url: '/account/billing',
          metadata: expect.objectContaining({
            subscription_id: 'sub-1'
          })
        })
      );
      
      // Check second notification
      expect(mockNotificationService.createOrganizationNotification).toHaveBeenNthCalledWith(
        2,
        'org-2',
        expect.objectContaining({
          title: 'Your Business Plan trial is ending soon',
          message: 'Your trial period will end in 1 day. Upgrade now to continue using all features.',
          type: 'subscription_trial_ending',
          action_url: '/account/billing',
          metadata: expect.objectContaining({
            subscription_id: 'sub-2'
          })
        })
      );
      
      expect(result).toEqual({
        notificationsSent: 2,
        subscriptionsProcessed: 2
      });
    });
    
    it('should handle errors and continue processing', async () => {
      const mockExpiringSubscriptions = [
        {
          id: 'sub-1',
          organization_id: 'org-1',
          status: 'trialing',
          current_period_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          subscription_plan: { name: 'Pro Plan' }
        },
        {
          id: 'sub-2',
          organization_id: 'org-2',
          status: 'trialing',
          current_period_end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          subscription_plan: { name: 'Business Plan' }
        },
      ];
      
      mockSubscriptionService.getExpiringTrialSubscriptions = jest.fn().mockResolvedValue(mockExpiringSubscriptions);
      
      // First call succeeds, second call fails
      mockNotificationService.createOrganizationNotification = jest.fn()
        .mockResolvedValueOnce([{ id: 'notification-1' }])
        .mockRejectedValueOnce(new Error('Failed to create notification'));
      
      const result = await subscriptionNotificationService.sendTrialExpirationNotifications();
      
      expect(mockNotificationService.createOrganizationNotification).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        notificationsSent: 1,
        subscriptionsProcessed: 2
      });
    });
  });
  
  describe('sendFailedPaymentNotification', () => {
    it('should send notification for failed payment', async () => {
      const mockSubscription = {
        id: 'sub-1',
        organization_id: 'org-1',
        subscription_plan: { name: 'Pro Plan' }
      };
      
      mockSubscriptionService.getOrganizationSubscription = jest.fn().mockResolvedValue(mockSubscription);
      mockNotificationService.createOrganizationNotification = jest.fn().mockResolvedValue([{ id: 'notification-1' }]);
      
      await subscriptionNotificationService.sendFailedPaymentNotification('org-1');
      
      expect(mockSubscriptionService.getOrganizationSubscription).toHaveBeenCalledWith('org-1');
      expect(mockNotificationService.createOrganizationNotification).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          title: 'Payment failed for Pro Plan subscription',
          message: 'We were unable to process your payment. Please update your payment method to avoid service interruption.',
          type: 'subscription_payment_failed',
          action_url: '/account/billing',
          metadata: expect.objectContaining({
            subscription_id: 'sub-1'
          })
        })
      );
    });
  });
  
  describe('sendSubscriptionUpgradeNotification', () => {
    it('should send notification for subscription upgrade', async () => {
      mockNotificationService.createOrganizationNotification = jest.fn().mockResolvedValue([{ id: 'notification-1' }]);
      
      await subscriptionNotificationService.sendSubscriptionUpgradeNotification(
        'org-1',
        'Business Plan'
      );
      
      expect(mockNotificationService.createOrganizationNotification).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          title: 'Subscription upgraded to Business Plan',
          message: 'Your subscription has been successfully upgraded from Pro Plan to Business Plan. You now have access to additional features.',
          type: 'subscription_upgraded',
          action_url: '/account/billing',
          metadata: expect.objectContaining({
            plan_name: 'Business Plan'
          })
        })
      );
    });
  });
  
  describe('sendRenewalReminders', () => {
    it('should send reminders for subscriptions renewing soon', async () => {
      const mockRenewingSubscriptions = [
        {
          id: 'sub-1',
          organization_id: 'org-1',
          status: 'active',
          current_period_end: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
          subscription_plan: { name: 'Pro Plan', price: 49.99 }
        },
        {
          id: 'sub-2',
          organization_id: 'org-2',
          status: 'active',
          current_period_end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
          subscription_plan: { name: 'Business Plan', price: 99.99 }
        },
      ];
      
      mockSubscriptionService.getUpcomingRenewals = jest.fn().mockResolvedValue(mockRenewingSubscriptions);
      mockNotificationService.createOrganizationNotification = jest.fn().mockResolvedValue([{ id: 'notification-1' }]);
      
      const result = await subscriptionNotificationService.sendRenewalReminders();
      
      expect(mockSubscriptionService.getUpcomingRenewals).toHaveBeenCalled();
      expect(mockNotificationService.createOrganizationNotification).toHaveBeenCalledTimes(2);
      
      // Check first notification
      expect(mockNotificationService.createOrganizationNotification).toHaveBeenNthCalledWith(
        1,
        'org-1',
        expect.objectContaining({
          title: 'Your Pro Plan subscription will renew soon',
          message: 'Your subscription will automatically renew in 6 days. You will be charged $49.99.',
          type: 'subscription_renewal',
          action_url: '/account/billing',
          metadata: expect.objectContaining({
            subscription_id: 'sub-1',
            price: 49.99
          })
        })
      );
      
      expect(result).toEqual({
        notificationsSent: 2,
        subscriptionsProcessed: 2
      });
    });
  });
});
