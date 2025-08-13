import { EventEmitter } from 'events';
import { AgentTask, AgentThought, AgentAction, AgentEvent, AgentState, AgentCapability } from './types';
import { aiEngine } from './ai-engine';
import { EmailAgent } from './email-agent';
import { ProductAgent } from './product-agent';
import { CustomerAgent } from './customer-agent';
import { SalesAgent } from './sales-agent';

// Agent interface for orchestration
export interface Agent {
  id: string;
  name: string;
  type: 'email' | 'sales' | 'customer' | 'product' | 'data_analyst' | 'general';
  status: 'idle' | 'active' | 'busy' | 'error';
  capabilities: AgentCapability[];
  currentTask: AgentTask | null;
  processTask(task: AgentTask): Promise<void>;
}

// Orchestration-specific types
export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  timeout: number; // milliseconds
  maxRetries: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: 'event' | 'schedule' | 'manual' | 'condition';
  eventType?: string;
  schedule?: string; // cron expression
  condition?: string;
  enabled: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentType: 'email' | 'sales' | 'customer' | 'product' | 'data_analyst' | 'general';
  action: string;
  parameters: Record<string, any>;
  dependencies: string[]; // step IDs that must complete first
  timeout: number;
  retryCount: number;
  onSuccess?: string; // next step ID
  onFailure?: string; // next step ID
  condition?: string; // condition to execute this step
}

export interface WorkflowCondition {
  id: string;
  expression: string;
  description: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  currentStep?: string;
  stepExecutions: StepExecution[];
  context: Record<string, any>;
  result?: any;
  error?: string;
  triggeredBy: string;
}

export interface StepExecution {
  stepId: string;
  agentId: string;
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  result?: any;
  error?: string;
  retryCount: number;
  thoughts: AgentThought[];
  actions: AgentAction[];
}

export interface TaskHandoff {
  id: string;
  fromAgent: string;
  toAgent: string;
  taskId: string;
  context: Record<string, any>;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata: Record<string, any>;
}

export interface CollaborationRequest {
  id: string;
  requestingAgent: string;
  targetAgent: string;
  type: 'consultation' | 'data_request' | 'approval' | 'assistance';
  description: string;
  context: Record<string, any>;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  deadline?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  response?: any;
  timestamp: Date;
}

export interface OrchestrationMetrics {
  totalWorkflows: number;
  activeExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  handoffCount: number;
  collaborationCount: number;
  agentUtilization: Record<string, number>;
  bottlenecks: string[];
}

export class MultiAgentOrchestrator extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private handoffs: Map<string, TaskHandoff> = new Map();
  private collaborations: Map<string, CollaborationRequest> = new Map();
  private isRunning: boolean = false;
  private executionInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializeDefaultWorkflows();
  }

  // Agent Management
  registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    this.emit('agent:registered', agent.id);
  }

  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  // Workflow Management
  createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): string {
    const workflow: WorkflowDefinition = {
      id: `workflow-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...definition
    };

    this.workflows.set(workflow.id, workflow);
    return workflow.id;
  }

  updateWorkflow(id: string, updates: Partial<WorkflowDefinition>): boolean {
    const workflow = this.workflows.get(id);
    if (!workflow) return false;

    Object.assign(workflow, updates, { updatedAt: new Date() });
    this.workflows.set(id, workflow);
    return true;
  }

  deleteWorkflow(id: string): boolean {
    return this.workflows.delete(id);
  }

  getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  // Workflow Execution
  async executeWorkflow(workflowId: string, context: Record<string, any> = {}, triggeredBy: string = 'manual'): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const execution: WorkflowExecution = {
      id: `execution-${Date.now()}`,
      workflowId,
      status: 'pending',
      startTime: new Date(),
      stepExecutions: [],
      context,
      triggeredBy
    };

    this.executions.set(execution.id, execution);
    
    // Start execution in background
    this.processExecution(execution.id);
    
    return execution.id;
  }

  private async processExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) return;

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) return;

    try {
      execution.status = 'running';
      this.emit('workflow:started', execution.id);
      
      // Execute steps in dependency order
      const sortedSteps = this.sortStepsByDependencies(workflow.steps);
      
      for (const step of sortedSteps) {
        if (execution.status !== 'running') break;

        // Check if step should be executed based on conditions
        if (step.condition && !this.evaluateCondition(step.condition, execution.context)) {
          this.addStepExecution(execution, step.id, 'skipped');
          continue;
        }

        // Wait for dependencies to complete
        await this.waitForDependencies(execution, step.dependencies);

        // Execute the step
        await this.executeStep(execution, step);
      }

      execution.status = 'completed';
      execution.endTime = new Date();
      this.emit('workflow:completed', execution.id);

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.endTime = new Date();
    }

    this.executions.set(executionId, execution);
  }

  private async executeStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    const agent = this.findAgentByType(step.agentType);
    if (!agent) {
      throw new Error(`No agent found for type: ${step.agentType}`);
    }

    const stepExecution: StepExecution = {
      stepId: step.id,
      agentId: agent.id,
      taskId: `task-${Date.now()}`,
      status: 'running',
      startTime: new Date(),
      retryCount: 0,
      thoughts: [],
      actions: []
    };

    execution.stepExecutions.push(stepExecution);
    execution.currentStep = step.id;

    try {
      // Create task for the agent
      const task: AgentTask = {
        id: stepExecution.taskId,
        type: 'custom',
        priority: 'medium',
        status: 'queued',
        input: { 
          action: step.action,
          description: `Workflow step: ${step.name}`,
          ...step.parameters, 
          context: execution.context 
        },
        agentId: agent.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Execute the task
      await agent.processTask(task);

      stepExecution.status = 'completed';
      stepExecution.endTime = new Date();
      stepExecution.result = task.output;

      // Update execution context with step results
      if (task.output) {
        execution.context[`step_${step.id}_result`] = task.output;
      }

    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.error = error instanceof Error ? error.message : 'Unknown error';
      stepExecution.endTime = new Date();

      // Retry logic
      if (stepExecution.retryCount < step.retryCount) {
        stepExecution.retryCount++;
        await this.executeStep(execution, step);
      } else {
        throw error;
      }
    }
  }

  private sortStepsByDependencies(steps: WorkflowStep[]): WorkflowStep[] {
    const sorted: WorkflowStep[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (step: WorkflowStep) => {
      if (temp.has(step.id)) {
        throw new Error(`Circular dependency detected involving step: ${step.id}`);
      }
      if (visited.has(step.id)) return;

      temp.add(step.id);

      // Visit dependencies first
      for (const depId of step.dependencies) {
        const depStep = steps.find(s => s.id === depId);
        if (depStep) {
          visit(depStep);
        }
      }

      temp.delete(step.id);
      visited.add(step.id);
      sorted.push(step);
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        visit(step);
      }
    }

    return sorted;
  }

  private async waitForDependencies(execution: WorkflowExecution, dependencies: string[]): Promise<void> {
    const maxWait = 30000; // 30 seconds
    const checkInterval = 1000; // 1 second
    let waited = 0;

    while (waited < maxWait) {
      const allCompleted = dependencies.every(depId => {
        const stepExecution = execution.stepExecutions.find(se => se.stepId === depId);
        return stepExecution && (stepExecution.status === 'completed' || stepExecution.status === 'skipped');
      });

      if (allCompleted) return;

      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    throw new Error(`Timeout waiting for dependencies: ${dependencies.join(', ')}`);
  }

  private findAgentByType(type: string): Agent | undefined {
    return Array.from(this.agents.values()).find(agent => agent.type === type);
  }

  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    try {
      // Simple condition evaluation - in production, use a proper expression evaluator
      const func = new Function('context', `return ${condition}`);
      return func(context);
    } catch {
      return false;
    }
  }

  private addStepExecution(execution: WorkflowExecution, stepId: string, status: 'skipped'): void {
    execution.stepExecutions.push({
      stepId,
      agentId: '',
      taskId: '',
      status,
      startTime: new Date(),
      endTime: new Date(),
      retryCount: 0,
      thoughts: [],
      actions: []
    });
  }

  // Task Handoff Management
  async requestHandoff(fromAgent: string, toAgent: string, taskId: string, context: Record<string, any>, reason: string): Promise<string> {
    const handoff: TaskHandoff = {
      id: `handoff-${Date.now()}`,
      fromAgent,
      toAgent,
      taskId,
      context,
      reason,
      status: 'pending',
      timestamp: new Date(),
      priority: 'medium',
      metadata: {}
    };

    this.handoffs.set(handoff.id, handoff);

    // Notify target agent
    const targetAgent = this.agents.get(toAgent);
    if (targetAgent) {
      // Create a new task for the target agent
      const newTask: AgentTask = {
        id: `task-${Date.now()}`,
        type: 'custom',
        priority: 'medium',
        status: 'queued',
        input: {
          action: 'handoff_task',
          description: `Handoff from ${fromAgent}: ${reason}`,
          ...context
        },
        agentId: toAgent,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await targetAgent.processTask(newTask);
      handoff.status = 'accepted';
    }

    return handoff.id;
  }

  // Collaboration Management
  async requestCollaboration(requestingAgent: string, targetAgent: string, type: CollaborationRequest['type'], description: string, context: Record<string, any>): Promise<string> {
    const collaboration: CollaborationRequest = {
      id: `collab-${Date.now()}`,
      requestingAgent,
      targetAgent,
      type,
      description,
      context,
      urgency: 'medium',
      status: 'pending',
      timestamp: new Date()
    };

    this.collaborations.set(collaboration.id, collaboration);

    // Process collaboration request
    await this.processCollaboration(collaboration.id);

    return collaboration.id;
  }

  private async processCollaboration(collaborationId: string): Promise<void> {
    const collaboration = this.collaborations.get(collaborationId);
    if (!collaboration) return;

    const targetAgent = this.agents.get(collaboration.targetAgent);
    if (!targetAgent) {
      collaboration.status = 'rejected';
      return;
    }

    collaboration.status = 'in_progress';

    try {
      // Create a task for the target agent to handle the collaboration
      const task: AgentTask = {
        id: `task-${Date.now()}`,
        type: 'custom',
        priority: 'medium',
        status: 'queued',
        input: {
          action: 'collaboration_task',
          description: `Collaboration request: ${collaboration.description}`,
          collaborationType: collaboration.type,
          requestingAgent: collaboration.requestingAgent,
          context: collaboration.context
        },
        agentId: collaboration.targetAgent,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await targetAgent.processTask(task);

      collaboration.status = 'completed';
      collaboration.response = task.output;

    } catch (error) {
      collaboration.status = 'rejected';
    }

    this.collaborations.set(collaborationId, collaboration);
  }

  // Metrics and Monitoring
  getMetrics(): OrchestrationMetrics {
    const executions = Array.from(this.executions.values());
    const completed = executions.filter(e => e.status === 'completed');
    const failed = executions.filter(e => e.status === 'failed');

    const agentUtilization: Record<string, number> = {};
    this.agents.forEach(agent => {
      const agentTasks = executions.filter(e => 
        e.stepExecutions.some(se => se.agentId === agent.id)
      );
      agentUtilization[agent.id] = agentTasks.length;
    });

    return {
      totalWorkflows: this.workflows.size,
      activeExecutions: executions.filter(e => e.status === 'running').length,
      completedExecutions: completed.length,
      failedExecutions: failed.length,
      averageExecutionTime: completed.length > 0 ? 
        completed.reduce((sum, e) => sum + (e.endTime!.getTime() - e.startTime.getTime()), 0) / completed.length : 0,
      successRate: executions.length > 0 ? (completed.length / executions.length) * 100 : 0,
      handoffCount: this.handoffs.size,
      collaborationCount: this.collaborations.size,
      agentUtilization,
      bottlenecks: this.identifyBottlenecks()
    };
  }

  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    // Avoid recursion by calculating metrics directly here
    const executions = Array.from(this.executions.values());
    const agentUtilization: Record<string, number> = {};
    
    executions.forEach(execution => {
      agentUtilization[execution.agentId] = (agentUtilization[execution.agentId] || 0) + 1;
    });

    // Identify agents with high utilization
    Object.entries(agentUtilization).forEach(([agentId, count]) => {
      if (count > 10) {
        bottlenecks.push(`High utilization on agent: ${agentId}`);
      }
    });

    // Identify slow workflows
    const slowExecutions = executions.filter(e => {
      if (e.status === 'completed' && e.endTime) {
        const duration = e.endTime.getTime() - e.startTime.getTime();
        return duration > 300000; // 5 minutes
      }
      return false;
    });

    if (slowExecutions.length > 0) {
      bottlenecks.push(`${slowExecutions.length} slow workflow executions detected`);
    }

    return bottlenecks;
  }

  // Default Workflows
  private initializeDefaultWorkflows(): void {
    // Customer Onboarding Workflow
    this.createWorkflow({
      name: 'Customer Onboarding',
      description: 'Complete customer onboarding process',
      triggers: [
        { type: 'event', eventType: 'customer_signup', enabled: true }
      ],
      steps: [
        {
          id: 'welcome_email',
          name: 'Send Welcome Email',
          agentType: 'email',
          action: 'send_welcome_email',
          parameters: { template: 'welcome' },
          dependencies: [],
          timeout: 30000,
          retryCount: 2
        },
        {
          id: 'create_profile',
          name: 'Create Customer Profile',
          agentType: 'customer',
          action: 'create_profile',
          parameters: {},
          dependencies: ['welcome_email'],
          timeout: 60000,
          retryCount: 1
        },
        {
          id: 'product_recommendations',
          name: 'Generate Product Recommendations',
          agentType: 'product',
          action: 'generate_recommendations',
          parameters: {},
          dependencies: ['create_profile'],
          timeout: 45000,
          retryCount: 1
        }
      ],
      conditions: [],
      timeout: 300000,
      maxRetries: 3,
      priority: 'high'
    });

    // Lead Processing Workflow
    this.createWorkflow({
      name: 'Lead Processing',
      description: 'Process and qualify new leads',
      triggers: [
        { type: 'event', eventType: 'lead_created', enabled: true }
      ],
      steps: [
        {
          id: 'lead_qualification',
          name: 'Qualify Lead',
          agentType: 'sales',
          action: 'lead_qualification',
          parameters: {},
          dependencies: [],
          timeout: 60000,
          retryCount: 2
        },
        {
          id: 'send_followup',
          name: 'Send Follow-up Email',
          agentType: 'email',
          action: 'send_followup',
          parameters: { template: 'lead_followup' },
          dependencies: ['lead_qualification'],
          timeout: 30000,
          retryCount: 1,
          condition: 'context.step_lead_qualification_result.qualified === true'
        },
        {
          id: 'create_opportunity',
          name: 'Create Sales Opportunity',
          agentType: 'sales',
          action: 'create_opportunity',
          parameters: {},
          dependencies: ['lead_qualification'],
          timeout: 45000,
          retryCount: 1,
          condition: 'context.step_lead_qualification_result.score >= 70'
        }
      ],
      conditions: [],
      timeout: 180000,
      maxRetries: 2,
      priority: 'high'
    });

    // Customer Support Workflow
    this.createWorkflow({
      name: 'Customer Support',
      description: 'Handle customer support requests',
      triggers: [
        { type: 'event', eventType: 'support_ticket_created', enabled: true }
      ],
      steps: [
        {
          id: 'analyze_request',
          name: 'Analyze Support Request',
          agentType: 'customer',
          action: 'analyze_support_request',
          parameters: {},
          dependencies: [],
          timeout: 30000,
          retryCount: 1
        },
        {
          id: 'generate_response',
          name: 'Generate Response',
          agentType: 'email',
          action: 'generate_support_response',
          parameters: {},
          dependencies: ['analyze_request'],
          timeout: 45000,
          retryCount: 2
        },
        {
          id: 'escalate_if_needed',
          name: 'Escalate to Human',
          agentType: 'general',
          action: 'escalate_to_human',
          parameters: {},
          dependencies: ['analyze_request'],
          timeout: 15000,
          retryCount: 1,
          condition: 'context.step_analyze_request_result.requiresHuman === true'
        }
      ],
      conditions: [],
      timeout: 120000,
      maxRetries: 2,
      priority: 'high'
    });
  }

  // Control Methods
  start(): void {
    this.isRunning = true;
    this.executionInterval = setInterval(() => {
      this.processScheduledWorkflows();
    }, 60000); // Check every minute
  }

  stop(): void {
    this.isRunning = false;
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
    }
  }

  private processScheduledWorkflows(): void {
    if (!this.isRunning) return;

    // Process workflows with schedule triggers
    this.workflows.forEach(workflow => {
      workflow.triggers.forEach(trigger => {
        if (trigger.type === 'schedule' && trigger.enabled && trigger.schedule) {
          // In a real implementation, you would use a proper cron scheduler
          // For now, we'll just log that we would process it
          console.log(`Would process scheduled workflow: ${workflow.name}`);
        }
      });
    });
  }

  // Public getters
  getExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  getHandoffs(): TaskHandoff[] {
    return Array.from(this.handoffs.values());
  }

  getCollaborations(): CollaborationRequest[] {
    return Array.from(this.collaborations.values());
  }

  getExecution(id: string): WorkflowExecution | undefined {
    return this.executions.get(id);
  }

  isRunningStatus(): boolean {
    return this.isRunning;
  }

  // Agent status management
  updateAgentStatus(agentId: string, status: 'idle' | 'active' | 'busy' | 'error'): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
      this.emit('agent:status_changed', agentId, status);
    }
  }
} 