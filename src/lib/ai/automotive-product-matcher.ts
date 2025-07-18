/**
 * Automotive Product Matcher
 * 
 * Service for matching customer car specifications with appropriate products
 * Specifically designed for Withcar's automotive parts and accessories business
 */

import { OrganizationSettingsService, AutomotiveMatchingConfig } from '@/lib/services/organization-settings-service';
import { getMetakockaDataForAIContext } from '@/lib/integrations/metakocka/metakocka-ai-integration';
import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import OpenAI from 'openai';

export interface CarSpecification {
  brand: string;
  model: string;
  year: number;
  variant?: string;
  fuelType?: string;
  bodyType?: string;
  engine?: string;
}

export interface ProductMatch {
  productId: string;
  productName: string;
  productCode?: string;
  compatibility: {
    brand: string;
    models: string[];
    years: number[];
    variants?: string[];
  };
  matchScore: number;
  matchReason: string;
  category: string;
  price?: number;
  availability?: {
    inStock: boolean;
    quantity?: number;
    estimatedDelivery?: string;
  };
  images?: string[];
  specifications?: Record<string, any>;
}

export interface AutomotiveMatchingResult {
  carSpecification: CarSpecification;
  matches: ProductMatch[];
  suggestions: {
    exactMatches: ProductMatch[];
    compatibleMatches: ProductMatch[];
    alternativeMatches: ProductMatch[];
  };
  confidence: number;
  reasoning: string;
  upsellOpportunities: ProductMatch[];
}

export class AutomotiveProductMatcher {
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
   * Match products based on car specifications and customer query
   */
  async matchProducts(
    carSpec: CarSpecification,
    customerQuery: string,
    organizationId: string,
    userId: string,
    maxResults: number = 10
  ): Promise<AutomotiveMatchingResult> {
    console.log(`[Automotive Matcher] Matching products for ${carSpec.brand} ${carSpec.model} ${carSpec.year}`);

    try {
      // Get automotive matching configuration
      const config = await this.settingsService.getAutomotiveMatchingConfig(organizationId);
      
      if (!config?.enabled) {
        throw new Error('Automotive matching is not enabled for this organization');
      }

      // Extract product category from customer query
      const requestedCategory = this.extractProductCategory(customerQuery, config);

      // Get available products from Metakocka
      const metakockaData = await getMetakockaDataForAIContext(userId);
      const availableProducts = metakockaData?.products || [];

      // Perform AI-powered matching
      const aiMatches = await this.performAIMatching(
        carSpec,
        customerQuery,
        requestedCategory,
        availableProducts,
        config
      );

      // Enhance matches with additional data
      const enhancedMatches = await this.enhanceMatches(aiMatches, organizationId);

      // Generate upsell opportunities
      const upsellOpportunities = await this.generateUpsellOpportunities(
        enhancedMatches,
        carSpec,
        organizationId
      );

      // Categorize matches
      const categorizedMatches = this.categorizeMatches(enhancedMatches, carSpec);

      const result: AutomotiveMatchingResult = {
        carSpecification: carSpec,
        matches: enhancedMatches.slice(0, maxResults),
        suggestions: categorizedMatches,
        confidence: this.calculateOverallConfidence(enhancedMatches),
        reasoning: this.generateReasoningExplanation(carSpec, enhancedMatches, requestedCategory),
        upsellOpportunities
      };

      console.log(`[Automotive Matcher] Found ${enhancedMatches.length} matches with ${result.confidence} confidence`);
      return result;

    } catch (error) {
      console.error('[Automotive Matcher] Error matching products:', error);
      throw error;
    }
  }

  /**
   * Extract car specifications from natural language query
   */
  async extractCarSpecifications(
    query: string,
    organizationId: string
  ): Promise<CarSpecification[]> {
    console.log(`[Automotive Matcher] Extracting car specifications from: "${query}"`);

    try {
      const config = await this.settingsService.getAutomotiveMatchingConfig(organizationId);
      
      const extractionPrompt = `Extract car specifications from the following text:
"${query}"

Look for:
- Car brand (supported: ${config?.supported_brands?.join(', ')})
- Car model
- Year (range: ${config?.year_range?.min}-${config?.year_range?.max})
- Variant (if mentioned)
- Body type (sedan, hatchback, wagon, SUV, etc.)
- Engine (if mentioned)
- Fuel type (petrol, diesel, hybrid, electric)

Return a JSON array of car specifications found in the text.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an automotive expert. Extract car specifications from text and return them as a JSON array."
          },
          {
            role: "user",
            content: extractionPrompt
          }
        ],
        functions: [{
          name: "extract_car_specifications",
          description: "Extract car specifications from text",
          parameters: {
            type: "object",
            properties: {
              cars: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    brand: { type: "string" },
                    model: { type: "string" },
                    year: { type: "number" },
                    variant: { type: "string" },
                    fuelType: { type: "string" },
                    bodyType: { type: "string" },
                    engine: { type: "string" }
                  },
                  required: ["brand", "model", "year"]
                }
              }
            },
            required: ["cars"]
          }
        }],
        function_call: { name: "extract_car_specifications" }
      });

      const functionCall = response.choices[0].message.function_call;
      if (functionCall && functionCall.arguments) {
        const result = JSON.parse(functionCall.arguments);
        console.log(`[Automotive Matcher] Extracted ${result.cars.length} car specifications`);
        return result.cars;
      }

      return [];

    } catch (error) {
      console.error('[Automotive Matcher] Error extracting car specifications:', error);
      return [];
    }
  }

  /**
   * Extract product category from customer query
   */
  private extractProductCategory(query: string, config: AutomotiveMatchingConfig): string {
    const lowerQuery = query.toLowerCase();
    
    // Check for specific product categories
    for (const category of config.product_categories) {
      const categoryWords = category.replace(/_/g, ' ').split(' ');
      const categoryMatches = categoryWords.some(word => lowerQuery.includes(word.toLowerCase()));
      
      if (categoryMatches) {
        return category;
      }
    }

    // Check for common synonyms
    const synonyms = {
      'floor_mats': ['floor mats', 'carpets', 'rugs', 'foot mats'],
      'trunk_mats': ['trunk mats', 'boot mats', 'cargo mats'],
      'car_covers': ['car covers', 'vehicle covers', 'protection covers'],
      'seat_covers': ['seat covers', 'seat protection', 'upholstery'],
      'steering_wheel_covers': ['steering wheel covers', 'steering covers']
    };

    for (const [category, synonymList] of Object.entries(synonyms)) {
      if (synonymList.some(synonym => lowerQuery.includes(synonym))) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Perform AI-powered product matching
   */
  private async performAIMatching(
    carSpec: CarSpecification,
    customerQuery: string,
    requestedCategory: string,
    availableProducts: any[],
    config: AutomotiveMatchingConfig
  ): Promise<ProductMatch[]> {
    const matchingPrompt = `Match products for a customer query:

Customer's car: ${carSpec.brand} ${carSpec.model} ${carSpec.year}
Customer query: "${customerQuery}"
Requested category: ${requestedCategory}

Available products:
${JSON.stringify(availableProducts, null, 2)}

Find the best product matches considering:
1. Brand compatibility (${carSpec.brand})
2. Model compatibility (${carSpec.model})
3. Year compatibility (${carSpec.year})
4. Product category relevance
5. Product availability

Return matches with confidence scores and reasoning.`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an automotive parts expert. Match customer car specifications with appropriate products."
        },
        {
          role: "user",
          content: matchingPrompt
        }
      ],
      functions: [{
        name: "match_products",
        description: "Match products based on car specifications",
        parameters: {
          type: "object",
          properties: {
            matches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productId: { type: "string" },
                  productName: { type: "string" },
                  productCode: { type: "string" },
                  matchScore: { type: "number", minimum: 0, maximum: 1 },
                  matchReason: { type: "string" },
                  category: { type: "string" },
                  compatibility: {
                    type: "object",
                    properties: {
                      brand: { type: "string" },
                      models: { type: "array", items: { type: "string" } },
                      years: { type: "array", items: { type: "number" } },
                      variants: { type: "array", items: { type: "string" } }
                    }
                  }
                },
                required: ["productId", "productName", "matchScore", "matchReason", "category"]
              }
            }
          },
          required: ["matches"]
        }
      }],
      function_call: { name: "match_products" }
    });

    const functionCall = response.choices[0].message.function_call;
    if (functionCall && functionCall.arguments) {
      const result = JSON.parse(functionCall.arguments);
      return result.matches.filter((match: any) => match.matchScore >= config.confidence_threshold);
    }

    return [];
  }

  /**
   * Enhance matches with additional data from database
   */
  private async enhanceMatches(
    matches: ProductMatch[],
    organizationId: string
  ): Promise<ProductMatch[]> {
    const supabase = await this.supabase;

    const enhancedMatches = [];

    for (const match of matches) {
      try {
        // Get product details from database
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', match.productId)
          .single();

        if (!error && product) {
          const enhancedMatch: ProductMatch = {
            ...match,
            price: product.price,
            availability: {
              inStock: product.quantity > 0,
              quantity: product.quantity,
              estimatedDelivery: product.quantity > 0 ? '1-2 business days' : '3-5 business days'
            },
            images: product.images || [],
            specifications: product.specifications || {}
          };

          enhancedMatches.push(enhancedMatch);
        } else {
          // Keep original match if product not found in database
          enhancedMatches.push(match);
        }
      } catch (error) {
        console.warn(`[Automotive Matcher] Error enhancing match for product ${match.productId}:`, error);
        enhancedMatches.push(match);
      }
    }

    return enhancedMatches;
  }

  /**
   * Generate upsell opportunities
   */
  private async generateUpsellOpportunities(
    matches: ProductMatch[],
    carSpec: CarSpecification,
    organizationId: string
  ): Promise<ProductMatch[]> {
    const upsellConfig = await this.settingsService.getUpsellingFrameworkConfig(organizationId);
    
    if (!upsellConfig?.enabled) {
      return [];
    }

    const upsellPrompt = `Generate upsell opportunities for a customer who is looking at these products:

Customer's car: ${carSpec.brand} ${carSpec.model} ${carSpec.year}
Current matches: ${matches.map(m => m.productName).join(', ')}

Upselling strategies:
${JSON.stringify(upsellConfig.strategies, null, 2)}

Suggest complementary products, premium versions, or related items that would benefit this customer.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a sales expert specializing in automotive accessories. Generate relevant upsell opportunities."
          },
          {
            role: "user",
            content: upsellPrompt
          }
        ],
        functions: [{
          name: "generate_upsells",
          description: "Generate upsell product recommendations",
          parameters: {
            type: "object",
            properties: {
              upsells: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    productName: { type: "string" },
                    reason: { type: "string" },
                    strategy: { type: "string" },
                    priority: { type: "number" }
                  },
                  required: ["productName", "reason", "strategy"]
                }
              }
            },
            required: ["upsells"]
          }
        }],
        function_call: { name: "generate_upsells" }
      });

      const functionCall = response.choices[0].message.function_call;
      if (functionCall && functionCall.arguments) {
        const result = JSON.parse(functionCall.arguments);
        
        // Convert upsell suggestions to ProductMatch format
        return result.upsells.map((upsell: any) => ({
          productId: `upsell_${Date.now()}_${Math.random()}`,
          productName: upsell.productName,
          matchScore: 0.8,
          matchReason: upsell.reason,
          category: 'upsell',
          compatibility: {
            brand: carSpec.brand,
            models: [carSpec.model],
            years: [carSpec.year]
          }
        }));
      }
    } catch (error) {
      console.warn('[Automotive Matcher] Error generating upsell opportunities:', error);
    }

    return [];
  }

  /**
   * Categorize matches by quality
   */
  private categorizeMatches(matches: ProductMatch[], carSpec: CarSpecification): {
    exactMatches: ProductMatch[];
    compatibleMatches: ProductMatch[];
    alternativeMatches: ProductMatch[];
  } {
    const exactMatches = matches.filter(match => 
      match.matchScore >= 0.9 && 
      match.compatibility.brand.toLowerCase() === carSpec.brand.toLowerCase() &&
      match.compatibility.models.includes(carSpec.model) &&
      match.compatibility.years.includes(carSpec.year)
    );

    const compatibleMatches = matches.filter(match => 
      match.matchScore >= 0.7 && 
      match.matchScore < 0.9 &&
      match.compatibility.brand.toLowerCase() === carSpec.brand.toLowerCase()
    );

    const alternativeMatches = matches.filter(match => 
      match.matchScore >= 0.5 && 
      match.matchScore < 0.7
    );

    return {
      exactMatches,
      compatibleMatches,
      alternativeMatches
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(matches: ProductMatch[]): number {
    if (matches.length === 0) return 0;

    const avgScore = matches.reduce((sum, match) => sum + match.matchScore, 0) / matches.length;
    const highQualityMatches = matches.filter(match => match.matchScore >= 0.8).length;
    const qualityBonus = highQualityMatches / matches.length * 0.2;

    return Math.min(avgScore + qualityBonus, 1);
  }

  /**
   * Generate reasoning explanation
   */
  private generateReasoningExplanation(
    carSpec: CarSpecification,
    matches: ProductMatch[],
    requestedCategory: string
  ): string {
    if (matches.length === 0) {
      return `No suitable products found for ${carSpec.brand} ${carSpec.model} ${carSpec.year} in category ${requestedCategory}`;
    }

    const highQualityMatches = matches.filter(match => match.matchScore >= 0.8);
    const exactBrandMatches = matches.filter(match => 
      match.compatibility.brand.toLowerCase() === carSpec.brand.toLowerCase()
    );

    let reasoning = `Found ${matches.length} product matches for ${carSpec.brand} ${carSpec.model} ${carSpec.year}. `;

    if (highQualityMatches.length > 0) {
      reasoning += `${highQualityMatches.length} high-quality matches with excellent compatibility. `;
    }

    if (exactBrandMatches.length > 0) {
      reasoning += `${exactBrandMatches.length} matches are specifically designed for ${carSpec.brand}. `;
    }

    if (requestedCategory !== 'general') {
      const categoryMatches = matches.filter(match => match.category === requestedCategory);
      if (categoryMatches.length > 0) {
        reasoning += `${categoryMatches.length} matches in the requested ${requestedCategory} category. `;
      }
    }

    return reasoning;
  }

  /**
   * Validate car specification against supported brands and years
   */
  async validateCarSpecification(
    carSpec: CarSpecification,
    organizationId: string
  ): Promise<{ valid: boolean; issues: string[] }> {
    const config = await this.settingsService.getAutomotiveMatchingConfig(organizationId);
    const issues: string[] = [];

    if (!config?.enabled) {
      issues.push('Automotive matching is not enabled');
    }

    if (config?.supported_brands && !config.supported_brands.includes(carSpec.brand)) {
      issues.push(`Brand ${carSpec.brand} is not supported. Supported brands: ${config.supported_brands.join(', ')}`);
    }

    if (config?.year_range) {
      if (carSpec.year < config.year_range.min || carSpec.year > config.year_range.max) {
        issues.push(`Year ${carSpec.year} is outside supported range: ${config.year_range.min}-${config.year_range.max}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
} 