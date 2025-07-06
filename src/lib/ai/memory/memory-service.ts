import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { calculateCosineSimilarity, findSimilarItems } from './vector-utils';
import { OpenAIEmbeddings } from '../embeddings/openai-embeddings';

// Types for AI Memory System
export interface AIMemory {
  id: string;
  organization_id: string;
  user_id?: string;
  content: string;
  embedding_json: number[];
  metadata: Record<string, any>;
  memory_type: string;
  importance_score: number;
  created_at: string;
  updated_at: string;
}

export interface CreateMemoryParams {
  organization_id: string;
  user_id?: string;
  content: string;
  memory_type: string;
  metadata?: Record<string, any>;
  importance_score?: number;
}

export interface SearchMemoriesParams {
  organization_id: string;
  query: string;
  memory_type?: string;
  min_importance?: number;
  limit?: number;
  similarity_threshold?: number;
}

export interface MemoryRelationship {
  id: string;
  organization_id: string;
  source_memory_id: string;
  target_memory_id: string;
  relationship_type: string;
  strength: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateRelationshipParams {
  organization_id: string;
  source_memory_id: string;
  target_memory_id: string;
  relationship_type: string;
  strength?: number;
  metadata?: Record<string, any>;
}

export interface MemoryAccessRecord {
  id: string;
  organization_id: string;
  memory_id: string;
  user_id?: string;
  access_type: string;
  context?: string;
  outcome_recorded: boolean;
  outcome_positive?: boolean;
  outcome_details?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Service for managing AI memories without using pgvector
 */
export class MemoryService {
  private supabase: SupabaseClient;
  private embeddings: OpenAIEmbeddings;

  constructor(supabase: SupabaseClient, embeddings: OpenAIEmbeddings) {
    this.supabase = supabase;
    this.embeddings = embeddings;
  }

  /**
   * Create a new memory with embedding
   */
  async createMemory(params: CreateMemoryParams): Promise<AIMemory> {
    const { organization_id, user_id, content, memory_type, metadata = {}, importance_score = 0.5 } = params;

    // Generate embedding for the content
    const embedding = await this.embeddings.getEmbedding(content);

    // Insert memory with JSON embedding
    const { data, error } = await this.supabase
      .from('ai_memories')
      .insert({
        id: uuidv4(),
        organization_id,
        user_id,
        content,
        embedding_json: embedding, // Store as JSON array instead of vector
        metadata,
        memory_type,
        importance_score,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create memory: ${error.message}`);
    }

    return data as AIMemory;
  }

  /**
   * Search for memories by semantic similarity
   */
  async searchMemories(params: SearchMemoriesParams): Promise<AIMemory[]> {
    const { 
      organization_id, 
      query, 
      memory_type, 
      min_importance = 0, 
      limit = 10,
      similarity_threshold = 0.7
    } = params;

    // Generate embedding for the query
    const queryEmbedding = await this.embeddings.getEmbedding(query);

    // Build the filter
    let filter = this.supabase
      .from('ai_memories')
      .select('*')
      .eq('organization_id', organization_id)
      .gte('importance_score', min_importance);

    // Add memory type filter if provided
    if (memory_type) {
      filter = filter.eq('memory_type', memory_type);
    }

    // Get candidate memories
    const { data: memories, error } = await filter
      .order('created_at', { ascending: false })
      .limit(Math.min(100, limit * 5)); // Fetch more than needed for filtering

    if (error) {
      throw new Error(`Failed to search memories: ${error.message}`);
    }

    if (!memories || memories.length === 0) {
      return [];
    }

    // Calculate similarity and filter/sort in application code
    const similarMemories = findSimilarItems<AIMemory>(
      queryEmbedding,
      memories as AIMemory[],
      {
        threshold: similarity_threshold,
        limit: limit
      }
    );

    return similarMemories;
  }

  /**
   * Get a memory by ID
   */
  async getMemory(id: string, organization_id: string): Promise<AIMemory | null> {
    const { data, error } = await this.supabase
      .from('ai_memories')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organization_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Memory not found
      }
      throw new Error(`Failed to get memory: ${error.message}`);
    }

    return data as AIMemory;
  }

  /**
   * Update a memory
   */
  async updateMemory(
    id: string, 
    organization_id: string, 
    updates: Partial<Omit<AIMemory, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>
  ): Promise<AIMemory> {
    // If content is updated, regenerate the embedding
    if (updates.content) {
      updates.embedding_json = await this.embeddings.getEmbedding(updates.content);
    }

    const { data, error } = await this.supabase
      .from('ai_memories')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('organization_id', organization_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update memory: ${error.message}`);
    }

    return data as AIMemory;
  }

  /**
   * Delete a memory
   */
  async deleteMemory(id: string, organization_id: string): Promise<void> {
    const { error } = await this.supabase
      .from('ai_memories')
      .delete()
      .eq('id', id)
      .eq('organization_id', organization_id);

    if (error) {
      throw new Error(`Failed to delete memory: ${error.message}`);
    }
  }

  /**
   * Create a relationship between two memories
   */
  async createRelationship(params: CreateRelationshipParams): Promise<MemoryRelationship> {
    const { 
      organization_id, 
      source_memory_id, 
      target_memory_id, 
      relationship_type, 
      strength = 0.5, 
      metadata = {} 
    } = params;

    const { data, error } = await this.supabase
      .from('ai_memory_relationships')
      .insert({
        id: uuidv4(),
        organization_id,
        source_memory_id,
        target_memory_id,
        relationship_type,
        strength,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create relationship: ${error.message}`);
    }

    return data as MemoryRelationship;
  }

  /**
   * Record memory access
   */
  async recordAccess(
    memory_id: string,
    organization_id: string,
    access_type: string,
    user_id?: string,
    context?: string
  ): Promise<MemoryAccessRecord> {
    const { data, error } = await this.supabase
      .from('ai_memory_access')
      .insert({
        id: uuidv4(),
        organization_id,
        memory_id,
        user_id,
        access_type,
        context,
        outcome_recorded: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record access: ${error.message}`);
    }

    return data as MemoryAccessRecord;
  }

  /**
   * Record outcome for a memory access
   */
  async recordAccessOutcome(
    access_id: string,
    organization_id: string,
    outcome_positive: boolean,
    outcome_details?: string
  ): Promise<MemoryAccessRecord> {
    const { data, error } = await this.supabase
      .from('ai_memory_access')
      .update({
        outcome_recorded: true,
        outcome_positive,
        outcome_details,
        updated_at: new Date().toISOString()
      })
      .eq('id', access_id)
      .eq('organization_id', organization_id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record access outcome: ${error.message}`);
    }

    return data as MemoryAccessRecord;
  }
}
