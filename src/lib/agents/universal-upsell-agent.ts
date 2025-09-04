/**
 * Universal Upsell Agent
 * 
 * Provides intelligent upselling capabilities for all businesses, not just automotive.
 * Learns from email patterns and provides context-aware product recommendations.
 */

import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { OrganizationSettingsService, UpsellingFrameworkConfig } from '@/lib/services/organization-settings-service';
import { EmailLearningService } from '@/lib/email/email-learning-service';
import { getMetakockaDataForAIContext } from '@/lib/integrations/metakocka/metakocka-ai-integration';
import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface UpsellOpportunity {
  id: string;
  source_product: {
    id?: string;
    name: string;
    keywords: string[];
  };
  target_product: {
    id?: string;
    name: string;
    keywords: string[];
    price?: number;
    discount_price?: number;
  };
  relationship_type: 'complementary' | 'premium' | 'accessory' | 'bundle';
  confidence_score: number;
  reasoning: string;
  offer_strategy: 'full_price' | 'discount' | 'bundle';
  discount_percent?: number;
  context: {
    customer_history?: any;
    email_context: string;
    previous_rejections?: number;
    learned_from_pattern?: string;
  };
}

export interface UpsellContext {
  email_content: string;
  email_subject: string;
  customer_id?: string;
  organization_id: string;
  user_id: string;
  conversation_history?: Array<{
    content: string;
    sender: 'customer' | 'agent';
    timestamp: string;
    contained_rejections?: boolean;
    contained_price_inquiry?: boolean;
  }>;
}

export class UniversalUpsellAgent {
  private openai: OpenAI;
  private settingsService: OrganizationSettingsService;
  private emailLearningService: EmailLearningService;
  private supabase: ReturnType<typeof createLazyServerClient>;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.settingsService = new OrganizationSettingsService();
    this.emailLearningService = new EmailLearningService();
    this.supabase = createLazyServerClient();
  }

  // Helper method to get the awaited Supabase client
  private async getSupabase(): Promise<SupabaseClient> {
    return await this.supabase;
  }

  /**
   * Generate upsell opportunities based on email context
   */
  async generateUpsellOpportunities(context: UpsellContext): Promise<UpsellOpportunity[]> {
    console.log(`[Universal Upsell Agent] Analyzing email for upsell opportunities`);

    try {
      // Get organization upsell configuration
      const config = await this.settingsService.getUpsellingFrameworkConfig(context.organization_id);
      
      if (!config?.enabled) {
        console.log(`[Universal Upsell Agent] Upselling disabled for organization ${context.organization_id}`);
        return [];
      }

      // Extract mentioned products from email
      const mentionedProducts = await this.extractProductMentions(
        context.email_content + ' ' + context.email_subject,
        context.organization_id
      );

      if (mentionedProducts.length === 0) {
        console.log(`[Universal Upsell Agent] No products mentioned in email`);
        return [];
      }

      // Find upsell opportunities for each mentioned product
      const opportunities: UpsellOpportunity[] = [];
      
      for (const product of mentionedProducts) {
        const productOpportunities = await this.findUpsellsForProduct(
          product,
          config,
          context
        );
        opportunities.push(...productOpportunities);
      }

      // Rank and limit opportunities
      const rankedOpportunities = this.rankOpportunities(opportunities, config.max_suggestions);
      
      console.log(`[Universal Upsell Agent] Found ${rankedOpportunities.length} upsell opportunities`);
      return rankedOpportunities;

    } catch (error) {
      console.error('[Universal Upsell Agent] Error generating upsell opportunities:', error);
      return [];
    }
  }

  /**
   * Extract product mentions from email content using AI
   */
  private async extractProductMentions(
    content: string,
    organizationId: string
  ): Promise<Array<{ name: string; keywords: string[]; context: string }>> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at identifying product mentions in customer emails. 
            
            Extract all products, services, or items mentioned in the email content. For each product:
            1. Identify the main product name
            2. List relevant keywords and variations
            3. Provide the context in which it was mentioned
            
            Return a JSON array of objects with this structure:
            {
              "name": "product name",
              "keywords": ["keyword1", "keyword2", "variation1"],
              "context": "the sentence or phrase where it was mentioned"
            }
            
            Examples:
            - "car mats" -> {"name": "car floor mats", "keywords": ["car mats", "floor mats", "automotive mats"], "context": "..."}
            - "iPhone case" -> {"name": "iPhone protective case", "keywords": ["iPhone case", "phone case", "mobile case"], "context": "..."}
            - "running shoes" -> {"name": "athletic running shoes", "keywords": ["running shoes", "athletic shoes", "sneakers"], "context": "..."}
            `
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const responseText = response.choices[0].message.content;
      if (!responseText) return [];

      try {
        const products = JSON.parse(responseText);
        return Array.isArray(products) ? products : [];
      } catch (parseError) {
        console.warn('[Universal Upsell Agent] Failed to parse product extraction response');
        return [];
      }

    } catch (error) {
      console.error('[Universal Upsell Agent] Error extracting product mentions:', error);
      return [];
    }
  }

  /**
   * Find upsell opportunities for a specific product
   */
  private async findUpsellsForProduct(
    product: { name: string; keywords: string[]; context: string },
    config: UpsellingFrameworkConfig,
    context: UpsellContext
  ): Promise<UpsellOpportunity[]> {
    const opportunities: UpsellOpportunity[] = [];

    // 1. Check configured product relationships
    const configuredUpsells = await this.findConfiguredUpsells(product, config, context);
    opportunities.push(...configuredUpsells);

    // 2. Check email learning patterns
    if (config.email_learning?.enabled) {
      const learnedUpsells = await this.findLearnedUpsells(product, context);
      opportunities.push(...learnedUpsells);
    }

    // 3. Generate AI-powered suggestions
    const aiUpsells = await this.generateAIUpsells(product, context, config);
    opportunities.push(...aiUpsells);

    return opportunities;
  }

  /**
   * Find upsells based on configured product relationships and real product catalog
   */
  private async findConfiguredUpsells(
    product: { name: string; keywords: string[]; context: string },
    config: UpsellingFrameworkConfig,
    context: UpsellContext
  ): Promise<UpsellOpportunity[]> {
    const opportunities: UpsellOpportunity[] = [];

    // Get real product catalog from Metakocka if available
    let availableProducts: any[] = [];
    try {
      const metakockaData = await getMetakockaDataForAIContext(context.user_id);
      availableProducts = metakockaData?.products || [];
    } catch (error) {
      console.log('[Universal Upsell Agent] No Metakocka data available, using configured relationships only');
    }

    for (const relationship of config.product_relationships || []) {
      // Check if any source keywords match the mentioned product
      const keywordMatch = relationship.source_product_keywords.some(keyword =>
        product.keywords.some(productKeyword => 
          productKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(productKeyword.toLowerCase())
        )
      );

      if (keywordMatch && relationship.confidence_score >= config.min_confidence) {
        let targetProduct = {
          id: relationship.target_product_id,
          name: relationship.target_product_keywords.join(' '),
          keywords: relationship.target_product_keywords,
          price: undefined as number | undefined,
          availability: undefined as any
        };

        // If we have real product data, try to find the actual product
        if (availableProducts.length > 0 && relationship.target_product_id) {
          const realProduct = availableProducts.find(p => 
            p.id === relationship.target_product_id ||
            p.code === relationship.target_product_id ||
            relationship.target_product_keywords.some(keyword =>
              p.name?.toLowerCase().includes(keyword.toLowerCase())
            )
          );

          if (realProduct) {
            targetProduct = {
              id: realProduct.id,
              name: realProduct.name,
              keywords: relationship.target_product_keywords,
              price: realProduct.sales_price || realProduct.price,
              availability: {
                inStock: realProduct.amount > 0,
                quantity: realProduct.amount,
                status: realProduct.status
              }
            };
          }
        }

        opportunities.push({
          id: `config-${relationship.id}`,
          source_product: {
            name: product.name,
            keywords: product.keywords
          },
          target_product: targetProduct,
          relationship_type: relationship.relationship_type,
          confidence_score: relationship.confidence_score,
          reasoning: `Configured relationship: ${product.name} → ${targetProduct.name}`,
          offer_strategy: 'full_price',
          context: {
            email_context: product.context
          }
        });
      }
    }

    return opportunities;
  }

  /**
   * Find upsells based on learned email patterns
   */
  private async findLearnedUpsells(
    product: { name: string; keywords: string[]; context: string },
    context: UpsellContext
  ): Promise<UpsellOpportunity[]> {
    try {
      const supabase = await this.supabase;
      
      // Query email learning patterns for upselling-related patterns
      const { data: patterns, error } = await supabase
        .from('email_learning_patterns')
        .select('*')
        .eq('user_id', context.user_id)
        .or('context_category.eq.sales_request,context_category.eq.product_inquiry')
        .gte('confidence_score', 0.6)
        .order('confidence_score', { ascending: false })
        .limit(10);

      if (error || !patterns || patterns.length === 0) {
        return [];
      }

      const opportunities: UpsellOpportunity[] = [];

      // Analyze patterns to find product relationship mentions
      for (const pattern of patterns) {
        const relationshipFound = await this.analyzePatternForProductRelationships(
          pattern,
          product,
          context
        );
        
        if (relationshipFound) {
          opportunities.push(relationshipFound);
        }
      }

      return opportunities;

    } catch (error) {
      console.error('[Universal Upsell Agent] Error finding learned upsells:', error);
      return [];
    }
  }

  /**
   * Analyze an email learning pattern for product relationships
   */
  private async analyzePatternForProductRelationships(
    pattern: any,
    sourceProduct: { name: string; keywords: string[]; context: string },
    context: UpsellContext
  ): Promise<UpsellOpportunity | null> {
    try {
      // Check if the pattern contains mentions of products that could be upsells
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are analyzing email patterns to discover product upselling relationships.

            Look at the email response template and determine if it mentions any products that could be upsells for the given source product.

            Return a JSON object with this structure if an upsell relationship is found, or null if none:
            {
              "found_relationship": true/false,
              "target_product_name": "name of the upsell product mentioned",
              "target_product_keywords": ["keyword1", "keyword2"],
              "relationship_type": "complementary|premium|accessory|bundle",
              "confidence_score": 0.8,
              "reasoning": "why this is an upsell relationship"
            }`
          },
          {
            role: 'user',
            content: `Source product: "${sourceProduct.name}" (keywords: ${sourceProduct.keywords.join(', ')})

            Email pattern context: ${pattern.context_category}
            Email response template: "${pattern.response_template}"
            
            Pattern trigger keywords: ${pattern.trigger_keywords?.join(', ') || 'none'}
            
            Does this pattern suggest any upselling opportunities for the source product?`
          }
        ],
        temperature: 0.1,
        max_tokens: 400
      });

      const responseText = response.choices[0].message.content;
      if (!responseText) return null;

      const analysis = JSON.parse(responseText);
      
      if (analysis.found_relationship && analysis.target_product_name) {
        return {
          id: `learned-${pattern.id}`,
          source_product: {
            name: sourceProduct.name,
            keywords: sourceProduct.keywords
          },
          target_product: {
            name: analysis.target_product_name,
            keywords: analysis.target_product_keywords || []
          },
          relationship_type: analysis.relationship_type,
          confidence_score: Math.min(analysis.confidence_score, pattern.confidence_score),
          reasoning: `Learned from email pattern: ${analysis.reasoning}`,
          offer_strategy: 'full_price',
          context: {
            email_context: sourceProduct.context,
            learned_from_pattern: pattern.id
          }
        };
      }

      return null;

    } catch (error) {
      console.error('[Universal Upsell Agent] Error analyzing pattern for relationships:', error);
      return null;
    }
  }

  /**
   * Generate AI-powered upsell suggestions using real product catalog when available
   */
  private async generateAIUpsells(
    product: { name: string; keywords: string[]; context: string },
    context: UpsellContext,
    config: UpsellingFrameworkConfig
  ): Promise<UpsellOpportunity[]> {
    try {
      // Get real product catalog from Metakocka if available
      let availableProducts: any[] = [];
      let productCatalogContext = '';
      
      try {
        const metakockaData = await getMetakockaDataForAIContext(context.user_id);
        availableProducts = metakockaData?.products || [];
        
        if (availableProducts.length > 0) {
          // Create a context of available products for AI to choose from
          productCatalogContext = `\n\nAvailable products in catalog:\n${availableProducts.slice(0, 50).map(p => 
            `- ${p.name} (${p.code}) - €${p.sales_price || p.price || 'N/A'} - Stock: ${p.amount || 0}`
          ).join('\n')}`;
        }
      } catch (error) {
        console.log('[Universal Upsell Agent] No Metakocka data available for AI upsells');
      }

      const systemPrompt = availableProducts.length > 0 
        ? `You are an expert sales consultant with access to a real product catalog. Given a product that a customer is interested in, suggest complementary products from the available catalog.

        IMPORTANT: Only suggest products that are actually available in the catalog provided below. Use the exact product names and codes from the catalog.

        Consider these relationship types:
        - complementary: Products that work well together
        - premium: Higher-end versions of the same product
        - accessory: Add-ons or accessories for the main product  
        - bundle: Items commonly bought together

        Return a JSON array with this structure:
        {
          "target_product_id": "product code from catalog",
          "target_product_name": "exact product name from catalog",
          "target_product_keywords": ["keyword1", "keyword2"],
          "relationship_type": "complementary|premium|accessory|bundle",
          "confidence_score": 0.8,
          "reasoning": "why this upsell makes sense",
          "price": product_price_from_catalog
        }`
        : `You are an expert sales consultant. Given a product that a customer is interested in, suggest complementary products they might also need.

        Consider these relationship types:
        - complementary: Products that work well together
        - premium: Higher-end versions of the same product
        - accessory: Add-ons or accessories for the main product  
        - bundle: Items commonly bought together

        Return a JSON array with this structure:
        {
          "target_product_name": "suggested product name",
          "target_product_keywords": ["keyword1", "keyword2"],
          "relationship_type": "complementary|premium|accessory|bundle",
          "confidence_score": 0.8,
          "reasoning": "why this upsell makes sense"
        }`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt + productCatalogContext
          },
          {
            role: 'user',
            content: `Customer mentioned: "${product.name}" in this context: "${product.context}"
            
            Email context: "${context.email_content}"
            
            ${availableProducts.length > 0 
              ? 'Suggest 2-3 relevant products from the catalog that would complement this purchase.' 
              : 'Suggest 2-3 relevant upsell opportunities.'
            }`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const responseText = response.choices[0].message.content;
      if (!responseText) return [];

      try {
        const suggestions = JSON.parse(responseText);
        if (!Array.isArray(suggestions)) return [];

        return suggestions.map((suggestion: any, index: number) => {
          // If we have real product data, find the actual product for additional details
          let targetProduct = {
            id: suggestion.target_product_id,
            name: suggestion.target_product_name,
            keywords: suggestion.target_product_keywords || [],
            price: suggestion.price,
            availability: undefined as any
          };

          if (availableProducts.length > 0 && suggestion.target_product_id) {
            const realProduct = availableProducts.find(p => 
              p.code === suggestion.target_product_id || 
              p.id === suggestion.target_product_id
            );

            if (realProduct) {
              targetProduct = {
                id: realProduct.code || realProduct.id,
                name: realProduct.name,
                keywords: suggestion.target_product_keywords || [],
                price: realProduct.sales_price || realProduct.price,
                availability: {
                  inStock: realProduct.amount > 0,
                  quantity: realProduct.amount,
                  status: realProduct.status
                }
              };
            }
          }

          return {
            id: `ai-${Date.now()}-${index}`,
            source_product: {
              name: product.name,
              keywords: product.keywords
            },
            target_product: targetProduct,
            relationship_type: suggestion.relationship_type,
            confidence_score: suggestion.confidence_score || 0.7,
            reasoning: suggestion.reasoning,
            offer_strategy: 'full_price',
            context: {
              email_context: product.context
            }
          };
        });

      } catch (parseError) {
        console.warn('[Universal Upsell Agent] Failed to parse AI upsell response');
        return [];
      }

    } catch (error) {
      console.error('[Universal Upsell Agent] Error generating AI upsells:', error);
      return [];
    }
  }

  /**
   * Apply discount strategy based on customer context
   */
  async applyDiscountStrategy(
    opportunities: UpsellOpportunity[],
    context: UpsellContext,
    config: UpsellingFrameworkConfig
  ): Promise<UpsellOpportunity[]> {
    if (!config.discount_strategy?.enabled) {
      return opportunities;
    }

    // Analyze conversation history for rejection patterns
    const rejectionCount = this.countRejections(context.conversation_history);
    const hasPriceInquiry = this.hasPriceInquiry(context.conversation_history);

    return opportunities.map(opportunity => {
      let shouldOfferDiscount = false;
      let discountPercent = 0;

      // Check escalation steps
      for (const step of config.discount_strategy.escalation_steps) {
        if (step.trigger === 'rejection' && rejectionCount >= step.step) {
          shouldOfferDiscount = true;
          discountPercent = Math.min(step.discount_percent, config.discount_strategy.max_discount_percent);
        } else if (step.trigger === 'price_inquiry' && hasPriceInquiry) {
          shouldOfferDiscount = true;
          discountPercent = Math.min(step.discount_percent, config.discount_strategy.max_discount_percent);
        }
      }

      if (shouldOfferDiscount) {
        return {
          ...opportunity,
          offer_strategy: 'discount' as const,
          discount_percent: discountPercent,
          context: {
            ...opportunity.context,
            previous_rejections: rejectionCount
          }
        };
      }

      return opportunity;
    });
  }

  /**
   * Rank opportunities by confidence and relevance
   */
  private rankOpportunities(opportunities: UpsellOpportunity[], maxSuggestions: number): UpsellOpportunity[] {
    return opportunities
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, maxSuggestions);
  }

  /**
   * Count rejection patterns in conversation history
   */
  private countRejections(history?: Array<any>): number {
    if (!history) return 0;
    
    return history.filter(message => 
      message.sender === 'customer' && message.contained_rejections
    ).length;
  }

  /**
   * Check if conversation contains price inquiries
   */
  private hasPriceInquiry(history?: Array<any>): boolean {
    if (!history) return false;
    
    return history.some(message => 
      message.sender === 'customer' && message.contained_price_inquiry
    );
  }
}
