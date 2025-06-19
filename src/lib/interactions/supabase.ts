import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import type { Interaction, InteractionCreateInput, InteractionUpdateInput } from './types';

const TABLE_NAME = 'interactions';

/**
 * Create a new interaction
 */
export async function createInteraction(interactionData: InteractionCreateInput): Promise<Interaction | null> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return null;
  }
  
  // Prepare the new interaction with required fields
  const newInteraction = {
    ...interactionData,
    id: uuidv4(),
    interaction_date: interactionData.interaction_date || new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(newInteraction)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating interaction:', error);
    return null;
  }
  
  return data;
}

/**
 * Get interactions by contact ID
 */
export async function getInteractionsByContactId(contactId: string): Promise<Interaction[]> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return [];
  }
  
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('contact_id', contactId)
    .order('interaction_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching interactions:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Update an interaction
 */
export async function updateInteraction(updates: InteractionUpdateInput): Promise<Interaction | null> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return null;
  }
  
  const { id, ...updatesWithoutId } = updates;
  
  // Add updated_at timestamp
  const updateData = {
    ...updatesWithoutId,
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating interaction:', error);
    return null;
  }
  
  return data;
}

/**
 * Delete an interaction
 */
export async function deleteInteraction(id: string): Promise<boolean> {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return false;
  }
  
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting interaction:', error);
    return false;
  }
  
  return true;
}
