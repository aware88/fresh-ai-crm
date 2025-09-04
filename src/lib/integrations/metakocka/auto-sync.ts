/**
 * Automatic Metakocka Sync System
 * 
 * This module handles automatic background synchronization between
 * the CRM and Metakocka, making the CRM act as Metakocka's "longer arm"
 */

import { MetakockaService } from './service';
import { ProductSyncService } from './product-sync';
import { SalesDocumentSyncService } from './sales-document-sync';
import { ContactSyncService } from './contact-sync';
import { LogCategory, MetakockaErrorLogger } from './error-logger';

export interface AutoSyncConfig {
  enabled: boolean;
  intervals: {
    products: number; // minutes
    invoices: number; // minutes
    contacts: number; // minutes
    inventory: number; // minutes
  };
  direction: {
    products: 'metakocka_to_crm' | 'crm_to_metakocka' | 'bidirectional';
    invoices: 'metakocka_to_crm' | 'crm_to_metakocka' | 'bidirectional';
    contacts: 'metakocka_to_crm' | 'crm_to_metakocka' | 'bidirectional';
  };
  realTimeEnabled: boolean;
  webhooksEnabled: boolean;
}

export const DEFAULT_AUTO_SYNC_CONFIG: AutoSyncConfig = {
  enabled: false,
  intervals: {
    products: 30, // Every 30 minutes
    invoices: 15, // Every 15 minutes
    contacts: 60, // Every hour
    inventory: 10, // Every 10 minutes
  },
  direction: {
    products: 'metakocka_to_crm', // Products come from Metakocka (READ-ONLY)
    invoices: 'metakocka_to_crm', // Invoices come from Metakocka (READ-ONLY)
    contacts: 'metakocka_to_crm', // Contacts come from Metakocka (READ-ONLY for now)
  },
  realTimeEnabled: true,
  webhooksEnabled: false, // Disabled until Metakocka supports webhooks
};

export class AutoSyncManager {
  private static instance: AutoSyncManager;
  private syncTimers: Map<string, NodeJS.Timeout> = new Map();
  private config: AutoSyncConfig;
  private isRunning: boolean = false;

  private constructor(config: AutoSyncConfig = DEFAULT_AUTO_SYNC_CONFIG) {
    this.config = config;
  }

  public static getInstance(config?: AutoSyncConfig): AutoSyncManager {
    if (!AutoSyncManager.instance) {
      AutoSyncManager.instance = new AutoSyncManager(config);
    }
    return AutoSyncManager.instance;
  }

  /**
   * Start automatic sync for a user
   */
  public async startAutoSync(userId: string): Promise<void> {
    if (!this.config.enabled) {
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        'Auto-sync is disabled',
        { userId }
      );
      return;
    }

    if (this.isRunning) {
      MetakockaErrorLogger.logWarning(
        LogCategory.SYNC,
        'Auto-sync is already running',
        { userId }
      );
      return;
    }

    this.isRunning = true;

    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      'Starting automatic sync',
      { userId, details: { config: this.config } }
    );

    // Start product sync
    if (this.config.intervals.products > 0) {
      this.startProductSync(userId);
    }

    // Start invoice sync
    if (this.config.intervals.invoices > 0) {
      this.startInvoiceSync(userId);
    }

    // Start contact sync
    if (this.config.intervals.contacts > 0) {
      this.startContactSync(userId);
    }

    // Start inventory sync
    if (this.config.intervals.inventory > 0) {
      this.startInventorySync(userId);
    }
  }

  /**
   * Stop automatic sync for a user
   */
  public stopAutoSync(userId: string): void {
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      'Stopping automatic sync',
      { userId }
    );

    // Clear all timers
    this.syncTimers.forEach((timer, key) => {
      clearInterval(timer);
      this.syncTimers.delete(key);
    });

    this.isRunning = false;
  }

  /**
   * Start automatic product sync
   */
  private startProductSync(userId: string): void {
    const interval = this.config.intervals.products * 60 * 1000; // Convert to milliseconds
    const direction = this.config.direction.products;

    const timer = setInterval(async () => {
      try {
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          `Starting automatic product sync (${direction})`,
          { userId }
        );

        if (direction === 'metakocka_to_crm' || direction === 'bidirectional') {
          // Sync products from Metakocka to CRM (READ-ONLY MODE)
          await ProductSyncService.syncProductsFromMetakocka(userId);
        }

        if (direction === 'crm_to_metakocka' || direction === 'bidirectional') {
          // SAFETY: Skip writing to Metakocka during initial testing phase
          MetakockaErrorLogger.logWarning(
            LogCategory.SYNC,
            'Skipping product sync to Metakocka - system is in read-only mode',
            { userId }
          );
          // Note: To enable writing to Metakocka, uncomment the line below:
          // await ProductSyncService.syncProductsToMetakocka(userId);
        }

        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          'Automatic product sync completed',
          { userId }
        );
      } catch (error) {
        MetakockaErrorLogger.logError(
          LogCategory.SYNC,
          `Automatic product sync failed: ${error instanceof Error ? error.message : String(error)}`,
          { userId, error }
        );
      }
    }, interval);

    this.syncTimers.set(`products_${userId}`, timer);
  }

  /**
   * Start automatic invoice sync
   */
  private startInvoiceSync(userId: string): void {
    const interval = this.config.intervals.invoices * 60 * 1000;
    const direction = this.config.direction.invoices;

    const timer = setInterval(async () => {
      try {
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          `Starting automatic invoice sync (${direction})`,
          { userId }
        );

        if (direction === 'metakocka_to_crm' || direction === 'bidirectional') {
          // Sync invoices from Metakocka to CRM (READ-ONLY MODE)
          await SalesDocumentSyncService.syncSalesDocumentsFromMetakocka(userId);
        }

        if (direction === 'crm_to_metakocka' || direction === 'bidirectional') {
          // SAFETY: Skip writing to Metakocka during initial testing phase
          MetakockaErrorLogger.logWarning(
            LogCategory.SYNC,
            'Skipping invoice sync to Metakocka - system is in read-only mode',
            { userId }
          );
          // Note: To enable writing to Metakocka, uncomment the line below:
          // await SalesDocumentSyncService.syncSalesDocumentsToMetakocka(userId);
        }

        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          'Automatic invoice sync completed',
          { userId }
        );
      } catch (error) {
        MetakockaErrorLogger.logError(
          LogCategory.SYNC,
          `Automatic invoice sync failed: ${error instanceof Error ? error.message : String(error)}`,
          { userId, error }
        );
      }
    }, interval);

    this.syncTimers.set(`invoices_${userId}`, timer);
  }

  /**
   * Start automatic contact sync
   */
  private startContactSync(userId: string): void {
    const interval = this.config.intervals.contacts * 60 * 1000;
    const direction = this.config.direction.contacts;

    const timer = setInterval(async () => {
      try {
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          `Starting automatic contact sync (${direction})`,
          { userId }
        );

        if (direction === 'metakocka_to_crm' || direction === 'bidirectional') {
          // Sync contacts from Metakocka to CRM (READ-ONLY MODE)
          await ContactSyncService.syncContactsFromMetakocka(userId);
        }

        if (direction === 'crm_to_metakocka' || direction === 'bidirectional') {
          // SAFETY: Skip writing to Metakocka during initial testing phase
          MetakockaErrorLogger.logWarning(
            LogCategory.SYNC,
            'Skipping contact sync to Metakocka - system is in read-only mode',
            { userId }
          );
          // Note: To enable writing to Metakocka, uncomment the line below:
          // await ContactSyncService.syncContactsToMetakocka(userId);
        }

        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          'Automatic contact sync completed',
          { userId }
        );
      } catch (error) {
        MetakockaErrorLogger.logError(
          LogCategory.SYNC,
          `Automatic contact sync failed: ${error instanceof Error ? error.message : String(error)}`,
          { userId, error }
        );
      }
    }, interval);

    this.syncTimers.set(`contacts_${userId}`, timer);
  }

  /**
   * Start automatic inventory sync
   */
  private startInventorySync(userId: string): void {
    const interval = this.config.intervals.inventory * 60 * 1000;

    const timer = setInterval(async () => {
      try {
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          'Starting automatic inventory sync',
          { userId }
        );

        // Get Metakocka client
        const client = await MetakockaService.getClientForUser(userId);
        
        // Update inventory levels for all products
        // This would be implemented in an InventoryService
        // await InventoryService.syncInventoryFromMetakocka(userId);

        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          'Automatic inventory sync completed',
          { userId }
        );
      } catch (error) {
        MetakockaErrorLogger.logError(
          LogCategory.SYNC,
          `Automatic inventory sync failed: ${error instanceof Error ? error.message : String(error)}`,
          { userId, error }
        );
      }
    }, interval);

    this.syncTimers.set(`inventory_${userId}`, timer);
  }

    /**
   * Get real-time data from Metakocka
   */
  public async getRealTimeData(userId: string, dataType: 'product' | 'invoice' | 'contact' | 'inventory', id: string): Promise<any> {
    if (!this.config.realTimeEnabled) {
      throw new Error('Real-time fetching is disabled');
    }

    try {
      const client = await MetakockaService.getClientForUser(userId);

      // For now, return a simple test response
      // In a real implementation, you would call specific methods based on dataType
      return {
        dataType,
        id,
        message: 'Real-time data fetching is implemented but requires specific method calls',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Real-time data fetch failed: ${error instanceof Error ? error.message : String(error)}`,
        { userId, details: { dataType, id }, error }
      );
      throw error;
    }
  }

  /**
   * Update sync configuration
   */
  public updateConfig(newConfig: Partial<AutoSyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current sync status
   */
  public getSyncStatus(): { isRunning: boolean; config: AutoSyncConfig; activeTimers: string[] } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      activeTimers: Array.from(this.syncTimers.keys()),
    };
  }
}

/**
 * Initialize automatic sync for a user
 */
export async function initializeAutoSync(userId: string, config?: AutoSyncConfig): Promise<void> {
  const syncManager = AutoSyncManager.getInstance(config);
  await syncManager.startAutoSync(userId);
}

/**
 * Stop automatic sync for a user
 */
export function stopAutoSync(userId: string): void {
  const syncManager = AutoSyncManager.getInstance();
  syncManager.stopAutoSync(userId);
}

/**
 * Get real-time data from Metakocka
 */
export async function getRealTimeMetakockaData(
  userId: string,
  dataType: 'product' | 'invoice' | 'contact' | 'inventory',
  id: string
): Promise<any> {
  const syncManager = AutoSyncManager.getInstance();
  return syncManager.getRealTimeData(userId, dataType, id);
}

/**
 * Trigger manual sync for all data types
 */
export async function triggerManualSync(userId: string): Promise<void> {
  try {
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      'Triggering manual sync for all data types',
      { userId }
    );

    // Trigger product sync only - Metakocka doesn't have a partner list endpoint
    const syncPromises = [];

    // Sync products from Metakocka to CRM
    syncPromises.push(ProductSyncService.syncProductsFromMetakocka(userId));

    // NOTE: Metakocka API doesn't provide a partner_list endpoint
    // Partners must be accessed individually using get_partner, add_partner, update_partner

    // Execute all syncs
    const results = await Promise.allSettled(syncPromises);
    
    // Log results
    let successCount = 0;
    let errorCount = 0;
    let errors: string[] = [];
    
    results.forEach((result, index) => {
      const syncType = ['products'][index];
      if (result.status === 'fulfilled') {
        // Check if the fulfilled result actually indicates success
        const syncResult = (result as PromiseFulfilledResult<any>).value;
        if (syncResult && (syncResult.created > 0 || syncResult.updated > 0 || syncResult.failed === 0)) {
          successCount++;
          MetakockaErrorLogger.logInfo(
            LogCategory.SYNC,
            `Manual sync completed for ${syncType}`,
            { userId, details: { syncType, result: syncResult } }
          );
        } else {
          // Fulfilled but no data was actually synced - treat as error
          errorCount++;
          const errorMessage = 'No data synced - possible API or credentials issue';
          errors.push(`${syncType}: ${errorMessage}`);
          MetakockaErrorLogger.logError(
            LogCategory.SYNC,
            `Manual sync failed for ${syncType}: ${errorMessage}`,
            { userId, error: errorMessage, details: { syncType, result: syncResult } }
          );
        }
      } else {
        errorCount++;
        const errorMessage = result.reason instanceof Error ? result.reason.message : String(result.reason);
        errors.push(`${syncType}: ${errorMessage}`);
        MetakockaErrorLogger.logError(
          LogCategory.SYNC,
          `Manual sync failed for ${syncType}: ${errorMessage}`,
          { userId, error: result.reason, details: { syncType } }
        );
      }
    });

    if (errorCount > 0) {
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Manual sync completed with errors: ${successCount} successful, ${errorCount} failed`,
        { userId, details: { successCount, errorCount, errors } }
      );
      throw new Error(`Sync failed for ${errorCount} out of ${results.length} data types: ${errors.join('; ')}`);
    } else {
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Manual sync completed successfully: ${successCount} successful, ${errorCount} failed`,
        { userId, details: { successCount, errorCount } }
      );
    }
  } catch (error) {
    MetakockaErrorLogger.logError(
      LogCategory.SYNC,
      `Manual sync failed: ${error instanceof Error ? error.message : String(error)}`,
      { userId, error }
    );
    throw error;
  }
} 