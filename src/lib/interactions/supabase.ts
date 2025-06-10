import { v4 as uuidv4 } from 'uuid';
import { createSupabaseClient, isSupabaseConfigured } from '../supabase/client';
import { Interaction, InteractionCreateInput, InteractionUpdateInput } from './types';

// Table name in Supabase
const INTERACTIONS_TABLE = 'interactions';

/**
 * Ensure the interactions table exists in Supabase
 * This is mainly for development and testing
 */
export async function ensureInteractionsTable(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  
  try {
    const supabase = createSupabaseClient();
    // Check if the table exists by trying to select from it
    const { error } = await supabase
      .from(INTERACTIONS_TABLE)
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error checking interactions table:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring interactions table:', error);
    return false;
  }
}

/**
 * Fetch all interactions from Supabase
 */
export async function fetchInteractions(): Promise<Interaction[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from(INTERACTIONS_TABLE)
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching interactions:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Fetch interactions for a specific contact
 */
export async function fetchInteractionsByContactId(contactId: string): Promise<Interaction[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from(INTERACTIONS_TABLE)
    .select('*')
    .eq('contact_id', contactId)
    .order('date', { ascending: false });
  
  if (error) {
    console.error(`Error fetching interactions for contact ${contactId}:`, error);
    throw error;
  }
  
  return data || [];
}

/**
 * Fetch a specific interaction by ID
 */
export async function fetchInteractionById(id: string): Promise<Interaction | null> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from(INTERACTIONS_TABLE)
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching interaction ${id}:`, error);
    throw error;
  }
  
  return data || null;
}

/**
 * Create a new interaction in Supabase
 */
export async function createInteractionInDb(interactionData: InteractionCreateInput): Promise<Interaction | null> {
  const supabase = createSupabaseClient();
  
  // Generate a UUID for the new interaction
  const id = uuidv4();
  
  // Prepare the interaction data with timestamps
  const now = new Date().toISOString();
  const newInteraction: Interaction = {
    id,
    ...interactionData,
    date: interactionData.date || now,
    createdAt: now,
    updatedAt: now
  };
  
  // Insert into Supabase
  const { data, error } = await supabase
    .from(INTERACTIONS_TABLE)
    .insert(newInteraction)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating interaction:', error);
    throw error;
  }
  
  return data || null;
}

/**
 * Update an existing interaction in Supabase
 */
export async function updateInteractionInDb(interactionData: InteractionUpdateInput): Promise<Interaction | null> {
  const supabase = createSupabaseClient();
  
  // Prepare the update data with updated timestamp
  const updateData = {
    ...interactionData,
    updatedAt: new Date().toISOString()
  };
  
  // Update in Supabase
  const { data, error } = await supabase
    .from(INTERACTIONS_TABLE)
    .update(updateData)
    .eq('id', interactionData.id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating interaction ${interactionData.id}:`, error);
    throw error;
  }
  
  return data || null;
}

/**
 * Delete an interaction from Supabase
 */
export async function deleteInteractionFromDb(id: string): Promise<boolean> {
  const supabase = createSupabaseClient();
  
  // Delete from Supabase
  const { error } = await supabase
    .from(INTERACTIONS_TABLE)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting interaction ${id}:`, error);
    throw error;
  }
  
  return true;
}
