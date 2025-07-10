/**
 * Mock services for testing Metakocka integration
 * 
 * These services are used to bypass actual API calls during testing
 */

import { MetakockaErrorLogger, LogCategory } from './error-logger';

/**
 * Mock ContactSyncService for testing
 */
export class MockContactSyncService {
  /**
   * Mock method to sync a contact to Metakocka
   */
  static async syncContactToMetakocka(userId: string, contactId: string) {
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `[MOCK] Syncing contact ${contactId} to Metakocka for user ${userId}`,
      { userId, contactId }
    );
    
    // Return a mock Metakocka ID
    return `mk-${contactId}-${Date.now()}`;
  }
  
  /**
   * Mock method to sync multiple contacts to Metakocka
   */
  static async syncContactsToMetakocka(userId: string, contactIds: string[]) {
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `[MOCK] Syncing ${contactIds.length} contacts to Metakocka for user ${userId}`,
      { userId, details: { contactIds } }
    );
    
    // Return mock results
    return {
      created: contactIds.length,
      updated: 0,
      failed: 0,
      errors: [],
      metakockaIds: contactIds.map(id => `mk-${id}-${Date.now()}`)
    };
  }
  
  /**
   * Mock method to sync a contact from Metakocka
   */
  static async syncContactFromMetakocka(userId: string, metakockaId: string) {
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `[MOCK] Syncing contact from Metakocka ${metakockaId} for user ${userId}`,
      { userId, metakockaId }
    );
    
    // Return a mock contact ID
    return `contact-${metakockaId}-${Date.now()}`;
  }
  
  /**
   * Mock method to get unsynced partners from Metakocka
   */
  static async getUnsyncedPartnersFromMetakocka(userId: string) {
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `[MOCK] Getting unsynced partners from Metakocka for user ${userId}`,
      { userId }
    );
    
    // Return mock partners
    return [
      {
        mk_id: 'mk-1',
        count_code: 'TEST001',
        name: 'Test Partner 1',
        email: 'test1@example.com',
        phone: '123456789',
        partner_type: 'business'
      },
      {
        mk_id: 'mk-2',
        count_code: 'TEST002',
        name: 'Test Partner 2',
        email: 'test2@example.com',
        phone: '987654321',
        partner_type: 'person'
      }
    ];
  }
  
  /**
   * Mock method to sync contacts from Metakocka to CRM
   */
  static async syncContactsFromMetakocka(userId: string, metakockaIds?: string[]) {
    const ids = metakockaIds || [];
    
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `[MOCK] Syncing ${ids.length || 'all'} contacts from Metakocka for user ${userId}`,
      { userId, details: { metakockaIds: ids } }
    );
    
    // Return mock results
    return {
      success: true,
      created: ids.length || 2,
      updated: 0,
      failed: 0,
      errors: [],
      contactIds: ids.length > 0 ? 
        ids.map(id => `contact-${id}-${Date.now()}`) : 
        ['contact-mk-1-test', 'contact-mk-2-test']
    };
  }
  
  /**
   * Mock method to get contact mapping
   */
  static async getContactMapping(contactId: string, userId: string) {
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `[MOCK] Getting mapping for contact ${contactId} for user ${userId}`,
      { userId, contactId }
    );
    
    // Return mock mapping
    return {
      id: `mapping-${contactId}`,
      user_id: userId,
      contact_id: contactId,
      metakocka_id: `mk-${contactId}-test`,
      organization_id: 'test-org',
      synced_at: new Date().toISOString(),
      status: 'synced'
    };
  }
  
  /**
   * Mock method to get contact mappings for multiple contacts
   */
  static async getContactMappings(contactIds: string[], userId: string) {
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `[MOCK] Getting mappings for contacts ${contactIds.length ? contactIds.join(', ') : 'all'} for user ${userId}`,
      { userId, details: { contactIds } }
    );
    
    // Return mock mappings formatted as expected by ContactSyncService.getContactMappings
    return [
      {
        id: 'mapping-1',
        contactId: 'contact-1',
        metakockaId: 'mk-contact-1-test',
        metakockaCode: 'MK001',
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'synced',
        syncError: null
      },
      {
        id: 'mapping-2',
        contactId: 'contact-2',
        metakockaId: 'mk-contact-2-test',
        metakockaCode: 'MK002',
        lastSyncedAt: new Date().toISOString(),
        syncStatus: 'synced',
        syncError: null
      },
      {
        contactId: 'test_contact_id_2',
        metakockaId: 'mk-test_contact_id_2-test',
        syncedAt: new Date().toISOString(),
        status: 'synced'
      }
    ];
  }
}

/**
 * Mock ContactSyncToMetakockaService for testing
 */
export class MockContactSyncToMetakockaService {
  /**
   * Mock method to sync a contact to Metakocka
   */
  static async syncContactToMetakocka(userId: string, contactId: string) {
    return MockContactSyncService.syncContactToMetakocka(userId, contactId);
  }
  
  /**
   * Mock method to sync multiple contacts to Metakocka
   */
  static async syncContactsToMetakocka(userId: string, contactIds: string[]) {
    return MockContactSyncService.syncContactsToMetakocka(userId, contactIds);
  }
}

/**
 * Mock SalesDocumentSyncService for testing
 */
export class MockSalesDocumentSyncService {
  /**
   * Mock method to sync a sales document to Metakocka
   */
  static async syncSalesDocumentToMetakocka(userId: string, document: any, items: any[] = []) {
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `[MOCK] Syncing sales document ${document.id} to Metakocka for user ${userId}`,
      { userId, documentId: document.id }
    );
    
    // Return a mock Metakocka ID
    return `mk-doc-${document.id}-${Date.now()}`;
  }
  
  /**
   * Mock method to sync multiple sales documents to Metakocka
   */
  static async syncSalesDocumentsToMetakocka(userId: string, documentIds?: string[]) {
    const ids = documentIds || [];
    
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `[MOCK] Syncing ${ids.length || 'all'} sales documents to Metakocka for user ${userId}`,
      { userId, details: { documentIds: ids } }
    );
    
    // Return mock results
    return {
      success: true,
      created: ids.length || 2,
      updated: 0,
      failed: 0,
      errors: []
    };
  }
  
  /**
   * Mock method to get sales document mapping
   */
  static async getSalesDocumentMapping(documentId: string, userId: string) {
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `[MOCK] Getting mapping for sales document ${documentId} for user ${userId}`,
      { userId, documentId }
    );
    
    // Return mock mapping
    return {
      id: `mapping-${documentId}`,
      documentId: documentId,
      metakockaId: `mk-doc-${documentId}-test`,
      metakockaDocumentType: 'invoice',
      metakockaDocumentNumber: `INV-${documentId}`,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'synced',
      syncError: null
    };
  }
  
  /**
   * Mock method to get sales document mappings for multiple documents
   */
  static async getSalesDocumentMappings(documentIds: string[], userId: string) {
    MetakockaErrorLogger.logInfo(
      LogCategory.SYNC,
      `[MOCK] Getting mappings for sales documents ${documentIds.join(', ')} for user ${userId}`,
      { userId, details: { documentIds } }
    );
    
    // Return mock mappings
    return documentIds.map(id => ({
      id: `mapping-${id}`,
      documentId: id,
      metakockaId: `mk-doc-${id}-test`,
      metakockaDocumentType: 'invoice',
      metakockaDocumentNumber: `INV-${id}`,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: 'synced',
      syncError: null
    }));
  }
}
