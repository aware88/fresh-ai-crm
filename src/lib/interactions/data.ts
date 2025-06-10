import { v4 as uuidv4 } from 'uuid';
import { Interaction, InteractionCreateInput, InteractionUpdateInput } from './types';
import { isSupabaseConfigured } from '../supabase/client';
import {
  fetchInteractions as fetchInteractionsFromDb,
  fetchInteractionsByContactId as fetchInteractionsByContactIdFromDb,
  fetchInteractionById as fetchInteractionByIdFromDb,
  createInteractionInDb,
  updateInteractionInDb,
  deleteInteractionFromDb,
  ensureInteractionsTable
} from './supabase';

// Cache interactions in memory to reduce API calls
let interactionsCache: Interaction[] | null = null;

// Mock data for fallback when Supabase is not configured
const mockInteractions: Interaction[] = [
  {
    id: '1',
    contact_id: '1', // John Doe
    type: 'email',
    subject: 'Initial Contact',
    content: 'Hello John, I wanted to reach out about our new product...',
    sentiment: 'positive',
    personalityInsights: JSON.stringify({
      traits: ['analytical', 'detail-oriented'],
      communication_style: 'formal'
    }),
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    contact_id: '2', // Jane Smith
    type: 'call',
    subject: 'Technical Discussion',
    content: 'Discussed technical requirements and integration options',
    sentiment: 'neutral',
    personalityInsights: JSON.stringify({
      traits: ['driver', 'technical'],
      communication_style: 'direct'
    }),
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initialize the interactions table when the module is loaded
if (typeof window !== 'undefined' && isSupabaseConfigured()) {
  ensureInteractionsTable().catch(error => {
    console.error('Failed to initialize interactions table:', error);
  });
}

/**
 * Load all interactions from Supabase or fallback to mock data
 */
export async function loadInteractions(): Promise<Interaction[]> {
  // Return cached interactions if available
  if (interactionsCache) {
    return interactionsCache;
  }
  
  // Check if Supabase is configured
  if (isSupabaseConfigured()) {
    try {
      // Fetch interactions from Supabase
      const interactions = await fetchInteractionsFromDb();
      
      // Update cache
      interactionsCache = interactions;
      return interactions;
    } catch (error) {
      console.error('Error loading interactions from Supabase:', error);
      // Fall back to mock data on error
      interactionsCache = [...mockInteractions];
      return [...mockInteractions];
    }
  } else {
    console.warn('Supabase not configured, using mock interactions data');
    // Use mock data if Supabase is not configured
    interactionsCache = [...mockInteractions];
    return [...mockInteractions];
  }
}

/**
 * Load interactions for a specific contact
 */
export async function loadInteractionsByContactId(contactId: string): Promise<Interaction[]> {
  // Check if Supabase is configured
  if (isSupabaseConfigured()) {
    try {
      // Fetch interactions from Supabase
      return await fetchInteractionsByContactIdFromDb(contactId);
    } catch (error) {
      console.error(`Error loading interactions for contact ${contactId} from Supabase:`, error);
      // Fall back to mock data on error
      return mockInteractions.filter(interaction => interaction.contact_id === contactId);
    }
  } else {
    console.warn('Supabase not configured, using mock interactions data');
    // Use mock data if Supabase is not configured
    return mockInteractions.filter(interaction => interaction.contact_id === contactId);
  }
}

/**
 * Create a new interaction in Supabase or cache
 */
export async function createInteraction(interactionData: InteractionCreateInput): Promise<Interaction | null> {
  // If Supabase is configured, create in database
  if (isSupabaseConfigured()) {
    try {
      const newInteraction = await createInteractionInDb(interactionData);
      
      // Update cache if interaction was created successfully
      if (newInteraction && interactionsCache) {
        interactionsCache = [...interactionsCache, newInteraction];
      } else if (newInteraction) {
        interactionsCache = [newInteraction];
      }
      
      return newInteraction;
    } catch (error) {
      console.error('Error creating interaction:', error);
      return null;
    }
  } else {
    // Fall back to in-memory storage
    const interactions = await loadInteractions();
    
    // Create new interaction
    const newInteraction: Interaction = {
      id: uuidv4(),
      ...interactionData,
      date: interactionData.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add to interactions list
    const updatedInteractions = [...interactions, newInteraction];
    
    // Update cache
    interactionsCache = updatedInteractions;
    
    return newInteraction;
  }
}

/**
 * Update an existing interaction in Supabase or cache
 */
export async function updateInteraction(interactionData: InteractionUpdateInput): Promise<Interaction | null> {
  // If Supabase is configured, update in database
  if (isSupabaseConfigured()) {
    try {
      const updatedInteraction = await updateInteractionInDb(interactionData);
      
      // Update cache if interaction was updated successfully
      if (updatedInteraction && interactionsCache) {
        const interactionIndex = interactionsCache.findIndex(i => i.id === interactionData.id);
        if (interactionIndex !== -1) {
          const updatedInteractions = [...interactionsCache];
          updatedInteractions[interactionIndex] = updatedInteraction;
          interactionsCache = updatedInteractions;
        }
      }
      
      return updatedInteraction;
    } catch (error) {
      console.error(`Error updating interaction with ID ${interactionData.id}:`, error);
      return null;
    }
  } else {
    // Fall back to in-memory storage
    const interactions = await loadInteractions();
    
    // Find interaction index
    const interactionIndex = interactions.findIndex(i => i.id === interactionData.id);
    if (interactionIndex === -1) {
      return null;
    }
    
    // Update interaction
    const updatedInteraction: Interaction = {
      ...interactions[interactionIndex],
      ...interactionData,
      updatedAt: new Date().toISOString(),
    };
    
    // Replace in interactions list
    const updatedInteractions = [...interactions];
    updatedInteractions[interactionIndex] = updatedInteraction;
    
    // Update cache
    interactionsCache = updatedInteractions;
    
    return updatedInteraction;
  }
}

/**
 * Delete an interaction from Supabase or cache
 */
export async function deleteInteraction(id: string): Promise<boolean> {
  // If Supabase is configured, delete from database
  if (isSupabaseConfigured()) {
    try {
      const success = await deleteInteractionFromDb(id);
      
      // Update cache if interaction was deleted successfully
      if (success && interactionsCache) {
        const interactionIndex = interactionsCache.findIndex(i => i.id === id);
        if (interactionIndex !== -1) {
          const updatedInteractions = [...interactionsCache];
          updatedInteractions.splice(interactionIndex, 1);
          interactionsCache = updatedInteractions;
        }
      }
      
      return success;
    } catch (error) {
      console.error(`Error deleting interaction with ID ${id}:`, error);
      return false;
    }
  } else {
    // Fall back to in-memory storage
    const interactions = await loadInteractions();
    
    // Find interaction index
    const interactionIndex = interactions.findIndex(i => i.id === id);
    if (interactionIndex === -1) {
      return false;
    }
    
    // Remove from interactions list
    const updatedInteractions = [...interactions];
    updatedInteractions.splice(interactionIndex, 1);
    
    // Update cache
    interactionsCache = updatedInteractions;
    
    return true;
  }
}

/**
 * Get an interaction by ID from Supabase or cache
 */
export async function getInteractionById(id: string): Promise<Interaction | null> {
  // Check cache first
  if (interactionsCache) {
    const cachedInteraction = interactionsCache.find(interaction => interaction.id === id);
    if (cachedInteraction) return cachedInteraction;
  }
  
  // If Supabase is configured, fetch from database
  if (isSupabaseConfigured()) {
    try {
      return await fetchInteractionByIdFromDb(id);
    } catch (error) {
      console.error(`Error getting interaction with ID ${id}:`, error);
      return null;
    }
  } else {
    // Fall back to mock data
    return mockInteractions.find(interaction => interaction.id === id) || null;
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
  return isSupabaseConfigured();
}
