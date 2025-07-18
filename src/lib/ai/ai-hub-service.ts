/**
 * AI Hub Service - Central AI Processing Hub
 * 
 * This service acts as the central AI hub for all email processing,
 * integrating with OpenAI Responses API and organization-specific settings.
 */

import OpenAI from 'openai';
import { OrganizationSettingsService } from '@/lib/services/organization-settings-service';
import { getMetakockaDataForAIContext } from '@/lib/integrations/metakocka/metakocka-ai-integration';
import { createLazyServerClient } from '@/lib/supabase/lazy-client';

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

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.settingsService = new OrganizationSettingsService();
    this.supabase = createLazyServerClient();
  }

  /**
   * Process an email through the AI hub
   */
  async processEmail(context: EmailProcessingContext): Promise<AIProcessingResult> {
    console.log(`[AI Hub] Processing email ${context.emailId} for organization ${context.organizationId}`);

    try {
      // Get organization-specific AI settings
      const aiConfig = await this.settingsService.getAIProcessingConfig(context.organizationId);
      const organizationSettings = await this.settingsService.getAllSettings(context.organizationId);

      // Build comprehensive context for AI processing
      const aiContext = await this.buildAIContext(context, organizationSettings);

      // Process with OpenAI Responses API
      const result = await this.processWithResponsesAPI(aiContext, aiConfig);

      // Apply organization-specific post-processing
      const finalResult = await this.applyOrganizationPostProcessing(result, context, organizationSettings);

      console.log(`[AI Hub] Successfully processed email ${context.emailId}`);
      return finalResult;

    } catch (error) {
      console.error(`[AI Hub] Error processing email ${context.emailId}:`, error);
      throw error;
    }
  }

  /**
   * Classify an email to determine its type and urgency
   */
  async classifyEmail(
    emailContent: string,
    emailSubject: string,
    organizationId: string
  ): Promise<EmailClassificationResult> {
    console.log(`[AI Hub] Classifying email for organization ${organizationId}`);

    try {
      // Get organization-specific classification rules
      const organizationSettings = await this.settingsService.getAllSettings(organizationId);
      const automotiveConfig = await this.settingsService.getAutomotiveMatchingConfig(organizationId);

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
         
         console.log(`[AI Hub] Email classified as: ${result.type} (confidence: ${result.confidence})`);
         return result;
       }

      // Fallback classification
      return {
        type: 'general',
        confidence: 0.5,
        reasoning: 'Failed to classify email using AI',
        urgency: 'medium',
        sentiment: 'neutral',
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

     // Use OpenAI Chat Completions API for now
     const response = await this.openai.chat.completions.create({
       model: aiConfig?.openai_model || "gpt-4o",
       messages: [
         { role: "system", content: systemPrompt },
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
    // TODO: Implement automotive-specific matching logic
    // This would analyze the email for car brands, models, years
    // and match them with available products
    return result;
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
 } 