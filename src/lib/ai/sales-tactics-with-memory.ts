/**
 * Memory-Enabled Sales Tactics Service
 * 
 * This module extends the basic sales tactics service with memory capabilities,
 * allowing the system to learn from past interactions and improve tactic selection
 * based on historical effectiveness.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { 
  getMatchingSalesTactics, 
  formatSalesTacticsForAIContext,
  SalesTactic
} from './sales-tactics';
import { 
  AIMemoryService, 
  AIMemory, 
  AIMemoryType,
  AIMemoryAccessType,
  AIMemorySearchParams,
  AIMemoryRelationshipType
} from './memory/ai-memory-service';

/**
 * Extended sales tactic with effectiveness data
 */
export type EnhancedSalesTactic = SalesTactic & {
  effectiveness_score?: number;
  usage_count?: number;
  last_used?: string;
  related_memories?: string[];
};

/**
 * Outcome data for a sales tactic
 */
export type SalesTacticOutcome = {
  tactic_id: string;
  email_id?: string;
  contact_id?: string;
  outcome_type: 'positive' | 'negative' | 'neutral';
  outcome_details?: string;
  outcome_score: number; // 0-1 scale
};

/**
 * Memory-enabled sales tactics service
 */
export class MemoryEnabledSalesTacticsService {
  private memoryService: AIMemoryService;
  
  constructor() {
    this.memoryService = new AIMemoryService();
  }
  
  /**
   * Get sales tactics enhanced with memory-based effectiveness data
   * 
   * @param personalityProfile - The personality profile from ai_profiler
   * @param emailContext - The email context with subject and content
   * @param organizationId - Organization ID for multi-tenant isolation
   * @returns Array of enhanced sales tactics
   */
  async getMemoryEnhancedSalesTactics(
    personalityProfile: any,
    emailContext: { subject?: string; content?: string },
    organizationId: string
  ): Promise<EnhancedSalesTactic[]> {
    try {
      // First, get base matching tactics from the original service
      const baseTactics = await getMatchingSalesTactics(personalityProfile, emailContext);
      
      // Then, enhance each tactic with memory-based effectiveness data
      const enhancedTactics: EnhancedSalesTactic[] = await Promise.all(
        baseTactics.map(async (tactic) => {
          // Search for memories related to this tactic
          const searchParams: AIMemorySearchParams = {
            query: tactic.tactical_snippet,
            memory_types: [AIMemoryType.TACTIC],
            metadata_filters: { tactic_id: tactic.id },
            max_results: 20,
          };
          
          const memories = await this.memoryService.searchMemories(searchParams, organizationId);
          
          // Calculate effectiveness score based on memory outcomes
          let effectivenessScore = 0.5; // Default neutral score
          let usageCount = 0;
          let lastUsed = null;
          
          if (memories.length > 0) {
            // Get access records for these memories to analyze outcomes
            const memoryIds = memories.map(result => result.memory.id);
            const { data: accessRecords } = await this.memoryService.supabase
              .from('ai_memory_access')
              .select('*')
              .in('memory_id', memoryIds)
              .eq('organization_id', organizationId)
              .order('created_at', { ascending: false });
            
            if (accessRecords && accessRecords.length > 0) {
              // Calculate average outcome score
              const recordsWithOutcomes = accessRecords.filter(record => record.outcome_score !== null);
              
              if (recordsWithOutcomes.length > 0) {
                const totalScore = recordsWithOutcomes.reduce(
                  (sum, record) => sum + (record.outcome_score || 0),
                  0
                );
                effectivenessScore = totalScore / recordsWithOutcomes.length;
                usageCount = accessRecords.length;
                lastUsed = accessRecords[0].created_at;
              }
            }
          }
          
          // Return enhanced tactic
          return {
            ...tactic,
            effectiveness_score: effectivenessScore,
            usage_count: usageCount,
            last_used: lastUsed,
            related_memories: memories.map(result => result.memory.id),
          };
        })
      );
      
      // Sort tactics by effectiveness score (highest first)
      enhancedTactics.sort((a, b) => {
        // If both have effectiveness scores, compare them
        if (a.effectiveness_score !== undefined && b.effectiveness_score !== undefined) {
          return b.effectiveness_score - a.effectiveness_score;
        }
        
        // If only one has an effectiveness score, prioritize it
        if (a.effectiveness_score !== undefined) return -1;
        if (b.effectiveness_score !== undefined) return 1;
        
        // Otherwise, keep original order
        return 0;
      });
      
      // Return top tactics (limit to 5)
      return enhancedTactics.slice(0, 5);
    } catch (error) {
      console.error('Error in getMemoryEnhancedSalesTactics:', error);
      // Fallback to original tactics if memory enhancement fails
      return await getMatchingSalesTactics(personalityProfile, emailContext);
    }
  }
  
  /**
   * Format enhanced sales tactics for AI context
   * 
   * @param tactics - Array of enhanced sales tactics
   * @returns Formatted string for AI context
   */
  formatEnhancedSalesTacticsForAIContext(tactics: EnhancedSalesTactic[]): string {
    if (!tactics || tactics.length === 0) {
      return '';
    }
    
    let formattedContext = '## Relevant Sales Tactics\n';
    
    tactics.forEach(tactic => {
      // Add effectiveness indicator if available
      let effectivenessIndicator = '';
      if (tactic.effectiveness_score !== undefined) {
        if (tactic.effectiveness_score >= 0.7) {
          effectivenessIndicator = ' [Highly Effective]';
        } else if (tactic.effectiveness_score >= 0.5) {
          effectivenessIndicator = ' [Moderately Effective]';
        } else {
          effectivenessIndicator = ' [Less Effective]';
        }
      }
      
      formattedContext += `- **${tactic.category}**${effectivenessIndicator} (by ${tactic.expert}):\n`;
      formattedContext += `  - Tactic: ${tactic.tactical_snippet}\n`;
      formattedContext += `  - Email Phrase: "${tactic.email_phrase}"\n`;
      
      if (tactic.use_case) {
        formattedContext += `  - Use Case: ${tactic.use_case}\n`;
      }
      
      if (tactic.emotional_trigger) {
        formattedContext += `  - Emotional Trigger: ${tactic.emotional_trigger}\n`;
      }
      
      formattedContext += `  - Matching Tone: ${tactic.matching_tone.join(', ')}\n`;
      
      // Add usage data if available
      if (tactic.usage_count !== undefined && tactic.usage_count > 0) {
        formattedContext += `  - Usage: Used ${tactic.usage_count} times`;
        if (tactic.last_used) {
          formattedContext += `, last used on ${new Date(tactic.last_used).toLocaleDateString()}`;
        }
        formattedContext += '\n';
      }
      
      formattedContext += '\n';
    });
    
    return formattedContext;
  }
  
  /**
   * Store a sales tactic decision in memory
   * 
   * @param tactic - The sales tactic that was used
   * @param context - Context in which the tactic was used
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - User ID who used the tactic
   * @returns Created memory
   */
  async storeTacticDecision(
    tactic: SalesTactic,
    context: { email_id?: string; contact_id?: string; content: string },
    organizationId: string,
    userId?: string
  ): Promise<AIMemory> {
    try {
      // Create memory content
      const memoryContent = `Used sales tactic "${tactic.tactical_snippet}" from category "${tactic.category}" by ${tactic.expert} in email context: "${context.content.substring(0, 100)}..."`;
      
      // Create metadata
      const metadata = {
        tactic_id: tactic.id,
        tactic_category: tactic.category,
        tactic_expert: tactic.expert,
        email_id: context.email_id,
        contact_id: context.contact_id,
        emotional_trigger: tactic.emotional_trigger,
        matching_tone: tactic.matching_tone,
      };
      
      // Store memory
      const memory = await this.memoryService.storeMemory({
        organization_id: organizationId,
        user_id: userId,
        content: memoryContent,
        metadata,
        memory_type: AIMemoryType.TACTIC,
        importance_score: 0.6, // Start with slightly above average importance
      });
      
      // Record initial access
      await this.memoryService.recordMemoryAccess({
        organization_id: organizationId,
        memory_id: memory.id,
        user_id: userId,
        access_type: AIMemoryAccessType.APPLY,
        context: `Applied in email: ${context.content.substring(0, 100)}...`,
      });
      
      return memory;
    } catch (error) {
      console.error('Error storing tactic decision:', error);
      throw error;
    }
  }
  
  /**
   * Record the outcome of a sales tactic
   * 
   * @param outcome - Outcome data for the tactic
   * @param organizationId - Organization ID for multi-tenant isolation
   * @param userId - User ID who recorded the outcome
   * @returns Updated memory with new importance score
   */
  async recordTacticOutcome(
    outcome: SalesTacticOutcome,
    organizationId: string,
    userId?: string
  ): Promise<AIMemory | null> {
    try {
      // Find the memory for this tactic
      const searchParams: AIMemorySearchParams = {
        query: outcome.tactic_id, // Search by tactic ID
        memory_types: [AIMemoryType.TACTIC],
        metadata_filters: { tactic_id: outcome.tactic_id },
        max_results: 1,
      };
      
      const searchResults = await this.memoryService.searchMemories(searchParams, organizationId);
      
      if (searchResults.length === 0) {
        console.error('No memory found for tactic:', outcome.tactic_id);
        return null;
      }
      
      const memory = searchResults[0].memory;
      
      // Get the most recent access record for this memory
      const { data: accessRecords } = await this.memoryService.supabase
        .from('ai_memory_access')
        .select('*')
        .eq('memory_id', memory.id)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!accessRecords || accessRecords.length === 0) {
        console.error('No access record found for memory:', memory.id);
        return null;
      }
      
      const accessRecord = accessRecords[0];
      
      // Update the access record with outcome
      await this.memoryService.updateMemoryOutcome(
        accessRecord.id,
        outcome.outcome_details || `Outcome: ${outcome.outcome_type}`,
        outcome.outcome_score
      );
      
      // Update memory importance based on outcome
      const updatedMemory = await this.memoryService.updateMemoryImportance(memory.id, organizationId);
      
      // If this is a significant outcome (very positive or very negative),
      // create an insight memory connected to this tactic memory
      if (outcome.outcome_score >= 0.8 || outcome.outcome_score <= 0.2) {
        const insightContent = outcome.outcome_score >= 0.8
          ? `The sales tactic "${memory.metadata.tactic_category}" was highly effective (${outcome.outcome_score.toFixed(2)}) when used with ${outcome.contact_id ? 'contact ' + outcome.contact_id : 'this type of contact'}. ${outcome.outcome_details || ''}`
          : `The sales tactic "${memory.metadata.tactic_category}" was ineffective (${outcome.outcome_score.toFixed(2)}) when used with ${outcome.contact_id ? 'contact ' + outcome.contact_id : 'this type of contact'}. ${outcome.outcome_details || ''}`;
        
        // Store insight memory
        const insightMemory = await this.memoryService.storeMemory({
          organization_id: organizationId,
          user_id: userId,
          content: insightContent,
          metadata: {
            ...memory.metadata,
            outcome_score: outcome.outcome_score,
            outcome_type: outcome.outcome_type,
          },
          memory_type: AIMemoryType.INSIGHT,
          importance_score: Math.abs(outcome.outcome_score - 0.5) * 2, // Higher for extreme outcomes
        });
        
        // Connect the insight to the tactic memory
        await this.memoryService.connectMemories({
          organization_id: organizationId,
          source_memory_id: memory.id,
          target_memory_id: insightMemory.id,
          relationship_type: AIMemoryRelationshipType.CAUSED,
          strength: 0.9,
        });
      }
      
      return updatedMemory;
    } catch (error) {
      console.error('Error recording tactic outcome:', error);
      throw error;
    }
  }
}
