/**
 * AI Preferences Service
 * 
 * Central service for managing and applying user AI email preferences
 * This service MUST be used by ALL AI agents and analysis throughout the system
 */

import { createLazyServerClient } from '@/lib/supabase/lazy-client';

export interface EmailFilter {
  id: string;
  name: string;
  condition: string;
  action: 'skip_ai_processing' | 'flag_for_manual_review' | 'high_priority' | 'low_priority';
  description: string;
  active: boolean;
}

export interface ResponseRule {
  id: string;
  name: string;
  trigger: string;
  behavior: string;
  custom_instructions?: string;
  escalate_to_human?: boolean;
  active: boolean;
}

export interface ExclusionRule {
  id: string;
  name: string;
  condition: string;
  action: 'skip_ai_processing' | 'flag_for_manual_review';
  reason: string;
  active: boolean;
}

export interface ContentRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  template_additions?: string;
  active: boolean;
}

export interface AIEmailPreferences {
  id: string;
  user_id: string;
  organization_id?: string;
  ai_enabled: boolean;
  response_style: 'professional' | 'friendly' | 'formal' | 'casual' | 'technical';
  response_tone: 'helpful' | 'direct' | 'empathetic' | 'enthusiastic' | 'cautious';
  response_length: 'brief' | 'optimal' | 'detailed' | 'comprehensive';
  email_filters: EmailFilter[];
  response_rules: ResponseRule[];
  exclusion_rules: ExclusionRule[];
  content_rules: ContentRule[];
  custom_instructions?: string;
  global_ai_instructions?: string;
  conversation_history?: any[];
  created_at: string;
  updated_at: string;
}

export interface EmailContext {
  subject?: string;
  sender?: string;
  sender_domain?: string;
  body?: string;
  email_type?: 'customer_service' | 'sales' | 'product_inquiry' | 'complaint' | 'general';
  urgency?: 'low' | 'medium' | 'high' | 'urgent';
  [key: string]: any;
}

export interface AIProcessingDecision {
  should_process: boolean;
  should_escalate: boolean;
  priority_level: 'low' | 'medium' | 'high' | 'urgent';
  custom_instructions: string[];
  applied_rules: string[];
  reasoning: string;
}

export class AIPreferencesService {
  private supabase;
  private cache: Map<string, { preferences: AIEmailPreferences; expiry: number }>;

  constructor() {
    this.supabase = createLazyServerClient();
    this.cache = new Map();
  }

  /**
   * Get user's AI email preferences
   * This is the main function that ALL AI systems should call
   */
  async getUserPreferences(userId: string): Promise<AIEmailPreferences | null> {
    try {
      // Check cache first (5 minute cache)
      const cacheKey = `user_${userId}`;
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.preferences;
      }

      const supabase = await this.supabase;
      const { data, error } = await supabase
        .from('user_ai_email_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching user AI preferences:', error);
        
        // Check if table doesn't exist
        if (error.message?.includes('relation "public.user_ai_email_preferences" does not exist') ||
            (error.message?.includes('user_ai_email_preferences') && error.message?.includes('does not exist'))) {
          console.warn('AI preferences table does not exist yet. Please run the database migration.');
          return null;
        }
        
        return null;
      }

      let preferences: AIEmailPreferences | null = null;

      if (data) {
        preferences = {
          ...data,
          email_filters: data.email_filters || [],
          response_rules: data.response_rules || [],
          exclusion_rules: data.exclusion_rules || [],
          content_rules: data.content_rules || [],
        };

        // Cache the result
        this.cache.set(cacheKey, {
          preferences: preferences!,
          expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
        });
      }

      return preferences;
    } catch (error) {
      console.error('Error in getUserPreferences:', error);
      return null;
    }
  }

  /**
   * CRITICAL: This function determines if an email should be processed by AI
   * ALL email processing systems MUST call this function before processing
   */
  async shouldProcessEmail(userId: string, emailContext: EmailContext): Promise<AIProcessingDecision> {
    const preferences = await this.getUserPreferences(userId);
    
    if (!preferences || !preferences.ai_enabled) {
      return {
        should_process: false,
        should_escalate: true,
        priority_level: 'medium',
        custom_instructions: [],
        applied_rules: [],
        reasoning: 'AI processing disabled for user'
      };
    }

    const appliedRules: string[] = [];
    const customInstructions: string[] = [];
    let shouldProcess = true;
    let shouldEscalate = false;
    let priorityLevel: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

    // Apply exclusion rules first
    for (const rule of preferences.exclusion_rules) {
      if (!rule.active) continue;
      
      if (await this.evaluateCondition(rule.condition, emailContext)) {
        shouldProcess = rule.action !== 'skip_ai_processing';
        shouldEscalate = rule.action === 'flag_for_manual_review';
        appliedRules.push(`Exclusion: ${rule.name}`);
        
        if (!shouldProcess) {
                     return {
             should_process: false,
             should_escalate: shouldEscalate,
             priority_level: 'medium',
             custom_instructions: [],
             applied_rules: appliedRules,
             reasoning: `Excluded by rule: ${rule.name} - ${rule.reason}`
           };
        }
      }
    }

    // Apply email filters
    for (const filter of preferences.email_filters) {
      if (!filter.active) continue;
      
      if (await this.evaluateCondition(filter.condition, emailContext)) {
        appliedRules.push(`Filter: ${filter.name}`);
        
        switch (filter.action) {
          case 'skip_ai_processing':
            shouldProcess = false;
            break;
          case 'flag_for_manual_review':
            shouldEscalate = true;
            break;
          case 'high_priority':
            priorityLevel = 'high';
            break;
          case 'low_priority':
            priorityLevel = 'low';
            break;
        }
      }
    }

    // Apply response rules
    for (const rule of preferences.response_rules) {
      if (!rule.active) continue;
      
      if (await this.evaluateCondition(rule.trigger, emailContext)) {
        appliedRules.push(`Response Rule: ${rule.name}`);
        
        if (rule.escalate_to_human) {
          shouldEscalate = true;
        }
        
        if (rule.custom_instructions) {
          customInstructions.push(rule.custom_instructions);
        }
        
        // Determine priority from behavior
        if (rule.behavior.includes('high_priority')) {
          priorityLevel = 'high';
        } else if (rule.behavior.includes('urgent')) {
          priorityLevel = 'urgent';
        }
      }
    }

    // Add global instructions
    if (preferences.global_ai_instructions) {
      customInstructions.push(preferences.global_ai_instructions);
    }

    if (preferences.custom_instructions) {
      customInstructions.push(preferences.custom_instructions);
    }

    return {
      should_process: shouldProcess && !shouldEscalate,
      should_escalate: shouldEscalate,
      priority_level: priorityLevel,
      custom_instructions: customInstructions,
      applied_rules: appliedRules,
      reasoning: appliedRules.length > 0 
        ? `Applied rules: ${appliedRules.join(', ')}` 
        : 'Default processing (no specific rules matched)'
    };
  }

  /**
   * Get AI instructions for email processing
   * This should be called by ALL AI agents when generating responses
   */
  async getAIInstructions(userId: string, emailContext: EmailContext): Promise<{
    style_instructions: string;
    content_instructions: string[];
    global_instructions: string[];
  }> {
    const preferences = await this.getUserPreferences(userId);
    
    if (!preferences) {
      return {
        style_instructions: 'Use a professional, helpful tone.',
        content_instructions: [],
        global_instructions: []
      };
    }

    const contentInstructions: string[] = [];
    const globalInstructions: string[] = [];

    // Style instructions based on preferences
    const styleInstructions = this.buildStyleInstructions(
      preferences.response_style,
      preferences.response_tone,
      preferences.response_length
    );

    // Apply content rules
    for (const rule of preferences.content_rules) {
      if (!rule.active) continue;
      
      if (await this.evaluateCondition(rule.trigger, emailContext)) {
        if (rule.template_additions) {
          contentInstructions.push(rule.template_additions);
        }
      }
    }

    // Add global and custom instructions
    if (preferences.global_ai_instructions) {
      globalInstructions.push(preferences.global_ai_instructions);
    }

    if (preferences.custom_instructions) {
      globalInstructions.push(preferences.custom_instructions);
    }

    return {
      style_instructions: styleInstructions,
      content_instructions: contentInstructions,
      global_instructions: globalInstructions
    };
  }

  /**
   * Save preferences from chat conversation
   */
  async savePreferencesFromChat(
    userId: string, 
    preferences: Partial<AIEmailPreferences>,
    conversationMessage?: string
  ): Promise<boolean> {
    try {
      const supabase = await this.supabase;
      
      // Clear cache
      this.cache.delete(`user_${userId}`);

      const updateData: any = {
        user_id: userId,
        last_updated_via_chat: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...preferences
      };

      // Add conversation message to history if provided
      if (conversationMessage) {
        const existingPrefs = await this.getUserPreferences(userId);
        const existingHistory = existingPrefs?.conversation_history || [];
        
        updateData.conversation_history = [
          ...existingHistory,
          {
            timestamp: new Date().toISOString(),
            message: conversationMessage,
            changes: Object.keys(preferences)
          }
        ].slice(-50); // Keep last 50 conversation entries
      }

      const { error } = await supabase
        .from('user_ai_email_preferences')
        .upsert(updateData);

      if (error) {
        console.error('Error saving AI preferences:', error);
        
        // Check if table doesn't exist
        if (error.message?.includes('relation "public.user_ai_email_preferences" does not exist') ||
            (error.message?.includes('user_ai_email_preferences') && error.message?.includes('does not exist'))) {
          console.warn('AI preferences table does not exist yet. Please run the database migration.');
          throw new Error('AI preferences system not set up yet. Database migration required.');
        }
        
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in savePreferencesFromChat:', error);
      return false;
    }
  }

  /**
   * Evaluate a condition against email context
   */
  private async evaluateCondition(condition: string, emailContext: EmailContext): Promise<boolean> {
    try {
      // Simple rule evaluation - in production this could be more sophisticated
      const lowerCondition = condition.toLowerCase();
      
      // Subject contains checks
      if (lowerCondition.includes('subject_contains')) {
        const matches = condition.match(/subject_contains\(\s*\['([^']+)'\]\s*\)/);
        if (matches && emailContext.subject) {
          const terms = matches[1].split("', '");
          return terms.some(term => 
            emailContext.subject!.toLowerCase().includes(term.toLowerCase())
          );
        }
      }

      // Subject contains any
      if (lowerCondition.includes('subject_contains_any')) {
        const matches = condition.match(/subject_contains_any\(\s*\[([^\]]+)\]\s*\)/);
        if (matches && emailContext.subject) {
          const terms = matches[1].replace(/['"]/g, '').split(', ');
          return terms.some(term => 
            emailContext.subject!.toLowerCase().includes(term.toLowerCase())
          );
        }
      }

      // Sender domain checks
      if (lowerCondition.includes('sender_domain_in')) {
        const matches = condition.match(/sender_domain_in\(\s*\[([^\]]+)\]\s*\)/);
        if (matches && emailContext.sender_domain) {
          const domains = matches[1].replace(/['"]/g, '').split(', ');
          return domains.includes(emailContext.sender_domain);
        }
      }

      // Email type checks
      if (lowerCondition.includes('email_type =')) {
        const matches = condition.match(/email_type\s*=\s*'([^']+)'/);
        if (matches && emailContext.email_type) {
          return emailContext.email_type === matches[1];
        }
      }

      // Simple keyword matching as fallback
      if (emailContext.subject) {
        return emailContext.subject.toLowerCase().includes(condition.toLowerCase());
      }

      return false;
    } catch (error) {
      console.error('Error evaluating condition:', condition, error);
      return false;
    }
  }

  /**
   * Build style instructions based on preferences
   */
  private buildStyleInstructions(
    style: string, 
    tone: string, 
    length: string
  ): string {
    let instructions = `Use a ${style} writing style with a ${tone} tone. `;
    
    switch (length) {
      case 'brief':
        instructions += 'Keep responses concise and to the point.';
        break;
      case 'detailed':
        instructions += 'Provide thorough, detailed responses with explanations.';
        break;
      case 'comprehensive':
        instructions += 'Provide comprehensive, in-depth responses covering all aspects.';
        break;
      default:
        instructions += 'Provide well-balanced responses with appropriate detail.';
    }

    return instructions;
  }

  /**
   * Clear cache for a user (call when preferences are updated)
   */
  clearUserCache(userId: string): void {
    this.cache.delete(`user_${userId}`);
  }

  /**
   * Get usage statistics for user preferences
   */
  async getPreferencesStats(userId: string): Promise<{
    total_rules: number;
    active_rules: number;
    last_updated: string | null;
    created_at: string | null;
  } | null> {
    const preferences = await this.getUserPreferences(userId);
    
    if (!preferences) return null;

    const allRules = [
      ...preferences.email_filters,
      ...preferences.response_rules,
      ...preferences.exclusion_rules,
      ...preferences.content_rules
    ];

    return {
      total_rules: allRules.length,
      active_rules: allRules.filter(rule => rule.active).length,
      last_updated: preferences.updated_at,
      created_at: preferences.created_at
    };
  }
}

// Singleton instance for use throughout the application
export const aiPreferencesService = new AIPreferencesService(); 