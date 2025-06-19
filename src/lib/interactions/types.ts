/**
 * Types for interactions with contacts
 * Note: Database column names use camelCase (e.g., createdat, updatedat)
 */

export type InteractionType = 'email' | 'call' | 'meeting' | 'note' | 'other';

/**
 * Represents an interaction as stored in the database
 * Column names match the actual database schema (camelCase)
 */
export interface InteractionDB {
  id: string;
  contact_id: string;
  type: InteractionType;
  title: string;
  content?: string;
  subject?: string;
  sentiment?: string;
  personalityinsights?: string;
  interaction_date: string; // ISO string
  date: string; // ISO string (duplicate of interaction_date)
  createdat: string; // ISO string
  updatedat: string; // ISO string
  created_by?: string;
  metadata?: Record<string, any>;
}

/**
 * Normalized interaction interface for use in the application
 * This provides a consistent interface regardless of database column naming
 */
export interface Interaction {
  id: string;
  contact_id: string;
  type: InteractionType;
  title: string;
  content?: string;
  subject?: string;
  sentiment?: string;
  personalityInsights?: string;
  interaction_date: string; // ISO string
  created_at: string; // ISO string
  updated_at: string; // ISO string
  created_by?: string;
  metadata?: Record<string, any>;
}

/**
 * Input for creating a new interaction
 */
export interface InteractionCreateInput {
  contact_id: string;
  type: InteractionType;
  title: string;
  content?: string;
  subject?: string;
  interaction_date?: string; // Optional, will default to now
  created_by?: string; // User ID who created the interaction
  metadata?: Record<string, any>;
}

/**
 * Input for updating an existing interaction
 */
export interface InteractionUpdateInput {
  id: string;
  contact_id?: string;
  type?: InteractionType;
  title?: string;
  content?: string;
  subject?: string;
  sentiment?: string;
  interaction_date?: string;
  metadata?: Record<string, any>;
}

/**
 * Helper function to convert database interaction to normalized interaction
 */
export function normalizeInteraction(dbInteraction: InteractionDB): Interaction {
  return {
    id: dbInteraction.id,
    contact_id: dbInteraction.contact_id,
    type: dbInteraction.type,
    title: dbInteraction.title,
    content: dbInteraction.content,
    subject: dbInteraction.subject,
    sentiment: dbInteraction.sentiment,
    personalityInsights: dbInteraction.personalityinsights,
    interaction_date: dbInteraction.interaction_date,
    created_at: dbInteraction.createdat,
    updated_at: dbInteraction.updatedat,
    created_by: dbInteraction.created_by,
    metadata: dbInteraction.metadata
  };
}

/**
 * Helper function to convert normalized interaction to database format
 */
export function denormalizeInteraction(interaction: Partial<Interaction>): Partial<InteractionDB> {
  const result: Partial<InteractionDB> = {};
  
  if (interaction.id !== undefined) result.id = interaction.id;
  if (interaction.contact_id !== undefined) result.contact_id = interaction.contact_id;
  if (interaction.type !== undefined) result.type = interaction.type;
  if (interaction.title !== undefined) result.title = interaction.title;
  if (interaction.content !== undefined) result.content = interaction.content;
  if (interaction.subject !== undefined) result.subject = interaction.subject;
  if (interaction.sentiment !== undefined) result.sentiment = interaction.sentiment;
  if (interaction.personalityInsights !== undefined) result.personalityinsights = interaction.personalityInsights;
  if (interaction.interaction_date !== undefined) {
    result.interaction_date = interaction.interaction_date;
    result.date = interaction.interaction_date;
  }
  if (interaction.created_at !== undefined) result.createdat = interaction.created_at;
  if (interaction.updated_at !== undefined) result.updatedat = interaction.updated_at;
  if (interaction.created_by !== undefined) result.created_by = interaction.created_by;
  if (interaction.metadata !== undefined) result.metadata = interaction.metadata;
  
  return result;
}
