import { MultiAgentOrchestrator, WorkflowDefinition, WorkflowExecution } from './multi-agent-orchestrator';
import { AgentTask, AgentThought, AgentAction } from './types';
import { aiEngine } from './ai-engine';

// Advanced Workflow Types
export interface AdvancedWorkflowDefinition extends WorkflowDefinition {
  variables: WorkflowVariable[];
  loops: WorkflowLoop[];
  conditionalBranches: ConditionalBranch[];
  parallelGroups: ParallelGroup[];
  errorHandling: ErrorHandlingStrategy[];
  notifications: NotificationRule[];
  approvals: ApprovalRule[];
  scheduling: SchedulingRule[];
}

export interface WorkflowVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  description: string;
  scope: 'global' | 'step' | 'branch';
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  customFunction?: string;
}

export interface WorkflowLoop {
  id: string;
  type: 'for' | 'while' | 'forEach';
  condition: string;
  maxIterations: number;
  steps: string[]; // step IDs to loop
  breakCondition?: string;
  continueCondition?: string;
  iterationVariable?: string;
}

export interface ConditionalBranch {
  id: string;
  condition: string;
  trueSteps: string[];
  falseSteps: string[];
  elseIfBranches?: ElseIfBranch[];
  defaultBranch?: string[];
}

export interface ElseIfBranch {
  condition: string;
  steps: string[];
}

export interface ParallelGroup {
  id: string;
  steps: string[];
  waitForAll: boolean;
  maxConcurrency: number;
  failureStrategy: 'fail_fast' | 'continue' | 'retry';
  timeout: number;
}

export interface ErrorHandlingStrategy {
  stepId: string;
  errorType: 'timeout' | 'failure' | 'validation' | 'any';
  action: 'retry' | 'skip' | 'fallback' | 'escalate' | 'terminate';
  retryCount?: number;
  retryDelay?: number;
  fallbackSteps?: string[];
  escalationTarget?: string;
  notificationTemplate?: string;
}

export interface NotificationRule {
  id: string;
  trigger: 'start' | 'complete' | 'error' | 'approval' | 'milestone';
  condition?: string;
  recipients: string[];
  template: string;
  channel: 'email' | 'slack' | 'webhook' | 'sms';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface ApprovalRule {
  id: string;
  stepId: string;
  approvers: string[];
  approvalType: 'any' | 'majority' | 'unanimous';
  timeout: number;
  escalationChain?: string[];
  autoApprovalCondition?: string;
}

export interface SchedulingRule {
  id: string;
  stepId: string;
  scheduleType: 'delay' | 'time' | 'cron' | 'condition';
  delay?: number;
  time?: string;
  cronExpression?: string;
  condition?: string;
  timezone?: string;
}

export interface WorkflowContext {
  variables: Map<string, any>;
  loopCounters: Map<string, number>;
  branchHistory: string[];
  parallelResults: Map<string, any>;
  approvalStatus: Map<string, ApprovalStatus>;
  scheduledTasks: Map<string, ScheduledTask>;
  executionMetrics: ExecutionMetrics;
}

export interface ApprovalStatus {
  id: string;
  stepId: string;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  approvers: ApprovalVote[];
  createdAt: Date;
  decidedAt?: Date;
  comments?: string;
}

export interface ApprovalVote {
  approver: string;
  decision: 'approve' | 'reject';
  timestamp: Date;
  comments?: string;
}

export interface ScheduledTask {
  id: string;
  stepId: string;
  scheduledTime: Date;
  status: 'pending' | 'executed' | 'cancelled';
  result?: any;
}

export interface ExecutionMetrics {
  startTime: Date;
  stepMetrics: Map<string, StepMetrics>;
  parallelGroupMetrics: Map<string, ParallelGroupMetrics>;
  loopMetrics: Map<string, LoopMetrics>;
  errorCount: number;
  retryCount: number;
  approvalCount: number;
  totalStepsExecuted: number;
}

export interface StepMetrics {
  stepId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  retryCount: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface ParallelGroupMetrics {
  groupId: string;
  startTime: Date;
  endTime?: Date;
  concurrentSteps: number;
  completedSteps: number;
  failedSteps: number;
  averageStepDuration: number;
}

export interface LoopMetrics {
  loopId: string;
  iterations: number;
  averageIterationTime: number;
  breakReason?: 'condition' | 'max_iterations' | 'error';
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: 'sales' | 'marketing' | 'support' | 'operations' | 'custom';
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: number;
  requiredAgents: string[];
  template: AdvancedWorkflowDefinition;
  examples: WorkflowExample[];
  documentation: string;
}

export interface WorkflowExample {
  name: string;
  description: string;
  inputData: Record<string, any>;
  expectedOutput: Record<string, any>;
  executionTime: number;
}

export class AdvancedWorkflowEngine {
  private orchestrator: MultiAgentOrchestrator;
  private workflowTemplates: Map<string, WorkflowTemplate> = new Map();
  private activeContexts: Map<string, WorkflowContext> = new Map();
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();
  private approvalQueue: Map<string, ApprovalStatus> = new Map();

  constructor(orchestrator: MultiAgentOrchestrator) {
    this.orchestrator = orchestrator;
    this.initializeWorkflowTemplates();
  }

  // Advanced Workflow Execution
  async executeAdvancedWorkflow(
    workflowId: string,
    inputData: Record<string, any> = {},
    options: ExecutionOptions = {}
  ): Promise<string> {
    const workflow = this.orchestrator.getWorkflow(workflowId) as AdvancedWorkflowDefinition;
    if (!workflow) {
      throw new Error(`Advanced workflow ${workflowId} not found`);
    }

    // Initialize workflow context
    const context = this.initializeWorkflowContext(workflow, inputData);
    const executionId = await this.orchestrator.executeWorkflow(workflowId, inputData, 'advanced_engine');
    
    this.activeContexts.set(executionId, context);

    // Start advanced execution monitoring
    this.monitorAdvancedExecution(executionId, workflow);

    return executionId;
  }

  private initializeWorkflowContext(workflow: AdvancedWorkflowDefinition, inputData: Record<string, any>): WorkflowContext {
    const context: WorkflowContext = {
      variables: new Map(),
      loopCounters: new Map(),
      branchHistory: [],
      parallelResults: new Map(),
      approvalStatus: new Map(),
      scheduledTasks: new Map(),
      executionMetrics: {
        startTime: new Date(),
        stepMetrics: new Map(),
        parallelGroupMetrics: new Map(),
        loopMetrics: new Map(),
        errorCount: 0,
        retryCount: 0,
        approvalCount: 0,
        totalStepsExecuted: 0
      }
    };

    // Initialize variables
    workflow.variables.forEach(variable => {
      const value = inputData[variable.name] ?? variable.defaultValue;
      if (this.validateVariable(variable, value)) {
        context.variables.set(variable.name, value);
      }
    });

    // Initialize loop counters
    workflow.loops.forEach(loop => {
      context.loopCounters.set(loop.id, 0);
    });

    return context;
  }

  private validateVariable(variable: WorkflowVariable, value: any): boolean {
    if (!variable.validation) return true;

    for (const rule of variable.validation) {
      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null) {
            throw new Error(`Variable ${variable.name} is required: ${rule.message}`);
          }
          break;
        case 'min':
          if (typeof value === 'number' && value < rule.value) {
            throw new Error(`Variable ${variable.name} must be >= ${rule.value}: ${rule.message}`);
          }
          break;
        case 'max':
          if (typeof value === 'number' && value > rule.value) {
            throw new Error(`Variable ${variable.name} must be <= ${rule.value}: ${rule.message}`);
          }
          break;
        case 'pattern':
          if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
            throw new Error(`Variable ${variable.name} must match pattern ${rule.value}: ${rule.message}`);
          }
          break;
        case 'custom':
          if (rule.customFunction && !this.executeCustomValidation(rule.customFunction, value)) {
            throw new Error(`Variable ${variable.name} failed custom validation: ${rule.message}`);
          }
          break;
      }
    }

    return true;
  }

  private executeCustomValidation(functionCode: string, value: any): boolean {
    try {
      const func = new Function('value', functionCode);
      return func(value);
    } catch (error) {
      return false;
    }
  }

  private async monitorAdvancedExecution(executionId: string, workflow: AdvancedWorkflowDefinition): Promise<void> {
    const context = this.activeContexts.get(executionId);
    if (!context) return;

    // Monitor execution progress
    const checkInterval = setInterval(async () => {
      const execution = this.orchestrator.getExecution(executionId);
      if (!execution) {
        clearInterval(checkInterval);
        return;
      }

      if (execution.status === 'completed' || execution.status === 'failed') {
        clearInterval(checkInterval);
        await this.finalizeExecution(executionId, workflow);
        return;
      }

      // Process advanced features
      await this.processConditionalBranches(executionId, workflow);
      await this.processParallelGroups(executionId, workflow);
      await this.processLoops(executionId, workflow);
      await this.processApprovals(executionId, workflow);
      await this.processScheduledTasks(executionId, workflow);
    }, 1000);
  }

  // Conditional Branch Processing
  private async processConditionalBranches(executionId: string, workflow: AdvancedWorkflowDefinition): Promise<void> {
    const context = this.activeContexts.get(executionId);
    if (!context) return;

    for (const branch of workflow.conditionalBranches) {
      if (this.shouldExecuteBranch(branch, context)) {
        const conditionResult = this.evaluateCondition(branch.condition, context);
        
        if (conditionResult) {
          context.branchHistory.push(`${branch.id}:true`);
          await this.executeBranchSteps(branch.trueSteps, executionId);
        } else {
          // Check else-if branches
          let executed = false;
          if (branch.elseIfBranches) {
            for (const elseIf of branch.elseIfBranches) {
              if (this.evaluateCondition(elseIf.condition, context)) {
                context.branchHistory.push(`${branch.id}:elseif:${elseIf.condition}`);
                await this.executeBranchSteps(elseIf.steps, executionId);
                executed = true;
                break;
              }
            }
          }
          
          if (!executed && branch.falseSteps) {
            context.branchHistory.push(`${branch.id}:false`);
            await this.executeBranchSteps(branch.falseSteps, executionId);
          } else if (!executed && branch.defaultBranch) {
            context.branchHistory.push(`${branch.id}:default`);
            await this.executeBranchSteps(branch.defaultBranch, executionId);
          }
        }
      }
    }
  }

  private shouldExecuteBranch(branch: ConditionalBranch, context: WorkflowContext): boolean {
    // Check if this branch has already been executed
    return !context.branchHistory.some(h => h.startsWith(`${branch.id}:`));
  }

  private evaluateCondition(condition: string, context: WorkflowContext): boolean {
    try {
      // Create evaluation context with variables
      const evalContext: Record<string, any> = {};
      context.variables.forEach((value, key) => {
        evalContext[key] = value;
      });

      // Add special context variables
      evalContext.loopCounters = Object.fromEntries(context.loopCounters);
      evalContext.branchHistory = context.branchHistory;
      evalContext.executionMetrics = context.executionMetrics;

      // Evaluate condition
      const func = new Function('context', `with(context) { return ${condition}; }`);
      return func(evalContext);
    } catch (error) {
      console.error('Error evaluating condition:', condition, error);
      return false;
    }
  }

  private async executeBranchSteps(stepIds: string[], executionId: string): Promise<void> {
    // Execute steps in sequence
    for (const stepId of stepIds) {
      await this.executeStep(stepId, executionId);
    }
  }

  // Parallel Group Processing
  private async processParallelGroups(executionId: string, workflow: AdvancedWorkflowDefinition): Promise<void> {
    const context = this.activeContexts.get(executionId);
    if (!context) return;

    for (const group of workflow.parallelGroups) {
      if (this.shouldExecuteParallelGroup(group, context)) {
        await this.executeParallelGroup(group, executionId, context);
      }
    }
  }

  private shouldExecuteParallelGroup(group: ParallelGroup, context: WorkflowContext): boolean {
    return !context.parallelResults.has(group.id);
  }

  private async executeParallelGroup(group: ParallelGroup, executionId: string, context: WorkflowContext): Promise<void> {
    const metrics: ParallelGroupMetrics = {
      groupId: group.id,
      startTime: new Date(),
      concurrentSteps: Math.min(group.steps.length, group.maxConcurrency),
      completedSteps: 0,
      failedSteps: 0,
      averageStepDuration: 0
    };

    context.parallelGroupMetrics.set(group.id, metrics);

    const stepPromises: Promise<any>[] = [];
    const semaphore = new Semaphore(group.maxConcurrency);

    for (const stepId of group.steps) {
      const promise = semaphore.acquire().then(async (release) => {
        try {
          const stepStart = Date.now();
          const result = await this.executeStep(stepId, executionId);
          const stepDuration = Date.now() - stepStart;
          
          metrics.completedSteps++;
          metrics.averageStepDuration = 
            (metrics.averageStepDuration * (metrics.completedSteps - 1) + stepDuration) / metrics.completedSteps;
          
          return { stepId, result, success: true };
        } catch (error) {
          metrics.failedSteps++;
          
          if (group.failureStrategy === 'fail_fast') {
            throw error;
          }
          
          return { stepId, error, success: false };
        } finally {
          release();
        }
      });

      stepPromises.push(promise);
    }

    try {
      const results = await Promise.all(stepPromises);
      
      metrics.endTime = new Date();
      context.parallelResults.set(group.id, results);
      
      // Handle failures based on strategy
      const failures = results.filter(r => !r.success);
      if (failures.length > 0 && group.failureStrategy === 'fail_fast') {
        throw new Error(`Parallel group ${group.id} failed: ${failures.length} steps failed`);
      }
      
    } catch (error) {
      metrics.endTime = new Date();
      throw error;
    }
  }

  // Loop Processing
  private async processLoops(executionId: string, workflow: AdvancedWorkflowDefinition): Promise<void> {
    const context = this.activeContexts.get(executionId);
    if (!context) return;

    for (const loop of workflow.loops) {
      if (this.shouldExecuteLoop(loop, context)) {
        await this.executeLoop(loop, executionId, context);
      }
    }
  }

  private shouldExecuteLoop(loop: WorkflowLoop, context: WorkflowContext): boolean {
    const counter = context.loopCounters.get(loop.id) || 0;
    return counter < loop.maxIterations && this.evaluateCondition(loop.condition, context);
  }

  private async executeLoop(loop: WorkflowLoop, executionId: string, context: WorkflowContext): Promise<void> {
    const metrics: LoopMetrics = {
      loopId: loop.id,
      iterations: 0,
      averageIterationTime: 0
    };

    context.loopMetrics.set(loop.id, metrics);

    while (this.shouldExecuteLoop(loop, context)) {
      const iterationStart = Date.now();
      const counter = context.loopCounters.get(loop.id) || 0;
      
      // Set iteration variable if specified
      if (loop.iterationVariable) {
        context.variables.set(loop.iterationVariable, counter);
      }

      try {
        // Execute loop steps
        for (const stepId of loop.steps) {
          await this.executeStep(stepId, executionId);
          
          // Check continue condition
          if (loop.continueCondition && !this.evaluateCondition(loop.continueCondition, context)) {
            break;
          }
        }

        // Check break condition
        if (loop.breakCondition && this.evaluateCondition(loop.breakCondition, context)) {
          metrics.breakReason = 'condition';
          break;
        }

        const iterationTime = Date.now() - iterationStart;
        metrics.iterations++;
        metrics.averageIterationTime = 
          (metrics.averageIterationTime * (metrics.iterations - 1) + iterationTime) / metrics.iterations;

        // Increment counter
        context.loopCounters.set(loop.id, counter + 1);

      } catch (error) {
        metrics.breakReason = 'error';
        throw error;
      }
    }

    if (metrics.iterations >= loop.maxIterations) {
      metrics.breakReason = 'max_iterations';
    }
  }

  // Approval Processing
  private async processApprovals(executionId: string, workflow: AdvancedWorkflowDefinition): Promise<void> {
    const context = this.activeContexts.get(executionId);
    if (!context) return;

    for (const approval of workflow.approvals) {
      if (this.shouldRequestApproval(approval, context)) {
        await this.requestApproval(approval, executionId, context);
      }
    }
  }

  private shouldRequestApproval(approval: ApprovalRule, context: WorkflowContext): boolean {
    return !context.approvalStatus.has(approval.id);
  }

  private async requestApproval(approval: ApprovalRule, executionId: string, context: WorkflowContext): Promise<void> {
    // Check auto-approval condition
    if (approval.autoApprovalCondition && this.evaluateCondition(approval.autoApprovalCondition, context)) {
      const autoApproval: ApprovalStatus = {
        id: approval.id,
        stepId: approval.stepId,
        status: 'approved',
        approvers: [{
          approver: 'system',
          decision: 'approve',
          timestamp: new Date(),
          comments: 'Auto-approved based on condition'
        }],
        createdAt: new Date(),
        decidedAt: new Date(),
        comments: 'Auto-approved'
      };
      
      context.approvalStatus.set(approval.id, autoApproval);
      return;
    }

    // Create approval request
    const approvalStatus: ApprovalStatus = {
      id: approval.id,
      stepId: approval.stepId,
      status: 'pending',
      approvers: [],
      createdAt: new Date()
    };

    context.approvalStatus.set(approval.id, approvalStatus);
    this.approvalQueue.set(approval.id, approvalStatus);

    // Send approval notifications
    await this.sendApprovalNotifications(approval, executionId);

    // Set timeout for approval
    setTimeout(() => {
      const status = context.approvalStatus.get(approval.id);
      if (status && status.status === 'pending') {
        status.status = 'timeout';
        status.decidedAt = new Date();
        
        // Handle escalation
        if (approval.escalationChain && approval.escalationChain.length > 0) {
          this.escalateApproval(approval, executionId);
        }
      }
    }, approval.timeout);
  }

  private async sendApprovalNotifications(approval: ApprovalRule, executionId: string): Promise<void> {
    // Mock notification sending
    console.log(`Sending approval request for ${approval.id} to:`, approval.approvers);
  }

  private async escalateApproval(approval: ApprovalRule, executionId: string): Promise<void> {
    // Mock escalation
    console.log(`Escalating approval ${approval.id} to:`, approval.escalationChain);
  }

  // Scheduling Processing
  private async processScheduledTasks(executionId: string, workflow: AdvancedWorkflowDefinition): Promise<void> {
    const context = this.activeContexts.get(executionId);
    if (!context) return;

    for (const schedule of workflow.scheduling) {
      if (this.shouldScheduleTask(schedule, context)) {
        await this.scheduleTask(schedule, executionId, context);
      }
    }
  }

  private shouldScheduleTask(schedule: SchedulingRule, context: WorkflowContext): boolean {
    return !context.scheduledTasks.has(schedule.id);
  }

  private async scheduleTask(schedule: SchedulingRule, executionId: string, context: WorkflowContext): Promise<void> {
    let scheduledTime: Date;

    switch (schedule.scheduleType) {
      case 'delay':
        scheduledTime = new Date(Date.now() + (schedule.delay || 0));
        break;
      case 'time':
        scheduledTime = new Date(schedule.time || Date.now());
        break;
      case 'cron':
        // Mock cron parsing - in production, use a proper cron library
        scheduledTime = new Date(Date.now() + 60000); // 1 minute from now
        break;
      case 'condition':
        // Wait for condition to be true
        return this.scheduleConditionalTask(schedule, executionId, context);
      default:
        return;
    }

    const scheduledTask: ScheduledTask = {
      id: schedule.id,
      stepId: schedule.stepId,
      scheduledTime,
      status: 'pending'
    };

    context.scheduledTasks.set(schedule.id, scheduledTask);

    // Set timeout for execution
    const timeout = setTimeout(async () => {
      try {
        scheduledTask.status = 'executed';
        scheduledTask.result = await this.executeStep(schedule.stepId, executionId);
      } catch (error) {
        scheduledTask.result = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }, scheduledTime.getTime() - Date.now());

    this.scheduledTasks.set(schedule.id, timeout);
  }

  private async scheduleConditionalTask(schedule: SchedulingRule, executionId: string, context: WorkflowContext): Promise<void> {
    const checkInterval = setInterval(() => {
      if (schedule.condition && this.evaluateCondition(schedule.condition, context)) {
        clearInterval(checkInterval);
        this.executeStep(schedule.stepId, executionId);
      }
    }, 5000); // Check every 5 seconds

    // Store interval for cleanup
    this.scheduledTasks.set(schedule.id, checkInterval);
  }

  // Step Execution
  private async executeStep(stepId: string, executionId: string): Promise<any> {
    const context = this.activeContexts.get(executionId);
    if (!context) return;

    const stepMetrics: StepMetrics = {
      stepId,
      startTime: new Date(),
      retryCount: 0,
      status: 'running'
    };

    context.stepMetrics.set(stepId, stepMetrics);

    try {
      // Mock step execution - in production, this would delegate to the orchestrator
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      stepMetrics.status = 'completed';
      stepMetrics.endTime = new Date();
      stepMetrics.duration = stepMetrics.endTime.getTime() - stepMetrics.startTime.getTime();
      
      context.executionMetrics.totalStepsExecuted++;
      
      return { success: true, stepId, duration: stepMetrics.duration };
    } catch (error) {
      stepMetrics.status = 'failed';
      stepMetrics.endTime = new Date();
      context.executionMetrics.errorCount++;
      
      throw error;
    }
  }

  // Workflow Finalization
  private async finalizeExecution(executionId: string, workflow: AdvancedWorkflowDefinition): Promise<void> {
    const context = this.activeContexts.get(executionId);
    if (!context) return;

    // Cleanup scheduled tasks
    workflow.scheduling.forEach(schedule => {
      const timeout = this.scheduledTasks.get(schedule.id);
      if (timeout) {
        clearTimeout(timeout);
        this.scheduledTasks.delete(schedule.id);
      }
    });

    // Send completion notifications
    await this.sendCompletionNotifications(workflow, executionId);

    // Clean up context
    this.activeContexts.delete(executionId);
  }

  private async sendCompletionNotifications(workflow: AdvancedWorkflowDefinition, executionId: string): Promise<void> {
    const completionNotifications = workflow.notifications.filter(n => n.trigger === 'complete');
    
    for (const notification of completionNotifications) {
      // Mock notification sending
      console.log(`Sending completion notification for workflow ${workflow.name} to:`, notification.recipients);
    }
  }

  // Workflow Templates
  private initializeWorkflowTemplates(): void {
    // Customer Journey Automation Template
    this.workflowTemplates.set('customer-journey', {
      id: 'customer-journey',
      name: 'Customer Journey Automation',
      category: 'sales',
      description: 'Complete customer journey from lead to loyal customer',
      difficulty: 'advanced',
      estimatedDuration: 7200000, // 2 hours
      requiredAgents: ['email', 'sales', 'customer'],
      template: {
        id: 'customer-journey-template',
        name: 'Customer Journey Automation',
        description: 'Automated customer journey with personalization',
        triggers: [{ type: 'event', eventType: 'lead_created', enabled: true }],
        steps: [
          {
            id: 'initial_qualification',
            name: 'Initial Lead Qualification',
            agentType: 'sales',
            action: 'lead_qualification',
            parameters: { method: 'BANT' },
            dependencies: [],
            timeout: 300000,
            retryCount: 2
          },
          {
            id: 'personalized_welcome',
            name: 'Send Personalized Welcome',
            agentType: 'email',
            action: 'send_personalized_email',
            parameters: { template: 'welcome_personalized' },
            dependencies: ['initial_qualification'],
            timeout: 60000,
            retryCount: 1
          },
          {
            id: 'behavior_analysis',
            name: 'Analyze Customer Behavior',
            agentType: 'customer',
            action: 'behavior_analysis',
            parameters: { depth: 'comprehensive' },
            dependencies: ['personalized_welcome'],
            timeout: 180000,
            retryCount: 1
          }
        ],
        conditions: [],
        timeout: 7200000,
        maxRetries: 3,
        priority: 'high',
        variables: [
          {
            name: 'leadScore',
            type: 'number',
            defaultValue: 0,
            description: 'Lead qualification score',
            scope: 'global',
            validation: [
              { type: 'min', value: 0, message: 'Score must be non-negative' },
              { type: 'max', value: 100, message: 'Score must be <= 100' }
            ]
          },
          {
            name: 'customerSegment',
            type: 'string',
            defaultValue: 'unknown',
            description: 'Customer segment classification',
            scope: 'global'
          }
        ],
        loops: [
          {
            id: 'nurture_loop',
            type: 'while',
            condition: 'leadScore < 70 && loopCounters.nurture_loop < 5',
            maxIterations: 5,
            steps: ['send_nurture_email', 'track_engagement'],
            breakCondition: 'leadScore >= 70'
          }
        ],
        conditionalBranches: [
          {
            id: 'qualification_branch',
            condition: 'leadScore >= 70',
            trueSteps: ['create_opportunity', 'assign_sales_rep'],
            falseSteps: ['add_to_nurture_campaign']
          },
          {
            id: 'segment_branch',
            condition: 'customerSegment === "enterprise"',
            trueSteps: ['enterprise_onboarding'],
            falseSteps: ['standard_onboarding'],
            elseIfBranches: [
              {
                condition: 'customerSegment === "smb"',
                steps: ['smb_onboarding']
              }
            ]
          }
        ],
        parallelGroups: [
          {
            id: 'onboarding_parallel',
            steps: ['setup_account', 'send_resources', 'schedule_training'],
            waitForAll: true,
            maxConcurrency: 3,
            failureStrategy: 'continue',
            timeout: 600000
          }
        ],
        errorHandling: [
          {
            stepId: 'initial_qualification',
            errorType: 'timeout',
            action: 'retry',
            retryCount: 2,
            retryDelay: 60000
          },
          {
            stepId: 'behavior_analysis',
            errorType: 'failure',
            action: 'fallback',
            fallbackSteps: ['basic_analysis']
          }
        ],
        notifications: [
          {
            id: 'high_value_lead',
            trigger: 'milestone',
            condition: 'leadScore >= 90',
            recipients: ['sales-manager@company.com'],
            template: 'high_value_lead_alert',
            channel: 'email',
            priority: 'high'
          }
        ],
        approvals: [
          {
            id: 'enterprise_approval',
            stepId: 'enterprise_onboarding',
            approvers: ['sales-director@company.com'],
            approvalType: 'any',
            timeout: 3600000,
            autoApprovalCondition: 'leadScore >= 95'
          }
        ],
        scheduling: [
          {
            id: 'follow_up_delay',
            stepId: 'send_follow_up',
            scheduleType: 'delay',
            delay: 86400000 // 24 hours
          }
        ]
      } as AdvancedWorkflowDefinition,
      examples: [
        {
          name: 'Enterprise Lead',
          description: 'High-value enterprise lead processing',
          inputData: { leadScore: 85, customerSegment: 'enterprise' },
          expectedOutput: { qualified: true, opportunity: 'created' },
          executionTime: 1800000
        }
      ],
      documentation: 'Advanced customer journey automation with conditional logic and parallel processing'
    });

    // Support Escalation Template
    this.workflowTemplates.set('support-escalation', {
      id: 'support-escalation',
      name: 'Intelligent Support Escalation',
      category: 'support',
      description: 'Automated support ticket escalation with AI-powered routing',
      difficulty: 'intermediate',
      estimatedDuration: 3600000, // 1 hour
      requiredAgents: ['customer', 'email'],
      template: {
        id: 'support-escalation-template',
        name: 'Intelligent Support Escalation',
        description: 'AI-powered support ticket routing and escalation',
        triggers: [{ type: 'event', eventType: 'support_ticket_created', enabled: true }],
        steps: [
          {
            id: 'analyze_ticket',
            name: 'Analyze Support Ticket',
            agentType: 'customer',
            action: 'analyze_support_ticket',
            parameters: { includeHistory: true },
            dependencies: [],
            timeout: 120000,
            retryCount: 1
          },
          {
            id: 'auto_response',
            name: 'Send Auto Response',
            agentType: 'email',
            action: 'send_auto_response',
            parameters: { template: 'ticket_received' },
            dependencies: ['analyze_ticket'],
            timeout: 30000,
            retryCount: 2
          }
        ],
        conditions: [],
        timeout: 3600000,
        maxRetries: 2,
        priority: 'high',
        variables: [
          {
            name: 'urgency',
            type: 'string',
            defaultValue: 'medium',
            description: 'Ticket urgency level',
            scope: 'global'
          },
          {
            name: 'category',
            type: 'string',
            defaultValue: 'general',
            description: 'Support category',
            scope: 'global'
          }
        ],
        loops: [],
        conditionalBranches: [
          {
            id: 'urgency_branch',
            condition: 'urgency === "critical"',
            trueSteps: ['immediate_escalation'],
            falseSteps: ['standard_routing'],
            elseIfBranches: [
              {
                condition: 'urgency === "high"',
                steps: ['priority_routing']
              }
            ]
          }
        ],
        parallelGroups: [],
        errorHandling: [
          {
            stepId: 'analyze_ticket',
            errorType: 'failure',
            action: 'escalate',
            escalationTarget: 'human-agent'
          }
        ],
        notifications: [
          {
            id: 'critical_alert',
            trigger: 'milestone',
            condition: 'urgency === "critical"',
            recipients: ['support-manager@company.com'],
            template: 'critical_ticket_alert',
            channel: 'email',
            priority: 'urgent'
          }
        ],
        approvals: [],
        scheduling: [
          {
            id: 'sla_reminder',
            stepId: 'sla_check',
            scheduleType: 'delay',
            delay: 14400000 // 4 hours
          }
        ]
      } as AdvancedWorkflowDefinition,
      examples: [
        {
          name: 'Critical Bug Report',
          description: 'Critical system bug requiring immediate attention',
          inputData: { urgency: 'critical', category: 'bug' },
          expectedOutput: { escalated: true, response_time: 300 },
          executionTime: 900000
        }
      ],
      documentation: 'Intelligent support ticket routing with SLA management'
    });
  }

  // Public API Methods
  async createWorkflowFromTemplate(templateId: string, customizations: Partial<AdvancedWorkflowDefinition> = {}): Promise<string> {
    const template = this.workflowTemplates.get(templateId);
    if (!template) {
      throw new Error(`Workflow template ${templateId} not found`);
    }

    const workflow = {
      ...template.template,
      ...customizations,
      id: `workflow-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const workflowId = this.orchestrator.createWorkflow(workflow);
    return workflowId;
  }

  async submitApproval(approvalId: string, approver: string, decision: 'approve' | 'reject', comments?: string): Promise<void> {
    const approval = this.approvalQueue.get(approvalId);
    if (!approval) {
      throw new Error(`Approval ${approvalId} not found`);
    }

    const vote: ApprovalVote = {
      approver,
      decision,
      timestamp: new Date(),
      comments
    };

    approval.approvers.push(vote);

    // Check if approval is complete
    // This would need to check the approval rule to determine if enough votes are collected
    approval.status = decision === 'approve' ? 'approved' : 'rejected';
    approval.decidedAt = new Date();

    this.approvalQueue.delete(approvalId);
  }

  // Getters
  getWorkflowTemplates(): WorkflowTemplate[] {
    return Array.from(this.workflowTemplates.values());
  }

  getWorkflowTemplate(id: string): WorkflowTemplate | undefined {
    return this.workflowTemplates.get(id);
  }

  getActiveContexts(): Map<string, WorkflowContext> {
    return this.activeContexts;
  }

  getApprovalQueue(): ApprovalStatus[] {
    return Array.from(this.approvalQueue.values());
  }

  getExecutionMetrics(executionId: string): ExecutionMetrics | undefined {
    const context = this.activeContexts.get(executionId);
    return context?.executionMetrics;
  }
}

// Helper Classes
class Semaphore {
  private permits: number;
  private waitQueue: Array<(release: () => void) => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve(() => {
          this.permits++;
          if (this.waitQueue.length > 0) {
            const next = this.waitQueue.shift()!;
            this.permits--;
            next(() => {
              this.permits++;
              if (this.waitQueue.length > 0) {
                const nextNext = this.waitQueue.shift()!;
                this.permits--;
                nextNext(() => this.permits++);
              }
            });
          }
        });
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }
}

interface ExecutionOptions {
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
  };
  notifications?: {
    onStart?: string[];
    onComplete?: string[];
    onError?: string[];
  };
} 