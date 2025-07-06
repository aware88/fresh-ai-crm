/**
 * AI Memory Service
 * 
 * This service provides functionality for storing, retrieving, and managing AI memories.
 * It handles embedding generation, semantic search, relationship management, and access tracking.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { Configuration, OpenAIApi } from 'openai';

// Types for AI Memory System
export type AIMemory = {
  id?: string;
  organization_id: string;
  user_id?: string;
  content: string;
  content_embedding?: number[];
  metadata: Record<string, any>;
  memory_type: AIMemoryType;
  importance_score: number;
  created_at?: string;
  updated_at?: string;
};

export type AIMemoryRelationship = {
  id?: string;
  organization_id: string;
  source_memory_id: string;
  target_memory_id: string;
  relationship_type: AIMemoryRelationshipType;
  strength: number;
  created_at?: string;
  updated_at?: string;
};

export type AIMemoryAccess = {
  id?: string;
  organization_id: string;
  memory_id: string;
  user_id?: string;
  access_type: AIMemoryAccessType;
  context?: string;
  outcome?: string;
  outcome_score?: number;
  created_at?: string;
};

export enum AIMemoryType {
  DECISION = 'decision',
  OBSERVATION = 'observation',
  FEEDBACK = 'feedback',
  INTERACTION = 'interaction',
  TACTIC = 'tactic',
  PREFERENCE = 'preference',
  INSIGHT = 'insight',
}

export enum AIMemoryRelationshipType {
  CAUSED = 'caused',
  RELATED_TO = 'related_to',
  CONTRADICTS = 'contradicts',
  SUPPORTS = 'supports',
  FOLLOWS = 'follows',
  PRECEDES = 'precedes',
}

export enum AIMemoryAccessType {
  RETRIEVE = 'retrieve',
  SEARCH = 'search',
  ANALYZE = 'analyze',
  APPLY = 'apply',
}

export type AIMemorySearchParams = {
  query: string;
  memory_types?: AIMemoryType[];
  min_importance?: number;
  max_results?: number;
  time_range?: {
    start?: Date;
    end?: Date;
  };
  metadata_filters?: Record<string, any>;
};

export type AIMemorySearchResult = {
  memory: AIMemory;
  similarity_score: number;
  related_memories?: AIMemory[];
};

/**
 * AI Memory Service class for managing AI memory operations
 */
export class AIMemoryService {
  private supabase;
  private openai;
  
  constructor() {
    // Initialize Supabase client
    const { createClient } = require('../../supabaseClient');
    this.supabase = createClient();
    
    // Initialize OpenAI client
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
  }
  
  /**
   * Generate embedding for text content using OpenAI API
   * 
   * @param content - Text content to generate embedding for
   * @returns Vector embedding as number array
   */
  async generateEmbedding(content: string): Promise<number[]> {
    try {
      const response = await this.openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: content,
      });
      
      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }
  
  /**
   * Store a new memory with generated embedding
   * 
   * @param memory - Memory object to store
   * @returns Stored memory with ID
   */
  async storeMemory(memory: AIMemory): Promise<AIMemory> {
    try {
      // Generate embedding for the memory content
      const embedding = await this.generateEmbedding(memory.content);
      
      // Store memory with embedding
      const { data, error } = await this.supabase
        .from('ai_memories')
        .insert({
          organization_id: memory.organization_id,
          user_id: memory.user_id,
          content: memory.content,
          content_embedding: embedding,
          metadata: memory.metadata,
          memory_type: memory.memory_type,
          importance_score: memory.importance_score,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error storing memory:', error);
        throw new Error('Failed to store memory');
      }
      
      return data;
    } catch (error) {
      console.error('Error in storeMemory:', error);
      throw error;
    }
  }
  
  /**
   * Search for memories using semantic similarity
   * 
   * @param params - Search parameters
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Array of memory search results
   */
  async searchMemories(
    params: AIMemorySearchParams,
    organizationId: string
  ): Promise<AIMemorySearchResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(params.query);
      
      // Build the query
      let query = this.supabase
        .from('ai_memories')
        .select('*')
        .eq('organization_id', organizationId)
        .order('content_embedding <-> $1', { ascending: true })
        .limit(params.max_results || 10);
      
      // Apply filters if provided
      if (params.memory_types && params.memory_types.length > 0) {
        query = query.in('memory_type', params.memory_types);
      }
      
      if (params.min_importance) {
        query = query.gte('importance_score', params.min_importance);
      }
      
      if (params.time_range) {
        if (params.time_range.start) {
          query = query.gte('created_at', params.time_range.start.toISOString());
        }
        if (params.time_range.end) {
          query = query.lte('created_at', params.time_range.end.toISOString());
        }
      }
      
      // Execute the query with the embedding parameter
      const { data: memories, error } = await query.bind({ $1: queryEmbedding });
      
      if (error) {
        console.error('Error searching memories:', error);
        throw new Error('Failed to search memories');
      }
      
      // Record access for each retrieved memory
      for (const memory of memories) {
        await this.recordMemoryAccess({
          organization_id: organizationId,
          memory_id: memory.id,
          access_type: AIMemoryAccessType.SEARCH,
          context: `Query: ${params.query}`,
        });
      }
      
      // Calculate similarity scores and format results
      const results: AIMemorySearchResult[] = await Promise.all(
        memories.map(async (memory) => {
          // Calculate cosine similarity (simplified)
          const similarityScore = this.calculateCosineSimilarity(
            queryEmbedding,
            memory.content_embedding
          );
          
          // Get related memories
          const relatedMemories = await this.getRelatedMemories(memory.id, organizationId);
          
          return {
            memory,
            similarity_score: similarityScore,
            related_memories: relatedMemories,
          };
        })
      );
      
      return results;
    } catch (error) {
      console.error('Error in searchMemories:', error);
      throw error;
    }
  }
  
  /**
   * Calculate cosine similarity between two vectors
   * 
   * @param vec1 - First vector
   * @param vec2 - Second vector
   * @returns Similarity score between 0 and 1
   */
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }
    
    return dotProduct / (mag1 * mag2);
  }
  
  /**
   * Get memories related to a specific memory
   * 
   * @param memoryId - ID of the memory to find relationships for
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Array of related memories
   */
  async getRelatedMemories(memoryId: string, organizationId: string): Promise<AIMemory[]> {
    try {
      // Get relationships where this memory is the source
      const { data: sourceRelationships, error: sourceError } = await this.supabase
        .from('ai_memory_relationships')
        .select('target_memory_id')
        .eq('source_memory_id', memoryId)
        .eq('organization_id', organizationId);
      
      if (sourceError) {
        console.error('Error getting source relationships:', sourceError);
        return [];
      }
      
      // Get relationships where this memory is the target
      const { data: targetRelationships, error: targetError } = await this.supabase
        .from('ai_memory_relationships')
        .select('source_memory_id')
        .eq('target_memory_id', memoryId)
        .eq('organization_id', organizationId);
      
      if (targetError) {
        console.error('Error getting target relationships:', targetError);
        return [];
      }
      
      // Combine and deduplicate related memory IDs
      const relatedMemoryIds = [
        ...sourceRelationships.map(rel => rel.target_memory_id),
        ...targetRelationships.map(rel => rel.source_memory_id)
      ];
      
      const uniqueMemoryIds = [...new Set(relatedMemoryIds)];
      
      if (uniqueMemoryIds.length === 0) {
        return [];
      }
      
      // Fetch the related memories
      const { data: relatedMemories, error: memoriesError } = await this.supabase
        .from('ai_memories')
        .select('*')
        .in('id', uniqueMemoryIds)
        .eq('organization_id', organizationId);
      
      if (memoriesError) {
        console.error('Error getting related memories:', memoriesError);
        return [];
      }
      
      return relatedMemories;
    } catch (error) {
      console.error('Error in getRelatedMemories:', error);
      return [];
    }
  }
  
  /**
   * Connect two memories with a relationship
   * 
   * @param relationship - Relationship object to create
   * @returns Created relationship
   */
  async connectMemories(relationship: AIMemoryRelationship): Promise<AIMemoryRelationship> {
    try {
      const { data, error } = await this.supabase
        .from('ai_memory_relationships')
        .insert({
          organization_id: relationship.organization_id,
          source_memory_id: relationship.source_memory_id,
          target_memory_id: relationship.target_memory_id,
          relationship_type: relationship.relationship_type,
          strength: relationship.strength,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error connecting memories:', error);
        throw new Error('Failed to connect memories');
      }
      
      return data;
    } catch (error) {
      console.error('Error in connectMemories:', error);
      throw error;
    }
  }
  
  /**
   * Record memory access with optional outcome
   * 
   * @param access - Memory access object to record
   * @returns Created access record
   */
  async recordMemoryAccess(access: AIMemoryAccess): Promise<AIMemoryAccess> {
    try {
      const { data, error } = await this.supabase
        .from('ai_memory_access')
        .insert({
          organization_id: access.organization_id,
          memory_id: access.memory_id,
          user_id: access.user_id,
          access_type: access.access_type,
          context: access.context,
          outcome: access.outcome,
          outcome_score: access.outcome_score,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error recording memory access:', error);
        throw new Error('Failed to record memory access');
      }
      
      return data;
    } catch (error) {
      console.error('Error in recordMemoryAccess:', error);
      throw error;
    }
  }
  
  /**
   * Update memory outcome after it has been used
   * 
   * @param accessId - ID of the access record to update
   * @param outcome - Outcome description
   * @param outcomeScore - Outcome score (0-1)
   * @returns Updated access record
   */
  async updateMemoryOutcome(
    accessId: string,
    outcome: string,
    outcomeScore: number
  ): Promise<AIMemoryAccess> {
    try {
      const { data, error } = await this.supabase
        .from('ai_memory_access')
        .update({
          outcome,
          outcome_score: outcomeScore,
        })
        .eq('id', accessId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating memory outcome:', error);
        throw new Error('Failed to update memory outcome');
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateMemoryOutcome:', error);
      throw error;
    }
  }
  
  /**
   * Update memory importance based on access patterns and outcomes
   * 
   * @param memoryId - ID of the memory to update
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Updated memory
   */
  async updateMemoryImportance(memoryId: string, organizationId: string): Promise<AIMemory> {
    try {
      // Get access records for this memory
      const { data: accessRecords, error: accessError } = await this.supabase
        .from('ai_memory_access')
        .select('*')
        .eq('memory_id', memoryId)
        .eq('organization_id', organizationId);
      
      if (accessError) {
        console.error('Error getting memory access records:', accessError);
        throw new Error('Failed to get memory access records');
      }
      
      // Calculate new importance score based on access patterns and outcomes
      let importanceScore = 0.5; // Default importance
      
      if (accessRecords && accessRecords.length > 0) {
        // Factor 1: Frequency of access
        const accessFrequency = Math.min(accessRecords.length / 10, 1); // Cap at 1
        
        // Factor 2: Average outcome score
        const outcomesWithScores = accessRecords.filter(record => record.outcome_score !== null);
        let avgOutcomeScore = 0.5;
        if (outcomesWithScores.length > 0) {
          avgOutcomeScore = outcomesWithScores.reduce(
            (sum, record) => sum + (record.outcome_score || 0),
            0
          ) / outcomesWithScores.length;
        }
        
        // Factor 3: Recency of access
        const mostRecentAccess = new Date(
          Math.max(...accessRecords.map(record => new Date(record.created_at).getTime()))
        );
        const now = new Date();
        const daysSinceLastAccess = (now.getTime() - mostRecentAccess.getTime()) / (1000 * 3600 * 24);
        const recencyScore = Math.max(0, 1 - (daysSinceLastAccess / 30)); // 0 if older than 30 days
        
        // Combine factors with weights
        importanceScore = (
          accessFrequency * 0.3 + // 30% weight for frequency
          avgOutcomeScore * 0.5 + // 50% weight for outcome
          recencyScore * 0.2      // 20% weight for recency
        );
      }
      
      // Update the memory importance score
      const { data, error } = await this.supabase
        .from('ai_memories')
        .update({
          importance_score: importanceScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memoryId)
        .eq('organization_id', organizationId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating memory importance:', error);
        throw new Error('Failed to update memory importance');
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateMemoryImportance:', error);
      throw error;
    }
  }
}
