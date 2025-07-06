import { SubscriptionService } from '../subscription-service';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn()
}));

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let mockSupabase: any;

  beforeEach(() => {
    // Create mock Supabase client with required methods
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      data: null,
      error: null
    };

    // Mock the createClient to return our mockSupabase
    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    // Create a new instance of SubscriptionService for each test
    subscriptionService = new SubscriptionService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscriptionPlans', () => {
    it('should return subscription plans', async () => {
      // Mock data to be returned
      const mockPlans = [
        { id: 'plan1', name: 'Free', price: 0 },
        { id: 'plan2', name: 'Starter', price: 19 },
        { id: 'plan3', name: 'Pro', price: 49 }
      ];

      // Setup the mock to return our data
      mockSupabase.data = mockPlans;
      mockSupabase.select.mockImplementation(() => mockSupabase);
      mockSupabase.order.mockResolvedValue({ data: mockPlans, error: null });

      // Call the method
      const result = await subscriptionService.getSubscriptionPlans();

      // Assertions
      expect(mockSupabase.from).toHaveBeenCalledWith('subscription_plans');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.order).toHaveBeenCalledWith('price', { ascending: true });
      expect(result).toEqual({ data: mockPlans, error: null });
    });

    it('should handle errors', async () => {
      // Mock an error
      const mockError = { message: 'Database error' };
      mockSupabase.order.mockResolvedValue({ data: null, error: mockError });

      // Call the method
      const result = await subscriptionService.getSubscriptionPlans();

      // Assertions
      expect(result).toEqual({ data: null, error: mockError });
    });
  });

  describe('getOrganizationSubscription', () => {
    it('should return organization subscription', async () => {
      // Mock data
      const orgId = 'org123';
      const mockSubscription = {
        id: 'sub1',
        organization_id: orgId,
        subscription_plan_id: 'plan1',
        status: 'active'
      };

      // Setup mock
      mockSupabase.single.mockResolvedValue({ data: mockSubscription, error: null });

      // Call the method
      const result = await subscriptionService.getOrganizationSubscription(orgId);

      // Assertions
      expect(mockSupabase.from).toHaveBeenCalledWith('organization_subscriptions');
      expect(mockSupabase.select).toHaveBeenCalledWith('*, subscription_plans(*)');
      expect(mockSupabase.eq).toHaveBeenCalledWith('organization_id', orgId);
      expect(mockSupabase.single).toHaveBeenCalled();
      expect(result).toEqual({ data: mockSubscription, error: null });
    });

    it('should handle not found case', async () => {
      // Mock not found error
      const orgId = 'nonexistent';
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } });

      // Call the method
      const result = await subscriptionService.getOrganizationSubscription(orgId);

      // Assertions
      expect(result).toEqual({ data: null, error: { code: 'PGRST116', message: 'Not found' } });
    });
  });

  describe('getOrganizationFeatureAccess', () => {
    it('should return feature access for an organization with active subscription', async () => {
      // Mock data
      const orgId = 'org123';
      const mockPlan = {
        id: 'plan1',
        name: 'Pro',
        price: 49,
        features: {
          max_contacts: 1000,
          max_users: 10,
          api_access: true,
          custom_branding: true
        }
      };
      const mockSubscription = {
        id: 'sub1',
        organization_id: orgId,
        subscription_plan_id: 'plan1',
        status: 'active',
        subscription_plans: mockPlan
      };

      // Setup mocks
      mockSupabase.single.mockResolvedValue({ data: mockSubscription, error: null });

      // Call the method
      const result = await subscriptionService.getOrganizationFeatureAccess(orgId);

      // Assertions
      expect(result.data).toEqual({
        plan: mockPlan,
        subscription: mockSubscription,
        features: {
          max_contacts: { enabled: true, limit: 1000 },
          max_users: { enabled: true, limit: 10 },
          api_access: { enabled: true },
          custom_branding: { enabled: true }
        },
        isActive: true
      });
    });

    it('should handle organization without subscription', async () => {
      // Mock not found error
      const orgId = 'nonexistent';
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } });

      // Mock free plan
      const mockFreePlan = {
        id: 'free',
        name: 'Free',
        price: 0,
        features: {
          max_contacts: 100,
          max_users: 2,
          api_access: false,
          custom_branding: false
        }
      };

      // Setup another mock for getDefaultPlan
      const mockSupabaseForDefaultPlan = {
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({ data: mockFreePlan, error: null })
      };
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'subscription_plans') {
          return mockSupabaseForDefaultPlan;
        }
        return mockSupabase;
      });

      // Call the method
      const result = await subscriptionService.getOrganizationFeatureAccess(orgId);

      // Assertions for default free plan
      expect(result.data.plan).toEqual(mockFreePlan);
      expect(result.data.subscription).toBeNull();
      expect(result.data.features).toEqual({
        max_contacts: { enabled: true, limit: 100 },
        max_users: { enabled: true, limit: 2 },
        api_access: { enabled: false },
        custom_branding: { enabled: false }
      });
      expect(result.data.isActive).toBe(true); // Free plan is always active
    });
  });
});
