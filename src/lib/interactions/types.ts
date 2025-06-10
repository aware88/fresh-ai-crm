/**
 * Types for interactions with contacts
 */

export type InteractionType = 'email' | 'call' | 'meeting' | 'note' | 'other';

export interface Interaction {
  id: string;
  contact_id: string;
  type: InteractionType;
  subject: string;
  content: string;
  sentiment?: string;
  personalityInsights?: string; // JSON string with AI analysis
  date: string; // ISO string
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface InteractionCreateInput {
  contact_id: string;
  type: InteractionType;
  subject: string;
  content: string;
  sentiment?: string;
  personalityInsights?: string;
  date?: string; // Optional, will default to now
}

export interface InteractionUpdateInput {
  id: string;
  contact_id?: string;
  type?: InteractionType;
  subject?: string;
  content?: string;
  sentiment?: string;
  personalityInsights?: string;
  date?: string;
}
