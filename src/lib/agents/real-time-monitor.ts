import { EventEmitter } from 'events';
import { AgentState, AgentTask, AgentThought, AgentAction, AgentEvent } from './types';
import { MultiAgentOrchestrator } from './multi-agent-orchestrator';
import { AdvancedWorkflowEngine } from './advanced-workflow-engine';
import { PredictiveIntelligence } from './predictive-intelligence';

// Real-time Monitoring Types
export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical' | 'down';
  score: number; // 0-100
  timestamp: Date;
  components: ComponentHealth[];
  alerts: SystemAlert[];
  metrics: SystemMetrics;
  uptime: number;
  lastHealthCheck: Date;
}

export interface ComponentHealth {
  name: string;
  type: 'agent' | 'database' | 'api' | 'workflow' | 'integration';
  status: 'healthy' | 'warning' | 'critical' | 'down';
  score: number;
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
  details: Record<string, any>;
}

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'critical';
  category: 'performance' | 'security' | 'availability' | 'capacity' | 'business';
  title: string;
  message: string;
  source: string;
  severity: number; // 1-10
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  actions: AlertAction[];
  metadata: Record<string, any>;
}

export interface AlertAction {
  id: string;
  name: string;
  description: string;
  type: 'manual' | 'automated';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  executedAt?: Date;
  result?: any;
}

export interface SystemMetrics {
  cpu: ResourceMetric;
  memory: ResourceMetric;
  network: NetworkMetric;
  storage: StorageMetric;
  agents: AgentMetrics;
  workflows: WorkflowMetrics;
  integrations: IntegrationMetrics;
  business: BusinessMetrics;
}

export interface ResourceMetric {
  current: number;
  average: number;
  peak: number;
  threshold: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  history: MetricDataPoint[];
}

export interface NetworkMetric {
  latency: number;
  throughput: number;
  errorRate: number;
  connections: number;
  history: MetricDataPoint[];
}

export interface StorageMetric {
  used: number;
  total: number;
  available: number;
  iops: number;
  history: MetricDataPoint[];
}

export interface AgentMetrics {
  totalAgents: number;
  activeAgents: number;
  busyAgents: number;
  errorAgents: number;
  averageResponseTime: number;
  taskCompletionRate: number;
  thoughtsPerMinute: number;
  actionsPerMinute: number;
  agentUtilization: Record<string, number>;
}

export interface WorkflowMetrics {
  totalWorkflows: number;
  activeExecutions: number;
  completedToday: number;
  failedToday: number;
  averageExecutionTime: number;
  successRate: number;
  queueDepth: number;
  throughput: number;
}

export interface IntegrationMetrics {
  totalIntegrations: number;
  activeIntegrations: number;
  syncSuccessRate: number;
  averageSyncTime: number;
  dataVolume: number;
  errorCount: number;
}

export interface BusinessMetrics {
  leadsProcessed: number;
  customersAnalyzed: number;
  emailsSent: number;
  opportunitiesCreated: number;
  churnPredictions: number;
  revenueImpact: number;
}

export interface MetricDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface PerformanceProfile {
  agentId: string;
  agentName: string;
  type: string;
  metrics: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    throughput: number;
    cpuUsage: number;
    memoryUsage: number;
    taskQueue: number;
  };
  trends: {
    responseTime: 'improving' | 'degrading' | 'stable';
    successRate: 'improving' | 'degrading' | 'stable';
    throughput: 'improving' | 'degrading' | 'stable';
  };
  recommendations: string[];
  lastUpdated: Date;
}

export interface WorkflowExecutionTrace {
  executionId: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  steps: StepTrace[];
  parallelGroups: ParallelGroupTrace[];
  loops: LoopTrace[];
  approvals: ApprovalTrace[];
  errors: ExecutionError[];
  metrics: ExecutionMetrics;
}

export interface StepTrace {
  stepId: string;
  stepName: string;
  agentId: string;
  agentType: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  retryCount: number;
  thoughts: AgentThought[];
  actions: AgentAction[];
  input: any;
  output: any;
  error?: string;
}

export interface ParallelGroupTrace {
  groupId: string;
  steps: string[];
  startTime: Date;
  endTime?: Date;
  concurrency: number;
  completedSteps: number;
  failedSteps: number;
  efficiency: number; // 0-100
}

export interface LoopTrace {
  loopId: string;
  iterations: number;
  startTime: Date;
  endTime?: Date;
  breakReason?: string;
  averageIterationTime: number;
  totalTime: number;
}

export interface ApprovalTrace {
  approvalId: string;
  stepId: string;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  requestTime: Date;
  responseTime?: Date;
  approvers: string[];
  votes: any[];
}

export interface ExecutionError {
  stepId: string;
  errorType: string;
  message: string;
  timestamp: Date;
  stack?: string;
  resolved: boolean;
  resolution?: string;
}

export interface ExecutionMetrics {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  averageStepTime: number;
  totalThoughts: number;
  totalActions: number;
  parallelEfficiency: number;
  resourceUtilization: number;
}

export interface DashboardConfig {
  refreshInterval: number;
  alertThresholds: {
    cpu: number;
    memory: number;
    errorRate: number;
    responseTime: number;
  };
  retentionPeriod: number;
  notifications: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
  };
  customMetrics: CustomMetric[];
}

export interface CustomMetric {
  id: string;
  name: string;
  description: string;
  query: string;
  type: 'gauge' | 'counter' | 'histogram';
  unit: string;
  thresholds: {
    warning: number;
    critical: number;
  };
}

export class RealTimeMonitor extends EventEmitter {
  private orchestrator: MultiAgentOrchestrator;
  private workflowEngine: AdvancedWorkflowEngine;
  private predictiveIntelligence: PredictiveIntelligence;
  
  private systemHealth: SystemHealth;
  private alerts: Map<string, SystemAlert> = new Map();
  private metrics: Map<string, MetricDataPoint[]> = new Map();
  private performanceProfiles: Map<string, PerformanceProfile> = new Map();
  private executionTraces: Map<string, WorkflowExecutionTrace> = new Map();
  private config: DashboardConfig;
  
  private monitoringInterval?: NodeJS.Timeout;
  private metricsInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;
  
  constructor(
    orchestrator: MultiAgentOrchestrator,
    workflowEngine: AdvancedWorkflowEngine,
    predictiveIntelligence: PredictiveIntelligence
  ) {
    super();
    
    this.orchestrator = orchestrator;
    this.workflowEngine = workflowEngine;
    this.predictiveIntelligence = predictiveIntelligence;
    
    this.config = this.getDefaultConfig();
    this.systemHealth = this.initializeSystemHealth();
    
    this.initializeMonitoring();
  }

  // Monitoring Control
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Start health check monitoring
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.refreshInterval);
    
    // Start metrics collection
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000); // Collect metrics every 5 seconds
    
    this.emit('monitoring:started');
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this.emit('monitoring:stopped');
  }

  // Health Monitoring
  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const components = await this.checkAllComponents();
      const alerts = this.generateAlerts(components);
      const metrics = await this.getCurrentMetrics();
      
      const overallScore = this.calculateOverallHealth(components);
      const overallStatus = this.getHealthStatus(overallScore);
      
      this.systemHealth = {
        overall: overallStatus,
        score: overallScore,
        timestamp: new Date(),
        components,
        alerts,
        metrics,
        uptime: this.getUptime(),
        lastHealthCheck: new Date()
      };
      
      // Store health metrics
      this.storeMetric('system.health.score', overallScore);
      this.storeMetric('system.health.check_duration', Date.now() - startTime);
      
      this.emit('health:updated', this.systemHealth);
      
    } catch (error) {
      this.createAlert('error', 'system', 'Health Check Failed', 
        `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 8);
    }
  }

  private async checkAllComponents(): Promise<ComponentHealth[]> {
    const components: ComponentHealth[] = [];
    
    // Check agents
    const agents = this.orchestrator.getAllAgents();
    for (const agent of agents) {
      const health = await this.checkAgentHealth(agent);
      components.push(health);
    }
    
    // Check workflows
    const workflowHealth = await this.checkWorkflowHealth();
    components.push(workflowHealth);
    
    // Check integrations
    const integrationHealth = await this.checkIntegrationHealth();
    components.push(integrationHealth);
    
    // Check predictive intelligence
    const aiHealth = await this.checkAIHealth();
    components.push(aiHealth);
    
    return components;
  }

  private async checkAgentHealth(agent: any): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      // Mock health check - in production, this would ping the agent
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      
      const responseTime = Date.now() - startTime;
      const errorRate = Math.random() * 5; // Mock error rate
      
      let score = 100;
      if (responseTime > 1000) score -= 20;
      if (errorRate > 2) score -= 30;
      if (agent.status === 'error') score -= 50;
      
      return {
        name: agent.name || agent.id,
        type: 'agent',
        status: this.getHealthStatus(score),
        score: Math.max(0, score),
        responseTime,
        errorRate,
        lastCheck: new Date(),
        details: {
          agentType: agent.type,
          currentTask: agent.currentTask,
          capabilities: agent.capabilities?.length || 0,
          thoughts: agent.thoughts?.length || 0
        }
      };
      
    } catch (error) {
      return {
        name: agent.name || agent.id,
        type: 'agent',
        status: 'critical',
        score: 0,
        responseTime: Date.now() - startTime,
        errorRate: 100,
        lastCheck: new Date(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private async checkWorkflowHealth(): Promise<ComponentHealth> {
    const workflows = this.orchestrator.getAllWorkflows();
    const executions = this.orchestrator.getExecutions();
    
    const activeExecutions = executions.filter(e => e.status === 'running').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    const totalExecutions = executions.length;
    
    const successRate = totalExecutions > 0 ? 
      ((totalExecutions - failedExecutions) / totalExecutions) * 100 : 100;
    
    let score = successRate;
    if (activeExecutions > 10) score -= 10; // Too many active executions
    if (failedExecutions > 5) score -= 20; // Too many failures
    
    return {
      name: 'Workflow Engine',
      type: 'workflow',
      status: this.getHealthStatus(score),
      score: Math.max(0, score),
      responseTime: 0,
      errorRate: (failedExecutions / Math.max(totalExecutions, 1)) * 100,
      lastCheck: new Date(),
      details: {
        totalWorkflows: workflows.length,
        activeExecutions,
        failedExecutions,
        successRate
      }
    };
  }

  private async checkIntegrationHealth(): Promise<ComponentHealth> {
    // Mock integration health check
    const score = 85 + Math.random() * 15; // Mock score
    
    return {
      name: 'Integration Services',
      type: 'integration',
      status: this.getHealthStatus(score),
      score,
      responseTime: 200 + Math.random() * 300,
      errorRate: Math.random() * 3,
      lastCheck: new Date(),
      details: {
        activeIntegrations: 3,
        syncSuccessRate: 95,
        lastSync: new Date()
      }
    };
  }

  private async checkAIHealth(): Promise<ComponentHealth> {
    const models = this.predictiveIntelligence.getModels();
    const predictions = this.predictiveIntelligence.getPredictions();
    
    const activeModels = models.filter(m => m.isActive).length;
    const recentPredictions = predictions.filter(p => 
      Date.now() - p.createdAt.getTime() < 3600000 // Last hour
    ).length;
    
    let score = 90;
    if (activeModels < 3) score -= 15; // Not enough models
    if (recentPredictions === 0) score -= 10; // No recent predictions
    
    return {
      name: 'Predictive Intelligence',
      type: 'ai',
      status: this.getHealthStatus(score),
      score,
      responseTime: 500 + Math.random() * 500,
      errorRate: Math.random() * 2,
      lastCheck: new Date(),
      details: {
        activeModels,
        totalPredictions: predictions.length,
        recentPredictions,
        insights: this.predictiveIntelligence.getInsights().length
      }
    };
  }

  private calculateOverallHealth(components: ComponentHealth[]): number {
    if (components.length === 0) return 0;
    
    const totalScore = components.reduce((sum, comp) => sum + comp.score, 0);
    return totalScore / components.length;
  }

  private getHealthStatus(score: number): 'healthy' | 'warning' | 'critical' | 'down' {
    if (score >= 80) return 'healthy';
    if (score >= 60) return 'warning';
    if (score >= 20) return 'critical';
    return 'down';
  }

  // Metrics Collection
  private async collectMetrics(): Promise<void> {
    const timestamp = new Date();
    
    // System metrics
    this.storeMetric('system.cpu.usage', 20 + Math.random() * 60);
    this.storeMetric('system.memory.usage', 30 + Math.random() * 50);
    this.storeMetric('system.network.latency', 50 + Math.random() * 100);
    
    // Agent metrics
    const agents = this.orchestrator.getAllAgents();
    this.storeMetric('agents.total', agents.length);
    this.storeMetric('agents.active', agents.filter(a => a.status === 'active').length);
    this.storeMetric('agents.busy', agents.filter(a => a.status === 'busy').length);
    
    // Workflow metrics
    const executions = this.orchestrator.getExecutions();
    this.storeMetric('workflows.active', executions.filter(e => e.status === 'running').length);
    this.storeMetric('workflows.completed_today', this.getCompletedToday(executions));
    this.storeMetric('workflows.failed_today', this.getFailedToday(executions));
    
    // Business metrics
    const businessMetrics = await this.collectBusinessMetrics();
    Object.entries(businessMetrics).forEach(([key, value]) => {
      this.storeMetric(`business.${key}`, value);
    });
    
    this.emit('metrics:collected', timestamp);
  }

  private async getCurrentMetrics(): Promise<SystemMetrics> {
    return {
      cpu: this.getResourceMetric('system.cpu.usage', 80, '%'),
      memory: this.getResourceMetric('system.memory.usage', 85, '%'),
      network: {
        latency: this.getLatestMetric('system.network.latency') || 0,
        throughput: 1000 + Math.random() * 500,
        errorRate: Math.random() * 2,
        connections: 50 + Math.random() * 20,
        history: this.getMetricHistory('system.network.latency', 60)
      },
      storage: {
        used: 500 + Math.random() * 200,
        total: 1000,
        available: 300 + Math.random() * 100,
        iops: 1000 + Math.random() * 500,
        history: []
      },
      agents: {
        totalAgents: this.getLatestMetric('agents.total') || 0,
        activeAgents: this.getLatestMetric('agents.active') || 0,
        busyAgents: this.getLatestMetric('agents.busy') || 0,
        errorAgents: 0,
        averageResponseTime: 500 + Math.random() * 300,
        taskCompletionRate: 85 + Math.random() * 10,
        thoughtsPerMinute: 20 + Math.random() * 10,
        actionsPerMinute: 15 + Math.random() * 8,
        agentUtilization: {}
      },
      workflows: {
        totalWorkflows: this.orchestrator.getAllWorkflows().length,
        activeExecutions: this.getLatestMetric('workflows.active') || 0,
        completedToday: this.getLatestMetric('workflows.completed_today') || 0,
        failedToday: this.getLatestMetric('workflows.failed_today') || 0,
        averageExecutionTime: 120000 + Math.random() * 60000,
        successRate: 90 + Math.random() * 8,
        queueDepth: 5 + Math.random() * 10,
        throughput: 10 + Math.random() * 5
      },
      integrations: {
        totalIntegrations: 5,
        activeIntegrations: 4,
        syncSuccessRate: 95 + Math.random() * 4,
        averageSyncTime: 30000 + Math.random() * 15000,
        dataVolume: 1000 + Math.random() * 500,
        errorCount: Math.floor(Math.random() * 3)
      },
      business: {
        leadsProcessed: this.getLatestMetric('business.leadsProcessed') || 0,
        customersAnalyzed: this.getLatestMetric('business.customersAnalyzed') || 0,
        emailsSent: this.getLatestMetric('business.emailsSent') || 0,
        opportunitiesCreated: this.getLatestMetric('business.opportunitiesCreated') || 0,
        churnPredictions: this.getLatestMetric('business.churnPredictions') || 0,
        revenueImpact: this.getLatestMetric('business.revenueImpact') || 0
      }
    };
  }

  private getResourceMetric(metricName: string, threshold: number, unit: string): ResourceMetric {
    const history = this.getMetricHistory(metricName, 60);
    const current = this.getLatestMetric(metricName) || 0;
    const average = history.length > 0 ? 
      history.reduce((sum, point) => sum + point.value, 0) / history.length : 0;
    const peak = history.length > 0 ? 
      Math.max(...history.map(point => point.value)) : 0;
    
    return {
      current,
      average,
      peak,
      threshold,
      unit,
      trend: this.calculateTrend(history),
      history
    };
  }

  private calculateTrend(history: MetricDataPoint[]): 'up' | 'down' | 'stable' {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-10);
    const older = history.slice(-20, -10);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p.value, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.05) return 'up';
    if (change < -0.05) return 'down';
    return 'stable';
  }

  private async collectBusinessMetrics(): Promise<BusinessMetrics> {
    // Mock business metrics collection
    return {
      leadsProcessed: 25 + Math.floor(Math.random() * 10),
      customersAnalyzed: 15 + Math.floor(Math.random() * 8),
      emailsSent: 50 + Math.floor(Math.random() * 20),
      opportunitiesCreated: 8 + Math.floor(Math.random() * 5),
      churnPredictions: 12 + Math.floor(Math.random() * 6),
      revenueImpact: 50000 + Math.floor(Math.random() * 20000)
    };
  }

  // Alert Management
  private generateAlerts(components: ComponentHealth[]): SystemAlert[] {
    const alerts: SystemAlert[] = [];
    
    components.forEach(component => {
      if (component.status === 'critical' || component.status === 'down') {
        alerts.push(this.createAlert(
          'critical',
          'availability',
          `${component.name} is ${component.status}`,
          `Component ${component.name} is experiencing issues. Score: ${component.score}`,
          component.status === 'down' ? 10 : 8
        ));
      } else if (component.status === 'warning') {
        alerts.push(this.createAlert(
          'warning',
          'performance',
          `${component.name} performance degraded`,
          `Component ${component.name} is showing degraded performance. Score: ${component.score}`,
          5
        ));
      }
      
      if (component.responseTime > 2000) {
        alerts.push(this.createAlert(
          'warning',
          'performance',
          `High response time for ${component.name}`,
          `Response time is ${component.responseTime}ms, which exceeds threshold`,
          6
        ));
      }
      
      if (component.errorRate > 5) {
        alerts.push(this.createAlert(
          'error',
          'performance',
          `High error rate for ${component.name}`,
          `Error rate is ${component.errorRate}%, which exceeds threshold`,
          7
        ));
      }
    });
    
    return alerts;
  }

  private createAlert(
    type: 'error' | 'warning' | 'info' | 'critical',
    category: 'performance' | 'security' | 'availability' | 'capacity' | 'business',
    title: string,
    message: string,
    severity: number
  ): SystemAlert {
    const alert: SystemAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      category,
      title,
      message,
      source: 'real-time-monitor',
      severity,
      timestamp: new Date(),
      resolved: false,
      actions: [],
      metadata: {}
    };
    
    this.alerts.set(alert.id, alert);
    this.emit('alert:created', alert);
    
    return alert;
  }

  async resolveAlert(alertId: string, resolvedBy: string, resolution?: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) return;
    
    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;
    if (resolution) {
      alert.metadata.resolution = resolution;
    }
    
    this.emit('alert:resolved', alert);
  }

  // Performance Profiling
  async generatePerformanceProfile(agentId: string): Promise<PerformanceProfile> {
    const agent = this.orchestrator.getAllAgents().find(a => a.id === agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Mock performance data collection
    const profile: PerformanceProfile = {
      agentId,
      agentName: agent.name,
      type: agent.type,
      metrics: {
        averageResponseTime: 500 + Math.random() * 300,
        successRate: 85 + Math.random() * 10,
        errorRate: Math.random() * 5,
        throughput: 10 + Math.random() * 5,
        cpuUsage: 20 + Math.random() * 30,
        memoryUsage: 30 + Math.random() * 20,
        taskQueue: Math.floor(Math.random() * 10)
      },
      trends: {
        responseTime: 'stable',
        successRate: 'improving',
        throughput: 'stable'
      },
      recommendations: this.generateRecommendations(agent),
      lastUpdated: new Date()
    };
    
    this.performanceProfiles.set(agentId, profile);
    return profile;
  }

  private generateRecommendations(agent: any): string[] {
    const recommendations: string[] = [];
    
    // Mock recommendations based on agent performance
    if (Math.random() > 0.7) {
      recommendations.push('Consider increasing memory allocation for better performance');
    }
    
    if (Math.random() > 0.8) {
      recommendations.push('Review error handling to reduce failure rate');
    }
    
    if (Math.random() > 0.6) {
      recommendations.push('Optimize task processing logic for better throughput');
    }
    
    return recommendations;
  }

  // Workflow Execution Tracing
  startExecutionTrace(executionId: string): void {
    const execution = this.orchestrator.getExecution(executionId);
    if (!execution) return;
    
    const trace: WorkflowExecutionTrace = {
      executionId,
      workflowId: execution.workflowId,
      workflowName: 'Unknown', // Would get from workflow definition
      status: execution.status,
      startTime: execution.startTime,
      endTime: execution.endTime,
      duration: execution.endTime ? 
        execution.endTime.getTime() - execution.startTime.getTime() : undefined,
      steps: [],
      parallelGroups: [],
      loops: [],
      approvals: [],
      errors: [],
      metrics: {
        totalSteps: 0,
        completedSteps: 0,
        failedSteps: 0,
        skippedSteps: 0,
        averageStepTime: 0,
        totalThoughts: 0,
        totalActions: 0,
        parallelEfficiency: 0,
        resourceUtilization: 0
      }
    };
    
    this.executionTraces.set(executionId, trace);
    this.emit('trace:started', trace);
  }

  updateExecutionTrace(executionId: string, stepId: string, update: Partial<StepTrace>): void {
    const trace = this.executionTraces.get(executionId);
    if (!trace) return;
    
    let step = trace.steps.find(s => s.stepId === stepId);
    if (!step) {
      step = {
        stepId,
        stepName: 'Unknown',
        agentId: 'unknown',
        agentType: 'unknown',
        startTime: new Date(),
        status: 'pending',
        retryCount: 0,
        thoughts: [],
        actions: [],
        input: null,
        output: null
      };
      trace.steps.push(step);
    }
    
    Object.assign(step, update);
    this.emit('trace:updated', trace);
  }

  // Utility Methods
  private storeMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const history = this.metrics.get(name)!;
    history.push({
      timestamp: new Date(),
      value
    });
    
    // Keep only last 1000 data points
    if (history.length > 1000) {
      history.shift();
    }
  }

  private getLatestMetric(name: string): number | undefined {
    const history = this.metrics.get(name);
    return history && history.length > 0 ? history[history.length - 1].value : undefined;
  }

  private getMetricHistory(name: string, points: number): MetricDataPoint[] {
    const history = this.metrics.get(name) || [];
    return history.slice(-points);
  }

  private getCompletedToday(executions: any[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return executions.filter(e => 
      e.status === 'completed' && 
      e.endTime && 
      e.endTime >= today
    ).length;
  }

  private getFailedToday(executions: any[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return executions.filter(e => 
      e.status === 'failed' && 
      e.endTime && 
      e.endTime >= today
    ).length;
  }

  private getUptime(): number {
    // Mock uptime calculation
    return Date.now() - (Date.now() - 86400000); // 24 hours ago
  }

  private initializeSystemHealth(): SystemHealth {
    return {
      overall: 'healthy',
      score: 100,
      timestamp: new Date(),
      components: [],
      alerts: [],
      metrics: {} as SystemMetrics,
      uptime: 0,
      lastHealthCheck: new Date()
    };
  }

  private getDefaultConfig(): DashboardConfig {
    return {
      refreshInterval: 30000, // 30 seconds
      alertThresholds: {
        cpu: 80,
        memory: 85,
        errorRate: 5,
        responseTime: 2000
      },
      retentionPeriod: 86400000, // 24 hours
      notifications: {
        email: true,
        slack: false,
        webhook: false
      },
      customMetrics: []
    };
  }

  private initializeMonitoring(): void {
    // Set up event listeners for real-time updates
    this.orchestrator.on('agent:status_changed', (agentId: string, status: string) => {
      this.emit('agent:status_changed', { agentId, status });
    });
    
    this.orchestrator.on('workflow:started', (executionId: string) => {
      this.startExecutionTrace(executionId);
    });
    
    this.orchestrator.on('workflow:completed', (executionId: string) => {
      this.emit('workflow:completed', executionId);
    });
  }

  // Public API
  getSystemHealth(): SystemHealth {
    return this.systemHealth;
  }

  getAlerts(resolved?: boolean): SystemAlert[] {
    const alerts = Array.from(this.alerts.values());
    
    if (resolved !== undefined) {
      return alerts.filter(alert => alert.resolved === resolved);
    }
    
    return alerts;
  }

  getPerformanceProfile(agentId: string): PerformanceProfile | undefined {
    return this.performanceProfiles.get(agentId);
  }

  getAllPerformanceProfiles(): PerformanceProfile[] {
    return Array.from(this.performanceProfiles.values());
  }

  getExecutionTrace(executionId: string): WorkflowExecutionTrace | undefined {
    return this.executionTraces.get(executionId);
  }

  getAllExecutionTraces(): WorkflowExecutionTrace[] {
    return Array.from(this.executionTraces.values());
  }

  getMetrics(metricName?: string): Map<string, MetricDataPoint[]> | MetricDataPoint[] {
    if (metricName) {
      return this.metrics.get(metricName) || [];
    }
    return this.metrics;
  }

  getConfig(): DashboardConfig {
    return this.config;
  }

  updateConfig(updates: Partial<DashboardConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('config:updated', this.config);
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  // Cleanup
  cleanup(): void {
    this.stopMonitoring();
    this.removeAllListeners();
    this.alerts.clear();
    this.metrics.clear();
    this.performanceProfiles.clear();
    this.executionTraces.clear();
  }
} 