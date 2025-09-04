/**
 * Lead Scoring Service
 * Comprehensive service for contact qualification and lead scoring
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/supabase';
import type {
  LeadScore,
  LeadScoringCriteria,
  LeadScoringHistory,
  ContactWithScore,
  ScoreBreakdown,
  LeadScoringSettings,
  LeadScoringAnalytics,
  QualificationStatus,
  ScoringCategory
} from '@/types/lead-scoring';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

export class LeadScoringService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Calculate lead score for a specific contact
   */
  async calculateLeadScore(contactId: string): Promise<LeadScore | null> {
    try {
      logger.info('Calculating lead score', { contactId });

      const { data, error } = await this.supabase
        .rpc('calculate_lead_score', { contact_uuid: contactId });

      if (error) {
        logger.error('Failed to calculate lead score', error, { contactId });
        throw new Error(`Failed to calculate lead score: ${error.message}`);
      }

      if (!data || data.length === 0) {
        logger.warn('No score data returned for contact', { contactId });
        return null;
      }

      const scoreData = data[0];
      
      // Update the lead_scores table with the calculated score
      await this.updateLeadScoreRecord(contactId, scoreData);

      return scoreData as LeadScore;
    } catch (error) {
      logger.error('Error in calculateLeadScore', error, { contactId });
      throw error;
    }
  }

  /**
   * Update lead score record in database
   */
  private async updateLeadScoreRecord(contactId: string, scoreData: any): Promise<void> {
    const { error } = await this.supabase
      .rpc('update_lead_score', { 
        contact_uuid: contactId 
      });

    if (error) {
      logger.error('Failed to update lead score record', error, { contactId });
      throw new Error(`Failed to update lead score: ${error.message}`);
    }
  }

  /**
   * Get lead score for a contact
   */
  async getLeadScore(contactId: string): Promise<LeadScore | null> {
    try {
      const { data, error } = await this.supabase
        .from('lead_scores')
        .select('*')
        .eq('contact_id', contactId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error('Failed to get lead score', error, { contactId });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in getLeadScore', error, { contactId });
      throw error;
    }
  }

  /**
   * Get contacts with their lead scores
   */
  async getContactsWithScores(
    organizationId?: string,
    filters?: {
      qualification_status?: QualificationStatus[];
      min_score?: number;
      max_score?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<ContactWithScore[]> {
    try {
      let query = this.supabase
        .from('contacts')
        .select(`
          *,
          lead_score:lead_scores(*)
        `)
        .order('created_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to get contacts with scores', error, { organizationId, filters });
        throw error;
      }

      // Filter by lead score criteria if provided
      let filteredData = data || [];

      if (filters?.qualification_status || filters?.min_score || filters?.max_score) {
        filteredData = filteredData.filter(contact => {
          const leadScore = Array.isArray(contact.lead_score) 
            ? contact.lead_score[0] 
            : contact.lead_score;

          if (!leadScore) return false;

          if (filters.qualification_status && 
              !filters.qualification_status.includes(leadScore.qualification_status)) {
            return false;
          }

          if (filters.min_score && leadScore.overall_score < filters.min_score) {
            return false;
          }

          if (filters.max_score && leadScore.overall_score > filters.max_score) {
            return false;
          }

          return true;
        });
      }

      return filteredData.map(contact => ({
        ...contact,
        lead_score: Array.isArray(contact.lead_score) 
          ? contact.lead_score[0] 
          : contact.lead_score
      })) as ContactWithScore[];
    } catch (error) {
      logger.error('Error in getContactsWithScores', error, { organizationId, filters });
      throw error;
    }
  }

  /**
   * Get detailed score breakdown for a contact
   */
  async getScoreBreakdown(contactId: string): Promise<ScoreBreakdown | null> {
    try {
      const leadScore = await this.getLeadScore(contactId);
      if (!leadScore) return null;

      // Get contact details for analysis
      const { data: contact, error } = await this.supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();

      if (error) {
        logger.error('Failed to get contact for score breakdown', error, { contactId });
        throw error;
      }

      // Analyze demographic factors
      const demographicFactors: string[] = [];
      if (contact.company) demographicFactors.push('Has company information');
      if (contact.position) demographicFactors.push('Has position/title');
      if (contact.phone) demographicFactors.push('Has phone number');
      if (contact.email && !contact.email.includes('@gmail.com') && 
          !contact.email.includes('@yahoo.com')) {
        demographicFactors.push('Business email domain');
      }

      // Analyze company factors
      const companyFactors: string[] = [];
      if (contact.company) {
        if (contact.company.length > 10) {
          companyFactors.push('Established company name');
        }
        if (contact.position?.includes('director') || 
            contact.position?.includes('manager') ||
            contact.position?.includes('lead')) {
          companyFactors.push('Decision-making position');
        }
      }

      // Analyze behavioral factors
      const behavioralFactors: string[] = [];
      if (contact.notes && contact.notes.length > 50) {
        behavioralFactors.push('Detailed interaction notes');
      }
      if (contact.personalitytype) {
        behavioralFactors.push('Personality profiled');
      }
      if (contact.status === 'active') {
        behavioralFactors.push('Active status');
      }

      // Analyze recency factors
      const recencyFactors: string[] = [];
      if (contact.lastcontact) {
        const daysSinceContact = Math.floor(
          (new Date().getTime() - new Date(contact.lastcontact).getTime()) / 
          (1000 * 3600 * 24)
        );
        
        if (daysSinceContact <= 7) {
          recencyFactors.push('Recent contact (within 7 days)');
        } else if (daysSinceContact <= 30) {
          recencyFactors.push('Recent contact (within 30 days)');
        } else if (daysSinceContact <= 90) {
          recencyFactors.push('Contact within 90 days');
        }
      }

      const breakdown: ScoreBreakdown = {
        demographic: {
          score: leadScore.demographic_score,
          max: 25,
          factors: demographicFactors
        },
        behavioral: {
          score: leadScore.behavioral_score,
          max: 15,
          factors: behavioralFactors
        },
        engagement: {
          score: leadScore.engagement_score,
          max: 15,
          factors: ['Engagement tracking not implemented yet']
        },
        company: {
          score: leadScore.company_score,
          max: 20,
          factors: companyFactors
        },
        email_interaction: {
          score: leadScore.email_interaction_score,
          max: 25,
          factors: leadScore.email_interaction_score > 0 
            ? [`${Math.floor(leadScore.email_interaction_score / 3)} email interactions in last 30 days`]
            : ['No recent email interactions']
        },
        recency: {
          score: leadScore.recency_score,
          max: 15,
          factors: recencyFactors.length > 0 ? recencyFactors : ['No recent contact']
        }
      };

      return breakdown;
    } catch (error) {
      logger.error('Error in getScoreBreakdown', error, { contactId });
      throw error;
    }
  }

  /**
   * Bulk calculate scores for multiple contacts
   */
  async bulkCalculateScores(
    contactIds: string[],
    organizationId?: string
  ): Promise<{ success: number; failed: number; results: LeadScore[] }> {
    const results: LeadScore[] = [];
    let success = 0;
    let failed = 0;

    logger.info('Starting bulk score calculation', { 
      contactCount: contactIds.length, 
      organizationId 
    });

    for (const contactId of contactIds) {
      try {
        const score = await this.calculateLeadScore(contactId);
        if (score) {
          results.push(score);
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        logger.error('Failed to calculate score in bulk operation', error, { contactId });
        failed++;
      }
    }

    logger.info('Bulk score calculation completed', { 
      success, 
      failed, 
      organizationId 
    });

    return { success, failed, results };
  }

  /**
   * Get lead scoring analytics
   */
  async getLeadScoringAnalytics(organizationId?: string): Promise<LeadScoringAnalytics> {
    try {
      let baseQuery = this.supabase
        .from('contacts')
        .select('id, created_at, lead_score:lead_scores(*)');

      if (organizationId) {
        baseQuery = baseQuery.eq('organization_id', organizationId);
      }

      const { data: contacts, error } = await baseQuery;

      if (error) {
        logger.error('Failed to get analytics data', error, { organizationId });
        throw error;
      }

      const totalContacts = contacts?.length || 0;
      const scoredContacts = contacts?.filter(c => 
        (Array.isArray(c.lead_score) ? c.lead_score[0] : c.lead_score)
      ) || [];

      // Calculate qualification distribution
      const distribution = { hot: 0, warm: 0, cold: 0, unqualified: 0 };
      let totalScore = 0;

      scoredContacts.forEach(contact => {
        const score = Array.isArray(contact.lead_score) 
          ? contact.lead_score[0] 
          : contact.lead_score;
        
        if (score) {
          distribution[score.qualification_status as keyof typeof distribution]++;
          totalScore += score.overall_score;
        }
      });

      const analytics: LeadScoringAnalytics = {
        total_contacts: totalContacts,
        scored_contacts: scoredContacts.length,
        qualification_distribution: distribution,
        average_score: scoredContacts.length > 0 ? totalScore / scoredContacts.length : 0,
        score_trends: [], // TODO: Implement trend analysis
        top_scoring_factors: [] // TODO: Implement factor analysis
      };

      return analytics;
    } catch (error) {
      logger.error('Error in getLeadScoringAnalytics', error, { organizationId });
      throw error;
    }
  }

  /**
   * Get scoring history for a contact
   */
  async getScoringHistory(
    contactId: string,
    limit: number = 50
  ): Promise<LeadScoringHistory[]> {
    try {
      const { data, error } = await this.supabase
        .from('lead_scoring_history')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to get scoring history', error, { contactId });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getScoringHistory', error, { contactId });
      throw error;
    }
  }

  /**
   * Manually update a contact's qualification status
   */
  async updateQualificationStatus(
    contactId: string,
    status: QualificationStatus,
    reason?: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('lead_scores')
        .update({ 
          qualification_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('contact_id', contactId);

      if (error) {
        logger.error('Failed to update qualification status', error, { contactId, status });
        throw error;
      }

      // Log the manual change
      const { error: historyError } = await this.supabase
        .from('lead_scoring_history')
        .insert({
          contact_id: contactId,
          new_score: 0, // Status change, not score change
          score_change: 0,
          change_reason: reason || `Manual status change to ${status}`,
          triggered_by: 'manual',
          user_id: (await this.supabase.auth.getUser()).data.user?.id
        });

      if (historyError) {
        logger.warn('Failed to log qualification status change', historyError, { contactId });
      }

      logger.info('Updated qualification status', { contactId, status, reason });
    } catch (error) {
      logger.error('Error in updateQualificationStatus', error, { contactId, status });
      throw error;
    }
  }
}