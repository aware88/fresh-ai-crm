import { AgentTask, AgentState, AgentAction, AgentResponse } from './types';
import { aiEngine, AIProcessingContext } from './ai-engine';
import { createClient } from '@/lib/supabase/client';
import { getPersonalityDataForPrompt } from '@/lib/personality/data';
import { loadCsvData } from '@/lib/personality/flexible-data';
import { getMatchingSalesTactics, formatSalesTacticsForAIContext } from '@/lib/ai/sales-tactics';

export interface EmailAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  category: 'inquiry' | 'complaint' | 'order' | 'support' | 'sales' | 'other';
  personalityTraits: {
    formality: number; // 0-1 scale
    directness: number; // 0-1 scale
    emotionalTone: number; // 0-1 scale
    technicalLevel: number; // 0-1 scale
  };
  keyPoints: string[];
  requiredActions: string[];
  suggestedResponse: string;
  confidence: number;
}

export interface EmailContext {
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: Date;
  threadId?: string;
  previousEmails?: EmailContext[];
  customerData?: any;
  attachments?: any[];
}

export interface EmailResponseOptions {
  tone: 'professional' | 'friendly' | 'formal' | 'casual';
  length: 'brief' | 'detailed' | 'comprehensive';
  includeAttachments: boolean;
  scheduleFollowUp: boolean;
  escalateToHuman: boolean;
}

export class EmailAgent {
  private agentId: string;
  private personalityProfiles: Map<string, any> = new Map();
  private supabase: any;

  constructor(agentId: string) {
    this.agentId = agentId;
    this.supabase = createClient();
  }

  async analyzeEmail(emailContext: EmailContext): Promise<EmailAnalysis> {
    // Get comprehensive data from database
    const comprehensiveData = await this.getComprehensiveDataContext(emailContext.from, emailContext.body);
    
    const analysisPrompt = this.buildAnalysisPrompt(emailContext, comprehensiveData);
    
    const analysis = await aiEngine.getLLMProvider().generateStructuredResponse(analysisPrompt, {
      type: 'email_analysis',
      fields: ['sentiment', 'urgency', 'category', 'personalityTraits', 'keyPoints', 'requiredActions', 'suggestedResponse', 'confidence']
    });

    // Store personality profile for future reference
    this.personalityProfiles.set(emailContext.from, analysis.personalityTraits);

    return {
      sentiment: analysis.sentiment || 'neutral',
      urgency: analysis.urgency || 'medium',
      category: analysis.category || 'inquiry',
      personalityTraits: analysis.personalityTraits || {
        formality: 0.5,
        directness: 0.5,
        emotionalTone: 0.5,
        technicalLevel: 0.5
      },
      keyPoints: analysis.keyPoints || [],
      requiredActions: analysis.requiredActions || [],
      suggestedResponse: analysis.suggestedResponse || '',
      confidence: analysis.confidence || 0.7
    };
  }

  async generateResponse(
    emailContext: EmailContext,
    analysis: EmailAnalysis,
    options: EmailResponseOptions = {
      tone: 'professional',
      length: 'detailed',
      includeAttachments: false,
      scheduleFollowUp: false,
      escalateToHuman: false
    }
  ): Promise<{
    subject: string;
    body: string;
    attachments?: any[];
    followUpDate?: Date;
    confidence: number;
  }> {
    // Get comprehensive data for response generation
    const comprehensiveData = await this.getComprehensiveDataContext(emailContext.from, emailContext.body);
    
    const responsePrompt = this.buildResponsePrompt(emailContext, analysis, options, comprehensiveData);
    
    const response = await aiEngine.getLLMProvider().generateCompletion(responsePrompt);
    
    // Extract subject and body from response
    const { subject, body } = this.parseEmailResponse(response, emailContext);
    
    return {
      subject,
      body,
      attachments: options.includeAttachments ? [] : undefined,
      followUpDate: options.scheduleFollowUp ? this.calculateFollowUpDate(analysis.urgency) : undefined,
      confidence: analysis.confidence * 0.9 // Slightly lower confidence for generated response
    };
  }

  async processEmailTask(task: AgentTask, agent: AgentState): Promise<AgentResponse> {
    const emailContext: EmailContext = task.input.emailContext;
    const options: EmailResponseOptions = task.input.options || {};

    try {
      // Step 1: Analyze the email
      const analysis = await this.analyzeEmail(emailContext);
      
      // Step 2: Check if human escalation is needed
      if (this.shouldEscalateToHuman(analysis)) {
        return {
          success: false,
          error: 'Email requires human attention',
          thoughts: [{
            id: Date.now().toString(),
            agentId: agent.id,
            timestamp: new Date(),
            type: 'reasoning',
            content: `Email escalated to human due to: ${analysis.urgency === 'urgent' ? 'urgent priority' : 'complex content'}`,
            metadata: { escalated: true, analysis }
          }]
        };
      }

      // Step 3: Generate response
      const responseData = await this.generateResponse(emailContext, analysis, options);
      
      // Step 4: Prepare actions
      const actions: AgentAction[] = [];
      
      // Send email action
      actions.push({
        id: Date.now().toString(),
        type: 'email_send',
        parameters: {
          to: emailContext.from,
          subject: responseData.subject,
          body: responseData.body,
          attachments: responseData.attachments,
          threadId: emailContext.threadId
        },
        timestamp: new Date(),
        status: 'pending'
      });

      // Schedule follow-up if needed
      if (responseData.followUpDate) {
        actions.push({
          id: (Date.now() + 1).toString(),
          type: 'schedule_followup',
          parameters: {
            customerEmail: emailContext.from,
            followUpDate: responseData.followUpDate,
            context: 'email_response'
          },
          timestamp: new Date(),
          status: 'pending'
        });
      }

      // Update customer data
      actions.push({
        id: (Date.now() + 2).toString(),
        type: 'update_customer_data',
        parameters: {
          customerEmail: emailContext.from,
          personalityProfile: analysis.personalityTraits,
          lastInteraction: new Date(),
          sentiment: analysis.sentiment
        },
        timestamp: new Date(),
        status: 'pending'
      });

      return {
        success: true,
        data: {
          analysis,
          response: responseData,
          actionsPlanned: actions.length
        },
        thoughts: [
          {
            id: Date.now().toString(),
            agentId: agent.id,
            timestamp: new Date(),
            type: 'observation',
            content: `Analyzed email from ${emailContext.from} with ${analysis.sentiment} sentiment and ${analysis.urgency} urgency`,
            metadata: { analysis }
          },
          {
            id: (Date.now() + 1).toString(),
            agentId: agent.id,
            timestamp: new Date(),
            type: 'reasoning',
            content: `Generated ${options.tone} response with ${responseData.confidence * 100}% confidence`,
            metadata: { responseData }
          }
        ],
        actions
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in email processing',
        thoughts: [{
          id: Date.now().toString(),
          agentId: agent.id,
          timestamp: new Date(),
          type: 'reflection',
          content: `Email processing failed: ${error}`,
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        }]
      };
    }
  }

  /**
   * Get comprehensive data from database for AI analysis and response generation
   */
  private async getComprehensiveDataContext(senderEmail: string, emailContent: string) {
    try {
      // 1. Get personality profiles from CSV/database
      const personalityProfiles = getPersonalityDataForPrompt();
      const flexibleProfiles = loadCsvData('personality_profiles');
      
      // 2. Get contact information and AI profiler data
      let contactContext = null;
      let aiProfilerData = null;
      let salesTactics: any[] = [];
      
      if (senderEmail) {
        // Get contact with AI profiler relationship
        const { data: contact } = await this.supabase
          .from('contacts')
          .select(`
            id,
            firstname,
            lastname,
            email,
            company,
            position,
            personalitytype,
            personalityanalysis,
            personalitynotes,
            lastinteraction,
            notes,
            ai_profiler_id,
            ai_profiler (
              id,
              Personality_Type,
              Traits,
              Sales_Strategy,
              Messaging_Do,
              Messaging_Dont,
              Common_Biases,
              Emotional_Trigger,
              Objection,
              Reframe,
              Copywriting_Style,
              Tone_Preference,
              Best_CTA_Type,
              Preferred_Visual_Format,
              Trigger_Signal_Keywords,
              Follow_Up_Timing,
              Suggested_Subject_Lines,
              Cognitive_Bias,
              Bias_Use_Tip,
              Reading_Style,
              Stress_Response,
              Top_Trigger_Words,
              Avoid_Words,
              Emotional_Intent,
              Cultural_Tone,
              Lead_Score,
              Conversion_Likelihood,
              Scraped_Signal_Summary,
              Recommended_Channel,
              Estimated_Deal_Tier
            )
          `)
          .eq('email', senderEmail)
          .single();
        
        if (contact) {
          contactContext = {
            id: contact.id,
            name: `${contact.firstname || ''} ${contact.lastname || ''}`.trim(),
            email: contact.email,
            company: contact.company,
            position: contact.position,
            personalityType: contact.personalitytype,
            personalityAnalysis: contact.personalityanalysis,
            personalityNotes: contact.personalitynotes,
            lastInteraction: contact.lastinteraction,
            notes: contact.notes,
            aiProfilerId: contact.ai_profiler_id
          };
          
          // Extract AI profiler data
          if (contact.ai_profiler) {
            aiProfilerData = contact.ai_profiler;
            
            // 3. Get matching sales tactics based on personality profile
            try {
              salesTactics = await getMatchingSalesTactics(
                contact.ai_profiler,
                { subject: '', content: emailContent }
              );
            } catch (error) {
              console.error('Error fetching sales tactics:', error);
            }
          }
        }
      }
      
      // 4. Get contact analysis history
      let analysisHistory = [];
      if (contactContext?.id) {
        try {
          const { data: history } = await this.supabase
            .from('contact_analysis_history')
            .select('*')
            .eq('contact_id', contactContext.id)
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (history) {
            analysisHistory = history;
          }
        } catch (error) {
          console.error('Error fetching analysis history:', error);
        }
      }
      
      return {
        personalityProfiles,
        flexibleProfiles,
        contactContext,
        aiProfilerData,
        salesTactics,
        analysisHistory
      };
    } catch (error) {
      console.error('Error getting comprehensive data context:', error);
      return {
        personalityProfiles: '',
        flexibleProfiles: [],
        contactContext: null,
        aiProfilerData: null,
        salesTactics: [],
        analysisHistory: []
      };
    }
  }

  private buildAnalysisPrompt(emailContext: EmailContext, comprehensiveData: any): string {
    const previousPersonality = this.personalityProfiles.get(emailContext.from);
    
    return `Analyze this email for sentiment, urgency, and personality traits:

FROM: ${emailContext.from}
TO: ${emailContext.to}
SUBJECT: ${emailContext.subject}
BODY: ${emailContext.body}

${previousPersonality ? `PREVIOUS PERSONALITY ANALYSIS: ${JSON.stringify(previousPersonality)}` : ''}

${comprehensiveData.contactContext ? `CONTACT CONTEXT:
Name: ${comprehensiveData.contactContext.name}
Company: ${comprehensiveData.contactContext.company || 'Not specified'}
Position: ${comprehensiveData.contactContext.position || 'Not specified'}
Personality Type: ${comprehensiveData.contactContext.personalityType || 'Not analyzed'}
Last Interaction: ${comprehensiveData.contactContext.lastInteraction || 'Not available'}
Notes: ${comprehensiveData.contactContext.notes || 'No notes available'}

${comprehensiveData.contactContext.personalityAnalysis ? `PERSONALITY ANALYSIS:
${JSON.stringify(comprehensiveData.contactContext.personalityAnalysis, null, 2)}` : ''}

${comprehensiveData.contactContext.personalityNotes ? `PERSONALITY NOTES:
${comprehensiveData.contactContext.personalityNotes}` : ''}` : ''}

${comprehensiveData.aiProfilerData ? `AI PROFILER DATA:
Personality Type: ${comprehensiveData.aiProfilerData.Personality_Type || 'Not specified'}
Traits: ${comprehensiveData.aiProfilerData.Traits || 'Not specified'}
Sales Strategy: ${comprehensiveData.aiProfilerData.Sales_Strategy || 'Not specified'}
Messaging Do: ${comprehensiveData.aiProfilerData.Messaging_Do || 'Not specified'}
Messaging Don't: ${comprehensiveData.aiProfilerData.Messaging_Dont || 'Not specified'}
Emotional Trigger: ${comprehensiveData.aiProfilerData.Emotional_Trigger || 'Not specified'}
Tone Preference: ${comprehensiveData.aiProfilerData.Tone_Preference || 'Not specified'}
Best CTA Type: ${comprehensiveData.aiProfilerData.Best_CTA_Type || 'Not specified'}
Trigger Keywords: ${comprehensiveData.aiProfilerData.Trigger_Signal_Keywords || 'Not specified'}
Avoid Words: ${comprehensiveData.aiProfilerData.Avoid_Words || 'Not specified'}
Lead Score: ${comprehensiveData.aiProfilerData.Lead_Score || 'Not specified'}
Conversion Likelihood: ${comprehensiveData.aiProfilerData.Conversion_Likelihood || 'Not specified'}` : ''}

${comprehensiveData.salesTactics.length > 0 ? `RELEVANT SALES TACTICS:
${comprehensiveData.salesTactics.map((tactic: any, index: number) => 
  `${index + 1}. ${tactic.category}: "${tactic.tactical_snippet}" (Expert: ${tactic.expert})`
).join('\n')}` : ''}

${comprehensiveData.analysisHistory.length > 0 ? `ANALYSIS HISTORY:
${comprehensiveData.analysisHistory.map((history: any, index: number) => 
  `${index + 1}. ${history.created_at}: ${history.analysis_summary || 'No summary'}`
).join('\n')}` : ''}

${comprehensiveData.personalityProfiles ? `PERSONALITY PROFILES REFERENCE:
${comprehensiveData.personalityProfiles}` : ''}

${emailContext.previousEmails ? `PREVIOUS EMAILS IN THREAD:
${emailContext.previousEmails.map(email => `- ${email.subject}: ${email.body.substring(0, 100)}...`).join('\n')}` : ''}

Please analyze:
1. Sentiment (positive/negative/neutral)
2. Urgency level (low/medium/high/urgent)
3. Category (inquiry/complaint/order/support/sales/other)
4. Personality traits (formality, directness, emotional tone, technical level - all 0-1 scale)
5. Key points mentioned
6. Required actions
7. Suggested response approach
8. Confidence level

Provide detailed analysis focusing on understanding the sender's communication style and needs, leveraging ALL available data including personality profiles, AI profiler data, sales tactics, and analysis history.`;
  }

  private buildResponsePrompt(emailContext: EmailContext, analysis: EmailAnalysis, options: EmailResponseOptions, comprehensiveData: any): string {
    const personalityProfile = this.personalityProfiles.get(emailContext.from);
    
    return `Generate a ${options.tone} email response based on this analysis:

ORIGINAL EMAIL:
From: ${emailContext.from}
Subject: ${emailContext.subject}
Body: ${emailContext.body}

ANALYSIS:
- Sentiment: ${analysis.sentiment}
- Urgency: ${analysis.urgency}
- Category: ${analysis.category}
- Key Points: ${analysis.keyPoints.join(', ')}
- Required Actions: ${analysis.requiredActions.join(', ')}

SENDER PERSONALITY:
- Formality: ${personalityProfile?.formality || 0.5}
- Directness: ${personalityProfile?.directness || 0.5}
- Emotional Tone: ${personalityProfile?.emotionalTone || 0.5}
- Technical Level: ${personalityProfile?.technicalLevel || 0.5}

${comprehensiveData.contactContext ? `CONTACT CONTEXT:
Name: ${comprehensiveData.contactContext.name}
Company: ${comprehensiveData.contactContext.company || 'Not specified'}
Position: ${comprehensiveData.contactContext.position || 'Not specified'}
Personality Type: ${comprehensiveData.contactContext.personalityType || 'Not analyzed'}
Last Interaction: ${comprehensiveData.contactContext.lastInteraction || 'Not available'}
Notes: ${comprehensiveData.contactContext.notes || 'No notes available'}

${comprehensiveData.contactContext.personalityAnalysis ? `PERSONALITY ANALYSIS:
${JSON.stringify(comprehensiveData.contactContext.personalityAnalysis, null, 2)}` : ''}

${comprehensiveData.contactContext.personalityNotes ? `PERSONALITY NOTES:
${comprehensiveData.contactContext.personalityNotes}` : ''}` : ''}

${comprehensiveData.aiProfilerData ? `AI PROFILER DATA:
Personality Type: ${comprehensiveData.aiProfilerData.Personality_Type || 'Not specified'}
Sales Strategy: ${comprehensiveData.aiProfilerData.Sales_Strategy || 'Not specified'}
Messaging Do: ${comprehensiveData.aiProfilerData.Messaging_Do || 'Not specified'}
Messaging Don't: ${comprehensiveData.aiProfilerData.Messaging_Dont || 'Not specified'}
Emotional Trigger: ${comprehensiveData.aiProfilerData.Emotional_Trigger || 'Not specified'}
Tone Preference: ${comprehensiveData.aiProfilerData.Tone_Preference || 'Not specified'}
Best CTA Type: ${comprehensiveData.aiProfilerData.Best_CTA_Type || 'Not specified'}
Trigger Keywords: ${comprehensiveData.aiProfilerData.Trigger_Signal_Keywords || 'Not specified'}
Avoid Words: ${comprehensiveData.aiProfilerData.Avoid_Words || 'Not specified'}
Lead Score: ${comprehensiveData.aiProfilerData.Lead_Score || 'Not specified'}
Conversion Likelihood: ${comprehensiveData.aiProfilerData.Conversion_Likelihood || 'Not specified'}` : ''}

${comprehensiveData.salesTactics.length > 0 ? `RELEVANT SALES TACTICS:
${comprehensiveData.salesTactics.map((tactic: any, index: number) => 
  `${index + 1}. ${tactic.category}: "${tactic.tactical_snippet}" (Expert: ${tactic.expert})`
).join('\n')}` : ''}

${comprehensiveData.analysisHistory.length > 0 ? `ANALYSIS HISTORY:
${comprehensiveData.analysisHistory.map((history: any, index: number) => 
  `${index + 1}. ${history.created_at}: ${history.analysis_summary || 'No summary'}`
).join('\n')}` : ''}

${comprehensiveData.personalityProfiles ? `PERSONALITY PROFILES REFERENCE:
${comprehensiveData.personalityProfiles}` : ''}

RESPONSE REQUIREMENTS:
- Tone: ${options.tone}
- Length: ${options.length}
- Address all key points
- Match sender's communication style
- Use personality insights to tailor your response
- Incorporate relevant sales tactics naturally
- Consider their communication preferences and history
- Be helpful and professional
- Leverage ALL available data for optimal response

Generate a complete email response with subject line and body. Format as:
SUBJECT: [subject line]
BODY: [email body]`;
  }

  private parseEmailResponse(response: string, originalContext: EmailContext): { subject: string; body: string } {
    const subjectMatch = response.match(/SUBJECT:\s*(.+)/);
    const bodyMatch = response.match(/BODY:\s*([\s\S]+)/);
    
    return {
      subject: subjectMatch ? subjectMatch[1].trim() : `Re: ${originalContext.subject}`,
      body: bodyMatch ? bodyMatch[1].trim() : response
    };
  }

  private shouldEscalateToHuman(analysis: EmailAnalysis): boolean {
    // Escalate if urgency is urgent or confidence is too low
    return analysis.urgency === 'urgent' || 
           analysis.confidence < 0.6 || 
           analysis.category === 'complaint' ||
           analysis.keyPoints.some(point => 
             point.toLowerCase().includes('legal') ||
             point.toLowerCase().includes('lawsuit') ||
             point.toLowerCase().includes('refund') ||
             point.toLowerCase().includes('cancel')
           );
  }

  private calculateFollowUpDate(urgency: string): Date {
    const now = new Date();
    const followUpDate = new Date(now);
    
    switch (urgency) {
      case 'urgent':
        followUpDate.setHours(now.getHours() + 4);
        break;
      case 'high':
        followUpDate.setDate(now.getDate() + 1);
        break;
      case 'medium':
        followUpDate.setDate(now.getDate() + 3);
        break;
      case 'low':
        followUpDate.setDate(now.getDate() + 7);
        break;
    }
    
    return followUpDate;
  }

  // Integration methods
  async sendEmail(emailData: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // This would integrate with your existing email service
    // For now, return mock success
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      messageId: `msg_${Date.now()}`,
    };
  }

  async updateCustomerData(customerData: any): Promise<{ success: boolean; error?: string }> {
    // This would integrate with your existing CRM database
    // For now, return mock success
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { success: true };
  }

  async scheduleFollowUp(followUpData: any): Promise<{ success: boolean; error?: string }> {
    // This would integrate with your existing scheduling system
    // For now, return mock success
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return { success: true };
  }

  // Analytics and insights
  getPersonalityInsights(): { email: string; traits: any }[] {
    return Array.from(this.personalityProfiles.entries()).map(([email, traits]) => ({
      email,
      traits
    }));
  }

  getEmailStats(): {
    totalProcessed: number;
    averageConfidence: number;
    escalationRate: number;
    responseTimeMs: number;
  } {
    // Mock stats - in real implementation, track these metrics
    return {
      totalProcessed: 42,
      averageConfidence: 0.85,
      escalationRate: 0.12,
      responseTimeMs: 2500
    };
  }
}

// Export singleton instance
export const emailAgent = new EmailAgent('email-agent-1'); 