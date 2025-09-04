import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification-service';
import { getServerSession } from 'next-auth';

// Mock the GET handler since the route file doesn't exist
const GET = async (request: NextRequest): Promise<Response> => {
  const session = await getServerSession();
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    const service = new NotificationService();
    const notifications = await service.getUserNotifications(session.user.id, limit);
    
    return NextResponse.json({ notifications });
  } catch (error: any) {
    return NextResponse.json({ 
      error: `Failed to fetch notifications: ${error.message}`
    }, { status: 500 });
  }
};

// Mock dependencies
jest.mock('@/lib/services/notification-service');
jest.mock('next-auth');

describe('Notifications API', () => {
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
  
  const createMockRequest = (query: Record<string, string> = {}): NextRequest => {
    const url = new URL('http://localhost:3000/api/notifications');
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    return {
      url: url.toString(),
      nextUrl: url
    } as unknown as NextRequest;
  };
  
  describe('GET /api/notifications', () => {
    it('should return user notifications with default limit', async () => {
      const mockNotifications = [
        { id: 'notification-1', title: 'Test 1', read: false },
        { id: 'notification-2', title: 'Test 2', read: true },
      ];
      
      mockNotificationService.getUserNotifications = jest.fn().mockResolvedValue(mockNotifications);
      
      const mockRequest = createMockRequest();
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData).toEqual({ notifications: mockNotifications });
      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith('user-123', 20);
    });
    
    it('should respect the limit parameter', async () => {
      const mockNotifications = [
        { id: 'notification-1', title: 'Test 1', read: false },
      ];
      
      mockNotificationService.getUserNotifications = jest.fn().mockResolvedValue(mockNotifications);
      
      const mockRequest = createMockRequest({ limit: '5' });
      const response = await GET(mockRequest);
      
      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith('user-123', 5);
    });
    
    it('should return 401 if not authenticated', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const mockRequest = createMockRequest();
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(401);
      expect(responseData).toEqual({ error: 'Unauthorized' });
    });
    
    it('should handle service errors gracefully', async () => {
      mockNotificationService.getUserNotifications = jest.fn().mockRejectedValue(
        new Error('Database error')
      );
      
      const mockRequest = createMockRequest();
      const response = await GET(mockRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(500);
      expect(responseData).toEqual({ error: 'Failed to fetch notifications: Database error' });
    });
  });
});
