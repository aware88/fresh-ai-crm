/**
 * Email Learning Service - Intelligent Pattern Recognition and Learning
 * 
 * This service analyzes user's email communication patterns and learns from them
 * to generate contextually appropriate responses. It focuses on quality over quantity,
 * learning specific question-answer patterns and communication styles.
 */

import { createClient } from '@supabase/supabase-js';
import { ModelRouterService } from '@/lib/ai/model-router-service';
import OpenAI from 'openai';
import type { Database } from '@/types/supabase';

// Language detection helper
function detectLanguage(text: string): string {
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Slovenian indicators
  const slovenianWords = ['je', 'in', 'za', 'na', 'se', 'da', 'ki', 'so', 'bo', 'ali', 'kot', 'od', 'do', 'pri', 'z', 'v', 'o', 'pa', 'če', 'lahko', 'sem', 'si', 'ga', 'mu', 'ji', 'jo', 'jim', 'jih', 'hvala', 'prosim', 'lep', 'pozdrav', 'sporočilo'];
  const englishWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'thank', 'you', 'please', 'regards', 'message'];
  
  const words = cleanText.split(/\s+/).filter(w => w.length > 1);
  
  let slovenianCount = 0;
  let englishCount = 0;
  
  for (const word of words) {
    if (slovenianWords.includes(word)) slovenianCount++;
    if (englishWords.includes(word)) englishCount++;
  }
  
  // Slovenian specific patterns
  if (text.includes('č') || text.includes('ž') || text.includes('š') || 
      text.includes('ć') || text.includes('đ') || text.includes('ije') ||
      text.includes('konec') || text.includes('dimenzije') || text.includes('vrečo')) {
    slovenianCount += 3;
  }
  
  if (slovenianCount > englishCount) return 'sl';
  if (englishCount > slovenianCount) return 'en';
  return 'mixed'; // Default for unclear cases
}

export interface EmailLearningPattern {
  id: string;
  pattern_type: string;
  context_category: string;
  trigger_keywords: string[];
  response_template: string;
  confidence_score: number;
  example_pairs: Array<{ question: string; answer: string }>;
}

export interface LearningAnalysis {
  patterns_found: number;
  quality_score: number;
  recommendations: string[];
  processing_time_ms: number;
  cost_usd: number;
  tokens_used: number;
}

export interface EmailPair {
  received_email: {
    id: string;
    subject: string;
    body: string;
    sender: string;
    received_at: string;
  };
  sent_response?: {
    id: string;
    subject: string;
    body: string;
    sent_at: string;
  };
}

export class EmailLearningService {
  private supabase: any;
  private modelRouter: ModelRouterService | null = null;
  
  // Performance optimization: Add memory caches
  private draftCache: Map<string, { draft: any; timestamp: number }> = new Map();
  private patternCache: Map<string, { patterns: any[]; timestamp: number }> = new Map();
  private configCache: Map<string, { config: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private openai: OpenAI;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Initialize model router for intelligent AI model selection
   */
  private async initializeModelRouter(userId: string, organizationId?: string): Promise<void> {
    if (!this.modelRouter && organizationId) {
      this.modelRouter = new ModelRouterService(
        this.supabase,
        this.openai,
        organizationId,
        userId
      );
    }
  }

  /**
   * PHASE 1: Perform initial learning from user's email history
   * This analyzes up to maxEmails to extract communication patterns
   */
  async performInitialLearning(
    userId: string, 
    organizationId?: string,
    maxEmails: number = 5000
  ): Promise<LearningAnalysis> {
    const startTime = Date.now();
    let totalCost = 0;
    let totalTokens = 0;
    
    console.log(`[EmailLearning] Starting initial learning for user ${userId} with max ${maxEmails} emails`);

    try {
      await this.initializeModelRouter(userId, organizationId);
      
      // 1. Get user's learning configuration
      const learningConfig = await this.getUserLearningConfig(userId);
      
      // 2. Fetch email pairs (received emails with their responses)
      const emailPairs = await this.fetchEmailPairsForLearning(
        userId, 
        Math.min(maxEmails, learningConfig.max_emails_to_analyze),
        learningConfig,
        organizationId
      );
      
      console.log(`[EmailLearning] Found ${emailPairs.length} email pairs to analyze`);
      
      if (emailPairs.length === 0) {
        return {
          patterns_found: 0,
          quality_score: 0,
          recommendations: ['No email pairs found for learning. Send and receive more emails to improve learning.'],
          processing_time_ms: Date.now() - startTime,
          cost_usd: 0,
          tokens_used: 0
        };
      }

      // 3. Group email pairs by language for better pattern recognition
      const languageGroups = this.groupEmailPairsByLanguage(emailPairs);
      console.log(`[EmailLearning] Language distribution:`, Object.keys(languageGroups).map(lang => `${lang}: ${languageGroups[lang].length}`).join(', '));

      // 4. Analyze patterns separately for each language
      const batchSize = 10; // Process 10 email pairs at a time
      const patterns: EmailLearningPattern[] = [];
      const recommendations: string[] = [];

      for (const [language, langEmailPairs] of Object.entries(languageGroups)) {
        console.log(`[EmailLearning] Processing ${langEmailPairs.length} ${language} email pairs...`);
        
        for (let i = 0; i < langEmailPairs.length; i += batchSize) {
          const batch = langEmailPairs.slice(i, i + batchSize);
          console.log(`[EmailLearning] Processing ${language} batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(langEmailPairs.length/batchSize)}`);
          
          const batchResult = await this.analyzeBatchPatterns(batch, userId, organizationId, language);
          patterns.push(...batchResult.patterns);
          recommendations.push(...batchResult.recommendations);
          totalCost += batchResult.cost_usd;
          totalTokens += batchResult.tokens_used;
          
          // Small delay to prevent rate limiting
          if (i + batchSize < langEmailPairs.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // 5. Merge similar patterns to avoid duplication
      const mergedPatterns = await this.mergeSimilarPatterns(patterns, learningConfig.pattern_merge_threshold);
      
      // 6. Save patterns to database
      const savedPatterns = await this.saveLearnedPatterns(mergedPatterns, userId, organizationId);
      
      // 7. Record learning analytics
      await this.recordLearningAnalytics(userId, organizationId, {
        session_type: 'initial_learning',
        emails_analyzed: emailPairs.length,
        patterns_created: savedPatterns,
        processing_time_seconds: Math.floor((Date.now() - startTime) / 1000),
        ai_cost_usd: totalCost,
        tokens_used: totalTokens,
        learning_quality_score: this.calculateLearningQuality(patterns)
      });

      const qualityScore = this.calculateLearningQuality(patterns);
      
      // Add quality-based recommendations
      if (qualityScore < 0.6) {
        recommendations.push('Learning quality could be improved. Try to maintain consistent communication styles.');
      }
      if (patterns.length < 5) {
        recommendations.push('More email interactions needed for better pattern recognition.');
      }

      console.log(`[EmailLearning] Initial learning completed. Found ${savedPatterns} patterns with quality score ${qualityScore}`);

      return {
        patterns_found: savedPatterns,
        quality_score: qualityScore,
        recommendations,
        processing_time_ms: Date.now() - startTime,
        cost_usd: totalCost,
        tokens_used: totalTokens
      };

    } catch (error) {
      console.error('[EmailLearning] Error during initial learning:', error);
      throw new Error(`Learning failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's learning configuration or create default one
   */
  private async getUserLearningConfig(userId: string): Promise<any> {
    const { data: config, error } = await this.supabase
      .from('user_email_learning_config')
      .select('*')
      .eq('created_by', userId)
      .single();

    if (error || !config) {
      // Create default configuration
      const defaultConfig = {
        user_id: userId,
        max_emails_to_analyze: 5000,
        learning_email_types: ['sent', 'received'],
        date_range_days: 365,
        excluded_senders: [],
        excluded_domains: [],
        learning_sensitivity: 'balanced',
        minimum_pattern_confidence: 0.6,
        pattern_merge_threshold: 0.8,
        auto_draft_enabled: true,
        auto_draft_confidence_threshold: 0.7
      };

      const { data: newConfig, error: insertError } = await this.supabase
        .from('user_email_learning_config')
        .insert(defaultConfig)
        .select()
        .single();

      if (insertError) {
        console.warn('[EmailLearning] Could not create default config, using in-memory defaults');
        return defaultConfig;
      }

      return newConfig;
    }

    return config;
  }

  /**
   * Fetch email pairs for learning (received emails with their sent responses)
   */
  private async fetchEmailPairsForLearning(
    userId: string,
    maxEmails: number,
    config: any,
    organizationId?: string
  ): Promise<EmailPair[]> {
    // Calculate date range
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - config.date_range_days);

    // Fetch received emails
    const { data: receivedEmails, error: receivedError } = await this.supabase
      .from('emails')
      .select('id, subject, raw_content, plain_content, sender, created_at, message_id')
      .eq('created_by', userId)
      .eq('email_type', 'received')
      .gte('created_at', dateThreshold.toISOString())
      .not('sender', 'in', `(${config.excluded_senders.map((s: string) => `"${s}"`).join(',')})`)
      .order('created_at', { ascending: false })
      .limit(maxEmails);

    if (receivedError) {
      console.error('[EmailLearning] Error fetching received emails:', receivedError);
      return [];
    }

    if (!receivedEmails || receivedEmails.length === 0) {
      return [];
    }

    // For each received email, try to find a sent response within 7 days
    const emailPairs: EmailPair[] = [];
    
    for (const receivedEmail of receivedEmails) {
      // Look for sent emails that might be responses
      const responseDate = new Date(receivedEmail.created_at);
      responseDate.setDate(responseDate.getDate() + 7); // Look for responses within 7 days

      const { data: sentResponses } = await this.supabase
        .from('emails')
        .select('id, subject, raw_content, plain_content, created_at')
        .eq('created_by', userId)
        .eq('email_type', 'sent')
        .gte('created_at', receivedEmail.created_at)
        .lte('created_at', responseDate.toISOString())
        .or(`subject.ilike.%${receivedEmail.subject?.replace('Re: ', '').replace('RE: ', '')}%`)
        .order('created_at', { ascending: true })
        .limit(1);

      const emailPair: EmailPair = {
        received_email: {
          id: receivedEmail.id,
          subject: receivedEmail.subject || '',
          body: receivedEmail.raw_content || receivedEmail.plain_content || '',
          sender: receivedEmail.sender || '',
          received_at: receivedEmail.created_at
        }
      };

      // Add response if found
      if (sentResponses && sentResponses.length > 0) {
        const response = sentResponses[0];
        emailPair.sent_response = {
          id: response.id,
          subject: response.subject || '',
          body: response.raw_content || response.plain_content || '',
          sent_at: response.created_at
        };
      }

      emailPairs.push(emailPair);
    }

    return emailPairs.filter(pair => pair.sent_response); // Only return pairs with responses for learning
  }

  /**
   * Group email pairs by detected language for better pattern recognition
   */
  private groupEmailPairsByLanguage(emailPairs: EmailPair[]): Record<string, EmailPair[]> {
    const languageGroups: Record<string, EmailPair[]> = {};

    for (const pair of emailPairs) {
      // Detect language from both received and sent emails
      const receivedText = `${pair.received_email.subject} ${pair.received_email.body}`;
      const sentText = pair.sent_response ? `${pair.sent_response.subject} ${pair.sent_response.body}` : '';
      
      // Combine both for more accurate detection
      const combinedText = `${receivedText} ${sentText}`;
      const detectedLanguage = detectLanguage(combinedText);
      
      if (!languageGroups[detectedLanguage]) {
        languageGroups[detectedLanguage] = [];
      }
      
      languageGroups[detectedLanguage].push(pair);
    }

    return languageGroups;
  }

  /**
   * Analyze a batch of email pairs to extract patterns
   */
  private async analyzeBatchPatterns(
    emailPairs: EmailPair[],
    userId: string,
    organizationId?: string,
    language: string = 'mixed'
  ): Promise<{
    patterns: EmailLearningPattern[];
    recommendations: string[];
    cost_usd: number;
    tokens_used: number;
  }> {
    const patterns: EmailLearningPattern[] = [];
    const recommendations: string[] = [];
    let totalCost = 0;
    let totalTokens = 0;

    // Prepare batch analysis prompt with language context
    const analysisPrompt = this.createPatternAnalysisPrompt(emailPairs, language);
    
    try {
      // Force GPT-4o for initial learning (better accuracy and JSON reliability)
      const modelChoice = { model: 'gpt-4o', reasoning: 'High-quality initial learning' };

      console.log(`[EmailLearning] Using model ${modelChoice.model} for pattern analysis`);

      const response = await this.openai.chat.completions.create({
        model: modelChoice.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert email communication analyst. Analyze email patterns to help users improve their email responses. IMPORTANT: Return your response as valid JSON only, without any markdown formatting or code blocks.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const analysisResult = response.choices[0]?.message?.content;
      totalTokens = response.usage?.total_tokens || 0;
      
      // Calculate cost for GPT-4o ($0.005 per 1K tokens)
      if (response.usage) {
        totalCost = (response.usage.total_tokens / 1000) * 0.005;
      }

      if (analysisResult) {
        const extractedPatterns = await this.parsePatternAnalysis(analysisResult, userId, organizationId);
        patterns.push(...extractedPatterns);
      }

    } catch (error) {
      console.error('[EmailLearning] Error in batch pattern analysis:', error);
      recommendations.push('Some patterns could not be analyzed due to processing errors.');
    }

    return {
      patterns,
      recommendations,
      cost_usd: totalCost,
      tokens_used: totalTokens
    };
  }

  /**
   * Create a focused prompt for pattern analysis
   */
  private createPatternAnalysisPrompt(emailPairs: EmailPair[], language: string = 'mixed'): string {
    const examples = emailPairs.slice(0, 5).map((pair, index) => {
      return `
EMAIL PAIR ${index + 1}:
RECEIVED: "${pair.received_email.subject}"
${pair.received_email.body.substring(0, 500)}...

RESPONSE: "${pair.sent_response?.subject}"
${pair.sent_response?.body.substring(0, 500)}...
---`;
    }).join('\n');

    const languageInstruction = language === 'sl' ? 
      'IMPORTANT: All patterns are in Slovenian. Analyze Slovenian communication patterns, keywords, and response templates.' :
      language === 'en' ? 
      'IMPORTANT: All patterns are in English. Focus on English communication patterns, keywords, and response templates.' :
      'IMPORTANT: These emails contain mixed languages (English/Slovenian). Separate patterns by language for optimal learning.';

    return `Analyze these email communication patterns and extract specific question-answer patterns:

${examples}

${languageInstruction}

Please identify:
1. SPECIFIC question types and their corresponding answer patterns
2. Communication style elements (tone, formality, structure)  
3. Common response templates that could be reused
4. Keywords that trigger specific types of responses (in the appropriate language)

Return your analysis as structured JSON with this format:
{
  "patterns": [
    {
      "pattern_type": "question_response|greeting_style|closing_style|complaint_handling|etc",
      "context_category": "customer_inquiry|sales_request|technical_support|etc", 
      "trigger_keywords": ["keyword1", "keyword2"],
      "response_template": "Template with placeholders like {customer_name}",
      "confidence_score": 0.8,
      "example_pairs": [{"question": "...", "answer": "..."}]
    }
  ],
  "style_analysis": {
    "tone": "professional|friendly|formal",
    "avg_response_length": "concise|detailed",
    "formality_level": "high|medium|low"
  }
}

Focus on patterns that are:
- Specific and actionable
- Have clear triggers (keywords/phrases)
- Can be generalized to similar situations
- Show consistent communication style`;
  }

  /**
   * Parse AI analysis results into structured patterns
   */
  private async parsePatternAnalysis(
    analysisResult: string,
    userId: string,
    organizationId?: string
  ): Promise<EmailLearningPattern[]> {
    try {
      // Clean the analysis result - remove markdown formatting if present
      let cleanedResult = analysisResult;
      
      // Remove markdown code blocks (```json ... ```)
      if (cleanedResult.includes('```')) {
        cleanedResult = cleanedResult.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      }
      
      // Remove leading/trailing whitespace and backticks
      cleanedResult = cleanedResult.trim().replace(/^`+|`+$/g, '');
      
      const parsed = JSON.parse(cleanedResult);
      const patterns: EmailLearningPattern[] = [];

      if (parsed.patterns && Array.isArray(parsed.patterns)) {
        for (const pattern of parsed.patterns) {
          patterns.push({
            id: '', // Will be set when saved to database
            pattern_type: pattern.pattern_type || 'general_inquiry',
            context_category: pattern.context_category || 'general',
            trigger_keywords: pattern.trigger_keywords || [],
            response_template: pattern.response_template || '',
            confidence_score: Math.min(1.0, Math.max(0.1, pattern.confidence_score || 0.5)),
            example_pairs: pattern.example_pairs || []
          });
        }
      }

      return patterns;
    } catch (error) {
      console.error('[EmailLearning] Error parsing pattern analysis:', error);
      return [];
    }
  }

  /**
   * Merge similar patterns to avoid duplication
   */
  private async mergeSimilarPatterns(
    patterns: EmailLearningPattern[],
    mergeThreshold: number = 0.8
  ): Promise<EmailLearningPattern[]> {
    const mergedPatterns: EmailLearningPattern[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < patterns.length; i++) {
      if (processed.has(i)) continue;

      const currentPattern = patterns[i];
      const similarPatterns = [currentPattern];

      // Find similar patterns
      for (let j = i + 1; j < patterns.length; j++) {
        if (processed.has(j)) continue;

        const similarity = this.calculatePatternSimilarity(currentPattern, patterns[j]);
        if (similarity >= mergeThreshold) {
          similarPatterns.push(patterns[j]);
          processed.add(j);
        }
      }

      // Merge similar patterns
      if (similarPatterns.length > 1) {
        const merged = this.mergePatterns(similarPatterns);
        mergedPatterns.push(merged);
      } else {
        mergedPatterns.push(currentPattern);
      }

      processed.add(i);
    }

    return mergedPatterns;
  }

  /**
   * Calculate similarity between two patterns
   */
  private calculatePatternSimilarity(pattern1: EmailLearningPattern, pattern2: EmailLearningPattern): number {
    // Same pattern type and context
    if (pattern1.pattern_type !== pattern2.pattern_type || 
        pattern1.context_category !== pattern2.context_category) {
      return 0;
    }

    // Calculate keyword overlap
    const keywords1 = new Set(pattern1.trigger_keywords.map(k => k.toLowerCase()));
    const keywords2 = new Set(pattern2.trigger_keywords.map(k => k.toLowerCase()));
    const intersection = new Set(Array.from(keywords1).filter(k => keywords2.has(k)));
    const union = new Set([...Array.from(keywords1), ...Array.from(keywords2)]);
    
    const keywordSimilarity = union.size > 0 ? intersection.size / union.size : 0;

    // Template similarity (basic check)
    const templateSimilarity = pattern1.response_template.length > 0 && pattern2.response_template.length > 0
      ? this.calculateStringSimilarity(pattern1.response_template, pattern2.response_template)
      : 0;

    return (keywordSimilarity * 0.6) + (templateSimilarity * 0.4);
  }

  /**
   * Calculate basic string similarity
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set(Array.from(set1).filter(w => set2.has(w)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Merge multiple similar patterns into one
   */
  private mergePatterns(patterns: EmailLearningPattern[]): EmailLearningPattern {
    const merged: EmailLearningPattern = {
      id: '',
      pattern_type: patterns[0].pattern_type,
      context_category: patterns[0].context_category,
      trigger_keywords: [],
      response_template: patterns[0].response_template,
      confidence_score: 0,
      example_pairs: []
    };

    // Merge keywords
    const allKeywords = new Set<string>();
    patterns.forEach(p => p.trigger_keywords.forEach(k => allKeywords.add(k.toLowerCase())));
    merged.trigger_keywords = Array.from(allKeywords);

    // Average confidence score
    merged.confidence_score = patterns.reduce((sum, p) => sum + p.confidence_score, 0) / patterns.length;

    // Merge example pairs
    patterns.forEach(p => merged.example_pairs.push(...p.example_pairs));

    return merged;
  }

  /**
   * Save learned patterns to database
   */
  private async saveLearnedPatterns(
    patterns: EmailLearningPattern[],
    userId: string,
    organizationId?: string
  ): Promise<number> {
    let savedCount = 0;

    for (const pattern of patterns) {
      try {
        const { data, error } = await this.supabase
          .from('email_patterns')
          .insert({
            user_id: userId,
            organization_id: organizationId,
            pattern_type: pattern.pattern_type,
            email_category: pattern.context_category,
            pattern_text: pattern.response_template,
            context: `Triggers: ${pattern.trigger_keywords.join(', ')}`,
            confidence: pattern.confidence_score,
            frequency_count: 1,
            extracted_from_email_ids: [],
            tags: pattern.trigger_keywords,
            is_active: true
          })
          .select('id')
          .single();

        if (error) {
          console.error('[EmailLearning] Error saving pattern:', error);
        } else {
          savedCount++;
        }
      } catch (error) {
        console.error('[EmailLearning] Error saving pattern:', error);
      }
    }

    return savedCount;
  }

  /**
   * Record learning analytics
   */
  private async recordLearningAnalytics(
    userId: string,
    organizationId: string | undefined,
    analytics: any
  ): Promise<void> {
    try {
      await this.supabase
        .from('email_learning_analytics')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          ...analytics,
          session_end: new Date().toISOString()
        });
    } catch (error) {
      console.error('[EmailLearning] Error recording analytics:', error);
    }
  }

  /**
   * Calculate overall learning quality score
   */
  private calculateLearningQuality(patterns: EmailLearningPattern[]): number {
    if (patterns.length === 0) return 0;

    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence_score, 0) / patterns.length;
    const diversityScore = new Set(patterns.map(p => p.pattern_type)).size / Math.max(patterns.length, 5);
    const completenessScore = patterns.filter(p => 
      p.trigger_keywords.length > 0 && 
      p.response_template.length > 10 &&
      p.example_pairs.length > 0
    ).length / patterns.length;

    return (avgConfidence * 0.4) + (diversityScore * 0.3) + (completenessScore * 0.3);
  }

  /**
   * PHASE 3: Generate background draft for new incoming email
   * This is called when a new email is received to pre-generate a response
   */
  async generateBackgroundDraft(
    messageId: string,
    userId: string,
    organizationId?: string
  ): Promise<{
    success: boolean;
    draft?: {
      id: string;
      subject: string;
      body: string;
      confidence: number;
      matched_patterns: string[];
    };
    error?: string;
  }> {
    const startTime = Date.now();
    let totalCost = 0;
    let totalTokens = 0;

    try {
      console.log(`[EmailLearning] Generating background draft for message ${messageId}`);

      await this.initializeModelRouter(userId, organizationId);

      // 1. Get the email content
      const email = await this.getEmailById(messageId, userId);
      if (!email) {
        return {
          success: false,
          error: 'Email not found'
        };
      }

      // 2. Check memory cache first for speed
      const cacheKey = `${messageId}_${userId}`;
      const cachedDraft = this.draftCache.get(cacheKey);
      if (cachedDraft && Date.now() - cachedDraft.timestamp < this.CACHE_TTL) {
        console.log(`[EmailLearning] Using cached draft for message ${messageId}`);
        return {
          success: true,
          draft: cachedDraft.draft
        };
      }

      // 3. Check if draft already exists in database
      const existingDraft = await this.getExistingDraft(messageId, userId);
      if (existingDraft && existingDraft.status === 'ready') {
        console.log(`[EmailLearning] Using existing draft for message ${messageId}`);
        const draft = {
          id: existingDraft.id,
          subject: existingDraft.subject,
          body: existingDraft.body,
          confidence: existingDraft.confidence_score,
          matched_patterns: existingDraft.matched_patterns || []
        };
        
        // Cache the result for future use
        this.draftCache.set(cacheKey, { draft, timestamp: Date.now() });
        
        return {
          success: true,
          draft
        };
      }

      // 4. Get user's learning configuration (with caching)
      const learningConfig = await this.getUserLearningConfigCached(userId);
      if (!learningConfig.auto_draft_enabled) {
        console.log(`[EmailLearning] Auto-draft disabled for user ${userId}`);
        return {
          success: false,
          error: 'Auto-draft generation is disabled'
        };
      }

      // 4. Find matching patterns for this email
      const patternMatches = await this.findMatchingPatterns(
        email.content,
        email.sender,
        userId
      );

      console.log(`[EmailLearning] Found ${patternMatches.length} matching patterns`);

      let draftResult;
      let matchedPatternIds: string[] = [];

      if (patternMatches.length > 0 && patternMatches[0].match_score >= learningConfig.minimum_pattern_confidence) {
        // Use learned patterns to generate draft
        draftResult = await this.generateDraftFromPatterns(
          email,
          patternMatches,
          userId,
          organizationId
        );
        matchedPatternIds = patternMatches.map(p => p.pattern_id);
        totalCost = draftResult.cost_usd || 0;
        totalTokens = draftResult.tokens_used || 0;
      } else {
        // Fallback to generic AI generation
        console.log(`[EmailLearning] No suitable patterns found, using fallback AI generation`);
        draftResult = await this.generateDraftWithFallbackAI(
          email,
          userId,
          organizationId
        );
        totalCost = draftResult.cost_usd || 0;
        totalTokens = draftResult.tokens_used || 0;
      }

      if (!draftResult.success) {
        return {
          success: false,
          error: draftResult.error || 'Failed to generate draft'
        };
      }

      // 5. Save draft to cache
      const savedDraft = await this.saveDraftToCache(
        messageId,
        userId,
        organizationId,
        draftResult.draft,
        matchedPatternIds,
        patternMatches.length > 0 ? patternMatches[0].match_score : 0,
        patternMatches.length === 0, // fallback_generation
        totalCost,
        totalTokens
      );

      // 6. Update pattern usage statistics
      if (matchedPatternIds.length > 0) {
        await Promise.all(
          matchedPatternIds.map(patternId => 
            this.updatePatternUsage(patternId, true) // Assume successful for now
          )
        );
      }

      console.log(`[EmailLearning] Background draft generated successfully in ${Date.now() - startTime}ms`);

      return {
        success: true,
        draft: {
          id: savedDraft.id,
          subject: savedDraft.subject,
          body: savedDraft.body,
          confidence: savedDraft.confidence_score,
          matched_patterns: matchedPatternIds
        }
      };

    } catch (error) {
      console.error('[EmailLearning] Error generating background draft:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get email by message ID from the new optimized structure
   */
  private async getEmailById(messageId: string, userId: string): Promise<{
    id: string;
    subject: string;
    content: string;
    sender: string;
    received_at: string;
  } | null> {
    try {
      // First get the email from email_index
      const { data: emailIndex, error: indexError } = await this.supabase
        .from('email_index')
        .select(`
          id,
          message_id,
          subject,
          sender_email,
          received_at,
          email_account_id,
          email_accounts!inner(user_id)
        `)
        .eq('message_id', messageId)
        .eq('email_accounts.user_id', userId)
        .single();

      if (indexError || !emailIndex) {
        console.error('[EmailLearning] Error fetching email from index:', indexError);
        return null;
      }

      // Get the content from email_content_cache
      const { data: contentData, error: contentError } = await this.supabase
        .from('email_content_cache')
        .select('plain_content, html_content')
        .eq('message_id', messageId)
        .single();

      let content = '';
      if (!contentError && contentData) {
        content = contentData.plain_content || contentData.html_content || '';
      }

      return {
        id: emailIndex.message_id, // Use message_id as the ID
        subject: emailIndex.subject || 'No Subject',
        content: content,
        sender: emailIndex.sender_email || '',
        received_at: emailIndex.received_at
      };
    } catch (error) {
      console.error('[EmailLearning] Error in getEmailById:', error);
      return null;
    }
  }

  /**
   * Check for existing draft in cache
   */
  private async getExistingDraft(messageId: string, userId: string): Promise<any> {
    const { data: draft, error } = await this.supabase
      .from('email_drafts_cache')
      .select('*')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .eq('status', 'ready')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      return null;
    }

    return draft;
  }

  /**
   * Find matching patterns for an incoming email
   */
  private async findMatchingPatterns(
    emailContent: string,
    senderEmail: string,
    userId: string
  ): Promise<Array<{
    pattern_id: string;
    match_score: number;
    pattern_type: string;
    response_template: string;
    context_category: string;
    trigger_keywords: string[];
  }>> {
    try {
      // Use the database function for pattern matching
      const { data: patterns, error } = await this.supabase
        .rpc('find_best_pattern_match', {
          p_user_id: userId,
          p_email_content: emailContent,
          p_sender_email: senderEmail
        });

      if (error) {
        console.error('[EmailLearning] Error finding pattern matches:', error);
        return [];
      }

      // Enhance matches with additional scoring
      const enhancedPatterns = await Promise.all(
        (patterns || []).map(async (pattern: any) => {
          // Get full pattern details
          const { data: fullPattern, error: patternError } = await this.supabase
            .from('email_patterns')
            .select('*')
            .eq('id', pattern.pattern_id)
            .single();

          if (patternError || !fullPattern) {
            return {
              pattern_id: pattern.pattern_id,
              match_score: pattern.match_score,
              pattern_type: pattern.pattern_type,
              response_template: pattern.response_template,
              context_category: '',
              trigger_keywords: []
            };
          }

          // Calculate enhanced match score
          const enhancedScore = this.calculateEnhancedMatchScore(
            emailContent,
            senderEmail,
            fullPattern
          );

          return {
            pattern_id: pattern.pattern_id,
            match_score: enhancedScore,
            pattern_type: pattern.pattern_type,
            response_template: pattern.response_template,
            context_category: fullPattern.context_category,
            trigger_keywords: fullPattern.trigger_keywords
          };
        })
      );

      // Sort by enhanced match score
      return enhancedPatterns
        .filter(p => p.match_score > 0.3) // Minimum threshold
        .sort((a, b) => b.match_score - a.match_score)
        .slice(0, 3); // Top 3 matches

    } catch (error) {
      console.error('[EmailLearning] Error in pattern matching:', error);
      return [];
    }
  }

  /**
   * Calculate enhanced match score considering multiple factors
   */
  private calculateEnhancedMatchScore(
    emailContent: string,
    senderEmail: string,
    pattern: any
  ): number {
    const contentLower = emailContent.toLowerCase();
    
    // Keyword matching (40% weight)
    const keywordMatches = pattern.trigger_keywords.filter((keyword: string) => 
      contentLower.includes(keyword.toLowerCase())
    ).length;
    const keywordScore = pattern.trigger_keywords.length > 0 
      ? keywordMatches / pattern.trigger_keywords.length 
      : 0;

    // Pattern confidence (30% weight)
    const confidenceScore = pattern.confidence_score;

    // Usage success rate (20% weight)
    const successScore = pattern.success_rate || 0;

    // Recency bonus (10% weight)
    const lastUsed = pattern.last_used_at ? new Date(pattern.last_used_at) : new Date(0);
    const daysSinceUsed = (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - (daysSinceUsed / 30)); // Decay over 30 days

    return (keywordScore * 0.4) + (confidenceScore * 0.3) + (successScore * 0.2) + (recencyScore * 0.1);
  }

  /**
   * Generate draft using learned patterns
   */
  private async generateDraftFromPatterns(
    email: any,
    patterns: any[],
    userId: string,
    organizationId?: string
  ): Promise<{
    success: boolean;
    draft?: { subject: string; body: string; confidence: number };
    cost_usd?: number;
    tokens_used?: number;
    error?: string;
  }> {
    try {
      const bestPattern = patterns[0];
      
      // Create a prompt that uses the learned pattern
      const prompt = this.createPatternBasedPrompt(email, bestPattern);
      
      // Use cost-effective model for pattern-based generation
      const modelChoice = this.modelRouter 
        ? await this.modelRouter.analyzeTaskComplexity(prompt, { 
            task_type: 'pattern_based_draft',
            complexity: 'simple'
          })
        : { suggestedModel: 'gpt-4o-mini', reasoning: ['Default model'] };
      
      const selectedModel = modelChoice.suggestedModel || 'gpt-4o-mini';

      console.log(`[EmailLearning] Using model ${selectedModel} for pattern-based draft`);

      const response = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are an expert email assistant. Generate professional email responses based on learned patterns.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      });

      const draftContent = response.choices[0]?.message?.content;
      const tokensUsed = response.usage?.total_tokens || 0;
      
      // Calculate cost (estimate for different models)
      const costPer1k = selectedModel.includes('gpt-4o-mini') ? 0.00015 : 0.005; // GPT-4o-mini vs GPT-4o
      const cost = response.usage 
        ? (response.usage.total_tokens / 1000) * costPer1k 
        : 0;

      if (!draftContent) {
        return {
          success: false,
          error: 'No draft content generated'
        };
      }

      const parsedDraft = this.parseDraftResponse(draftContent, email.subject);
      
      return {
        success: true,
        draft: {
          subject: parsedDraft.subject,
          body: parsedDraft.body,
          confidence: Math.min(0.95, bestPattern.match_score + 0.1) // Pattern-based drafts get confidence boost
        },
        cost_usd: cost,
        tokens_used: tokensUsed
      };

    } catch (error) {
      console.error('[EmailLearning] Error generating pattern-based draft:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate draft using fallback AI when no patterns match
   */
  private async generateDraftWithFallbackAI(
    email: any,
    userId: string,
    organizationId?: string
  ): Promise<{
    success: boolean;
    draft?: { subject: string; body: string; confidence: number };
    cost_usd?: number;
    tokens_used?: number;
    error?: string;
  }> {
    try {
      // Create a generic prompt for AI generation
      const prompt = this.createFallbackPrompt(email);
      
      // Use standard model for fallback generation
      const modelChoice = this.modelRouter 
        ? await this.modelRouter.analyzeTaskComplexity(prompt, { 
            task_type: 'email_response',
            complexity: 'standard'
          })
        : { suggestedModel: 'gpt-4o', reasoning: ['Default model'] };
      
      const selectedModel = modelChoice.suggestedModel || 'gpt-4o';

      console.log(`[EmailLearning] Using model ${selectedModel} for fallback draft`);

      const response = await this.openai.chat.completions.create({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: 'You are a professional email assistant. Generate appropriate email responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 800
      });

      const draftContent = response.choices[0]?.message?.content;
      const tokensUsed = response.usage?.total_tokens || 0;
      
      // Calculate cost (estimate for different models)
      const costPer1k = selectedModel.includes('gpt-4o-mini') ? 0.00015 : 0.005; // GPT-4o-mini vs GPT-4o
      const cost = response.usage 
        ? (response.usage.total_tokens / 1000) * costPer1k 
        : 0;

      if (!draftContent) {
        return {
          success: false,
          error: 'No draft content generated'
        };
      }

      const parsedDraft = this.parseDraftResponse(draftContent, email.subject);
      
      return {
        success: true,
        draft: {
          subject: parsedDraft.subject,
          body: parsedDraft.body,
          confidence: 0.6 // Lower confidence for fallback drafts
        },
        cost_usd: cost,
        tokens_used: tokensUsed
      };

    } catch (error) {
      console.error('[EmailLearning] Error generating fallback draft:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create prompt using learned patterns
   */
  private createPatternBasedPrompt(email: any, pattern: any): string {
    return `Based on the learned communication pattern, generate a professional email response.

INCOMING EMAIL:
Subject: ${email.subject}
From: ${email.sender}
Content: ${email.content.substring(0, 1000)}

LEARNED PATTERN:
Type: ${pattern.pattern_type}
Context: ${pattern.context_category}
Template: ${pattern.response_template}
Keywords: ${pattern.trigger_keywords.join(', ')}

Generate a response that follows the learned pattern while being contextually appropriate. 

Return the response in this format:
SUBJECT: [response subject]
BODY: [response body]

Keep the response professional, helpful, and consistent with the learned pattern style.`;
  }

  /**
   * Create fallback prompt for generic AI generation
   */
  private createFallbackPrompt(email: any): string {
    return `Generate a professional email response to the following email:

INCOMING EMAIL:
Subject: ${email.subject}
From: ${email.sender}
Content: ${email.content.substring(0, 1000)}

Generate an appropriate, professional response that:
1. Acknowledges the sender's message
2. Addresses their main points or questions
3. Maintains a helpful and courteous tone
4. Is concise but complete

Return the response in this format:
SUBJECT: [response subject]
BODY: [response body]`;
  }

  /**
   * Parse AI-generated draft response
   */
  private parseDraftResponse(content: string, originalSubject: string): {
    subject: string;
    body: string;
  } {
    const lines = content.split('\n');
    let subject = '';
    let body = '';
    let inBody = false;

    for (const line of lines) {
      if (line.startsWith('SUBJECT:')) {
        subject = line.replace('SUBJECT:', '').trim();
      } else if (line.startsWith('BODY:')) {
        body = line.replace('BODY:', '').trim();
        inBody = true;
      } else if (inBody) {
        body += '\n' + line;
      }
    }

    // Fallback if parsing fails
    if (!subject) {
      subject = originalSubject.startsWith('Re:') ? originalSubject : `Re: ${originalSubject}`;
    }
    if (!body) {
      body = content; // Use entire content as body
    }

    return {
      subject: subject.trim(),
      body: body.trim()
    };
  }

  /**
   * Save generated draft to cache
   */
  private async saveDraftToCache(
    messageId: string,
    userId: string,
    organizationId: string | undefined,
    draft: any,
    matchedPatterns: string[],
    patternMatchScore: number,
    fallbackGeneration: boolean,
    costUsd: number,
    tokensUsed: number
  ): Promise<any> {
    const draftData = {
      user_id: userId,
      message_id: messageId,
      organization_id: organizationId,
      subject: draft.subject,
      body: draft.body,
      confidence_score: draft.confidence,
      generation_model: 'ai-learned', // Will be updated with actual model
      matched_patterns: matchedPatterns,
      pattern_match_score: patternMatchScore,
      fallback_generation: fallbackGeneration,
      generation_cost_usd: costUsd,
      generation_tokens: tokensUsed,
      status: 'ready',
      context_data: {},
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    const { data, error } = await this.supabase
      .from('email_drafts_cache')
      .upsert(draftData, { onConflict: 'email_id,user_id' })
      .select('*')
      .single();

    if (error) {
      console.error('[EmailLearning] Error saving draft to cache:', error);
      throw new Error(`Failed to save draft: ${error.message}`);
    }

    return data;
  }

  /**
   * Update pattern usage statistics
   */
  private async updatePatternUsage(patternId: string, wasSuccessful: boolean = true): Promise<void> {
    try {
      await this.supabase.rpc('update_pattern_usage', {
        p_pattern_id: patternId,
        p_was_successful: wasSuccessful
      });
    } catch (error) {
      console.error('[EmailLearning] Error updating pattern usage:', error);
    }
  }

  /**
   * Get user learning config with caching for performance
   */
  private async getUserLearningConfigCached(userId: string) {
    const cacheKey = `config_${userId}`;
    const cached = this.configCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.config;
    }

    const config = await this.getUserLearningConfig(userId);
    this.configCache.set(cacheKey, { config, timestamp: Date.now() });
    
    return config;
  }

  /**
   * Clear expired cache entries to prevent memory leaks
   */
  private cleanupCache(): void {
    const now = Date.now();
    
    // Clean draft cache
    for (const [key, value] of Array.from(this.draftCache.entries())) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.draftCache.delete(key);
      }
    }
    
    // Clean pattern cache
    for (const [key, value] of Array.from(this.patternCache.entries())) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.patternCache.delete(key);
      }
    }
    
    // Clean config cache
    for (const [key, value] of Array.from(this.configCache.entries())) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.configCache.delete(key);
      }
    }
  }

  /**
   * Batch process multiple emails for initial learning (OPTIMIZED)
   */
    async processEmailsBatch(messageIds: string[], userId: string, organizationId?: string): Promise<{
    successful: number;
    failed: number;
    results: Array<{ emailId: string; success: boolean; error?: string }>
  }> {
    console.log(`[EmailLearning] Starting batch processing of ${messageIds.length} emails`);
    
    const results: Array<{ emailId: string; success: boolean; error?: string }> = [];
    let successful = 0;
    let failed = 0;
    
    // Process in smaller batches to prevent overwhelming the system
    const batchSize = 3;
    
    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (messageId) => {
        try {
          const result = await this.generateBackgroundDraft(messageId, userId, organizationId);
          if (result.success) {
            successful++;
            return { emailId: messageId, success: true };
          } else {
            failed++;
            return { emailId: messageId, success: false, error: result.error };
          }
        } catch (error) {
          failed++;
          return {
            emailId: messageId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      });
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          failed++;
          results.push({ 
            emailId: 'unknown', 
            success: false, 
            error: result.reason?.message || 'Batch processing failed' 
          });
        }
      });
      
      // Small delay between batches
      if (i + batchSize < messageIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Clean cache periodically
      if (i % 10 === 0) {
        this.cleanupCache();
      }
    }
    
    console.log(`[EmailLearning] Batch processing completed: ${successful} successful, ${failed} failed`);
    
    return {
      successful,
      failed,
      results
    };
  }
}

export default EmailLearningService;
