import { createSupabaseClient } from '../supabase/client';
import { Contact, ContactCreateInput, ContactUpdateInput } from './types';

// Table name for contacts in Supabase
const CONTACTS_TABLE = 'contacts';

/**
 * Fetch all contacts from Supabase
 */
export async function fetchContacts(): Promise<Contact[]> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from(CONTACTS_TABLE)
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching contacts from Supabase:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to fetch contacts:', error);
    return [];
  }
}

/**
 * Fetch a single contact by ID
 */
export async function fetchContactById(id: string): Promise<Contact | null> {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from(CONTACTS_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching contact with ID ${id}:`, error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Failed to fetch contact with ID ${id}:`, error);
    return null;
  }
}

/**
 * Create a new contact in Supabase
 */
export async function createContactInDb(contact: ContactCreateInput): Promise<Contact | null> {
  try {
    const supabase = createSupabaseClient();
    
    // Check if contact with this email already exists
    const { data: existingContact } = await supabase
      .from(CONTACTS_TABLE)
      .select('id')
      .eq('email', contact.email)
      .maybeSingle();
    
    if (existingContact) {
      console.warn(`Contact with email ${contact.email} already exists`);
      return null;
    }
    
    // Create new contact with timestamp
    const newContact = {
      ...contact,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(CONTACTS_TABLE)
      .insert([newContact])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating contact in Supabase:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Failed to create contact:', error);
    return null;
  }
}

/**
 * Update an existing contact in Supabase
 */
export async function updateContactInDb(contact: ContactUpdateInput): Promise<Contact | null> {
  try {
    const supabase = createSupabaseClient();
    
    // Add updated timestamp
    const updatedContact = {
      ...contact,
      updatedAt: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from(CONTACTS_TABLE)
      .update(updatedContact)
      .eq('id', contact.id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating contact with ID ${contact.id}:`, error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Failed to update contact with ID ${contact.id}:`, error);
    return null;
  }
}

/**
 * Delete a contact from Supabase
 */
export async function deleteContactFromDb(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    
    const { error } = await supabase
      .from(CONTACTS_TABLE)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting contact with ID ${id}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to delete contact with ID ${id}:`, error);
    return false;
  }
}

/**
 * Initialize the contacts table if it doesn't exist
 * This is a helper function for development/testing
 */
export async function ensureContactsTable(): Promise<void> {
  // This is just a simple check - in a real app, you would use migrations
  try {
    const supabase = createSupabaseClient();
    
    // Try to query the table to see if it exists
    const { error } = await supabase
      .from(CONTACTS_TABLE)
      .select('id')
      .limit(1);
    
    // If there's an error with the table not existing, we would handle it here
    // But Supabase handles table creation through the dashboard, so this is mostly
    // just a connection test
    if (error) {
      console.error('Error checking contacts table:', error);
    }
  } catch (error) {
    console.error('Failed to check contacts table:', error);
  }
}
