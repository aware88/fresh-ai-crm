/**
 * Metakocka Contact Synchronization Service
 * 
 * Handles synchronization of contacts between the CRM and Metakocka
 * with enhanced error handling, logging, and status reporting
 */
import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { cookies } from 'next/headers';
import { MetakockaClient, MetakockaService, MetakockaPartner, MetakockaError, MetakockaErrorType } from './index';
import { Database } from '@/types/supabase';
import { MetakockaErrorLogger, LogCategory } from './error-logger';
import { MetakockaRetryHandler } from './metakocka-retry-handler';

// Type for CRM contact
type Contact = Database['public']['Tables']['contacts']['Row'];

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
}

// Type for contact mapping
interface ContactMapping {
  id?: string;
  contactId: string;
  metakockaId: string;
  metakockaCode: string;
  lastSyncedAt?: string;
  syncStatus?: string;
  syncError?: string | null;
}

/**
 * Contact Synchronization Service
 */
export class ContactSyncService {
  /**
   * Sync a single contact to Metakocka
   * @param userId User ID
   * @param contact CRM contact
   * @returns Metakocka partner ID
   */
  static async syncContactToMetakocka(
    userId: string,
    contact: Contact
  ): Promise<string> {
    try {
      // Log the sync attempt
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Starting sync of contact ${contact.id} to Metakocka`,
        { userId, contactId: contact.id }
      );

      // Get Metakocka client for user
      const client = await MetakockaService.getClientForUser(userId);
      
      // Check if contact already exists in Metakocka
      const mapping = await this.getContactMapping(contact.id, userId);
      
      // Convert CRM contact to Metakocka partner format
      const metakockaPartner: MetakockaPartner = {
        count_code: mapping?.metakockaCode || `CONT-${contact.id.substring(0, 8)}`,
        name: contact.full_name || `${contact.firstname} ${contact.lastname}`,
        email: contact.email,
        phone: contact.phone || undefined,
        contact_name: `${contact.firstname} ${contact.lastname}`,
        contact_email: contact.email,
        contact_phone: contact.phone || undefined,
        partner_type: 'P', // Default to person
        sales: 'true', // Enable for sales
      };
      
      // Add company information if available
      if (contact.company) {
        metakockaPartner.name = contact.company;
        metakockaPartner.partner_type = 'B'; // Business
      }
      
      let metakockaId: string;
      let isUpdate = false;
      
      if (mapping) {
        isUpdate = true;
        // Update existing partner
        metakockaPartner.mk_id = mapping.metakockaId;
        
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          `Updating existing Metakocka partner ${mapping.metakockaId} for contact ${contact.id}`,
          { userId, contactId: contact.id, metakockaId: mapping.metakockaId }
        );
        
        // Use retry handler for API call
        await MetakockaRetryHandler.executeWithRetry(
          async () => client.updatePartner(metakockaPartner),
          {
            userId,
            operationName: 'updatePartner',
            documentId: contact.id,
            metakockaId: mapping.metakockaId,
            details: {
              contactName: contact.full_name || `${contact.firstname} ${contact.lastname}`,
              email: contact.email
            }
          }
        );
        metakockaId = mapping.metakockaId;
        
        // Update mapping with latest sync time
        await this.saveContactMapping(
          contact.id,
          metakockaId,
          metakockaPartner.count_code,
          userId,
          'synced'
        );
      } else {
        // Create new partner
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          `Creating new Metakocka partner for contact ${contact.id}`,
          { userId, contactId: contact.id }
        );
        
        // Use retry handler for API call
        const response = await MetakockaRetryHandler.executeWithRetry(
          async () => client.addPartner(metakockaPartner),
          {
            userId,
            operationName: 'addPartner',
            documentId: contact.id,
            details: {
              contactName: contact.full_name || `${contact.firstname} ${contact.lastname}`,
              email: contact.email
            }
          }
        );
        metakockaId = response.mk_id || '';
        
        if (!metakockaId) {
          const error = new Error('Failed to get Metakocka partner ID from response');
          MetakockaErrorLogger.logError(
            LogCategory.SYNC,
            `Failed to get Metakocka partner ID from response for contact ${contact.id}`,
            { userId, contactId: contact.id, error }
          );
          throw error;
        }
        
        // Save mapping
        await this.saveContactMapping(
          contact.id,
          metakockaId,
          metakockaPartner.count_code,
          userId,
          'synced'
        );
      }
      
      // Log successful sync
      MetakockaErrorLogger.logSyncEvent(
        true,
        `Successfully ${isUpdate ? 'updated' : 'created'} Metakocka partner for contact ${contact.id}`,
        {
          userId,
          contactId: contact.id,
          metakockaId,
          created: isUpdate ? 0 : 1,
          updated: isUpdate ? 1 : 0
        }
      );
      
      return metakockaId;
    } catch (error) {
      // Log the error
      if (error instanceof MetakockaError) {
        MetakockaErrorLogger.logMetakockaError(error, {
          userId,
          contactId: contact.id
        });
        
        // Update mapping with error status
        await this.saveContactMapping(
          contact.id,
          '',
          '',
          userId,
          'error',
          error.message
        ).catch(e => {
          // Log but don't throw if saving the error status fails
          MetakockaErrorLogger.logError(
            LogCategory.SYNC,
            `Failed to save error status for contact ${contact.id}`,
            { userId, contactId: contact.id, error: e }
          );
        });
        
        throw error;
      }
      
      const metakockaError = new MetakockaError(
        'Failed to sync contact to Metakocka',
        MetakockaErrorType.UNKNOWN,
        'SYNC_FAILED',
        error
      );
      
      MetakockaErrorLogger.logMetakockaError(metakockaError, {
        userId,
        contactId: contact.id
      });
      
      // Update mapping with error status
      await this.saveContactMapping(
        contact.id,
        '',
        '',
        userId,
        'error',
        error instanceof Error ? error.message : String(error)
      ).catch(e => {
        // Log but don't throw if saving the error status fails
        MetakockaErrorLogger.logError(
          LogCategory.SYNC,
          `Failed to save error status for contact ${contact.id}`,
          { userId, contactId: contact.id, error: e }
        );
      });
      
      throw metakockaError;
    }
  }
  
  /**
   * Sync multiple contacts to Metakocka
   * @param userId User ID
   * @param contactIds Optional array of contact IDs to sync (if not provided, all contacts will be synced)
   * @returns Sync result
   */
  static async syncContactsToMetakocka(
    userId: string,
    contactIds?: string[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };
    
    try {
      // Log the bulk sync attempt
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Starting bulk sync of contacts to Metakocka${contactIds ? ` (${contactIds.length} contacts)` : ' (all contacts)'}`,
        { userId, details: { contactIds } }
      );
      
      // Get contacts to sync
      const supabase = await createLazyServerClient();
      
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId);
      
      // Filter by contact IDs if provided
      if (contactIds && contactIds.length > 0) {
        query = query.in('id', contactIds);
      }
      
      const { data: contacts, error } = await query;
      
      if (error || !contacts || contacts.length === 0) {
        return {
          ...result,
          success: false,
          errors: [{
            contactId: 'none',
            error: error ? error.message : 'No contacts found'
          }]
        };
      }
      
      // Get existing mappings
      const existingMappings = contactIds && contactIds.length > 0
        ? await this.getContactMappings(contactIds, userId)
        : [];
      
      // Process each contact
      for (const contact of contacts) {
        try {
          const mapping = existingMappings.find(m => m.contactId === contact.id);
          
          // Convert CRM contact to Metakocka partner format
          const metakockaPartner: MetakockaPartner = {
            count_code: mapping?.metakockaCode || `CONT-${contact.id.substring(0, 8)}`,
            name: contact.full_name || `${contact.firstname} ${contact.lastname}`,
            email: contact.email,
            phone: contact.phone || undefined,
            contact_name: `${contact.firstname} ${contact.lastname}`,
            contact_email: contact.email,
            contact_phone: contact.phone || undefined,
            partner_type: 'P', // Default to person
            sales: 'true', // Enable for sales
          };
          
          // Add company information if available
          if (contact.company) {
            metakockaPartner.name = contact.company;
            metakockaPartner.partner_type = 'B'; // Business
          }
          
          // Get Metakocka client for user
          const client = await MetakockaService.getClientForUser(userId);
          
          if (mapping) {
            // Update existing partner
            metakockaPartner.mk_id = mapping.metakockaId;
            
            // Use retry handler for API call
            await MetakockaRetryHandler.executeWithRetry(
              async () => client.updatePartner(metakockaPartner),
              {
                userId,
                operationName: 'updatePartner',
                documentId: contact.id,
                metakockaId: mapping.metakockaId,
                details: {
                  contactName: contact.full_name || `${contact.firstname} ${contact.lastname}`,
                  email: contact.email
                }
              }
            );
            
            // Update mapping with latest sync time
            await this.saveContactMapping(
              contact.id,
              mapping.metakockaId,
              metakockaPartner.count_code,
              userId,
              'synced'
            );
            
            result.updated++;
          } else {
            // Create new partner
            const response = await MetakockaRetryHandler.executeWithRetry(
              async () => client.addPartner(metakockaPartner),
              {
                userId,
                operationName: 'addPartner',
                documentId: contact.id,
                details: {
                  contactName: contact.full_name || `${contact.firstname} ${contact.lastname}`,
                  email: contact.email
                }
              }
            );
            
            const metakockaId = response.mk_id || '';
            
            if (!metakockaId) {
              const error = new Error('Failed to get Metakocka partner ID from response');
              MetakockaErrorLogger.logError(
                LogCategory.SYNC,
                `Failed to get Metakocka partner ID from response for contact ${contact.id}`,
                { userId, contactId: contact.id, error }
              );
              throw error;
            }
            
            // Save mapping
            await this.saveContactMapping(
              contact.id,
              metakockaId,
              metakockaPartner.count_code,
              userId,
              'synced'
            );
            
            result.created++;
          }
        } catch (error) {
          result.failed++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Log the error
          MetakockaErrorLogger.logError(
            LogCategory.SYNC,
            `Failed to sync contact ${contact.id} to Metakocka: ${errorMessage}`,
            { userId, contactId: contact.id, error }
          );
          
          result.errors.push({
            contactId: contact.id,
            error: errorMessage
          });
        }
      }
      
      result.success = result.failed === 0;
      
      // Log the final result
      MetakockaErrorLogger.logSyncEvent(
        result.success,
        `Completed bulk sync of contacts to Metakocka: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
        {
          userId,
          created: result.created,
          updated: result.updated,
          failed: result.failed,
          details: { errors: result.errors }
        }
      );
      
      return result;
    } catch (error) {
      // Log the error
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Error in bulk sync of contacts to Metakocka: ${error instanceof Error ? error.message : String(error)}`,
        { userId, error }
      );
      
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
  
  /**
   * Get contact mapping by CRM contact ID
   * @param contactId CRM contact ID
   * @param userId User ID
   * @returns Contact mapping or null if not found
   */
  static async getContactMapping(contactId: string, userId: string): Promise<ContactMapping | null> {
    const supabase = await createLazyServerClient();
    
    // Check for mapping in the dedicated table
    const { data, error } = await supabase
      .from('metakocka_contact_mappings')
      .select('*')
      .eq('contact_id', contactId)
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      contactId: data.contact_id,
      metakockaId: data.metakocka_id,
      metakockaCode: data.metakocka_code || '',
      lastSyncedAt: data.last_synced_at,
      syncStatus: data.sync_status,
      syncError: data.sync_error,
    };
  }
  
  /**
   * Get contact mappings for multiple contacts
   * @param contactIds Array of CRM contact IDs
   * @param userId User ID
   * @returns Array of contact mappings
   */
  static async getContactMappings(contactIds: string[], userId: string): Promise<ContactMapping[]> {
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .from('metakocka_contact_mappings')
      .select('*')
      .in('contact_id', contactIds)
      .eq('user_id', userId);
    
    if (error || !data) {
      return [];
    }
    
    return data.map((item: any) => ({
      id: item.id,
      contactId: item.contact_id,
      metakockaId: item.metakocka_id,
      metakockaCode: item.metakocka_code || '',
      lastSyncedAt: item.last_synced_at,
      syncStatus: item.sync_status,
      syncError: item.sync_error,
    }));
  }
  
  /**
   * Save contact mapping
   * @param contactId CRM contact ID
   * @param metakockaId Metakocka partner ID
   * @param metakockaCode Metakocka partner code
   * @param userId User ID
   * @param syncStatus Optional sync status
   * @param syncError Optional sync error
   */
  static async saveContactMapping(
    contactId: string,
    metakockaId: string,
    metakockaCode: string,
    userId: string,
    syncStatus: string = 'synced',
    syncError: string | null = null
  ): Promise<void> {
    const supabase = await createLazyServerClient();
    
    // Check if mapping already exists
    const { data, error } = await supabase
      .from('metakocka_contact_mappings')
      .select('id')
      .eq('contact_id', contactId)
      .eq('user_id', userId)
      .single();
    
    const now = new Date().toISOString();
    
    if (error || !data) {
      // Create new mapping
      const { error: insertError } = await supabase
        .from('metakocka_contact_mappings')
        .insert({
          user_id: userId,
          contact_id: contactId,
          metakocka_id: metakockaId,
          metakocka_code: metakockaCode,
          last_synced_at: now,
          created_at: now,
          updated_at: now,
          sync_status: syncStatus,
          sync_error: syncError,
        });
      
      if (insertError) {
        throw insertError;
      }
    } else {
      // Update existing mapping
      const { error: updateError } = await supabase
        .from('metakocka_contact_mappings')
        .update({
          metakocka_id: metakockaId,
          metakocka_code: metakockaCode,
          last_synced_at: now,
          updated_at: now,
          sync_status: syncStatus,
          sync_error: syncError,
        })
        .eq('id', data.id);
      
      if (updateError) {
        throw updateError;
      }
    }
  }

  /**
   * Sync contacts from Metakocka to CRM
   * @param userId User ID
   * @param metakockaIds Optional array of Metakocka partner IDs to sync (if not provided, all partners will be synced)
   * @returns Sync result
   */
  static async syncContactsFromMetakocka(
    userId: string,
    metakockaIds?: string[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      created: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };
    
    try {
      // Log the bulk sync attempt
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Starting bulk sync of contacts from Metakocka${metakockaIds ? ` (${metakockaIds.length} partners)` : ' (all partners)'}`,
        { userId, details: { metakockaIds } }
      );
      
      // Get Metakocka client for user
      const client = await MetakockaService.getClientForUser(userId);
      
      // Get partners from Metakocka with retry logic
      const partners = await MetakockaRetryHandler.executeWithRetry(
        async () => {
          if (metakockaIds && metakockaIds.length > 0) {
            // Get specific partners by ID
            const partnerPromises = metakockaIds.map(id => 
              client.getPartner(id).catch(error => {
                MetakockaErrorLogger.logError(
                  LogCategory.SYNC,
                  `Failed to get Metakocka partner ${id}`,
                  { userId, metakockaId: id, error }
                );
                return null;
              })
            );
            
            const results = await Promise.all(partnerPromises);
            return results.filter(partner => partner !== null);
          } else {
            // Get all partners
            return client.listPartners();
          }
        },
        {
          userId,
          operationName: 'getPartners',
          details: { metakockaIds }
        }
      );
      
      if (!partners || partners.length === 0) {
        return {
          ...result,
          success: false,
          errors: [{
            contactId: 'none',
            error: 'No partners found in Metakocka'
          }]
        };
      }
      
      // Get existing mappings by Metakocka ID
      const supabase = await createLazyServerClient();
      const { data: mappingsData, error: mappingsError } = await supabase
        .from('metakocka_contact_mappings')
        .select('*')
        .eq('user_id', userId);
      
      if (mappingsError) {
        MetakockaErrorLogger.logError(
          LogCategory.SYNC,
          `Failed to get contact mappings: ${mappingsError.message}`,
          { userId, error: mappingsError }
        );
      }
      
      const existingMappings = mappingsData || [];
      
      // Process each partner
      for (const partner of partners) {
        try {
          const mapping = existingMappings.find((m: any) => m.metakocka_id === partner.mk_id);
          
          // Prepare contact data
          const contactData: any = {
            user_id: userId,
            email: partner.email || partner.contact_email,
            phone: partner.phone || partner.contact_phone,
            firstname: '',
            lastname: '',
            company: partner.partner_type === 'B' ? partner.name : '',
            metakocka_id: partner.mk_id,
            metakocka_code: partner.count_code,
            updated_at: new Date().toISOString(),
          };
          
          // Parse name
          if (partner.contact_name) {
            const nameParts = partner.contact_name.split(' ');
            contactData.firstname = nameParts[0] || '';
            contactData.lastname = nameParts.slice(1).join(' ') || '';
          } else if (partner.partner_type === 'P') {
            const nameParts = partner.name.split(' ');
            contactData.firstname = nameParts[0] || '';
            contactData.lastname = nameParts.slice(1).join(' ') || '';
          }
          
          if (mapping) {
            // Update existing contact
            const { error: updateError } = await supabase
              .from('contacts')
              .update(contactData)
              .eq('id', mapping.contact_id);
            
            if (updateError) {
              throw new Error(`Failed to update contact: ${updateError.message}`);
            }
            
            // Update mapping with latest sync time
            await this.saveContactMapping(
              mapping.contact_id,
              partner.mk_id,
              partner.count_code,
              userId,
              'synced'
            );
            
            result.updated++;
            
            MetakockaErrorLogger.logInfo(
              LogCategory.SYNC,
              `Updated CRM contact ${mapping.contact_id} from Metakocka partner ${partner.mk_id}`,
              { userId, contactId: mapping.contact_id, metakockaId: partner.mk_id }
            );
          } else {
            // Create new contact
            const { data: newContact, error: insertError } = await supabase
              .from('contacts')
              .insert(contactData)
              .select('id')
              .single();
            
            if (insertError || !newContact) {
              throw new Error(`Failed to create contact: ${insertError?.message || 'No ID returned'}`);
            }
            
            // Save mapping
            await this.saveContactMapping(
              newContact.id,
              partner.mk_id,
              partner.count_code,
              userId,
              'synced'
            );
            
            result.created++;
            
            MetakockaErrorLogger.logInfo(
              LogCategory.SYNC,
              `Created new CRM contact ${newContact.id} from Metakocka partner ${partner.mk_id}`,
              { userId, contactId: newContact.id, metakockaId: partner.mk_id }
            );
          }
        } catch (error) {
          result.failed++;
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Log the error
          MetakockaErrorLogger.logError(
            LogCategory.SYNC,
            `Failed to sync Metakocka partner ${partner.mk_id} to CRM: ${errorMessage}`,
            { userId, metakockaId: partner.mk_id, error }
          );
          
          result.errors.push({
            contactId: partner.mk_id,
            error: errorMessage
          });
        }
      }
      
      result.success = result.failed === 0;
      
      // Log the final result
      MetakockaErrorLogger.logSyncEvent(
        result.success,
        `Completed bulk sync of contacts from Metakocka: ${result.created} created, ${result.updated} updated, ${result.failed} failed`,
        {
          userId,
          created: result.created,
          updated: result.updated,
          failed: result.failed,
          details: { errors: result.errors }
        }
      );
      
      return result;
    } catch (error) {
      // Log the error
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Error in bulk sync of contacts from Metakocka: ${error instanceof Error ? error.message : String(error)}`,
        { userId, error }
      );
      
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

  /**
   * Get list of Metakocka partners that are not yet synced to CRM
   * @param userId User ID
   * @returns List of unsynced partners
   */
  static async getUnsyncedPartnersFromMetakocka(userId: string): Promise<any[]> {
    try {
      // Log the attempt
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        'Getting unsynced partners from Metakocka',
        { userId }
      );
      
      // Get Metakocka client for user
      const client = await MetakockaService.getClientForUser(userId);
      
      // Get all partners from Metakocka with retry logic
      const partners = await MetakockaRetryHandler.executeWithRetry(
        async () => client.listPartners(),
        {
          userId,
          operationName: 'listPartners',
          details: { action: 'getUnsyncedPartners' }
        }
      );
      
      if (!partners || partners.length === 0) {
        return [];
      }
      
      // Get existing mappings
      const supabase = await createLazyServerClient();
      const { data: mappings, error: mappingsError } = await supabase
        .from('metakocka_contact_mappings')
        .select('metakocka_id')
        .eq('user_id', userId);
      
      if (mappingsError) {
        MetakockaErrorLogger.logError(
          LogCategory.SYNC,
          `Failed to get contact mappings: ${mappingsError.message}`,
          { userId, error: mappingsError }
        );
        return [];
      }
      
      // Filter out partners that are already synced
      const syncedIds = mappings ? mappings.map((m: any) => m.metakocka_id) : [];
      const unsyncedPartners = partners.filter((p: any) => !syncedIds.includes(p.mk_id));
      
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Found ${unsyncedPartners.length} unsynced partners in Metakocka`,
        { userId, details: { total: partners.length, unsynced: unsyncedPartners.length } }
      );
      
      return unsyncedPartners;
    } catch (error) {
      // Log the error
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Error getting unsynced partners from Metakocka: ${error instanceof Error ? error.message : String(error)}`,
        { userId, error }
      );
      
      return [];
    }
  }

  /**
   * Sync a single contact from Metakocka to CRM
   * @param userId User ID
   * @param metakockaId Metakocka partner ID
   * @returns CRM contact ID
   */
  static async syncContactFromMetakocka(
    userId: string,
    metakockaId: string
  ): Promise<string> {
    try {
      // Log the sync attempt
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Starting sync of Metakocka partner ${metakockaId} to CRM`,
        { userId, metakockaId }
      );
      
      // Get Metakocka client for user
      const client = await MetakockaService.getClientForUser(userId);
      
      // Get partner from Metakocka with retry logic
      const partner = await MetakockaRetryHandler.executeWithRetry(
        async () => client.getPartner(metakockaId),
        {
          userId,
          operationName: 'getPartner',
          metakockaId,
          details: { action: 'syncContactFromMetakocka' }
        }
      );
      
      if (!partner) {
        throw new Error(`Partner not found in Metakocka: ${metakockaId}`);
      }
      
      // Check if contact already exists in CRM
      const supabase = await createLazyServerClient();
      const { data: mapping, error: mappingError } = await supabase
        .from('metakocka_contact_mappings')
        .select('contact_id')
        .eq('metakocka_id', metakockaId)
        .eq('user_id', userId)
        .single();
      
      // Prepare contact data
      const contactData: any = {
        user_id: userId,
        email: partner.email || partner.contact_email,
        phone: partner.phone || partner.contact_phone,
        firstname: '',
        lastname: '',
        company: partner.partner_type === 'B' ? partner.name : '',
        metakocka_id: partner.mk_id,
        metakocka_code: partner.count_code,
        updated_at: new Date().toISOString(),
      };
      
      // Parse name
      if (partner.contact_name) {
        const nameParts = partner.contact_name.split(' ');
        contactData.firstname = nameParts[0] || '';
        contactData.lastname = nameParts.slice(1).join(' ') || '';
      } else if (partner.partner_type === 'P') {
        const nameParts = partner.name.split(' ');
        contactData.firstname = nameParts[0] || '';
        contactData.lastname = nameParts.slice(1).join(' ') || '';
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
          throw new Error(`Failed to update contact: ${updateError.message}`);
        }
        
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          `Updated CRM contact ${contactId} from Metakocka partner ${metakockaId}`,
          { userId, contactId, metakockaId }
        );
      } else {
        // Create new contact
        const { data: newContact, error: insertError } = await supabase
          .from('contacts')
          .insert(contactData)
          .select('id')
          .single();
        
        if (insertError || !newContact) {
          throw new Error(`Failed to create contact: ${insertError?.message || 'No ID returned'}`);
        }
        
        contactId = newContact.id;
        
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          `Created new CRM contact ${contactId} from Metakocka partner ${metakockaId}`,
          { userId, contactId, metakockaId }
        );
      }
      
      // Save or update mapping
      await this.saveContactMapping(
        contactId,
        metakockaId,
        partner.count_code,
        userId,
        'synced'
      );
      
      return contactId;
    } catch (error) {
      // Log the error
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Error syncing Metakocka partner ${metakockaId} to CRM: ${error instanceof Error ? error.message : String(error)}`,
        { userId, metakockaId, error }
      );
      
      throw error;
    }
  }
}
