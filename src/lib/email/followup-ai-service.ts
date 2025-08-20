/**
 * AI-Powered Follow-up Email Draft Generation Service
 * 
 * Leverages existing AI infrastructure to generate contextual follow-up emails
 */

import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { Database } from '@/types/supabase';
import { UnifiedAIDraftingService } from '@/lib/ai/unified-drafting-service';
import { ModelRouterService } from '@/lib/ai/model-router-service';
import { createOpenAIClient } from '@/lib/openai/client';
import { EmailFollowup } from './follow-up-service';

type SupabaseClient = ReturnType<typeof createLazyServerClient>;

export interface FollowUpDraftContext {
  followupId: string;
  originalEmail: {
    id: string;
    subject: string;
    content: string;
    recipients: string[];
    sentAt: Date;
  };
  followUpReason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  daysSinceOriginal: number;
  conversationHistory?: Array<{
    subject: string;
    content: string;
    date: Date;
    direction: 'sent' | 'received';
  }>;
  contactContext?: {
    name?: string;
    company?: string;
    previousInteractions?: number;
    lastResponseTime?: number; // hours
    communicationStyle?: string;
  };
  organizationId?: string;
  userId: string;
}

export interface FollowUpDraftOptions {
  tone?: 'professional' | 'friendly' | 'urgent' | 'casual';
  approach?: 'gentle' | 'direct' | 'value-add' | 'alternative';
  includeOriginalContext?: boolean;
  maxLength?: 'short' | 'medium' | 'long';
  language?: string;
  customInstructions?: string;
}

export interface FollowUpDraftResult {
  success: boolean;
  draft?: {
    subject: string;
    body: string;
    tone: string;
    approach: string;
    confidence: number;
    reasoning: string;
  };
  alternatives?: Array<{
    subject: string;
    body: string;
    tone: string;
    approach: string;
  }>;
  contextUsed: string[];
  tokensUsed: number;
  costUsd: number;
  model: string;
  error?: string;
}

export class FollowUpAIService {
  private supabase: SupabaseClient;
  private draftingService: UnifiedAIDraftingService | null = null;
  private modelRouter: ModelRouterService | null = null;
  private openai: ReturnType<typeof createOpenAIClient>;

  constructor() {
    this.supabase = createLazyServerClient();
    this.openai = createOpenAIClient();
  }

  /**
   * Initialize AI services with user context
   */
  private async initializeServices(organizationId: string, userId: string) {
    if (!this.draftingService) {
      this.draftingService = new UnifiedAIDraftingService(
        this.supabase,
        this.openai,
        organizationId,
        userId
      );
    }

    if (!this.modelRouter) {
      this.modelRouter = new ModelRouterService();
    }
  }

  /**
   * Generate AI-powered follow-up email draft
   */
  async generateFollowUpDraft(
    context: FollowUpDraftContext,
    options: FollowUpDraftOptions = {}
  ): Promise<FollowUpDraftResult> {
    try {
      await this.initializeServices(context.organizationId || '', context.userId);

      // Analyze task complexity for model selection
      const taskComplexity = await this.analyzeFollowUpComplexity(context, options);
      const modelSelection = await this.modelRouter!.analyzeTaskComplexity(
        this.buildComplexityPrompt(context, options),
        {
          task_type: 'follow_up_email',
          complexity: taskComplexity,
          user_id: context.userId,
          organization_id: context.organizationId
        }
      );

      console.log(`[FollowUpAI] Selected model: ${modelSelection.suggestedModel}`);

      // Build comprehensive system prompt
      const systemPrompt = this.buildFollowUpSystemPrompt(context, options);
      
      // Build user prompt with context
      const userPrompt = this.buildFollowUpUserPrompt(context, options);

      // Generate draft using selected model
      const response = await this.openai.chat.completions.create({
        model: modelSelection.suggestedModel || 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: this.getTemperatureForTone(options.tone),
        max_tokens: this.getMaxTokensForLength(options.maxLength),
        response_format: { type: 'json_object' }
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI model');
      }

      // Parse and validate response
      const parsedDraft = JSON.parse(aiResponse);
      
      // Calculate costs
      const tokensUsed = response.usage?.total_tokens || 0;
      const costUsd = this.calculateCost(modelSelection.suggestedModel || 'gpt-4o', tokensUsed);

      // Save draft to database for learning
      await this.saveDraftForLearning(context, parsedDraft, {
        model: modelSelection.suggestedModel || 'gpt-4o',
        tokensUsed,
        costUsd,
        options
      });

      return {
        success: true,
        draft: {
          subject: parsedDraft.subject,
          body: parsedDraft.body,
          tone: parsedDraft.tone || options.tone || 'professional',
          approach: parsedDraft.approach || options.approach || 'gentle',
          confidence: parsedDraft.confidence || 0.8,
          reasoning: parsedDraft.reasoning || 'AI-generated follow-up'
        },
        alternatives: parsedDraft.alternatives || [],
        contextUsed: this.extractContextSources(context),
        tokensUsed,
        costUsd,
        model: modelSelection.suggestedModel || 'gpt-4o'
      };

    } catch (error) {
      console.error('Error generating follow-up draft:', error);
      return {
        success: false,
        contextUsed: [],
        tokensUsed: 0,
        costUsd: 0,
        model: 'unknown',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate multiple follow-up variations with different approaches
   */
  async generateFollowUpVariations(
    context: FollowUpDraftContext,
    baseOptions: FollowUpDraftOptions = {}
  ): Promise<FollowUpDraftResult[]> {
    const variations: Array<{ tone: string; approach: string }> = [
      { tone: 'professional', approach: 'gentle' },
      { tone: 'friendly', approach: 'value-add' },
      { tone: 'professional', approach: 'direct' }
    ];

    // Add urgent variation if priority is high
    if (context.priority === 'high' || context.priority === 'urgent') {
      variations.push({ tone: 'urgent', approach: 'direct' });
    }

    const results = await Promise.all(
      variations.map(variation =>
        this.generateFollowUpDraft(context, {
          ...baseOptions,
          tone: variation.tone as any,
          approach: variation.approach as any
        })
      )
    );

    return results.filter(result => result.success);
  }

  /**
   * Analyze follow-up complexity for model selection
   */
  private async analyzeFollowUpComplexity(
    context: FollowUpDraftContext,
    options: FollowUpDraftOptions
  ): Promise<string> {
    let complexity = 'standard';

    // Increase complexity based on context richness
    if (context.conversationHistory && context.conversationHistory.length > 3) {
      complexity = 'complex';
    }

    // Increase complexity for urgent/high priority
    if (context.priority === 'urgent' || context.priority === 'high') {
      complexity = 'complex';
    }

    // Increase complexity if custom instructions provided
    if (options.customInstructions) {
      complexity = 'complex';
    }

    // Increase complexity for value-add approach
    if (options.approach === 'value-add') {
      complexity = 'complex';
    }

    return complexity;
  }

  /**
   * Build system prompt for follow-up generation
   */
  private buildFollowUpSystemPrompt(
    context: FollowUpDraftContext,
    options: FollowUpDraftOptions
  ): string {
    const tone = options.tone || 'professional';
    const approach = options.approach || 'gentle';
    const language = options.language || 'English';

    return `You are an expert email follow-up specialist. Your task is to generate effective, contextual follow-up emails that get responses while maintaining professional relationships.

CRITICAL LANGUAGE RULE: Generate the email in ${language}. Match the language and cultural context perfectly.

FOLLOW-UP CONTEXT:
- Original email sent ${context.daysSinceOriginal} days ago
- Priority level: ${context.priority}
- Follow-up reason: ${context.followUpReason}
- Desired tone: ${tone}
- Desired approach: ${approach}

TONE GUIDELINES:
${this.getToneGuidelines(tone)}

APPROACH GUIDELINES:
${this.getApproachGuidelines(approach)}

FOLLOW-UP BEST PRACTICES:
1. Reference the original email context naturally
2. Provide value or new information when possible
3. Make it easy for the recipient to respond
4. Keep it concise but complete
5. Use appropriate urgency based on priority
6. Maintain professional relationships
7. Avoid sounding pushy or desperate

${options.customInstructions ? `CUSTOM INSTRUCTIONS: ${options.customInstructions}` : ''}

RESPONSE FORMAT:
Return a JSON object with:
{
  "subject": "Follow-up email subject line",
  "body": "Complete email body with proper formatting",
  "tone": "actual tone used",
  "approach": "actual approach used", 
  "confidence": 0.85,
  "reasoning": "Brief explanation of approach taken",
  "alternatives": [
    {
      "subject": "Alternative subject",
      "body": "Alternative body",
      "tone": "alternative tone",
      "approach": "alternative approach"
    }
  ]
}`;
  }

  /**
   * Build user prompt with specific context
   */
  private buildFollowUpUserPrompt(
    context: FollowUpDraftContext,
    options: FollowUpDraftOptions
  ): string {
    let prompt = `Generate a follow-up email for this context:

ORIGINAL EMAIL:
Subject: ${context.originalEmail.subject}
Recipients: ${context.originalEmail.recipients.join(', ')}
Sent: ${context.originalEmail.sentAt.toLocaleDateString()}

Content:
${context.originalEmail.content}

FOLLOW-UP DETAILS:
- Days since original: ${context.daysSinceOriginal}
- Reason for follow-up: ${context.followUpReason}
- Priority: ${context.priority}`;

    // Add contact context if available
    if (context.contactContext) {
      prompt += `

CONTACT CONTEXT:`;
      if (context.contactContext.name) {
        prompt += `\n- Contact name: ${context.contactContext.name}`;
      }
      if (context.contactContext.company) {
        prompt += `\n- Company: ${context.contactContext.company}`;
      }
      if (context.contactContext.previousInteractions) {
        prompt += `\n- Previous interactions: ${context.contactContext.previousInteractions}`;
      }
      if (context.contactContext.lastResponseTime) {
        prompt += `\n- Typical response time: ${context.contactContext.lastResponseTime} hours`;
      }
      if (context.contactContext.communicationStyle) {
        prompt += `\n- Communication style: ${context.contactContext.communicationStyle}`;
      }
    }

    // Add conversation history if available
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      prompt += `

CONVERSATION HISTORY:`;
      context.conversationHistory.slice(-3).forEach((email, index) => {
        prompt += `\n${index + 1}. [${email.direction.toUpperCase()}] ${email.subject} (${email.date.toLocaleDateString()})`;
        if (email.content.length > 200) {
          prompt += `\n   ${email.content.substring(0, 200)}...`;
        } else {
          prompt += `\n   ${email.content}`;
        }
      });
    }

    prompt += `

Please generate an effective follow-up email that addresses the situation appropriately.`;

    return prompt;
  }

  /**
   * Get tone-specific guidelines
   */
  private getToneGuidelines(tone: string): string {
    switch (tone) {
      case 'professional':
        return 'Use formal, business-appropriate language. Be respectful and courteous.';
      case 'friendly':
        return 'Use warm, approachable language while maintaining professionalism.';
      case 'urgent':
        return 'Convey importance without being aggressive. Use time-sensitive language.';
      case 'casual':
        return 'Use relaxed, conversational language appropriate for the relationship.';
      default:
        return 'Use professional, courteous language.';
    }
  }

  /**
   * Get approach-specific guidelines
   */
  private getApproachGuidelines(approach: string): string {
    switch (approach) {
      case 'gentle':
        return 'Soft reminder approach. Acknowledge they may be busy. No pressure.';
      case 'direct':
        return 'Clear, straightforward approach. State what you need explicitly.';
      case 'value-add':
        return 'Include additional value, insights, or helpful information.';
      case 'alternative':
        return 'Offer alternative solutions or next steps. Show flexibility.';
      default:
        return 'Use a balanced, professional approach.';
    }
  }

  /**
   * Get temperature based on tone
   */
  private getTemperatureForTone(tone?: string): number {
    switch (tone) {
      case 'urgent':
        return 0.3; // More focused and direct
      case 'professional':
        return 0.4; // Consistent and professional
      case 'friendly':
        return 0.7; // More creative and warm
      case 'casual':
        return 0.8; // Most creative and relaxed
      default:
        return 0.5; // Balanced
    }
  }

  /**
   * Get max tokens based on length preference
   */
  private getMaxTokensForLength(length?: string): number {
    switch (length) {
      case 'short':
        return 300;
      case 'medium':
        return 600;
      case 'long':
        return 1000;
      default:
        return 600;
    }
  }

  /**
   * Calculate cost based on model and tokens
   */
  private calculateCost(model: string, tokens: number): number {
    const costPer1k = this.getModelCostPer1k(model);
    return (tokens / 1000) * costPer1k;
  }

  /**
   * Get cost per 1k tokens for different models
   */
  private getModelCostPer1k(model: string): number {
    if (model.includes('gpt-4o-mini')) return 0.00015;
    if (model.includes('gpt-4o')) return 0.005;
    if (model.includes('gpt-4')) return 0.03;
    return 0.005; // Default to GPT-4o pricing
  }

  /**
   * Build complexity analysis prompt
   */
  private buildComplexityPrompt(
    context: FollowUpDraftContext,
    options: FollowUpDraftOptions
  ): string {
    return `Generate follow-up email for: ${context.originalEmail.subject}. 
    Priority: ${context.priority}. 
    Days since: ${context.daysSinceOriginal}. 
    Approach: ${options.approach || 'gentle'}. 
    Has history: ${!!context.conversationHistory?.length}.
    Custom instructions: ${!!options.customInstructions}`;
  }

  /**
   * Extract context sources used
   */
  private extractContextSources(context: FollowUpDraftContext): string[] {
    const sources = ['original_email'];
    
    if (context.conversationHistory?.length) {
      sources.push('conversation_history');
    }
    
    if (context.contactContext) {
      sources.push('contact_context');
    }
    
    return sources;
  }

  /**
   * Save draft for learning and improvement
   */
  private async saveDraftForLearning(
    context: FollowUpDraftContext,
    draft: any,
    metadata: any
  ): Promise<void> {
    try {
      await this.supabase
        .from('email_followup_drafts')
        .insert({
          followup_id: context.followupId,
          user_id: context.userId,
          organization_id: context.organizationId,
          draft_subject: draft.subject,
          draft_body: draft.body,
          draft_tone: draft.tone,
          draft_approach: draft.approach,
          confidence_score: draft.confidence,
          model_used: metadata.model,
          tokens_used: metadata.tokensUsed,
          cost_usd: metadata.costUsd,
          generation_options: metadata.options,
          context_sources: this.extractContextSources(context),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving draft for learning:', error);
      // Don't throw - this is not critical for the main functionality
    }
  }

  /**
   * Get follow-up templates based on context
   */
  async getFollowUpTemplates(
    context: Partial<FollowUpDraftContext>
  ): Promise<Array<{
    name: string;
    description: string;
    tone: string;
    approach: string;
    useCase: string;
  }>> {
    const templates = [
      {
        name: 'Gentle Reminder',
        description: 'Soft, non-pushy follow-up for initial contact',
        tone: 'friendly',
        approach: 'gentle',
        useCase: 'First follow-up, relationship building'
      },
      {
        name: 'Professional Check-in',
        description: 'Formal business follow-up with clear next steps',
        tone: 'professional',
        approach: 'direct',
        useCase: 'Business proposals, formal communications'
      },
      {
        name: 'Value-Added Follow-up',
        description: 'Include additional insights or helpful information',
        tone: 'professional',
        approach: 'value-add',
        useCase: 'When you have new information to share'
      },
      {
        name: 'Alternative Options',
        description: 'Offer different solutions or flexible approaches',
        tone: 'friendly',
        approach: 'alternative',
        useCase: 'When original request may not be feasible'
      },
      {
        name: 'Urgent Follow-up',
        description: 'Time-sensitive follow-up with clear urgency',
        tone: 'urgent',
        approach: 'direct',
        useCase: 'Deadlines, urgent matters'
      }
    ];

    // Filter templates based on context
    if (context.priority === 'urgent' || context.priority === 'high') {
      return templates.filter(t => t.tone === 'urgent' || t.approach === 'direct');
    }

    if (context.daysSinceOriginal && context.daysSinceOriginal > 7) {
      return templates.filter(t => t.approach === 'gentle' || t.approach === 'alternative');
    }

    return templates;
  }
}
