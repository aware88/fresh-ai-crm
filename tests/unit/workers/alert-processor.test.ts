import { processAlerts } from '@/workers/alert-processor';
import { mockSupabaseClient } from '../../setupTests';
import { AlertNotificationService } from '@/lib/services/alert-notification-service';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}));
jest.mock('@/lib/services/alert-notification-service');

// Mock console methods
const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

// Mock the process.exit function
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
  throw new Error(`Process exited with code ${code}`);
});

describe('Alert Processor', () => {
  const testAlert = {
    id: 'test-alert-id',
    user_id: 'test-user-id',
    product_id: 'test-product-id',
    threshold_quantity: 10,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_triggered_at: null,
  };

  const testInventory = {
    product_id: 'test-product-id',
    quantity_available: 5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
    // Reset mock chain
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
  });

  describe('processAlerts', () => {
    it('should process all active alerts', async () => {
      // Setup
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: 'test-user-id', email: 'test@example.com' },
        error: null,
      });

      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [testAlert],
        error: null,
      });

      // Execute
      await processAlerts();

      // Verify
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('inventory_alerts');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should handle no active alerts', async () => {
      // Setup
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Execute
      await processAlerts();

      // Verify
      expect(consoleLogSpy).toHaveBeenCalledWith('No active alerts to process');
    });

    it.skip('should handle database errors', async () => {
      // Setup
      mockSupabaseClient.select.mockRejectedValueOnce(new Error('Database error'));

      // Execute and expect no throw
      await expect(processAlerts()).resolves.not.toThrow();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error processing alerts:', 
        expect.any(Error)
      );
    });

    it('should process alerts for all active alerts', async () => {
      // Setup
      const testAlerts = [testAlert];
      
      // Mock getAlerts to return test alerts
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: testAlerts,
        error: null,
      });
      
      // Mock inventory check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: testInventory,
        error: null,
      });
      
      // Mock AlertNotificationService
      jest.spyOn(AlertNotificationService, 'sendAlertNotification').mockResolvedValue(true);
      jest.spyOn(AlertNotificationService, 'sendSmsNotification').mockResolvedValue(true);
      
      // Execute
      await processAlerts();
      
      // Verify
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('inventory_alerts');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('is_active', true);
      
      // Verify notifications were sent for the alert
      expect(AlertNotificationService.sendAlertNotification).toHaveBeenCalled();
      expect(AlertNotificationService.sendSmsNotification).toHaveBeenCalled();
    });
    
    it('should handle errors when processing alerts', async () => {
      // Mock getAlerts to return test alerts
      mockSupabaseClient.select.mockResolvedValueOnce({
        data: [testAlert],
        error: null,
      });
      
      // Mock inventory check to fail
      const testError = new Error('Database error');
      mockSupabaseClient.single.mockRejectedValueOnce(testError);
      
      // Execute
      await processAlerts();
      
      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error processing alert'),
        expect.anything()
      );
    });
  });

  afterAll(() => {
    mockExit.mockRestore();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
