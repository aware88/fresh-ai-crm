import { createSupabaseClient } from '../supabase/client';
import { Contact, ContactCreateInput, ContactUpdateInput } from './types';
import { v4 as uuidv4 } from 'uuid';

// Table name for contacts in Supabase
const CONTACTS_TABLE = 'contacts';

/**
 * Fetch all contacts from Supabase
 */
export async function fetchContacts(): Promise<Contact[]> {
  try {
    // Check if we can create a Supabase client
    const supabase = createSupabaseClient();
    
    if (!supabase) {
      console.warn('Could not create Supabase client');
      return [];
    }
    
    // Try to fetch contacts
    // Order by createdat (lowercase) as per actual database schema
    let query = supabase
      .from(CONTACTS_TABLE)
      .select('*');
      
    try {
      const { data: orderTest, error: orderError } = await supabase
        .from(CONTACTS_TABLE)
        .select('createdat')
        .limit(1);
        
      if (!orderError && orderTest) {
        query = query.order('createdat', { ascending: false });
      } else {
        // Default to id if createdat doesn't exist
        query = query.order('id', { ascending: false });
      }
    } catch (orderErr) {
      console.warn('Error testing order columns, using id:', orderErr);
      query = query.order('id', { ascending: false });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error fetching contacts from Supabase: ${error.message}`);
      return [];
    }
    
    if (!data) {
      console.warn('No data returned for contacts');
      return [];
    }
    
    console.log('Successfully fetched contacts from Supabase');
    // The database schema uses lowercase column names, so we need to map them to our camelCase format
    // Handle missing fields gracefully
    return data.map((item: any) => ({
      id: item.id,
      firstName: item.firstname || '',
      lastName: item.lastname || '',
      email: item.email || '',
      phone: item.phone || '',
      company: item.company || '',
      position: item.position || '',
      notes: item.notes || '',
      personalityType: item.personalitytype || '',
      personalityNotes: item.personalitynotes || '',
      status: item.status || 'active',
      createdAt: item.createdat || new Date().toISOString(),
      updatedAt: item.updatedat || new Date().toISOString(),
      lastContact: item.lastcontact || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Unexpected error fetching contacts from Supabase:', error);
    return [];
  }
}

/**
 * Fetch a single contact by ID
 */
export async function fetchContactById(id: string): Promise<Contact | null> {
  try {
    const supabase = createSupabaseClient();
    
    if (!supabase) {
      console.error('Supabase client not available');
      return null;
    }
    
    console.log(`Fetching contact with ID ${id} from Supabase`);
    const { data, error } = await supabase
      .from(CONTACTS_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned (not found)
        console.warn(`Contact with ID ${id} not found in Supabase`);
      } else {
        console.error(`Error fetching contact from Supabase: ${error.message}`);
      }
      return null;
    }
    
    if (!data) {
      console.warn(`No data returned for contact with ID ${id}`);
      return null;
    }
    
    console.log(`Successfully fetched contact from Supabase: ${data.firstname} ${data.lastname}`);
    // Convert lowercase DB fields to camelCase for our application
    const formattedContact: Contact = {
      id: data.id,
      firstName: data.firstname || '',
      lastName: data.lastname || '',
      email: data.email || '',
      phone: data.phone || '',
      company: data.company || '',
      position: data.position || '',
      notes: data.notes || '',
      personalityType: data.personalitytype || '',
      personalityNotes: data.personalitynotes || '',
      status: data.status || 'active',
      createdAt: data.createdat || new Date().toISOString(),
      updatedAt: data.updatedat || new Date().toISOString(),
      lastContact: data.lastcontact || new Date().toISOString()
    };
    return formattedContact;
  } catch (error) {
    console.error(`Error fetching contact with ID ${id}:`, error);
    return null;
  }
}

/**
 * Create a new contact in Supabase
 */
export async function createContactInDb(contact: ContactCreateInput): Promise<Contact | null> {
  try {
    const supabase = createSupabaseClient();
    
    if (!supabase) {
      console.warn('Could not create Supabase client');
      return null;
    }
    
    // Create contact with lowercase column names to match database schema
    // Generate UUID for id since it's required and not auto-generated
    const newContact = {
      id: uuidv4(), // Using uuid package for compatibility
      firstname: contact.firstName,
      lastname: contact.lastName,
      email: contact.email,
      phone: contact.phone || '',
      company: contact.company || '',
      position: contact.position || '',
      notes: contact.notes || '',
      personalitytype: contact.personalityType || '',
      personalitynotes: contact.personalityNotes || '',
      status: contact.status || 'active'
      // Let Supabase handle timestamps automatically
    };
    
    const { data, error } = await supabase
      .from(CONTACTS_TABLE)
      .insert([newContact])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating contact in Supabase:', error);
      return null;
    }
    
    // The database schema uses lowercase column names, so we need to map them to our camelCase format
    // Handle missing fields gracefully
    if (data) {
      const formattedContact: Contact = {
        id: data.id,
        firstName: data.firstname || '',
        lastName: data.lastname || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        position: data.position || '',
        notes: data.notes || '',
        personalityType: data.personalitytype || '',
        personalityNotes: data.personalitynotes || '',
        status: data.status || 'active',
        createdAt: data.createdat || new Date().toISOString(),
        updatedAt: data.updatedat || new Date().toISOString(),
        lastContact: data.lastcontact || new Date().toISOString()
      };
      return formattedContact;
    }
    return null;
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
    
    if (!supabase) {
      console.warn('Could not create Supabase client');
      return null;
    }
    
    // Update contact with lowercase column names to match database schema
    const updatedContact = {
      firstname: contact.firstName,
      lastname: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      position: contact.position,
      notes: contact.notes,
      personalitytype: contact.personalityType,
      personalitynotes: contact.personalityNotes,
      status: contact.status
      // Let Supabase handle timestamps automatically
    };
    
    const { data, error } = await supabase
      .from(CONTACTS_TABLE)
      .update(updatedContact)
      .eq('id', contact.id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating contact with ID ${contact.id}:`, error);
      return null;
    }
    
    // The database schema uses lowercase column names, so we need to map them to our camelCase format
    // Handle missing fields gracefully
    if (data) {
      const formattedContact: Contact = {
        id: data.id,
        firstName: data.firstname || '',
        lastName: data.lastname || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        position: data.position || '',
        notes: data.notes || '',
        personalityType: data.personalitytype || '',
        personalityNotes: data.personalitynotes || '',
        status: data.status || 'active',
        createdAt: data.createdat || new Date().toISOString(),
        updatedAt: data.updatedat || new Date().toISOString(),
        lastContact: data.lastcontact || new Date().toISOString()
      };
      return formattedContact;
    }
    return null;
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
    
    if (!supabase) {
      console.warn('Could not create Supabase client');
      return false;
    }
    
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
    
    if (!supabase) {
      console.warn('Could not create Supabase client');
      return;
    }
    
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
