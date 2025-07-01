import { createServerClient } from '@/lib/supabase/server';
import { InventoryAlertService } from '@/lib/services/inventory-alert-service';
import { AlertNotificationService } from '@/lib/services/alert-notification-service';

/**
 * Background worker that processes inventory alerts and sends notifications
 * This should be run on a schedule (e.g., every 15 minutes)
 */
async function processAlerts() {
  console.log('Starting alert processing...');
  const supabase = createServerClient();
  
  try {
    // Get all active inventory alerts across all users
    const { data: activeAlerts, error } = await supabase
      .from('inventory_alerts')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      throw error;
    }
    
    if (!activeAlerts || activeAlerts.length === 0) {
      console.log('No active alerts to process');
      return;
    }
    
    console.log(`Processing ${activeAlerts.length} active alerts`);
    
    // Process alerts in batches to avoid overwhelming the system
    const BATCH_SIZE = 10;
    for (let i = 0; i < activeAlerts.length; i += BATCH_SIZE) {
      const batch = activeAlerts.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(processSingleAlert));
    }
    
    console.log('Alert processing completed');
  } catch (error) {
    console.error('Error processing alerts:', error);
    // TODO: Add error reporting (e.g., Sentry, LogRocket)
  }
}

async function processSingleAlert(alert: any) {
  const { id: alertId, user_id: userId, product_id: productId } = alert;
  
  try {
    // Get current inventory for the product
    const { data: inventory, error } = await createServerClient()
      .from('product_inventory')
      .select('quantity_available')
      .eq('product_id', productId)
      .single();
    
    if (error || !inventory) {
      console.error(`Error fetching inventory for product ${productId}:`, error);
      return;
    }
    
    const currentQuantity = Number(inventory.quantity_available) || 0;
    const threshold = Number(alert.threshold_quantity) || 0;
    
    // Check if alert should be triggered
    if (currentQuantity <= threshold) {
      console.log(`Alert ${alertId} triggered: ${currentQuantity} <= ${threshold}`);
      
      // Get full alert details with product info
      const alertDetails = await InventoryAlertService.getAlertById(userId, alertId);
      
      if (!alertDetails) {
        console.error(`Alert ${alertId} not found`);
        return;
      }
      
      // Prepare notification
      const notification = {
        alert: alertDetails,
        currentQuantity,
        timestamp: new Date().toISOString(),
      };
      
      // Send notifications
      await Promise.all([
        AlertNotificationService.sendAlertNotification(userId, notification),
        AlertNotificationService.sendSmsNotification(userId, notification),
      ]);
      
      // Update alert status
      await InventoryAlertService.updateAlert(userId, alertId, {
        last_triggered_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error(`Error processing alert ${alertId}:`, error);
  }
}

// Handle command line execution
if (require.main === module) {
  processAlerts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Unhandled error in alert processor:', error);
      process.exit(1);
    });
}

export { processAlerts };
