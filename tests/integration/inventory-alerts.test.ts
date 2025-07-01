import { createServerClient } from '@/lib/supabase/server';
import { InventoryAlertService } from '@/lib/services/inventory-alert-service';
import { Database } from '@/types/supabase';

describe('Inventory Alerts', () => {
  let supabase: ReturnType<typeof createServerClient>;
  let testUserId: string;
  let testProductId: string;
  let testAlertId: string;

  beforeAll(async () => {
    // Initialize test data
    supabase = createServerClient();
    
    // Create a test user
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
    });
    
    if (userError) throw userError;
    testUserId = userData.user?.id || '';
    
    // Create a test product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert([{ 
        name: 'Test Product', 
        sku: `TEST-${Date.now()}`,
        price: 9.99,
        user_id: testUserId
      }])
      .select()
      .single();
      
    if (productError) throw productError;
    testProductId = productData.id;
  });

  afterAll(async () => {
    // Clean up test data
    await supabase.from('inventory_alert_history').delete().eq('alert_id', testAlertId);
    await supabase.from('inventory_alerts').delete().eq('id', testAlertId);
    await supabase.from('products').delete().eq('id', testProductId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  test('should create an inventory alert', async () => {
    const alertData = {
      product_id: testProductId,
      threshold_quantity: 10,
      is_active: true
    };

    const alert = await InventoryAlertService.createAlert(testUserId, alertData);
    testAlertId = alert.id;
    
    expect(alert).toMatchObject({
      product_id: testProductId,
      threshold_quantity: '10',
      is_active: true,
      user_id: testUserId
    });
  });

  test('should get an inventory alert by ID', async () => {
    const alert = await InventoryAlertService.getAlertById(testUserId, testAlertId);
    expect(alert).not.toBeNull();
    expect(alert?.id).toBe(testAlertId);
  });

  test('should update an inventory alert', async () => {
    const updatedAlert = await InventoryAlertService.updateAlert(
      testUserId,
      testAlertId,
      { threshold_quantity: 5 }
    );
    
    expect(updatedAlert.threshold_quantity).toBe('5');
  });

  test('should check for triggered alerts', async () => {
    // First, ensure we have inventory data
    await supabase
      .from('product_inventory')
      .upsert([{
        product_id: testProductId,
        quantity_available: 3, // Below our threshold of 5
        user_id: testUserId
      }]);

    const triggeredAlerts = await InventoryAlertService.checkAlerts(testUserId);
    
    // Should find our test alert since quantity (3) < threshold (5)
    const testAlert = triggeredAlerts.find(a => a.alert_id === testAlertId);
    expect(testAlert).toBeDefined();
    expect(testAlert?.is_triggered).toBe(true);
    expect(Number(testAlert?.current_quantity)).toBeLessThanOrEqual(Number(testAlert?.threshold_quantity));
  });

  test('should get alert statistics', async () => {
    const stats = await InventoryAlertService.getAlertStats(testUserId);
    
    expect(stats).toMatchObject({
      total_alerts: expect.any(Number),
      active_alerts: expect.any(Number),
      triggered_alerts: expect.any(Number),
      recent_alerts: expect.any(Array)
    });
    
    // Should have at least our test alert
    expect(stats.total_alerts).toBeGreaterThanOrEqual(1);
  });

  test('should delete an inventory alert', async () => {
    await InventoryAlertService.deleteAlert(testUserId, testAlertId);
    
    // Verify it's deleted
    const { data: alert } = await supabase
      .from('inventory_alerts')
      .select()
      .eq('id', testAlertId)
      .single();
      
    expect(alert).toBeNull();
  });
});
