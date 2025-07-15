import { AgentTask, AgentState, AgentAction, AgentResponse } from './types';
import { aiEngine } from './ai-engine';

export interface CustomerProfile {
  id: string;
  email: string;
  name?: string;
  company?: string;
  industry?: string;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  joinDate: Date;
  lastActivity: Date;
  totalValue: number;
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled';
  paymentHistory: PaymentRecord[];
  supportTickets: SupportTicket[];
  engagementMetrics: EngagementMetrics;
  behaviorProfile: BehaviorProfile;
  riskFactors: RiskFactor[];
  opportunities: Opportunity[];
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: Date;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  plan: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdDate: Date;
  resolvedDate?: Date;
  satisfaction?: number; // 1-5 rating
}

export interface EngagementMetrics {
  loginFrequency: number; // logins per week
  featureUsage: Record<string, number>; // feature -> usage count
  emailOpenRate: number; // 0-1
  emailClickRate: number; // 0-1
  supportInteractions: number;
  lastLoginDate: Date;
  averageSessionDuration: number; // minutes
  totalSessions: number;
}

export interface BehaviorProfile {
  segment: 'champion' | 'loyal' | 'potential_loyalist' | 'new_customer' | 'at_risk' | 'cannot_lose' | 'hibernating';
  engagementLevel: 'high' | 'medium' | 'low';
  adoptionStage: 'onboarding' | 'growing' | 'mature' | 'declining';
  communicationPreference: 'email' | 'phone' | 'chat' | 'self_service';
  decisionMakingStyle: 'analytical' | 'driver' | 'expressive' | 'amiable';
  pricesensitivity: number; // 0-1
  featurePreferences: string[];
  satisfactionScore: number; // 0-10
  loyaltyScore: number; // 0-10
}

export interface RiskFactor {
  type: 'churn' | 'payment' | 'support' | 'engagement' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  probability: number; // 0-1
  impact: number; // 0-1
  detectedDate: Date;
  mitigationActions: string[];
}

export interface Opportunity {
  type: 'upsell' | 'cross_sell' | 'renewal' | 'expansion' | 'advocacy';
  value: number;
  probability: number; // 0-1
  description: string;
  timeline: string; // e.g., "next 30 days"
  requiredActions: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface CustomerInsight {
  customerId: string;
  insights: {
    healthScore: number; // 0-100
    churnRisk: number; // 0-1
    lifetimeValue: number;
    nextBestAction: string;
    personalizedRecommendations: string[];
    retentionStrategy: string;
  };
  predictions: {
    churnProbability: number;
    renewalLikelihood: number;
    expansionPotential: number;
    satisfactionTrend: 'improving' | 'stable' | 'declining';
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export class CustomerAgent {
  private agentId: string;
  private customerProfiles: Map<string, CustomerProfile> = new Map();
  private insightHistory: Map<string, CustomerInsight[]> = new Map();

  constructor(agentId: string) {
    this.agentId = agentId;
    this.initializeMockData();
  }

  async analyzeCustomer(customerId: string): Promise<CustomerInsight> {
    const profile = this.customerProfiles.get(customerId);
    if (!profile) {
      throw new Error(`Customer profile not found: ${customerId}`);
    }

    // Calculate health score
    const healthScore = this.calculateHealthScore(profile);
    
    // Predict churn risk
    const churnRisk = this.predictChurnRisk(profile);
    
    // Calculate lifetime value
    const lifetimeValue = this.calculateLifetimeValue(profile);
    
    // Generate AI-powered insights
    const aiInsights = await this.generateAIInsights(profile);
    
    // Create comprehensive insight
    const insight: CustomerInsight = {
      customerId,
      insights: {
        healthScore,
        churnRisk,
        lifetimeValue,
        nextBestAction: aiInsights.nextBestAction,
        personalizedRecommendations: aiInsights.recommendations,
        retentionStrategy: aiInsights.retentionStrategy
      },
      predictions: {
        churnProbability: churnRisk,
        renewalLikelihood: 1 - churnRisk,
        expansionPotential: this.calculateExpansionPotential(profile),
        satisfactionTrend: this.analyzeSatisfactionTrend(profile)
      },
      recommendations: {
        immediate: aiInsights.immediateActions,
        shortTerm: aiInsights.shortTermActions,
        longTerm: aiInsights.longTermActions
      }
    };

    // Store insight history
    const history = this.insightHistory.get(customerId) || [];
    history.push(insight);
    this.insightHistory.set(customerId, history);

    return insight;
  }

  async processCustomerAnalysisTask(task: AgentTask, agent: AgentState): Promise<AgentResponse> {
    const { customerId, analysisType = 'comprehensive' } = task.input;
    
    try {
      const thoughts = [
        {
          id: Date.now().toString(),
          agentId: agent.id,
          timestamp: new Date(),
          type: 'observation' as const,
          content: `Starting ${analysisType} customer analysis for customer ID: ${customerId}`,
          metadata: { customerId, analysisType } as any
        }
      ];

      // Get customer profile
      const profile = this.customerProfiles.get(customerId);
      if (!profile) {
        throw new Error(`Customer profile not found: ${customerId}`);
      }

      thoughts.push({
        id: (Date.now() + 1).toString(),
        agentId: agent.id,
        timestamp: new Date(),
        type: 'reasoning',
        content: `Analyzing customer profile: ${profile.name || profile.email} - ${profile.company} (${profile.size} ${profile.industry})`,
        metadata: { profileSummary: `${profile.company} - ${profile.size} ${profile.industry}` }
      } as any);

      // Perform comprehensive analysis
      const insight = await this.analyzeCustomer(customerId);
      
      thoughts.push({
        id: (Date.now() + 2).toString(),
        agentId: agent.id,
        timestamp: new Date(),
        type: 'planning',
        content: `Customer health score: ${insight.insights.healthScore}/100, Churn risk: ${(insight.insights.churnRisk * 100).toFixed(1)}%, LTV: $${insight.insights.lifetimeValue.toFixed(2)}`,
        metadata: { healthScore: insight.insights.healthScore, churnRisk: insight.insights.churnRisk }
      } as any);

      // Generate risk assessment
      const riskFactors = this.identifyRiskFactors(profile);
      const opportunities = this.identifyOpportunities(profile);

      thoughts.push({
        id: (Date.now() + 3).toString(),
        agentId: agent.id,
        timestamp: new Date(),
        type: 'action',
        content: `Identified ${riskFactors.length} risk factors and ${opportunities.length} opportunities. Next best action: ${insight.insights.nextBestAction}`,
        metadata: { riskFactors: riskFactors.length, opportunities: opportunities.length }
      } as any);

      // Generate action plan
      const actionPlan = this.generateActionPlan(insight, riskFactors, opportunities);
      
      thoughts.push({
        id: (Date.now() + 4).toString(),
        agentId: agent.id,
        timestamp: new Date(),
        type: 'reflection',
        content: `Generated comprehensive action plan with ${actionPlan.length} recommended actions for customer success`,
        metadata: { actionPlan }
      } as any);

      // Prepare actions
      const actions: AgentAction[] = [];
      
      // High-risk customers need immediate attention
      if (insight.insights.churnRisk > 0.7) {
        actions.push({
          id: Date.now().toString(),
          type: 'escalate_to_success_manager',
          parameters: {
            customerId,
            reason: 'high_churn_risk',
            churnRisk: insight.insights.churnRisk,
            urgency: 'high',
            recommendedActions: insight.recommendations.immediate
          },
          timestamp: new Date(),
          status: 'pending'
        });
      }

      // Schedule follow-up based on customer segment
      const followUpDays = this.calculateFollowUpInterval(profile.behaviorProfile.segment);
      actions.push({
        id: (Date.now() + 1).toString(),
        type: 'schedule_customer_check_in',
        parameters: {
          customerId,
          followUpDate: new Date(Date.now() + followUpDays * 24 * 60 * 60 * 1000),
          reason: 'regular_health_check',
          priority: insight.insights.churnRisk > 0.5 ? 'high' : 'medium'
        },
        timestamp: new Date(),
        status: 'pending'
      });

      // Update customer profile with new insights
      actions.push({
        id: (Date.now() + 2).toString(),
        type: 'update_customer_insights',
        parameters: {
          customerId,
          insights: insight,
          lastAnalysisDate: new Date(),
          analystAgent: agent.id
        },
        timestamp: new Date(),
        status: 'pending'
      });

      return {
        success: true,
        data: {
          customerProfile: profile,
          insights: insight,
          riskFactors,
          opportunities,
          actionPlan,
          analysisType
        },
        thoughts,
        actions
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in customer analysis',
        thoughts: [{
          id: Date.now().toString(),
          agentId: agent.id,
          timestamp: new Date(),
          type: 'reflection',
          content: `Customer analysis failed: ${error}`,
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        }]
      };
    }
  }

  private calculateHealthScore(profile: CustomerProfile): number {
    let score = 50; // Base score
    
    // Engagement factors (40 points)
    const engagementScore = Math.min(profile.engagementMetrics.loginFrequency * 5, 20);
    score += engagementScore;
    
    // Payment history (20 points)
    const paidPayments = profile.paymentHistory.filter(p => p.status === 'paid').length;
    const paymentScore = Math.min(paidPayments * 2, 20);
    score += paymentScore;
    
    // Support satisfaction (20 points)
    const supportScore = profile.supportTickets.length > 0 
      ? profile.supportTickets.reduce((sum, t) => sum + (t.satisfaction || 3), 0) / profile.supportTickets.length * 4
      : 15; // Default good score if no tickets
    score += supportScore;
    
    // Recency (20 points)
    const daysSinceLastActivity = (Date.now() - profile.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(20 - daysSinceLastActivity / 7, 0);
    score += recencyScore;
    
    return Math.min(Math.max(score, 0), 100);
  }

  private predictChurnRisk(profile: CustomerProfile): number {
    let risk = 0.1; // Base risk
    
    // Engagement risk
    if (profile.engagementMetrics.loginFrequency < 1) risk += 0.3;
    else if (profile.engagementMetrics.loginFrequency < 2) risk += 0.15;
    
    // Payment risk
    const failedPayments = profile.paymentHistory.filter(p => p.status === 'failed').length;
    risk += failedPayments * 0.1;
    
    // Support risk
    const recentTickets = profile.supportTickets.filter(t => 
      (Date.now() - t.createdDate.getTime()) < 30 * 24 * 60 * 60 * 1000
    );
    risk += recentTickets.length * 0.05;
    
    // Satisfaction risk
    const avgSatisfaction = profile.supportTickets.length > 0
      ? profile.supportTickets.reduce((sum, t) => sum + (t.satisfaction || 3), 0) / profile.supportTickets.length
      : 4;
    if (avgSatisfaction < 3) risk += 0.2;
    
    // Activity risk
    const daysSinceLastActivity = (Date.now() - profile.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastActivity > 30) risk += 0.3;
    else if (daysSinceLastActivity > 14) risk += 0.15;
    
    return Math.min(risk, 1.0);
  }

  private calculateLifetimeValue(profile: CustomerProfile): number {
    const totalPaid = profile.paymentHistory
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const monthsActive = Math.max(
      (Date.now() - profile.joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
      1
    );
    
    const avgMonthlyValue = totalPaid / monthsActive;
    const projectedLifespan = this.predictCustomerLifespan(profile);
    
    return avgMonthlyValue * projectedLifespan;
  }

  private predictCustomerLifespan(profile: CustomerProfile): number {
    // Base lifespan based on customer size
    let baseLifespan = 24; // months
    
    if (profile.size === 'enterprise') baseLifespan = 48;
    else if (profile.size === 'large') baseLifespan = 36;
    else if (profile.size === 'medium') baseLifespan = 24;
    else baseLifespan = 12;
    
    // Adjust based on engagement
    const engagementMultiplier = Math.max(0.5, Math.min(2.0, profile.engagementMetrics.loginFrequency / 3));
    
    return baseLifespan * engagementMultiplier;
  }

  private calculateExpansionPotential(profile: CustomerProfile): number {
    let potential = 0.3; // Base potential
    
    // Size-based potential
    if (profile.size === 'small') potential += 0.4;
    else if (profile.size === 'medium') potential += 0.3;
    else if (profile.size === 'large') potential += 0.2;
    
    // Engagement-based potential
    if (profile.engagementMetrics.loginFrequency > 5) potential += 0.2;
    
    // Satisfaction-based potential
    if (profile.behaviorProfile.satisfactionScore > 8) potential += 0.1;
    
    return Math.min(potential, 1.0);
  }

  private analyzeSatisfactionTrend(profile: CustomerProfile): 'improving' | 'stable' | 'declining' {
    const recentTickets = profile.supportTickets
      .filter(t => (Date.now() - t.createdDate.getTime()) < 90 * 24 * 60 * 60 * 1000)
      .sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime());
    
    if (recentTickets.length < 2) return 'stable';
    
    const recentAvg = recentTickets.slice(0, Math.ceil(recentTickets.length / 2))
      .reduce((sum, t) => sum + (t.satisfaction || 3), 0) / Math.ceil(recentTickets.length / 2);
    
    const olderAvg = recentTickets.slice(Math.ceil(recentTickets.length / 2))
      .reduce((sum, t) => sum + (t.satisfaction || 3), 0) / Math.floor(recentTickets.length / 2);
    
    if (recentAvg > olderAvg + 0.5) return 'improving';
    if (recentAvg < olderAvg - 0.5) return 'declining';
    return 'stable';
  }

  private async generateAIInsights(profile: CustomerProfile): Promise<any> {
    const prompt = `Analyze this customer profile and provide strategic insights:

CUSTOMER: ${profile.name || profile.email}
COMPANY: ${profile.company} (${profile.size} ${profile.industry})
SUBSCRIPTION: ${profile.subscriptionStatus}
TOTAL VALUE: $${profile.totalValue}
ENGAGEMENT: ${profile.engagementMetrics.loginFrequency} logins/week
LAST ACTIVITY: ${profile.lastActivity.toDateString()}

BEHAVIOR PROFILE:
- Segment: ${profile.behaviorProfile.segment}
- Engagement Level: ${profile.behaviorProfile.engagementLevel}
- Satisfaction Score: ${profile.behaviorProfile.satisfactionScore}/10
- Communication Preference: ${profile.behaviorProfile.communicationPreference}

RECENT ACTIVITY:
- Support Tickets: ${profile.supportTickets.length}
- Payment History: ${profile.paymentHistory.length} transactions

Provide:
1. Next best action for this customer
2. 3 personalized recommendations
3. Retention strategy
4. Immediate actions (next 7 days)
5. Short-term actions (next 30 days)
6. Long-term actions (next 90 days)`;

    const response = await aiEngine.getLLMProvider().generateCompletion(prompt);
    
    // Parse AI response (simplified for demo)
    return {
      nextBestAction: "Schedule personalized check-in call to discuss feature usage and satisfaction",
      recommendations: [
        "Provide advanced training on underutilized features",
        "Offer integration with their existing tools",
        "Present upgrade options based on usage patterns"
      ],
      retentionStrategy: "Focus on value demonstration and proactive support",
      immediateActions: ["Send personalized email with usage insights"],
      shortTermActions: ["Schedule product demo", "Provide feature training"],
      longTermActions: ["Quarterly business review", "Expansion opportunity assessment"]
    };
  }

  private identifyRiskFactors(profile: CustomerProfile): RiskFactor[] {
    const factors: RiskFactor[] = [];
    
    // Engagement risk
    if (profile.engagementMetrics.loginFrequency < 1) {
      factors.push({
        type: 'engagement',
        severity: 'high',
        description: 'Low login frequency indicates disengagement',
        probability: 0.8,
        impact: 0.7,
        detectedDate: new Date(),
        mitigationActions: ['Reach out for check-in', 'Provide usage training', 'Identify barriers to adoption']
      });
    }
    
    // Payment risk
    const failedPayments = profile.paymentHistory.filter(p => p.status === 'failed').length;
    if (failedPayments > 0) {
      factors.push({
        type: 'payment',
        severity: failedPayments > 2 ? 'critical' : 'medium',
        description: `${failedPayments} failed payment(s) detected`,
        probability: 0.6,
        impact: 0.9,
        detectedDate: new Date(),
        mitigationActions: ['Update payment method', 'Discuss payment terms', 'Offer payment plan']
      });
    }
    
    return factors;
  }

  private identifyOpportunities(profile: CustomerProfile): Opportunity[] {
    const opportunities: Opportunity[] = [];
    
    // Expansion opportunity
    if (profile.size === 'small' && profile.engagementMetrics.loginFrequency > 3) {
      opportunities.push({
        type: 'expansion',
        value: 500,
        probability: 0.7,
        description: 'High engagement small business ready for growth plan',
        timeline: 'next 30 days',
        requiredActions: ['Present growth plan benefits', 'Show ROI calculation', 'Offer trial period'],
        priority: 'high'
      });
    }
    
    // Upsell opportunity
    if (profile.behaviorProfile.satisfactionScore > 8) {
      opportunities.push({
        type: 'upsell',
        value: 200,
        probability: 0.6,
        description: 'Satisfied customer likely to accept premium features',
        timeline: 'next 60 days',
        requiredActions: ['Demonstrate premium features', 'Provide usage analytics', 'Offer discount'],
        priority: 'medium'
      });
    }
    
    return opportunities;
  }

  private generateActionPlan(insight: CustomerInsight, riskFactors: RiskFactor[], opportunities: Opportunity[]): string[] {
    const actions: string[] = [];
    
    // Risk mitigation actions
    riskFactors.forEach(risk => {
      actions.push(...risk.mitigationActions);
    });
    
    // Opportunity actions
    opportunities.forEach(opp => {
      actions.push(...opp.requiredActions);
    });
    
    // Health-based actions
    if (insight.insights.healthScore < 50) {
      actions.push('Immediate intervention required', 'Schedule success manager call');
    } else if (insight.insights.healthScore < 70) {
      actions.push('Proactive engagement needed', 'Send satisfaction survey');
    }
    
    return [...new Set(actions)]; // Remove duplicates
  }

  private calculateFollowUpInterval(segment: string): number {
    switch (segment) {
      case 'at_risk':
      case 'cannot_lose':
        return 7; // Weekly
      case 'new_customer':
        return 14; // Bi-weekly
      case 'champion':
      case 'loyal':
        return 30; // Monthly
      default:
        return 21; // Every 3 weeks
    }
  }

  private initializeMockData(): void {
    // Create sample customer profiles for testing
    const sampleCustomers: CustomerProfile[] = [
      {
        id: 'cust_001',
        email: 'john.doe@example.com',
        name: 'John Doe',
        company: 'Example Corp',
        industry: 'technology',
        size: 'small',
        joinDate: new Date('2023-01-15'),
        lastActivity: new Date('2024-01-10'),
        totalValue: 1200,
        subscriptionStatus: 'active',
        paymentHistory: [
          { id: 'pay_001', amount: 49.99, date: new Date('2024-01-01'), status: 'paid', plan: 'professional' },
          { id: 'pay_002', amount: 49.99, date: new Date('2023-12-01'), status: 'paid', plan: 'professional' }
        ],
        supportTickets: [
          { id: 'tick_001', subject: 'Integration help', priority: 'medium', status: 'resolved', createdDate: new Date('2023-12-15'), resolvedDate: new Date('2023-12-16'), satisfaction: 4 }
        ],
        engagementMetrics: {
          loginFrequency: 3,
          featureUsage: { 'contacts': 15, 'emails': 8, 'reports': 3 },
          emailOpenRate: 0.6,
          emailClickRate: 0.15,
          supportInteractions: 1,
          lastLoginDate: new Date('2024-01-10'),
          averageSessionDuration: 25,
          totalSessions: 45
        },
        behaviorProfile: {
          segment: 'potential_loyalist',
          engagementLevel: 'medium',
          adoptionStage: 'growing',
          communicationPreference: 'email',
          decisionMakingStyle: 'analytical',
          pricesensitivity: 0.7,
          featurePreferences: ['contacts', 'emails'],
          satisfactionScore: 7,
          loyaltyScore: 6
        },
        riskFactors: [],
        opportunities: []
      }
    ];

    sampleCustomers.forEach(customer => {
      this.customerProfiles.set(customer.id, customer);
    });
  }

  // Analytics methods
  getCustomerSegmentAnalytics(): Record<string, number> {
    const segments: Record<string, number> = {};
    
    this.customerProfiles.forEach(profile => {
      const segment = profile.behaviorProfile.segment;
      segments[segment] = (segments[segment] || 0) + 1;
    });
    
    return segments;
  }

  getChurnRiskDistribution(): { low: number; medium: number; high: number; critical: number } {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    
    this.customerProfiles.forEach(profile => {
      const churnRisk = this.predictChurnRisk(profile);
      if (churnRisk < 0.3) distribution.low++;
      else if (churnRisk < 0.6) distribution.medium++;
      else if (churnRisk < 0.8) distribution.high++;
      else distribution.critical++;
    });
    
    return distribution;
  }
}

// Export singleton instance
export const customerAgent = new CustomerAgent('customer-agent-1'); 