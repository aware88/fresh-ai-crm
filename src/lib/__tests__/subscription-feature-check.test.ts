import {
  canAccessFeature,
  isWithinNumericLimit,
  canAddContact,
  canAddUser,
  calculateAdditionalUserPrice
} from '../subscription-feature-check';

// Mock the subscription data
const mockSubscriptionData = {
  plan: {
    id: 'pro',
    name: 'Pro',
    price: 49,
    features: {
      max_contacts: 1000,
      max_users: 10,
      api_access: true,
      custom_branding: true,
      advanced_analytics: true,
      additional_user_price: 5
    }
  },
  subscription: {
    id: 'sub1',
    organization_id: 'org123',
    subscription_plan_id: 'pro',
    status: 'active',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  features: {
    max_contacts: { enabled: true, limit: 1000 },
    max_users: { enabled: true, limit: 10 },
    api_access: { enabled: true },
    custom_branding: { enabled: true },
    advanced_analytics: { enabled: true },
    additional_user_price: { enabled: true, limit: 5 }
  },
  isActive: true
};

// Mock the free plan data
const mockFreePlanData = {
  plan: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: {
      max_contacts: 100,
      max_users: 2,
      api_access: false,
      custom_branding: false,
      advanced_analytics: false
    }
  },
  subscription: null,
  features: {
    max_contacts: { enabled: true, limit: 100 },
    max_users: { enabled: true, limit: 2 },
    api_access: { enabled: false },
    custom_branding: { enabled: false },
    advanced_analytics: { enabled: false }
  },
  isActive: true
};

describe('Subscription Feature Check', () => {
  describe('canAccessFeature', () => {
    it('should return true for enabled features', () => {
      expect(canAccessFeature(mockSubscriptionData, 'api_access')).toBe(true);
      expect(canAccessFeature(mockSubscriptionData, 'custom_branding')).toBe(true);
    });

    it('should return false for disabled features', () => {
      expect(canAccessFeature(mockFreePlanData, 'api_access')).toBe(false);
      expect(canAccessFeature(mockFreePlanData, 'custom_branding')).toBe(false);
    });

    it('should return false for non-existent features', () => {
      expect(canAccessFeature(mockSubscriptionData, 'nonexistent_feature')).toBe(false);
    });

    it('should return false when subscription data is null', () => {
      expect(canAccessFeature(null, 'api_access')).toBe(false);
    });
  });

  describe('isWithinNumericLimit', () => {
    it('should return true when count is within limit', () => {
      expect(isWithinNumericLimit(mockSubscriptionData, 'max_contacts', 500)).toBe(true);
      expect(isWithinNumericLimit(mockSubscriptionData, 'max_users', 5)).toBe(true);
    });

    it('should return false when count exceeds limit', () => {
      expect(isWithinNumericLimit(mockSubscriptionData, 'max_contacts', 1500)).toBe(false);
      expect(isWithinNumericLimit(mockSubscriptionData, 'max_users', 15)).toBe(false);
    });

    it('should return false for non-numeric features', () => {
      expect(isWithinNumericLimit(mockSubscriptionData, 'api_access', 1)).toBe(false);
    });

    it('should return false when subscription data is null', () => {
      expect(isWithinNumericLimit(null, 'max_contacts', 50)).toBe(false);
    });
  });

  describe('canAddContact', () => {
    it('should return true when current contacts count is below limit', () => {
      expect(canAddContact(mockSubscriptionData, 500)).toBe(true);
      expect(canAddContact(mockFreePlanData, 50)).toBe(true);
    });

    it('should return false when current contacts count is at or above limit', () => {
      expect(canAddContact(mockSubscriptionData, 1000)).toBe(false);
      expect(canAddContact(mockSubscriptionData, 1500)).toBe(false);
      expect(canAddContact(mockFreePlanData, 100)).toBe(false);
      expect(canAddContact(mockFreePlanData, 150)).toBe(false);
    });

    it('should return false when subscription data is null', () => {
      expect(canAddContact(null, 50)).toBe(false);
    });
  });

  describe('canAddUser', () => {
    it('should return true when current users count is below limit', () => {
      expect(canAddUser(mockSubscriptionData, 5)).toBe(true);
      expect(canAddUser(mockFreePlanData, 1)).toBe(true);
    });

    it('should return false when current users count is at or above limit', () => {
      expect(canAddUser(mockSubscriptionData, 10)).toBe(false);
      expect(canAddUser(mockSubscriptionData, 15)).toBe(false);
      expect(canAddUser(mockFreePlanData, 2)).toBe(false);
      expect(canAddUser(mockFreePlanData, 3)).toBe(false);
    });

    it('should return false when subscription data is null', () => {
      expect(canAddUser(null, 1)).toBe(false);
    });
  });

  describe('calculateAdditionalUserPrice', () => {
    it('should calculate the correct price for additional users', () => {
      expect(calculateAdditionalUserPrice(mockSubscriptionData, 15)).toBe(25); // 5 additional users * $5
      expect(calculateAdditionalUserPrice(mockSubscriptionData, 20)).toBe(50); // 10 additional users * $5
    });

    it('should return 0 when users count is within limit', () => {
      expect(calculateAdditionalUserPrice(mockSubscriptionData, 10)).toBe(0);
      expect(calculateAdditionalUserPrice(mockSubscriptionData, 5)).toBe(0);
    });

    it('should return 0 when subscription data is null', () => {
      expect(calculateAdditionalUserPrice(null, 15)).toBe(0);
    });

    it('should return 0 when additional_user_price is not defined', () => {
      const dataWithoutAdditionalPrice = {
        ...mockSubscriptionData,
        features: {
          ...mockSubscriptionData.features,
          additional_user_price: undefined
        }
      };
      expect(calculateAdditionalUserPrice(dataWithoutAdditionalPrice, 15)).toBe(0);
    });
  });
});
