/**
 * Metakocka Contact Synchronization Service - CRM to Metakocka
 * 
 * Handles synchronization of contacts from CRM to Metakocka
 * with enhanced error handling and retry mechanisms
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
    contactId: string;
    error: string;
  }>;
  metakockaIds?: string[];
}

/**
 * Contact Synchronization Service - CRM to Metakocka
 */
export class ContactSyncToMetakockaService {
  /**
   * Sync a single contact from CRM to Metakocka
   * @param userId User ID
   * @param contactId CRM contact ID
   * @param retryConfig Optional retry configuration
   * @returns Metakocka partner ID
   */
  static async syncContactToMetakocka(
    userId: string,
    contactId: string,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<string> {
    // Use retry handler for the entire operation
    return MetakockaRetryHandler.executeWithRetry(
      async () => {
      // Get Metakocka client for user with enhanced error handling
      const client = await MetakockaService.getClientForUser(userId, true);
      
      // Get contact details from CRM
      const supabase = await createServerClient();
      
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .eq('user_id', userId)
        .single();
      
      if (contactError || !contact) {
        throw contactError || new Error(`Contact not found with ID: ${contactId}`);
      }
      
      // Check if contact already exists in Metakocka by looking up the mapping
      const { data: mapping, error: mappingError } = await supabase
        .from('metakocka_contact_mappings')
        .select('metakocka_id')
        .eq('contact_id', contactId)
        .eq('user_id', userId)
        .single();
      
      // Convert CRM contact to Metakocka partner format
      const partnerData: any = {
        email: contact.email || '',
        phone: contact.phone || '',
        street: contact.address || '',
        post_number: contact.postal_code || '',
        city: contact.city || '',
        country: contact.country || '',
        notes: contact.notes || '',
      };
      
      // Determine if this is a business or person based on company field
      if (contact.company && contact.company.trim() !== '') {
        // Business partner
        partnerData.partner_type = 'B'; // Business
        partnerData.name = contact.company;
        partnerData.contact_name = [contact.firstname, contact.lastname].filter(Boolean).join(' ');
      } else {
        // Person
        partnerData.partner_type = 'P'; // Person
        partnerData.name = [contact.firstname, contact.lastname].filter(Boolean).join(' ');
      }
      
      let metakockaId = '';
      
      if (mapping && mapping.metakocka_id) {
        // Update existing partner
        metakockaId = mapping.metakocka_id;
        
        // Get current partner data to merge with updates
        const existingPartner = await client.getPartner(metakockaId, false);
        
        if (!existingPartner) {
          throw new Error(`Partner not found in Metakocka with ID: ${metakockaId}`);
        }
        
        // Preserve fields that we don't want to overwrite
        partnerData.count_code = existingPartner.count_code || '';
        
        // Update partner in Metakocka
        await client.updatePartner({
          ...partnerData,
          mk_id: metakockaId
        });
      } else {
        // Create new partner
        // Generate a unique count_code (partner code) based on contact name
        const baseCode = partnerData.partner_type === 'B' 
          ? contact.company.substring(0, 3).toUpperCase()
          : (contact.firstname.substring(0, 1) + contact.lastname.substring(0, 2)).toUpperCase();
        
        // Add a timestamp to ensure uniqueness
        partnerData.count_code = `${baseCode}${Date.now().toString().substring(7)}`;
        
        // Create partner in Metakocka
        const result = await client.addPartner(partnerData);
        if (!result || !result.mk_id) {
          throw new Error('Failed to create partner in Metakocka: No ID returned');
        }
        metakockaId = String(result.mk_id);
        
        // Create mapping in CRM
        await supabase
          .from('metakocka_contact_mappings')
          .insert({
            user_id: userId,
            contact_id: contactId,
            metakocka_id: metakockaId,
            sync_status: 'synced',
            last_sync: new Date().toISOString()
          });
      }
      
      return metakockaId;
    },
    {
      userId,
      operationName: 'syncContactToMetakocka',
      contactId,
      details: { operation: 'single-contact-sync' }
    },
    retryConfig
  );
  }
  
  /**
   * Get all contacts from CRM that are not yet synced to Metakocka
   * @param userId User ID
   * @returns Array of CRM contacts
   */
  static async getUnsyncedContactsFromCRM(userId: string): Promise<any[]> {
    try {
      const supabase = await createServerClient();
      
      // Get existing mappings
      const { data: mappings, error: mappingsError } = await supabase
        .from('metakocka_contact_mappings')
        .select('contact_id')
        .eq('user_id', userId);
        
      if (mappingsError) {
        throw mappingsError;
      }
      
      // Get list of already synced contact IDs
      const syncedIds = mappings.map((m: any) => m.contact_id);
      
      // Get contacts that need to be synced
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id, name, email, phone, company, title, address, city, state, zip, country, notes')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (contactsError) {
        throw contactsError;
      }
      
      // Filter contacts that are not yet synced
      const unsyncedContacts = contacts.filter((c: any) => !syncedIds.includes(c.id));
      
      return unsyncedContacts;
    } catch (error) {
      ErrorLogger.logError(LogCategory.SYNC, 'Error getting unsynced contacts from CRM', {
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Sync multiple contacts from CRM to Metakocka
   * @param userId User ID
   * @param contactIds Array of CRM contact IDs to sync (if not provided, all unsynced contacts will be synced)
   * @returns Sync result
   */
  static async syncContactsToMetakocka(
    userId: string,
    contactIds?: string[],
    retryConfig?: RetryConfig
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
      metakockaIds: [],
    };
    
    try {
      // If no specific IDs provided, get all unsynced contacts
      let contactsToSync: string[] = [];
      
      if (!contactIds || contactIds.length === 0) {
        // Get unsynced contacts from CRM
        const unsyncedContacts = await this.getUnsyncedContactsFromCRM(userId);
        
        // If specific contact IDs were provided, filter to only those
        let contactsToProcess = unsyncedContacts;
        if (contactIds && contactIds.length > 0) {
          contactsToProcess = unsyncedContacts.filter((c: any) => contactIds.includes(c.id));
        }
        
        contactsToSync = contactsToProcess.map(c => c.id).filter(id => id !== '');
      } else {
        contactsToSync = contactIds;
      }
      
      // Process each contact
      for (const contactId of contactsToSync) {
        try {
          const metakockaId = await this.syncContactToMetakocka(userId, contactId);
          
          // Check if this is a new partner or an update
          const supabase = await createServerClient();
          const { data, error } = await supabase
            .from('metakocka_contact_mappings')
            .select('created_at, updated_at')
            .eq('contact_id', contactId)
            .eq('user_id', userId)
            .single();
          
          if (!error && data) {
            // If created_at and updated_at are close, it's a new partner
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
          
          // Add to successful metakocka IDs
          if (result.metakockaIds) {
            result.metakockaIds.push(metakockaId);
          }
        } catch (error) {
          result.failed++;
          result.errors.push({
            contactId,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      result.success = result.failed === 0;
      return result;
    } catch (error) {
      ErrorLogger.logError(LogCategory.SYNC, 'Error syncing contacts to Metakocka', {
        userId,
        contactId: 'batch',
        details: { contactCount: contactIds?.length || 0 },
        error
      });
      
      return {
        ...result,
        success: false,
        errors: [{
          contactId: 'batch',
          error: error instanceof Error ? error.message : String(error)
        }]
      };
    }
  }
}
