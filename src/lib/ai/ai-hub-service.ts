/**
 * AI Hub Service - Central AI Processing Hub
 * 
 * This service acts as the central AI hub for all email processing,
 * integrating with OpenAI Responses API and organization-specific settings.
 */

import OpenAI from 'openai';
import { OrganizationSettingsService, EULanguageConfig } from '@/lib/services/organization-settings-service';
import { getMetakockaDataForAIContext } from '@/lib/integrations/metakocka/metakocka-ai-integration';
import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { AutomotiveProductMatcher, CarSpecification } from './automotive-product-matcher';
import { WithcarIntegrationService } from '@/lib/integrations/metakocka/withcar-integration';
import { aiPreferencesService, EmailContext } from './ai-preferences-service';

export interface EmailProcessingContext {
  emailId: string;
  organizationId: string;
  userId: string;
  emailContent: string;
  emailSubject: string;
  senderEmail: string;
  senderName?: string;
  emailType: 'customer_service' | 'sales' | 'product_inquiry' | 'complaint' | 'general';
  conversationHistory?: any[];
  contactId?: string;
  productMentions?: string[];
  orderReferences?: string[];
}

export interface AIProcessingResult {
  response: string;
  confidence: number;
  reasoning: string;
  suggestedActions: string[];
  productRecommendations?: any[];
  upsellingSuggestions?: any[];
  followUpReminders?: any[];
  requiresHumanReview: boolean;
  estimatedSentiment: 'positive' | 'neutral' | 'negative';
  responseId?: string; // OpenAI Responses API response ID
  metadata?: any;
}

export interface EmailClassificationResult {
  type: 'customer_service' | 'sales' | 'product_inquiry' | 'complaint' | 'general';
  confidence: number;
  reasoning: string;
  urgency: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'neutral' | 'negative';
  language: string;
  countryCode?: string;
  culturalContext?: string;
  extractedEntities: {
    products?: string[];
    orders?: string[];
    brands?: string[];
    models?: string[];
    years?: number[];
  };
}

export class AIHubService {
  private openai: OpenAI;
  private settingsService: OrganizationSettingsService;
  private supabase: ReturnType<typeof createLazyServerClient>;
  private automotiveMatcher: AutomotiveProductMatcher;
  private withcarIntegration: WithcarIntegrationService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.settingsService = new OrganizationSettingsService();
    this.supabase = createLazyServerClient();
    this.automotiveMatcher = new AutomotiveProductMatcher();
    this.withcarIntegration = new WithcarIntegrationService();
  }

  /**
   * Process an email through the AI hub
   */
  async processEmail(context: EmailProcessingContext): Promise<AIProcessingResult> {
    console.log(`[AI Hub] Processing email ${context.emailId} for organization ${context.organizationId}`);

    try {
      // CRITICAL: Check user preferences FIRST - this must be done before any AI processing
      const emailContext: EmailContext = {
        subject: context.emailSubject,
        sender: context.senderEmail,
        sender_domain: context.senderEmail ? context.senderEmail.split('@')[1] : undefined,
        body: context.emailContent,
        email_type: context.emailType,
        urgency: this.determineEmailUrgency(context.emailContent + ' ' + context.emailSubject)
      };

      const processingDecision = await aiPreferencesService.shouldProcessEmail(context.userId, emailContext);
      
      console.log(`[AI Hub] User preferences decision:`, processingDecision);

              // If user preferences say not to process, return early
        if (!processingDecision.should_process) {
          return {
            responseId: `skip-${context.emailId}`,
            response: '',
            confidence: 1.0,
            reasoning: processingDecision.reasoning,
            requiresHumanReview: processingDecision.should_escalate,
            suggestedActions: ['manual_review'],
            productRecommendations: [],
            upsellingSuggestions: [],
            estimatedSentiment: 'neutral',
            metadata: {
              skipped_by_user_preferences: true,
              applied_rules: processingDecision.applied_rules,
              escalation_reason: processingDecision.reasoning
            }
          };
        }

        // If escalation is required, mark for human review
        if (processingDecision.should_escalate) {
          return {
            responseId: `review-${context.emailId}`,
            response: '',
            confidence: 0.5,
            reasoning: `Escalated for human review: ${processingDecision.reasoning}`,
            requiresHumanReview: true,
            suggestedActions: ['manual_review'],
            productRecommendations: [],
            upsellingSuggestions: [],
            estimatedSentiment: 'neutral',
            metadata: {
              escalated_by_user_preferences: true,
              applied_rules: processingDecision.applied_rules,
              custom_instructions: processingDecision.custom_instructions
            }
          };
        }

      // Get AI instructions from user preferences
      const aiInstructions = await aiPreferencesService.getAIInstructions(context.userId, emailContext);
      
      // Get organization-specific AI settings
      const aiConfig = await this.settingsService.getAIProcessingConfig(context.organizationId);
      const organizationSettings = await this.settingsService.getAllSettings(context.organizationId);

              // Build comprehensive context for AI processing
        const aiContext = await this.buildAIContext(context, organizationSettings);
        
        // Add user preference instructions to the AI context
        if (aiInstructions.global_instructions.length > 0 || aiInstructions.content_instructions.length > 0) {
          aiContext.userPreferences = {
            styleInstructions: aiInstructions.style_instructions,
            contentInstructions: aiInstructions.content_instructions,
            globalInstructions: aiInstructions.global_instructions
          };
        }

      // Process with OpenAI Responses API
      const result = await this.processWithResponsesAPI(aiContext, aiConfig);

      // Apply organization-specific post-processing
      const finalResult = await this.applyOrganizationPostProcessing(result, context, organizationSettings);

      // Add preference information to result metadata
      finalResult.metadata = {
        ...finalResult.metadata,
        user_preferences_applied: true,
        applied_rules: processingDecision.applied_rules,
        custom_instructions: processingDecision.custom_instructions,
        priority_level: processingDecision.priority_level
      };

      console.log(`[AI Hub] Successfully processed email ${context.emailId} with user preferences`);
      return finalResult;

    } catch (error) {
      console.error(`[AI Hub] Error processing email ${context.emailId}:`, error);
      throw error;
    }
  }

  /**
   * Detect language and cultural context of an email
   */
  async detectLanguageAndCulture(
    emailContent: string,
    emailSubject: string,
    organizationId: string
  ): Promise<{ language: string; countryCode?: string; culturalContext?: string }> {
    console.log(`[AI Hub] Detecting language and cultural context`);

    try {
      const detectionPrompt = `
        Analyze the following email and detect:
        
        Subject: ${emailSubject}
        Content: ${emailContent}
        
        Please identify:
        1. The language of the email (using ISO 639-1 codes)
        2. The likely country of origin (using ISO 3166-1 alpha-2 codes)
        3. Cultural context indicators (formal/informal, business style, etc.)
        
        Consider language patterns, cultural expressions, and business communication styles.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a language and cultural context detector. Analyze text and provide language and cultural insights."
          },
          {
            role: "user",
            content: detectionPrompt
          }
        ],
        functions: [{
          name: "detect_language_culture",
          description: "Detect language and cultural context of text",
          parameters: {
            type: "object",
            properties: {
              language: {
                type: "string",
                description: "ISO 639-1 language code"
              },
              countryCode: {
                type: "string",
                description: "ISO 3166-1 alpha-2 country code"
              },
              culturalContext: {
                type: "string",
                description: "Cultural context and communication style indicators"
              }
            },
            required: ["language"]
          }
        }],
        function_call: { name: "detect_language_culture" }
      });

      const functionCall = response.choices[0].message.function_call;
      if (functionCall && functionCall.arguments) {
        const result = JSON.parse(functionCall.arguments);
        return result;
      }

      return { language: 'en' };

    } catch (error) {
      console.error(`[AI Hub] Error detecting language and culture:`, error);
      return { language: 'en' };
    }
  }

  /**
   * Classify an email to determine its type and urgency with language detection
   */
  async classifyEmail(
    emailContent: string,
    emailSubject: string,
    organizationId: string
  ): Promise<EmailClassificationResult> {
    console.log(`[AI Hub] Classifying email for organization ${organizationId}`);

    try {
      // First detect language and cultural context
      const languageInfo = await this.detectLanguageAndCulture(emailContent, emailSubject, organizationId);
      
      // Get organization-specific classification rules
      const organizationSettings = await this.settingsService.getAllSettings(organizationId);
      const automotiveConfig = await this.settingsService.getAutomotiveMatchingConfig(organizationId);
      const languageSettings = await this.settingsService.getLanguageSettings(organizationId, languageInfo.language);

      // Build classification prompt
      const classificationPrompt = this.buildClassificationPrompt(
        emailContent,
        emailSubject,
        organizationSettings,
        automotiveConfig
      );

                    // Use OpenAI chat completions API for classification (TODO: Migrate to Responses API when types are available)
       const response = await this.openai.chat.completions.create({
         model: "gpt-4o",
         messages: [
           {
             role: "system",
             content: "You are an email classifier. Classify emails and extract relevant information. Respond with a JSON object containing the classification results."
           },
           {
             role: "user",
             content: classificationPrompt
           }
         ],
         functions: [{
           name: "classify_email",
           description: "Classify an email based on its content and context",
           parameters: {
             type: "object",
             properties: {
               type: {
                 type: "string",
                 enum: ["customer_service", "sales", "product_inquiry", "complaint", "general"]
               },
               confidence: {
                 type: "number",
                 minimum: 0,
                 maximum: 1
               },
               reasoning: {
                 type: "string"
               },
               urgency: {
                 type: "string",
                 enum: ["low", "medium", "high"]
               },
               sentiment: {
                 type: "string",
                 enum: ["positive", "neutral", "negative"]
               },
               extractedEntities: {
                 type: "object",
                 properties: {
                   products: {
                     type: "array",
                     items: { type: "string" }
                   },
                   orders: {
                     type: "array",
                     items: { type: "string" }
                   },
                   brands: {
                     type: "array",
                     items: { type: "string" }
                   },
                   models: {
                     type: "array",
                     items: { type: "string" }
                   },
                   years: {
                     type: "array",
                     items: { type: "number" }
                   }
                 }
               }
             },
             required: ["type", "confidence", "reasoning", "urgency", "sentiment", "extractedEntities"]
           }
         }],
         function_call: { name: "classify_email" }
       });

       // Extract classification result from function call
       const functionCall = response.choices[0].message.function_call;
       if (functionCall && functionCall.arguments) {
         const result = JSON.parse(functionCall.arguments);
         
         // Add language and cultural context to the result
         result.language = languageInfo.language;
         result.countryCode = languageInfo.countryCode;
         result.culturalContext = languageInfo.culturalContext;
         
         console.log(`[AI Hub] Email classified as: ${result.type} (confidence: ${result.confidence}) in language: ${result.language}`);
         return result;
       }

              // Fallback classification
        return {
          type: 'general',
          confidence: 0.5,
          reasoning: 'Failed to classify email using AI',
          urgency: 'medium',
          sentiment: 'neutral',
          language: languageInfo.language,
          countryCode: languageInfo.countryCode,
          culturalContext: languageInfo.culturalContext,
          extractedEntities: {}
        };

    } catch (error) {
      console.error(`[AI Hub] Error classifying email:`, error);
      throw error;
    }
  }

  /**
   * Build comprehensive AI context for processing
   */
  private async buildAIContext(
    context: EmailProcessingContext,
    organizationSettings: Record<string, any>
  ): Promise<any> {
    const aiContext = {
      email: {
        id: context.emailId,
        content: context.emailContent,
        subject: context.emailSubject,
        sender: context.senderEmail,
        senderName: context.senderName,
        type: context.emailType
      },
      organization: {
        id: context.organizationId,
        settings: organizationSettings
      },
      user: {
        id: context.userId
      },
      conversationHistory: context.conversationHistory || [],
      metadata: {
        contactId: context.contactId,
        productMentions: context.productMentions || [],
        orderReferences: context.orderReferences || []
      }
    };

         // Add Metakocka data if available
     try {
       const metakockaData = await getMetakockaDataForAIContext(context.userId);
       if (metakockaData) {
         (aiContext as any).metakocka = metakockaData;
       }
     } catch (error) {
       console.warn(`[AI Hub] Could not fetch Metakocka data:`, error);
     }

    return aiContext;
  }

       /**
   * Process with OpenAI Chat Completions API (TODO: Migrate to Responses API when types are available)
   */
  private async processWithResponsesAPI(
    aiContext: any,
    aiConfig: any
  ): Promise<AIProcessingResult> {
    const systemPrompt = this.buildSystemPrompt(aiContext);
    const userPrompt = this.buildUserPrompt(aiContext);
    
    // Get language and cultural context from the email
    const emailLanguage = aiContext.email?.language || 'en';
    const culturalContext = aiContext.email?.culturalContext || '';
    const countryCode = aiContext.email?.countryCode || '';
    
    // Build multilanguage system prompt
    const multilanguageSystemPrompt = this.buildMultilanguageSystemPrompt(systemPrompt, emailLanguage, culturalContext, countryCode);

     // Use OpenAI Chat Completions API for now
     const response = await this.openai.chat.completions.create({
       model: aiConfig?.openai_model || "gpt-4o",
       messages: [
         { role: "system", content: multilanguageSystemPrompt },
         { role: "user", content: userPrompt }
       ],
       temperature: aiConfig?.temperature || 0.7,
       max_tokens: aiConfig?.max_tokens || 1000,
       functions: this.buildChatFunctions(aiContext),
       function_call: "auto"
     });

     // Extract the response
     const message = response.choices[0].message;
     const responseText = message.content || '';

     // Parse any function calls for additional data
     const functionCall = message.function_call;
     const additionalData = this.processChatFunctionCall(functionCall);

     return {
       response: responseText,
       confidence: 0.9, // TODO: Calculate actual confidence
       reasoning: "Processed using OpenAI Chat Completions API",
       suggestedActions: additionalData.suggestedActions || [],
       productRecommendations: additionalData.productRecommendations || [],
       upsellingSuggestions: additionalData.upsellingSuggestions || [],
       followUpReminders: additionalData.followUpReminders || [],
       requiresHumanReview: this.shouldRequireHumanReview(aiContext, responseText),
       estimatedSentiment: additionalData.sentiment || 'neutral',
       responseId: response.id,
       metadata: {
         model: response.model,
         usage: response.usage,
         processingTime: Date.now()
       }
     };
   }

  /**
   * Apply organization-specific post-processing
   */
  private async applyOrganizationPostProcessing(
    result: AIProcessingResult,
    context: EmailProcessingContext,
    organizationSettings: Record<string, any>
  ): Promise<AIProcessingResult> {
    // Apply Withcar-specific automotive matching
    if (organizationSettings.automotive_matching?.enabled) {
      result = await this.applyAutomotiveMatching(result, context);
    }

    // Apply upselling framework
    if (organizationSettings.upselling_framework?.enabled) {
      result = await this.applyUpsellingFramework(result, context);
    }

    // Apply communication preferences
    if (organizationSettings.communication_preferences) {
      result = await this.applyCommunicationPreferences(result, organizationSettings.communication_preferences);
    }

    return result;
  }

  /**
   * Build system prompt for AI processing
   */
  private buildSystemPrompt(aiContext: any): string {
    const orgSettings = aiContext.organization.settings;
    const commPrefs = orgSettings.communication_preferences || {};

    let systemPrompt = `You are an intelligent email assistant for ${orgSettings.name || 'the organization'}. `;
    
    if (commPrefs.auto_response_tone) {
      systemPrompt += `Your tone should be ${commPrefs.auto_response_tone}. `;
    }

    if (commPrefs.default_language) {
      systemPrompt += `Respond in ${commPrefs.default_language} unless the customer writes in a different language. `;
    }

    systemPrompt += `

Your responsibilities:
1. Analyze incoming emails for intent, sentiment, and urgency
2. Generate helpful, accurate responses using available data
3. Suggest relevant products when appropriate
4. Identify upselling opportunities
5. Determine if human review is needed
6. Maintain conversation context

Available data sources:
- Organization settings and preferences
- Metakocka ERP data (products, orders, inventory)
- Customer conversation history
- Product catalog and recommendations

Always be helpful, professional, and accurate in your responses.`;

    return systemPrompt;
  }

  /**
   * Build user prompt for AI processing
   */
  private buildUserPrompt(aiContext: any): string {
    const email = aiContext.email;
    
    let userPrompt = `Please process the following email:

Subject: ${email.subject}
From: ${email.sender}
Content: ${email.content}

Email Type: ${email.type}
`;

    if (aiContext.conversationHistory && aiContext.conversationHistory.length > 0) {
      userPrompt += `\nConversation History:\n${JSON.stringify(aiContext.conversationHistory, null, 2)}`;
    }

    if (aiContext.metakocka) {
      userPrompt += `\nAvailable Metakocka Data:\n${JSON.stringify(aiContext.metakocka, null, 2)}`;
    }

    userPrompt += `\nPlease provide a comprehensive response that addresses the customer's needs.`;

    return userPrompt;
  }

  /**
   * Build tools for OpenAI function calling
   */
  private buildTools(aiContext: any): any[] {
    const tools = [];

    // Product search tool
    tools.push({
      type: "function",
      function: {
        name: "search_products",
        description: "Search for products based on criteria",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string" },
            brand: { type: "string" },
            model: { type: "string" },
            year: { type: "number" },
            category: { type: "string" }
          }
        }
      }
    });

    // Order lookup tool
    tools.push({
      type: "function",
      function: {
        name: "lookup_order",
        description: "Look up order information",
        parameters: {
          type: "object",
          properties: {
            orderNumber: { type: "string" },
            customerEmail: { type: "string" }
          }
        }
      }
    });

    return tools;
  }

  /**
   * Build classification prompt
   */
  private buildClassificationPrompt(
    emailContent: string,
    emailSubject: string,
    organizationSettings: Record<string, any>,
    automotiveConfig: any
  ): string {
    let prompt = `Classify the following email based on its content and context:

Subject: ${emailSubject}
Content: ${emailContent}

Classification Categories:
- customer_service: Questions about orders, shipping, returns, technical support
- sales: Inquiries about purchasing, pricing, availability
- product_inquiry: Questions about specific products, compatibility, features
- complaint: Complaints, negative feedback, issues with products/service
- general: General inquiries, greetings, other topics

`;

    if (automotiveConfig?.enabled) {
      prompt += `Special Context: This is an automotive company. Look for:
- Car brands: ${automotiveConfig.supported_brands?.join(', ')}
- Product categories: ${automotiveConfig.product_categories?.join(', ')}
- Model years, specific car models, parts compatibility questions

`;
    }

    prompt += `Please analyze the email and classify it using the classify_email function.`;

    return prompt;
  }

  /**
   * Process function calls from OpenAI response
   */
  private processFunctionCalls(functionCalls: any[]): any {
    const additionalData: any = {
      suggestedActions: [],
      productRecommendations: [],
      upsellingSuggestions: [],
      followUpReminders: []
    };

    functionCalls.forEach(call => {
      try {
        const args = JSON.parse(call.arguments);
        
        switch (call.name) {
          case 'search_products':
            additionalData.productRecommendations.push(args);
            break;
          case 'lookup_order':
            additionalData.suggestedActions.push(`Look up order: ${args.orderNumber}`);
            break;
        }
      } catch (error) {
        console.warn(`[AI Hub] Error processing function call:`, error);
      }
    });

    return additionalData;
  }

  /**
   * Determine if human review is required
   */
  private shouldRequireHumanReview(aiContext: any, responseText: string): boolean {
    // Check for complaint types
    if (aiContext.email.type === 'complaint') {
      return true;
    }

    // Check for negative sentiment indicators
    const negativeIndicators = ['sorry', 'problem', 'issue', 'wrong', 'broken', 'defective'];
    const hasNegativeIndicators = negativeIndicators.some(indicator => 
      responseText.toLowerCase().includes(indicator) || 
      aiContext.email.content.toLowerCase().includes(indicator)
    );

    if (hasNegativeIndicators) {
      return true;
    }

    // Check for complex product inquiries
    if (aiContext.email.type === 'product_inquiry' && 
        aiContext.metadata.productMentions.length > 3) {
      return true;
    }

    return false;
  }

     /**
    * Apply automotive-specific product matching
    */
   private async applyAutomotiveMatching(
     result: AIProcessingResult,
     context: EmailProcessingContext
   ): Promise<AIProcessingResult> {
     try {
       // Extract car specifications from email content
       const carSpecs = await this.automotiveMatcher.extractCarSpecifications(
         context.emailContent + ' ' + context.emailSubject,
         context.organizationId
       );

       if (carSpecs.length === 0) {
         console.log(`[AI Hub] No car specifications found in email ${context.emailId}`);
         return result;
       }

       // Use the first car specification found
       const carSpec = carSpecs[0];
       
       // Validate the car specification
       const validation = await this.automotiveMatcher.validateCarSpecification(carSpec, context.organizationId);
       
       if (!validation.valid) {
         console.warn(`[AI Hub] Invalid car specification for ${carSpec.brand} ${carSpec.model} ${carSpec.year}:`, validation.issues);
         return result;
       }

       // Match products based on car specification
       const matchingResult = await this.automotiveMatcher.matchProducts(
         carSpec,
         context.emailContent,
         context.organizationId,
         context.userId,
         10
       );

       // Enhance the AI result with automotive matching data
       result.productRecommendations = [
         ...(result.productRecommendations || []),
         ...matchingResult.matches.map(match => ({
           type: 'automotive_match',
           productId: match.productId,
           productName: match.productName,
           matchScore: match.matchScore,
           matchReason: match.matchReason,
           category: match.category,
           price: match.price,
           availability: match.availability,
           carCompatibility: match.compatibility
         }))
       ];

       // Add upselling suggestions
       result.upsellingSuggestions = [
         ...(result.upsellingSuggestions || []),
         ...matchingResult.upsellOpportunities.map(upsell => ({
           type: 'automotive_upsell',
           productName: upsell.productName,
           reason: upsell.matchReason,
           category: upsell.category,
           priority: 'medium'
         }))
       ];

       // Update suggested actions
       result.suggestedActions = [
         ...(result.suggestedActions || []),
         `Found ${matchingResult.matches.length} products for ${carSpec.brand} ${carSpec.model} ${carSpec.year}`,
         ...matchingResult.suggestions.exactMatches.map(match => 
           `Recommend exact match: ${match.productName}`
         ),
         ...matchingResult.suggestions.compatibleMatches.map(match => 
           `Suggest compatible product: ${match.productName}`
         )
       ];

       // Update reasoning
       const automotiveReasoning = `\n\nAutomotive Analysis: ${matchingResult.reasoning}`;
       result.reasoning += automotiveReasoning;

       // Enhance response with automotive information
       if (matchingResult.matches.length > 0) {
         const bestMatches = matchingResult.suggestions.exactMatches.slice(0, 3);
         const productList = bestMatches.map(match => 
           `• ${match.productName} (${match.category}) - ${match.matchReason}`
         ).join('\n');

         result.response += `\n\nBased on your ${carSpec.brand} ${carSpec.model} ${carSpec.year}, here are some products that would be perfect for your vehicle:\n\n${productList}`;

         if (matchingResult.upsellOpportunities.length > 0) {
           const upsellList = matchingResult.upsellOpportunities.slice(0, 2).map(upsell => 
             `• ${upsell.productName} - ${upsell.matchReason}`
           ).join('\n');
           result.response += `\n\nYou might also be interested in:\n${upsellList}`;
         }
       }

       console.log(`[AI Hub] Applied automotive matching for ${carSpec.brand} ${carSpec.model} ${carSpec.year}: ${matchingResult.matches.length} matches`);
       return result;

     } catch (error) {
       console.error('[AI Hub] Error applying automotive matching:', error);
       // Return original result if automotive matching fails
       return result;
     }
   }

  /**
   * Apply upselling framework
   */
  private async applyUpsellingFramework(
    result: AIProcessingResult,
    context: EmailProcessingContext
  ): Promise<AIProcessingResult> {
    // TODO: Implement upselling logic based on organization settings
    // This would suggest complementary products, premium versions, etc.
    return result;
  }

  /**
   * Apply communication preferences
   */
  private async applyCommunicationPreferences(
    result: AIProcessingResult,
    commPrefs: any
  ): Promise<AIProcessingResult> {
    // Apply email signature if enabled
    if (commPrefs.email_signature?.enabled && commPrefs.email_signature?.template) {
      result.response += `\n\n${commPrefs.email_signature.template}`;
    }

    return result;
  }

  /**
   * Get email delay for processing
   */
  async getEmailDelay(
    organizationId: string,
    emailType: 'customer_service' | 'sales' | 'product_inquiry' | 'complaint'
  ): Promise<number> {
    return await this.settingsService.getEmailDelayForType(organizationId, emailType);
  }

  /**
   * Schedule email processing with delay
   */
  async scheduleEmailProcessing(
    context: EmailProcessingContext,
    delayMinutes: number = 0
  ): Promise<void> {
    const supabase = await this.supabase;
    
    const scheduledTime = new Date(Date.now() + delayMinutes * 60 * 1000);
    
    // Add to email queue with scheduled time
    await supabase
      .from('email_queue')
      .insert({
        email_id: context.emailId,
        organization_id: context.organizationId,
        status: 'pending',
        priority: context.emailType === 'complaint' ? 'high' : 'medium',
        scheduled_at: scheduledTime.toISOString(),
        metadata: {
          email_type: context.emailType,
          delay_minutes: delayMinutes,
          scheduled_by: 'ai_hub'
        }
      });

         console.log(`[AI Hub] Email ${context.emailId} scheduled for processing at ${scheduledTime.toISOString()}`);
   }

   /**
    * Build chat functions for OpenAI function calling
    */
   private buildChatFunctions(aiContext: any): any[] {
     return [
       {
         name: "search_products",
         description: "Search for products based on criteria",
         parameters: {
           type: "object",
           properties: {
             query: { type: "string" },
             brand: { type: "string" },
             model: { type: "string" },
             year: { type: "number" },
             category: { type: "string" }
           }
         }
       },
       {
         name: "lookup_order",
         description: "Look up order information",
         parameters: {
           type: "object",
           properties: {
             orderNumber: { type: "string" },
             customerEmail: { type: "string" }
           }
         }
       }
     ];
   }

   /**
    * Process function call from OpenAI chat response
    */
   private processChatFunctionCall(functionCall: any): any {
     const additionalData: any = {
       suggestedActions: [],
       productRecommendations: [],
       upsellingSuggestions: [],
       followUpReminders: []
     };

     if (functionCall) {
       try {
         const args = JSON.parse(functionCall.arguments);
         
         switch (functionCall.name) {
           case 'search_products':
             additionalData.productRecommendations.push(args);
             break;
           case 'lookup_order':
             additionalData.suggestedActions.push(`Look up order: ${args.orderNumber}`);
             break;
         }
       } catch (error) {
         console.warn(`[AI Hub] Error processing function call:`, error);
       }
     }

     return additionalData;
   }

   /**
    * Build multilanguage system prompt with cultural context
    */
   private buildMultilanguageSystemPrompt(
     basePrompt: string,
     language: string,
     culturalContext: string,
     countryCode?: string
   ): string {
     const languageInstructions = this.getLanguageInstructions(language);
     const culturalInstructions = this.getCulturalInstructions(culturalContext, countryCode);
     
     return `${basePrompt}

LANGUAGE AND CULTURAL CONTEXT:
- Respond in ${languageInstructions.name} (${language})
- Use ${languageInstructions.formality} tone
- Follow ${culturalInstructions.communicationStyle} communication style
- Consider ${culturalInstructions.businessContext} business context
- Time zone: ${culturalInstructions.timeZone}
- Currency: ${culturalInstructions.currency}

RESPONSE REQUIREMENTS:
- Write your response entirely in ${languageInstructions.name}
- Use appropriate cultural greetings and closings
- Apply correct formality level for the culture
- Include relevant business information (VAT, shipping, etc.) for the region
- Respect cultural communication preferences`;
   }

   /**
    * Get language-specific instructions
    */
   private getLanguageInstructions(language: string): any {
     const languageMap: any = {
       'en': { name: 'English', formality: 'professional but friendly' },
       'de': { name: 'German', formality: 'formal and precise' },
       'fr': { name: 'French', formality: 'formal and polite' },
       'it': { name: 'Italian', formality: 'formal and relationship-oriented' },
       'es': { name: 'Spanish', formality: 'formal and courteous' },
       'nl': { name: 'Dutch', formality: 'direct but polite' },
       'pt': { name: 'Portuguese', formality: 'formal and respectful' },
       'pl': { name: 'Polish', formality: 'formal and hierarchical' },
       'cs': { name: 'Czech', formality: 'formal and professional' },
       'sk': { name: 'Slovak', formality: 'formal and respectful' },
       'hu': { name: 'Hungarian', formality: 'very formal and hierarchical' },
       'sl': { name: 'Slovenian', formality: 'formal and precise' },
       'ro': { name: 'Romanian', formality: 'formal and relationship-focused' },
       'bg': { name: 'Bulgarian', formality: 'formal and respectful' },
       'hr': { name: 'Croatian', formality: 'formal and personal' },
       'sv': { name: 'Swedish', formality: 'informal but respectful' },
       'da': { name: 'Danish', formality: 'informal and direct' },
       'fi': { name: 'Finnish', formality: 'direct and concise' },
       'et': { name: 'Estonian', formality: 'direct and digital-first' },
       'lv': { name: 'Latvian', formality: 'formal and punctual' },
       'lt': { name: 'Lithuanian', formality: 'formal and conservative' },
       'el': { name: 'Greek', formality: 'formal and relationship-building' },
       'mt': { name: 'Maltese', formality: 'mixed formal and informal' }
     };

     return languageMap[language] || languageMap['en'];
   }

   /**
    * Get cultural instructions based on context
    */
   private getCulturalInstructions(culturalContext: string, countryCode?: string): any {
     const countryDefaults: any = {
       'DE': { communicationStyle: 'direct and efficient', businessContext: 'precision-focused', timeZone: 'Europe/Berlin', currency: 'EUR' },
       'FR': { communicationStyle: 'diplomatic and formal', businessContext: 'relationship-oriented', timeZone: 'Europe/Paris', currency: 'EUR' },
       'IT': { communicationStyle: 'expressive and relationship-focused', businessContext: 'personal connection important', timeZone: 'Europe/Rome', currency: 'EUR' },
       'ES': { communicationStyle: 'warm and formal', businessContext: 'relationship-building', timeZone: 'Europe/Madrid', currency: 'EUR' },
       'NL': { communicationStyle: 'direct and practical', businessContext: 'efficiency-focused', timeZone: 'Europe/Amsterdam', currency: 'EUR' },
       'SI': { communicationStyle: 'formal and methodical', businessContext: 'precision and reliability', timeZone: 'Europe/Ljubljana', currency: 'EUR' },
       'PL': { communicationStyle: 'formal and hierarchical', businessContext: 'respect for authority', timeZone: 'Europe/Warsaw', currency: 'PLN' },
       'CZ': { communicationStyle: 'formal and reserved', businessContext: 'traditional business approach', timeZone: 'Europe/Prague', currency: 'CZK' },
       'HU': { communicationStyle: 'very formal and structured', businessContext: 'hierarchy respect', timeZone: 'Europe/Budapest', currency: 'HUF' },
       'SE': { communicationStyle: 'informal and consensus-building', businessContext: 'collaborative approach', timeZone: 'Europe/Stockholm', currency: 'SEK' },
       'DK': { communicationStyle: 'informal and honest', businessContext: 'direct and transparent', timeZone: 'Europe/Copenhagen', currency: 'DKK' },
       'FI': { communicationStyle: 'direct and concise', businessContext: 'efficiency and silence acceptance', timeZone: 'Europe/Helsinki', currency: 'EUR' }
     };

     const defaultInstructions = {
       communicationStyle: 'professional and courteous',
       businessContext: 'standard business practices',
       timeZone: 'Europe/London',
       currency: 'EUR'
     };

     return countryDefaults[countryCode || ''] || defaultInstructions;
   }

   /**
    * Determine email urgency based on content and subject
    */
   private determineEmailUrgency(emailText: string): 'low' | 'medium' | 'high' | 'urgent' {
     const urgentKeywords = ['urgent', 'asap', 'emergency', 'critical', 'immediately', 'deadline'];
     const highKeywords = ['important', 'priority', 'soon', 'today'];
     
     const lowerText = emailText.toLowerCase();
     
     if (urgentKeywords.some(keyword => lowerText.includes(keyword))) {
       return 'urgent';
     }
     
     if (highKeywords.some(keyword => lowerText.includes(keyword))) {
       return 'high';
     }
     
     // Check for time-sensitive patterns
     if (lowerText.includes('end of day') || lowerText.includes('eod') || lowerText.includes('by tomorrow')) {
       return 'high';
     }
     
     return 'medium';
   }
 } 