import { NextRequest } from 'next/server';
import { POST } from '../route';
import { NotificationService } from '@/lib/services/notification-service';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/services/notification-service');
jest.mock('next-auth');

describe('Mark All Notifications as Read API', () => {
  let mockNotificationService: jest.Mocked<NotificationService>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;
    
    // Mock implementations
    (NotificationService as jest.Mock).mockImplementation(() => mockNotificationService);
    
    // Mock session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    });
  });
  
  const createMockRequest = (): NextRequest => {
    return {
      json: jest.fn().mockResolvedValue({})
    } as unknown as NextRequest;
  };
  
  describe('POST /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      const mockResult = { count: 5 };
      
      mockNotificationService.markAllNotificationsAsRead = jest.fn().mockResolvedValue(mockResult);
      
      const mockRequest = createMockRequest();
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData).toEqual({ success: true, count: 5 });
      expect(mockNotificationService.markAllNotificationsAsRead).toHaveBeenCalledWith('user-123');
    });
    
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const mockRequest = createMockRequest();
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ error: 'Unauthorized' });
    });
    
    it('should handle service errors gracefully', async () => {
      mockNotificationService.markAllNotificationsAsRead = jest.fn().mockRejectedValue(
        new Error('Database error')
      );
      
      const mockRequest = createMockRequest();
      const response = await POST(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to mark all notifications as read: Database error' });
    });
  });
});
