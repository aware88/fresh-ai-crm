import { NotificationService, Notification } from '@/lib/services/notification-service';
import { createClient } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => {
  // Create mock functions
  const mockFrom = jest.fn();
  const mockInsert = jest.fn();
  const mockSelect = jest.fn();
  const mockUpdate = jest.fn();
  const mockEq = jest.fn();
  const mockOrder = jest.fn();
  const mockLimit = jest.fn();
  const mockRpc = jest.fn();
  
  // Set up the chain
  mockFrom.mockReturnValue({
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate
  });
  
  mockSelect.mockReturnValue({
    eq: mockEq
  });
  
  mockEq.mockReturnValue({
    order: mockOrder
  });
  
  mockOrder.mockReturnValue({
    limit: mockLimit
  });
  
  mockUpdate.mockReturnValue({
    eq: mockEq
  });
  
  // Create the mock client
  const mockClient = {
    from: mockFrom,
    rpc: mockRpc
  };
  
  return {
    createClient: jest.fn().mockReturnValue(mockClient)
  };
});

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockSupabase: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createClient('https://example.com', 'fake-key');
    notificationService = new NotificationService();
  });
  
  describe('createNotification', () => {
    it('should create a notification for a user', async () => {
      const mockNotification = {
        user_id: 'user-123',
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'info',
      };
      
      const mockResponse = {
        data: { id: 'notification-123', ...mockNotification },
        error: null,
      };
      
      mockSupabase.from().insert.mockReturnValueOnce(mockResponse);
      
      const result = await notificationService.createNotification(mockNotification);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        user_id: mockNotification.user_id,
        title: mockNotification.title,
        message: mockNotification.message,
        type: mockNotification.type,
      });
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should handle errors when creating a notification', async () => {
      const mockError = new Error('Database error');
      mockSupabase.from().insert.mockReturnValueOnce({ data: null, error: mockError });
      
      await expect(
        notificationService.createNotification({
          user_id: 'user-123',
          organization_id: 'org-123',
          title: 'Test',
          message: 'Message',
          type: 'info',
          read: false
        })
      ).rejects.toThrow('Failed to create notification: Database error');
    });
  });
  
  describe('createOrganizationNotification', () => {
    it('should create notifications for all users in an organization', async () => {
      const mockUsers = [
        { id: 'user-1' },
        { id: 'user-2' },
      ];
      
      const mockRpcResponse = {
        data: mockUsers,
        error: null,
      };
      
      const mockInsertResponse = {
        data: [{ id: 'notification-1' }, { id: 'notification-2' }],
        error: null,
      };
      
      mockSupabase.rpc.mockReturnValueOnce(mockRpcResponse);
      mockSupabase.from().insert.mockReturnValueOnce(mockInsertResponse);
      
      const result = await notificationService.createOrganizationNotification(
        'org-123',
        {
          title: 'Org Notification',
          message: 'This is an organization notification',
          type: 'info'
        }
      );
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_organization_users', {
        p_organization_id: 'org-123',
      });
      
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith([
        {
          user_id: 'user-1',
          organization_id: 'org-123',
          title: 'Org Notification',
          message: 'This is an organization notification',
          type: 'info',
        },
        {
          user_id: 'user-2',
          organization_id: 'org-123',
          title: 'Org Notification',
          message: 'This is an organization notification',
          type: 'info',
        },
      ]);
      
      expect(result).toEqual(mockInsertResponse.data);
    });
    
    it('should handle errors when fetching organization users', async () => {
      const mockError = new Error('Database error');
      mockSupabase.rpc.mockReturnValueOnce({ data: null, error: mockError });
      
      await expect(
        notificationService.createOrganizationNotification('org-123', {
          title: 'Test',
          message: 'Message',
          type: 'info'
        })
      ).rejects.toThrow('Failed to get organization users: Database error');
    });
  });
  
  describe('getUserNotifications', () => {
    it('should fetch notifications for a user', async () => {
      const mockNotifications = [
        { id: 'notification-1', title: 'Test 1', read: false },
        { id: 'notification-2', title: 'Test 2', read: true },
      ];
      
      mockSupabase.from().select.mockReturnThis();
      mockSupabase.from().select().eq.mockReturnThis();
      mockSupabase.from().select().eq().order.mockReturnThis();
      mockSupabase.from().select().eq().order().limit.mockReturnValueOnce({
        data: mockNotifications,
        error: null,
      });
      
      const result = await notificationService.getUserNotifications('user-123', 10);
      
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.from().select).toHaveBeenCalled();
      expect(mockSupabase.from().select().eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSupabase.from().select().eq().order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockSupabase.from().select().eq().order().limit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockNotifications);
    });
    
    it('should handle errors when fetching notifications', async () => {
      const mockError = new Error('Database error');
      
      mockSupabase.from().select.mockReturnThis();
      mockSupabase.from().select().eq.mockReturnThis();
      mockSupabase.from().select().eq().order.mockReturnThis();
      mockSupabase.from().select().eq().order().limit.mockReturnValueOnce({
        data: null,
        error: mockError,
      });
      
      await expect(
        notificationService.getUserNotifications('user-123', 10)
      ).rejects.toThrow('Failed to fetch user notifications: Database error');
    });
  });
  
  describe('markNotificationAsRead', () => {
    it('should mark a notification as read', async () => {
      const mockResponse = {
        data: { id: 'notification-123', read: true },
        error: null,
      };
      
      mockSupabase.from().update.mockReturnThis();
      mockSupabase.from().update().eq.mockReturnValueOnce(mockResponse);
      
      const result = await notificationService.markNotificationAsRead('notification-123');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ read: true });
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', 'notification-123');
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should handle errors when marking notification as read', async () => {
      const mockError = new Error('Database error');
      
      mockSupabase.from().update.mockReturnThis();
      mockSupabase.from().update().eq.mockReturnValueOnce({
        data: null,
        error: mockError,
      });
      
      await expect(
        notificationService.markNotificationAsRead('notification-123')
      ).rejects.toThrow('Failed to mark notification as read: Database error');
    });
  });
  
  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      const mockResponse = {
        data: { count: 5 },
        error: null,
      };
      
      mockSupabase.from().update.mockReturnThis();
      mockSupabase.from().update().eq.mockReturnValueOnce(mockResponse);
      
      const result = await notificationService.markAllNotificationsAsRead('user-123');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ read: true });
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toEqual(mockResponse.data);
    });
    
    it('should handle errors when marking all notifications as read', async () => {
      const mockError = new Error('Database error');
      
      mockSupabase.from().update.mockReturnThis();
      mockSupabase.from().update().eq.mockReturnValueOnce({
        data: null,
        error: mockError,
      });
      
      await expect(
        notificationService.markAllNotificationsAsRead('user-123')
      ).rejects.toThrow('Failed to mark all notifications as read: Database error');
    });
  });
});
