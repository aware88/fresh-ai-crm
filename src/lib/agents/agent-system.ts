import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentState,
  AgentTask,
  AgentThought,
  AgentAction,
  AgentEvent,
  AgentConfig,
  AgentResponse,
  HumanApprovalRequest,
  AgentCapability,
  AgentMemory,
  ConversationEntry,
} from './types';
import { aiEngine, AIProcessingContext } from './ai-engine';
import { SalesAgent } from './sales-agent';

export class AgentSystem extends EventEmitter {
  private agents: Map<string, AgentState> = new Map();
  private taskQueue: AgentTask[] = [];
  private isRunning: boolean = false;
  private config: AgentConfig;
  private processingInterval?: NodeJS.Timeout;
  private humanApprovalQueue: HumanApprovalRequest[] = [];

  constructor(config: Partial<AgentConfig> = {}) {
    super();
    this.config = {
      maxConcurrentTasks: 5,
      thoughtRetentionDays: 30,
      enableAutoMode: true,
      requireHumanApproval: false,
      allowedActions: ['email_send', 'data_query', 'product_search', 'customer_analysis'],
      personalityTraits: { helpful: 0.9, analytical: 0.8, proactive: 0.7 },
      ...config,
    };
  }

  // Agent Management
  async createAgent(
    name: string,
    type: AgentState['type'],
    capabilities: AgentCapability[]
  ): Promise<string> {
    const agentId = uuidv4();
    const agent: AgentState = {
      id: agentId,
      name,
      type,
      status: 'idle',
      capabilities,
      memory: {
        conversationHistory: [],
        contextualMemory: {},
        longTermMemory: {},
        workingMemory: {},
      },
      thoughts: [],
      createdAt: new Date(),
      lastActivity: new Date(),
      metrics: {
        tasksCompleted: 0,
        successRate: 0,
        averageResponseTime: 0,
        totalThoughts: 0,
        totalActions: 0,
      },
    };

    this.agents.set(agentId, agent);
    this.emitEvent('agent_status', agentId, { status: 'created', agent });
    
    return agentId;
  }

  async removeAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    // Cancel any pending tasks for this agent
    this.taskQueue = this.taskQueue.filter(task => task.agentId !== agentId);
    
    this.agents.delete(agentId);
    this.emitEvent('agent_status', agentId, { status: 'removed' });
    
    return true;
  }

  getAgent(agentId: string): AgentState | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): AgentState[] {
    return Array.from(this.agents.values());
  }

  // Task Management
  async addTask(task: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const taskId = uuidv4();
    const newTask: AgentTask = {
      id: taskId,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...task,
      status: 'queued',
    };

    this.taskQueue.push(newTask);
    this.emitEvent('task_update', task.agentId || 'system', { task: newTask });
    
    return taskId;
  }

  async cancelTask(taskId: string): Promise<boolean> {
    const taskIndex = this.taskQueue.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return false;

    const task = this.taskQueue[taskIndex];
    if (task.status === 'processing') {
      // If task is being processed, mark it as cancelled
      task.status = 'cancelled';
      task.updatedAt = new Date();
    } else {
      // If task is queued, remove it
      this.taskQueue.splice(taskIndex, 1);
    }

    this.emitEvent('task_update', task.agentId || 'system', { task });
    return true;
  }

  getTaskQueue(): AgentTask[] {
    return [...this.taskQueue];
  }

  // Thought Management
  async addThought(
    agentId: string,
    type: AgentThought['type'],
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const thought: AgentThought = {
      id: uuidv4(),
      agentId,
      timestamp: new Date(),
      type,
      content,
      metadata,
    };

    agent.thoughts.push(thought);
    agent.metrics.totalThoughts++;
    agent.lastActivity = new Date();

    // Limit thought retention
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - this.config.thoughtRetentionDays);
    agent.thoughts = agent.thoughts.filter(t => t.timestamp > retentionDate);

    this.emitEvent('thought', agentId, thought);
  }

  // Action Management
  async executeAction(
    agentId: string,
    actionType: string,
    parameters: Record<string, any>
  ): Promise<AgentResponse> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    if (!this.config.allowedActions.includes(actionType)) {
      return { success: false, error: 'Action not allowed' };
    }

    const action: AgentAction = {
      id: uuidv4(),
      type: actionType,
      parameters,
      timestamp: new Date(),
      status: 'pending',
    };

    // Check if human approval is required
    if (this.config.requireHumanApproval) {
      const approvalRequest: HumanApprovalRequest = {
        id: uuidv4(),
        agentId,
        taskId: agent.currentTask || '',
        action,
        reasoning: `Agent ${agent.name} wants to execute ${actionType}`,
        priority: 'medium',
        createdAt: new Date(),
        status: 'pending',
      };

      this.humanApprovalQueue.push(approvalRequest);
      this.emitEvent('action', agentId, { action, requiresApproval: true });
      
      return { success: true, data: { requiresApproval: true, approvalId: approvalRequest.id } };
    }

    // Execute action immediately
    return await this.performAction(agentId, action);
  }

  private async performAction(agentId: string, action: AgentAction): Promise<AgentResponse> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    action.status = 'executing';
    this.emitEvent('action', agentId, action);

    try {
      // Route to appropriate action handler
      let result: any;
      switch (action.type) {
        case 'email_send':
          result = await this.handleEmailSend(action.parameters);
          break;
        case 'data_query':
          result = await this.handleDataQuery(action.parameters);
          break;
        case 'product_search':
          result = await this.handleProductSearch(action.parameters);
          break;
        case 'customer_analysis':
          result = await this.handleCustomerAnalysis(action.parameters);
          break;
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }

      action.status = 'completed';
      action.result = result;
      agent.metrics.totalActions++;
      agent.lastActivity = new Date();

      this.emitEvent('action', agentId, action);
      
      return { success: true, data: result };
    } catch (error) {
      action.status = 'failed';
      action.error = error instanceof Error ? error.message : 'Unknown error';
      
      this.emitEvent('action', agentId, action);
      
      return { success: false, error: action.error };
    }
  }

  // Action Handlers (to be implemented based on your existing services)
  private async handleEmailSend(parameters: any): Promise<any> {
    // Implement email sending logic
    await this.addThought(parameters.agentId, 'action', 'Sending email...');
    return { sent: true, messageId: uuidv4() };
  }

  private async handleDataQuery(parameters: any): Promise<any> {
    // Implement data querying logic
    await this.addThought(parameters.agentId, 'action', 'Querying database...');
    return { results: [], count: 0 };
  }

  private async handleProductSearch(parameters: any): Promise<any> {
    // Implement product search logic
    await this.addThought(parameters.agentId, 'action', 'Searching products...');
    return { products: [], total: 0 };
  }

  private async handleCustomerAnalysis(parameters: any): Promise<any> {
    // Implement customer analysis logic
    await this.addThought(parameters.agentId, 'action', 'Analyzing customer data...');
    return { analysis: {}, insights: [] };
  }

  // System Control
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.processingInterval = setInterval(() => {
      this.processTaskQueue();
    }, 1000); // Process queue every second

    this.emitEvent('system', 'system', { status: 'started' });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.emitEvent('system', 'system', { status: 'stopped' });
  }

  private async processTaskQueue(): Promise<void> {
    if (!this.isRunning || this.taskQueue.length === 0) return;

    const processingTasks = this.taskQueue.filter(task => task.status === 'processing').length;
    if (processingTasks >= this.config.maxConcurrentTasks) return;

    const nextTask = this.taskQueue.find(task => task.status === 'queued');
    if (!nextTask) return;

    await this.processTask(nextTask);
  }

  private async processTask(task: AgentTask): Promise<void> {
    task.status = 'processing';
    task.updatedAt = new Date();

    // Find appropriate agent or assign to general agent
    let agent: AgentState | undefined;
    if (task.agentId) {
      agent = this.agents.get(task.agentId);
    } else {
      // Find best agent for this task type
      agent = this.findBestAgent(task.type);
      if (agent) {
        task.agentId = agent.id;
      }
    }

    if (!agent) {
      task.status = 'failed';
      task.error = 'No suitable agent found';
      task.updatedAt = new Date();
      return;
    }

    agent.status = 'thinking';
    agent.currentTask = task.id;

    try {
      // Use AI engine to process the task
      const context: AIProcessingContext = {
        agent,
        task,
        conversationHistory: agent.memory.conversationHistory,
        availableActions: this.config.allowedActions,
        systemContext: {
          agentCapabilities: agent.capabilities,
          systemConfig: this.config,
          taskQueue: this.taskQueue.length
        }
      };

      const aiResponse = await aiEngine.processTask(context);
      
      // Add AI-generated thoughts to the agent
      for (const thought of aiResponse.thoughts) {
        agent.thoughts.push(thought);
        agent.metrics.totalThoughts++;
        this.emitEvent('thought', agent.id, thought);
      }

      // Execute AI-generated actions
      for (const action of aiResponse.actions) {
        const actionResult = await this.performAction(agent.id, action);
        if (!actionResult.success) {
          throw new Error(`Action failed: ${actionResult.error}`);
        }
      }
      
      task.status = 'completed';
      task.output = {
        reasoning: aiResponse.reasoning,
        confidence: aiResponse.confidence,
        nextSteps: aiResponse.nextSteps,
        actionsExecuted: aiResponse.actions.length
      };
      task.completedAt = new Date();
      task.updatedAt = new Date();
      
      agent.status = 'idle';
      agent.currentTask = undefined;
      agent.metrics.tasksCompleted++;
      
      // Update success rate
      const totalTasks = agent.metrics.tasksCompleted + (agent.metrics.lastError ? 1 : 0);
      agent.metrics.successRate = agent.metrics.tasksCompleted / totalTasks;
      
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.updatedAt = new Date();
      
      agent.status = 'error';
      agent.currentTask = undefined;
      agent.metrics.lastError = task.error;
      
      await this.addThought(agent.id, 'reflection', `Task failed: ${task.error}`);
    }

    this.emitEvent('task_update', agent.id, { task });
  }

  private findBestAgent(taskType: string): AgentState | undefined {
    const availableAgents = Array.from(this.agents.values()).filter(
      agent => agent.status === 'idle'
    );

    // Simple scoring based on agent type and task type
    const scored = availableAgents.map(agent => ({
      agent,
      score: this.calculateAgentScore(agent, taskType),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.agent;
  }

  private calculateAgentScore(agent: AgentState, taskType: string): number {
    let score = 0;
    
    // Base score from success rate
    score += agent.metrics.successRate * 0.4;
    
    // Type matching bonus
    if (taskType.includes('email') && agent.type === 'email') score += 0.3;
    if (taskType.includes('sales') && agent.type === 'sales') score += 0.3;
    if (taskType.includes('customer') && agent.type === 'customer_success') score += 0.3;
    if (taskType.includes('data') && agent.type === 'data_analyst') score += 0.3;
    
    // Capability matching
    const relevantCapabilities = agent.capabilities.filter(cap => 
      cap.enabled && taskType.includes(cap.name.toLowerCase())
    );
    score += relevantCapabilities.length * 0.1;
    
    return score;
  }

  private async processTaskByType(task: AgentTask, agent: AgentState): Promise<any> {
    await this.addThought(agent.id, 'planning', `Processing ${task.type} task`);
    
    switch (task.type) {
      case 'email_response':
        return await this.processEmailResponse(task, agent);
      case 'product_search':
        return await this.processProductSearch(task, agent);
      case 'customer_analysis':
        return await this.processCustomerAnalysis(task, agent);
      case 'data_query':
        return await this.processDataQuery(task, agent);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async processEmailResponse(task: AgentTask, agent: AgentState): Promise<any> {
    await this.addThought(agent.id, 'reasoning', 'Analyzing email context and generating response');
    // Implement email response logic
    return { response: 'Generated email response', confidence: 0.9 };
  }

  private async processProductSearch(task: AgentTask, agent: AgentState): Promise<any> {
    await this.addThought(agent.id, 'reasoning', 'Searching products based on criteria');
    // Implement product search logic
    return { products: [], searchQuery: task.input.query };
  }

  private async processCustomerAnalysis(task: AgentTask, agent: AgentState): Promise<any> {
    await this.addThought(agent.id, 'reasoning', 'Analyzing customer data and behavior');
    // Implement customer analysis logic
    return { insights: [], recommendations: [] };
  }

  private async processDataQuery(task: AgentTask, agent: AgentState): Promise<any> {
    await this.addThought(agent.id, 'reasoning', 'Executing data query');
    // Implement data query logic
    return { data: [], query: task.input.query };
  }

  // Human Approval Management
  async approveAction(approvalId: string): Promise<boolean> {
    const request = this.humanApprovalQueue.find(req => req.id === approvalId);
    if (!request || request.status !== 'pending') return false;

    request.status = 'approved';
    const result = await this.performAction(request.agentId, request.action);
    
    this.emitEvent('approval', request.agentId, { request, result });
    return true;
  }

  async rejectAction(approvalId: string): Promise<boolean> {
    const request = this.humanApprovalQueue.find(req => req.id === approvalId);
    if (!request || request.status !== 'pending') return false;

    request.status = 'rejected';
    this.emitEvent('approval', request.agentId, { request, rejected: true });
    return true;
  }

  getPendingApprovals(): HumanApprovalRequest[] {
    return this.humanApprovalQueue.filter(req => req.status === 'pending');
  }

  // Event Management
  private emitEvent(type: AgentEvent['type'], agentId: string, data: any): void {
    const event: AgentEvent = {
      type,
      agentId,
      data,
      timestamp: new Date(),
    };
    
    this.emit('agent_event', event);
  }

  // Memory Management
  async addConversationEntry(
    agentId: string,
    role: ConversationEntry['role'],
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const entry: ConversationEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      role,
      content,
      metadata,
    };

    agent.memory.conversationHistory.push(entry);
    
    // Limit conversation history
    if (agent.memory.conversationHistory.length > 100) {
      agent.memory.conversationHistory = agent.memory.conversationHistory.slice(-100);
    }
  }

  async updateAgentMemory(
    agentId: string,
    memoryType: keyof AgentMemory,
    key: string,
    value: any
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    if (memoryType !== 'conversationHistory') {
      (agent.memory[memoryType] as Record<string, any>)[key] = value;
    }
  }

  // Configuration
  updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emitEvent('system', 'system', { config: this.config });
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  // Metrics and Monitoring
  getSystemMetrics(): any {
    return {
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter(a => a.status !== 'idle').length,
      queuedTasks: this.taskQueue.filter(t => t.status === 'queued').length,
      processingTasks: this.taskQueue.filter(t => t.status === 'processing').length,
      completedTasks: this.taskQueue.filter(t => t.status === 'completed').length,
      failedTasks: this.taskQueue.filter(t => t.status === 'failed').length,
      pendingApprovals: this.humanApprovalQueue.filter(r => r.status === 'pending').length,
      isRunning: this.isRunning,
    };
  }
}

// Global instance
export const agentSystem = new AgentSystem(); 