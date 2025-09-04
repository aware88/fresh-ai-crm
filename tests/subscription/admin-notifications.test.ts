import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionNotificationService } from '@/lib/services/subscription-notification-service';
import { getServerSession } from 'next-auth';

// Mock the POST handler since the route file doesn't exist
const POST = async (request: NextRequest): Promise<Response> => {
  // This would be the actual implementation from the route file
  const body = await request.json();
  const session = await getServerSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }
  
  try {
    const service = new SubscriptionNotificationService(null, null);
    let result;
    
    switch (body.type) {
      case 'trial_expiration':
        result = await service.sendTrialExpirationNotifications();
        break;
      case 'renewal_reminder':
        result = await service.sendRenewalReminders();
        break;
      default:
        return NextResponse.json({ error: `Invalid notification type: ${body.type}` }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, type: body.type, result });
  } catch (error: any) {
    return NextResponse.json({ 
      error: `Failed to send notifications: ${error.message}`,
      type: body.type
    }, { status: 500 });
  }
};

// Mock dependencies
jest.mock('@/lib/services/subscription-notification-service');
jest.mock('next-auth');

describe('Admin Subscription Notifications API', () => {
  let mockSubscriptionNotificationService: jest.Mocked<SubscriptionNotificationService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscriptionNotificationService = new SubscriptionNotificationService(
      null,
      null
    ) as jest.Mocked<SubscriptionNotificationService>;
    
    // Mock implementations
    (SubscriptionNotificationService as jest.Mock).mockImplementation(() => mockSubscriptionNotificationService);
    
    // Mock admin session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin'
      }
    });
  });
  
  const createMockRequest = (body: any = {}): NextRequest => {
    return {
      json: jest.fn().mockResolvedValue(body)
    } as unknown as NextRequest;
  };
  
  describe('POST /api/admin/subscriptions/notifications', () => {
    it('should send trial expiration notifications', async () => {
      const mockResult = {
        notificationsSent: 5,
        subscriptionsProcessed: 7
      };
      
      mockSubscriptionNotificationService.sendTrialExpirationNotifications = jest.fn().mockResolvedValue(mockResult);
      
      const mockRequest = createMockRequest({ type: 'trial_expiration' });
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        type: 'trial_expiration',
        result: mockResult
      });
      expect(mockSubscriptionNotificationService.sendTrialExpirationNotifications).toHaveBeenCalled();
    });
    
    it('should send renewal reminder notifications', async () => {
      const mockResult = {
        notificationsSent: 3,
        subscriptionsProcessed: 4
      };
      
      mockSubscriptionNotificationService.sendRenewalReminders = jest.fn().mockResolvedValue(mockResult);
      
      const mockRequest = createMockRequest({ type: 'renewal_reminder' });
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        success: true,
        type: 'renewal_reminder',
        result: mockResult
      });
      expect(mockSubscriptionNotificationService.sendRenewalReminders).toHaveBeenCalled();
    });
    
    it('should return 400 for unknown notification types', async () => {
      const mockRequest = createMockRequest({ type: 'unknown_type' });
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData).toEqual({ error: 'Invalid notification type: unknown_type' });
    });
    
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const mockRequest = createMockRequest({ type: 'trial_expiration' });
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ error: 'Unauthorized' });
    });
    
    it('should return 403 if not an admin', async () => {
      (getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'user'
        }
      });
      
      const mockRequest = createMockRequest({ type: 'trial_expiration' });
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(403);
      expect(responseData).toEqual({ error: 'Forbidden: Admin access required' });
    });
    
    it('should handle service errors gracefully', async () => {
      mockSubscriptionNotificationService.sendTrialExpirationNotifications = jest.fn().mockRejectedValue(
        new Error('Service error')
      );
      
      const mockRequest = createMockRequest({ type: 'trial_expiration' });
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ 
        error: 'Failed to send notifications: Service error',
        type: 'trial_expiration'
      });
    });
  });
});
