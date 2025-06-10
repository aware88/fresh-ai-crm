import { v4 as uuidv4 } from 'uuid';
import { Contact, ContactCreateInput, ContactUpdateInput } from './types';

// Cache contacts in memory to reduce API calls
let contactsCache: Contact[] | null = null;

/**
 * Load contacts from API or return mock data
 */
export function loadContacts(): Contact[] {
  // Return cached contacts if available
  if (contactsCache) {
    return contactsCache;
  }
  
  // Use mock data instead of making an API call to avoid circular dependency
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
  
  // Update cache
  contactsCache = mockContacts;
  return mockContacts;
}

/**
 * Save contacts via API
 */
async function saveContacts(contacts: Contact[]): Promise<boolean> {
  try {
    const response = await fetch('/api/contacts/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contacts),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save contacts');
    }
    
    // Update cache
    contactsCache = contacts;
    return true;
  } catch (error) {
    console.error('Error saving contacts:', error);
    return false;
  }
}

/**
 * Create a new contact
 */
export async function createContact(contactData: ContactCreateInput & { lastInteraction?: string }): Promise<Contact | null> {
  try {
    const contacts = await loadContacts();
    
    // Check if contact with same email already exists
    const existingContact = contacts.find((c: Contact) => c.email.toLowerCase() === contactData.email.toLowerCase());
    if (existingContact) {
      console.warn(`Contact with email ${contactData.email} already exists`);
      return null;
    }
    
    const newContact: Contact = {
      id: uuidv4(),
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      email: contactData.email,
      company: contactData.company || '',
      personalityType: contactData.personalityType || '',
      personalityNotes: contactData.personalityNotes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastInteraction: contactData.lastInteraction || undefined
    };
    
    contacts.push(newContact);
    await saveContacts(contacts);
    
    return newContact;
  } catch (error) {
    console.error('Error creating contact:', error);
    return null;
  }
}

/**
 * Update an existing contact
 */
export async function updateContact(contactData: ContactUpdateInput): Promise<Contact | null> {
  try {
    const contacts = await loadContacts();
    
    const index = contacts.findIndex((c: Contact) => c.id === contactData.id);
    if (index === -1) {
      console.warn(`Contact with id ${contactData.id} not found`);
      return null;
    }
    
    // Create updated contact by merging existing data with updates
    const updatedContact: Contact = {
      ...contacts[index],
      ...contactData,
      updatedAt: new Date().toISOString()
    };
    
    // Replace the contact in the array
    contacts[index] = updatedContact;
    await saveContacts(contacts);
    
    return updatedContact;
  } catch (error) {
    console.error('Error updating contact:', error);
    return null;
  }
}

/**
 * Delete a contact by ID
 */
export async function deleteContact(id: string): Promise<boolean> {
  try {
    const contacts = await loadContacts();
    const filteredContacts = contacts.filter((c: Contact) => c.id !== id);
    
    // If no contacts were removed, the ID didn't exist
    if (filteredContacts.length === contacts.length) {
      console.warn(`Contact with id ${id} not found for deletion`);
      return false;
    }
    
    await saveContacts(filteredContacts);
    return true;
  } catch (error) {
    console.error('Error deleting contact:', error);
    return false;
  }
}

/**
 * Get a contact by ID
 */
export async function getContactById(id: string): Promise<Contact | null> {
  try {
    const contacts = await loadContacts();
    const contact = contacts.find((c: Contact) => c.id === id);
    return contact || null;
  } catch (error) {
    console.error('Error getting contact by ID:', error);
    return null;
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
