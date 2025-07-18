/**
 * Automotive Product Matcher
 * 
 * Service for matching customer car specifications with appropriate products
 * Specifically designed for Withcar's automotive parts and accessories business
 */

import { OrganizationSettingsService, AutomotiveMatchingConfig, SeasonalRecommendationConfig } from '@/lib/services/organization-settings-service';
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

             // Generate upsell opportunities with seasonal considerations
       const upsellOpportunities = await this.generateUpsellOpportunities(
         enhancedMatches,
         carSpec,
         organizationId
       );

       // Add seasonal recommendations
       const seasonalRecommendations = await this.generateSeasonalRecommendations(
         enhancedMatches,
         carSpec,
         organizationId,
         'en' // Default language, will be enhanced with customer language detection
       );

      // Categorize matches
      const categorizedMatches = this.categorizeMatches(enhancedMatches, carSpec);

      const result: AutomotiveMatchingResult = {
        carSpecification: carSpec,
        matches: enhancedMatches.slice(0, maxResults),
        suggestions: categorizedMatches,
                 confidence: this.calculateOverallConfidence(enhancedMatches),
         reasoning: this.generateReasoningExplanation(carSpec, enhancedMatches, requestedCategory),
         upsellOpportunities: [...upsellOpportunities, ...seasonalRecommendations]
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
   * Generate intelligent upselling opportunities with customer history analysis
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

    try {
      // Get customer purchase history and preferences
      const customerHistory = await this.getCustomerHistory(organizationId, carSpec);
      
      // Analyze purchase patterns and preferences
      const purchasePatterns = this.analyzePurchasePatterns(customerHistory);
      
      // Get organization-specific upselling strategies
      const enhancedUpsellConfig = await this.getUpsellConfiguration(organizationId);
      
             const enhancedUpsellPrompt = this.buildEnhancedUpsellPrompt(
         matches, 
         carSpec, 
         upsellConfig.strategies || {},
         purchasePatterns,
         enhancedUpsellConfig
       );

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an advanced automotive upselling expert with access to customer purchase history and behavioral patterns. Suggest highly relevant complementary products that align with customer preferences and purchase history."
          },
          {
            role: "user",
            content: enhancedUpsellPrompt
          }
        ],
        functions: [{
          name: "generate_enhanced_upsell_opportunities",
          description: "Generate intelligent upselling opportunities based on customer history and preferences",
          parameters: {
            type: "object",
            properties: {
              opportunities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    productName: { type: "string" },
                    category: { type: "string" },
                    reason: { type: "string" },
                    confidence: { type: "number" },
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                    upsellType: { type: "string", enum: ["complementary", "premium", "bundle", "maintenance", "seasonal"] },
                    customerAlignment: { type: "string" },
                    pricePoint: { type: "string", enum: ["budget", "mid-range", "premium"] },
                    urgency: { type: "string", enum: ["immediate", "soon", "future"] }
                  },
                  required: ["productName", "category", "reason", "confidence", "priority", "upsellType"]
                }
              }
            },
            required: ["opportunities"]
          }
        }],
        function_call: { name: "generate_enhanced_upsell_opportunities" }
      });

      const functionCall = response.choices[0].message.function_call;
      if (functionCall && functionCall.arguments) {
        const result = JSON.parse(functionCall.arguments);
        
        return result.opportunities.map((opportunity: any) => ({
          productId: `upsell_${Date.now()}_${Math.random()}`,
          productName: opportunity.productName,
          matchScore: opportunity.confidence,
          matchReason: `${opportunity.reason} (${opportunity.upsellType} upsell)`,
          category: opportunity.category,
          compatibility: {
            brand: carSpec.brand,
            models: [carSpec.model],
            years: [carSpec.year]
          },
          metadata: {
            upsellType: opportunity.upsellType,
            customerAlignment: opportunity.customerAlignment,
            pricePoint: opportunity.pricePoint,
            urgency: opportunity.urgency
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

  /**
   * Generate seasonal product recommendations
   */
  private async generateSeasonalRecommendations(
    existingMatches: ProductMatch[],
    carSpec: CarSpecification,
    organizationId: string,
    language: string = 'en'
  ): Promise<ProductMatch[]> {
    try {
      const seasonalConfig = await this.settingsService.getSeasonalRecommendationConfig(organizationId);
      
      if (!seasonalConfig?.enabled) {
        return [];
      }

      const currentSeason = await this.settingsService.getCurrentSeasonalRecommendations(organizationId);
      
      if (!currentSeason) {
        return [];
      }

      const seasonalPrompt = `Generate seasonal product recommendations for a customer with a ${carSpec.brand} ${carSpec.model} ${carSpec.year}.

Current season: ${currentSeason.name}
Season product categories: ${currentSeason.productCategories.join(', ')}
Upselling strategies: ${currentSeason.upsellStrategies.join(', ')}
Marketing message: ${currentSeason.marketingMessages[language] || currentSeason.marketingMessages['en']}

Customer already looking at: ${existingMatches.map(m => m.productName).join(', ')}

Suggest 3-5 seasonal products that would be relevant for this customer's vehicle and the current season.
Focus on products that complement what they're already considering.
Consider weather conditions, maintenance needs, and seasonal driving patterns.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a seasonal automotive product specialist. Suggest relevant seasonal products based on vehicle type and current season."
          },
          {
            role: "user",
            content: seasonalPrompt
          }
        ],
        functions: [{
          name: "generate_seasonal_recommendations",
          description: "Generate seasonal product recommendations",
          parameters: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    productName: { type: "string" },
                    category: { type: "string" },
                    reason: { type: "string" },
                    seasonalRelevance: { type: "string" },
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                    weatherCondition: { type: "string" },
                    maintenanceType: { type: "string" }
                  },
                  required: ["productName", "category", "reason", "seasonalRelevance", "priority"]
                }
              }
            },
            required: ["recommendations"]
          }
        }],
        function_call: { name: "generate_seasonal_recommendations" }
      });

      const functionCall = response.choices[0].message.function_call;
      if (functionCall && functionCall.arguments) {
        const result = JSON.parse(functionCall.arguments);
        
        // Convert seasonal recommendations to ProductMatch format
        return result.recommendations.map((rec: any) => ({
          productId: `seasonal_${Date.now()}_${Math.random()}`,
          productName: rec.productName,
          matchScore: rec.priority === 'high' ? 0.9 : rec.priority === 'medium' ? 0.7 : 0.5,
          matchReason: `${rec.reason} - ${rec.seasonalRelevance}`,
          category: rec.category,
          compatibility: {
            brand: carSpec.brand,
            models: [carSpec.model],
            years: [carSpec.year]
          }
        }));
      }

      return [];

    } catch (error) {
      console.warn('[Automotive Matcher] Error generating seasonal recommendations:', error);
      return [];
    }
  }

  /**
   * Get weather-based product recommendations
   */
  private async getWeatherBasedRecommendations(
    carSpec: CarSpecification,
    organizationId: string,
    countryCode?: string
  ): Promise<ProductMatch[]> {
    try {
      const seasonalConfig = await this.settingsService.getSeasonalRecommendationConfig(organizationId);
      
      if (!seasonalConfig?.weatherBasedRecommendations) {
        return [];
      }

      // Get current weather conditions (this would integrate with a weather API)
      const currentWeather = await this.getCurrentWeatherConditions(countryCode);
      
      if (!currentWeather) {
        return [];
      }

      const weatherPrompt = `Recommend automotive products based on current weather conditions:

Vehicle: ${carSpec.brand} ${carSpec.model} ${carSpec.year}
Current weather: ${currentWeather.condition}
Temperature: ${currentWeather.temperature}°C
Precipitation: ${currentWeather.precipitation}
Wind: ${currentWeather.windSpeed} km/h

Suggest products that would be immediately useful given these weather conditions.
Focus on safety, comfort, and vehicle protection.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a weather-aware automotive product specialist. Suggest products based on current weather conditions."
          },
          {
            role: "user",
            content: weatherPrompt
          }
        ],
        functions: [{
          name: "generate_weather_recommendations",
          description: "Generate weather-based product recommendations",
          parameters: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    productName: { type: "string" },
                    category: { type: "string" },
                    reason: { type: "string" },
                    urgency: { type: "string", enum: ["immediate", "soon", "planning"] },
                    weatherCondition: { type: "string" }
                  },
                  required: ["productName", "category", "reason", "urgency"]
                }
              }
            },
            required: ["recommendations"]
          }
        }],
        function_call: { name: "generate_weather_recommendations" }
      });

      const functionCall = response.choices[0].message.function_call;
      if (functionCall && functionCall.arguments) {
        const result = JSON.parse(functionCall.arguments);
        
        return result.recommendations.map((rec: any) => ({
          productId: `weather_${Date.now()}_${Math.random()}`,
          productName: rec.productName,
          matchScore: rec.urgency === 'immediate' ? 0.95 : rec.urgency === 'soon' ? 0.8 : 0.6,
          matchReason: `Weather-based recommendation: ${rec.reason}`,
          category: rec.category,
          compatibility: {
            brand: carSpec.brand,
            models: [carSpec.model],
            years: [carSpec.year]
          }
        }));
      }

      return [];

    } catch (error) {
      console.warn('[Automotive Matcher] Error generating weather-based recommendations:', error);
      return [];
    }
  }

     /**
    * Get current weather conditions (mock implementation)
    */
   private async getCurrentWeatherConditions(countryCode?: string): Promise<any> {
     // This would integrate with a weather API like OpenWeatherMap
     // For now, returning mock data based on current date
     const currentMonth = new Date().getMonth() + 1;
     
     if (currentMonth >= 12 || currentMonth <= 2) {
       return {
         condition: 'cold',
         temperature: 5,
         precipitation: 'snow',
         windSpeed: 15
       };
     } else if (currentMonth >= 3 && currentMonth <= 5) {
       return {
         condition: 'mild',
         temperature: 15,
         precipitation: 'rain',
         windSpeed: 10
       };
     } else if (currentMonth >= 6 && currentMonth <= 8) {
       return {
         condition: 'hot',
         temperature: 30,
         precipitation: 'none',
         windSpeed: 5
       };
     } else {
       return {
         condition: 'cool',
         temperature: 10,
         precipitation: 'rain',
         windSpeed: 20
       };
     }
   }

   /**
    * Get customer purchase history and preferences
    */
   private async getCustomerHistory(organizationId: string, carSpec: CarSpecification): Promise<any> {
     try {
       // This would integrate with the CRM to get actual customer data
       // For now, returning mock data structure
       const mockHistory = {
         totalPurchases: 5,
         averageOrderValue: 150,
         preferredCategories: ['tires', 'filters', 'maintenance'],
         lastPurchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
         priceSegmentPreference: 'mid-range',
         seasonalBuying: ['spring', 'winter'],
         brandLoyalty: {
           [carSpec.brand]: 0.8,
           'aftermarket': 0.6
         },
         productCategories: {
           'tires': 3,
           'filters': 4,
           'maintenance': 2,
           'accessories': 1
         }
       };

       return mockHistory;
     } catch (error) {
       console.warn('[Automotive Matcher] Error getting customer history:', error);
       return null;
     }
   }

   /**
    * Analyze customer purchase patterns
    */
   private analyzePurchasePatterns(customerHistory: any): any {
     if (!customerHistory) {
       return {
         buyingFrequency: 'occasional',
         pricePreference: 'mid-range',
         brandPreference: 'mixed',
         seasonalPatterns: [],
         maintenanceSchedule: 'standard'
       };
     }

     const patterns = {
       buyingFrequency: customerHistory.totalPurchases > 10 ? 'frequent' : 
                        customerHistory.totalPurchases > 5 ? 'regular' : 'occasional',
       pricePreference: customerHistory.averageOrderValue > 200 ? 'premium' :
                        customerHistory.averageOrderValue > 100 ? 'mid-range' : 'budget',
       brandPreference: customerHistory.brandLoyalty[Object.keys(customerHistory.brandLoyalty)[0]] > 0.7 ? 'brand-loyal' : 'mixed',
       seasonalPatterns: customerHistory.seasonalBuying,
       maintenanceSchedule: customerHistory.productCategories.maintenance > 2 ? 'proactive' : 'standard',
       preferredCategories: Object.keys(customerHistory.productCategories)
         .sort((a, b) => customerHistory.productCategories[b] - customerHistory.productCategories[a])
         .slice(0, 3)
     };

     return patterns;
   }

   /**
    * Get organization-specific upselling configuration
    */
   private async getUpsellConfiguration(organizationId: string): Promise<any> {
     try {
       // This would get organization-specific upselling strategies
       const config = {
         maxUpsellItems: 5,
         priceIncreaseThreshold: 0.3, // Max 30% price increase for upsells
         bundleDiscounts: true,
         seasonalPromotions: true,
         maintenanceReminders: true,
         preferredMargins: {
           'tires': 0.25,
           'filters': 0.35,
           'accessories': 0.40,
           'maintenance': 0.30
         }
       };

       return config;
     } catch (error) {
       console.warn('[Automotive Matcher] Error getting upsell configuration:', error);
       return {};
     }
   }

   /**
    * Build enhanced upsell prompt with customer insights
    */
   private buildEnhancedUpsellPrompt(
     matches: ProductMatch[], 
     carSpec: CarSpecification, 
     strategies: any,
     purchasePatterns: any,
     upsellConfig: any
   ): string {
     const currentProducts = matches.map(m => `${m.productName} (${m.category})`).join(', ');
     
     return `Generate intelligent upselling opportunities for a customer with the following profile:

VEHICLE: ${carSpec.brand} ${carSpec.model} ${carSpec.year}
CURRENT INTEREST: ${currentProducts}
UPSELLING STRATEGIES: ${JSON.stringify(strategies, null, 2)}

CUSTOMER PROFILE:
- Buying frequency: ${purchasePatterns.buyingFrequency}
- Price preference: ${purchasePatterns.pricePreference}
- Brand preference: ${purchasePatterns.brandPreference}
- Seasonal buying patterns: ${purchasePatterns.seasonalPatterns.join(', ')}
- Maintenance approach: ${purchasePatterns.maintenanceSchedule}
- Preferred categories: ${purchasePatterns.preferredCategories.join(', ')}

UPSELLING STRATEGY:
- Maximum upsell items: ${upsellConfig.maxUpsellItems || 5}
- Price increase threshold: ${(upsellConfig.priceIncreaseThreshold || 0.3) * 100}%
- Bundle discounts available: ${upsellConfig.bundleDiscounts ? 'Yes' : 'No'}
- Seasonal promotions active: ${upsellConfig.seasonalPromotions ? 'Yes' : 'No'}

REQUIREMENTS:
1. Suggest products that complement the customer's current interests
2. Consider their historical purchase patterns and preferences
3. Align with their price preference and buying frequency
4. Include both immediate and future needs
5. Consider seasonal relevance and maintenance schedules
6. Prioritize based on customer profile alignment

Generate 3-5 highly targeted upsell opportunities that would genuinely benefit this customer.`;
   }
} 