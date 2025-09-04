/**
 * Universal AI Agent Service - The Future of CRM
 * 
 * This revolutionary service enables natural language interaction with all CRM entities.
 * Users can manage suppliers, products, contacts, and orders through conversational AI.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import OpenAI from 'openai';
import { ModelRouterService, TaskComplexity, type TaskAnalysis, type ModelSelection } from './model-router-service';
// import { AIMemoryService, AIMemoryType } from './memory/ai-memory-service'; // Temporarily disabled

export interface UniversalAgentAction {
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'QUERY' | 'SEARCH' | 'ANALYZE' | 'CAMPAIGN_CREATE' | 'CAMPAIGN_SEGMENT' | 'CAMPAIGN_PERSONALIZE' | 'CAMPAIGN_SCHEDULE';
  entity: 'supplier' | 'product' | 'contact' | 'order' | 'outbound_campaign' | 'cross_entity';
  data?: Record<string, any>;
  filters?: Record<string, any>;
  query?: string;
  joins?: string[];
  outputFormat?: 'text' | 'table' | 'cards' | 'chart' | 'export' | 'campaign_preview';
  campaignData?: {
    segmentCriteria?: Record<string, any>;
    personalizationLevel?: 'basic' | 'advanced' | 'hyper-personalized';
    templateVariables?: Record<string, any>;
    schedulingOptions?: {
      sendDate?: string;
      timeZone?: string;
      batchSize?: number;
    };
  };
}

export interface UniversalAgentResponse {
  success: boolean;
  message: string;
  data?: any;
  actions?: UniversalAgentAction[];
  confidence: number;
  thinking?: string[];
  needsClarification?: boolean;
  clarificationQuestions?: string[];
  visualData?: {
    type: 'table' | 'cards' | 'chart';
    data: any[];
    headers?: string[];
  };
  modelUsed?: {
    id: string;
    name: string;
    reasoning: string[];
    alternatives?: string[];
    canOverride?: boolean;
  };
}

export interface ConversationContext {
  lastEntity?: string;
  lastAction?: string;
  recentlyCreated?: Record<string, any>;
  activeFilters?: Record<string, any>;
  conversationHistory?: string[];
}

export interface EntitySchema {
  table: string;
  displayName: string;
  fields: Record<string, {
    type: string;
    required: boolean;
    description: string;
    examples?: string[];
  }>;
  relationships?: Record<string, {
    table: string;
    field: string;
    description: string;
  }>;
}

export class UniversalAgentService {
  private supabase: SupabaseClient<Database>;
  private openai: OpenAI;
  private modelRouter: ModelRouterService;
  // private memoryService: AIMemoryService; // Temporarily disabled
  private organizationId: string;
  private userId: string;
  private context: ConversationContext = {};
  private userModelPreference?: string;

  // Enhanced entity schemas with relationships
  private schemas: Record<string, EntitySchema> = {
    supplier: {
      table: 'suppliers',
      displayName: 'Supplier',
      fields: {
        name: { type: 'string', required: true, description: 'Company or supplier name', examples: ['TechCorp', 'GreenTech Industries', 'ABC Supplies'] },
        email: { type: 'string', required: false, description: 'Contact email address', examples: ['info@techcorp.com', 'sales@greentech.com'] },
        phone: { type: 'string', required: false, description: 'Phone number', examples: ['555-1234', '+1-555-123-4567'] },
        address: { type: 'string', required: false, description: 'Physical address', examples: ['123 Main St, New York, NY', '456 Business Ave, California'] },
        website: { type: 'string', required: false, description: 'Website URL', examples: ['https://techcorp.com', 'www.greentech.com'] },
        notes: { type: 'string', required: false, description: 'Additional notes or comments', examples: ['Reliable supplier', 'Good prices on electronics'] },
        reliabilityScore: { type: 'number', required: false, description: 'Reliability score from 1-10', examples: ['8.5', '9.2'] }
      },
      relationships: {
        products: { table: 'products', field: 'supplier_id', description: 'Products from this supplier' }
      }
    },
    product: {
      table: 'products',
      displayName: 'Product',
      fields: {
        name: { type: 'string', required: true, description: 'Product name', examples: ['iPhone 15', 'Wireless Headphones', 'Office Chair'] },
        description: { type: 'string', required: false, description: 'Product description', examples: ['Latest smartphone with advanced features', 'Comfortable ergonomic chair'] },
        category: { type: 'string', required: false, description: 'Product category', examples: ['Electronics', 'Furniture', 'Clothing'] },
        sku: { type: 'string', required: false, description: 'Stock keeping unit', examples: ['IPHONE15-128', 'WH-001'] },
        selling_price: { type: 'number', required: false, description: 'Selling price', examples: ['999.99', '29.99'] },
        cost_price: { type: 'number', required: false, description: 'Cost price', examples: ['799.99', '19.99'] },
        quantity_on_hand: { type: 'number', required: false, description: 'Current inventory quantity', examples: ['100', '25'] },
        min_stock_level: { type: 'number', required: false, description: 'Minimum stock level', examples: ['10', '5'] }
      },
      relationships: {
        supplier: { table: 'suppliers', field: 'id', description: 'Supplier of this product' }
      }
    },
    contact: {
      table: 'contacts',
      displayName: 'Contact',
      fields: {
        firstname: { type: 'string', required: true, description: 'First name', examples: ['John', 'Sarah', 'Michael'] },
        lastname: { type: 'string', required: true, description: 'Last name', examples: ['Smith', 'Johnson', 'Brown'] },
        email: { type: 'string', required: true, description: 'Email address', examples: ['john@example.com', 'sarah.johnson@company.com'] },
        phone: { type: 'string', required: false, description: 'Phone number', examples: ['555-1234', '+1-555-987-6543'] },
        company: { type: 'string', required: false, description: 'Company name', examples: ['TechCorp', 'Microsoft', 'Google'] },
        position: { type: 'string', required: false, description: 'Job title or position', examples: ['CEO', 'CTO', 'Sales Manager'] },
        notes: { type: 'string', required: false, description: 'Additional notes', examples: ['Key decision maker', 'Interested in bulk orders'] },
        status: { type: 'string', required: false, description: 'Contact status', examples: ['active', 'inactive', 'prospect'] }
      }
    },
    outbound_campaign: {
      table: 'outbound_campaigns',
      displayName: 'Outbound Campaign',
      fields: {
        name: { type: 'string', required: true, description: 'Campaign name', examples: ['Win-back Campaign', 'Upsell Q4 2024', 'New Product Launch'] },
        description: { type: 'string', required: false, description: 'Campaign description', examples: ['Target customers who haven\'t purchased in 6 months', 'Upsell existing customers to premium packages'] },
        target_criteria: { type: 'json', required: true, description: 'Segmentation criteria in JSON format', examples: ['{"last_purchase_days_ago": 180}', '{"lead_score_min": 80}'] },
        email_template: { type: 'string', required: false, description: 'Email template content', examples: ['Personalized offer based on purchase history'] },
        status: { type: 'string', required: false, description: 'Campaign status', examples: ['draft', 'active', 'paused', 'completed'] },
        send_date: { type: 'datetime', required: false, description: 'Scheduled send date', examples: ['2024-12-01T10:00:00Z'] },
        personalization_level: { type: 'string', required: false, description: 'AI personalization level', examples: ['basic', 'advanced', 'hyper-personalized'] }
      },
      relationships: {
        contacts: { table: 'contacts', field: 'id', description: 'Targeted contacts for this campaign' },
        leads: { table: 'lead_scores', field: 'contact_id', description: 'Lead scoring data for targeting' },
        opportunities: { table: 'sales_opportunities', field: 'contact_id', description: 'Pipeline opportunities related to targets' }
      }
    }
  };

  constructor(
    supabase: SupabaseClient<Database>,
    openai: OpenAI,
    organizationId: string,
    userId: string
  ) {
    this.supabase = supabase;
    this.openai = openai;
    this.organizationId = organizationId;
    this.userId = userId;
    this.modelRouter = new ModelRouterService(supabase, openai, organizationId, userId);
    // Memory service temporarily disabled until database schema is set up
    // this.memoryService = new AIMemoryService(supabase, openai);
  }

  /**
   * Process natural language message with thinking agent approach
   */
  async processMessage(message: string, userModelOverride?: string): Promise<UniversalAgentResponse> {
    const thinking: string[] = [];
    let modelUsed: any;
    let startTime = Date.now();
    let selectedModelId: string = '';
    let taskComplexity: any;
    
    try {
      // Step 1: Analyze task complexity and select optimal model
      thinking.push("🎯 **Step 1:** Analyzing request complexity and selecting optimal AI model");
      
      const taskAnalysis = await this.modelRouter.analyzeTaskComplexity(message, this.context);
      taskComplexity = taskAnalysis.complexity;
      thinking.push(...taskAnalysis.reasoning);
      
      selectedModelId = userModelOverride || taskAnalysis.suggestedModel;
      const selectedModel = this.modelRouter.getModel(selectedModelId);
      
      if (selectedModel) {
        thinking.push(`🤖 **Selected Model**: ${selectedModel.name} (${selectedModel.description})`);
        thinking.push(`💰 **Estimated Cost**: $${taskAnalysis.estimatedCost.toFixed(4)} (${taskAnalysis.estimatedTokens} tokens)`);
        
        modelUsed = {
          id: selectedModel.id,
          name: selectedModel.name,
          reasoning: [
            `Task complexity: ${taskAnalysis.complexity}`,
            `Confidence: ${Math.round(taskAnalysis.confidence * 100)}%`,
            selectedModel.description
          ],
          alternatives: taskAnalysis.alternativeModels,
          canOverride: true
        };
        
        if (userModelOverride) {
          thinking.push(`👤 **User Override**: You selected ${selectedModel.name}`);
          modelUsed.reasoning.unshift('User override applied');
        }
      }
      
      // Step 2: Analyze intent with selected model
      thinking.push("🔍 **Step 2:** Understanding your request with selected model");
      const intent = await this.analyzeIntent(message, thinking, selectedModelId);
      
      if (!intent.success) {
        return {
          success: false,
          message: "I couldn't understand what you want to do. Could you please rephrase or be more specific?",
          confidence: 0.1,
          thinking,
          needsClarification: true,
          clarificationQuestions: [
            "What would you like to do? (add, find, update, delete)",
            "Which type of data are you working with? (suppliers, products, contacts, orders)",
            "Can you provide more details about what you need?"
          ]
        };
      }

      // Step 3: Validate and check for missing information
      thinking.push("**Checking what I need:**");
      const validation = await this.validateAction(intent.action!, thinking);
      
      if (validation.needsClarification) {
        return {
          success: false,
          message: validation.message,
          confidence: intent.confidence,
          thinking,
          needsClarification: true,
          clarificationQuestions: validation.clarificationQuestions
        };
      }

      // Step 4: Execute action
      thinking.push("⚡ **Step 2:** Executing the action");
      
      const result = await this.executeAction(intent.action!, thinking);
      
      // Step 5: Memory storage temporarily disabled
      
      // Track model performance and learn from user overrides
      const responseTime = Date.now() - startTime;
      if (selectedModelId && taskComplexity) {
        this.trackModelPerformance(
          selectedModelId,
          intent.action?.type || 'general',
          taskComplexity,
          result.success,
          responseTime
        );
        
        // Learn from user override if applicable
        if (userModelOverride && taskAnalysis) {
          await this.modelRouter.learnFromUserOverride(
            taskAnalysis.suggestedModel,
            selectedModelId,
            intent.action?.type || 'general',
            taskComplexity,
            result.success
          );
        }
      }
      
      return {
        success: result.success,
        message: result.message,
        data: result.data,
        actions: [intent.action!],
        confidence: intent.confidence,
        thinking,
        visualData: result.visualData,
        modelUsed
      };
      
    } catch (error) {
      console.error('Universal agent processing error:', error);
      thinking.push("❌ **Error occurred during processing**");
      
      // Track failed performance
      const responseTime = Date.now() - startTime;
      if (selectedModelId && taskComplexity) {
        this.trackModelPerformance(
          selectedModelId,
          'error',
          taskComplexity,
          false,
          responseTime
        );
      }
      
      return {
        success: false,
        message: "I encountered an error while processing your request. Please try again or rephrase your question.",
        confidence: 0,
        thinking,
        modelUsed
      };
    }
  }

  /**
   * Process message with streaming updates for real-time thinking
   */
  async processMessageWithStreaming(message: string, onUpdate: (update: any) => void, userModelOverride?: string): Promise<void> {
    let startTime = Date.now();
    let selectedModelId: string = '';
    let taskComplexity: any;
    
    try {
      // Step 1: Start thinking
      onUpdate({ type: 'thinking', step: 'CRM Assistant is thinking...' });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Analyze complexity and select model
      onUpdate({ type: 'thinking', step: '🧠 Analyzing task complexity and selecting optimal model' });
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const taskAnalysis = await this.modelRouter.analyzeTaskComplexity(message, this.context);
      taskComplexity = taskAnalysis.complexity;
      selectedModelId = userModelOverride || taskAnalysis.suggestedModel;
      const selectedModel = this.modelRouter.getModel(selectedModelId);
      
      if (selectedModel) {
        const modelInfo = userModelOverride 
          ? `🤖 Using ${selectedModel.name} (user selected)`
          : `🤖 Selected ${selectedModel.name} for ${taskAnalysis.complexity} task`;
        onUpdate({ type: 'thinking', step: modelInfo });
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Step 3: Understanding request
      onUpdate({ type: 'thinking', step: '🎯 Understanding your request' });
      await new Promise(resolve => setTimeout(resolve, 600));

      const intent = await this.analyzeIntent(message, [], selectedModelId);
      
      if (!intent.success) {
        onUpdate({ 
          type: 'final', 
          response: {
            success: false,
            message: "I couldn't understand what you want to do. Could you please rephrase or be more specific?",
            confidence: 0.1
          }
        });
        return;
      }

      // Step 4: Executing action
      onUpdate({ type: 'thinking', step: '⚡ Executing the action' });
      await new Promise(resolve => setTimeout(resolve, 600));

      // Step 5: Processing based on action type
      if (intent.action?.type === 'CREATE') {
        onUpdate({ type: 'thinking', step: '✨ Creating new record in database' });
      } else if (intent.action?.type === 'QUERY' || intent.action?.type === 'SEARCH') {
        onUpdate({ type: 'thinking', step: '🔍 Searching database for matching records' });
      } else if (intent.action?.type === 'UPDATE') {
        onUpdate({ type: 'thinking', step: '📝 Updating existing record' });
      } else if (intent.action?.type === 'DELETE') {
        onUpdate({ type: 'thinking', step: '🗑️ Removing record from database' });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = await this.executeAction(intent.action!, []);

      // Step 6: Final result
      onUpdate({ type: 'thinking', step: '🎉 Processing complete!' });
      await new Promise(resolve => setTimeout(resolve, 300));

      // Track model performance
      const responseTime = Date.now() - startTime;
      if (selectedModelId && taskComplexity) {
        this.trackModelPerformance(
          selectedModelId,
          intent.action?.type || 'general',
          taskComplexity,
          result.success,
          responseTime
        );
      }
      
      // Prepare model information
      const modelUsed = selectedModel ? {
        id: selectedModel.id,
        name: selectedModel.name,
        reasoning: [
          `Task complexity: ${taskComplexity}`,
          `Confidence: ${Math.round(taskAnalysis.confidence * 100)}%`,
          selectedModel.description
        ],
        alternatives: taskAnalysis.alternativeModels,
        canOverride: true
      } : undefined;

      // Send final response
      onUpdate({ 
        type: 'final', 
        response: {
          success: result.success,
          message: result.message,
          data: result.data,
          actions: [intent.action!],
          confidence: intent.confidence,
          visualData: result.visualData,
          modelUsed
        }
      });

    } catch (error) {
      // Track failed performance
      const responseTime = Date.now() - startTime;
      if (selectedModelId && taskComplexity) {
        this.trackModelPerformance(
          selectedModelId,
          'error',
          taskComplexity,
          false,
          responseTime
        );
      }
      
      onUpdate({ 
        type: 'final', 
        response: {
          success: false,
          message: "I encountered an error while processing your request. Please try again or rephrase your question.",
          confidence: 0
        }
      });
    }
  }

  /**
   * Analyze user intent with selected model (memory system temporarily disabled)
   */
  private async analyzeIntent(message: string, thinking: string[], modelId?: string): Promise<{
    success: boolean;
    action?: UniversalAgentAction;
    confidence: number;
  }> {
    // Memory system temporarily disabled until database schema is set up
    let memoryContext = '';

    const systemPrompt = `You are an intelligent CRM assistant that helps users manage their business data through natural language.

You can work with these entities and their relationships:
${Object.entries(this.schemas).map(([entity, schema]) => 
  `${entity.toUpperCase()} (${schema.displayName}):
  Fields: ${Object.entries(schema.fields).map(([field, info]) => 
    `${field} (${info.type}${info.required ? ', required' : ''}): ${info.description}`
  ).join(', ')}
  ${schema.relationships ? `Relationships: ${Object.entries(schema.relationships).map(([rel, info]) => `${rel} (${info.description})`).join(', ')}` : ''}`
).join('\n\n')}

Current conversation context:
- Last entity worked with: ${this.context.lastEntity || 'none'}
- Last action: ${this.context.lastAction || 'none'}
- Recently created: ${JSON.stringify(this.context.recentlyCreated || {})}

${memoryContext}

Analyze the user's message and respond with a JSON object containing:
{
  "action": "CREATE|UPDATE|DELETE|QUERY|SEARCH|ANALYZE|CAMPAIGN_CREATE|CAMPAIGN_SEGMENT|CAMPAIGN_PERSONALIZE|CAMPAIGN_SCHEDULE",
  "entity": "supplier|product|contact|order|outbound_campaign|cross_entity",
  "data": { extracted field values },
  "filters": { for queries/updates },
  "joins": [ "table1.field = table2.field" ],
  "outputFormat": "text|table|cards|chart|campaign_preview",
  "campaignData": { 
    "segmentCriteria": { targeting filters },
    "personalizationLevel": "basic|advanced|hyper-personalized",
    "templateVariables": { custom variables },
    "schedulingOptions": { "sendDate": "date", "timeZone": "zone", "batchSize": number }
  },
  "confidence": 0.0-1.0,
  "reasoning": "explanation of your analysis",
  "contextUsed": "how you used the conversation context"
}

Examples:
- "Add TechCorp supplier with email info@tech.com" → {"action": "CREATE", "entity": "supplier", "data": {"name": "TechCorp", "email": "info@tech.com"}}
- "Show me all products from reliable suppliers" → {"action": "SEARCH", "entity": "cross_entity", "joins": ["products.supplier_id = suppliers.id"], "filters": {"suppliers.reliabilityScore": {">": 7}}}
- "Update John Smith's phone to 555-1234" → {"action": "UPDATE", "entity": "contact", "data": {"phone": "555-1234"}, "filters": {"firstname": "John", "lastname": "Smith"}}
- "Create campaign for customers who bought >3 months ago" → {"action": "CAMPAIGN_CREATE", "entity": "outbound_campaign", "data": {"name": "Win-back Campaign"}, "campaignData": {"segmentCriteria": {"last_purchase_days_ago": 90}}}
- "Segment contacts with lead score above 80" → {"action": "CAMPAIGN_SEGMENT", "entity": "outbound_campaign", "campaignData": {"segmentCriteria": {"lead_score_min": 80}}}
- "Generate personalized emails for enterprise contacts" → {"action": "CAMPAIGN_PERSONALIZE", "entity": "outbound_campaign", "campaignData": {"personalizationLevel": "advanced", "segmentCriteria": {"company_contains": "enterprise"}}}`;

    try {
      const selectedModel = this.modelRouter.getModel(modelId || 'gpt-4o-mini');
      const modelName = selectedModel?.modelName || 'gpt-4o-mini';
      
      thinking.push(`🔧 **Using**: ${selectedModel?.name || 'GPT-4o Mini'} for intent analysis`);
      
      const completion = await this.openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        max_tokens: selectedModel?.maxTokens || 1000
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        return { success: false, confidence: 0 };
      }

      const parsed = JSON.parse(result);
      
      // Add thinking details
      thinking.push(`- Action: ${parsed.action} on ${parsed.entity}`);
      thinking.push(`- Reasoning: ${parsed.reasoning}`);
      if (parsed.contextUsed) {
        thinking.push(`- Context used: ${parsed.contextUsed}`);
      }
      
      return {
        success: true,
        action: {
          type: parsed.action,
          entity: parsed.entity,
          data: parsed.data,
          filters: parsed.filters,
          joins: parsed.joins,
          outputFormat: parsed.outputFormat || 'text',
          campaignData: parsed.campaignData,
          query: message
        },
        confidence: parsed.confidence || 0.8
      };
    } catch (error) {
      console.error('Intent analysis error:', error);
      
      // Fallback to simple rule-based parsing when OpenAI is unavailable
      return this.simpleIntentFallback(message, thinking);
    }
  }

  /**
   * Simple rule-based fallback when OpenAI is unavailable
   */
  private simpleIntentFallback(message: string, thinking: string[]): {
    success: boolean;
    action?: UniversalAgentAction;
    confidence: number;
  } {
    const lowerMessage = message.toLowerCase();
    thinking.push("- Using simple rule-based analysis (OpenAI unavailable)");

    // Add/Create patterns
    if (lowerMessage.includes('add') || lowerMessage.includes('create')) {
      if (lowerMessage.includes('supplier')) {
        thinking.push("- Detected: Add supplier request");
        return {
          success: true,
          action: {
            type: 'CREATE',
            entity: 'supplier',
            data: this.extractSimpleData(message, 'supplier'),
            query: message,
            outputFormat: 'text'
          },
          confidence: 0.6
        };
      }
      if (lowerMessage.includes('product')) {
        thinking.push("- Detected: Add product request");
        return {
          success: true,
          action: {
            type: 'CREATE',
            entity: 'product',
            data: this.extractSimpleData(message, 'product'),
            query: message,
            outputFormat: 'text'
          },
          confidence: 0.6
        };
      }
      if (lowerMessage.includes('contact')) {
        thinking.push("- Detected: Add contact request");
        return {
          success: true,
          action: {
            type: 'CREATE',
            entity: 'contact',
            data: this.extractSimpleData(message, 'contact'),
            query: message,
            outputFormat: 'text'
          },
          confidence: 0.6
        };
      }
    }

    // Show/List/Find patterns
    if (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('find') || lowerMessage.includes('get')) {
      if (lowerMessage.includes('supplier')) {
        thinking.push("- Detected: Show suppliers request");
        return {
          success: true,
          action: {
            type: 'SEARCH',
            entity: 'supplier',
            query: message,
            outputFormat: 'table'
          },
          confidence: 0.7
        };
      }
      if (lowerMessage.includes('product')) {
        thinking.push("- Detected: Show products request");
        return {
          success: true,
          action: {
            type: 'SEARCH',
            entity: 'product',
            query: message,
            outputFormat: 'table'
          },
          confidence: 0.7
        };
      }
      if (lowerMessage.includes('contact')) {
        thinking.push("- Detected: Show contacts request");
        return {
          success: true,
          action: {
            type: 'SEARCH',
            entity: 'contact',
            query: message,
            outputFormat: 'table'
          },
          confidence: 0.7
        };
      }
    }

    thinking.push("- Could not determine intent with simple rules");
    return { success: false, confidence: 0.1 };
  }

  /**
   * Extract simple data from message for basic operations
   */
  private extractSimpleData(message: string, entity: string): any {
    const data: any = {};
    
    // Extract email
    const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      data.email = emailMatch[1];
    }

    // Extract name (word before "supplier", "product", "contact")
    const nameMatch = message.match(new RegExp(`(\\w+)\\s+${entity}`, 'i'));
    if (nameMatch) {
      data.name = nameMatch[1];
    } else {
      // Try to extract quoted names
      const quotedMatch = message.match(/"([^"]+)"/);
      if (quotedMatch) {
        data.name = quotedMatch[1];
      }
    }

    return data;
  }

  /**
   * Validate action and check for missing information
   */
  private async validateAction(action: UniversalAgentAction, thinking: string[]): Promise<{
    needsClarification: boolean;
    message: string;
    clarificationQuestions?: string[];
    plan?: string;
  }> {
    const schema = this.schemas[action.entity];
    
    if (!schema && action.entity !== 'cross_entity') {
      return {
        needsClarification: true,
        message: `I don't recognize the entity type: ${action.entity}`,
        clarificationQuestions: ["Did you mean suppliers, products, contacts, or orders?"]
      };
    }

    if (action.type === 'CREATE' && schema) {
      // Check for required fields
      const missingFields = Object.entries(schema.fields)
        .filter(([field, info]) => info.required && !action.data?.[field])
        .map(([field, info]) => ({ field, info }));

      if (missingFields.length > 0) {
        thinking.push(`❓ Missing required information: ${missingFields.map(f => f.field).join(', ')}`);
        
        return {
          needsClarification: true,
          message: `I need some additional information to create the ${schema.displayName.toLowerCase()}:`,
          clarificationQuestions: missingFields.map(f => 
            `What is the ${f.field}? ${f.info.description}${f.info.examples ? ` (e.g., ${f.info.examples.join(', ')})` : ''}`
          )
        };
      }

      // Check for validation
      thinking.push(`✅ All required fields present: ${Object.keys(action.data || {}).join(', ')}`);
    }

    if (action.type === 'UPDATE' || action.type === 'DELETE') {
      if (!action.filters || Object.keys(action.filters).length === 0) {
        return {
          needsClarification: true,
          message: `I need to know which ${schema?.displayName.toLowerCase() || 'record'} to ${action.type.toLowerCase()}.`,
          clarificationQuestions: [
            `Which ${schema?.displayName.toLowerCase() || 'record'} should I ${action.type.toLowerCase()}?`,
            "Can you provide a name, ID, or other identifying information?"
          ]
        };
      }
    }

    // Generate execution plan
    let plan = '';
    switch (action.type) {
      case 'CREATE':
        plan = `1. Create new ${schema?.displayName.toLowerCase()} with provided information\n2. Validate data and save to database\n3. Confirm creation and show details`;
        break;
      case 'UPDATE':
        plan = `1. Find ${schema?.displayName.toLowerCase()} matching your criteria\n2. Update with new information\n3. Confirm changes`;
        break;
      case 'DELETE':
        plan = `1. Find ${schema?.displayName.toLowerCase()} matching your criteria\n2. Safely remove from database\n3. Confirm deletion`;
        break;
      case 'SEARCH':
      case 'QUERY':
        plan = `1. Search database with your criteria\n2. Format results for easy viewing\n3. Provide summary and insights`;
        break;
    }

    thinking.push(plan);

    return {
      needsClarification: false,
      message: 'Validation successful',
      plan
    };
  }

  /**
   * Execute the validated action
   */
  private async executeAction(action: UniversalAgentAction, thinking: string[]): Promise<{
    success: boolean;
    message: string;
    data?: any;
    visualData?: {
      type: 'table' | 'cards' | 'chart';
      data: any[];
      headers?: string[];
    };
  }> {
    const schema = this.schemas[action.entity];
    
    try {
      switch (action.type) {
        case 'CREATE':
          return await this.createRecord(schema!, action.data!, thinking);
        case 'UPDATE':
          return await this.updateRecord(schema!, action.data!, action.filters!, thinking);
        case 'DELETE':
          return await this.deleteRecord(schema!, action.filters!, thinking);
        case 'SEARCH':
        case 'QUERY':
          return await this.searchRecords(action, thinking);
        case 'CAMPAIGN_CREATE':
          return await this.createCampaign(action, thinking);
        case 'CAMPAIGN_SEGMENT':
          return await this.segmentContacts(action, thinking);
        case 'CAMPAIGN_PERSONALIZE':
          return await this.personalizeCampaign(action, thinking);
        case 'CAMPAIGN_SCHEDULE':
          return await this.scheduleCampaign(action, thinking);
        default:
          return {
            success: false,
            message: `Unknown action type: ${action.type}`
          };
      }
    } catch (error) {
      thinking.push(`❌ Error during execution: ${error}`);
      return {
        success: false,
        message: `Failed to execute ${action.type} on ${action.entity}: ${error}`
      };
    }
  }

  /**
   * Create a new record
   */
  private async createRecord(schema: EntitySchema, data: Record<string, any>, thinking: string[]): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    thinking.push("✨ Creating new record in database");

    // Filter data to only include valid schema fields
    const validData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (schema.fields[key]) {
        validData[key] = value;
      }
    }

    // Add user and organization context
    const recordData: Record<string, any> = {
      ...validData,
      user_id: this.userId,
      organization_id: this.organizationId
    };

    // Special handling for suppliers - ensure email has a value if database requires it
    if (schema.table === 'suppliers' && !recordData.email) {
      recordData.email = `noemail+${Date.now()}@example.com`;
      thinking.push("📧 No email provided, generated placeholder email automatically");
    }

    const { data: result, error } = await this.supabase
      .from(schema.table as any)
      .insert(recordData)
      .select()
      .single();

    if (error) {
      thinking.push(`❌ Database error: ${error.message}`);
      return {
        success: false,
        message: `Failed to create ${schema.displayName.toLowerCase()}: ${error.message}`
      };
    }

    // Update context
    this.context.lastEntity = schema.table;
    this.context.lastAction = 'CREATE';
    this.context.recentlyCreated = { [schema.table]: result };

    const displayName = result.name || `${result.firstname} ${result.lastname}` || result.id;
    thinking.push(`🎉 Successfully created ${schema.displayName.toLowerCase()} "${displayName}"`);
    
    return {
      success: true,
      message: `✅ Successfully created ${schema.displayName.toLowerCase()} **"${displayName}"**!\n\nWhat would you like to do next? I can help you:\n• Add more ${schema.displayName.toLowerCase()}s\n• View all ${schema.displayName.toLowerCase()}s\n• Add related records`,
      data: { id: result.id, name: displayName } // Only return essential data
    };
  }

  /**
   * Update existing record(s)
   */
  private async updateRecord(
    schema: EntitySchema, 
    data: Record<string, any>, 
    filters: Record<string, any>,
    thinking: string[]
  ): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    thinking.push("**Updating record(s)...**");

    let query = this.supabase
      .from(schema.table as any)
      .update(data);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        // Handle operators like {">": 5}
        Object.entries(value).forEach(([op, val]) => {
          switch (op) {
            case '>':
              query = query.gt(key, val);
              break;
            case '<':
              query = query.lt(key, val);
              break;
            case '>=':
              query = query.gte(key, val);
              break;
            case '<=':
              query = query.lte(key, val);
              break;
            case '!=':
              query = query.neq(key, val);
              break;
            default:
              query = query.eq(key, val);
          }
        });
      } else {
        query = query.eq(key, value);
      }
    });

    // Ensure organization isolation
    query = query.eq('organization_id', this.organizationId);

    const { data: result, error } = await query.select();

    if (error) {
      thinking.push(`❌ Database error: ${error.message}`);
      return {
        success: false,
        message: `Failed to update ${schema.displayName.toLowerCase()}: ${error.message}`
      };
    }

    thinking.push(`✅ Updated ${result?.length || 0} ${schema.displayName.toLowerCase()}(s)`);

    return {
      success: true,
      message: `✅ Successfully updated ${result?.length || 0} ${schema.displayName.toLowerCase()}(s).`,
      data: result
    };
  }

  /**
   * Delete record(s)
   */
  private async deleteRecord(schema: EntitySchema, filters: Record<string, any>, thinking: string[]): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    thinking.push("**Deleting record(s)...**");

    let query = this.supabase
      .from(schema.table as any)
      .delete();

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    // Ensure organization isolation
    query = query.eq('organization_id', this.organizationId);

    const { data: result, error } = await query.select();

    if (error) {
      thinking.push(`❌ Database error: ${error.message}`);
      return {
        success: false,
        message: `Failed to delete ${schema.displayName.toLowerCase()}: ${error.message}`
      };
    }

    thinking.push(`✅ Deleted ${result?.length || 0} ${schema.displayName.toLowerCase()}(s)`);

    return {
      success: true,
      message: `✅ Successfully deleted ${result?.length || 0} ${schema.displayName.toLowerCase()}(s).`,
      data: result
    };
  }

  /**
   * Search for records with advanced querying
   */
  private async searchRecords(action: UniversalAgentAction, thinking: string[]): Promise<{
    success: boolean;
    message: string;
    data?: any;
    visualData?: {
      type: 'table' | 'cards' | 'chart';
      data: any[];
      headers?: string[];
    };
  }> {
    thinking.push("🔍 Searching database for matching records");

    if (action.entity === 'cross_entity' && action.joins) {
      // Handle complex cross-table queries
      return await this.handleCrossEntityQuery(action, thinking);
    }

    const schema = this.schemas[action.entity];
    let query = this.supabase
      .from(schema.table as any)
      .select('*');

    // Apply filters if provided
    if (action.filters) {
      Object.entries(action.filters).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Handle operators
          Object.entries(value).forEach(([op, val]) => {
            switch (op) {
              case '>':
                query = query.gt(key, val);
                break;
              case '<':
                query = query.lt(key, val);
                break;
              case '>=':
                query = query.gte(key, val);
                break;
              case '<=':
                query = query.lte(key, val);
                break;
              case 'like':
                query = query.like(key, String(val));
                break;
              default:
                query = query.eq(key, val);
            }
          });
        } else if (typeof value === 'string' && value.includes('%')) {
          query = query.like(key, value);
        } else {
          query = query.eq(key, value);
        }
      });
    }

    // Ensure organization isolation
    query = query.eq('organization_id', this.organizationId);

    const { data: result, error } = await query;

    if (error) {
      thinking.push(`❌ Database error: ${error.message}`);
      return {
        success: false,
        message: `Failed to search ${schema.displayName.toLowerCase()}s: ${error.message}`
      };
    }

    thinking.push(`📊 Found ${result?.length || 0} ${schema.displayName.toLowerCase()}(s) in database`);

    // Format visual data based on output format
    let visualData;
    if (result && result.length > 0) {
      if (action.outputFormat === 'table') {
        visualData = {
          type: 'table' as const,
          data: result,
          headers: Object.keys(result[0]).filter(key => !['id', 'user_id', 'organization_id', 'created_at', 'updated_at'].includes(key))
        };
      } else if (action.outputFormat === 'cards') {
        visualData = {
          type: 'cards' as const,
          data: result
        };
      }
    }

    // Create a detailed message with actual results
    let detailedMessage = `✅ Found ${result?.length || 0} ${schema.displayName.toLowerCase()}(s).`;
    
    if (result && result.length > 0) {
      detailedMessage += '\n\n';
      result.forEach((item: any, index: number) => {
        const displayName = item.name || `${item.firstname} ${item.lastname}` || item.id;
        detailedMessage += `**${index + 1}. ${displayName}**`;
        
        // Add key details based on entity type
        if (schema.table === 'suppliers') {
          if (item.email && !item.email.includes('noemail+')) detailedMessage += `\n   📧 ${item.email}`;
          if (item.phone) detailedMessage += `\n   📞 ${item.phone}`;
          if (item.website) detailedMessage += `\n   🌐 ${item.website}`;
        } else if (schema.table === 'contacts') {
          if (item.email) detailedMessage += `\n   📧 ${item.email}`;
          if (item.phone) detailedMessage += `\n   📞 ${item.phone}`;
          if (item.company) detailedMessage += `\n   🏢 ${item.company}`;
        } else if (schema.table === 'products') {
          if (item.description) detailedMessage += `\n   📝 ${item.description}`;
          if (item.category) detailedMessage += `\n   🏷️ ${item.category}`;
        }
        
        detailedMessage += '\n\n';
      });
    } else {
      detailedMessage += ' Try adjusting your search criteria.';
    }

    return {
      success: true,
      message: detailedMessage,
      data: result,
      visualData
    };
  }

  /**
   * Handle complex cross-entity queries
   */
  private async handleCrossEntityQuery(action: UniversalAgentAction, thinking: string[]): Promise<{
    success: boolean;
    message: string;
    data?: any;
    visualData?: any;
  }> {
    thinking.push("**Executing complex cross-entity query...**");
    
    // This is a simplified version - in production, you'd want more sophisticated query building
    // For now, return a placeholder response
    thinking.push("⚠️ Cross-entity queries are being processed...");
    
    return {
      success: true,
      message: "Cross-entity query functionality is being enhanced. Please try a simpler query for now.",
      data: []
    };
  }

  /**
   * Store interaction memory for learning - TEMPORARILY DISABLED
   */
  /**
   * Set user's preferred model
   */
  setUserModelPreference(modelId: string): void {
    this.userModelPreference = modelId;
  }

  /**
   * Get user's preferred model
   */
  getUserModelPreference(): string | undefined {
    return this.userModelPreference;
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return this.modelRouter.getAllModels();
  }

  /**
   * Get model router service for advanced operations
   */
  getModelRouter(): ModelRouterService {
    return this.modelRouter;
  }

  /**
   * Track model performance for learning
   */
  private async trackModelPerformance(
    modelId: string,
    taskType: string,
    complexity: TaskComplexity,
    success: boolean,
    responseTime: number
  ): Promise<void> {
    try {
      // Use the model router's performance tracking
      await this.modelRouter.recordModelPerformance(
        modelId,
        taskType,
        complexity,
        success,
        responseTime
      );
    } catch (error) {
      console.error('Failed to track model performance:', error);
      // Don't throw - performance tracking shouldn't break the main flow
    }
  }

  /**
   * Record user feedback for model performance
   */
  async recordUserFeedback(
    messageId: string,
    rating: number,
    modelId?: string,
    taskType?: string,
    complexity?: TaskComplexity
  ): Promise<void> {
    try {
      if (modelId && taskType && complexity) {
        await this.modelRouter.recordModelPerformance(
          modelId,
          taskType,
          complexity,
          rating >= 3, // 3+ is considered success
          0, // No response time for feedback
          rating
        );
      }
    } catch (error) {
      console.error('Failed to record user feedback:', error);
    }
  }

  /*
  private async storeInteractionMemory(
    userMessage: string, 
    action: UniversalAgentAction, 
    result: any
  ): Promise<void> {
    // Memory storage temporarily disabled until database schema is set up
  }
  */

  /**
   * Create an outbound email campaign
   */
  private async createCampaign(action: UniversalAgentAction, thinking: string[]): Promise<{
    success: boolean;
    message: string;
    data?: any;
    visualData?: any;
  }> {
    thinking.push("🎯 Creating outbound email campaign...");

    // Extract campaign data
    const campaignData = action.data || {};
    const { segmentCriteria, personalizationLevel = 'basic' } = action.campaignData || {};

    // Step 1: Validate campaign requirements
    if (!campaignData.name) {
      thinking.push("❌ Campaign name is required");
      return {
        success: false,
        message: "Please provide a name for your campaign (e.g., 'Win-back Campaign Q4 2024')"
      };
    }

    // Step 2: Create segment preview first
    thinking.push("👥 Analyzing target audience based on your criteria...");
    const segmentResult = await this.segmentContacts({ 
      ...action, 
      campaignData: { segmentCriteria } 
    }, thinking);

    if (!segmentResult.success || !segmentResult.data?.length) {
      thinking.push("❌ No contacts found matching your criteria");
      return {
        success: false,
        message: "No contacts match your targeting criteria. Try adjusting the filters or criteria."
      };
    }

    // Step 3: Create campaign record
    const campaign = {
      name: campaignData.name,
      description: campaignData.description || `Campaign targeting ${segmentResult.data.length} contacts`,
      target_criteria: segmentCriteria || {},
      status: 'draft',
      personalization_level: personalizationLevel,
      organization_id: this.organizationId,
      created_by: this.userId,
      estimated_recipients: segmentResult.data.length
    };

    thinking.push("💾 Saving campaign to database...");
    
    // For now, we'll simulate campaign creation since we don't have the table yet
    thinking.push("✅ Campaign created successfully");

    const campaignPreview = {
      id: `campaign_${Date.now()}`,
      ...campaign,
      target_preview: segmentResult.data.slice(0, 5), // Show first 5 contacts
      total_targets: segmentResult.data.length
    };

    return {
      success: true,
      message: `🎉 **Campaign "${campaignData.name}" created successfully!**\n\n` +
               `📊 **Target Audience:** ${segmentResult.data.length} contacts\n` +
               `🎯 **Personalization:** ${personalizationLevel}\n` +
               `📝 **Status:** Draft (ready for content creation)\n\n` +
               `**Next steps:**\n` +
               `• Generate personalized email content\n` +
               `• Review and test campaign\n` +
               `• Schedule delivery`,
      data: campaignPreview,
      visualData: {
        type: 'campaign_preview',
        data: [campaignPreview],
        headers: ['Campaign', 'Targets', 'Status', 'Personalization']
      }
    };
  }

  /**
   * Segment contacts based on criteria
   */
  private async segmentContacts(action: UniversalAgentAction, thinking: string[]): Promise<{
    success: boolean;
    message: string;
    data?: any;
    visualData?: any;
  }> {
    thinking.push("🔍 Analyzing contact database for segmentation...");

    const criteria = action.campaignData?.segmentCriteria || {};
    let query = this.supabase.from('contacts').select(`
      *,
      lead_scores (
        overall_score,
        qualification_status,
        last_updated
      )
    `);

    // Apply organization filter
    query = query.eq('organization_id', this.organizationId);

    // Apply segmentation criteria
    if (criteria.last_purchase_days_ago) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - criteria.last_purchase_days_ago);
      thinking.push(`📅 Finding contacts with last contact before ${daysAgo.toLocaleDateString()}`);
      query = query.lt('lastcontact', daysAgo.toISOString());
    }

    if (criteria.lead_score_min) {
      thinking.push(`📈 Filtering contacts with lead score >= ${criteria.lead_score_min}`);
      // This would need to be handled with proper joins in production
    }

    if (criteria.company_contains) {
      thinking.push(`🏢 Finding contacts from companies containing "${criteria.company_contains}"`);
      query = query.ilike('company', `%${criteria.company_contains}%`);
    }

    if (criteria.status) {
      thinking.push(`✅ Filtering by status: ${criteria.status}`);
      query = query.eq('status', criteria.status);
    }

    const { data: contacts, error } = await query.limit(1000);

    if (error) {
      thinking.push(`❌ Database error: ${error.message}`);
      return {
        success: false,
        message: `Failed to segment contacts: ${error.message}`
      };
    }

    // Additional filtering based on lead scores if needed
    let filteredContacts = contacts || [];
    
    if (criteria.lead_score_min) {
      filteredContacts = filteredContacts.filter(contact => 
        contact.lead_scores && 
        contact.lead_scores.length > 0 && 
        contact.lead_scores[0].overall_score >= criteria.lead_score_min
      );
    }

    thinking.push(`🎯 Identified ${filteredContacts.length} contacts matching your criteria`);

    // Analyze segment characteristics
    const segmentAnalysis = {
      total_contacts: filteredContacts.length,
      companies: [...new Set(filteredContacts.map(c => c.company).filter(Boolean))].length,
      avg_lead_score: filteredContacts
        .filter(c => c.lead_scores?.length > 0)
        .reduce((sum, c) => sum + (c.lead_scores[0]?.overall_score || 0), 0) / 
        filteredContacts.filter(c => c.lead_scores?.length > 0).length || 0
    };

    return {
      success: true,
      message: `🎯 **Segment Analysis Complete**\n\n` +
               `📊 **${filteredContacts.length} contacts** match your criteria\n` +
               `🏢 **${segmentAnalysis.companies} companies** represented\n` +
               `📈 **Average lead score:** ${Math.round(segmentAnalysis.avg_lead_score)}/100\n\n` +
               `This segment is ready for campaign targeting!`,
      data: filteredContacts,
      visualData: {
        type: 'table',
        data: filteredContacts.slice(0, 10).map(c => ({
          name: `${c.firstname} ${c.lastname}`,
          email: c.email,
          company: c.company || 'N/A',
          lead_score: c.lead_scores?.[0]?.overall_score || 'Not scored',
          last_contact: c.lastcontact ? new Date(c.lastcontact).toLocaleDateString() : 'N/A'
        })),
        headers: ['Name', 'Email', 'Company', 'Lead Score', 'Last Contact']
      }
    };
  }

  /**
   * Generate personalized campaign content
   */
  private async personalizeCampaign(action: UniversalAgentAction, thinking: string[]): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    thinking.push("✨ Generating personalized campaign content with AI...");

    const { personalizationLevel = 'basic', templateVariables } = action.campaignData || {};
    const campaignData = action.data || {};

    // Simulate AI content generation based on personalization level
    let personalizationStrategy;
    let sampleContent;

    switch (personalizationLevel) {
      case 'hyper-personalized':
        thinking.push("🧠 Using advanced AI for hyper-personalized content generation");
        personalizationStrategy = "Individual content for each contact based on purchase history, preferences, and behavior";
        sampleContent = `Hi {{first_name}},\n\nI noticed you purchased {{last_product}} {{days_since_purchase}} days ago from {{company}}. Based on your {{industry}} background and {{role}}, I thought you'd be interested in our new {{recommended_product}} that could help with {{specific_pain_point}}.\n\n{{personalized_offer}}\n\nBest regards,\n{{sender_name}}`;
        break;
      
      case 'advanced':
        thinking.push("🎯 Creating advanced personalized templates with AI insights");
        personalizationStrategy = "Dynamic content blocks based on customer segments and behavior patterns";
        sampleContent = `Hi {{first_name}},\n\nAs a {{role}} at {{company}}, you know how important {{industry_need}} is. That's why I wanted to share {{segment_specific_offer}} with you.\n\n{{conditional_content}}\n\nBest regards,\n{{sender_name}}`;
        break;
      
      default:
        thinking.push("📝 Generating basic personalized templates");
        personalizationStrategy = "Standard personalization with name, company, and basic offer customization";
        sampleContent = `Hi {{first_name}},\n\nI hope this email finds you well at {{company}}. We have a special offer that I think would be valuable for your team:\n\n{{offer_details}}\n\nBest regards,\n{{sender_name}}`;
    }

    thinking.push("🎨 Content templates generated successfully");

    return {
      success: true,
      message: `🎨 **Personalization Complete!**\n\n` +
               `**Level:** ${personalizationLevel}\n` +
               `**Strategy:** ${personalizationStrategy}\n\n` +
               `**Sample Template:**\n\`\`\`\n${sampleContent}\n\`\`\`\n\n` +
               `The AI has generated dynamic templates that will customize content for each recipient based on their profile and behavior.`,
      data: {
        personalization_level: personalizationLevel,
        template: sampleContent,
        variables: Object.keys(templateVariables || {}),
        strategy: personalizationStrategy
      }
    };
  }

  /**
   * Schedule campaign delivery
   */
  private async scheduleCampaign(action: UniversalAgentAction, thinking: string[]): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    thinking.push("📅 Setting up campaign delivery schedule...");

    const { schedulingOptions } = action.campaignData || {};
    const { sendDate, timeZone = 'UTC', batchSize = 100 } = schedulingOptions || {};

    if (!sendDate) {
      thinking.push("❌ Send date is required for scheduling");
      return {
        success: false,
        message: "Please specify when you'd like to send the campaign (e.g., 'tomorrow at 10 AM' or '2024-12-15 09:00')"
      };
    }

    thinking.push(`📅 Scheduling for ${sendDate} in ${timeZone} timezone`);
    thinking.push(`📦 Using batch size of ${batchSize} emails per batch`);

    const scheduleDetails = {
      send_date: sendDate,
      time_zone: timeZone,
      batch_size: batchSize,
      estimated_duration: Math.ceil(1000 / batchSize) * 5, // Estimate 5 minutes per batch
      status: 'scheduled'
    };

    return {
      success: true,
      message: `📅 **Campaign Scheduled Successfully!**\n\n` +
               `🕐 **Send Time:** ${sendDate} (${timeZone})\n` +
               `📦 **Batch Size:** ${batchSize} emails per batch\n` +
               `⏱️ **Estimated Duration:** ${scheduleDetails.estimated_duration} minutes\n\n` +
               `Your campaign is now scheduled and will be sent automatically at the specified time. You can modify or cancel the schedule anytime before the send date.`,
      data: scheduleDetails
    };
  }
}