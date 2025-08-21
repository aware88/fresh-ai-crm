import { UnifiedRAGService } from './unified-rag-service';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { QueryContext, RetrievedChunk } from '@/types/rag';

/**
 * Enhanced Email Service with RAG Integration
 * Extends existing email generation with comprehensive knowledge retrieval
 */
export class EnhancedEmailService {
  private ragService: UnifiedRAGService;
  private supabase: SupabaseClient<Database>;

  constructor(
    ragService: UnifiedRAGService,
    supabase: SupabaseClient<Database>
  ) {
    this.ragService = ragService;
    this.supabase = supabase;
  }

  /**
   * Generate email response with RAG context
   */
  async generateRAGEnhancedResponse(
    originalEmail: string,
    organizationId: string,
    userId: string,
    options: {
      senderEmail?: string;
      contactId?: string;
      tone?: string;
      customInstructions?: string;
      includeProducts?: boolean;
      includeDocuments?: boolean;
      includeMetakocka?: boolean;
      maxContextChunks?: number;
    } = {}
  ): Promise<{
    response: string;
    subject: string;
    confidence: number;
    ragContext: {
      chunksUsed: RetrievedChunk[];
      contextSummary: string;
      relevantProducts: any[];
      relevantDocuments: any[];
      citations: string[];
    };
    processingTimeMs: number;
  }> {
    const startTime = Date.now();
    
    try {
      console.log('[Enhanced Email] Generating RAG-enhanced email response');

      // Extract key topics and entities from the original email
      const emailAnalysis = await this.analyzeEmailContent(originalEmail);
      
      // Build context-aware query for RAG
      const ragQuery = this.buildRAGQuery(originalEmail, emailAnalysis, options);
      
      // Retrieve relevant context from RAG system
      const ragContext = await this.retrieveRelevantContext(
        ragQuery,
        organizationId,
        options
      );

      // Generate enhanced response using RAG context
      const queryContext: QueryContext = {
        emailId: `email-${Date.now()}`,
        contactId: options.contactId,
        userId,
        organizationId,
        userIntent: emailAnalysis.intent,
        includeRecommendations: options.includeProducts,
        maxContextTokens: 4000
      };

      const ragResponse = await this.ragService.queryWithGeneration(
        ragQuery,
        organizationId,
        queryContext
      );

      // Enhance response with additional context
      const enhancedResponse = await this.enhanceResponseWithContext(
        ragResponse.answer,
        ragContext,
        emailAnalysis,
        options
      );

      const processingTime = Date.now() - startTime;

      console.log(`[Enhanced Email] Generated RAG-enhanced response in ${processingTime}ms`);

      return {
        response: enhancedResponse.body,
        subject: enhancedResponse.subject,
        confidence: ragResponse.confidence,
        ragContext: {
          chunksUsed: ragResponse.sources,
          contextSummary: ragResponse.contextUsed,
          relevantProducts: ragContext.products,
          relevantDocuments: ragContext.documents,
          citations: ragResponse.citations.map(c => c.title)
        },
        processingTimeMs: processingTime
      };

    } catch (error) {
      console.error('[Enhanced Email] RAG-enhanced generation failed:', error);
      
      // Fallback to basic response
      return {
        response: "Thank you for your email. I'll review your message and get back to you with the information you need.",
        subject: "Re: Your inquiry",
        confidence: 0.3,
        ragContext: {
          chunksUsed: [],
          contextSummary: '',
          relevantProducts: [],
          relevantDocuments: [],
          citations: []
        },
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze email content to extract key information
   */
  private async analyzeEmailContent(emailContent: string): Promise<{
    intent: string;
    entities: string[];
    topics: string[];
    questions: string[];
    urgency: 'low' | 'medium' | 'high';
    language: string;
  }> {
    try {
      // Extract key entities (product names, numbers, dates, etc.)
      const entities = this.extractEntities(emailContent);
      
      // Identify main topics
      const topics = this.extractTopics(emailContent);
      
      // Extract questions
      const questions = this.extractQuestions(emailContent);
      
      // Determine intent
      const intent = this.determineIntent(emailContent, topics);
      
      // Assess urgency
      const urgency = this.assessUrgency(emailContent);
      
      // Detect language
      const language = this.detectLanguage(emailContent);

      return {
        intent,
        entities,
        topics,
        questions,
        urgency,
        language
      };
    } catch (error) {
      console.warn('[Enhanced Email] Email analysis failed:', error);
      return {
        intent: 'general_inquiry',
        entities: [],
        topics: [],
        questions: [],
        urgency: 'medium',
        language: 'en'
      };
    }
  }

  /**
   * Extract entities from email content
   */
  private extractEntities(content: string): string[] {
    const entities: string[] = [];
    
    // Product codes/SKUs (alphanumeric patterns)
    const skuMatches = content.match(/\b[A-Z]{2,}\d+[A-Z]*\b/g);
    if (skuMatches) {
      entities.push(...skuMatches);
    }
    
    // Numbers (quantities, prices, etc.)
    const numberMatches = content.match(/\b\d+(?:[.,]\d+)*\b/g);
    if (numberMatches) {
      entities.push(...numberMatches.slice(0, 5)); // Limit to avoid noise
    }
    
    // Dates
    const dateMatches = content.match(/\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g);
    if (dateMatches) {
      entities.push(...dateMatches);
    }
    
    // Email addresses
    const emailMatches = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    if (emailMatches) {
      entities.push(...emailMatches);
    }

    return entities.slice(0, 10); // Limit total entities
  }

  /**
   * Extract topics from email content
   */
  private extractTopics(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const topics: string[] = [];
    
    // Product-related topics
    if (lowerContent.includes('product') || lowerContent.includes('item')) {
      topics.push('products');
    }
    
    // Pricing topics
    if (lowerContent.includes('price') || lowerContent.includes('cost') || lowerContent.includes('quote')) {
      topics.push('pricing');
    }
    
    // Delivery/shipping topics
    if (lowerContent.includes('delivery') || lowerContent.includes('shipping') || lowerContent.includes('timeline')) {
      topics.push('delivery');
    }
    
    // Support topics
    if (lowerContent.includes('problem') || lowerContent.includes('issue') || lowerContent.includes('help')) {
      topics.push('support');
    }
    
    // Order topics
    if (lowerContent.includes('order') || lowerContent.includes('purchase') || lowerContent.includes('buy')) {
      topics.push('orders');
    }
    
    // Documentation topics
    if (lowerContent.includes('document') || lowerContent.includes('certificate') || lowerContent.includes('specification')) {
      topics.push('documentation');
    }

    return topics;
  }

  /**
   * Extract questions from email content
   */
  private extractQuestions(content: string): string[] {
    // Simple question extraction based on question marks and question words
    const sentences = content.split(/[.!?]+/);
    const questions = sentences.filter(sentence => 
      sentence.includes('?') || 
      /\b(what|when|where|who|why|how|can|could|would|will|is|are|do|does)\b/i.test(sentence.trim())
    );
    
    return questions.slice(0, 5).map(q => q.trim()).filter(q => q.length > 10);
  }

  /**
   * Determine the main intent of the email
   */
  private determineIntent(content: string, topics: string[]): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('thank') || lowerContent.includes('appreciate')) {
      return 'appreciation';
    }
    
    if (lowerContent.includes('urgent') || lowerContent.includes('asap') || lowerContent.includes('immediately')) {
      return 'urgent_request';
    }
    
    if (topics.includes('pricing') || lowerContent.includes('quote')) {
      return 'pricing_inquiry';
    }
    
    if (topics.includes('products')) {
      return 'product_inquiry';
    }
    
    if (topics.includes('orders')) {
      return 'order_inquiry';
    }
    
    if (topics.includes('support')) {
      return 'support_request';
    }
    
    if (lowerContent.includes('meeting') || lowerContent.includes('call') || lowerContent.includes('schedule')) {
      return 'meeting_request';
    }
    
    return 'general_inquiry';
  }

  /**
   * Assess urgency level of the email
   */
  private assessUrgency(content: string): 'low' | 'medium' | 'high' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('urgent') || lowerContent.includes('asap') || 
        lowerContent.includes('immediately') || lowerContent.includes('emergency')) {
      return 'high';
    }
    
    if (lowerContent.includes('soon') || lowerContent.includes('quick') || 
        lowerContent.includes('deadline') || content.includes('!')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Detect email language
   */
  private detectLanguage(content: string): string {
    // Simple language detection based on common words
    const lowerContent = content.toLowerCase();
    
    // Slovenian
    if (lowerContent.includes('hvala') || lowerContent.includes('prosim') || 
        lowerContent.includes('lahko') || lowerContent.includes('želim')) {
      return 'sl';
    }
    
    // German
    if (lowerContent.includes('danke') || lowerContent.includes('bitte') || 
        lowerContent.includes('können') || lowerContent.includes('möchte')) {
      return 'de';
    }
    
    // Italian
    if (lowerContent.includes('grazie') || lowerContent.includes('prego') || 
        lowerContent.includes('posso') || lowerContent.includes('vorrei')) {
      return 'it';
    }
    
    return 'en'; // Default to English
  }

  /**
   * Build optimized RAG query from email analysis
   */
  private buildRAGQuery(
    originalEmail: string,
    analysis: any,
    options: any
  ): string {
    const queryParts: string[] = [];
    
    // Add main topics
    if (analysis.topics.length > 0) {
      queryParts.push(analysis.topics.join(' '));
    }
    
    // Add key entities
    if (analysis.entities.length > 0) {
      queryParts.push(analysis.entities.slice(0, 3).join(' '));
    }
    
    // Add questions
    if (analysis.questions.length > 0) {
      queryParts.push(analysis.questions[0]); // Most important question
    }
    
    // If no specific query parts, use the email content directly (truncated)
    if (queryParts.length === 0) {
      queryParts.push(originalEmail.substring(0, 200));
    }
    
    return queryParts.join(' ').substring(0, 500); // Limit query length
  }

  /**
   * Retrieve relevant context from RAG system
   */
  private async retrieveRelevantContext(
    query: string,
    organizationId: string,
    options: any
  ): Promise<{
    products: any[];
    documents: any[];
    metakockaData: any[];
  }> {
    try {
      // Determine which sources to search
      const sourceTypes = [];
      if (options.includeProducts !== false) sourceTypes.push('product');
      if (options.includeDocuments !== false) sourceTypes.push('document');
      if (options.includeMetakocka !== false) sourceTypes.push('metakocka');
      
      // Retrieve relevant content
      const retrievalResult = await this.ragService.retrieveRelevantContent(
        query,
        organizationId,
        {
          sourceTypes: sourceTypes as any,
          limit: options.maxContextChunks || 8,
          similarityThreshold: 0.6
        }
      );

      // Categorize results
      const products = retrievalResult.chunks
        .filter(chunk => chunk.source.sourceType === 'product')
        .slice(0, 3);
      
      const documents = retrievalResult.chunks
        .filter(chunk => chunk.source.sourceType === 'document')
        .slice(0, 3);
      
      const metakockaData = retrievalResult.chunks
        .filter(chunk => chunk.source.sourceType === 'metakocka')
        .slice(0, 3);

      return {
        products,
        documents,
        metakockaData
      };
    } catch (error) {
      console.error('[Enhanced Email] Context retrieval failed:', error);
      return {
        products: [],
        documents: [],
        metakockaData: []
      };
    }
  }

  /**
   * Enhance response with additional context formatting
   */
  private async enhanceResponseWithContext(
    baseResponse: string,
    ragContext: any,
    emailAnalysis: any,
    options: any
  ): Promise<{
    body: string;
    subject: string;
  }> {
    let enhancedBody = baseResponse;
    
    // Add product recommendations if relevant
    if (ragContext.products.length > 0 && options.includeProducts !== false) {
      const productInfo = ragContext.products
        .map((chunk: RetrievedChunk) => `• ${chunk.source.title}`)
        .join('\n');
      
      if (emailAnalysis.intent === 'product_inquiry') {
        enhancedBody += `\n\nRelevant products:\n${productInfo}`;
      }
    }
    
    // Add document references if relevant
    if (ragContext.documents.length > 0 && emailAnalysis.intent === 'support_request') {
      const docInfo = ragContext.documents
        .map((chunk: RetrievedChunk) => `• ${chunk.source.title}`)
        .slice(0, 2)
        .join('\n');
      
      enhancedBody += `\n\nRelevant documentation:\n${docInfo}`;
    }
    
    // Generate appropriate subject line
    const subject = this.generateSubjectLine(emailAnalysis, ragContext);
    
    return {
      body: enhancedBody,
      subject
    };
  }

  /**
   * Generate contextual subject line
   */
  private generateSubjectLine(emailAnalysis: any, ragContext: any): string {
    const baseSubject = "Re: ";
    
    switch (emailAnalysis.intent) {
      case 'product_inquiry':
        if (ragContext.products.length > 0) {
          return `${baseSubject}${ragContext.products[0].source.title} - Product Information`;
        }
        return `${baseSubject}Product Inquiry`;
      
      case 'pricing_inquiry':
        return `${baseSubject}Pricing Information`;
      
      case 'support_request':
        return `${baseSubject}Support Assistance`;
      
      case 'order_inquiry':
        return `${baseSubject}Order Information`;
      
      case 'urgent_request':
        return `${baseSubject}[Urgent] Your Request`;
      
      default:
        return `${baseSubject}Your Inquiry`;
    }
  }

  /**
   * Get email generation statistics
   */
  async getEmailStats(organizationId: string, days: number = 30): Promise<{
    totalEmailsGenerated: number;
    ragEnhancedEmails: number;
    averageConfidence: number;
    topIntents: Array<{ intent: string; count: number }>;
    contextUsageStats: {
      productsUsed: number;
      documentsUsed: number;
      metakockaUsed: number;
    };
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // This would need to be implemented based on your email tracking system
      // For now, return mock data
      return {
        totalEmailsGenerated: 0,
        ragEnhancedEmails: 0,
        averageConfidence: 0,
        topIntents: [],
        contextUsageStats: {
          productsUsed: 0,
          documentsUsed: 0,
          metakockaUsed: 0
        }
      };
    } catch (error) {
      console.error('[Enhanced Email] Stats retrieval failed:', error);
      return {
        totalEmailsGenerated: 0,
        ragEnhancedEmails: 0,
        averageConfidence: 0,
        topIntents: [],
        contextUsageStats: {
          productsUsed: 0,
          documentsUsed: 0,
          metakockaUsed: 0
        }
      };
    }
  }
}


