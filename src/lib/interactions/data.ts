import { 
  Interaction, 
  InteractionDB,
  InteractionCreateInput, 
  InteractionUpdateInput,
  normalizeInteraction,
  denormalizeInteraction
} from './types';
import { supabase, isSupabaseConfigured, getUserId } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// For testing purposes only - should be removed in production
function testUserId(): string {
  return process.env.NODE_ENV === 'development' ? '00000000-0000-0000-0000-000000000000' : '';
}

const TABLE_NAME = 'interactions';

// Cache interactions in memory to reduce API calls
let interactionsCache: Interaction[] | null = null;

/**
 * Load all interactions from Supabase
 */
export async function loadInteractions(): Promise<Interaction[]> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('Supabase is not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('interaction_date', { ascending: false });
    
    if (error) throw error;
    
    // Normalize the data from DB format to application format
    const normalizedData = (data || []).map(item => normalizeInteraction(item as InteractionDB));
    interactionsCache = normalizedData;
    return normalizedData;
  } catch (error) {
    console.error('Failed to load interactions:', error);
    return [];
  }
}

/**
 * Load interactions for a specific contact
 */
export async function loadInteractionsByContactId(contactId: string): Promise<Interaction[]> {
  if (!contactId || !isSupabaseConfigured() || !supabase) {
    console.error('Missing contact ID or Supabase is not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('contact_id', contactId)
      .order('interaction_date', { ascending: false });
    
    if (error) throw error;
    
    // Normalize the data from DB format to application format
    return (data || []).map(item => normalizeInteraction(item as InteractionDB));
  } catch (error) {
    console.error(`Failed to load interactions for contact ${contactId}:`, error);
    return [];
  }
}

/**
 * Create a new interaction
 */
export async function createInteraction(interactionData: InteractionCreateInput): Promise<Interaction | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('Supabase is not configured');
    return null;
  }

  try {
    // Get the current user ID for created_by field
    const userId = await getUserId();
    
    if (!userId && !interactionData.created_by) {
      throw new Error('User ID is required for creating interactions. Please sign in.');
    }
    
    // Create a normalized interaction first
    const now = new Date().toISOString();
    const normalizedInteraction: Interaction = {
      ...interactionData as any,
      id: uuidv4(),
      interaction_date: interactionData.interaction_date || now,
      created_at: now,
      updated_at: now,
      // Ensure created_by is always set - this is critical for RLS policies
      created_by: interactionData.created_by || userId || testUserId()
    };

    // Convert to database format
    const dbInteraction = denormalizeInteraction(normalizedInteraction);
    
    // Add date field (duplicate of interaction_date)
    if (dbInteraction.interaction_date) {
      dbInteraction.date = dbInteraction.interaction_date;
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(dbInteraction)
      .select()
      .single();
    
    if (error) throw error;
    
    // Invalidate cache
    interactionsCache = null;
    
    // Return normalized data
    return normalizeInteraction(data as InteractionDB);
  } catch (error) {
    console.error('Failed to create interaction:', error);
    return null;
  }
}

/**
 * Update an existing interaction
 */
export async function updateInteraction(updates: InteractionUpdateInput): Promise<Interaction | null> {
  if (!updates.id || !isSupabaseConfigured() || !supabase) {
    console.error('Missing interaction ID or Supabase is not configured');
    return null;
  }

  try {
    const { id, ...updateData } = updates;
    
    // Create a normalized update with the current time
    const normalizedUpdate: Partial<Interaction> = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };
    
    // Convert to database format
    const dbUpdate = denormalizeInteraction(normalizedUpdate);
    
    // Update date field if interaction_date is being updated
    if (dbUpdate.interaction_date) {
      dbUpdate.date = dbUpdate.interaction_date;
    }
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Invalidate cache
    interactionsCache = null;
    
    // Return normalized data
    return normalizeInteraction(data as InteractionDB);
  } catch (error) {
    console.error(`Failed to update interaction ${updates.id}:`, error);
    return null;
  }
}

/**
 * Delete an interaction
 */
export async function deleteInteraction(id: string): Promise<boolean> {
  if (!id || !isSupabaseConfigured() || !supabase) {
    console.error('Missing interaction ID or Supabase is not configured');
    return false;
  }

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Invalidate cache
    interactionsCache = null;
    
    return true;
  } catch (error) {
    console.error(`Failed to delete interaction ${id}:`, error);
    return false;
  }
}

/**
 * Get an interaction by ID
 */
export async function getInteractionById(id: string): Promise<Interaction | null> {
  if (!id || !isSupabaseConfigured() || !supabase) {
    console.error('Missing interaction ID or Supabase is not configured');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    // Return normalized data
    return data ? normalizeInteraction(data as InteractionDB) : null;
  } catch (error) {
    console.error(`Failed to fetch interaction ${id}:`, error);
    return null;
  }
}

/**
 * Clear interactions cache
 */
export function clearInteractionsCache(): void {
  interactionsCache = null;
}

/**
 * Check if the interactions module is using Supabase
 */
export function isUsingSupabase(): boolean {
  return isSupabaseConfigured() && supabase !== null;
}
