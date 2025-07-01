/**
 * Client-side API functions for Metakocka contact synchronization
 */
import { fetchWithErrorHandling } from '@/lib/api-utils';

/**
 * Get sync status for a contact
 * @param contactId Contact ID
 * @returns Sync status
 */
export async function getContactSyncStatus(contactId: string) {
  return fetchWithErrorHandling(`/api/integrations/metakocka/contacts/sync?contactId=${contactId}`, {
    method: 'GET',
  });
}

/**
 * Get sync status for all contacts
 * @returns Sync status for all contacts
 */
export async function getAllContactSyncStatus() {
  return fetchWithErrorHandling('/api/integrations/metakocka/contacts/sync', {
    method: 'GET',
  });
}

/**
 * Sync a contact to Metakocka
 * @param contactId Contact ID
 * @returns Sync result
 */
export async function syncContact(contactId: string) {
  return fetchWithErrorHandling('/api/integrations/metakocka/contacts/sync', {
    method: 'POST',
    body: JSON.stringify({ contactId }),
  });
}

/**
 * Alias for syncContact for backward compatibility
 * @param contactId Contact ID
 * @returns Sync result
 */
export async function syncContactToMetakocka(contactId: string) {
  return syncContact(contactId);
}

/**
 * Sync all contacts to Metakocka
 * @returns Sync result
 */
export async function syncAllContacts() {
  return fetchWithErrorHandling('/api/integrations/metakocka/contacts/sync', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Sync multiple contacts to Metakocka
 * @param contactIds Array of contact IDs (optional, if not provided all contacts will be synced)
 * @returns Sync result
 */
export async function syncContactsToMetakocka(contactIds?: string[]) {
  if (!contactIds || contactIds.length === 0) {
    return syncAllContacts();
  }
  
  return fetchWithErrorHandling('/api/integrations/metakocka/contacts/sync', {
    method: 'POST',
    body: JSON.stringify({ contactIds }),
  });
}

/**
 * Get list of Metakocka partners that are not yet synced to CRM
 * @returns List of unsynced partners
 */
export async function getUnsyncedPartnersFromMetakocka() {
  return fetchWithErrorHandling('/api/integrations/metakocka/contacts/sync-from-metakocka', {
    method: 'GET',
  });
}

/**
 * Sync a partner from Metakocka to CRM
 * @param metakockaId Metakocka partner ID
 * @returns Sync result
 */
export async function syncContactFromMetakocka(metakockaId: string) {
  return fetchWithErrorHandling('/api/integrations/metakocka/contacts/sync-from-metakocka', {
    method: 'POST',
    body: JSON.stringify({ metakockaId }),
  });
}

/**
 * Sync multiple partners from Metakocka to CRM
 * @param metakockaIds Array of Metakocka partner IDs (optional, if not provided all unsynced partners will be synced)
 * @returns Sync result
 */
export async function syncContactsFromMetakocka(metakockaIds?: string[]) {
  return fetchWithErrorHandling('/api/integrations/metakocka/contacts/sync-all-from-metakocka', {
    method: 'POST',
    body: JSON.stringify({ metakockaIds }),
  });
}
