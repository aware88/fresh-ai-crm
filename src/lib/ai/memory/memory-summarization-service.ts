/**
 * Memory Summarization Service
 * 
 * This service provides functionality for summarizing and consolidating AI memories.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { MemoryService } from './memory-service';
import { AIMemory, AIMemoryType } from './ai-memory-service';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import { OpenAIEmbeddings } from '../embeddings/openai-embeddings';

// Types for Memory Summarization
export interface SummarizationConfig {
  maxMemoriesPerSummary: number;
  minMemoriesForSummary: number;
  summarizationThreshold?: number; // similarity threshold for grouping
  similarityThreshold?: number; // alternative name used in tests
  maxSummaryLength?: number;
  subscriptionTier: string;
  featureFlags?: {
    enableMemorySummarization: boolean;
  };
  enableMemorySummarization?: boolean;
}

export interface MemoryGroup {
  memories: AIMemory[];
  centroid?: number[];
  memoryType?: AIMemoryType;
}

export interface SummarizationResult {
  success: boolean;
  summaryId?: string;
  summaryContent?: string;
  originalMemoryIds?: string[];
  error?: string;
  summary?: AIMemory;
  originalMemories?: AIMemory[];
  metadata: {
    compressionRatio?: number;
    processingTime?: number;
  };
}

export interface BatchSummarizationResult {
  totalMemories: number;
  totalSummaries: number;
  summaries: SummarizationResult[];
  errors?: string[];
  processingTime: number;
  memoriesProcessed: number;
  summaryIds: string[];
  summariesCreated: number;
}

/**
 * Service responsible for summarizing AI memories based on type and content similarity.
 * Provides methods for clustering, summarizing, and storing memory summaries.
 */
export class MemorySummarizationService {
  private supabase: SupabaseClient;
  private openai: OpenAI;
  private memoryService: MemoryService;
  private defaultConfig: SummarizationConfig;

  /**
   * Creates a new instance of the MemorySummarizationService.
   * 
   * @param supabase - The Supabase client for database operations
   * @param openaiApiKey - OpenAI API key for generating summaries
   * @param memoryService - Optional memory service instance (creates new one if not provided)
   * @param config - Optional configuration overrides
   */
  constructor(
    supabase: SupabaseClient,
    openaiApiKey: string,
    memoryService?: MemoryService,
    config?: Partial<SummarizationConfig>
  ) {
    this.supabase = supabase;
    
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    
    // Create OpenAIEmbeddings instance for MemoryService
    const embeddings = new OpenAIEmbeddings(openaiApiKey);
    
    // Initialize or use provided memory service
    this.memoryService = memoryService || new MemoryService(supabase, embeddings);
    
    // Default configuration
    this.defaultConfig = {
      maxMemoriesPerSummary: 10,
      minMemoriesForSummary: 3,
      summarizationThreshold: 0.8,
      maxSummaryLength: 500,
      subscriptionTier: 'free',
      ...config
    };
  }

  /**
   * Get configuration for summarization based on organization subscription
   * 
   * @param organizationId - Organization ID
   * @returns Summarization configuration
   */
  async getConfigForOrganization(organizationId: string): Promise<SummarizationConfig> {
    try {
      const { data: subscription, error: subError } = await this.supabase
        .from('organization_subscriptions')
        .select('subscription_plan_id')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .single();
      
      if (subError || !subscription) {
        console.warn('No active subscription found, using default config', subError);
        return this.defaultConfig;
      }
      
      const { data: plan, error: planError } = await this.supabase
        .from('subscription_plans')
        .select('features')
        .eq('id', subscription.subscription_plan_id)
        .single();
      
      if (planError || !plan || !plan.features) {
        console.warn('No plan features found, using default config', planError);
        return this.defaultConfig;
      }
      
      const features = plan.features;
      
      // Extract memory summarization configuration from plan features
      return {
        ...this.defaultConfig,
        maxMemoriesPerSummary: features.memory_summarization?.max_memories_per_summary || this.defaultConfig.maxMemoriesPerSummary,
        minMemoriesForSummary: features.memory_summarization?.min_memories_for_summary || this.defaultConfig.minMemoriesForSummary,
        summarizationThreshold: features.memory_summarization?.summarization_threshold || this.defaultConfig.summarizationThreshold,
        maxSummaryLength: features.memory_summarization?.max_summary_length || this.defaultConfig.maxSummaryLength,
        subscriptionTier: features.subscription_tier || this.defaultConfig.subscriptionTier,
        featureFlags: {
          enableMemorySummarization: features.enableMemorySummarization !== false
        }
      };
    } catch (error) {
      console.error('Error in getConfigForOrganization:', error);
      return this.defaultConfig;
    }
  }

  /**
   * Groups memories by their memory type
   * 
   * @param memories - Array of AIMemory objects to cluster
   * @returns A record mapping memory types to arrays of memories
   */
  clusterMemoriesByType(memories: AIMemory[]): Record<string, AIMemory[]> {
    const clusters: Partial<Record<AIMemoryType, AIMemory[]>> = {};
    
    for (const memory of memories) {
      if (!memory.memory_type) continue;
      
      const memoryType = memory.memory_type as AIMemoryType;
      
      if (!clusters[memoryType]) {
        clusters[memoryType] = [];
      }
      
      clusters[memoryType]!.push(memory);
    }
    
    return clusters as Record<AIMemoryType, AIMemory[]>;
  }

  /**
   * Clusters memories based on embedding similarity using cosine similarity
   * 
   * @param memories - Array of AIMemory objects to cluster
   * @param threshold - Similarity threshold for clustering (default: 0.8)
   * @returns Promise resolving to array of memory clusters (each cluster is an array of memories)
   */
  async clusterMemoriesBySimilarity(
    memories: AIMemory[],
    threshold: number = 0.8
  ): Promise<AIMemory[][]> {
    const memoriesWithEmbeddings = memories.filter(m => m.content_embedding && m.content_embedding.length > 0);
    const clusters: AIMemory[][] = [];
    const assigned = new Set<string>();
    
    for (const memory of memoriesWithEmbeddings) {
      if (!memory.id || assigned.has(memory.id)) continue;
      
      const cluster: AIMemory[] = [memory];
      assigned.add(memory.id);
      
      for (const other of memoriesWithEmbeddings) {
        if (!other.id || assigned.has(other.id) || memory.id === other.id) continue;
        
        const similarity = this.calculateCosineSimilarity(
          memory.content_embedding!, 
          other.content_embedding!
        );
        
        if (similarity >= threshold) {
          cluster.push(other);
          assigned.add(other.id);
        }
      }
      
      clusters.push(cluster);
    }
    
    return clusters;
  }

  /**
   * Calculates the cosine similarity between two vectors
   * 
   * @param vec1 - First vector as number array
   * @param vec2 - Second vector as number array
   * @returns Cosine similarity value between -1 and 1
   * @throws Error if vectors have different dimensions
   */
  calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimensions');
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
    
    const magnitude = mag1 * mag2;
    
    if (magnitude === 0) {
      return 0;
    }
    
    return dotProduct / magnitude;
  }

  /**
   * Calculates the centroid (average vector) of a set of vectors
   * 
   * @param vectors - Array of vectors to calculate centroid for
   * @returns Centroid vector
   * @throws Error if input array is empty
   */
  calculateCentroid(vectors: number[][]): number[] {
    if (vectors.length === 0) {
      throw new Error('Cannot calculate centroid of empty embeddings set');
    }
    
    const dimensions = vectors[0].length;
    const centroid = new Array(dimensions).fill(0);
    
    for (const vector of vectors) {
      if (vector.length !== dimensions) {
        throw new Error('All embeddings must have the same dimensions');
      }
      
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += vector[i];
      }
    }
    
    for (let i = 0; i < dimensions; i++) {
      centroid[i] /= vectors.length;
    }
    
    return centroid;
  }

  /**
   * Summarize a group of memories
   * 
   * @param group - Group of memories to summarize
   * @param config - Summarization configuration
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID
   * @returns Summarization result
   */
  async summarizeMemoryGroup(
    group: MemoryGroup,
    config: SummarizationConfig,
    organizationId: string,
    userId?: string
  ): Promise<SummarizationResult | null> {
    if (!group.memories || group.memories.length === 0) {
      console.error('Cannot summarize empty memory group');
      return {
        success: false,
        error: 'Empty memory group',
        metadata: {
          compressionRatio: 0,
          processingTime: 0
        }
      };
    }

    try {
      // Determine memory type from group
      let memoryType: AIMemoryType;
      if (group.memoryType) {
        memoryType = group.memoryType;
      } else {
        // Use most common type in group
        const typeCounts = new Map<AIMemoryType, number>();
        for (const memory of group.memories) {
          if (!memory.memory_type) continue;
          const type = memory.memory_type as AIMemoryType;
          typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
        }
        let maxCount = 0;
        memoryType = AIMemoryType.OBSERVATION; // Default
        
        // Convert to array before iterating to avoid downlevelIteration issues
        const typeEntries = Array.from(typeCounts.entries());
        for (const [type, count] of typeEntries) {
          if (count > maxCount) {
            maxCount = count;
            memoryType = type;
          }
        }
      }

      // Extract content from memories
      const contents = group.memories.map(m => m.content);
      const maxLength = config.maxSummaryLength || 500;
      
      // Generate summary
      const summary = await this.generateSummary(contents, memoryType, maxLength);
      
      if (!summary) {
        return {
          success: false,
          error: 'Failed to generate summary',
          originalMemories: group.memories,
          metadata: {
            compressionRatio: 0,
            processingTime: 0
          }
        };
      }
      
      // Create summary memory
      const summaryMemory: AIMemory = {
        id: uuidv4(),
        organization_id: organizationId,
        user_id: userId,
        content: summary,
        memory_type: memoryType,
        importance_score: 0.8, // Default high importance for summaries
        created_at: new Date().toISOString(),
        metadata: {
          is_summary: true,
          summarized_count: group.memories.length,
          original_memory_ids: group.memories.map(m => m.id).filter(Boolean)
        }
      };
      
      // Store summary
      const storedSummary = await this.storeSummaryAsMemory(
        summaryMemory, 
        group.memories, 
        organizationId,
        userId
      );

      if (!storedSummary) {
        return {
          success: false,
          error: 'Failed to store summary',
          summaryContent: summary,
          originalMemories: group.memories,
          metadata: {
            compressionRatio: 0,
            processingTime: 0
          }
        };
      }
      
      // Calculate compression ratio
      const originalLength = group.memories.reduce(
        (sum, m) => sum + (m.content?.length || 0), 
        0
      );
      const compressionRatio = summary.length / (originalLength || 1);
      
      return {
        success: true,
        summary: storedSummary,
        originalMemories: group.memories,
        summaryId: storedSummary.id,
        summaryContent: summary,
        originalMemoryIds: group.memories.map(m => m.id).filter(Boolean) as string[],
        metadata: {
          compressionRatio,
          processingTime: 0 // Will be updated by caller
        }
      };
    } catch (error) {
      console.error('Error summarizing memory group:', error);
      return {
        success: false,
        error: 'Error during summarization process',
        metadata: {
          processingTime: 0
        }
      };
    }
  }

  /**
   * Store a summary as a memory and create relationships to original memories
   * 
   * @param summary - Summary memory to store
   * @param originalMemories - Original memories that were summarized
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID
   * @returns Stored summary memory or null on error
   */
  async storeSummaryAsMemory(
    summary: AIMemory,
    originalMemories: AIMemory[],
    organizationId: string,
    userId?: string
  ): Promise<AIMemory | null> {
    try {
      // Ensure summary has required fields
      const summaryToStore = {
        ...summary,
        organization_id: organizationId,
        user_id: userId,
        importance_score: summary.importance_score || 0.8, // Ensure importance score is set
        metadata: {
          ...(summary.metadata || {}),
          is_summary: true,
          summarized_count: originalMemories.length,
          original_memory_ids: originalMemories.map(m => m.id).filter(Boolean)
        }
      };
      
      // Store summary memory
      const { data: storedSummary, error } = await this.supabase
        .from('memories')
        .insert(summaryToStore)
        .select()
        .single();
      
      if (error || !storedSummary) {
        console.error('Error storing summary memory:', error);
        return null;
      }
      
      // Create relationships to original memories
      const relationships = originalMemories
        .filter(m => m.id) // Only memories with IDs
        .map(memory => ({
          id: uuidv4(),
          organization_id: organizationId,
          source_id: storedSummary.id,
          target_id: memory.id,
          relationship_type: 'summarizes',
          metadata: {
            created_at: new Date().toISOString()
          }
        }));
      
      if (relationships.length > 0) {
        const { error: relError } = await this.supabase
          .from('memory_relationships')
          .insert(relationships);
        
        if (relError) {
          console.error('Error creating relationships:', relError);
          // Don't fail the whole operation, just log the error
        }
        
        // Update original memories with summary_id
        for (const memory of originalMemories) {
          if (!memory.id) continue;
          
          await this.supabase
            .from('memories')
            .update({ summary_id: storedSummary.id })
            .eq('id', memory.id)
            .eq('organization_id', organizationId);
        }
      }
      
      return storedSummary;
    } catch (error) {
      console.error('Error in storeSummaryAsMemory:', error);
      return null;
    }
  }

  /**
   * Summarize all eligible memories for an organization
   * 
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID for user-specific memories
   * @returns Batch summarization result
   */
  async summarizeAllMemories(
    organizationId: string,
    userId?: string
  ): Promise<BatchSummarizationResult> {
    const startTime = Date.now();
    
    try {
      // Get configuration
      const config = await this.getConfigForOrganization(organizationId);
      
      // Check if feature is enabled
      if (config.featureFlags && config.featureFlags.enableMemorySummarization === false) {
        return {
          totalMemories: 0,
          totalSummaries: 0,
          summaries: [],
          summaryIds: [],
          processingTime: Date.now() - startTime,
          memoriesProcessed: 0,
          summariesCreated: 0
        };
      }
      
      // Get eligible memories
      const memories = await this.getMemoriesForSummarization(organizationId, userId);
      
      if (memories.length < config.minMemoriesForSummary) {
        return {
          totalMemories: memories.length,
          totalSummaries: 0,
          summaries: [],
          summaryIds: [],
          processingTime: Date.now() - startTime,
          memoriesProcessed: memories.length,
          summariesCreated: 0
        };
      }
      
      // Cluster memories by type
      const memoriesByType = this.clusterMemoriesByType(memories);
      
      // Summarize each cluster
      const results: SummarizationResult[] = [];
      const summaryIds: string[] = [];
      
      for (const [type, typeMemories] of Object.entries(memoriesByType)) {
        // Skip if too few memories of this type
        if (typeMemories.length < config.minMemoriesForSummary) {
          continue;
        }
        
        // Further cluster by similarity
        const similarityClusters = await this.clusterMemoriesBySimilarity(
          typeMemories,
          config.summarizationThreshold || config.similarityThreshold || 0.8
        );
        
        // Summarize each similarity cluster
        for (const cluster of similarityClusters) {
          if (cluster.length < config.minMemoriesForSummary) {
            continue;
          }
          
          // Limit cluster size
          const clusterToSummarize = cluster.slice(0, config.maxMemoriesPerSummary);
          
          const memoryGroup: MemoryGroup = {
            memories: clusterToSummarize,
            memoryType: type as AIMemoryType
          };
          
          const result = await this.summarizeMemoryGroup(
            memoryGroup,
            config,
            organizationId,
            userId
          );
          
          if (result && result.success && result.summaryId) {
            result.metadata.processingTime = Date.now() - startTime;
            results.push(result);
            summaryIds.push(result.summaryId);
          }
        }
      }
      
      return {
        totalMemories: memories.length,
        totalSummaries: results.length,
        summaries: results,
        summaryIds,
        processingTime: Date.now() - startTime,
        memoriesProcessed: memories.length,
        summariesCreated: results.length
      };
    } catch (error) {
      console.error('Error in summarizeAllMemories:', error);
      
      return {
        totalMemories: 0,
        totalSummaries: 0,
        summaries: [],
        errors: [error instanceof Error ? error.message : String(error)],
        summaryIds: [],
        processingTime: Date.now() - startTime,
        memoriesProcessed: 0,
        summariesCreated: 0
      };
    }
  }

  /**
   * Groups similar memories for summarization using a two-stage clustering approach
   * First clusters by memory type, then by embedding similarity
   * 
   * @param memories - Array of AIMemory objects to group
   * @param config - Summarization configuration parameters
   * @returns Promise resolving to array of memory groups ready for summarization
   */
  async groupSimilarMemories(
    memories: AIMemory[],
    config: SummarizationConfig
  ): Promise<MemoryGroup[]> {
    // First group by type
    const memoriesByType = this.clusterMemoriesByType(memories);
    const groups: MemoryGroup[] = [];
    
    // Then cluster by similarity within each type
    for (const [type, typeMemories] of Object.entries(memoriesByType)) {
      const similarityClusters = await this.clusterMemoriesBySimilarity(typeMemories, config.summarizationThreshold || config.similarityThreshold || 0.8);
      
      for (const cluster of similarityClusters) {
        if (cluster.length > 1) { // Only include actual groups
          const embeddings = cluster
            .map(m => m.content_embedding)
            .filter((e): e is number[] => !!e && e.length > 0);
          
          let centroid = undefined;
          if (embeddings.length > 0) {
            centroid = this.calculateCentroid(embeddings);
          }
          
          groups.push({
            memories: cluster,
            memoryType: type as AIMemoryType,
            centroid
          });
        }
      }
    }
    
    return groups;
  }

  /**
   * Get memories eligible for summarization
   * 
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID for user-specific memories
   * @returns Array of memories
   */
  private async getMemoriesForSummarization(
    organizationId: string,
    userId?: string
  ): Promise<AIMemory[]> {
    try {
      // Query parameters
      const query = this.supabase
        .from('memories')
        .select('*')
        .eq('organization_id', organizationId)
        .is('summary_id', null) // Only get memories that aren't already summarized
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Get memories older than 1 day
        .order('created_at', { ascending: false }) // Get newest memories first
        .limit(100); // Limit to a reasonable number
      
      // Add user filter if specified
      if (userId) {
        query.eq('user_id', userId);
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) {
        console.error('Error querying memories:', error);
        return [];
      }
      
      // Filter out memories without content or that are already summaries
      const memories = (data || []).filter(memory => {
        return (
          memory.content && 
          memory.content.trim() !== '' &&
          (!memory.metadata || !memory.metadata.is_summary)
        );
      });
      
      return memories;
    } catch (error) {
      console.error('Error getting memories for summarization:', error);
      return [];
    }
  }

  /**
   * Generates a summary for a group of memory contents using OpenAI
   * 
   * @param contents - Array of memory content strings to summarize
   * @param memoryType - Type of memories being summarized
   * @param maxLength - Maximum length of the generated summary
   * @returns Promise resolving to summary string or null if generation fails
   * @private
   */
  private async generateSummary(
    contents: string[],
    memoryType: AIMemoryType,
    maxLength: number
  ): Promise<string | null> {
    try {
      // Prepare prompt based on memory type
      let prompt = `Summarize the following related information into a concise, informative summary of maximum ${maxLength} characters. `;
      
      switch (memoryType) {
        case AIMemoryType.DECISION:
          prompt += 'Focus on the key decisions, their rationale, and outcomes.';
          break;
        case AIMemoryType.OBSERVATION:
          prompt += 'Focus on the key observations, patterns, and insights.';
          break;
        case AIMemoryType.FEEDBACK:
          prompt += 'Focus on the main feedback points, sentiment, and actionable insights.';
          break;
        case AIMemoryType.INTERACTION:
          prompt += 'Focus on the key interactions, their context, and outcomes.';
          break;
        case AIMemoryType.TACTIC:
          prompt += 'Focus on the main tactics, their application, and effectiveness.';
          break;
        case AIMemoryType.PREFERENCE:
          prompt += 'Focus on the key preferences, their context, and implications.';
          break;
        case AIMemoryType.INSIGHT:
          prompt += 'Focus on the main insights, their significance, and applications.';
          break;
        default:
          prompt += 'Focus on the key points and their significance.';
      }
      
      // Add the contents to summarize
      prompt += '\n\nInformation to summarize:\n';
      contents.forEach((content, i) => {
        prompt += `\n[${i + 1}] ${content}`;
      });
      
      // Generate summary using OpenAI
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an AI assistant that creates concise, informative summaries.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: Math.ceil(maxLength / 4), // Approximate token count
        temperature: 0.3 // Lower temperature for more consistent summaries
      });
      
      const summary = response.choices[0]?.message?.content?.trim();
      
      if (!summary) {
        console.error('Empty summary generated');
        return null;
      }
      
      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  }

  /**
   * Schedule regular summarization jobs for an organization
   * 
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param intervalHours - Interval between summarization jobs in hours (default: 24)
   * @returns Job ID for the scheduled summarization
   */
  async scheduleRegularSummarization(
    organizationId: string,
    intervalHours: number = 24
  ): Promise<string> {
    const jobId = uuidv4();
    
    // Store job configuration
    await this.supabase
      .from('ai_scheduled_jobs')
      .insert({
        id: jobId,
        organization_id: organizationId,
        job_type: 'memory_summarization',
        interval_hours: intervalHours,
        last_run: null,
        config: {
          organizationId
        },
        status: 'active'
      });
    
    return jobId;
  }

  /**
   * Legacy summarization method for backward compatibility
   * 
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - Optional user ID for user-specific memories
   * @returns Legacy format result
   */
  async legacySummarize(
    organizationId: string,
    userId?: string
  ): Promise<{ summaryIds: string[], processingTime: number, memoriesProcessed: number, summariesCreated: number }> {
    try {
      const result = await this.summarizeAllMemories(organizationId, userId);
      
      return {
        summaryIds: result.summaryIds || [],
        processingTime: result.processingTime,
        memoriesProcessed: result.memoriesProcessed,
        summariesCreated: result.summariesCreated
      };
    } catch (error) {
      console.error('Error in legacySummarize:', error);
      
      return {
        summaryIds: [],
        processingTime: 0,
        memoriesProcessed: 0,
        summariesCreated: 0
      };
    }
  }
}
