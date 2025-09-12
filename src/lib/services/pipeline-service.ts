/**
 * Pipeline Management Service
 * Comprehensive service for sales pipeline and opportunity management
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import type { Database } from '@/types/supabase';
import type {
  SalesPipeline,
  PipelineStage,
  SalesOpportunity,
  OpportunityActivity,
  PipelineMetrics,
  OpportunityWithDetails,
  PipelineWithStages,
  StageWithOpportunities,
  PipelineSummary,
  PipelineAnalytics,
  CreateOpportunityForm,
  UpdateOpportunityForm,
  CreatePipelineForm,
  MoveOpportunityRequest,
  OpportunityStatus,
  OpportunityPriority
} from '@/types/pipeline';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

export class PipelineService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ===== PIPELINE MANAGEMENT =====

  /**
   * Get all pipelines for an organization
   */
  async getPipelines(organizationId?: string): Promise<PipelineWithStages[]> {
    try {
      let query = this.supabase
        .from('sales_pipelines')
        .select(`
          *,
          pipeline_stages(*)
        `)
        .eq('is_active', true)
        .order('sort_order');

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to get pipelines', error, { organizationId });
        throw error;
      }

      return (data || []).map(pipeline => ({
        ...pipeline,
        stages: (pipeline.pipeline_stages || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
      })) as PipelineWithStages[];
    } catch (error) {
      logger.error('Error in getPipelines', error, { organizationId });
      throw error;
    }
  }

  /**
   * Get a specific pipeline with its stages and opportunities
   */
  async getPipelineWithOpportunities(
    pipelineId: string,
    filters?: {
      status?: OpportunityStatus[];
      assigned_to?: string;
      priority?: OpportunityPriority[];
    }
  ): Promise<PipelineWithStages & { stages_with_opportunities: StageWithOpportunities[] }> {
    try {
      // Get pipeline with stages
      const { data: pipeline, error: pipelineError } = await this.supabase
        .from('sales_pipelines')
        .select(`
          *,
          pipeline_stages(*)
        `)
        .eq('id', pipelineId)
        .single();

      if (pipelineError) {
        logger.error('Failed to get pipeline', pipelineError, { pipelineId });
        throw pipelineError;
      }

      // Get opportunities for this pipeline
      let opportunityQuery = this.supabase
        .from('sales_opportunities')
        .select(`
          *,
          contact:contacts(*),
          lead_score:lead_scores(*),
          assigned_user:auth.users(id, email)
        `)
        .eq('pipeline_id', pipelineId);

      if (filters?.status) {
        opportunityQuery = opportunityQuery.in('status', filters.status);
      }
      if (filters?.assigned_to) {
        opportunityQuery = opportunityQuery.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.priority) {
        opportunityQuery = opportunityQuery.in('priority', filters.priority);
      }

      const { data: opportunities, error: opportunityError } = await opportunityQuery;

      if (opportunityError) {
        logger.error('Failed to get opportunities', opportunityError, { pipelineId });
        throw opportunityError;
      }

      // Group opportunities by stage
      const opportunitiesByStage: Record<string, OpportunityWithDetails[]> = {};
      (opportunities || []).forEach(opp => {
        if (!opportunitiesByStage[opp.stage_id]) {
          opportunitiesByStage[opp.stage_id] = [];
        }
        opportunitiesByStage[opp.stage_id].push(opp as OpportunityWithDetails);
      });

      // Create stages with their opportunities
      const stagesWithOpportunities: StageWithOpportunities[] = (pipeline.pipeline_stages || [])
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((stage: any) => {
          const stageOpportunities = opportunitiesByStage[stage.id] || [];
          return {
            ...stage,
            opportunities: stageOpportunities,
            opportunities_count: stageOpportunities.length,
            total_value: stageOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0),
            weighted_value: stageOpportunities.reduce((sum, opp) => 
              sum + ((opp.value || 0) * (opp.probability / 100)), 0
            )
          };
        });

      return {
        ...pipeline as PipelineWithStages,
        stages: pipeline.pipeline_stages || [],
        stages_with_opportunities: stagesWithOpportunities
      };
    } catch (error) {
      logger.error('Error in getPipelineWithOpportunities', error, { pipelineId });
      throw error;
    }
  }

  /**
   * Create a new pipeline
   */
  async createPipeline(pipelineData: CreatePipelineForm, organizationId?: string): Promise<SalesPipeline> {
    try {
      logger.info('Creating new pipeline', { name: pipelineData.name, organizationId });

      // Create pipeline
      const { data: pipeline, error: pipelineError } = await this.supabase
        .from('sales_pipelines')
        .insert({
          name: pipelineData.name,
          description: pipelineData.description,
          color: pipelineData.color || '#3B82F6',
          icon: pipelineData.icon || 'pipeline',
          organization_id: organizationId,
          created_by: (await this.supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (pipelineError) {
        logger.error('Failed to create pipeline', pipelineError);
        throw pipelineError;
      }

      // Create stages
      if (pipelineData.stages.length > 0) {
        const stages = pipelineData.stages.map((stage, index) => ({
          pipeline_id: pipeline.id,
          name: stage.name,
          description: stage.description,
          probability: stage.probability,
          color: stage.color || '#6B7280',
          sort_order: index + 1,
          organization_id: organizationId,
          created_by: pipeline.created_by
        }));

        const { error: stageError } = await this.supabase
          .from('pipeline_stages')
          .insert(stages);

        if (stageError) {
          logger.error('Failed to create pipeline stages', stageError);
          // Clean up the pipeline if stage creation fails
          await this.supabase.from('sales_pipelines').delete().eq('id', pipeline.id);
          throw stageError;
        }
      }

      logger.info('Pipeline created successfully', { pipelineId: pipeline.id });
      return pipeline as SalesPipeline;
    } catch (error) {
      logger.error('Error in createPipeline', error);
      throw error;
    }
  }

  // ===== OPPORTUNITY MANAGEMENT =====

  /**
   * Create a new opportunity
   */
  async createOpportunity(opportunityData: CreateOpportunityForm, organizationId?: string): Promise<SalesOpportunity> {
    try {
      logger.info('Creating new opportunity', { title: opportunityData.title, organizationId });

      const { data: opportunity, error } = await this.supabase
        .from('sales_opportunities')
        .insert({
          ...opportunityData,
          organization_id: organizationId,
          created_by: (await this.supabase.auth.getUser()).data.user?.id,
          currency: opportunityData.currency || 'USD',
          priority: opportunityData.priority || 'medium'
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create opportunity', error);
        throw error;
      }

      // Log creation activity
      await this.addOpportunityActivity(
        opportunity.id,
        'note_added',
        'Opportunity created',
        organizationId
      );

      logger.info('Opportunity created successfully', { opportunityId: opportunity.id });
      return opportunity as SalesOpportunity;
    } catch (error) {
      logger.error('Error in createOpportunity', error);
      throw error;
    }
  }

  /**
   * Update an opportunity
   */
  async updateOpportunity(opportunityData: UpdateOpportunityForm, organizationId?: string): Promise<SalesOpportunity> {
    try {
      const { id, ...updateData } = opportunityData;
      
      logger.info('Updating opportunity', { opportunityId: id, organizationId });

      const { data: opportunity, error } = await this.supabase
        .from('sales_opportunities')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update opportunity', error);
        throw error;
      }

      // Log update activity
      await this.addOpportunityActivity(
        id,
        'note_added',
        'Opportunity updated',
        organizationId
      );

      logger.info('Opportunity updated successfully', { opportunityId: id });
      return opportunity as SalesOpportunity;
    } catch (error) {
      logger.error('Error in updateOpportunity', error);
      throw error;
    }
  }

  /**
   * Move opportunity to a different stage
   */
  async moveOpportunityToStage(request: MoveOpportunityRequest, organizationId?: string): Promise<void> {
    try {
      logger.info('Moving opportunity to new stage', {
        opportunityId: request.opportunity_id,
        newStageId: request.new_stage_id,
        organizationId
      });

      const { error } = await this.supabase
        .rpc('move_opportunity_to_stage', {
          opportunity_uuid: request.opportunity_id,
          new_stage_uuid: request.new_stage_id,
          activity_note: request.note
        });

      if (error) {
        logger.error('Failed to move opportunity to stage', error);
        throw error;
      }

      logger.info('Opportunity moved to new stage successfully', {
        opportunityId: request.opportunity_id,
        newStageId: request.new_stage_id
      });
    } catch (error) {
      logger.error('Error in moveOpportunityToStage', error);
      throw error;
    }
  }

  /**
   * Get opportunity with full details
   */
  async getOpportunityWithDetails(opportunityId: string): Promise<OpportunityWithDetails | null> {
    try {
      const { data, error } = await this.supabase
        .from('sales_opportunities')
        .select(`
          *,
          contact:contacts(*),
          pipeline:sales_pipelines(*),
          stage:pipeline_stages(*),
          lead_score:lead_scores(*),
          assigned_user:auth.users(id, email),
          recent_activities:opportunity_activities(*)
        `)
        .eq('id', opportunityId)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Failed to get opportunity details', error, { opportunityId });
        throw error;
      }

      return data as OpportunityWithDetails || null;
    } catch (error) {
      logger.error('Error in getOpportunityWithDetails', error, { opportunityId });
      throw error;
    }
  }

  // ===== ACTIVITY MANAGEMENT =====

  /**
   * Add activity to opportunity
   */
  async addOpportunityActivity(
    opportunityId: string,
    activityType: string,
    description: string,
    organizationId?: string,
    metadata?: Record<string, unknown>
  ): Promise<OpportunityActivity> {
    try {
      const { data: activity, error } = await this.supabase
        .from('opportunity_activities')
        .insert({
          opportunity_id: opportunityId,
          activity_type: activityType as any,
          description,
          organization_id: organizationId,
          created_by: (await this.supabase.auth.getUser()).data.user?.id,
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to add opportunity activity', error);
        throw error;
      }

      return activity as OpportunityActivity;
    } catch (error) {
      logger.error('Error in addOpportunityActivity', error);
      throw error;
    }
  }

  /**
   * Get activities for opportunity
   */
  async getOpportunityActivities(
    opportunityId: string,
    limit: number = 50
  ): Promise<OpportunityActivity[]> {
    try {
      const { data, error } = await this.supabase
        .from('opportunity_activities')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to get opportunity activities', error, { opportunityId });
        throw error;
      }

      return data as OpportunityActivity[] || [];
    } catch (error) {
      logger.error('Error in getOpportunityActivities', error, { opportunityId });
      throw error;
    }
  }

  // ===== ANALYTICS & METRICS =====

  /**
   * Get pipeline summary
   */
  async getPipelineSummary(pipelineId: string): Promise<PipelineSummary | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_pipeline_summary', { pipeline_uuid: pipelineId });

      if (error) {
        logger.error('Failed to get pipeline summary', error, { pipelineId });
        throw error;
      }

      return data?.[0] as PipelineSummary || null;
    } catch (error) {
      logger.error('Error in getPipelineSummary', error, { pipelineId });
      throw error;
    }
  }

  /**
   * Calculate and update pipeline metrics
   */
  async updatePipelineMetrics(pipelineId: string, date?: Date): Promise<void> {
    try {
      const targetDate = date || new Date();
      
      logger.info('Updating pipeline metrics', { pipelineId, date: targetDate });

      const { error } = await this.supabase
        .rpc('calculate_pipeline_metrics', {
          pipeline_uuid: pipelineId,
          target_date: targetDate.toISOString().split('T')[0]
        });

      if (error) {
        logger.error('Failed to update pipeline metrics', error, { pipelineId });
        throw error;
      }

      logger.info('Pipeline metrics updated successfully', { pipelineId });
    } catch (error) {
      logger.error('Error in updatePipelineMetrics', error, { pipelineId });
      throw error;
    }
  }

  /**
   * Get pipeline metrics for a date range
   */
  async getPipelineMetrics(
    pipelineId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PipelineMetrics[]> {
    try {
      const { data, error } = await this.supabase
        .from('pipeline_metrics')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .lte('metric_date', endDate.toISOString().split('T')[0])
        .order('metric_date');

      if (error) {
        logger.error('Failed to get pipeline metrics', error, { pipelineId });
        throw error;
      }

      return data as PipelineMetrics[] || [];
    } catch (error) {
      logger.error('Error in getPipelineMetrics', error, { pipelineId });
      throw error;
    }
  }

  /**
   * Get comprehensive pipeline analytics
   */
  async getPipelineAnalytics(
    pipelineId: string,
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<PipelineAnalytics> {
    try {
      // This would be a complex analytics function
      // For now, returning a basic implementation
      const pipeline = await this.getPipelineWithOpportunities(pipelineId);
      const metrics = await this.getPipelineMetrics(pipelineId, startDate, endDate);

      const analytics: PipelineAnalytics = {
        pipeline_id: pipelineId,
        pipeline_name: pipeline.name,
        date_range: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        total_opportunities: pipeline.stages_with_opportunities?.reduce(
          (sum, stage) => sum + stage.opportunities_count, 0
        ) || 0,
        total_value: pipeline.stages_with_opportunities?.reduce(
          (sum, stage) => sum + stage.total_value, 0
        ) || 0,
        weighted_pipeline_value: pipeline.stages_with_opportunities?.reduce(
          (sum, stage) => sum + stage.weighted_value, 0
        ) || 0,
        average_deal_size: 0, // Calculate from metrics
        win_rate: 0, // Calculate from metrics
        average_sales_cycle: 0, // Calculate from activities
        conversion_rate: 0, // Calculate from metrics
        velocity: 0, // Calculate from metrics
        stage_conversion_rates: [], // TODO: Implement
        monthly_trends: [], // TODO: Implement
        team_performance: [], // TODO: Implement
        lead_score_performance: [] // TODO: Implement
      };

      return analytics;
    } catch (error) {
      logger.error('Error in getPipelineAnalytics', error, { pipelineId });
      throw error;
    }
  }

  // ===== BULK OPERATIONS =====

  /**
   * Bulk update opportunities
   */
  async bulkUpdateOpportunities(
    opportunityIds: string[],
    updates: Partial<SalesOpportunity>,
    organizationId?: string
  ): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    logger.info('Starting bulk opportunity update', {
      count: opportunityIds.length,
      organizationId
    });

    for (const id of opportunityIds) {
      try {
        await this.updateOpportunity({ id, ...updates }, organizationId);
        updated++;
      } catch (error) {
        logger.error('Failed to update opportunity in bulk operation', error, { opportunityId: id });
        failed++;
      }
    }

    logger.info('Bulk opportunity update completed', { updated, failed, organizationId });

    return { updated, failed };
  }
}