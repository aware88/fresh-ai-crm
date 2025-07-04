/**
 * Sales Tactics Service
 * 
 * This module provides functions to fetch and match sales tactics based on
 * personality profiles and email context. It integrates with the AI context
 * builder to enhance email responses with relevant sales tactics.
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Type definition for a sales tactic
 */
export type SalesTactic = {
  id: string;
  expert: string;
  category: string;
  tactical_snippet: string;
  use_case: string | null;
  email_phrase: string;
  emotional_trigger: string | null;
  matching_tone: string[];
  created_at: string;
};

/**
 * Create Supabase client
 */
function createSupabaseClient() {
  const { createClient } = require('../supabaseClient');
  return createClient();
}

/**
 * Fetch sales tactics that match the given personality profile and context
 * 
 * @param personalityProfile - The personality profile from ai_profiler
 * @param emailContext - The email context with subject and content
 * @returns Array of matching sales tactics
 */
export async function getMatchingSalesTactics(
  personalityProfile: any,
  emailContext: { subject?: string; content?: string }
): Promise<SalesTactic[]> {
  const supabase = createSupabaseClient();
  
  try {
    // Extract tone preferences from personality profile
    const tonePreferences: string[] = [];
    
    if (personalityProfile?.Tone_Preference) {
      // Split by commas, semicolons, or 'and' and trim whitespace
      const tones = personalityProfile.Tone_Preference
        .split(/[,;]|\s+and\s+/)
        .map((tone: string) => tone.trim().toLowerCase())
        .filter((tone: string) => tone.length > 0);
      
      tonePreferences.push(...tones);
    }
    
    // Extract emotional trigger if available
    let emotionalTrigger = null;
    if (personalityProfile?.Emotional_Trigger) {
      emotionalTrigger = personalityProfile.Emotional_Trigger.trim();
    }
    
    // Build the query based on available profile data
    let query = supabase
      .from('sales_tactics')
      .select('*');
    
    // Filter by matching tone if available
    if (tonePreferences.length > 0) {
      // Use overlap operator to find tactics that match any of the tone preferences
      query = query.overlaps('matching_tone', tonePreferences);
    }
    
    // Filter by emotional trigger if available
    if (emotionalTrigger) {
      query = query.eq('emotional_trigger', emotionalTrigger);
    }
    
    // Execute the query
    const { data: tactics, error } = await query;
    
    if (error) {
      console.error('Error fetching sales tactics:', error);
      return [];
    }
    
    // If we have too many tactics, prioritize and limit them
    if (tactics && tactics.length > 5) {
      // Sort by relevance (prioritize tactics that match both tone and emotional trigger)
      const sortedTactics = tactics.sort((a: SalesTactic, b: SalesTactic) => {
        // Calculate relevance score
        const aScore = calculateRelevanceScore(a, tonePreferences, emotionalTrigger, emailContext);
        const bScore = calculateRelevanceScore(b, tonePreferences, emotionalTrigger, emailContext);
        
        // Sort by score (descending)
        return bScore - aScore;
      });
      
      // Return top 5 tactics
      return sortedTactics.slice(0, 5);
    }
    
    return tactics || [];
  } catch (error) {
    console.error('Error in getMatchingSalesTactics:', error);
    return [];
  }
}

/**
 * Calculate relevance score for a sales tactic based on profile and context
 * 
 * @param tactic - The sales tactic to score
 * @param tonePreferences - Array of tone preferences from the profile
 * @param emotionalTrigger - Emotional trigger from the profile
 * @param emailContext - The email context with subject and content
 * @returns Relevance score (higher is more relevant)
 */
function calculateRelevanceScore(
  tactic: SalesTactic,
  tonePreferences: string[],
  emotionalTrigger: string | null,
  emailContext: { subject?: string; content?: string }
): number {
  let score = 0;
  
  // Score based on tone match
  if (tactic.matching_tone && tactic.matching_tone.length > 0) {
    for (const tone of tonePreferences) {
      if (tactic.matching_tone.includes(tone)) {
        score += 2; // +2 points per matching tone
      }
    }
  }
  
  // Score based on emotional trigger match
  if (emotionalTrigger && tactic.emotional_trigger === emotionalTrigger) {
    score += 3; // +3 points for matching emotional trigger
  }
  
  // Score based on context relevance
  if (emailContext.content) {
    // Check if the email content contains keywords from the tactic
    const contentLower = emailContext.content.toLowerCase();
    const keywordsToCheck = [
      ...(tactic.tactical_snippet ? tactic.tactical_snippet.toLowerCase().split(/\s+/) : []),
      ...(tactic.use_case ? tactic.use_case.toLowerCase().split(/\s+/) : [])
    ];
    
    // Filter to significant keywords (longer than 4 chars)
    const significantKeywords = keywordsToCheck
      .filter(word => word.length > 4)
      .filter(word => !['about', 'would', 'could', 'should', 'their', 'there', 'these', 'those', 'which', 'where', 'when'].includes(word));
    
    // Count keyword matches
    for (const keyword of significantKeywords) {
      if (contentLower.includes(keyword)) {
        score += 0.5; // +0.5 points per keyword match
      }
    }
  }
  
  return score;
}

/**
 * Format sales tactics for inclusion in AI context
 * 
 * @param tactics - Array of sales tactics
 * @returns Formatted string for AI context
 */
export function formatSalesTacticsForAIContext(tactics: SalesTactic[]): string {
  if (!tactics || tactics.length === 0) {
    return '';
  }
  
  let formattedContext = '## Relevant Sales Tactics\n';
  
  tactics.forEach(tactic => {
    formattedContext += `- **${tactic.category}** (by ${tactic.expert}):\n`;
    formattedContext += `  - Tactic: ${tactic.tactical_snippet}\n`;
    formattedContext += `  - Email Phrase: "${tactic.email_phrase}"\n`;
    if (tactic.use_case) {
      formattedContext += `  - Use Case: ${tactic.use_case}\n`;
    }
    if (tactic.emotional_trigger) {
      formattedContext += `  - Emotional Trigger: ${tactic.emotional_trigger}\n`;
    }
    formattedContext += `  - Matching Tone: ${tactic.matching_tone.join(', ')}\n\n`;
  });
  
  return formattedContext;
}
