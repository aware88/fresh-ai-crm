/**
 * Metakocka Contact Synchronization Service - Metakocka to CRM
 * 
 * Handles synchronization of contacts from Metakocka to the CRM
 */
import { createServerClient } from '@/lib/supabase/server';
import { MetakockaService, MetakockaPartner, MetakockaError, MetakockaErrorType } from './index';
import { Database } from '@/types/supabase';
import { ContactSyncService } from './contact-sync';
import { LogCategory, MetakockaErrorLogger as ErrorLogger } from './error-logger';
import { MetakockaRetryHandler, RetryConfig, DEFAULT_RETRY_CONFIG } from './metakocka-retry-handler';

// Type for sync result
interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{
    metakockaId: string;
    error: string;
  }>;
  contactIds?: string[];
}

/**
 * Contact Synchronization Service - Metakocka to CRM
 */
export class ContactSyncFromMetakockaService {
  /**
   * Sync a single contact from Metakocka to CRM
   * @param userId User ID
   * @param metakockaId Metakocka partner ID
   * @param retryConfig Retry configuration
   * @returns CRM contact ID
   */
  static async syncContactFromMetakocka(
    userId: string,
    metakockaId: string,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<string> {
    // Use retry handler for the entire operation
    return MetakockaRetryHandler.executeWithRetry(
      async () => {
        // Get Metakocka client for user
        const client = await MetakockaService.getClientForUser(userId, true);
        
        // Get partner details from Metakocka
        const partner = await client.getPartner(metakockaId, false);
        
        if (!partner) {
          throw new Error(`Partner not found in Metakocka with ID: ${metakockaId}`);
        }
        
        // Check if contact already exists in CRM by looking up the mapping
        const supabase = await createServerClient();
        
        const { data: mapping, error: mappingError } = await supabase
          .from('metakocka_contact_mappings')
          .select('contact_id')
          .eq('metakocka_id', metakockaId)
          .eq('user_id', userId)
          .single();
        
        // Convert Metakocka partner to CRM contact format
        const contactData: any = {
          user_id: userId,
          email: partner.email || '',
          phone: partner.phone || '',
          updated_at: new Date().toISOString(),
        };
        
        // Set name fields based on partner type
        if (partner.partner_type === 'B') { // Business
          contactData.company = partner.name || '';
          contactData.firstname = partner.contact_name?.split(' ')[0] || '';
          contactData.lastname = partner.contact_name?.split(' ').slice(1).join(' ') || '';
          contactData.full_name = partner.contact_name || '';
        } else { // Person
          const nameParts = partner.name?.split(' ') || [];
          contactData.firstname = nameParts[0] || '';
          contactData.lastname = nameParts.slice(1).join(' ') || '';
          contactData.full_name = partner.name || '';
        }
        
        let contactId: string;
        
        if (mapping && mapping.contact_id) {
          // Update existing contact
          contactId = mapping.contact_id;
          
          const { error: updateError } = await supabase
            .from('contacts')
            .update(contactData)
            .eq('id', contactId);
          
          if (updateError) {
            throw updateError;
          }
        } else {
          // Create new contact
          contactData.created_at = new Date().toISOString();
          
          const { data: newContact, error: insertError } = await supabase
            .from('contacts')
            .insert(contactData)
            .select('id')
            .single();
          
          if (insertError || !newContact) {
            throw insertError || new Error('Failed to create contact');
          }
          
          contactId = newContact.id;
          
          // Save mapping
          await ContactSyncService.saveContactMapping(
            contactId,
            metakockaId,
            partner.count_code || '',
            userId
          );
        }
        
        return contactId;
      },
      {
        userId,
        operationName: 'syncContactFromMetakocka',
        metakockaId,
        details: { operation: 'single-contact-sync-from-metakocka' }
      },
      retryConfig
    );
  }
  
  /**
   * Get all partners from Metakocka that are not yet synced to CRM
   * @param userId User ID
   * @returns Array of Metakocka partners
   */
  static async getUnsynedPartnersFromMetakocka(userId: string): Promise<MetakockaPartner[]> {
    try {
      // Get Metakocka client for user
      const client = await MetakockaService.getClientForUser(userId);
      
      // Get all partners from Metakocka
      const response = await client.listPartners();
      const partners = response.partner_list || [];
      
      if (!partners || partners.length === 0) {
        return [];
      }
      
      // Get all existing mappings
      const supabase = await createServerClient();
      
      const { data: mappings, error: mappingsError } = await supabase
        .from('metakocka_contact_mappings')
        .select('metakocka_id')
        .eq('user_id', userId);
      
      if (mappingsError) {
        throw mappingsError;
      }
      
      // Filter out partners that are already synced
      const syncedIds = new Set(mappings?.map(m => m.metakocka_id) || []);
      const unsynedPartners = partners.filter((p: any) => !syncedIds.has(p.mk_id || ''));
      
      return unsynedPartners;
    } catch (error) {
      ErrorLogger.logError(LogCategory.SYNC, 'Error getting unsynced partners from Metakocka', {
        userId,
        details: { operation: 'get-unsynced-partners' },
        error
      });
      throw error;
    }
  }
  
  /**
   * Sync multiple contacts from Metakocka to CRM
   * @param userId User ID
   * @param metakockaIds Array of Metakocka partner IDs to sync (if not provided, all unsynced partners will be synced)
   * @param retryConfig Optional retry configuration
   * @returns Sync result
   */
  static async syncContactsFromMetakocka(
    userId: string,
    metakockaIds?: string[],
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
      contactIds: [],
    };
    
    try {
      // If no specific IDs provided, get all unsynced partners
      let partnersToSync: string[] = [];
      
      if (!metakockaIds || metakockaIds.length === 0) {
        const unsynedPartners = await this.getUnsynedPartnersFromMetakocka(userId);
        partnersToSync = unsynedPartners.map(p => p.mk_id || '').filter(id => id !== '');
      } else {
        partnersToSync = metakockaIds;
      }
      
      // Sync each partner
      for (const metakockaId of partnersToSync) {
        try {
          const contactId = await this.syncContactFromMetakocka(userId, metakockaId, retryConfig);
          
          // Check if this is a new contact or an update
          const supabase = await createServerClient();
          const { data, error } = await supabase
            .from('metakocka_contact_mappings')
            .select('created_at, updated_at')
            .eq('metakocka_id', metakockaId)
            .eq('user_id', userId)
            .single();
          
          if (!error && data) {
            // If created_at and updated_at are close, it's a new contact
            const createdAt = new Date(data.created_at);
            const updatedAt = new Date(data.updated_at);
            const diffMs = updatedAt.getTime() - createdAt.getTime();
            
            if (diffMs < 5000) { // Less than 5 seconds difference
              result.created++;
            } else {
              result.updated++;
            }
          } else {
            // Default to updated if we can't determine
            result.updated++;
          }
          
          // Add to successful contact IDs
          if (result.contactIds) {
            result.contactIds.push(contactId);
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            metakockaId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      result.success = result.failed === 0;
      return result;
    } catch (error) {
      ErrorLogger.logError(LogCategory.SYNC, 'Error syncing contacts from Metakocka', {
        userId,
        metakockaId: 'batch',
        details: { contactCount: metakockaIds?.length || 0 },
        error
      });
      
      return {
        ...result,
        success: false,
        errors: [{
          metakockaId: 'batch',
          error: error instanceof Error ? error.message : String(error)
        }]
      };
    }
  }
}
