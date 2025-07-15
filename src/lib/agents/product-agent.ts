import { AgentTask, AgentState, AgentAction, AgentResponse } from './types';
import { aiEngine } from './ai-engine';

export interface ProductSearchCriteria {
  category?: string;
  priceRange?: { min: number; max: number };
  features?: string[];
  brand?: string;
  availability?: 'in_stock' | 'out_of_stock' | 'any';
  customerSegment?: 'small' | 'medium' | 'large' | 'enterprise';
  urgency?: 'low' | 'medium' | 'high' | 'urgent';
  quantity?: number;
  specifications?: Record<string, any>;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: string;
  brand: string;
  features: string[];
  specifications: Record<string, any>;
  availability: {
    inStock: boolean;
    quantity: number;
    leadTime?: string;
  };
  matchScore: number; // 0-1 how well it matches criteria
  reasoning: string; // Why this product was recommended
  alternatives?: string[]; // Alternative product IDs
  upsellOpportunities?: string[]; // Related premium products
  crossSellItems?: string[]; // Complementary products
}

export interface CustomerContext {
  id: string;
  email: string;
  company?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  budget?: number;
  previousPurchases?: any[];
  preferences?: {
    brands: string[];
    categories: string[];
    priceRange: { min: number; max: number };
  };
  behaviorProfile?: {
    pricesensitivity: number; // 0-1
    brandLoyalty: number; // 0-1
    featureFocused: boolean;
    decisionSpeed: 'fast' | 'medium' | 'slow';
  };
}

export interface MetakockaIntegration {
  searchProducts: (criteria: ProductSearchCriteria) => Promise<any[]>;
  getProductDetails: (productId: string) => Promise<any>;
  checkInventory: (productId: string) => Promise<any>;
  getPricing: (productId: string, quantity: number, customerSegment: string) => Promise<any>;
  getRecommendations: (productId: string, customerContext: CustomerContext) => Promise<any[]>;
}

// Mock Metakocka integration for development
class MockMetakockaService implements MetakockaIntegration {
  private products = [
    {
      id: 'prod_001',
      name: 'CRM Professional Suite',
      description: 'Complete CRM solution with advanced features for growing businesses',
      price: 49.99,
      originalPrice: 59.99,
      category: 'software',
      brand: 'ARIS',
      features: ['Contact Management', 'Sales Pipeline', 'Email Integration', 'Reporting'],
      specifications: {
        users: 'Up to 50',
        storage: '100GB',
        integrations: 'Unlimited',
        support: '24/7'
      },
      availability: { inStock: true, quantity: 999, leadTime: 'Immediate' }
    },
    {
      id: 'prod_002',
      name: 'CRM Enterprise Edition',
      description: 'Enterprise-grade CRM with advanced analytics and customization',
      price: 99.99,
      originalPrice: 129.99,
      category: 'software',
      brand: 'ARIS',
      features: ['Advanced Analytics', 'Custom Fields', 'API Access', 'White Label'],
      specifications: {
        users: 'Unlimited',
        storage: '1TB',
        integrations: 'Unlimited',
        support: 'Dedicated Account Manager'
      },
      availability: { inStock: true, quantity: 999, leadTime: 'Immediate' }
    },
    {
      id: 'prod_003',
      name: 'Email Marketing Add-on',
      description: 'Powerful email marketing automation integrated with your CRM',
      price: 19.99,
      category: 'software',
      brand: 'ARIS',
      features: ['Email Templates', 'Automation', 'Analytics', 'A/B Testing'],
      specifications: {
        emails: '10,000/month',
        templates: '100+',
        automation: 'Advanced',
        support: 'Email'
      },
      availability: { inStock: true, quantity: 999, leadTime: 'Immediate' }
    },
    {
      id: 'prod_004',
      name: 'Mobile CRM App',
      description: 'Access your CRM on the go with our mobile application',
      price: 9.99,
      category: 'software',
      brand: 'ARIS',
      features: ['Offline Access', 'Push Notifications', 'Mobile Forms', 'GPS Tracking'],
      specifications: {
        platforms: 'iOS, Android',
        offline: 'Full functionality',
        sync: 'Real-time',
        support: 'In-app'
      },
      availability: { inStock: true, quantity: 999, leadTime: 'Immediate' }
    }
  ];

  async searchProducts(criteria: ProductSearchCriteria): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
    
    let results = [...this.products];
    
    if (criteria.category) {
      results = results.filter(p => p.category === criteria.category);
    }
    
    if (criteria.priceRange) {
      results = results.filter(p => 
        p.price >= criteria.priceRange!.min && p.price <= criteria.priceRange!.max
      );
    }
    
    if (criteria.features) {
      results = results.filter(p => 
        criteria.features!.some(feature => 
          p.features.some(pf => pf.toLowerCase().includes(feature.toLowerCase()))
        )
      );
    }
    
    return results;
  }

  async getProductDetails(productId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.products.find(p => p.id === productId);
  }

  async checkInventory(productId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const product = this.products.find(p => p.id === productId);
    return product?.availability || { inStock: false, quantity: 0 };
  }

  async getPricing(productId: string, quantity: number, customerSegment: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const product = this.products.find(p => p.id === productId);
    if (!product) return null;
    
    let discount = 0;
    if (customerSegment === 'enterprise') discount = 0.2;
    else if (customerSegment === 'large') discount = 0.15;
    else if (customerSegment === 'medium') discount = 0.1;
    
    if (quantity > 10) discount += 0.05;
    if (quantity > 50) discount += 0.1;
    
    const finalPrice = product.price * (1 - discount);
    
    return {
      basePrice: product.price,
      quantity,
      discount,
      finalPrice,
      totalPrice: finalPrice * quantity,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  async getRecommendations(productId: string, customerContext: CustomerContext): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Simple recommendation logic
    const recommendations = [];
    
    if (productId === 'prod_001') {
      recommendations.push('prod_003', 'prod_004'); // Add-ons for professional
    } else if (productId === 'prod_002') {
      recommendations.push('prod_003'); // Email marketing for enterprise
    }
    
    return recommendations.map(id => this.products.find(p => p.id === id)).filter(Boolean);
  }
}

export class ProductAgent {
  private agentId: string;
  private metakocka: MetakockaIntegration;
  private customerProfiles: Map<string, CustomerContext> = new Map();
  private searchHistory: Map<string, ProductSearchCriteria[]> = new Map();

  constructor(agentId: string, metakockaService?: MetakockaIntegration) {
    this.agentId = agentId;
    this.metakocka = metakockaService || new MockMetakockaService();
  }

  async searchProducts(
    criteria: ProductSearchCriteria,
    customerContext?: CustomerContext
  ): Promise<ProductRecommendation[]> {
    // Store search history for learning
    if (customerContext) {
      const history = this.searchHistory.get(customerContext.email) || [];
      history.push(criteria);
      this.searchHistory.set(customerContext.email, history);
    }

    // Search products using Metakocka
    const products = await this.metakocka.searchProducts(criteria);
    
    // Convert to recommendations with AI-powered analysis
    const recommendations: ProductRecommendation[] = [];
    
    for (const product of products) {
      const matchScore = this.calculateMatchScore(product, criteria, customerContext);
      const reasoning = await this.generateRecommendationReasoning(product, criteria, customerContext);
      
      // Get pricing for customer segment
      const pricing = await this.metakocka.getPricing(
        product.id,
        criteria.quantity || 1,
        customerContext?.size || 'medium'
      );
      
      // Get related products
      const relatedProducts = await this.metakocka.getRecommendations(product.id, customerContext);
      
      recommendations.push({
        id: product.id,
        name: product.name,
        description: product.description,
        price: pricing?.finalPrice || product.price,
        originalPrice: product.originalPrice,
        discount: pricing?.discount ? Math.round(pricing.discount * 100) : undefined,
        category: product.category,
        brand: product.brand,
        features: product.features,
        specifications: product.specifications,
        availability: product.availability,
        matchScore,
        reasoning,
        alternatives: this.findAlternatives(product, products),
        upsellOpportunities: this.findUpsellOpportunities(product, relatedProducts),
        crossSellItems: this.findCrossSellItems(product, relatedProducts)
      });
    }
    
    // Sort by match score
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }

  async processProductSearchTask(task: AgentTask, agent: AgentState): Promise<AgentResponse> {
    const { criteria, customerContext } = task.input;
    
    try {
      // Generate search analysis thoughts
      const thoughts = [
        {
          id: Date.now().toString(),
          agentId: agent.id,
          timestamp: new Date(),
          type: 'observation' as const,
          content: `Received product search request with criteria: ${JSON.stringify(criteria)}`,
          metadata: { criteria, customerContext }
        }
      ];

      // Analyze customer context if provided
      if (customerContext) {
        this.customerProfiles.set(customerContext.email, customerContext);
        
        thoughts.push({
          id: (Date.now() + 1).toString(),
          agentId: agent.id,
          timestamp: new Date(),
          type: 'reasoning' as const,
          content: `Analyzing customer profile: ${customerContext.company || customerContext.email} - ${customerContext.size} business in ${customerContext.industry || 'unknown'} industry`,
          metadata: { customerAnalysis: customerContext }
        });
      }

      // Perform intelligent search
      thoughts.push({
        id: (Date.now() + 2).toString(),
        agentId: agent.id,
        timestamp: new Date(),
        type: 'planning' as const,
        content: 'Searching Metakocka database and applying intelligent matching algorithms',
        metadata: { searchStrategy: 'ai_powered_matching' }
      });

      const recommendations = await this.searchProducts(criteria, customerContext);
      
      thoughts.push({
        id: (Date.now() + 3).toString(),
        agentId: agent.id,
        timestamp: new Date(),
        type: 'action' as const,
        content: `Found ${recommendations.length} product recommendations with average match score of ${(recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length * 100).toFixed(1)}%`,
        metadata: { recommendationsCount: recommendations.length, results: recommendations.slice(0, 3) }
      });

      // Generate business insights
      const insights = this.generateBusinessInsights(recommendations, customerContext);
      
      thoughts.push({
        id: (Date.now() + 4).toString(),
        agentId: agent.id,
        timestamp: new Date(),
        type: 'reflection' as const,
        content: `Generated business insights: ${insights.summary}`,
        metadata: { insights }
      });

      // Prepare actions
      const actions: AgentAction[] = [];
      
      // Update customer profile with search behavior
      if (customerContext) {
        actions.push({
          id: Date.now().toString(),
          type: 'update_customer_profile',
          parameters: {
            customerId: customerContext.id,
            searchBehavior: criteria,
            recommendationsViewed: recommendations.length,
            timestamp: new Date()
          },
          timestamp: new Date(),
          status: 'pending'
        });
      }

      // Schedule follow-up if high-value opportunity
      const totalValue = recommendations.reduce((sum, r) => sum + r.price, 0);
      if (totalValue > 500) {
        actions.push({
          id: (Date.now() + 1).toString(),
          type: 'schedule_sales_followup',
          parameters: {
            customerEmail: customerContext?.email,
            opportunity: 'high_value_product_search',
            totalValue,
            recommendationsCount: recommendations.length,
            followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          },
          timestamp: new Date(),
          status: 'pending'
        });
      }

      return {
        success: true,
        data: {
          recommendations,
          insights,
          totalValue,
          searchCriteria: criteria,
          customerContext
        },
        thoughts,
        actions
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in product search',
        thoughts: [{
          id: Date.now().toString(),
          agentId: agent.id,
          timestamp: new Date(),
          type: 'reflection',
          content: `Product search failed: ${error}`,
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        }]
      };
    }
  }

  private calculateMatchScore(
    product: any,
    criteria: ProductSearchCriteria,
    customerContext?: CustomerContext
  ): number {
    let score = 0.5; // Base score
    
    // Category match
    if (criteria.category && product.category === criteria.category) {
      score += 0.2;
    }
    
    // Price range match
    if (criteria.priceRange) {
      const { min, max } = criteria.priceRange;
      if (product.price >= min && product.price <= max) {
        score += 0.15;
      } else if (product.price < min) {
        score += 0.1; // Cheaper is often good
      }
    }
    
    // Feature matching
    if (criteria.features) {
      const matchedFeatures = criteria.features.filter(feature =>
        product.features.some((pf: string) => pf.toLowerCase().includes(feature.toLowerCase()))
      );
      score += (matchedFeatures.length / criteria.features.length) * 0.2;
    }
    
    // Customer context matching
    if (customerContext) {
      // Company size matching
      if (customerContext.size === 'enterprise' && product.name.includes('Enterprise')) {
        score += 0.1;
      } else if (customerContext.size === 'small' && product.name.includes('Professional')) {
        score += 0.1;
      }
      
      // Previous purchase patterns
      if (customerContext.previousPurchases?.some(p => p.brand === product.brand)) {
        score += 0.05; // Brand loyalty bonus
      }
    }
    
    // Availability bonus
    if (product.availability.inStock) {
      score += 0.05;
    }
    
    return Math.min(score, 1.0);
  }

  private async generateRecommendationReasoning(
    product: any,
    criteria: ProductSearchCriteria,
    customerContext?: CustomerContext
  ): Promise<string> {
    const prompt = `Explain why this product is a good match for the customer:

PRODUCT: ${product.name}
FEATURES: ${product.features.join(', ')}
PRICE: $${product.price}

CUSTOMER CRITERIA:
${JSON.stringify(criteria, null, 2)}

CUSTOMER CONTEXT:
${customerContext ? JSON.stringify(customerContext, null, 2) : 'Not provided'}

Provide a concise, compelling explanation of why this product fits the customer's needs.`;

    const reasoning = await aiEngine.getLLMProvider().generateCompletion(prompt);
    return reasoning;
  }

  private findAlternatives(product: any, allProducts: any[]): string[] {
    return allProducts
      .filter(p => p.id !== product.id && p.category === product.category)
      .slice(0, 3)
      .map(p => p.id);
  }

  private findUpsellOpportunities(product: any, relatedProducts: any[]): string[] {
    return relatedProducts
      .filter(p => p.price > product.price)
      .slice(0, 2)
      .map(p => p.id);
  }

  private findCrossSellItems(product: any, relatedProducts: any[]): string[] {
    return relatedProducts
      .filter(p => p.category !== product.category)
      .slice(0, 3)
      .map(p => p.id);
  }

  private generateBusinessInsights(
    recommendations: ProductRecommendation[],
    customerContext?: CustomerContext
  ): any {
    const totalValue = recommendations.reduce((sum, r) => sum + r.price, 0);
    const avgMatchScore = recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length;
    
    return {
      summary: `Found ${recommendations.length} highly relevant products with ${(avgMatchScore * 100).toFixed(1)}% average match score`,
      totalOpportunityValue: totalValue,
      recommendationQuality: avgMatchScore > 0.8 ? 'excellent' : avgMatchScore > 0.6 ? 'good' : 'moderate',
      suggestedActions: [
        totalValue > 1000 ? 'High-value opportunity - schedule sales call' : 'Standard follow-up recommended',
        recommendations.length > 5 ? 'Multiple options available - guide customer through selection' : 'Focused selection - good for quick decision',
        customerContext?.size === 'enterprise' ? 'Enterprise customer - consider custom pricing' : 'Standard pricing applies'
      ]
    };
  }

  // Analytics and insights
  getSearchAnalytics(): {
    totalSearches: number;
    averageMatchScore: number;
    topCategories: string[];
    customerSegments: Record<string, number>;
  } {
    const allSearches = Array.from(this.searchHistory.values()).flat();
    const categories = allSearches.map(s => s.category).filter(Boolean);
    const segments = Array.from(this.customerProfiles.values()).map(c => c.size).filter(Boolean);
    
    return {
      totalSearches: allSearches.length,
      averageMatchScore: 0.78, // Mock average
      topCategories: [...new Set(categories)],
      customerSegments: segments.reduce((acc, seg) => {
        acc[seg!] = (acc[seg!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  getCustomerInsights(customerEmail: string): {
    searchHistory: ProductSearchCriteria[];
    preferences: any;
    recommendedActions: string[];
  } {
    const history = this.searchHistory.get(customerEmail) || [];
    const profile = this.customerProfiles.get(customerEmail);
    
    return {
      searchHistory: history,
      preferences: profile?.preferences || {},
      recommendedActions: [
        'Send personalized product recommendations',
        'Schedule product demo',
        'Offer volume discounts'
      ]
    };
  }
}

// Export singleton instance
export const productAgent = new ProductAgent('product-agent-1'); 