import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getServerSession } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

interface AnalysisResult {
  analysis: {
    personality: {
      traits: string[];
      communication_style: string;
      tone: string;
    };
    context: {
      relationship_type: string;
      urgency_level: string;
      topic_category: string;
    };
    insights: {
      key_points: string[];
      sentiment: string;
      intent: string;
    };
    recommendations: {
      response_suggestions: string[];
      next_steps: string[];
    };
  };
}

interface SalesAnalysisResult {
  analysis: {
    lead_qualification: {
      score: number;
      level: string;
      reasoning: string;
    };
    opportunity_assessment: {
      potential_value: string;
      timeline: string;
      decision_maker: string;
      budget_indicators: string[];
    };
    sales_insights: {
      pain_points: string[];
      buying_signals: string[];
      objection_likelihood: string;
    };
    recommendations: {
      next_actions: string[];
      approach: string;
      urgency: string;
    };
  };
}

interface EmailInfo {
  from: string;
  subject: string;
}

interface ContactData {
  id?: string;
  email: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  position?: string;
  personalitytype?: string;
  personalitynotes?: string;
  notes?: string;
  status?: string;
}

export class ContactAnalysisService {
  private static instance: ContactAnalysisService;
  private supabase = createServiceRoleClient();

  static getInstance(): ContactAnalysisService {
    if (!ContactAnalysisService.instance) {
      ContactAnalysisService.instance = new ContactAnalysisService();
    }
    return ContactAnalysisService.instance;
  }

  /**
   * Extracts name from email address if not provided
   */
  private extractNameFromEmail(email: string): { firstName: string; lastName: string } {
    const localPart = email.split('@')[0];
    const nameParts = localPart.split(/[\.\-_]/);
    
    let firstName = '';
    let lastName = '';
    
    if (nameParts.length >= 2) {
      firstName = this.capitalize(nameParts[0]);
      lastName = this.capitalize(nameParts[1]);
    } else if (nameParts.length === 1) {
      firstName = this.capitalize(nameParts[0]);
    }
    
    return { firstName, lastName };
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Formats analysis result into readable text for storage
   */
  private formatAnalysisForStorage(analysisResult?: AnalysisResult, salesResult?: SalesAnalysisResult): {
    personalityType: string;
    personalityNotes: string;
    generalNotes: string;
  } {
    let personalityType = 'Unknown';
    let personalityNotes = '';
    let generalNotes = `**Last Analysis:** ${new Date().toLocaleDateString()}`;
    
    // Handle AI Analysis results
    if (analysisResult?.analysis) {
      const { analysis } = analysisResult;
      
      // Determine personality type from traits and communication style
      const traits = analysis.personality.traits.join(', ');
      personalityType = `${analysis.personality.communication_style} (${analysis.personality.tone})`;
      
      // Format personality notes
      personalityNotes = `
**Personality Analysis:**
• Traits: ${traits}
• Communication Style: ${analysis.personality.communication_style}
• Tone: ${analysis.personality.tone}

**Context:**
• Relationship: ${analysis.context.relationship_type}
• Urgency: ${analysis.context.urgency_level}
• Category: ${analysis.context.topic_category}

**Key Insights:**
• Sentiment: ${analysis.insights.sentiment}
• Intent: ${analysis.insights.intent}
• Key Points: ${analysis.insights.key_points.join('; ')}

**Communication Recommendations:**
${analysis.recommendations.response_suggestions.map(s => `• ${s}`).join('\n')}

**Next Steps:**
${analysis.recommendations.next_steps.map(s => `• ${s}`).join('\n')}
`.trim();
      
      generalNotes = `**Last AI Analysis:** ${new Date().toLocaleDateString()}`;
    }
    
    // Handle Sales Analysis results
    if (salesResult?.analysis) {
      const { analysis: sales } = salesResult;
      
      // If we don't have personality analysis, use sales info for personality type
      if (!analysisResult && sales.lead_qualification.level) {
        personalityType = `${sales.lead_qualification.level} Lead (${sales.opportunity_assessment.potential_value} Value)`;
      }
      
      const salesNotes = `
**Sales Analysis:**
• Lead Score: ${sales.lead_qualification.score}/10 (${sales.lead_qualification.level})
• Potential Value: ${sales.opportunity_assessment.potential_value}
• Timeline: ${sales.opportunity_assessment.timeline}
• Decision Maker: ${sales.opportunity_assessment.decision_maker}

**Sales Insights:**
• Pain Points: ${sales.sales_insights.pain_points.join('; ')}
• Buying Signals: ${sales.sales_insights.buying_signals.join('; ')}
• Objection Likelihood: ${sales.sales_insights.objection_likelihood}

**Recommended Actions:**
${sales.recommendations.next_actions.map(a => `• ${a}`).join('\n')}
• Approach: ${sales.recommendations.approach}
• Urgency: ${sales.recommendations.urgency}`;

      if (analysisResult) {
        generalNotes += salesNotes;
      } else {
        generalNotes = `**Last Sales Analysis:** ${new Date().toLocaleDateString()}${salesNotes}`;
        
        // If only sales data, add basic sales insights to personality notes
        personalityNotes = `
**Sales Profile:**
• Lead Qualification: ${sales.lead_qualification.reasoning}
• Communication Approach: ${sales.recommendations.approach}
• Priority Level: ${sales.recommendations.urgency}
`.trim();
      }
    }

    return {
      personalityType,
      personalityNotes,
      generalNotes
    };
  }

  /**
   * Finds or creates a contact based on email address
   */
  async findOrCreateContact(emailInfo: EmailInfo, userId: string, organizationId?: string): Promise<ContactData | null> {
    try {
      const email = emailInfo.from;
      
      // First, try to find existing contact
      const { data: existingContact, error: findError } = await this.supabase
        .from('contacts')
        .select('*')
        .eq('email', email)
        .eq('user_id', userId)
        .maybeSingle();

      if (findError && findError.code !== 'PGRST116') {
        console.error('Error finding contact:', findError);
        return null;
      }

      if (existingContact) {
        console.log('Found existing contact:', existingContact.email);
        return existingContact;
      }

      // Extract name from email
      const { firstName, lastName } = this.extractNameFromEmail(email);

      // Create new contact
      const newContactData = {
        id: uuidv4(),
        email,
        firstname: firstName,
        lastname: lastName,
        status: 'active',
        user_id: userId,
        organization_id: organizationId || null,
      };

      const { data: newContact, error: createError } = await this.supabase
        .from('contacts')
        .insert(newContactData)
        .select()
        .single();

      if (createError) {
        console.error('Error creating contact:', createError);
        return null;
      }

      console.log('Created new contact:', newContact.email);
      return newContact;
    } catch (error) {
      console.error('Error in findOrCreateContact:', error);
      return null;
    }
  }

  /**
   * Saves AI analysis results to a contact
   */
  async saveAnalysisToContact(
    contactId: string,
    analysisResult?: AnalysisResult,
    salesResult?: SalesAnalysisResult
  ): Promise<boolean> {
    try {
      const { personalityType, personalityNotes, generalNotes } = 
        this.formatAnalysisForStorage(analysisResult, salesResult);

      // Get existing notes to append to them
      const { data: existingContact, error: fetchError } = await this.supabase
        .from('contacts')
        .select('notes')
        .eq('id', contactId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing contact:', fetchError);
        return false;
      }

      const existingNotes = existingContact?.notes || '';
      const updatedNotes = existingNotes 
        ? `${existingNotes}\n\n---\n\n${generalNotes}`
        : generalNotes;

      // Update contact with analysis results
      const { error: updateError } = await this.supabase
        .from('contacts')
        .update({
          personalitytype: personalityType,
          personalitynotes: personalityNotes,
          notes: updatedNotes,
          lastcontact: new Date().toISOString(),
          updatedat: new Date().toISOString(),
        })
        .eq('id', contactId);

      if (updateError) {
        console.error('Error updating contact with analysis:', updateError);
        return false;
      }

      console.log('Successfully saved analysis to contact:', contactId);
      return true;
    } catch (error) {
      console.error('Error in saveAnalysisToContact:', error);
      return false;
    }
  }

  /**
   * Main function to save analysis results from email
   */
  async saveEmailAnalysis(
    emailInfo: EmailInfo,
    analysisResult?: AnalysisResult,
    salesResult?: SalesAnalysisResult,
    userId?: string,
    organizationId?: string
  ): Promise<{ success: boolean; contact?: ContactData; message: string }> {
    try {
      // Use provided userId or get from session
      if (!userId) {
        const session = await getServerSession();
        if (!session?.user?.id) {
          return { success: false, message: 'User not authenticated' };
        }
        userId = session.user.id;
        organizationId = (session.user as any).organizationId;
      }

      // Find or create contact
      const contact = await this.findOrCreateContact(emailInfo, userId, organizationId);
      if (!contact) {
        return { success: false, message: 'Failed to find or create contact' };
      }

      // Save analysis to contact
      const saved = await this.saveAnalysisToContact(contact.id!, analysisResult, salesResult);
      if (!saved) {
        return { success: false, message: 'Failed to save analysis to contact' };
      }

      return { 
        success: true, 
        contact,
        message: `Analysis saved to contact: ${contact.firstname} ${contact.lastname} (${contact.email})`
      };
    } catch (error) {
      console.error('Error in saveEmailAnalysis:', error);
      return { success: false, message: 'An error occurred while saving analysis' };
    }
  }

  /**
   * Get analysis history for a contact
   */
  async getContactAnalysisHistory(contactId: string): Promise<{
    personalityType?: string;
    personalityNotes?: string;
    notes?: string;
    lastContact?: string;
  } | null> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .select('personalitytype, personalitynotes, notes, lastcontact')
        .eq('id', contactId)
        .single();

      if (error) {
        console.error('Error fetching contact analysis history:', error);
        return null;
      }

      return {
        personalityType: data.personalitytype,
        personalityNotes: data.personalitynotes,
        notes: data.notes,
        lastContact: data.lastcontact,
      };
    } catch (error) {
      console.error('Error in getContactAnalysisHistory:', error);
      return null;
    }
  }
} 