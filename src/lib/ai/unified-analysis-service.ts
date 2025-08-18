/**
 * UNIFIED AI ANALYSIS SERVICE
 * 
 * Single source of truth for all email analysis across the entire system.
 * Consolidates 5+ different analysis systems into one intelligent, 
 * comprehensive service that provides consistent results.
 * 
 * Features:
 * - Language detection and cultural context analysis
 * - Email classification (category, intent, urgency, sentiment)
 * - Context extraction and relationship analysis
 * - Personality traits and communication patterns
 * - Intelligent model selection and cost optimization
 * - Performance monitoring and caching
 * - Extensible for future AI capabilities
 */

import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { Database } from '@/types/supabase';
import { ModelRouterService } from './model-router-service';
import { OrganizationSettingsService } from '@/lib/services/organization-settings-service';
import { createMetakockaClientForUser } from '@/lib/integrations/metakocka';

// Core interfaces
export interface AnalysisContext {
  // Email data
  emailId: string;
  emailContent: {
    from: string;
    to: string;
    subject: string;
    body: string;
    date?: string;
  };
  
  // User context
  userId: string;
  organizationId?: string;
  
  // Analysis options
  options?: {
    includePersonality?: boolean;
    includeContext?: boolean;
    includeRecommendations?: boolean;
    cacheResults?: boolean;
  };
}

export interface AnalysisResult {
  success: boolean;
  analysis?: {
    // Language and cultural context
    language: {
      code: string; // ISO code (en, sl, de, it, etc.)
      name: string; // Full name
      confidence: number;
      culturalContext?: string;
      countryCode?: string;
    };
    
    // Email classification
    classification: {
      category: 'sales' | 'support' | 'dispute' | 'billing' | 'product_inquiry' | 'general';
      intent: 'new_lead' | 'existing_customer' | 'complaint' | 'question' | 'request_info' | 'other';
      urgency: 'low' | 'medium' | 'high' | 'urgent';
      sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated';
      keywords: string[];
      confidence: number;
    };
    
    // Context analysis
    context: {
      emailType: 'inquiry' | 'complaint' | 'update' | 'request' | 'confirmation' | 'general';
      actionRequired: boolean;
      informationProvided: string[];
      informationMissing: string[];
      nextSteps: string[];
      relationshipContext: string;
      responseGuidance: string;
    };
    
    // Communication patterns
    patterns: {
      formality: number; // 0-1 scale
      directness: number; // 0-1 scale
      emotionalTone: number; // 0-1 scale
      technicalLevel: number; // 0-1 scale
      questionFrequency: number;
      urgencyLevel: number;
    };
    
    // Recommendations
    recommendations?: {
      responseApproach: string;
      suggestedTone: string;
      keyPointsToAddress: string[];
      escalateToHuman: boolean;
      priority: 'low' | 'medium' | 'high' | 'urgent';
    };
  };
  
  metadata: {
    modelUsed: string;
    tokensUsed: number;
    costUsd: number;
    processingTimeMs: number;
    analysisVersion: string;
    cacheHit: boolean;
  };
  
  error?: string;
}

export class UnifiedAIAnalysisService {
  private supabase: SupabaseClient<Database>;
  private openai: OpenAI;
  private modelRouter: ModelRouterService;
  private organizationService: OrganizationSettingsService;
  private analysisCache: Map<string, { result: AnalysisResult; timestamp: number }> = new Map();
  
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
  }

  /**
   * MAIN ANALYSIS METHOD
   * Single entry point for all email analysis across the system
   */
  async analyzeEmail(context: AnalysisContext): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[UnifiedAnalysis] Starting analysis for email ${context.emailId}`);
      
      // Check cache first if enabled
      const cacheKey = this.generateCacheKey(context);
      if (context.options?.cacheResults) {
        const cached = this.getCachedResult(cacheKey);
        if (cached) {
          console.log(`[UnifiedAnalysis] Cache hit for ${context.emailId}`);
          return cached;
        }
      }
      
      // Step 1: Select optimal model for analysis
      const modelSelection = await this.selectOptimalModel(context);
      console.log(`[UnifiedAnalysis] Selected model: ${modelSelection.model}`);
      
      // Step 2: Build comprehensive analysis prompt
      const systemPrompt = await this.buildAnalysisSystemPrompt(context);
      const userPrompt = this.buildAnalysisUserPrompt(context);
      
      // Step 3: Perform AI analysis
      const response = await this.openai.chat.completions.create({
        model: modelSelection.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No response from AI model');
      }

      // Step 4: Parse and validate response
      const parsedAnalysis = JSON.parse(aiResponse);
      
      // Step 5: Enhance with rule-based analysis
      const enhancedAnalysis = await this.enhanceWithRuleBasedAnalysis(parsedAnalysis, context);
      
      // Step 6: Calculate costs and create result
      const tokensUsed = response.usage?.total_tokens || 0;
      const costUsd = this.calculateCost(modelSelection.model, tokensUsed);
      
      const result: AnalysisResult = {
        success: true,
        analysis: enhancedAnalysis,
        metadata: {
          modelUsed: modelSelection.model,
          tokensUsed,
          costUsd,
          processingTimeMs: Date.now() - startTime,
          analysisVersion: '1.0.0',
          cacheHit: false
        }
      };
      
      // Step 7: Cache result if enabled
      if (context.options?.cacheResults) {
        this.cacheResult(cacheKey, result);
      }
      
      // Step 8: Store analysis for learning (optional)
      await this.storeAnalysisForLearning(context, result);
      
      console.log(`[UnifiedAnalysis] Analysis completed - ${tokensUsed} tokens, $${costUsd.toFixed(4)}`);
      return result;

    } catch (error) {
      console.error('[UnifiedAnalysis] Error analyzing email:', error);
      return {
        success: false,
        metadata: {
          modelUsed: 'none',
          tokensUsed: 0,
          costUsd: 0,
          processingTimeMs: Date.now() - startTime,
          analysisVersion: '1.0.0',
          cacheHit: false
        },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * BUILD COMPREHENSIVE ANALYSIS PROMPT
   */
  private async buildAnalysisSystemPrompt(context: AnalysisContext): Promise<string> {
    // Get organization settings for context
    let orgSettings: any = {};
    let commPrefs: any = {};
    
    if (context.organizationId) {
      try {
        orgSettings = await this.organizationService.getSettings(context.organizationId);
        commPrefs = await this.organizationService.getCommunicationPreferences(context.organizationId);
      } catch (error) {
        console.error('[UnifiedAnalysis] Error getting organization settings:', error);
      }
    }

    let systemPrompt = `You are an expert email analysis AI that provides comprehensive, accurate analysis of email communications.

ANALYSIS REQUIREMENTS:
Your response must be a valid JSON object with this exact structure:
{
  "language": {
    "code": "ISO language code (en, sl, de, it, fr, es, hr, etc.)",
    "name": "Full language name",
    "confidence": 0.95,
    "culturalContext": "Brief cultural context if relevant",
    "countryCode": "Country code if detectable"
  },
  "classification": {
    "category": "sales|support|dispute|billing|product_inquiry|general",
    "intent": "new_lead|existing_customer|complaint|question|request_info|other",
    "urgency": "low|medium|high|urgent",
    "sentiment": "positive|neutral|negative|frustrated",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "confidence": 0.85
  },
  "context": {
    "emailType": "inquiry|complaint|update|request|confirmation|general",
    "actionRequired": true,
    "informationProvided": ["info1", "info2"],
    "informationMissing": ["missing1", "missing2"],
    "nextSteps": ["step1", "step2"],
    "relationshipContext": "description of sender relationship",
    "responseGuidance": "guidance for response approach"
  },
  "patterns": {
    "formality": 0.7,
    "directness": 0.8,
    "emotionalTone": 0.6,
    "technicalLevel": 0.4,
    "questionFrequency": 0.2,
    "urgencyLevel": 0.5
  },
  "recommendations": {
    "responseApproach": "consultative|direct|supportive|apologetic",
    "suggestedTone": "professional|friendly|formal|empathetic",
    "keyPointsToAddress": ["point1", "point2"],
    "escalateToHuman": false,
    "priority": "low|medium|high|urgent"
  }
}

LANGUAGE DETECTION EXPERTISE:
- Pay special attention to Slavic languages (Slovenian, Croatian, Serbian, etc.)
- Look for characteristic letters: č, š, ž, ć, đ, ň, ř
- Common Slovenian words: "je", "in", "na", "za", "se", "da", "bo", "so", "ali", "tudi", "lahko"
- Common German words: "der", "die", "das", "und", "ist", "zu", "mit", "auf", "für", "von"
- Common Italian words: "il", "la", "di", "che", "e", "a", "un", "per", "con", "da"
- Be highly accurate - this affects response language matching

CLASSIFICATION EXPERTISE:
- Sales: Interest in products, pricing inquiries, purchase intent
- Support: Technical issues, how-to questions, troubleshooting
- Dispute: Complaints, returns, dissatisfaction, problems with orders
- Billing: Payment issues, invoices, charges, refunds
- Product Inquiry: Specific product questions, availability, specifications
- General: Everything else not fitting above categories

SENTIMENT ANALYSIS:
- Positive: Satisfaction, praise, enthusiasm, gratitude
- Neutral: Factual inquiries, standard requests, informational
- Negative: Dissatisfaction, complaints, problems
- Frustrated: Repeated issues, escalated complaints, impatience

URGENCY DETECTION:
- Urgent: "urgent", "emergency", "ASAP", "immediately", "critical"
- High: "soon", "quickly", "important", "deadline", "time sensitive"  
- Medium: "when possible", "convenient", "planning"
- Low: "eventually", "no rush", "whenever", "future reference"`;

    // Add organization-specific context
    if (orgSettings.name) {
      systemPrompt += `\n\nORGANIZATION CONTEXT:
You are analyzing emails for ${orgSettings.name}.`;
      
      if (orgSettings.industry) {
        systemPrompt += ` Industry: ${orgSettings.industry}.`;
      }
      
      if (commPrefs.default_language) {
        systemPrompt += ` Primary business language: ${commPrefs.default_language}.`;
      }
    }

    systemPrompt += `\n\nANALYSIS GUIDELINES:
1. Be extremely accurate with language detection - this is critical
2. Provide detailed but concise analysis in all areas
3. Focus on actionable insights for response generation
4. Consider cultural context in communication patterns
5. Be consistent with classification categories
6. Provide confidence scores based on clarity of indicators
7. Identify what information is explicitly provided vs missing
8. Suggest concrete next steps and response approach`;

    return systemPrompt;
  }

  /**
   * BUILD USER PROMPT FOR ANALYSIS
   */
  private buildAnalysisUserPrompt(context: AnalysisContext): string {
    const email = context.emailContent;
    
    return `Please analyze this email comprehensively:

FROM: ${email.from}
TO: ${email.to}
SUBJECT: ${email.subject}
DATE: ${email.date || new Date().toISOString()}

EMAIL CONTENT:
${email.body}

Provide a complete analysis following the JSON structure specified in the system prompt. Pay special attention to:
1. Accurate language detection (critical for response matching)
2. Clear classification of category and intent
3. Realistic urgency and sentiment assessment
4. Practical recommendations for response approach
5. Identification of what information is provided vs missing`;
  }

  /**
   * ENHANCE WITH RULE-BASED ANALYSIS
   * Combines AI analysis with rule-based patterns for better accuracy
   */
  private async enhanceWithRuleBasedAnalysis(aiAnalysis: any, context: AnalysisContext): Promise<any> {
    const email = context.emailContent;
    const content = `${email.subject} ${email.body}`.toLowerCase();
    
    // Rule-based language detection backup
    const ruleBasedLanguage = this.detectLanguageByRules(email.body);
    if (ruleBasedLanguage && aiAnalysis.language.confidence < 0.8) {
      aiAnalysis.language = {
        ...aiAnalysis.language,
        ...ruleBasedLanguage,
        confidence: Math.max(aiAnalysis.language.confidence, ruleBasedLanguage.confidence)
      };
    }
    
    // Rule-based urgency enhancement
    const ruleBasedUrgency = this.detectUrgencyByRules(content);
    if (ruleBasedUrgency && ruleBasedUrgency !== aiAnalysis.classification.urgency) {
      // Take the higher urgency level
      const urgencyLevels = { low: 1, medium: 2, high: 3, urgent: 4 };
      if (urgencyLevels[ruleBasedUrgency] > urgencyLevels[aiAnalysis.classification.urgency]) {
        aiAnalysis.classification.urgency = ruleBasedUrgency;
      }
    }
    
    // Rule-based keyword extraction
    const ruleBasedKeywords = this.extractKeywordsByRules(content);
    aiAnalysis.classification.keywords = [
      ...new Set([...aiAnalysis.classification.keywords, ...ruleBasedKeywords])
    ].slice(0, 5);
    
    // Add customer context if available
    if (context.organizationId) {
      const customerContext = await this.getCustomerContext(email.from, context.userId);
      if (customerContext) {
        aiAnalysis.context.relationshipContext = `Existing customer with ${customerContext.totalOrders} orders, last interaction: ${customerContext.lastOrderDate}`;
        if (aiAnalysis.classification.intent === 'new_lead' && customerContext.totalOrders > 0) {
          aiAnalysis.classification.intent = 'existing_customer';
        }
      }
    }
    
    return aiAnalysis;
  }

  /**
   * RULE-BASED LANGUAGE DETECTION
   */
  private detectLanguageByRules(text: string): { code: string; name: string; confidence: number } | null {
    const content = text.toLowerCase();
    
    // Slovenian patterns
    const slovenianPatterns = [
      /[čšžćđ]/g, // Characteristic letters
      /\b(je|in|na|za|se|da|bo|so|ali|tudi|lahko|samo|še|že|kot|ker|če|bi|pri|od|do|po|iz|s|z|v|o)\b/g
    ];
    
    // German patterns  
    const germanPatterns = [
      /\b(der|die|das|und|ist|zu|mit|auf|für|von|dem|den|des|im|am|zum|zur|durch|über|unter|zwischen)\b/g,
      /[äöüß]/g
    ];
    
    // Italian patterns
    const italianPatterns = [
      /\b(il|la|di|che|e|a|un|per|con|da|del|della|le|gli|una|nel|alla|dal|sul|come|più|anche)\b/g
    ];
    
    // Count matches
    let slovenianScore = 0;
    let germanScore = 0;
    let italianScore = 0;
    
    slovenianPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      slovenianScore += matches ? matches.length : 0;
    });
    
    germanPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      germanScore += matches ? matches.length : 0;
    });
    
    italianPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      italianScore += matches ? matches.length : 0;
    });
    
    // Determine winner
    const maxScore = Math.max(slovenianScore, germanScore, italianScore);
    if (maxScore < 2) return null; // Not enough evidence
    
    const confidence = Math.min(0.95, maxScore / (content.split(' ').length * 0.1));
    
    if (maxScore === slovenianScore) {
      return { code: 'sl', name: 'Slovenian', confidence };
    } else if (maxScore === germanScore) {
      return { code: 'de', name: 'German', confidence };
    } else if (maxScore === italianScore) {
      return { code: 'it', name: 'Italian', confidence };
    }
    
    return null;
  }

  /**
   * RULE-BASED URGENCY DETECTION
   */
  private detectUrgencyByRules(content: string): 'low' | 'medium' | 'high' | 'urgent' | null {
    const urgentKeywords = ['urgent', 'emergency', 'asap', 'immediately', 'critical', 'stopped working'];
    const highKeywords = ['soon', 'quickly', 'important', 'deadline', 'time sensitive'];
    const mediumKeywords = ['when possible', 'convenient', 'sometime', 'planning'];
    const lowKeywords = ['eventually', 'no rush', 'whenever', 'future reference'];
    
    if (urgentKeywords.some(keyword => content.includes(keyword))) return 'urgent';
    if (highKeywords.some(keyword => content.includes(keyword))) return 'high';
    if (lowKeywords.some(keyword => content.includes(keyword))) return 'low';
    if (mediumKeywords.some(keyword => content.includes(keyword))) return 'medium';
    
    return null;
  }

  /**
   * RULE-BASED KEYWORD EXTRACTION
   */
  private extractKeywordsByRules(content: string): string[] {
    const keywords: string[] = [];
    
    // Product-related keywords
    const productKeywords = ['product', 'item', 'order', 'purchase', 'buy', 'price', 'cost', 'quote'];
    productKeywords.forEach(keyword => {
      if (content.includes(keyword)) keywords.push(keyword);
    });
    
    // Support-related keywords
    const supportKeywords = ['help', 'support', 'problem', 'issue', 'error', 'broken', 'fix'];
    supportKeywords.forEach(keyword => {
      if (content.includes(keyword)) keywords.push(keyword);
    });
    
    // Billing-related keywords
    const billingKeywords = ['invoice', 'payment', 'bill', 'charge', 'refund'];
    billingKeywords.forEach(keyword => {
      if (content.includes(keyword)) keywords.push(keyword);
    });
    
    return keywords.slice(0, 3);
  }

  /**
   * GET CUSTOMER CONTEXT
   */
  private async getCustomerContext(fromEmail: string, userId: string) {
    try {
      const metakockaClient = await createMetakockaClientForUser(userId);
      if (metakockaClient) {
        return await metakockaClient.getCustomerByEmail(fromEmail);
      }
      return null;
    } catch (error) {
      console.error('[UnifiedAnalysis] Error getting customer context:', error);
      return null;
    }
  }

  /**
   * MODEL SELECTION
   */
  private async selectOptimalModel(context: AnalysisContext) {
    try {
      const complexity = this.assessAnalysisComplexity(context);
      const selection = await this.modelRouter.analyzeTaskComplexity(
        `Email analysis: ${context.emailContent.subject}`,
        {
          task_type: 'email_analysis',
          complexity: complexity,
          requires_accuracy: true
        }
      );

      return {
        model: selection.suggestedModel,
        reasoning: selection.reasoning.join(', ')
      };
    } catch (error) {
      console.error('[UnifiedAnalysis] Error in model selection:', error);
      return {
        model: 'gpt-4o-mini', // Safe fallback for analysis
        reasoning: 'Fallback due to model selection error'
      };
    }
  }

  /**
   * ASSESS ANALYSIS COMPLEXITY
   */
  private assessAnalysisComplexity(context: AnalysisContext): string {
    const email = context.emailContent;
    const contentLength = email.body.length;
    const hasAttachments = email.body.includes('attachment') || email.body.includes('attached');
    const hasMultipleQuestions = (email.body.match(/\?/g) || []).length > 3;
    
    if (contentLength > 1000 || hasAttachments || hasMultipleQuestions) {
      return 'complex';
    } else if (contentLength > 300) {
      return 'standard';
    } else {
      return 'simple';
    }
  }

  /**
   * CACHING SYSTEM
   */
  private generateCacheKey(context: AnalysisContext): string {
    const content = context.emailContent.body.substring(0, 200);
    return `analysis_${context.emailId}_${Buffer.from(content).toString('base64').substring(0, 20)}`;
  }

  private getCachedResult(cacheKey: string): AnalysisResult | null {
    const cached = this.analysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
      return { ...cached.result, metadata: { ...cached.result.metadata, cacheHit: true } };
    }
    return null;
  }

  private cacheResult(cacheKey: string, result: AnalysisResult): void {
    this.analysisCache.set(cacheKey, { result, timestamp: Date.now() });
    
    // Clean old cache entries
    if (this.analysisCache.size > 100) {
      const oldestKey = Array.from(this.analysisCache.keys())[0];
      this.analysisCache.delete(oldestKey);
    }
  }

  /**
   * STORE ANALYSIS FOR LEARNING
   */
  private async storeAnalysisForLearning(context: AnalysisContext, result: AnalysisResult): Promise<void> {
    try {
      if (!result.success || !result.analysis) return;
      
      await this.supabase
        .from('email_analysis')
        .insert({
          email_id: context.emailId,
          user_id: context.userId,
          classification: result.analysis.classification,
          analysis_result: result.analysis,
          detected_language: result.analysis.language.code,
          version_number: 1,
          metadata: {
            analysisVersion: result.metadata.analysisVersion,
            modelUsed: result.metadata.modelUsed,
            tokensUsed: result.metadata.tokensUsed,
            costUsd: result.metadata.costUsd,
            processingTimeMs: result.metadata.processingTimeMs
          },
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('[UnifiedAnalysis] Error storing analysis for learning:', error);
    }
  }

  /**
   * CALCULATE COSTS
   */
  private calculateCost(model: string, tokens: number): number {
    const costMap: Record<string, number> = {
      'gpt-3.5-turbo': 0.0015,
      'gpt-4o-mini': 0.00015,
      'gpt-4o': 0.005,
      'gpt-4': 0.03
    };
    
    return (tokens / 1000) * (costMap[model] || 0.00015);
  }
}


