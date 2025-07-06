import { SupabaseClient } from '@supabase/supabase-js';
import { AIMemory, AIMemoryType } from './ai-memory-service';
import { MemoryService } from './memory-service';
import { HybridMemorySearch, RankedMemory } from './hybrid-memory-search';
import { OpenAIEmbeddings } from './embeddings/openai-embeddings';
import { OpenAI } from 'openai';

/**
 * Type of memory relationship
 */
export enum MemoryRelationshipType {
  CAUSED = 'caused',
  RELATED_TO = 'related_to',
  CONTRADICTS = 'contradicts',
  SUPPORTS = 'supports',
  FOLLOWS = 'follows',
  PRECEDES = 'precedes'
}

/**
 * Memory relationship
 */
export interface MemoryRelationship {
  id: string;
  source_memory_id: string;
  target_memory_id: string;
  relationship_type: MemoryRelationshipType;
  organization_id: string;
  user_id?: string;
  created_at: string;
  metadata?: any;
}

/**
 * Memory with its relationships
 */
export interface MemoryWithRelationships extends AIMemory {
  relationships: MemoryRelationship[];
}

/**
 * Memory chain connecting multiple memories
 */
export interface MemoryChain {
  /**
   * Chain ID
   */
  id: string;
  
  /**
   * Chain name/description
   */
  name: string;
  
  /**
   * Memories in the chain
   */
  memories: MemoryWithRelationships[];
  
  /**
   * Reasoning explanation for the chain
   */
  reasoning: string;
  
  /**
   * Confidence score for the chain (0-1)
   */
  confidence: number;
  
  /**
   * Chain creation timestamp
   */
  created_at: string;
}

/**
 * Configuration for memory chain service
 */
export interface MemoryChainConfig {
  /**
   * Maximum chain length
   */
  maxChainLength: number;
  
  /**
   * Minimum confidence threshold for chains (0-1)
   */
  minConfidenceThreshold: number;
  
  /**
   * Maximum number of chains to generate
   */
  maxChainsToGenerate: number;
}

/**
 * Default configuration for memory chains
 */
const DEFAULT_CHAIN_CONFIG: MemoryChainConfig = {
  maxChainLength: 5,
  minConfidenceThreshold: 0.7,
  maxChainsToGenerate: 3
};

/**
 * Service for creating and managing memory chains
 */
export class MemoryChainService {
  private openai: OpenAI;
  
  /**
   * Constructor for MemoryChainService
   * 
   * @param supabase - Supabase client for database operations
   * @param memoryService - Memory service for memory operations
   * @param searchService - Hybrid memory search service
   * @param embeddings - OpenAI embeddings service
   * @param openaiApiKey - OpenAI API key
   */
  constructor(
    private supabase: SupabaseClient,
    private memoryService: MemoryService,
    private searchService: HybridMemorySearch,
    private embeddings: OpenAIEmbeddings,
    openaiApiKey: string
  ) {
    this.openai = new OpenAI({
      apiKey: openaiApiKey
    });
  }
  
  /**
   * Get configuration for memory chains based on organization
   * 
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Memory chain configuration
   */
  async getConfigForOrganization(organizationId: string): Promise<MemoryChainConfig> {
    // In the future, this could fetch organization-specific configurations
    // For now, return the default configuration
    return DEFAULT_CHAIN_CONFIG;
  }
  
  /**
   * Create memory chains based on a query or context
   * 
   * @param query - Query or context to create chains for
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID for personalization
   * @returns Array of memory chains
   */
  async createMemoryChains(
    query: string,
    organizationId: string,
    userId?: string
  ): Promise<MemoryChain[]> {
    const config = await this.getConfigForOrganization(organizationId);
    
    // Get relevant memories using hybrid search
    const relevantMemories = await this.searchService.search(
      query,
      organizationId,
      userId
    );
    
    // Filter to most relevant memories
    const topMemories = relevantMemories
      .filter(memory => memory.relevanceScore >= config.minConfidenceThreshold)
      .slice(0, 20); // Limit to 20 memories for chain creation
    
    if (topMemories.length < 2) {
      // Need at least 2 memories to form a chain
      return [];
    }
    
    // Get relationships for these memories
    const memoriesWithRelationships = await this.getMemoriesWithRelationships(
      topMemories.map(m => m.id),
      organizationId
    );
    
    // Generate chains using AI reasoning
    const chains = await this.generateChains(
      memoriesWithRelationships,
      query,
      config,
      organizationId,
      userId
    );
    
    return chains;
  }
  
  /**
   * Get memories with their relationships
   * 
   * @param memoryIds - Array of memory IDs
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Array of memories with their relationships
   */
  private async getMemoriesWithRelationships(
    memoryIds: string[],
    organizationId: string
  ): Promise<MemoryWithRelationships[]> {
    if (memoryIds.length === 0) {
      return [];
    }
    
    // Get memories
    const { data: memories, error } = await this.supabase
      .from('memories')
      .select('*')
      .eq('organization_id', organizationId)
      .in('id', memoryIds);
    
    if (error || !memories) {
      console.error('Error fetching memories:', error);
      return [];
    }
    
    // Get relationships for these memories
    const { data: relationships, error: relError } = await this.supabase
      .from('memory_relationships')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`source_memory_id.in.(${memoryIds.join(',')}),target_memory_id.in.(${memoryIds.join(',')})`);
    
    if (relError) {
      console.error('Error fetching relationships:', relError);
      return memories.map(memory => ({ ...memory, relationships: [] }));
    }
    
    // Attach relationships to memories
    return memories.map(memory => {
      const memoryRelationships = relationships?.filter(rel => 
        rel.source_memory_id === memory.id || rel.target_memory_id === memory.id
      ) || [];
      
      return {
        ...memory,
        relationships: memoryRelationships
      };
    });
  }
  
  /**
   * Generate memory chains using AI reasoning
   * 
   * @param memories - Memories with relationships
   * @param query - Original query or context
   * @param config - Chain configuration
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID
   * @returns Array of memory chains
   */
  private async generateChains(
    memories: MemoryWithRelationships[],
    query: string,
    config: MemoryChainConfig,
    organizationId: string,
    userId?: string
  ): Promise<MemoryChain[]> {
    // Prepare memory data for the AI
    const memoryData = memories.map(memory => ({
      id: memory.id,
      type: memory.type,
      content: memory.content,
      created_at: memory.created_at,
      relationships: memory.relationships.map(rel => ({
        type: rel.relationship_type,
        connected_to: rel.source_memory_id === memory.id ? rel.target_memory_id : rel.source_memory_id
      }))
    }));
    
    // Create prompt for OpenAI
    const prompt = `
      You are an AI memory reasoning system. Your task is to analyze these memories and create logical chains that connect them in meaningful ways.
      Each chain should tell a coherent story or reveal an insight related to the query: "${query}"
      
      Memories:
      ${JSON.stringify(memoryData, null, 2)}
      
      Create up to ${config.maxChainsToGenerate} memory chains. Each chain should:
      1. Include between 2 and ${config.maxChainLength} memories
      2. Have a clear logical connection between memories
      3. Include a reasoning explanation for why these memories form a chain
      4. Include a confidence score (0-1) for how certain you are about this chain
      
      Return your answer as a JSON array of chains with this structure:
      [
        {
          "name": "Chain name/description",
          "memory_ids": ["id1", "id2", ...],
          "reasoning": "Detailed explanation of the logical connection",
          "confidence": 0.85
        }
      ]
    `;
    
    try {
      // Call OpenAI to generate chains
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an AI memory reasoning system that creates logical chains between memories." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });
      
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        return [];
      }
      
      // Parse the JSON response
      try {
        const parsedChains = JSON.parse(content);
        
        // Convert to MemoryChain format
        const chains: MemoryChain[] = [];
        
        for (const chain of parsedChains) {
          if (!chain.memory_ids || chain.memory_ids.length < 2) {
            continue;
          }
          
          // Get full memory objects for the chain
          const chainMemories = memories.filter(m => chain.memory_ids.includes(m.id));
          
          if (chainMemories.length >= 2) {
            chains.push({
              id: `chain_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              name: chain.name,
              memories: chainMemories,
              reasoning: chain.reasoning,
              confidence: chain.confidence,
              created_at: new Date().toISOString()
            });
          }
        }
        
        // Filter by confidence threshold and limit number of chains
        return chains
          .filter(chain => chain.confidence >= config.minConfidenceThreshold)
          .slice(0, config.maxChainsToGenerate);
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      return [];
    }
  }
  
  /**
   * Find contradictions between memories
   * 
   * @param memories - Array of memories to check for contradictions
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Array of contradiction pairs with explanation
   */
  async findContradictions(
    memories: AIMemory[],
    organizationId: string
  ): Promise<{
    memory1: AIMemory;
    memory2: AIMemory;
    explanation: string;
    confidence: number;
  }[]> {
    if (memories.length < 2) {
      return [];
    }
    
    // Prepare memory data for the AI
    const memoryData = memories.map(memory => ({
      id: memory.id,
      type: memory.type,
      content: memory.content,
      created_at: memory.created_at
    }));
    
    // Create prompt for OpenAI
    const prompt = `
      You are an AI memory consistency checker. Your task is to analyze these memories and identify any contradictions between them.
      
      Memories:
      ${JSON.stringify(memoryData, null, 2)}
      
      Identify any pairs of memories that contradict each other. For each contradiction:
      1. Specify the two memory IDs that contradict
      2. Explain the nature of the contradiction
      3. Provide a confidence score (0-1) for how certain you are about this contradiction
      
      Return your answer as a JSON array with this structure:
      [
        {
          "memory1_id": "id1",
          "memory2_id": "id2",
          "explanation": "Detailed explanation of the contradiction",
          "confidence": 0.85
        }
      ]
      
      If there are no contradictions, return an empty array.
    `;
    
    try {
      // Call OpenAI to find contradictions
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an AI memory consistency checker that identifies contradictions between memories." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        return [];
      }
      
      // Parse the JSON response
      try {
        const parsedContradictions = JSON.parse(content);
        
        // Convert to contradiction format
        const contradictions: {
          memory1: AIMemory;
          memory2: AIMemory;
          explanation: string;
          confidence: number;
        }[] = [];
        
        for (const contradiction of parsedContradictions) {
          const memory1 = memories.find(m => m.id === contradiction.memory1_id);
          const memory2 = memories.find(m => m.id === contradiction.memory2_id);
          
          if (memory1 && memory2) {
            contradictions.push({
              memory1,
              memory2,
              explanation: contradiction.explanation,
              confidence: contradiction.confidence
            });
          }
        }
        
        // Filter by confidence threshold
        return contradictions.filter(c => c.confidence >= 0.7);
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      return [];
    }
  }
  
  /**
   * Create a relationship between two memories
   * 
   * @param sourceMemoryId - Source memory ID
   * @param targetMemoryId - Target memory ID
   * @param relationshipType - Type of relationship
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID
   * @param metadata - Optional metadata for the relationship
   * @returns Created relationship or null on error
   */
  async createRelationship(
    sourceMemoryId: string,
    targetMemoryId: string,
    relationshipType: MemoryRelationshipType,
    organizationId: string,
    userId?: string,
    metadata?: any
  ): Promise<MemoryRelationship | null> {
    // Check if relationship already exists
    const { data: existingRel, error: checkError } = await this.supabase
      .from('memory_relationships')
      .select('*')
      .eq('source_memory_id', sourceMemoryId)
      .eq('target_memory_id', targetMemoryId)
      .eq('organization_id', organizationId)
      .single();
    
    if (existingRel) {
      // Relationship already exists, update it
      const { data: updatedRel, error: updateError } = await this.supabase
        .from('memory_relationships')
        .update({
          relationship_type: relationshipType,
          metadata: metadata || existingRel.metadata
        })
        .eq('id', existingRel.id)
        .select('*')
        .single();
      
      if (updateError) {
        console.error('Error updating relationship:', updateError);
        return null;
      }
      
      return updatedRel;
    }
    
    // Create new relationship
    const { data: newRel, error: createError } = await this.supabase
      .from('memory_relationships')
      .insert({
        source_memory_id: sourceMemoryId,
        target_memory_id: targetMemoryId,
        relationship_type: relationshipType,
        organization_id: organizationId,
        user_id: userId || null,
        metadata: metadata || {}
      })
      .select('*')
      .single();
    
    if (createError) {
      console.error('Error creating relationship:', createError);
      return null;
    }
    
    return newRel;
  }
  
  /**
   * Store a memory chain in the database
   * 
   * @param chain - Memory chain to store
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID
   * @returns Stored chain ID or null on error
   */
  async storeMemoryChain(
    chain: MemoryChain,
    organizationId: string,
    userId?: string
  ): Promise<string | null> {
    // First, create relationships between memories in the chain
    for (let i = 0; i < chain.memories.length - 1; i++) {
      const sourceMemory = chain.memories[i];
      const targetMemory = chain.memories[i + 1];
      
      await this.createRelationship(
        sourceMemory.id,
        targetMemory.id,
        MemoryRelationshipType.FOLLOWS,
        organizationId,
        userId,
        { chain_id: chain.id }
      );
    }
    
    // Create an insight memory to represent the chain
    const insightMemory = {
      type: AIMemoryType.INSIGHT,
      content: `${chain.name}\n\n${chain.reasoning}`,
      organization_id: organizationId,
      user_id: userId || null,
      metadata: {
        is_chain: true,
        chain_id: chain.id,
        chain_confidence: chain.confidence,
        memory_ids: chain.memories.map(m => m.id)
      }
    };
    
    // Store the insight
    const { data: storedInsight, error } = await this.supabase
      .from('memories')
      .insert(insightMemory)
      .select('id')
      .single();
    
    if (error || !storedInsight) {
      console.error('Error storing memory chain:', error);
      return null;
    }
    
    // Create relationships between the insight and all memories in the chain
    for (const memory of chain.memories) {
      await this.createRelationship(
        storedInsight.id,
        memory.id,
        MemoryRelationshipType.RELATED_TO,
        organizationId,
        userId,
        { chain_id: chain.id }
      );
    }
    
    return chain.id;
  }
}
