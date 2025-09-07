/**
 * UNIFIED AI DRAFTING SERVICE
 * 
 * Single source of truth for all email drafting across the entire system.
 * Consolidates all AI drafting logic, context analysis, and intelligence
 * into one reliable, maintainable service.
 * 
 * Features:
 * - Intelligent model selection and cost optimization
 * - Comprehensive context assembly (user, organization, contact, business)
 * - Consistent language and content rules
 * - Learning from user behavior and modifications
 * - Token usage tracking and performance monitoring
 * - Extensible for future AI capabilities
 */

import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { Database } from '@/types/supabase';
import { ModelRouterService } from './model-router-service';
import { EmailContextAnalyzer } from '@/lib/email/context-analyzer';
import { OrganizationSettingsService } from '@/lib/services/organization-settings-service';
import { EmailLearningService } from '@/lib/email/email-learning-service';
import { createMetakockaClientForUser } from '@/lib/integrations/metakocka';

// Core interfaces
export interface DraftingContext {
  // Email data
  emailId: string;
  originalEmail: {
    from: string;
    to: string;
    subject: string;
    body: string;
    date?: string;
  };
  
  // User context
  userId: string;
  organizationId?: string;
  
  // Request settings
  settings?: {
    responseStyle?: 'professional' | 'friendly' | 'formal' | 'casual';
    responseLength?: 'concise' | 'detailed' | 'custom';
    includeContext?: boolean;
    model?: string; // User model override
    temperature?: number;
    maxTokens?: number;
  };
  
  // Context flags
  isVirtual?: boolean; // For sales-agent virtual emails
  salesContext?: any; // Sales analysis data
  customInstructions?: string;
}

export interface DraftingResult {
  success: boolean;
  draft?: {
    subject: string;
    body: string;
    tone: string;
    confidence: number;
    context?: string;
  };
  metadata: {
    modelUsed: string;
    tokensUsed: number;
    costUsd: number;
    processingTimeMs: number;
    contextSources: string[];
    languageDetected: string;
    versionNumber: number;
  };
  modelInfo?: {
    id: string;
    name: string;
    reasoning: string[];
    cost: number;
    tokensUsed: number;
    alternatives?: string[];
    complexity: string;
    erpIntegrationDetected?: boolean;
  };
  error?: string;
}

export class UnifiedAIDraftingService {
  private supabase: SupabaseClient<Database>;
  private openai: OpenAI;
  private modelRouter: ModelRouterService;
  private organizationService: OrganizationSettingsService;
  private learningService: EmailLearningService;
  
  constructor(
    supabase: SupabaseClient<Database>,
    openai: OpenAI,
    organizationId: string,
    userId: string
  ) {
    this.supabase = supabase;
    this.openai = openai;
    this.modelRouter = new ModelRouterService(supabase, openai, organizationId, userId);
    this.organizationService = new OrganizationSettingsService(supabase);
    this.learningService = new EmailLearningService();
  }

  /**
   * MAIN DRAFTING METHOD
   * Single entry point for all email drafting across the system
   */
  async generateDraft(context: DraftingContext): Promise<DraftingResult> {
    const startTime = Date.now();
    let contextSources: string[] = [];
    
    try {
      console.log(`[UnifiedDrafting] Starting draft generation for email ${context.emailId}`);
      
      // Step 1: Assemble comprehensive context
      const comprehensiveContext = await this.assembleComprehensiveContext(context);
      contextSources = comprehensiveContext.sources;
      
      // Step 2: Select optimal AI model
      const modelSelection = await this.selectOptimalModel(context, comprehensiveContext);
      console.log(`[UnifiedDrafting] Selected model: ${modelSelection.model} (${modelSelection.reasoning})`);
      
      // Step 3: Build unified system prompt
      const systemPrompt = this.buildUnifiedSystemPrompt(comprehensiveContext);
      
      // Step 4: Build user prompt
      const userPrompt = this.buildUserPrompt(context, comprehensiveContext);
      
      // Step 5: Generate draft with selected model
      const response = await this.openai.chat.completions.create({
        model: modelSelection.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: context.settings?.temperature || comprehensiveContext.organizationSettings?.temperature || 0.7,
        max_tokens: context.settings?.maxTokens || comprehensiveContext.organizationSettings?.maxTokens || 1000,
        response_format: { type: 'json_object' }
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI model');
      }

      // Step 6: Parse and validate response
      const parsedDraft = JSON.parse(aiResponse);
      
      // Step 7: Save draft for learning (if not virtual)
      let versionNumber = 1;
      if (!context.isVirtual) {
        versionNumber = await this.saveDraftForLearning(context, parsedDraft, comprehensiveContext);
      }
      
      // Step 8: Calculate costs and return result
      const tokensUsed = response.usage?.total_tokens || 0;
      const costUsd = this.calculateCost(modelSelection.model, tokensUsed);
      
      console.log(`[UnifiedDrafting] Draft generated successfully - ${tokensUsed} tokens, $${costUsd.toFixed(4)}`);
      
      // Get model configuration for display
      const modelConfig = this.modelRouter.getModel(modelSelection.model);
      
      return {
        success: true,
        draft: {
          subject: parsedDraft.subject || `Re: ${context.originalEmail.subject}`,
          body: parsedDraft.body || 'Thank you for your email. We will respond shortly.',
          tone: parsedDraft.tone || context.settings?.responseStyle || 'professional',
          confidence: parsedDraft.confidence || 0.8,
          context: parsedDraft.context || 'Generated using unified AI drafting system'
        },
        metadata: {
          modelUsed: modelSelection.model,
          tokensUsed,
          costUsd,
          processingTimeMs: Date.now() - startTime,
          contextSources,
          languageDetected: comprehensiveContext.detectedLanguage,
          versionNumber
        },
        modelInfo: {
          id: modelSelection.model,
          name: modelConfig?.name || modelSelection.model,
          reasoning: Array.isArray(modelSelection.reasoning) ? modelSelection.reasoning : [modelSelection.reasoning],
          cost: costUsd,
          tokensUsed,
          alternatives: modelSelection.alternatives || [],
          complexity: modelSelection.complexity || 'unknown',
          erpIntegrationDetected: modelSelection.erpIntegrationDetected || false
        }
      };

    } catch (error) {
      console.error('[UnifiedDrafting] Error generating draft:', error);
      return {
        success: false,
        metadata: {
          modelUsed: 'none',
          tokensUsed: 0,
          costUsd: 0,
          processingTimeMs: Date.now() - startTime,
          contextSources,
          languageDetected: 'unknown',
          versionNumber: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * INTELLIGENT PATTERN MATCHING
   * Finds the most relevant learned patterns for the specific email context
   */
  private async getRelevantPatterns(context: DraftingContext) {
    try {
      const { getLearnedPatterns } = await import('@/lib/learning/email-pattern-analyzer');
      
      // Detect email language
      const emailLanguage = this.detectLanguage(context.originalEmail.body + ' ' + context.originalEmail.subject);
      
      // Analyze email content to determine category/topic
      const emailCategory = this.categorizeEmail(context.originalEmail);
      
      // Use enhanced pattern matching with email context
      const enhancedPatterns = await getLearnedPatterns(
        context.userId,
        emailCategory,
        undefined, // patternType - let it find all types
        context.originalEmail.body + ' ' + context.originalEmail.subject, // emailContent for context matching
        context.originalEmail.subject,
        context.originalEmail.from
      );
      
      if (enhancedPatterns.length > 0) {
        // Enhanced patterns already come with relevance scoring
        console.log(`[UnifiedDrafting] Enhanced pattern matching found ${enhancedPatterns.length} relevant patterns`);
        return enhancedPatterns
          .slice(0, 3) // Top 3 matches
          .map(pattern => ({
            ...pattern,
            language: pattern.language || emailLanguage
          }));
      }

      // Fallback to simple patterns if enhanced matching returns nothing
      const allPatterns = await getLearnedPatterns(context.userId, emailCategory);
      
      if (allPatterns.length === 0) {
        return [];
      }
      
      // Score and rank patterns by relevance (fallback method)
      const scoredPatterns = allPatterns.map(pattern => {
        let relevanceScore = 0;
        
        // Language match (highest priority)
        if (pattern.language === emailLanguage) {
          relevanceScore += 0.4;
        }
        
        // Category match
        if (pattern.emailCategory === emailCategory) {
          relevanceScore += 0.3;
        }
        
        // Keyword/content similarity
        const contentSimilarity = this.calculateContentSimilarity(
          context.originalEmail.body + ' ' + context.originalEmail.subject,
          pattern.patternText
        );
        relevanceScore += contentSimilarity * 0.2;
        
        // Pattern confidence
        relevanceScore += pattern.confidence * 0.1;
        
        return {
          ...pattern,
          language: pattern.language || emailLanguage,
          relevanceScore
        };
      });
      
      // Return top 3 most relevant patterns
      return scoredPatterns
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 3)
        .filter(p => p.relevanceScore > 0.3); // Only include reasonably relevant patterns
        
    } catch (error) {
      console.error('[UnifiedDrafting] Error in pattern matching:', error);
      return [];
    }
  }

  /**
   * Simple language detection based on common words
   */
  private detectLanguage(text: string): string {
    const slovenianWords = ['je', 'in', 'da', 'za', 'na', 'se', 'so', 'ali', 'kot', 'ki', 'iz', 'do', 'po', 'če', 'ker', 'lahko', 'samo', 'tudi', 'že', 'še'];
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during'];
    
    const lowerText = text.toLowerCase();
    const slovenianCount = slovenianWords.filter(word => lowerText.includes(word)).length;
    const englishCount = englishWords.filter(word => lowerText.includes(word)).length;
    
    if (slovenianCount > englishCount) return 'sl';
    if (englishCount > 0) return 'en';
    return 'auto';
  }

  /**
   * Categorize email based on content analysis
   */
  private categorizeEmail(email: any): string {
    const content = (email.body + ' ' + email.subject).toLowerCase();
    
    if (content.includes('price') || content.includes('cena') || content.includes('ponudba') || content.includes('offer')) {
      return 'sales_request';
    }
    if (content.includes('hello') || content.includes('hi') || content.includes('pozdrav')) {
      return 'greeting_style';
    }
    if (content.includes('question') || content.includes('help') || content.includes('problem') || content.includes('vprašanje')) {
      return 'customer_support';
    }
    if (content.includes('meeting') || content.includes('sestanek') || content.includes('schedule')) {
      return 'meeting_coordination';
    }
    
    return 'general_response';
  }

  /**
   * Calculate content similarity between two texts
   */
  private calculateContentSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return union.length > 0 ? intersection.length / union.length : 0;
  }

  /**
   * CONTEXT ASSEMBLY
   * Gathers all relevant context from multiple sources
   */
  private async assembleComprehensiveContext(context: DraftingContext) {
    const sources: string[] = [];
    let comprehensiveContext: any = {
      sources,
      detectedLanguage: 'auto'
    };

    try {
      // 1. Email context analysis
      const emailContext = EmailContextAnalyzer.analyzeEmail(context.originalEmail.body);
      const contextSummary = EmailContextAnalyzer.generateContextSummary(emailContext);
      comprehensiveContext.emailAnalysis = emailContext;
      comprehensiveContext.contextSummary = contextSummary;
      sources.push('email_context_analysis');

      // 2. Organization settings
      if (context.organizationId) {
        const orgSettings = await this.organizationService.getSettings(context.organizationId);
        const commPrefs = await this.organizationService.getCommunicationPreferences(context.organizationId);
        comprehensiveContext.organizationSettings = orgSettings || {};
        comprehensiveContext.communicationPreferences = commPrefs || {};
        sources.push('organization_settings');
        
        if (commPrefs?.default_language) {
          comprehensiveContext.detectedLanguage = commPrefs.default_language;
        }
      } else {
        // Ensure organizationSettings always exists with defaults
        comprehensiveContext.organizationSettings = {};
        comprehensiveContext.communicationPreferences = {};
      }

      // 3. User writing style and learning (using unified context service)
      try {
        const { getUserContext } = await import('../context/unified-user-context-service');
        const userContextData = await getUserContext(context.userId, { 
          includeWritingStyle: true,
          includeAIPreferences: true
        });
        comprehensiveContext.userContext = {
          writingStyle: userContextData.writingStyle,
          aiPreferences: userContextData.aiPreferences,
          preferences: userContextData.preferences
        };
        sources.push('unified_user_context');
      } catch (error) {
        console.warn('[UnifiedDrafting] Unified context failed, using fallback:', error);
        // Fallback to legacy method
        const userContext = await this.getUserWritingContext(context.userId);
        comprehensiveContext.userContext = userContext;
        sources.push('user_writing_style');
      }

      // 4. Contact and customer context (Metakocka)
      if (context.originalEmail.from) {
        const contactContext = await this.getContactContext(context.originalEmail.from, context.userId);
        if (contactContext) {
          comprehensiveContext.contactContext = contactContext;
          sources.push('contact_context');
        }
      }

      // 5. Previous drafts for learning
      const previousDrafts = await this.getPreviousDrafts(context.emailId, context.userId);
      if (previousDrafts.length > 0) {
        comprehensiveContext.previousDrafts = previousDrafts;
        sources.push('previous_drafts');
      }

      // 6. Sales context (if provided)
      if (context.salesContext) {
        comprehensiveContext.salesContext = context.salesContext;
        sources.push('sales_analysis');
      }

      // 7. LEARNED EMAIL PATTERNS (CONTEXT-AWARE MATCHING)
      try {
        const relevantPatterns = await this.getRelevantPatterns(context);
        
        if (relevantPatterns.length > 0) {
          comprehensiveContext.relevantPatterns = relevantPatterns;
          sources.push(`relevant_patterns(${relevantPatterns.length})`);
          console.log(`[UnifiedDrafting] Found ${relevantPatterns.length} relevant patterns for this context`);
        } else {
          console.log(`[UnifiedDrafting] No relevant patterns found for this email context`);
        }
      } catch (error) {
        console.error('[UnifiedDrafting] Error fetching relevant patterns:', error);
      }

      console.log(`[UnifiedDrafting] Assembled context from: ${sources.join(', ')}`);
      return comprehensiveContext;

    } catch (error) {
      console.error('[UnifiedDrafting] Error assembling context:', error);
      return comprehensiveContext;
    }
  }

  /**
   * UNIFIED SYSTEM PROMPT
   * Single, consistent prompt with all rules and context
   */
  private buildUnifiedSystemPrompt(comprehensiveContext: any): string {
    const orgSettings = comprehensiveContext.organizationSettings || {};
    const commPrefs = comprehensiveContext.communicationPreferences || {};
    const userContext = comprehensiveContext.userContext || {};
    const salesContext = comprehensiveContext.salesContext;

    let systemPrompt = `You are an intelligent AI email assistant that generates professional, human-like email responses.

CRITICAL LANGUAGE RULE: You MUST respond in the exact same language as the original email. Match the language perfectly - if it's Slovenian, respond in Slovenian; if German, respond in German; if Italian, respond in Italian; if English, respond in English; if French, respond in French; if Spanish, respond in Spanish. This applies to ALL languages - always match the original email's language exactly.

CRITICAL CONTENT RULE: NEVER repeat information that the sender already provided in their email. Write as a human would - acknowledge what they shared without repeating it back. Focus on what's needed next, not what they already told you.

RESPONSE FORMAT: Your response must be a valid JSON object with this exact structure:
{
  "subject": "Reply subject line",
  "body": "Complete email response ready to send",
  "tone": "professional|friendly|formal|casual",
  "confidence": 0.8,
  "context": "Brief explanation of approach"
}`;

    // Add organization context
    if (orgSettings.name) {
      systemPrompt += `\n\nORGANIZATION: You represent ${orgSettings.name}.`;
    }

    // Add communication preferences
    if (commPrefs.auto_response_tone) {
      systemPrompt += `\nTONE PREFERENCE: Use ${commPrefs.auto_response_tone} tone.`;
    }

    if (commPrefs.email_signature?.enabled && commPrefs.email_signature?.template) {
      systemPrompt += `\nSIGNATURE: Include this signature: ${commPrefs.email_signature.template}`;
    }

    // Add user writing style
    if (userContext.writingStyle) {
      systemPrompt += `\n\nUSER WRITING STYLE: ${userContext.writingStyle}`;
    }

    // Add learning context
    if (userContext.draftHistory) {
      systemPrompt += `\nLEARNING CONTEXT: ${userContext.draftHistory}`;
    }

    // Add context-relevant learned patterns
    if (comprehensiveContext.relevantPatterns && comprehensiveContext.relevantPatterns.length > 0) {
      systemPrompt += `\n\nRELEVANT LEARNED PATTERNS: Based on the email context, here are the most relevant patterns from this user's communication history:`;
      
      comprehensiveContext.relevantPatterns.forEach((pattern: any, index: number) => {
        systemPrompt += `\n${index + 1}. [${pattern.language}] ${pattern.emailCategory}: "${pattern.patternText}" (${Math.round(pattern.confidence * 100)}% confidence, relevance: ${Math.round(pattern.relevanceScore * 100)}%)`;
      });
      
      systemPrompt += `\n\nIMPORTANT: Use these patterns as templates and inspiration. Match the language, tone, and style shown in the most relevant patterns. Adapt the structure and phrasing to fit the current email context while maintaining the user's authentic communication style.`;
    }

    // Add sales context if available
    if (salesContext) {
      systemPrompt += `\n\nSALES CONTEXT ACTIVE:
- Lead Score: ${salesContext.analysis?.lead_qualification?.score || 'Unknown'}/100
- Lead Level: ${salesContext.analysis?.lead_qualification?.level || 'Unknown'}
- Pain Points: ${salesContext.analysis?.sales_insights?.pain_points?.join(', ') || 'None identified'}
- Buying Signals: ${salesContext.analysis?.sales_insights?.buying_signals?.join(', ') || 'None identified'}

SALES INSTRUCTIONS:
- Address their specific pain points tactfully
- Use consultative approach - build trust and provide value
- Include relevant product information when appropriate
- Be enthusiastic but not pushy`;
    }

    // Add core guidelines
    systemPrompt += `\n\nCORE GUIDELINES:
1. Match the user's natural writing style and tone
2. Be concise but comprehensive in your response
3. Maintain professional courtesy while being personable
4. Address all points raised in the original email
5. Include appropriate greeting and closing
6. Use natural, conversational language - avoid robotic phrasing
7. Consider cultural context apparent from the email
8. NEVER ask for information the sender already provided
9. Write fresh content that moves the conversation forward
10. Focus on what's needed next, not what they already shared

Generate a response that feels authentically human and matches how the user would naturally write.`;

    return systemPrompt;
  }

  /**
   * USER PROMPT BUILDER
   * Formats the original email and context for AI processing
   */
  private buildUserPrompt(context: DraftingContext, comprehensiveContext: any): string {
    const contactContext = comprehensiveContext.contactContext;
    const contextSummary = comprehensiveContext.contextSummary;

    let prompt = `Please generate a reply to this email:

FROM: ${context.originalEmail.from}
TO: ${context.originalEmail.to}
SUBJECT: ${context.originalEmail.subject}
DATE: ${context.originalEmail.date || new Date().toISOString()}

EMAIL CONTENT:
${context.originalEmail.body}`;

    // Add context summary if available
    if (contextSummary) {
      prompt += `\n\nCONTEXT ANALYSIS:
- Summary: ${contextSummary.summary}
- Key Points: ${contextSummary.keyPoints.join(', ')}
- Provided Information: ${contextSummary.keyPoints.slice(0, 2).join(', ')}`;
    }

    // Add customer context if available
    if (contactContext) {
      prompt += `\n\nCUSTOMER CONTEXT:
- Name: ${contactContext.name || 'Unknown'}
- Status: ${contactContext.status || 'New'}
- Previous Orders: ${contactContext.totalOrders || 0}
- Last Interaction: ${contactContext.lastOrderDate || 'None'}`;
    }

    // Add custom instructions
    if (context.customInstructions) {
      prompt += `\n\nADDITIONAL INSTRUCTIONS: ${context.customInstructions}`;
    }

    prompt += `\n\nGenerate an appropriate reply that addresses their needs while maintaining a professional and helpful tone.`;

    return prompt;
  }

  /**
   * MODEL SELECTION
   * Uses ModelRouterService for intelligent model selection with ERP detection
   */
  private async selectOptimalModel(context: DraftingContext, comprehensiveContext: any) {
    try {
      // Check for user override
      if (context.settings?.model) {
        return {
          model: context.settings.model,
          reasoning: ['User override'],
          complexity: 'user_selected',
          erpIntegrationDetected: false,
          alternatives: []
        };
      }

      // Detect ERP integration needs
      const erpIntegration = this.detectErpIntegrationNeeds(context.originalEmail, comprehensiveContext);
      
      // Use model router for intelligent selection
      const complexity = this.assessTaskComplexity(context, comprehensiveContext);
      const selection = await this.modelRouter.analyzeTaskComplexity(
        `Email drafting: ${context.originalEmail.subject}`,
        {
          task_type: 'email_drafting',
          complexity: complexity,
          has_sales_context: !!context.salesContext,
          has_customer_data: !!comprehensiveContext.contactContext,
          requires_erp_integration: erpIntegration.required,
          requires_external_lookup: erpIntegration.required || !!comprehensiveContext.contactContext
        }
      );

      console.log(`[UnifiedDrafting] Model selection - Complexity: ${complexity}, ERP: ${erpIntegration.required}, Model: ${selection.suggestedModel}`);

      return {
        model: selection.suggestedModel,
        reasoning: selection.reasoning,
        complexity: selection.complexity,
        erpIntegrationDetected: erpIntegration.required,
        alternatives: selection.alternativeModels,
        erpSystems: erpIntegration.systems
      };

    } catch (error) {
      console.error('[UnifiedDrafting] Error in model selection:', error);
      return {
        model: 'gpt-4o-mini', // Safe fallback
        reasoning: ['Fallback due to model selection error'],
        complexity: 'error',
        erpIntegrationDetected: false,
        alternatives: []
      };
    }
  }

  /**
   * Detect if email requires ERP integration
   */
  private detectErpIntegrationNeeds(email: any, context: any): {
    required: boolean;
    systems: string[];
    reasoning: string[];
  } {
    const content = `${email.subject} ${email.body}`.toLowerCase();
    const systems: string[] = [];
    const reasoning: string[] = [];
    
    // Metakocka indicators
    const metakockaIndicators = [
      'order status', 'invoice', 'product availability', 'stock level',
      'pricing', 'delivery', 'payment status', 'account balance',
      'order tracking', 'shipping status', 'purchase history'
    ];
    
    if (metakockaIndicators.some(indicator => content.includes(indicator))) {
      systems.push('Metakocka ERP');
      reasoning.push('Email contains ERP-related queries requiring real-time data');
    }
    
    // Magento indicators
    const magentoIndicators = [
      'product catalog', 'customer order', 'shopping cart', 'checkout',
      'product details', 'category', 'inventory'
    ];
    
    if (magentoIndicators.some(indicator => content.includes(indicator))) {
      systems.push('Magento');
      reasoning.push('Email requires e-commerce platform integration');
    }
    
    // Context-based detection
    if (context.contactContext) {
      systems.push('Customer Database');
      reasoning.push('Customer context requires database lookup');
    }
    
    if (context.salesContext) {
      systems.push('Sales Intelligence');
      reasoning.push('Sales context requires CRM data integration');
    }
    
    return {
      required: systems.length > 0,
      systems,
      reasoning
    };
  }

  /**
   * Helper methods for context gathering
   */
  private async getUserWritingContext(userId: string) {
    try {
      const { data: userEmails } = await this.supabase
        .from('emails')
        .select('raw_content, subject')
        .eq('created_by', userId)
        .eq('email_type', 'sent')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: previousDrafts } = await this.supabase
        .from('ai_email_drafts')
        .select('draft_body, tone, ai_settings')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        userEmails: userEmails || [],
        previousDrafts: previousDrafts || [],
        writingStyle: this.analyzeUserWritingStyle(userEmails || []),
        draftHistory: this.analyzePreviousDrafts(previousDrafts || [])
      };
    } catch (error) {
      console.error('[UnifiedDrafting] Error getting user context:', error);
      return {
        userEmails: [],
        previousDrafts: [],
        writingStyle: 'No previous emails available for style analysis. Use professional, friendly tone.',
        draftHistory: 'No previous drafts available for learning.'
      };
    }
  }

  private async getContactContext(fromEmail: string, userId: string) {
    try {
      // Try to get contact context from Metakocka
      const metakockaClient = await createMetakockaClientForUser(userId);
      if (metakockaClient) {
        const customer = await metakockaClient.getCustomerByEmail(fromEmail);
        if (customer) {
          return customer;
        }
      }
      return null;
    } catch (error) {
      console.error('[UnifiedDrafting] Error getting contact context:', error);
      return null;
    }
  }

  private async getPreviousDrafts(emailId: string, userId: string) {
    try {
      const { data } = await this.supabase
        .from('ai_email_drafts')
        .select('*')
        .eq('email_id', emailId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      return data || [];
    } catch (error) {
      console.error('[UnifiedDrafting] Error getting previous drafts:', error);
      return [];
    }
  }

  private async saveDraftForLearning(context: DraftingContext, draft: any, comprehensiveContext: any): Promise<number> {
    try {
      // Get current version number
      const { data: existingDrafts } = await this.supabase
        .from('ai_email_drafts')
        .select('id')
        .eq('email_id', context.emailId)
        .eq('user_id', context.userId);

      const versionNumber = (existingDrafts?.length || 0) + 1;

      // Save draft
      await this.supabase
        .from('ai_email_drafts')
        .insert({
          id: `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user_id: context.userId,
          email_id: context.emailId,
          original_email: context.originalEmail,
          draft_subject: draft.subject,
          draft_body: draft.body,
          ai_settings: context.settings,
          confidence_score: draft.confidence || 0.8,
          tone: draft.tone || 'professional',
          version_number: versionNumber,
          context_used: {
            sources: comprehensiveContext.sources,
            modelUsed: 'unified-service',
            versionInfo: `Unified draft v${versionNumber} - Generated ${new Date().toISOString()}`
          },
          created_at: new Date().toISOString()
        });

      return versionNumber;
    } catch (error) {
      console.error('[UnifiedDrafting] Error saving draft:', error);
      return 1;
    }
  }

  // Utility methods
  private assessTaskComplexity(context: DraftingContext, comprehensiveContext: any): string {
    let complexity = 'standard';
    
    if (context.salesContext || comprehensiveContext.contactContext) {
      complexity = 'complex';
    } else if (context.originalEmail.body.length < 200 && !comprehensiveContext.previousDrafts?.length) {
      complexity = 'simple';
    }
    
    return complexity;
  }

  private calculateCost(model: string, tokens: number): number {
    const costMap: Record<string, number> = {
      'gpt-3.5-turbo': 0.0015,
      'gpt-4o-mini': 0.00015,
      'gpt-4o': 0.005,
      'gpt-4': 0.03
    };
    
    return (tokens / 1000) * (costMap[model] || 0.005);
  }

  private analyzeUserWritingStyle(userEmails: any[]): string {
    if (!userEmails || userEmails.length === 0) {
      return 'No previous emails available for style analysis. Use professional, friendly tone.';
    }

    const avgLength = userEmails.reduce((sum, email) => sum + (email.raw_content?.length || 0), 0) / userEmails.length;
    const hasGreetings = userEmails.some(email => 
      email.raw_content?.toLowerCase().includes('dear ') || 
      email.raw_content?.toLowerCase().includes('hello') ||
      email.raw_content?.toLowerCase().includes('hi ')
    );
    
    return `User typically writes ${avgLength > 500 ? 'detailed' : 'concise'} emails. ${hasGreetings ? 'Often uses personal greetings.' : 'Tends to be direct.'} Previous emails show ${userEmails.length} examples of their style.`;
  }

  private analyzePreviousDrafts(previousDrafts: any[]): string {
    if (!previousDrafts || previousDrafts.length === 0) {
      return 'No previous drafts available for learning.';
    }

    return `Analyzed ${previousDrafts.length} previous drafts. User tends to prefer ${previousDrafts[0]?.tone || 'professional'} tone. Learn from any patterns in user modifications.`;
  }
}
