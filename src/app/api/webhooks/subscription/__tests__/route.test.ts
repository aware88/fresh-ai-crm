import { NextRequest } from 'next/server';
import { POST } from '../route';
import { SubscriptionService } from '@/lib/services/subscription-service';
import { SubscriptionNotificationService } from '@/lib/services/subscription-notification-service';
import { createClient } from '@/lib/supabase/server';
import { verifyWebhookSignature } from '@/lib/utils/webhook-utils';
import { NotificationService } from '@/lib/services/notification-service';

// Mock dependencies
jest.mock('@/lib/services/subscription-service');
jest.mock('@/lib/services/subscription-notification-service');
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/utils/webhook-utils');

describe('Subscription Webhook Handler', () => {
  let mockSubscriptionService: jest.Mocked<SubscriptionService>;
  let mockSubscriptionNotificationService: jest.Mocked<SubscriptionNotificationService>;
  let mockSupabaseClient: ReturnType<typeof createClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscriptionService = new SubscriptionService() as jest.Mocked<SubscriptionService>;

    // Add missing methods to mock
    mockSubscriptionService.updateSubscription = jest.fn();
    mockSubscriptionService.cancelSubscription = jest.fn();
    mockSubscriptionService.getPlanName = jest.fn();
    mockSubscriptionService.getSubscriptionPlans = jest.fn();

    // Mock Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis()
    } as unknown as ReturnType<typeof createClient>;

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);

    // Mock webhook signature verification
    (verifyWebhookSignature as jest.Mock).mockImplementation((provider, payload, headers) => {
      // Return a mock verified event
      return Promise.resolve({
        type: JSON.parse(payload).type,
        data: JSON.parse(payload).data
      });
    });

    mockSubscriptionNotificationService = new SubscriptionNotificationService(
      new NotificationService(),
      mockSubscriptionService
    ) as jest.Mocked<SubscriptionNotificationService>;

    (SubscriptionService as jest.Mock).mockImplementation(() => mockSubscriptionService);
    (SubscriptionNotificationService as jest.Mock).mockImplementation(() => mockSubscriptionNotificationService);
  });

  const createMockRequest = (body: any = {}): NextRequest => {
    const bodyString = JSON.stringify(body);
    return {
      text: jest.fn().mockResolvedValue(bodyString),
      json: jest.fn().mockResolvedValue(body),
      headers: new Headers({
        'stripe-signature': 'test-signature',
        'x-payment-provider': 'stripe'
      })
    } as unknown as NextRequest;
  };

  it('should handle payment_succeeded event', async () => {
    const mockRequest = createMockRequest({
      type: 'payment_succeeded',
      data: {
        organization_id: 'org-123',
        subscription_id: 'sub-123',
        amount: 49.99
      }
    });
    
    mockSubscriptionService.updateSubscription = jest.fn().mockResolvedValue({
      id: 'sub-123',
      status: 'active'
    });
    
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    expect(response.status).toBe(200);
    expect(responseData).toEqual({ success: true, event: 'payment_succeeded' });
    expect(mockSubscriptionService.updateSubscription).toHaveBeenCalledWith(
      'sub-123',
      'active'
    );
  });
  
  it('should handle payment_failed event', async () => {
    const mockRequest = createMockRequest({
      type: 'payment_failed',
      data: {
        organization_id: 'org-123',
        subscription_id: 'sub-123'
      }
    });
    
    mockSubscriptionService.updateSubscription = jest.fn().mockResolvedValue({
      id: 'sub-123',
      status: 'past_due'
    });
    
    mockSubscriptionNotificationService.sendFailedPaymentNotification = jest.fn().mockResolvedValue({
      id: 'notification-123'
    });
    
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    expect(response.status).toBe(200);
    expect(responseData).toEqual({ success: true, event: 'payment_failed' });
    expect(mockSubscriptionService.updateSubscription).toHaveBeenCalledWith(
      'sub-123',
      'past_due'
    );
    expect(mockSubscriptionNotificationService.sendFailedPaymentNotification).toHaveBeenCalledWith(
      'org-123'
    );
  });
  
  it('should handle subscription_created event', async () => {
    const mockRequest = createMockRequest({
      type: 'subscription_created',
      data: {
        organization_id: 'org-123',
        subscription_id: 'sub-123',
        plan_id: 'plan-123'
      }
    });
    
    mockSubscriptionService.cancelSubscription = jest.fn().mockResolvedValue({
      id: 'sub-123',
      status: 'active'
    });
    
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    expect(response.status).toBe(200);
    expect(responseData).toEqual({ success: true, event: 'subscription_created' });
    expect(mockSubscriptionService.cancelSubscription).toHaveBeenCalledWith(
      'sub-123',
      'org-123',
      'plan-123'
    );
  });
  
  it('should handle subscription_updated event', async () => {
    const mockRequest = createMockRequest({
      type: 'subscription_updated',
      data: {
        organization_id: 'org-123',
        subscription_id: 'sub-123',
        plan_id: 'plan-456',
        old_plan_id: 'plan-123'
      }
    });
    
    mockSubscriptionService.cancelSubscription = jest.fn().mockResolvedValue({
      id: 'sub-123',
      status: 'active'
    });
    
    mockSubscriptionService.getPlanName = jest.fn()
      .mockResolvedValueOnce('Pro Plan') // old plan
      .mockResolvedValueOnce('Business Plan'); // new plan
    
    mockSubscriptionNotificationService.sendSubscriptionUpgradeNotification = jest.fn().mockResolvedValue({
      id: 'notification-123'
    });
    
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    expect(response.status).toBe(200);
    expect(responseData).toEqual({ success: true, event: 'subscription_updated' });
    expect(mockSubscriptionService.cancelSubscription).toHaveBeenCalledWith(
      'sub-123',
      'org-123',
      'plan-456'
    );
    expect(mockSubscriptionService.getPlanName).toHaveBeenCalledTimes(2);
    expect(mockSubscriptionNotificationService.sendSubscriptionUpgradeNotification).toHaveBeenCalledWith(
      'org-123',
      'Business Plan',
      'Pro Plan'
    );
  });
  
  it('should handle subscription_canceled event', async () => {
    const mockRequest = createMockRequest({
      type: 'subscription_canceled',
      data: {
        organization_id: 'org-123',
        subscription_id: 'sub-123'
      }
    });
    
    mockSubscriptionService.updateSubscription = jest.fn().mockResolvedValue({
      id: 'sub-123',
      status: 'canceled'
    });
    
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    expect(response.status).toBe(200);
    expect(responseData).toEqual({ success: true, event: 'subscription_canceled' });
    expect(mockSubscriptionService.updateSubscription).toHaveBeenCalledWith(
      'sub-123',
      'canceled'
    );
  });
  
  it('should handle trial_will_end event', async () => {
    const mockRequest = createMockRequest({
      type: 'trial_will_end',
      data: {
        organization_id: 'org-123',
        subscription_id: 'sub-123',
        trial_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
      }
    });
    
    mockSubscriptionService.getSubscriptionPlans = jest.fn().mockResolvedValue({
      id: 'sub-123',
      organization_id: 'org-123',
      status: 'trialing',
      subscription_plan: { name: 'Pro Plan' }
    });
    
    mockSubscriptionNotificationService.sendTrialExpirationNotifications = jest.fn().mockResolvedValue({
      notificationsSent: 1,
      subscriptionsProcessed: 1
    });
    
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    expect(response.status).toBe(200);
    expect(responseData).toEqual({ success: true, event: 'trial_will_end' });
    expect(mockSubscriptionNotificationService.sendTrialExpirationNotifications).toHaveBeenCalled();
  });
  
  it('should return 400 for unknown event types', async () => {
    const mockRequest = createMockRequest({
      type: 'unknown_event',
      data: {}
    });
    
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    expect(response.status).toBe(400);
    expect(responseData).toEqual({ error: 'Unsupported webhook event type: unknown_event' });
  });
  
  it('should handle errors gracefully', async () => {
    const mockRequest = createMockRequest({
      type: 'payment_succeeded',
      data: {
        organization_id: 'org-123',
        subscription_id: 'sub-123'
      }
    });
    
    mockSubscriptionService.updateSubscription = jest.fn().mockRejectedValue(
      new Error('Database error')
    );
    
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    expect(response.status).toBe(500);
    expect(responseData).toEqual({ 
      error: 'Error processing webhook: Database error',
      event: 'payment_succeeded'
    });
  });
  
  it('should reject requests with invalid signatures', async () => {
    const mockRequest = createMockRequest({
      type: 'payment_succeeded',
      data: { subscription_id: 'sub_123', organization_id: 'org_123' }
    });
    
    // Mock signature verification to fail
    (verifyWebhookSignature as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Invalid signature');
    });
    
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    expect(response.status).toBe(401);
    expect(responseData).toEqual({
      error: 'Invalid webhook signature: Invalid signature'
    });
  });
});
