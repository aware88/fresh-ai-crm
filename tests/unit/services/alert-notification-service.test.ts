import { AlertNotificationService } from '@/lib/services/alert-notification-service';
import { createServerClient } from '@/lib/supabase/server';

// Mock the Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ 
      data: { email_notifications: true }, 
      error: null 
    }),
  }),
}));

// Mock the global fetch
(global as any).fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ id: 'test-email-id' }),
  })
);

describe('AlertNotificationService', () => {
  const testUserId = 'test-user-id';
  const testAlert = {
    id: 'test-alert-id',
    product_id: 'test-product-id',
    user_id: testUserId,
    threshold_quantity: 10,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_triggered_at: null,
    product_name: 'Test Product',
    product_sku: 'TEST-123',
    current_quantity: 5,
    is_triggered: true,
  };

  const testNotification = {
    alert: testAlert,
    currentQuantity: 5,
    timestamp: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendAlertNotification', () => {
    it('should send an email notification when enabled', async () => {
      // Mock user preferences
      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: { email_notifications: true },
        error: null,
      });
      
      // Mock the chain of method calls
      (createServerClient as jest.Mock)().from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: mockSingle,
        }),
      });

      // Execute
      const result = await AlertNotificationService.sendAlertNotification(testUserId, testNotification);

      // Verify
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should not send email when notifications are disabled', async () => {
      // Mock user preferences with notifications disabled
      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: { email_notifications: false },
        error: null,
      });
      
      // Mock the chain of method calls
      (createServerClient as jest.Mock)().from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: mockSingle,
        }),
      });

      // Execute
      const result = await AlertNotificationService.sendAlertNotification(testUserId, testNotification);

      // Verify
      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Mock user preferences with an error
      const mockFrom = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });
      
      // Mock the chain of method calls
      (createServerClient as jest.Mock)().from.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          single: mockSingle,
        }),
      });

      // Execute
      const result = await AlertNotificationService.sendAlertNotification(testUserId, testNotification);

      // Verify
      expect(result).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('prepareAlertEmail', () => {
    it('should generate correct email content', () => {
      // Execute
      const email = AlertNotificationService['prepareAlertEmail'](testNotification);

      // Verify
      expect(email.subject).toContain('Inventory Alert');
      expect(email.body).toContain(testAlert.product_name);
      expect(email.body).toContain(testAlert.product_sku);
      expect(email.body).toContain(testNotification.currentQuantity.toString());
      expect(email.body).toContain(testAlert.threshold_quantity.toString());
    });
  });

  describe('sendEmail', () => {
    it('should send an email via the email service', async () => {
      // Setup
      const testEmail = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test Email</p>',
      };

      // Execute
      const result = await AlertNotificationService['sendEmail'](testEmail);

      // Verify
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.resend.com/emails',
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: JSON.stringify({
            from: 'inventory@yourdomain.com',
            to: [testEmail.to],
            subject: testEmail.subject,
            html: testEmail.html,
          }),
        })
      );
    });

    it('should handle email sending errors', async () => {
      // Setup
      const testEmail = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test Email</p>',
      };

      // Mock a failed fetch
      (global as any).fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: 'Invalid request' }),
        })
      );

      // Execute
      const result = await AlertNotificationService['sendEmail'](testEmail);

      // Verify
      expect(result).toBe(false);
    });
  });
});
