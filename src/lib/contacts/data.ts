import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Contact, ContactCreateInput, ContactUpdateInput } from './types';

const contactsFilePath = path.join(process.cwd(), 'src/data/contacts.json');

// Ensure the data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'src/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Load all contacts
export const loadContacts = (): Contact[] => {
  try {
    ensureDataDir();
    
    if (!fs.existsSync(contactsFilePath)) {
      // Create empty contacts file if it doesn't exist
      fs.writeFileSync(contactsFilePath, JSON.stringify([], null, 2));
      return [];
    }
    
    const fileContent = fs.readFileSync(contactsFilePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error loading contacts:', error);
    return [];
  }
};

// Save contacts to file
const saveContacts = (contacts: Contact[]) => {
  try {
    ensureDataDir();
    fs.writeFileSync(contactsFilePath, JSON.stringify(contacts, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving contacts:', error);
    return false;
  }
};

// Create a new contact
export const createContact = (contactData: ContactCreateInput & { lastInteraction?: string }): Contact | null => {
  try {
    const contacts = loadContacts();
    
    // Check if contact with same email already exists
    const existingContact = contacts.find(c => c.email.toLowerCase() === contactData.email.toLowerCase());
    if (existingContact) {
      return null; // Contact already exists
    }
    
    const now = new Date().toISOString();
    const newContact: Contact = {
      id: uuidv4(),
      ...contactData,
      // Set lastInteraction to the provided value or current time
      lastInteraction: contactData.lastInteraction || now,
      createdAt: now,
      updatedAt: now
    };
    
    contacts.push(newContact);
    saveContacts(contacts);
    
    return newContact;
  } catch (error) {
    console.error('Error creating contact:', error);
    return null;
  }
};

// Update an existing contact
export const updateContact = (contactData: ContactUpdateInput): Contact | null => {
  try {
    const contacts = loadContacts();
    const contactIndex = contacts.findIndex(c => c.id === contactData.id);
    
    if (contactIndex === -1) {
      return null; // Contact not found
    }
    
    const updatedContact = {
      ...contacts[contactIndex],
      ...contactData,
      updatedAt: new Date().toISOString()
    };
    
    contacts[contactIndex] = updatedContact;
    saveContacts(contacts);
    
    return updatedContact;
  } catch (error) {
    console.error('Error updating contact:', error);
    return null;
  }
};

// Delete a contact
export const deleteContact = (id: string): boolean => {
  try {
    const contacts = loadContacts();
    const filteredContacts = contacts.filter(c => c.id !== id);
    
    if (filteredContacts.length === contacts.length) {
      return false; // Contact not found
    }
    
    saveContacts(filteredContacts);
    return true;
  } catch (error) {
    console.error('Error deleting contact:', error);
    return false;
  }
};

// Get a contact by ID
export const getContactById = (id: string): Contact | null => {
  try {
    const contacts = loadContacts();
    const contact = contacts.find(c => c.id === id);
    return contact || null;
  } catch (error) {
    console.error('Error getting contact by ID:', error);
    return null;
  }
};

// Get a contact by email
export const getContactByEmail = (email: string): Contact | null => {
  try {
    const contacts = loadContacts();
    const contact = contacts.find(c => c.email.toLowerCase() === email.toLowerCase());
    return contact || null;
  } catch (error) {
    console.error('Error getting contact by email:', error);
    return null;
  }
};

// Update contact's last interaction
export const updateContactLastInteraction = (email: string): Contact | null => {
  try {
    const contacts = loadContacts();
    const contactIndex = contacts.findIndex(c => c.email.toLowerCase() === email.toLowerCase());
    
    if (contactIndex === -1) {
      return null; // Contact not found
    }
    
    const now = new Date().toISOString();
    const updatedContact = {
      ...contacts[contactIndex],
      lastInteraction: now,
      updatedAt: now
    };
    
    contacts[contactIndex] = updatedContact;
    saveContacts(contacts);
    
    return updatedContact;
  } catch (error) {
    console.error('Error updating contact last interaction:', error);
    return null;
  }
};
