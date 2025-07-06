import { NextRequest } from 'next/server';
import { POST } from '../route';
import { NotificationService } from '@/lib/services/notification-service';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/services/notification-service');
jest.mock('next-auth');

describe('Mark Notification as Read API', () => {
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
  
  const createMockRequest = (notificationId: string): NextRequest => {
    return {
      json: jest.fn().mockResolvedValue({}),
      params: { id: notificationId }
    } as unknown as NextRequest;
  };
  
  describe('POST /api/notifications/[id]/read', () => {
    it('should mark a notification as read', async () => {
      const mockNotification = { 
        id: 'notification-123', 
        title: 'Test', 
        read: true 
      };
      
      mockNotificationService.markNotificationAsRead = jest.fn().mockResolvedValue(mockNotification);
      
      const mockRequest = createMockRequest('notification-123');
      const response = await POST(mockRequest, { params: { id: 'notification-123' } });
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData).toEqual({ success: true, notification: mockNotification });
      expect(mockNotificationService.markNotificationAsRead).toHaveBeenCalledWith(
        'notification-123',
        'user-123'
      );
    });
    
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const mockRequest = createMockRequest('notification-123');
      const response = await POST(mockRequest, { params: { id: 'notification-123' } });
      const responseData = await response.json();
      
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ error: 'Unauthorized' });
    });
    
    it('should return 404 if notification not found', async () => {
      mockNotificationService.markNotificationAsRead = jest.fn().mockRejectedValue(
        new Error('Notification not found')
      );
      
      const mockRequest = createMockRequest('notification-999');
      const response = await POST(mockRequest, { params: { id: 'notification-999' } });
      const responseData = await response.json();
      
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Notification not found' });
    });
    
    it('should handle service errors gracefully', async () => {
      mockNotificationService.markNotificationAsRead = jest.fn().mockRejectedValue(
        new Error('Database error')
      );
      
      const mockRequest = createMockRequest('notification-123');
      const response = await POST(mockRequest, { params: { id: 'notification-123' } });
      const responseData = await response.json();
      
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to mark notification as read: Database error' });
    });
  });
});
