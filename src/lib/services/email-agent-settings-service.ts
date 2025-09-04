/**
 * Email Agent Settings Service
 * 
 * Manages email agent configuration and settings for organizations
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export interface EmailAgentSettings {
  id?: string;
  organization_id: string;
  agent_type: 'customer' | 'sales' | 'dispute' | 'billing' | 'auto_reply';
  auto_reply_enabled: boolean;
  response_delay_minutes: number;
  highlight_color: string;
  priority_threshold: 'low' | 'medium' | 'high' | 'urgent';
  escalation_enabled: boolean;
  custom_instructions?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmailAgentAssignmentRecord {
  id?: string;
  email_id: string;
  organization_id: string;
  assigned_agent: string;
  assignment_method: string;
  confidence_score: number;
  reasoning: string;
  auto_reply_sent: boolean;
  human_override: boolean;
  response_time_minutes?: number;
  created_at?: string;
  updated_at?: string;
}

export class EmailAgentSettingsService {
  private supabase;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_KEY || ''
    );
  }

  /**
   * Get all agent settings for an organization
   */
  async getAgentSettings(organizationId: string): Promise<EmailAgentSettings[]> {
    const { data, error } = await this.supabase
      .from('email_agent_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .order('agent_type');

    if (error) {
      console.error('Error fetching agent settings:', error);
      throw new Error(`Failed to fetch agent settings: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get settings for a specific agent type
   */
  async getAgentSettingsByType(
    organizationId: string, 
    agentType: EmailAgentSettings['agent_type']
  ): Promise<EmailAgentSettings | null> {
    const { data, error } = await this.supabase
      .from('email_agent_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('agent_type', agentType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return default settings
        return this.getDefaultAgentSettings(agentType, organizationId);
      }
      console.error('Error fetching agent settings by type:', error);
      throw new Error(`Failed to fetch agent settings: ${error.message}`);
    }

    return data;
  }

  /**
   * Update agent settings
   */
  async updateAgentSettings(
    organizationId: string,
    agentType: EmailAgentSettings['agent_type'],
    settings: Partial<EmailAgentSettings>
  ): Promise<EmailAgentSettings> {
    const { data, error } = await this.supabase
      .from('email_agent_settings')
      .upsert({
        organization_id: organizationId,
        agent_type: agentType,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating agent settings:', error);
      throw new Error(`Failed to update agent settings: ${error.message}`);
    }

    return data;
  }

  /**
   * Initialize default settings for an organization
   */
  async initializeDefaultSettings(organizationId: string): Promise<EmailAgentSettings[]> {
    const defaultSettings = [
      this.getDefaultAgentSettings('customer', organizationId),
      this.getDefaultAgentSettings('sales', organizationId),
      this.getDefaultAgentSettings('dispute', organizationId),
      this.getDefaultAgentSettings('billing', organizationId),
      this.getDefaultAgentSettings('auto_reply', organizationId)
    ];

    const { data, error } = await this.supabase
      .from('email_agent_settings')
      .upsert(defaultSettings)
      .select();

    if (error) {
      console.error('Error initializing default settings:', error);
      throw new Error(`Failed to initialize default settings: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Record email agent assignment
   */
  async recordAgentAssignment(assignment: Omit<EmailAgentAssignmentRecord, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { error } = await this.supabase
      .from('email_agent_assignments')
      .insert(assignment);

    if (error) {
      console.error('Error recording agent assignment:', error);
      throw new Error(`Failed to record agent assignment: ${error.message}`);
    }
  }

  /**
   * Update email with agent assignment
   */
  async updateEmailAgentAssignment(
    emailId: string,
    organizationId: string,
    assignedAgent: string,
    highlightColor: string,
    priority: string,
    confidence: number,
    reasoning: string,
    autoReplyEnabled: boolean
  ): Promise<void> {
    const supabase = await this.getSupabase();
    const { error } = await supabase.rpc('update_email_agent_assignment', {
      p_email_id: emailId,
      p_organization_id: organizationId,
      p_assigned_agent: assignedAgent,
      p_highlight_color: highlightColor,
      p_priority: priority,
      p_confidence: confidence,
      p_reasoning: reasoning,
      p_auto_reply_enabled: autoReplyEnabled
    });

    if (error) {
      console.error('Error updating email agent assignment:', error);
      throw new Error(`Failed to update email agent assignment: ${error.message}`);
    }
  }

  /**
   * Get agent assignment analytics
   */
  async getAgentAnalytics(organizationId: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.supabase
      .from('email_agent_analytics')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching agent analytics:', error);
      throw new Error(`Failed to fetch agent analytics: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get default settings for an agent type
   */
  private getDefaultAgentSettings(
    agentType: EmailAgentSettings['agent_type'], 
    organizationId: string
  ): EmailAgentSettings {
    const defaults: Record<EmailAgentSettings['agent_type'], Partial<EmailAgentSettings>> = {
      customer: {
        auto_reply_enabled: true,
        response_delay_minutes: 5,
        highlight_color: '#3B82F6',
        priority_threshold: 'medium',
        escalation_enabled: true,
        custom_instructions: 'Provide helpful and empathetic customer support responses.'
      },
      sales: {
        auto_reply_enabled: true,
        response_delay_minutes: 10,
        highlight_color: '#10B981',
        priority_threshold: 'medium',
        escalation_enabled: false,
        custom_instructions: 'Focus on value proposition and building relationships.'
      },
      dispute: {
        auto_reply_enabled: false,
        response_delay_minutes: 0,
        highlight_color: '#EF4444',
        priority_threshold: 'high',
        escalation_enabled: true,
        custom_instructions: 'Always escalate disputes to human review immediately.'
      },
      billing: {
        auto_reply_enabled: true,
        response_delay_minutes: 15,
        highlight_color: '#8B5CF6',
        priority_threshold: 'medium',
        escalation_enabled: true,
        custom_instructions: 'Review account details carefully before responding.'
      },
      auto_reply: {
        auto_reply_enabled: true,
        response_delay_minutes: 2,
        highlight_color: '#6B7280',
        priority_threshold: 'low',
        escalation_enabled: false,
        custom_instructions: 'Provide simple acknowledgments and basic information.'
      }
    };

    return {
      organization_id: organizationId,
      agent_type: agentType,
      ...defaults[agentType]
    } as EmailAgentSettings;
  }
}