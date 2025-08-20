/**
 * Follow-up Automation Service
 * 
 * Handles automatic follow-up sending with intelligent approval workflows
 */

import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { Database } from '@/types/supabase';
import { FollowUpService, EmailFollowup } from './follow-up-service';
import { FollowUpAIService } from './followup-ai-service';

type SupabaseClient = ReturnType<typeof createLazyServerClient>;

export interface AutomationRule {
  id?: string;
  user_id: string;
  organization_id?: string;
  name: string;
  description?: string;
  
  // Trigger conditions
  trigger_conditions: {
    days_overdue?: number;
    priority_levels?: string[];
    status_types?: string[];
    recipient_patterns?: string[];
    time_of_day?: string; // HH:MM format
    days_of_week?: number[]; // 0-6, Sunday = 0
  };
  
  // Automation settings
  automation_settings: {
    auto_generate_draft: boolean;
    auto_send: boolean;
    require_approval: boolean;
    approval_threshold?: number; // AI confidence threshold
    max_attempts?: number;
    escalation_delay_hours?: number;
  };
  
  // AI preferences
  ai_preferences: {
    tone: 'professional' | 'friendly' | 'urgent' | 'casual';
    approach: 'gentle' | 'direct' | 'value-add' | 'alternative';
    max_length: 'short' | 'medium' | 'long';
    language: string;
    custom_instructions?: string;
  };
  
  // Approval workflow
  approval_workflow?: {
    approvers: string[]; // User IDs
    require_all: boolean;
    timeout_hours: number;
    fallback_action: 'send' | 'skip' | 'escalate';
  };
  
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AutomationExecution {
  id?: string;
  rule_id: string;
  followup_id: string;
  user_id: string;
  
  // Execution details
  triggered_at: string;
  status: 'pending' | 'generating' | 'awaiting_approval' | 'approved' | 'rejected' | 'sent' | 'failed' | 'skipped';
  
  // AI generation results
  draft_generated_at?: string;
  draft_subject?: string;
  draft_body?: string;
  ai_confidence?: number;
  ai_reasoning?: string;
  
  // Approval details
  approval_requested_at?: string;
  approval_deadline?: string;
  approvals: Array<{
    approver_id: string;
    approved: boolean;
    approved_at: string;
    comment?: string;
  }>;
  
  // Execution results
  executed_at?: string;
  execution_result?: 'sent' | 'failed' | 'skipped';
  error_message?: string;
  
  // Performance tracking
  response_received?: boolean;
  response_received_at?: string;
  response_time_hours?: number;
  
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface AutomationStats {
  total_rules: number;
  active_rules: number;
  total_executions: number;
  pending_approvals: number;
  success_rate: number;
  avg_response_time: number;
  cost_savings: number;
  time_savings: number;
}

export class FollowUpAutomationService {
  private supabase: SupabaseClient;
  private followUpService: FollowUpService;
  private aiService: FollowUpAIService;

  constructor() {
    this.supabase = createLazyServerClient();
    this.followUpService = new FollowUpService();
    this.aiService = new FollowUpAIService();
  }

  /**
   * Create a new automation rule
   */
  async createAutomationRule(rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at'>): Promise<AutomationRule | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_followup_automation_rules')
        .insert({
          ...rule,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating automation rule:', error);
        return null;
      }

      return data as AutomationRule;
    } catch (error) {
      console.error('Error in createAutomationRule:', error);
      return null;
    }
  }

  /**
   * Get automation rules for a user
   */
  async getAutomationRules(userId: string, organizationId?: string): Promise<AutomationRule[]> {
    try {
      let query = this.supabase
        .from('email_followup_automation_rules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching automation rules:', error);
        return [];
      }

      return data as AutomationRule[];
    } catch (error) {
      console.error('Error in getAutomationRules:', error);
      return [];
    }
  }

  /**
   * Process automation for due follow-ups
   * This should be called by a scheduled job
   */
  async processAutomation(): Promise<void> {
    try {
      console.log('[FollowUpAutomation] Starting automation processing...');

      // Get all active automation rules
      const { data: rules, error: rulesError } = await this.supabase
        .from('email_followup_automation_rules')
        .select('*')
        .eq('is_active', true);

      if (rulesError || !rules) {
        console.error('Error fetching automation rules:', rulesError);
        return;
      }

      console.log(`[FollowUpAutomation] Processing ${rules.length} active rules`);

      // Process each rule
      for (const rule of rules) {
        await this.processAutomationRule(rule as AutomationRule);
      }

      console.log('[FollowUpAutomation] Automation processing completed');
    } catch (error) {
      console.error('Error in processAutomation:', error);
    }
  }

  /**
   * Process a specific automation rule
   */
  private async processAutomationRule(rule: AutomationRule): Promise<void> {
    try {
      // Get follow-ups that match the rule conditions
      const matchingFollowups = await this.findMatchingFollowups(rule);
      
      console.log(`[FollowUpAutomation] Rule "${rule.name}" matches ${matchingFollowups.length} follow-ups`);

      for (const followup of matchingFollowups) {
        // Check if we already have a pending execution for this follow-up
        const existingExecution = await this.getExistingExecution(rule.id!, followup.id!);
        if (existingExecution) {
          continue; // Skip if already processing
        }

        // Create automation execution
        const execution = await this.createAutomationExecution(rule, followup);
        if (execution) {
          await this.executeAutomation(execution, rule, followup);
        }
      }
    } catch (error) {
      console.error(`Error processing automation rule ${rule.name}:`, error);
    }
  }

  /**
   * Find follow-ups that match automation rule conditions
   */
  private async findMatchingFollowups(rule: AutomationRule): Promise<EmailFollowup[]> {
    const allFollowups = await this.followUpService.getFollowups(rule.user_id, {
      organizationId: rule.organization_id
    });

    return allFollowups.filter(followup => {
      const conditions = rule.trigger_conditions;
      
      // Check status
      if (conditions.status_types?.length && !conditions.status_types.includes(followup.status)) {
        return false;
      }

      // Check priority
      if (conditions.priority_levels?.length && !conditions.priority_levels.includes(followup.priority)) {
        return false;
      }

      // Check days overdue
      if (conditions.days_overdue) {
        const dueDate = new Date(followup.follow_up_due_at);
        const daysOverdue = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue < conditions.days_overdue) {
          return false;
        }
      }

      // Check recipient patterns
      if (conditions.recipient_patterns?.length) {
        const hasMatchingRecipient = followup.original_recipients.some(recipient =>
          conditions.recipient_patterns!.some(pattern =>
            new RegExp(pattern, 'i').test(recipient)
          )
        );
        if (!hasMatchingRecipient) {
          return false;
        }
      }

      // Check time of day
      if (conditions.time_of_day) {
        const currentHour = new Date().getHours();
        const [targetHour] = conditions.time_of_day.split(':').map(Number);
        if (Math.abs(currentHour - targetHour) > 1) { // Within 1 hour
          return false;
        }
      }

      // Check days of week
      if (conditions.days_of_week?.length) {
        const currentDay = new Date().getDay();
        if (!conditions.days_of_week.includes(currentDay)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Check if there's an existing execution for this rule and follow-up
   */
  private async getExistingExecution(ruleId: string, followupId: string): Promise<AutomationExecution | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_followup_automation_executions')
        .select('*')
        .eq('rule_id', ruleId)
        .eq('followup_id', followupId)
        .in('status', ['pending', 'generating', 'awaiting_approval'])
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is expected
        console.error('Error checking existing execution:', error);
      }

      return data as AutomationExecution | null;
    } catch (error) {
      console.error('Error in getExistingExecution:', error);
      return null;
    }
  }

  /**
   * Create a new automation execution
   */
  private async createAutomationExecution(rule: AutomationRule, followup: EmailFollowup): Promise<AutomationExecution | null> {
    try {
      const execution: Partial<AutomationExecution> = {
        rule_id: rule.id!,
        followup_id: followup.id!,
        user_id: rule.user_id,
        triggered_at: new Date().toISOString(),
        status: 'pending',
        approvals: [],
        metadata: {
          rule_name: rule.name,
          followup_subject: followup.original_subject
        }
      };

      const { data, error } = await this.supabase
        .from('email_followup_automation_executions')
        .insert(execution)
        .select()
        .single();

      if (error) {
        console.error('Error creating automation execution:', error);
        return null;
      }

      return data as AutomationExecution;
    } catch (error) {
      console.error('Error in createAutomationExecution:', error);
      return null;
    }
  }

  /**
   * Execute the automation for a specific follow-up
   */
  private async executeAutomation(
    execution: AutomationExecution,
    rule: AutomationRule,
    followup: EmailFollowup
  ): Promise<void> {
    try {
      console.log(`[FollowUpAutomation] Executing automation for follow-up ${followup.id}`);

      // Step 1: Generate AI draft if enabled
      if (rule.automation_settings.auto_generate_draft) {
        await this.generateDraftForAutomation(execution, rule, followup);
      }

      // Step 2: Check if approval is required
      if (rule.automation_settings.require_approval) {
        await this.requestApproval(execution, rule);
      } else {
        // Step 3: Auto-send if no approval required
        if (rule.automation_settings.auto_send) {
          await this.sendAutomatedFollowup(execution, rule, followup);
        }
      }
    } catch (error) {
      console.error('Error in executeAutomation:', error);
      await this.updateExecutionStatus(execution.id!, 'failed', {
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate AI draft for automation
   */
  private async generateDraftForAutomation(
    execution: AutomationExecution,
    rule: AutomationRule,
    followup: EmailFollowup
  ): Promise<void> {
    try {
      await this.updateExecutionStatus(execution.id!, 'generating');

      // Build AI context
      const aiContext = {
        followupId: followup.id!,
        originalEmail: {
          id: followup.email_id,
          subject: followup.original_subject,
          content: followup.context_summary || 'Original email content',
          recipients: followup.original_recipients,
          sentAt: new Date(followup.original_sent_at)
        },
        followUpReason: followup.follow_up_reason || 'No response received',
        priority: followup.priority as 'low' | 'medium' | 'high' | 'urgent',
        daysSinceOriginal: Math.floor(
          (new Date().getTime() - new Date(followup.original_sent_at).getTime()) / 
          (1000 * 60 * 60 * 24)
        ),
        organizationId: rule.organization_id,
        userId: rule.user_id
      };

      // Generate draft
      const draftResult = await this.aiService.generateFollowUpDraft(aiContext, rule.ai_preferences);

      if (draftResult.success && draftResult.draft) {
        await this.updateExecutionStatus(execution.id!, 'awaiting_approval', {
          draft_generated_at: new Date().toISOString(),
          draft_subject: draftResult.draft.subject,
          draft_body: draftResult.draft.body,
          ai_confidence: draftResult.draft.confidence,
          ai_reasoning: draftResult.draft.reasoning
        });
      } else {
        throw new Error(draftResult.error || 'Failed to generate draft');
      }
    } catch (error) {
      console.error('Error generating draft for automation:', error);
      throw error;
    }
  }

  /**
   * Request approval for automated follow-up
   */
  private async requestApproval(execution: AutomationExecution, rule: AutomationRule): Promise<void> {
    try {
      const approvalDeadline = new Date();
      approvalDeadline.setHours(approvalDeadline.getHours() + (rule.approval_workflow?.timeout_hours || 24));

      await this.updateExecutionStatus(execution.id!, 'awaiting_approval', {
        approval_requested_at: new Date().toISOString(),
        approval_deadline: approvalDeadline.toISOString()
      });

      // TODO: Send approval notifications to designated approvers
      // This would integrate with your notification system
      console.log(`[FollowUpAutomation] Approval requested for execution ${execution.id}`);
    } catch (error) {
      console.error('Error requesting approval:', error);
      throw error;
    }
  }

  /**
   * Send automated follow-up
   */
  private async sendAutomatedFollowup(
    execution: AutomationExecution,
    rule: AutomationRule,
    followup: EmailFollowup
  ): Promise<void> {
    try {
      // TODO: Integrate with email sending service
      // For now, we'll simulate the sending
      console.log(`[FollowUpAutomation] Sending automated follow-up for execution ${execution.id}`);

      // Update follow-up status
      await this.followUpService.markFollowupSent(followup.id!);

      // Update execution status
      await this.updateExecutionStatus(execution.id!, 'sent', {
        executed_at: new Date().toISOString(),
        execution_result: 'sent'
      });

      console.log(`[FollowUpAutomation] Automated follow-up sent successfully`);
    } catch (error) {
      console.error('Error sending automated follow-up:', error);
      throw error;
    }
  }

  /**
   * Update execution status
   */
  private async updateExecutionStatus(
    executionId: string,
    status: AutomationExecution['status'],
    additionalData?: Partial<AutomationExecution>
  ): Promise<void> {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      const { error } = await this.supabase
        .from('email_followup_automation_executions')
        .update(updateData)
        .eq('id', executionId);

      if (error) {
        console.error('Error updating execution status:', error);
      }
    } catch (error) {
      console.error('Error in updateExecutionStatus:', error);
    }
  }

  /**
   * Approve or reject an automation execution
   */
  async processApproval(
    executionId: string,
    approverId: string,
    approved: boolean,
    comment?: string
  ): Promise<boolean> {
    try {
      // Get the execution
      const { data: execution, error } = await this.supabase
        .from('email_followup_automation_executions')
        .select('*')
        .eq('id', executionId)
        .single();

      if (error || !execution) {
        console.error('Execution not found:', error);
        return false;
      }

      // Add approval
      const approvals = [...(execution.approvals || [])];
      approvals.push({
        approver_id: approverId,
        approved,
        approved_at: new Date().toISOString(),
        comment
      });

      // Get the rule to check approval requirements
      const { data: rule } = await this.supabase
        .from('email_followup_automation_rules')
        .select('*')
        .eq('id', execution.rule_id)
        .single();

      if (!rule) {
        console.error('Rule not found');
        return false;
      }

      const approvalWorkflow = rule.approval_workflow;
      let finalStatus: AutomationExecution['status'] = 'awaiting_approval';

      if (!approved) {
        // If rejected, stop the process
        finalStatus = 'rejected';
      } else if (approvalWorkflow?.require_all) {
        // Check if all approvers have approved
        const requiredApprovers = approvalWorkflow.approvers || [];
        const approvedBy = approvals.filter(a => a.approved).map(a => a.approver_id);
        const allApproved = requiredApprovers.every(approverId => approvedBy.includes(approverId));
        
        if (allApproved) {
          finalStatus = 'approved';
        }
      } else {
        // Single approval is sufficient
        finalStatus = 'approved';
      }

      // Update execution
      await this.updateExecutionStatus(executionId, finalStatus, { approvals });

      // If approved, proceed with sending
      if (finalStatus === 'approved' && rule.automation_settings.auto_send) {
        const followup = await this.followUpService.getFollowups(execution.user_id)
          .then(followups => followups.find(f => f.id === execution.followup_id));
        
        if (followup) {
          await this.sendAutomatedFollowup(execution as AutomationExecution, rule as AutomationRule, followup);
        }
      }

      return true;
    } catch (error) {
      console.error('Error processing approval:', error);
      return false;
    }
  }

  /**
   * Get automation statistics
   */
  async getAutomationStats(userId: string, organizationId?: string): Promise<AutomationStats> {
    try {
      // Get rules count
      let rulesQuery = this.supabase
        .from('email_followup_automation_rules')
        .select('id, is_active')
        .eq('user_id', userId);

      if (organizationId) {
        rulesQuery = rulesQuery.eq('organization_id', organizationId);
      }

      const { data: rules } = await rulesQuery;

      // Get executions count and stats
      let executionsQuery = this.supabase
        .from('email_followup_automation_executions')
        .select('status, response_received, response_time_hours, created_at')
        .eq('user_id', userId);

      const { data: executions } = await executionsQuery;

      const totalRules = rules?.length || 0;
      const activeRules = rules?.filter(r => r.is_active).length || 0;
      const totalExecutions = executions?.length || 0;
      const pendingApprovals = executions?.filter(e => e.status === 'awaiting_approval').length || 0;
      const successfulExecutions = executions?.filter(e => e.status === 'sent').length || 0;
      const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
      
      const responseTimes = executions?.filter(e => e.response_time_hours).map(e => e.response_time_hours) || [];
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      // Estimate cost and time savings (these would be calculated based on actual usage)
      const costSavings = successfulExecutions * 0.50; // Estimated $0.50 saved per automated follow-up
      const timeSavings = successfulExecutions * 10; // Estimated 10 minutes saved per automated follow-up

      return {
        total_rules: totalRules,
        active_rules: activeRules,
        total_executions: totalExecutions,
        pending_approvals: pendingApprovals,
        success_rate: successRate,
        avg_response_time: avgResponseTime,
        cost_savings: costSavings,
        time_savings: timeSavings
      };
    } catch (error) {
      console.error('Error getting automation stats:', error);
      return {
        total_rules: 0,
        active_rules: 0,
        total_executions: 0,
        pending_approvals: 0,
        success_rate: 0,
        avg_response_time: 0,
        cost_savings: 0,
        time_savings: 0
      };
    }
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(approverId: string): Promise<AutomationExecution[]> {
    try {
      const { data, error } = await this.supabase
        .from('email_followup_automation_executions')
        .select(`
          *,
          email_followup_automation_rules (
            name,
            approval_workflow
          ),
          email_followups (
            original_subject,
            original_recipients
          )
        `)
        .eq('status', 'awaiting_approval')
        .filter('email_followup_automation_rules.approval_workflow->>approvers', 'cs', `["${approverId}"]`);

      if (error) {
        console.error('Error fetching pending approvals:', error);
        return [];
      }

      return data as AutomationExecution[];
    } catch (error) {
      console.error('Error in getPendingApprovals:', error);
      return [];
    }
  }
}



