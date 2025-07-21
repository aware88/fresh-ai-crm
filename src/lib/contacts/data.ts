import { v4 as uuidv4 } from 'uuid';
import { Contact, ContactCreateInput, ContactUpdateInput } from './types';
import { isSupabaseConfigured } from '../supabaseClient';
import {
  fetchContacts as fetchContactsFromDb,
  fetchContactById as fetchContactByIdFromDb,
  createContactInDb,
  updateContactInDb,
  deleteContactFromDb,
  ensureContactsTable
} from './supabase';

// Cache contacts in memory to reduce API calls
let contactsCache: Contact[] | null = null;

// Mock data for fallback when Supabase is not configured
const mockContacts: Contact[] = [];

// Initialize the contacts table when the module is loaded
if (typeof window !== 'undefined' && isSupabaseConfigured()) {
  ensureContactsTable().catch(error => {
    console.error('Failed to initialize contacts table:', error);
  });
}

/**
 * Load contacts from Supabase or fallback to mock data
 */
export async function loadContacts(): Promise<Contact[]> {
  // Return cached contacts if available
  if (contactsCache) {
    return contactsCache;
  }
  
  // Always prepare mock data as fallback
  const mockData = [...mockContacts];
  
  // Check if Supabase is configured
  if (isSupabaseConfigured()) {
    try {
      // Fetch contacts from Supabase
      const contacts = await fetchContactsFromDb();
      
      // If we got valid contacts, use them
      if (contacts && Array.isArray(contacts) && contacts.length > 0) {
        contactsCache = contacts;
        return contacts;
      } else {
        // No contacts returned, use mock data
        console.warn('No contacts found in Supabase, using mock data');
        contactsCache = mockData;
        return mockData;
      }
    } catch (error) {
      // Log error but don't throw it
      console.error('Error loading contacts from Supabase:', error);
      // Fall back to mock data on error
      contactsCache = mockData;
      return mockData;
    }
  } else {
    console.warn('Supabase not configured, using mock data');
    // Use mock data if Supabase is not configured
    contactsCache = mockData;
    return mockData;
  }
}

/**
 * Save contacts to Supabase
 * This is a bulk operation that's not currently used but kept for future use
 */
async function saveContacts(contacts: Contact[]): Promise<boolean> {
  // If Supabase is not configured, just update the cache
  if (!isSupabaseConfigured()) {
    contactsCache = contacts;
    return true;
  }
  
  try {
    // In a real implementation, we would use Supabase's upsert functionality
    // For now, we'll just update the cache
    contactsCache = contacts;
    return true;
  } catch (error) {
    console.error('Error saving contacts:', error);
    return false;
  }
}

/**
 * Create a new contact in Supabase or cache
 */
export async function createContact(contactData: ContactCreateInput): Promise<Contact | null> {
  // If Supabase is configured, create in database
  if (isSupabaseConfigured()) {
    try {
      const newContact = await createContactInDb(contactData);
      
      // Update cache if contact was created successfully
      if (newContact && contactsCache) {
        contactsCache = [...contactsCache, newContact];
      } else if (newContact) {
        contactsCache = [newContact];
      }
      
      return newContact;
    } catch (error) {
      console.error('Error creating contact:', error);
      return null;
    }
  } else {
    // Fall back to in-memory storage
    const contacts = await loadContacts();
    
    // Check if contact with this email already exists
    const existingContact = contacts.find(c => c.email === contactData.email);
    if (existingContact) {
      return null;
    }
    
    // Create new contact
    const newContact: Contact = {
      id: uuidv4(),
      ...contactData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add to contacts list
    const updatedContacts = [...contacts, newContact];
    
    // Update cache
    contactsCache = updatedContacts;
    
    return newContact;
  }
}

/**
 * Update an existing contact in Supabase or cache
 */
export async function updateContact(contactData: ContactUpdateInput): Promise<Contact | null> {
  // If Supabase is configured, update in database
  if (isSupabaseConfigured()) {
    try {
      const updatedContact = await updateContactInDb(contactData);
      
      // Update cache if contact was updated successfully
      if (updatedContact && contactsCache) {
        const contactIndex = contactsCache.findIndex(c => c.id === contactData.id);
        if (contactIndex !== -1) {
          const updatedContacts = [...contactsCache];
          updatedContacts[contactIndex] = updatedContact;
          contactsCache = updatedContacts;
        }
      }
      
      return updatedContact;
    } catch (error) {
      console.error(`Error updating contact with ID ${contactData.id}:`, error);
      return null;
    }
  } else {
    // Fall back to in-memory storage
    const contacts = await loadContacts();
    
    // Find contact index
    const contactIndex = contacts.findIndex(c => c.id === contactData.id);
    if (contactIndex === -1) {
      return null;
    }
    
    // Update contact
    const updatedContact: Contact = {
      ...contacts[contactIndex],
      ...contactData,
      updatedAt: new Date().toISOString(),
    };
    
    // Replace in contacts list
    const updatedContacts = [...contacts];
    updatedContacts[contactIndex] = updatedContact;
    
    // Update cache
    contactsCache = updatedContacts;
    
    return updatedContact;
  }
}

/**
 * Delete a contact from Supabase or cache
 */
export async function deleteContact(id: string): Promise<boolean> {
  // If Supabase is configured, delete from database
  if (isSupabaseConfigured()) {
    try {
      const success = await deleteContactFromDb(id);
      
      // Update cache if contact was deleted successfully
      if (success && contactsCache) {
        const contactIndex = contactsCache.findIndex(c => c.id === id);
        if (contactIndex !== -1) {
          const updatedContacts = [...contactsCache];
          updatedContacts.splice(contactIndex, 1);
          contactsCache = updatedContacts;
        }
      }
      
      return success;
    } catch (error) {
      console.error(`Error deleting contact with ID ${id}:`, error);
      return false;
    }
  } else {
    // Fall back to in-memory storage
    const contacts = await loadContacts();
    
    // Find contact index
    const contactIndex = contacts.findIndex(c => c.id === id);
    if (contactIndex === -1) {
      return false;
    }
    
    // Remove from contacts list
    const updatedContacts = [...contacts];
    updatedContacts.splice(contactIndex, 1);
    
    // Update cache
    contactsCache = updatedContacts;
    
    return true;
  }
}

/**
 * Get a contact by ID from Supabase, cache, or mock data
 */
export async function getContactById(id: string): Promise<Contact | null> {
  console.log(`Looking up contact with ID: ${id}`);
  
  // Check cache first for performance
  if (contactsCache) {
    const cachedContact = contactsCache.find(contact => contact.id === id);
    if (cachedContact) {
      console.log(`Found contact ${cachedContact.firstName} ${cachedContact.lastName} in cache`);
      return cachedContact;
    }
  }
  
  // Try Supabase if it's properly configured
  if (isSupabaseConfigured()) {
    console.log('Supabase is configured, fetching from database');
    try {
      const dbContact = await fetchContactByIdFromDb(id);
      if (dbContact) {
        console.log(`Found contact ${dbContact.firstName} ${dbContact.lastName} in database`);
        // Update cache with the fetched contact
        if (contactsCache) {
          const existingIndex = contactsCache.findIndex(c => c.id === id);
          if (existingIndex >= 0) {
            contactsCache[existingIndex] = dbContact;
          } else {
            contactsCache.push(dbContact);
          }
        }
        return dbContact;
      }
    } catch (error) {
      console.error(`Error getting contact with ID ${id} from database:`, error);
      // Don't return null here, try mock data as fallback
    }
  } else {
    console.warn('Supabase is not properly configured');
  }
  
  // Fall back to mock data if Supabase failed or is not configured
  const mockContact = mockContacts.find(contact => contact.id === id);
  if (mockContact) {
    console.log(`Found contact ${mockContact.firstName} ${mockContact.lastName} in mock data`);
    return mockContact;
  }
  
  console.warn(`Contact with ID ${id} not found in any data source`);
  return null;
}

/**
 * Get a contact by email
 */
export function getContactByEmail(email: string): Contact | null {
  try {
    // Since this function is used in the personality extraction process,
    // we need to use the cached contacts to avoid async issues
    if (!contactsCache) {
      return null;
    }
    
    const contact = contactsCache.find((c: Contact) => 
      c.email.toLowerCase() === email.toLowerCase()
    );
    return contact || null;
  } catch (error) {
    console.error('Error getting contact by email:', error);
    return null;
  }
}

/**
 * Update contact's last interaction
 */
export async function updateContactLastInteraction(email: string): Promise<Contact | null> {
  try {
    const contacts = await loadContacts();
    const index = contacts.findIndex((c: Contact) => c.email.toLowerCase() === email.toLowerCase());
    
    if (index === -1) {
      console.warn(`Contact with email ${email} not found`);
      return null;
    }
    
    const now = new Date().toISOString();
    const updatedContact: Contact = {
      ...contacts[index],
      lastInteraction: now,
      updatedAt: now
    };
    
    contacts[index] = updatedContact;
    await saveContacts(contacts);
    
    return updatedContact;
  } catch (error) {
    console.error('Error updating contact last interaction:', error);
    return null;
  }
}

/**
 * Check if the contacts module is using Supabase
 */
export function isUsingSupabase(): boolean {
  return isSupabaseConfigured();
}

/**
 * Clear contacts cache
 */
export function clearContactsCache(): void {
  contactsCache = null;
}
