import { v4 as uuidv4 } from 'uuid';
import { Contact, ContactCreateInput, ContactUpdateInput } from './types';
import { isSupabaseConfigured } from '../supabase/client';
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
const mockContacts: Contact[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-1234',
    company: 'Acme Inc',
    position: 'CEO',
    personalityType: 'Analytical',
    notes: 'Key decision maker',
    lastContact: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '555-5678',
    company: 'Tech Solutions',
    position: 'CTO',
    personalityType: 'Driver',
    notes: 'Technical background',
    lastContact: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.j@example.com',
    phone: '555-9012',
    company: 'Global Corp',
    position: 'Sales Director',
    personalityType: 'Expressive',
    notes: 'Prefers phone calls over emails',
    lastContact: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

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
  
  // Check if Supabase is configured
  if (isSupabaseConfigured()) {
    try {
      // Fetch contacts from Supabase
      const contacts = await fetchContactsFromDb();
      
      // Update cache
      contactsCache = contacts;
      return contacts;
    } catch (error) {
      console.error('Error loading contacts from Supabase:', error);
      // Fall back to mock data on error
      contactsCache = [...mockContacts];
      return [...mockContacts];
    }
  } else {
    console.warn('Supabase not configured, using mock data');
    // Use mock data if Supabase is not configured
    contactsCache = [...mockContacts];
    return [...mockContacts];
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
 * Get a contact by ID from Supabase or cache
 */
export async function getContactById(id: string): Promise<Contact | null> {
  // Check cache first
  if (contactsCache) {
    const cachedContact = contactsCache.find(contact => contact.id === id);
    if (cachedContact) return cachedContact;
  }
  
  // If Supabase is configured, fetch from database
  if (isSupabaseConfigured()) {
    try {
      return await fetchContactByIdFromDb(id);
    } catch (error) {
      console.error(`Error getting contact with ID ${id}:`, error);
      return null;
    }
  } else {
    // Fall back to mock data
    return mockContacts.find(contact => contact.id === id) || null;
  }
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
