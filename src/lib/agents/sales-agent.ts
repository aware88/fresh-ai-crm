import { Agent, AgentTask, AgentThought, AgentAction, AgentEvent, AgentCapability } from './types';
import { AIEngine } from './ai-engine';

// Sales-specific types
export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  source: 'website' | 'referral' | 'cold_outreach' | 'social_media' | 'event' | 'partner';
  status: 'new' | 'contacted' | 'qualified' | 'demo_scheduled' | 'proposal_sent' | 'negotiation' | 'closed_won' | 'closed_lost';
  score: number; // 0-100
  qualificationData: LeadQualification;
  timeline: LeadActivity[];
  createdAt: Date;
  lastActivity: Date;
  assignedTo?: string;
  estimatedValue?: number;
  expectedCloseDate?: Date;
  lostReason?: string;
  notes: string[];
}

export interface LeadQualification {
  budget: {
    range: 'under_1k' | '1k_5k' | '5k_25k' | '25k_100k' | 'over_100k';
    confirmed: boolean;
    urgency: 'immediate' | 'this_quarter' | 'next_quarter' | 'next_year' | 'exploring';
  };
  authority: {
    level: 'decision_maker' | 'influencer' | 'user' | 'gatekeeper';
    canApprove: boolean;
    needsApproval: boolean;
  };
  need: {
    painPoints: string[];
    currentSolution?: string;
    requirements: string[];
    priority: 'critical' | 'high' | 'medium' | 'low';
  };
  timeline: {
    decisionBy?: Date;
    implementationBy?: Date;
    currentPhase: 'awareness' | 'consideration' | 'decision' | 'purchase';
  };
  fit: {
    companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
    industry: string;
    useCase: string;
    technicalFit: number; // 0-100
    culturalFit: number; // 0-100
  };
}

export interface LeadActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'follow_up' | 'note';
  timestamp: Date;
  description: string;
  outcome?: 'positive' | 'neutral' | 'negative';
  nextAction?: string;
  scheduledFor?: Date;
}

export interface Opportunity {
  id: string;
  leadId: string;
  name: string;
  stage: 'prospecting' | 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value: number;
  probability: number; // 0-100
  expectedCloseDate: Date;
  products: string[];
  competitors: string[];
  decisionCriteria: string[];
  stakeholders: OpportunityStakeholder[];
  activities: OpportunityActivity[];
  risks: OpportunityRisk[];
  nextSteps: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OpportunityStakeholder {
  name: string;
  role: string;
  influence: 'high' | 'medium' | 'low';
  sentiment: 'champion' | 'supporter' | 'neutral' | 'skeptic' | 'blocker';
  concerns: string[];
}

export interface OpportunityActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'negotiation';
  timestamp: Date;
  participants: string[];
  summary: string;
  outcome: 'positive' | 'neutral' | 'negative';
  nextSteps: string[];
}

export interface OpportunityRisk {
  type: 'budget' | 'timeline' | 'competition' | 'technical' | 'political';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
  probability: number; // 0-100
}

export interface SalesMetrics {
  totalLeads: number;
  qualifiedLeads: number;
  conversionRate: number;
  averageDealSize: number;
  salesCycleLength: number;
  winRate: number;
  pipelineValue: number;
  forecastAccuracy: number;
  activityMetrics: {
    callsPerDay: number;
    emailsPerDay: number;
    meetingsPerWeek: number;
    demosPerWeek: number;
  };
}

export interface SalesInsight {
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  action: string;
  confidence: number;
  relatedLeads: string[];
  relatedOpportunities: string[];
}

export class SalesAgent implements Agent {
  id: string;
  name: string;
  type: 'sales';
  status: 'idle' | 'active' | 'busy' | 'error';
  capabilities: AgentCapability[];
  currentTask: AgentTask | null = null;
  
  private aiEngine: AIEngine;
  private leads: Map<string, Lead> = new Map();
  private opportunities: Map<string, Opportunity> = new Map();
  private metrics: SalesMetrics;
  private insights: SalesInsight[] = [];

  constructor(aiEngine: AIEngine) {
    this.id = 'sales-agent';
    this.name = 'Sales Agent';
    this.type = 'sales';
    this.status = 'idle';
    this.aiEngine = aiEngine;
    
    this.capabilities = [
      {
        name: 'lead_qualification',
        description: 'Qualify leads using BANT methodology',
        enabled: true
      },
      {
        name: 'opportunity_management',
        description: 'Manage sales opportunities and pipeline',
        enabled: true
      },
      {
        name: 'sales_forecasting',
        description: 'Predict sales outcomes and revenue',
        enabled: true
      },
      {
        name: 'competitive_analysis',
        description: 'Analyze competitive landscape',
        enabled: true
      },
      {
        name: 'proposal_generation',
        description: 'Generate sales proposals and quotes',
        enabled: true
      },
      {
        name: 'pipeline_optimization',
        description: 'Optimize sales pipeline and processes',
        enabled: true
      }
    ];

    this.metrics = {
      totalLeads: 0,
      qualifiedLeads: 0,
      conversionRate: 0,
      averageDealSize: 0,
      salesCycleLength: 0,
      winRate: 0,
      pipelineValue: 0,
      forecastAccuracy: 0,
      activityMetrics: {
        callsPerDay: 0,
        emailsPerDay: 0,
        meetingsPerWeek: 0,
        demosPerWeek: 0
      }
    };

    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample leads
    const sampleLeads: Lead[] = [
      {
        id: 'lead-001',
        name: 'John Smith',
        email: 'john.smith@techcorp.com',
        company: 'TechCorp Solutions',
        phone: '+1-555-0123',
        source: 'website',
        status: 'qualified',
        score: 85,
        qualificationData: {
          budget: { range: '25k_100k', confirmed: true, urgency: 'this_quarter' },
          authority: { level: 'decision_maker', canApprove: true, needsApproval: false },
          need: {
            painPoints: ['Manual CRM processes', 'Poor lead tracking', 'No automation'],
            currentSolution: 'Spreadsheets',
            requirements: ['Automation', 'Integration', 'Reporting'],
            priority: 'high'
          },
          timeline: {
            decisionBy: new Date('2024-02-15'),
            implementationBy: new Date('2024-03-01'),
            currentPhase: 'consideration'
          },
          fit: {
            companySize: 'medium',
            industry: 'Technology',
            useCase: 'Sales automation',
            technicalFit: 90,
            culturalFit: 85
          }
        },
        timeline: [
          {
            id: 'activity-001',
            type: 'call',
            timestamp: new Date('2024-01-15'),
            description: 'Initial discovery call',
            outcome: 'positive',
            nextAction: 'Send demo invitation'
          }
        ],
        createdAt: new Date('2024-01-10'),
        lastActivity: new Date('2024-01-15'),
        assignedTo: 'sales-rep-001',
        estimatedValue: 45000,
        expectedCloseDate: new Date('2024-02-20'),
        notes: ['Very interested in automation features', 'Budget approved by CFO']
      },
      {
        id: 'lead-002',
        name: 'Sarah Johnson',
        email: 'sarah.j@innovate.com',
        company: 'Innovate Inc',
        source: 'referral',
        status: 'demo_scheduled',
        score: 72,
        qualificationData: {
          budget: { range: '5k_25k', confirmed: false, urgency: 'next_quarter' },
          authority: { level: 'influencer', canApprove: false, needsApproval: true },
          need: {
            painPoints: ['Lack of customer insights', 'Poor follow-up processes'],
            requirements: ['Customer analytics', 'Email automation'],
            priority: 'medium'
          },
          timeline: {
            currentPhase: 'awareness'
          },
          fit: {
            companySize: 'small',
            industry: 'Marketing',
            useCase: 'Customer management',
            technicalFit: 75,
            culturalFit: 70
          }
        },
        timeline: [],
        createdAt: new Date('2024-01-12'),
        lastActivity: new Date('2024-01-12'),
        estimatedValue: 15000,
        expectedCloseDate: new Date('2024-03-15'),
        notes: ['Referred by existing customer', 'Needs approval from VP']
      }
    ];

    sampleLeads.forEach(lead => this.leads.set(lead.id, lead));

    // Sample opportunities
    const sampleOpportunities: Opportunity[] = [
      {
        id: 'opp-001',
        leadId: 'lead-001',
        name: 'TechCorp CRM Implementation',
        stage: 'proposal',
        value: 45000,
        probability: 75,
        expectedCloseDate: new Date('2024-02-20'),
        products: ['CRM Professional', 'Email Add-on'],
        competitors: ['Salesforce', 'HubSpot'],
        decisionCriteria: ['Price', 'Features', 'Support', 'Integration'],
        stakeholders: [
          {
            name: 'John Smith',
            role: 'IT Director',
            influence: 'high',
            sentiment: 'champion',
            concerns: []
          },
          {
            name: 'Mary Davis',
            role: 'CFO',
            influence: 'high',
            sentiment: 'neutral',
            concerns: ['Budget', 'ROI']
          }
        ],
        activities: [
          {
            id: 'opp-activity-001',
            type: 'demo',
            timestamp: new Date('2024-01-18'),
            participants: ['John Smith', 'Sales Team'],
            summary: 'Product demonstration went well, strong interest in automation features',
            outcome: 'positive',
            nextSteps: ['Send proposal', 'Schedule follow-up call']
          }
        ],
        risks: [
          {
            type: 'competition',
            severity: 'medium',
            description: 'Salesforce also in consideration',
            mitigation: 'Emphasize cost-effectiveness and ease of use',
            probability: 40
          }
        ],
        nextSteps: ['Finalize proposal', 'Address CFO concerns', 'Schedule decision meeting'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-18')
      }
    ];

    sampleOpportunities.forEach(opp => this.opportunities.set(opp.id, opp));
    this.updateMetrics();
  }

  async processTask(task: AgentTask): Promise<void> {
    this.currentTask = task;
    this.status = 'busy';

    try {
      const thoughts: AgentThought[] = [];
      const actions: AgentAction[] = [];

      // Generate initial observation
      thoughts.push({
        id: `thought-${Date.now()}`,
        agentId: this.id,
        type: 'observation',
        content: `Processing sales task: ${task.description}`,
        timestamp: new Date(),
        confidence: 0.9,
        relatedData: { taskType: task.type, priority: task.priority }
      });

      // Process based on task type
      switch (task.type) {
        case 'lead_qualification':
          await this.qualifyLead(task, thoughts, actions);
          break;
        case 'opportunity_management':
          await this.manageOpportunity(task, thoughts, actions);
          break;
        case 'sales_forecasting':
          await this.generateForecast(task, thoughts, actions);
          break;
        case 'pipeline_analysis':
          await this.analyzePipeline(task, thoughts, actions);
          break;
        case 'competitive_analysis':
          await this.analyzeCompetition(task, thoughts, actions);
          break;
        default:
          await this.handleGenericTask(task, thoughts, actions);
      }

      // Update metrics after processing
      this.updateMetrics();
      this.generateInsights();

      // Mark task as completed
      task.status = 'completed';
      task.result = {
        success: true,
        data: {
          thoughts,
          actions,
          metrics: this.metrics,
          insights: this.insights.slice(-5) // Latest 5 insights
        }
      };

    } catch (error) {
      task.status = 'failed';
      task.result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.status = 'idle';
      this.currentTask = null;
    }
  }

  private async qualifyLead(task: AgentTask, thoughts: AgentThought[], actions: AgentAction[]): Promise<void> {
    const leadData = task.data as any;
    
    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'reasoning',
      content: `Analyzing lead qualification data using BANT methodology (Budget, Authority, Need, Timeline)`,
      timestamp: new Date(),
      confidence: 0.85,
      relatedData: { methodology: 'BANT', leadId: leadData.leadId }
    });

    // Use AI engine for qualification analysis
    const aiResponse = await this.aiEngine.processTask({
      agentType: 'sales',
      task: 'lead_qualification',
      context: {
        leadData,
        existingLeads: Array.from(this.leads.values()),
        qualificationCriteria: 'BANT methodology'
      }
    });

    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'planning',
      content: `AI analysis complete. Calculating lead score based on: Budget fit (${aiResponse.analysis.budgetScore}/25), Authority level (${aiResponse.analysis.authorityScore}/25), Need urgency (${aiResponse.analysis.needScore}/25), Timeline clarity (${aiResponse.analysis.timelineScore}/25)`,
      timestamp: new Date(),
      confidence: aiResponse.confidence,
      relatedData: aiResponse.analysis
    });

    // Calculate qualification score
    const qualificationScore = this.calculateLeadScore(leadData);
    
    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'action',
      content: `Lead qualification complete. Score: ${qualificationScore}/100. ${qualificationScore >= 70 ? 'QUALIFIED' : 'NEEDS_NURTURING'}`,
      timestamp: new Date(),
      confidence: 0.9,
      relatedData: { score: qualificationScore, status: qualificationScore >= 70 ? 'qualified' : 'nurturing' }
    });

    // Create or update lead
    const lead: Lead = {
      id: leadData.leadId || `lead-${Date.now()}`,
      name: leadData.name,
      email: leadData.email,
      company: leadData.company,
      phone: leadData.phone,
      source: leadData.source || 'unknown',
      status: qualificationScore >= 70 ? 'qualified' : 'contacted',
      score: qualificationScore,
      qualificationData: leadData.qualificationData,
      timeline: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      estimatedValue: this.estimateLeadValue(leadData),
      expectedCloseDate: this.estimateCloseDate(leadData),
      notes: []
    };

    this.leads.set(lead.id, lead);

    actions.push({
      id: `action-${Date.now()}`,
      agentId: this.id,
      type: 'lead_qualification',
      description: `Qualified lead: ${lead.name} (${lead.company})`,
      timestamp: new Date(),
      status: 'completed',
      result: {
        leadId: lead.id,
        score: qualificationScore,
        status: lead.status,
        nextSteps: this.getNextSteps(lead)
      }
    });

    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'reflection',
      content: `Lead qualification process completed successfully. ${qualificationScore >= 70 ? 'Lead is sales-ready and should be prioritized for immediate follow-up.' : 'Lead requires nurturing and should be added to drip campaign.'}`,
      timestamp: new Date(),
      confidence: 0.88,
      relatedData: { recommendedActions: this.getNextSteps(lead) }
    });
  }

  private async manageOpportunity(task: AgentTask, thoughts: AgentThought[], actions: AgentAction[]): Promise<void> {
    const oppData = task.data as any;
    
    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'observation',
      content: `Managing opportunity: ${oppData.name}. Current stage: ${oppData.stage}. Value: $${oppData.value}`,
      timestamp: new Date(),
      confidence: 0.9,
      relatedData: { opportunityId: oppData.id, stage: oppData.stage }
    });

    // Use AI engine for opportunity analysis
    const aiResponse = await this.aiEngine.processTask({
      agentType: 'sales',
      task: 'opportunity_management',
      context: {
        opportunityData: oppData,
        existingOpportunities: Array.from(this.opportunities.values()),
        marketConditions: 'stable'
      }
    });

    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'reasoning',
      content: `AI analysis reveals: Win probability ${aiResponse.analysis.winProbability}%, key risks: ${aiResponse.analysis.risks.join(', ')}, recommended actions: ${aiResponse.analysis.recommendations.join(', ')}`,
      timestamp: new Date(),
      confidence: aiResponse.confidence,
      relatedData: aiResponse.analysis
    });

    // Update or create opportunity
    const opportunity: Opportunity = {
      id: oppData.id || `opp-${Date.now()}`,
      leadId: oppData.leadId,
      name: oppData.name,
      stage: oppData.stage,
      value: oppData.value,
      probability: aiResponse.analysis.winProbability,
      expectedCloseDate: new Date(oppData.expectedCloseDate),
      products: oppData.products || [],
      competitors: oppData.competitors || [],
      decisionCriteria: oppData.decisionCriteria || [],
      stakeholders: oppData.stakeholders || [],
      activities: oppData.activities || [],
      risks: this.identifyOpportunityRisks(oppData),
      nextSteps: aiResponse.analysis.recommendations,
      createdAt: oppData.createdAt ? new Date(oppData.createdAt) : new Date(),
      updatedAt: new Date()
    };

    this.opportunities.set(opportunity.id, opportunity);

    actions.push({
      id: `action-${Date.now()}`,
      agentId: this.id,
      type: 'opportunity_update',
      description: `Updated opportunity: ${opportunity.name}`,
      timestamp: new Date(),
      status: 'completed',
      result: {
        opportunityId: opportunity.id,
        stage: opportunity.stage,
        probability: opportunity.probability,
        nextSteps: opportunity.nextSteps
      }
    });

    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'reflection',
      content: `Opportunity management complete. Win probability: ${opportunity.probability}%. Key focus areas: ${opportunity.nextSteps.slice(0, 3).join(', ')}`,
      timestamp: new Date(),
      confidence: 0.85,
      relatedData: { opportunityHealth: this.assessOpportunityHealth(opportunity) }
    });
  }

  private async generateForecast(task: AgentTask, thoughts: AgentThought[], actions: AgentAction[]): Promise<void> {
    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'observation',
      content: `Generating sales forecast for ${task.data?.period || 'current quarter'}`,
      timestamp: new Date(),
      confidence: 0.9
    });

    const opportunities = Array.from(this.opportunities.values());
    const forecastData = this.calculateForecast(opportunities);

    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'reasoning',
      content: `Analyzing ${opportunities.length} opportunities. Total pipeline value: $${forecastData.pipelineValue}. Weighted forecast: $${forecastData.weightedForecast}`,
      timestamp: new Date(),
      confidence: 0.8,
      relatedData: forecastData
    });

    actions.push({
      id: `action-${Date.now()}`,
      agentId: this.id,
      type: 'forecast_generation',
      description: `Generated sales forecast`,
      timestamp: new Date(),
      status: 'completed',
      result: forecastData
    });

    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'reflection',
      content: `Forecast confidence: ${forecastData.confidence}%. Key drivers: ${forecastData.keyDrivers.join(', ')}`,
      timestamp: new Date(),
      confidence: forecastData.confidence / 100
    });
  }

  private async analyzePipeline(task: AgentTask, thoughts: AgentThought[], actions: AgentAction[]): Promise<void> {
    const pipelineAnalysis = this.performPipelineAnalysis();
    
    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'observation',
      content: `Analyzing sales pipeline: ${pipelineAnalysis.totalOpportunities} opportunities, $${pipelineAnalysis.totalValue} total value`,
      timestamp: new Date(),
      confidence: 0.9
    });

    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'reasoning',
      content: `Pipeline health indicators: Conversion rate ${pipelineAnalysis.conversionRate}%, Average deal size $${pipelineAnalysis.averageDealSize}, Sales cycle ${pipelineAnalysis.averageSalesCycle} days`,
      timestamp: new Date(),
      confidence: 0.85,
      relatedData: pipelineAnalysis
    });

    actions.push({
      id: `action-${Date.now()}`,
      agentId: this.id,
      type: 'pipeline_analysis',
      description: `Completed pipeline analysis`,
      timestamp: new Date(),
      status: 'completed',
      result: pipelineAnalysis
    });
  }

  private async analyzeCompetition(task: AgentTask, thoughts: AgentThought[], actions: AgentAction[]): Promise<void> {
    const competitiveAnalysis = this.performCompetitiveAnalysis();
    
    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'observation',
      content: `Analyzing competitive landscape: ${competitiveAnalysis.competitors.length} main competitors identified`,
      timestamp: new Date(),
      confidence: 0.8
    });

    actions.push({
      id: `action-${Date.now()}`,
      agentId: this.id,
      type: 'competitive_analysis',
      description: `Completed competitive analysis`,
      timestamp: new Date(),
      status: 'completed',
      result: competitiveAnalysis
    });
  }

  private async handleGenericTask(task: AgentTask, thoughts: AgentThought[], actions: AgentAction[]): Promise<void> {
    const aiResponse = await this.aiEngine.processTask({
      agentType: 'sales',
      task: 'general',
      context: {
        task: task.description,
        data: task.data,
        leads: Array.from(this.leads.values()),
        opportunities: Array.from(this.opportunities.values())
      }
    });

    thoughts.push({
      id: `thought-${Date.now()}`,
      agentId: this.id,
      type: 'reasoning',
      content: aiResponse.reasoning,
      timestamp: new Date(),
      confidence: aiResponse.confidence
    });

    actions.push({
      id: `action-${Date.now()}`,
      agentId: this.id,
      type: 'general_task',
      description: task.description,
      timestamp: new Date(),
      status: 'completed',
      result: aiResponse.result
    });
  }

  private calculateLeadScore(leadData: any): number {
    let score = 0;
    
    // Budget score (25 points)
    const budgetRanges = {
      'under_1k': 5,
      '1k_5k': 10,
      '5k_25k': 15,
      '25k_100k': 20,
      'over_100k': 25
    };
    score += budgetRanges[leadData.qualificationData?.budget?.range as keyof typeof budgetRanges] || 0;
    if (leadData.qualificationData?.budget?.confirmed) score += 5;

    // Authority score (25 points)
    const authorityLevels = {
      'gatekeeper': 5,
      'user': 10,
      'influencer': 15,
      'decision_maker': 25
    };
    score += authorityLevels[leadData.qualificationData?.authority?.level as keyof typeof authorityLevels] || 0;

    // Need score (25 points)
    const priorities = {
      'low': 5,
      'medium': 10,
      'high': 20,
      'critical': 25
    };
    score += priorities[leadData.qualificationData?.need?.priority as keyof typeof priorities] || 0;

    // Timeline score (25 points)
    const urgency = {
      'exploring': 5,
      'next_year': 8,
      'next_quarter': 15,
      'this_quarter': 20,
      'immediate': 25
    };
    score += urgency[leadData.qualificationData?.budget?.urgency as keyof typeof urgency] || 0;

    return Math.min(score, 100);
  }

  private estimateLeadValue(leadData: any): number {
    const budgetRanges = {
      'under_1k': 750,
      '1k_5k': 3000,
      '5k_25k': 15000,
      '25k_100k': 60000,
      'over_100k': 150000
    };
    return budgetRanges[leadData.qualificationData?.budget?.range as keyof typeof budgetRanges] || 10000;
  }

  private estimateCloseDate(leadData: any): Date {
    const urgencyDays = {
      'immediate': 30,
      'this_quarter': 60,
      'next_quarter': 120,
      'next_year': 365,
      'exploring': 180
    };
    const days = urgencyDays[leadData.qualificationData?.budget?.urgency as keyof typeof urgencyDays] || 90;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private getNextSteps(lead: Lead): string[] {
    const steps = [];
    
    if (lead.score >= 80) {
      steps.push('Schedule demo immediately');
      steps.push('Prepare customized proposal');
    } else if (lead.score >= 60) {
      steps.push('Conduct needs assessment call');
      steps.push('Send relevant case studies');
    } else {
      steps.push('Add to nurture campaign');
      steps.push('Schedule follow-up in 2 weeks');
    }
    
    return steps;
  }

  private identifyOpportunityRisks(oppData: any): OpportunityRisk[] {
    const risks: OpportunityRisk[] = [];
    
    if (oppData.competitors?.length > 0) {
      risks.push({
        type: 'competition',
        severity: 'medium',
        description: `Competing against ${oppData.competitors.join(', ')}`,
        mitigation: 'Emphasize unique value proposition',
        probability: 50
      });
    }
    
    if (oppData.value > 50000) {
      risks.push({
        type: 'budget',
        severity: 'medium',
        description: 'High-value deal may require additional approvals',
        mitigation: 'Identify all stakeholders early',
        probability: 30
      });
    }
    
    return risks;
  }

  private assessOpportunityHealth(opportunity: Opportunity): string {
    if (opportunity.probability >= 80) return 'excellent';
    if (opportunity.probability >= 60) return 'good';
    if (opportunity.probability >= 40) return 'fair';
    return 'poor';
  }

  private calculateForecast(opportunities: Opportunity[]) {
    const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
    const weightedForecast = opportunities.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0);
    
    return {
      pipelineValue: totalValue,
      weightedForecast: Math.round(weightedForecast),
      confidence: 75,
      keyDrivers: ['Product fit', 'Market timing', 'Competitive positioning'],
      riskFactors: ['Economic uncertainty', 'Competition', 'Budget constraints']
    };
  }

  private performPipelineAnalysis() {
    const opportunities = Array.from(this.opportunities.values());
    const leads = Array.from(this.leads.values());
    
    return {
      totalOpportunities: opportunities.length,
      totalValue: opportunities.reduce((sum, opp) => sum + opp.value, 0),
      averageDealSize: opportunities.length > 0 ? opportunities.reduce((sum, opp) => sum + opp.value, 0) / opportunities.length : 0,
      conversionRate: leads.length > 0 ? (opportunities.length / leads.length) * 100 : 0,
      averageSalesCycle: 45, // days
      stageDistribution: this.getStageDistribution(opportunities)
    };
  }

  private getStageDistribution(opportunities: Opportunity[]) {
    const distribution: Record<string, number> = {};
    opportunities.forEach(opp => {
      distribution[opp.stage] = (distribution[opp.stage] || 0) + 1;
    });
    return distribution;
  }

  private performCompetitiveAnalysis() {
    const opportunities = Array.from(this.opportunities.values());
    const competitors = new Set<string>();
    
    opportunities.forEach(opp => {
      opp.competitors.forEach(comp => competitors.add(comp));
    });
    
    return {
      competitors: Array.from(competitors),
      competitiveDeals: opportunities.filter(opp => opp.competitors.length > 0).length,
      winRateAgainstCompetitors: 65, // percentage
      commonCompetitors: ['Salesforce', 'HubSpot', 'Pipedrive']
    };
  }

  private updateMetrics() {
    const leads = Array.from(this.leads.values());
    const opportunities = Array.from(this.opportunities.values());
    
    this.metrics = {
      totalLeads: leads.length,
      qualifiedLeads: leads.filter(lead => lead.score >= 70).length,
      conversionRate: leads.length > 0 ? (opportunities.length / leads.length) * 100 : 0,
      averageDealSize: opportunities.length > 0 ? opportunities.reduce((sum, opp) => sum + opp.value, 0) / opportunities.length : 0,
      salesCycleLength: 45, // days
      winRate: 65, // percentage
      pipelineValue: opportunities.reduce((sum, opp) => sum + opp.value, 0),
      forecastAccuracy: 85, // percentage
      activityMetrics: {
        callsPerDay: 12,
        emailsPerDay: 25,
        meetingsPerWeek: 8,
        demosPerWeek: 4
      }
    };
  }

  private generateInsights() {
    const insights: SalesInsight[] = [];
    
    // High-value opportunity insight
    const highValueOpps = Array.from(this.opportunities.values()).filter(opp => opp.value > 40000);
    if (highValueOpps.length > 0) {
      insights.push({
        type: 'opportunity',
        priority: 'high',
        title: 'High-Value Opportunities Identified',
        description: `${highValueOpps.length} opportunities worth over $40,000 require immediate attention`,
        impact: `Potential revenue of $${highValueOpps.reduce((sum, opp) => sum + opp.value, 0)}`,
        action: 'Prioritize these deals and assign senior sales reps',
        confidence: 85,
        relatedLeads: [],
        relatedOpportunities: highValueOpps.map(opp => opp.id)
      });
    }
    
    // At-risk deals insight
    const atRiskDeals = Array.from(this.opportunities.values()).filter(opp => opp.probability < 50 && opp.value > 20000);
    if (atRiskDeals.length > 0) {
      insights.push({
        type: 'risk',
        priority: 'critical',
        title: 'At-Risk High-Value Deals',
        description: `${atRiskDeals.length} high-value deals have low win probability`,
        impact: `Risk of losing $${atRiskDeals.reduce((sum, opp) => sum + opp.value, 0)} in revenue`,
        action: 'Implement recovery strategies and senior management involvement',
        confidence: 90,
        relatedLeads: [],
        relatedOpportunities: atRiskDeals.map(opp => opp.id)
      });
    }
    
    this.insights = insights;
  }

  // Public methods for external access
  getLeads(): Lead[] {
    return Array.from(this.leads.values());
  }

  getOpportunities(): Opportunity[] {
    return Array.from(this.opportunities.values());
  }

  getMetrics(): SalesMetrics {
    return this.metrics;
  }

  getInsights(): SalesInsight[] {
    return this.insights;
  }

  getLead(id: string): Lead | undefined {
    return this.leads.get(id);
  }

  getOpportunity(id: string): Opportunity | undefined {
    return this.opportunities.get(id);
  }
} 