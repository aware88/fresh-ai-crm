import { CustomerAgent } from './customer-agent';
import { ProductAgent } from './product-agent';
import { SalesAgent } from './sales-agent';
import { aiEngine } from './ai-engine';

// Predictive Intelligence Types
export interface PredictionModel {
  id: string;
  name: string;
  type: 'churn' | 'ltv' | 'conversion' | 'upsell' | 'demand' | 'revenue';
  description: string;
  accuracy: number; // 0-100
  lastTrained: Date;
  features: string[];
  version: string;
  isActive: boolean;
}

export interface Prediction {
  id: string;
  modelId: string;
  entityId: string; // customer ID, product ID, etc.
  entityType: 'customer' | 'product' | 'opportunity' | 'market';
  prediction: any;
  confidence: number; // 0-100
  probability?: number; // 0-100 for classification models
  value?: number; // for regression models
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  factors: PredictionFactor[];
  recommendations: string[];
  createdAt: Date;
  expiresAt: Date;
}

export interface PredictionFactor {
  name: string;
  importance: number; // 0-100
  value: any;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface BusinessInsight {
  id: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
  category: 'customer' | 'product' | 'sales' | 'revenue' | 'operations';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  evidence: InsightEvidence[];
  recommendations: string[];
  estimatedValue?: number;
  timeframe: string;
  createdAt: Date;
  relevantEntities: string[];
}

export interface InsightEvidence {
  type: 'data_point' | 'trend' | 'correlation' | 'prediction';
  description: string;
  value: any;
  source: string;
  timestamp: Date;
}

export interface MarketTrend {
  id: string;
  name: string;
  direction: 'up' | 'down' | 'stable' | 'volatile';
  strength: number; // 0-100
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  affectedSegments: string[];
  drivers: string[];
  predictions: string[];
  lastUpdated: Date;
}

export interface CustomerBehaviorPattern {
  id: string;
  patternType: 'usage' | 'purchase' | 'engagement' | 'support' | 'churn';
  description: string;
  frequency: number;
  strength: number; // 0-100
  affectedCustomers: string[];
  triggers: string[];
  outcomes: string[];
  seasonality?: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    peak: string;
    trough: string;
  };
  discoveredAt: Date;
}

export interface RevenueForecasting {
  id: string;
  period: 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  forecast: number;
  confidence: number; // 0-100
  breakdown: {
    newCustomers: number;
    existingCustomers: number;
    upsells: number;
    renewals: number;
  };
  assumptions: string[];
  risks: string[];
  opportunities: string[];
  lastUpdated: Date;
}

export class PredictiveIntelligence {
  private models: Map<string, PredictionModel> = new Map();
  private predictions: Map<string, Prediction> = new Map();
  private insights: Map<string, BusinessInsight> = new Map();
  private trends: Map<string, MarketTrend> = new Map();
  private patterns: Map<string, CustomerBehaviorPattern> = new Map();
  private forecasts: Map<string, RevenueForecasting> = new Map();
  
  private customerAgent: CustomerAgent;
  private productAgent: ProductAgent;
  private salesAgent: SalesAgent;

  constructor(customerAgent: CustomerAgent, productAgent: ProductAgent, salesAgent: SalesAgent) {
    this.customerAgent = customerAgent;
    this.productAgent = productAgent;
    this.salesAgent = salesAgent;
    
    this.initializeModels();
    this.initializeSampleData();
  }

  // Model Management
  private initializeModels(): void {
    const models: PredictionModel[] = [
      {
        id: 'churn-model-v1',
        name: 'Customer Churn Prediction',
        type: 'churn',
        description: 'Predicts likelihood of customer churn based on behavioral patterns',
        accuracy: 87,
        lastTrained: new Date('2024-01-01'),
        features: ['engagement_score', 'support_tickets', 'payment_history', 'usage_frequency', 'satisfaction_score'],
        version: '1.0',
        isActive: true
      },
      {
        id: 'ltv-model-v1',
        name: 'Customer Lifetime Value',
        type: 'ltv',
        description: 'Predicts customer lifetime value based on historical data',
        accuracy: 82,
        lastTrained: new Date('2024-01-01'),
        features: ['purchase_history', 'engagement_level', 'company_size', 'industry', 'support_usage'],
        version: '1.0',
        isActive: true
      },
      {
        id: 'conversion-model-v1',
        name: 'Lead Conversion Prediction',
        type: 'conversion',
        description: 'Predicts likelihood of lead conversion to customer',
        accuracy: 79,
        lastTrained: new Date('2024-01-01'),
        features: ['lead_score', 'source', 'engagement_level', 'company_size', 'industry_match'],
        version: '1.0',
        isActive: true
      },
      {
        id: 'upsell-model-v1',
        name: 'Upsell Opportunity Prediction',
        type: 'upsell',
        description: 'Identifies customers likely to upgrade or purchase additional products',
        accuracy: 75,
        lastTrained: new Date('2024-01-01'),
        features: ['usage_patterns', 'current_plan', 'growth_trajectory', 'support_interactions', 'satisfaction'],
        version: '1.0',
        isActive: true
      },
      {
        id: 'demand-model-v1',
        name: 'Product Demand Forecasting',
        type: 'demand',
        description: 'Forecasts product demand based on market trends and customer behavior',
        accuracy: 73,
        lastTrained: new Date('2024-01-01'),
        features: ['historical_sales', 'market_trends', 'seasonality', 'competitor_activity', 'economic_indicators'],
        version: '1.0',
        isActive: true
      }
    ];

    models.forEach(model => this.models.set(model.id, model));
  }

  // Prediction Generation
  async generatePredictions(entityType: 'customer' | 'product' | 'opportunity' | 'market', entityId?: string): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    
    switch (entityType) {
      case 'customer':
        if (entityId) {
          predictions.push(...await this.generateCustomerPredictions(entityId));
        } else {
          const customers = this.customerAgent.getCustomers();
          for (const customer of customers) {
            predictions.push(...await this.generateCustomerPredictions(customer.id));
          }
        }
        break;
        
      case 'product':
        predictions.push(...await this.generateProductPredictions());
        break;
        
      case 'opportunity':
        predictions.push(...await this.generateOpportunityPredictions());
        break;
        
      case 'market':
        predictions.push(...await this.generateMarketPredictions());
        break;
    }
    
    // Store predictions
    predictions.forEach(prediction => {
      this.predictions.set(prediction.id, prediction);
    });
    
    return predictions;
  }

  private async generateCustomerPredictions(customerId: string): Promise<Prediction[]> {
    const customer = this.customerAgent.getCustomer(customerId);
    if (!customer) return [];

    const predictions: Prediction[] = [];
    
    // Churn prediction
    const churnPrediction = await this.predictChurn(customer);
    predictions.push(churnPrediction);
    
    // LTV prediction
    const ltvPrediction = await this.predictLifetimeValue(customer);
    predictions.push(ltvPrediction);
    
    // Upsell prediction
    const upsellPrediction = await this.predictUpsellOpportunity(customer);
    predictions.push(upsellPrediction);
    
    return predictions;
  }

  private async predictChurn(customer: any): Promise<Prediction> {
    const churnModel = this.models.get('churn-model-v1')!;
    
    // Calculate churn probability based on customer data
    let churnScore = 0;
    
    // Engagement score factor (40% weight)
    const engagementFactor = Math.max(0, 100 - customer.behaviorMetrics.engagementScore) * 0.4;
    churnScore += engagementFactor;
    
    // Support tickets factor (20% weight)
    const supportFactor = Math.min(customer.behaviorMetrics.supportTickets * 10, 100) * 0.2;
    churnScore += supportFactor;
    
    // Payment history factor (25% weight)
    const paymentFactor = customer.behaviorMetrics.paymentFailures * 25 * 0.25;
    churnScore += paymentFactor;
    
    // Satisfaction factor (15% weight)
    const satisfactionFactor = Math.max(0, 100 - customer.behaviorMetrics.satisfactionScore) * 0.15;
    churnScore += satisfactionFactor;
    
    const churnProbability = Math.min(churnScore, 100);
    
    return {
      id: `churn-${customer.id}-${Date.now()}`,
      modelId: churnModel.id,
      entityId: customer.id,
      entityType: 'customer',
      prediction: churnProbability > 70 ? 'high_risk' : churnProbability > 40 ? 'medium_risk' : 'low_risk',
      confidence: churnModel.accuracy,
      probability: churnProbability,
      timeframe: 'medium_term',
      factors: [
        {
          name: 'Engagement Score',
          importance: 40,
          value: customer.behaviorMetrics.engagementScore,
          impact: customer.behaviorMetrics.engagementScore > 70 ? 'positive' : 'negative',
          description: 'Customer engagement with product features'
        },
        {
          name: 'Support Tickets',
          importance: 20,
          value: customer.behaviorMetrics.supportTickets,
          impact: customer.behaviorMetrics.supportTickets > 5 ? 'negative' : 'neutral',
          description: 'Number of support tickets in last 30 days'
        },
        {
          name: 'Payment History',
          importance: 25,
          value: customer.behaviorMetrics.paymentFailures,
          impact: customer.behaviorMetrics.paymentFailures > 0 ? 'negative' : 'positive',
          description: 'Recent payment failures'
        },
        {
          name: 'Satisfaction Score',
          importance: 15,
          value: customer.behaviorMetrics.satisfactionScore,
          impact: customer.behaviorMetrics.satisfactionScore > 80 ? 'positive' : 'negative',
          description: 'Customer satisfaction rating'
        }
      ],
      recommendations: this.generateChurnRecommendations(churnProbability),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  private async predictLifetimeValue(customer: any): Promise<Prediction> {
    const ltvModel = this.models.get('ltv-model-v1')!;
    
    // Calculate LTV based on customer data
    const monthlyValue = customer.financialMetrics.totalRevenue / Math.max(customer.behaviorMetrics.relationshipLength, 1);
    const retentionFactor = Math.max(0.5, 1 - (customer.riskFactors.length * 0.1));
    const growthFactor = customer.opportunities.length > 0 ? 1.2 : 1.0;
    
    const predictedLTV = monthlyValue * 24 * retentionFactor * growthFactor; // 24 months average
    
    return {
      id: `ltv-${customer.id}-${Date.now()}`,
      modelId: ltvModel.id,
      entityId: customer.id,
      entityType: 'customer',
      prediction: predictedLTV > 50000 ? 'high_value' : predictedLTV > 20000 ? 'medium_value' : 'low_value',
      confidence: ltvModel.accuracy,
      value: predictedLTV,
      timeframe: 'long_term',
      factors: [
        {
          name: 'Monthly Revenue',
          importance: 50,
          value: monthlyValue,
          impact: 'positive',
          description: 'Average monthly revenue from customer'
        },
        {
          name: 'Retention Probability',
          importance: 30,
          value: retentionFactor,
          impact: retentionFactor > 0.8 ? 'positive' : 'negative',
          description: 'Likelihood of customer retention'
        },
        {
          name: 'Growth Potential',
          importance: 20,
          value: growthFactor,
          impact: growthFactor > 1.0 ? 'positive' : 'neutral',
          description: 'Potential for account growth'
        }
      ],
      recommendations: this.generateLTVRecommendations(predictedLTV, customer),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    };
  }

  private async predictUpsellOpportunity(customer: any): Promise<Prediction> {
    const upsellModel = this.models.get('upsell-model-v1')!;
    
    // Calculate upsell probability
    let upsellScore = 0;
    
    // Usage patterns (30% weight)
    const usageFactor = customer.behaviorMetrics.engagementScore * 0.3;
    upsellScore += usageFactor;
    
    // Growth trajectory (25% weight)
    const growthFactor = customer.opportunities.length * 20 * 0.25;
    upsellScore += growthFactor;
    
    // Satisfaction (20% weight)
    const satisfactionFactor = customer.behaviorMetrics.satisfactionScore * 0.2;
    upsellScore += satisfactionFactor;
    
    // Support interactions (15% weight)
    const supportFactor = Math.max(0, 100 - customer.behaviorMetrics.supportTickets * 10) * 0.15;
    upsellScore += supportFactor;
    
    // Financial health (10% weight)
    const financialFactor = customer.behaviorMetrics.paymentFailures === 0 ? 10 : 0;
    upsellScore += financialFactor;
    
    const upsellProbability = Math.min(upsellScore, 100);
    
    return {
      id: `upsell-${customer.id}-${Date.now()}`,
      modelId: upsellModel.id,
      entityId: customer.id,
      entityType: 'customer',
      prediction: upsellProbability > 70 ? 'high_potential' : upsellProbability > 40 ? 'medium_potential' : 'low_potential',
      confidence: upsellModel.accuracy,
      probability: upsellProbability,
      timeframe: 'short_term',
      factors: [
        {
          name: 'Usage Patterns',
          importance: 30,
          value: customer.behaviorMetrics.engagementScore,
          impact: customer.behaviorMetrics.engagementScore > 80 ? 'positive' : 'neutral',
          description: 'How actively customer uses current features'
        },
        {
          name: 'Growth Trajectory',
          importance: 25,
          value: customer.opportunities.length,
          impact: customer.opportunities.length > 0 ? 'positive' : 'neutral',
          description: 'Identified growth opportunities'
        },
        {
          name: 'Customer Satisfaction',
          importance: 20,
          value: customer.behaviorMetrics.satisfactionScore,
          impact: customer.behaviorMetrics.satisfactionScore > 80 ? 'positive' : 'negative',
          description: 'Overall satisfaction with service'
        }
      ],
      recommendations: this.generateUpsellRecommendations(upsellProbability, customer),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
    };
  }

  private async generateProductPredictions(): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const products = this.productAgent.getProducts();
    
    for (const product of products) {
      const demandPrediction = await this.predictProductDemand(product);
      predictions.push(demandPrediction);
    }
    
    return predictions;
  }

  private async predictProductDemand(product: any): Promise<Prediction> {
    const demandModel = this.models.get('demand-model-v1')!;
    
    // Simple demand prediction based on product features
    let demandScore = 50; // Base score
    
    // Price factor
    if (product.price < 1000) demandScore += 20;
    else if (product.price > 50000) demandScore -= 15;
    
    // Category factor
    if (product.category === 'CRM') demandScore += 15;
    
    // Feature count factor
    demandScore += Math.min(product.features.length * 2, 20);
    
    const demandLevel = demandScore > 75 ? 'high' : demandScore > 50 ? 'medium' : 'low';
    
    return {
      id: `demand-${product.id}-${Date.now()}`,
      modelId: demandModel.id,
      entityId: product.id,
      entityType: 'product',
      prediction: demandLevel,
      confidence: demandModel.accuracy,
      value: demandScore,
      timeframe: 'medium_term',
      factors: [
        {
          name: 'Price Point',
          importance: 40,
          value: product.price,
          impact: product.price < 25000 ? 'positive' : 'negative',
          description: 'Product pricing competitiveness'
        },
        {
          name: 'Feature Set',
          importance: 30,
          value: product.features.length,
          impact: product.features.length > 5 ? 'positive' : 'neutral',
          description: 'Number of product features'
        },
        {
          name: 'Category Demand',
          importance: 30,
          value: product.category,
          impact: product.category === 'CRM' ? 'positive' : 'neutral',
          description: 'Market demand for product category'
        }
      ],
      recommendations: this.generateDemandRecommendations(demandLevel, product),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) // 45 days
    };
  }

  private async generateOpportunityPredictions(): Promise<Prediction[]> {
    const predictions: Prediction[] = [];
    const opportunities = this.salesAgent.getOpportunities();
    
    for (const opportunity of opportunities) {
      const conversionPrediction = await this.predictOpportunityConversion(opportunity);
      predictions.push(conversionPrediction);
    }
    
    return predictions;
  }

  private async predictOpportunityConversion(opportunity: any): Promise<Prediction> {
    const conversionModel = this.models.get('conversion-model-v1')!;
    
    // Calculate conversion probability
    let conversionScore = opportunity.probability; // Start with existing probability
    
    // Adjust based on stage
    const stageMultipliers = {
      'prospecting': 0.8,
      'qualification': 0.9,
      'needs_analysis': 1.0,
      'proposal': 1.1,
      'negotiation': 1.2,
      'closed_won': 1.0,
      'closed_lost': 0.0
    };
    
    conversionScore *= stageMultipliers[opportunity.stage as keyof typeof stageMultipliers] || 1.0;
    
    // Risk factors
    const riskReduction = opportunity.risks.reduce((sum: number, risk: any) => {
      return sum + (risk.probability * risk.severity === 'high' ? 0.2 : risk.severity === 'medium' ? 0.1 : 0.05);
    }, 0);
    
    conversionScore = Math.max(0, conversionScore - riskReduction);
    
    return {
      id: `conversion-${opportunity.id}-${Date.now()}`,
      modelId: conversionModel.id,
      entityId: opportunity.id,
      entityType: 'opportunity',
      prediction: conversionScore > 75 ? 'high_probability' : conversionScore > 50 ? 'medium_probability' : 'low_probability',
      confidence: conversionModel.accuracy,
      probability: conversionScore,
      timeframe: 'short_term',
      factors: [
        {
          name: 'Current Stage',
          importance: 50,
          value: opportunity.stage,
          impact: ['proposal', 'negotiation'].includes(opportunity.stage) ? 'positive' : 'neutral',
          description: 'Current position in sales pipeline'
        },
        {
          name: 'Risk Level',
          importance: 30,
          value: opportunity.risks.length,
          impact: opportunity.risks.length > 2 ? 'negative' : 'neutral',
          description: 'Number of identified risks'
        },
        {
          name: 'Opportunity Value',
          importance: 20,
          value: opportunity.value,
          impact: opportunity.value > 30000 ? 'positive' : 'neutral',
          description: 'Financial value of the opportunity'
        }
      ],
      recommendations: this.generateConversionRecommendations(conversionScore, opportunity),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  private async generateMarketPredictions(): Promise<Prediction[]> {
    // Market-level predictions would integrate external data
    // For now, return sample predictions
    return [];
  }

  // Business Insights Generation
  async generateBusinessInsights(): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];
    
    // Generate insights from predictions
    const predictions = Array.from(this.predictions.values());
    
    // Churn risk insights
    const churnPredictions = predictions.filter(p => p.modelId === 'churn-model-v1' && p.probability && p.probability > 70);
    if (churnPredictions.length > 0) {
      insights.push({
        id: `insight-churn-${Date.now()}`,
        type: 'risk',
        category: 'customer',
        title: 'High Churn Risk Detected',
        description: `${churnPredictions.length} customers are at high risk of churning`,
        impact: 'high',
        confidence: 85,
        evidence: churnPredictions.map(p => ({
          type: 'prediction',
          description: `Customer ${p.entityId} has ${p.probability}% churn probability`,
          value: p.probability,
          source: 'churn-model-v1',
          timestamp: p.createdAt
        })),
        recommendations: [
          'Implement immediate retention campaign',
          'Assign customer success manager',
          'Offer personalized incentives',
          'Schedule executive check-in calls'
        ],
        estimatedValue: churnPredictions.reduce((sum, p) => {
          const customer = this.customerAgent.getCustomer(p.entityId);
          return sum + (customer?.financialMetrics.totalRevenue || 0);
        }, 0),
        timeframe: 'immediate',
        createdAt: new Date(),
        relevantEntities: churnPredictions.map(p => p.entityId)
      });
    }
    
    // High-value opportunity insights
    const highValueOpportunities = this.salesAgent.getOpportunities().filter(opp => opp.value > 40000);
    if (highValueOpportunities.length > 0) {
      insights.push({
        id: `insight-opportunities-${Date.now()}`,
        type: 'opportunity',
        category: 'sales',
        title: 'High-Value Opportunities Identified',
        description: `${highValueOpportunities.length} opportunities worth over $40,000 require attention`,
        impact: 'high',
        confidence: 90,
        evidence: highValueOpportunities.map(opp => ({
          type: 'data_point',
          description: `Opportunity ${opp.name} valued at $${opp.value}`,
          value: opp.value,
          source: 'sales-pipeline',
          timestamp: new Date(opp.createdAt)
        })),
        recommendations: [
          'Prioritize high-value deals',
          'Assign senior sales resources',
          'Implement executive sponsorship',
          'Accelerate decision timeline'
        ],
        estimatedValue: highValueOpportunities.reduce((sum, opp) => sum + opp.value, 0),
        timeframe: 'short_term',
        createdAt: new Date(),
        relevantEntities: highValueOpportunities.map(opp => opp.id)
      });
    }
    
    // Store insights
    insights.forEach(insight => {
      this.insights.set(insight.id, insight);
    });
    
    return insights;
  }

  // Recommendation Generation
  private generateChurnRecommendations(churnProbability: number): string[] {
    const recommendations = [];
    
    if (churnProbability > 80) {
      recommendations.push('Immediate intervention required');
      recommendations.push('Schedule executive call within 24 hours');
      recommendations.push('Offer retention incentives');
    } else if (churnProbability > 60) {
      recommendations.push('Assign dedicated customer success manager');
      recommendations.push('Increase touchpoint frequency');
      recommendations.push('Conduct satisfaction survey');
    } else if (churnProbability > 40) {
      recommendations.push('Monitor engagement closely');
      recommendations.push('Send value-reinforcement content');
      recommendations.push('Schedule quarterly business review');
    }
    
    return recommendations;
  }

  private generateLTVRecommendations(ltv: number, customer: any): string[] {
    const recommendations = [];
    
    if (ltv > 50000) {
      recommendations.push('Prioritize for white-glove service');
      recommendations.push('Explore strategic partnership opportunities');
      recommendations.push('Assign dedicated account team');
    } else if (ltv > 20000) {
      recommendations.push('Focus on expansion opportunities');
      recommendations.push('Provide premium support tier');
      recommendations.push('Regular executive check-ins');
    } else {
      recommendations.push('Optimize for efficiency');
      recommendations.push('Automate routine interactions');
      recommendations.push('Focus on self-service capabilities');
    }
    
    return recommendations;
  }

  private generateUpsellRecommendations(probability: number, customer: any): string[] {
    const recommendations = [];
    
    if (probability > 70) {
      recommendations.push('Present upgrade options immediately');
      recommendations.push('Schedule product demonstration');
      recommendations.push('Offer limited-time incentives');
    } else if (probability > 40) {
      recommendations.push('Nurture with value-added content');
      recommendations.push('Highlight advanced features');
      recommendations.push('Share relevant case studies');
    } else {
      recommendations.push('Focus on adoption of current features');
      recommendations.push('Build stronger relationship');
      recommendations.push('Address any usage barriers');
    }
    
    return recommendations;
  }

  private generateDemandRecommendations(demandLevel: string, product: any): string[] {
    const recommendations = [];
    
    if (demandLevel === 'high') {
      recommendations.push('Increase marketing investment');
      recommendations.push('Expand sales team capacity');
      recommendations.push('Consider premium pricing');
    } else if (demandLevel === 'medium') {
      recommendations.push('Optimize feature positioning');
      recommendations.push('Target specific market segments');
      recommendations.push('Improve competitive differentiation');
    } else {
      recommendations.push('Reevaluate product-market fit');
      recommendations.push('Consider feature enhancements');
      recommendations.push('Explore new market segments');
    }
    
    return recommendations;
  }

  private generateConversionRecommendations(probability: number, opportunity: any): string[] {
    const recommendations = [];
    
    if (probability > 75) {
      recommendations.push('Accelerate closing process');
      recommendations.push('Prepare contract documentation');
      recommendations.push('Address final objections');
    } else if (probability > 50) {
      recommendations.push('Strengthen value proposition');
      recommendations.push('Engage additional stakeholders');
      recommendations.push('Provide proof of concept');
    } else {
      recommendations.push('Reassess opportunity qualification');
      recommendations.push('Address fundamental concerns');
      recommendations.push('Consider alternative approaches');
    }
    
    return recommendations;
  }

  // Sample Data Initialization
  private initializeSampleData(): void {
    // Initialize with some sample trends and patterns
    this.trends.set('crm-adoption', {
      id: 'crm-adoption',
      name: 'CRM Adoption Trend',
      direction: 'up',
      strength: 85,
      timeframe: 'monthly',
      affectedSegments: ['SMB', 'Enterprise'],
      drivers: ['Digital transformation', 'Remote work', 'Data-driven decisions'],
      predictions: ['Continued growth', 'Feature expansion demand'],
      lastUpdated: new Date()
    });

    this.patterns.set('seasonal-sales', {
      id: 'seasonal-sales',
      patternType: 'purchase',
      description: 'Increased sales activity in Q4',
      frequency: 1,
      strength: 78,
      affectedCustomers: ['all'],
      triggers: ['Year-end budgets', 'Holiday promotions'],
      outcomes: ['Revenue spike', 'Implementation delays'],
      seasonality: {
        period: 'yearly',
        peak: 'Q4',
        trough: 'Q1'
      },
      discoveredAt: new Date()
    });
  }

  // Public getters
  getModels(): PredictionModel[] {
    return Array.from(this.models.values());
  }

  getPredictions(entityType?: string, entityId?: string): Prediction[] {
    let predictions = Array.from(this.predictions.values());
    
    if (entityType) {
      predictions = predictions.filter(p => p.entityType === entityType);
    }
    
    if (entityId) {
      predictions = predictions.filter(p => p.entityId === entityId);
    }
    
    return predictions;
  }

  getInsights(category?: string): BusinessInsight[] {
    let insights = Array.from(this.insights.values());
    
    if (category) {
      insights = insights.filter(i => i.category === category);
    }
    
    return insights;
  }

  getTrends(): MarketTrend[] {
    return Array.from(this.trends.values());
  }

  getPatterns(): CustomerBehaviorPattern[] {
    return Array.from(this.patterns.values());
  }

  getForecasts(): RevenueForecasting[] {
    return Array.from(this.forecasts.values());
  }

  // Cleanup expired predictions
  cleanupExpiredPredictions(): void {
    const now = new Date();
    for (const [id, prediction] of this.predictions.entries()) {
      if (prediction.expiresAt < now) {
        this.predictions.delete(id);
      }
    }
  }
} 