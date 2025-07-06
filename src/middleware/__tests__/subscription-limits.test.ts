import { enforceContactLimit, enforceUserLimit } from '../subscription-limits';
import { SubscriptionService } from '@/lib/services/subscription-service';

// Mock the SubscriptionService
jest.mock('@/lib/services/subscription-service', () => {
  return {
    SubscriptionService: jest.fn().mockImplementation(() => ({
      getOrganizationFeatureAccess: jest.fn()
    }))
  };
});

describe('Subscription Limits Middleware', () => {
  let mockSubscriptionService: jest.Mocked<SubscriptionService>;
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Setup mocks
    mockSubscriptionService = new SubscriptionService() as jest.Mocked<SubscriptionService>;
    mockRequest = {
      body: {},
      query: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('enforceContactLimit', () => {
    it('should allow contact creation when within limits', async () => {
      // Setup
      const orgId = 'org123';
      mockRequest.body.organization_id = orgId;
      
      // Mock contact count
      mockRequest.query.currentContactCount = '50';
      
      // Mock subscription service response
      const mockFeatureAccess = {
        data: {
          plan: { name: 'Pro', features: { max_contacts: 1000 } },
          features: { max_contacts: { enabled: true, limit: 1000 } },
          isActive: true
        },
        error: null
      };
      mockSubscriptionService.getOrganizationFeatureAccess.mockResolvedValue(mockFeatureAccess);
      
      // Execute
      await enforceContactLimit(mockSubscriptionService)(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block contact creation when limit is reached', async () => {
      // Setup
      const orgId = 'org123';
      mockRequest.body.organization_id = orgId;
      
      // Mock contact count at limit
      mockRequest.query.currentContactCount = '100';
      
      // Mock subscription service response
      const mockFeatureAccess = {
        data: {
          plan: { name: 'Free', features: { max_contacts: 100 } },
          features: { max_contacts: { enabled: true, limit: 100 } },
          isActive: true
        },
        error: null
      };
      mockSubscriptionService.getOrganizationFeatureAccess.mockResolvedValue(mockFeatureAccess);
      
      // Execute
      await enforceContactLimit(mockSubscriptionService)(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Contact limit reached',
        message: 'Your current plan allows for a maximum of 100 contacts. Please upgrade your plan to add more contacts.'
      });
    });

    it('should handle missing organization ID', async () => {
      // Setup - no organization_id in request
      
      // Execute
      await enforceContactLimit(mockSubscriptionService)(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing organization ID',
        message: 'Organization ID is required to enforce contact limits.'
      });
    });

    it('should handle service errors', async () => {
      // Setup
      const orgId = 'org123';
      mockRequest.body.organization_id = orgId;
      
      // Mock error response
      mockSubscriptionService.getOrganizationFeatureAccess.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      
      // Execute
      await enforceContactLimit(mockSubscriptionService)(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Service error',
        message: 'Could not verify subscription limits. Please try again later.'
      });
    });
  });

  describe('enforceUserLimit', () => {
    it('should allow user creation when within limits', async () => {
      // Setup
      const orgId = 'org123';
      mockRequest.body.organization_id = orgId;
      
      // Mock user count
      mockRequest.query.currentUserCount = '5';
      
      // Mock subscription service response
      const mockFeatureAccess = {
        data: {
          plan: { name: 'Pro', features: { max_users: 10 } },
          features: { max_users: { enabled: true, limit: 10 } },
          isActive: true
        },
        error: null
      };
      mockSubscriptionService.getOrganizationFeatureAccess.mockResolvedValue(mockFeatureAccess);
      
      // Execute
      await enforceUserLimit(mockSubscriptionService)(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block user creation when limit is reached', async () => {
      // Setup
      const orgId = 'org123';
      mockRequest.body.organization_id = orgId;
      
      // Mock user count at limit
      mockRequest.query.currentUserCount = '2';
      
      // Mock subscription service response
      const mockFeatureAccess = {
        data: {
          plan: { name: 'Free', features: { max_users: 2 } },
          features: { max_users: { enabled: true, limit: 2 } },
          isActive: true
        },
        error: null
      };
      mockSubscriptionService.getOrganizationFeatureAccess.mockResolvedValue(mockFeatureAccess);
      
      // Execute
      await enforceUserLimit(mockSubscriptionService)(mockRequest, mockResponse, mockNext);
      
      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User limit reached',
        message: 'Your current plan allows for a maximum of 2 users. Please upgrade your plan to add more users.'
      });
    });
  });
});
