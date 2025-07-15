import { NextRequest, NextResponse } from 'next/server';
import { RealTimeMonitor } from '@/lib/agents/real-time-monitor';
import { MultiAgentOrchestrator } from '@/lib/agents/multi-agent-orchestrator';
import { AdvancedWorkflowEngine } from '@/lib/agents/advanced-workflow-engine';
import { PredictiveIntelligence } from '@/lib/agents/predictive-intelligence';
import { EmailAgent } from '@/lib/agents/email-agent';
import { ProductAgent } from '@/lib/agents/product-agent';
import { CustomerAgent } from '@/lib/agents/customer-agent';
import { SalesAgent } from '@/lib/agents/sales-agent';
import { aiEngine } from '@/lib/agents/ai-engine';

// Initialize components
const orchestrator = new MultiAgentOrchestrator();
const workflowEngine = new AdvancedWorkflowEngine(orchestrator);

// Initialize mock predictive intelligence for monitoring
const predictiveIntelligence = {
  getModels: () => [],
  getPredictions: () => [],
  getInsights: () => [],
  generatePredictions: async () => [],
  generateBusinessInsights: async () => []
};

// Initialize monitor
const monitor = new RealTimeMonitor(orchestrator, workflowEngine, predictiveIntelligence);

// Start monitoring by default
monitor.startMonitoring();

// GET /api/agents/monitor - Get monitoring data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const agentId = searchParams.get('agentId');
    const executionId = searchParams.get('executionId');
    const metricName = searchParams.get('metricName');
    const resolved = searchParams.get('resolved');

    switch (action) {
      case 'health':
        const health = monitor.getSystemHealth();
        return NextResponse.json({
          success: true,
          data: { health }
        });

      case 'alerts':
        const alerts = monitor.getAlerts(
          resolved !== null ? resolved === 'true' : undefined
        );
        return NextResponse.json({
          success: true,
          data: { alerts, count: alerts.length }
        });

      case 'metrics':
        if (metricName) {
          const metricData = monitor.getMetrics(metricName);
          return NextResponse.json({
            success: true,
            data: { metric: metricName, data: metricData }
          });
        } else {
          const allMetrics = monitor.getMetrics();
          const metricsObj: Record<string, any> = {};
          allMetrics.forEach((value, key) => {
            metricsObj[key] = value;
          });
          return NextResponse.json({
            success: true,
            data: { metrics: metricsObj }
          });
        }

      case 'performance':
        if (agentId) {
          const profile = monitor.getPerformanceProfile(agentId);
          if (!profile) {
            return NextResponse.json(
              { success: false, error: 'Performance profile not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            data: { profile }
          });
        } else {
          const profiles = monitor.getAllPerformanceProfiles();
          return NextResponse.json({
            success: true,
            data: { profiles, count: profiles.length }
          });
        }

      case 'trace':
        if (executionId) {
          const trace = monitor.getExecutionTrace(executionId);
          if (!trace) {
            return NextResponse.json(
              { success: false, error: 'Execution trace not found' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            data: { trace }
          });
        } else {
          const traces = monitor.getAllExecutionTraces();
          return NextResponse.json({
            success: true,
            data: { traces, count: traces.length }
          });
        }

      case 'config':
        const config = monitor.getConfig();
        return NextResponse.json({
          success: true,
          data: { config }
        });

      case 'status':
        const status = {
          isMonitoring: monitor.isMonitoringActive(),
          health: monitor.getSystemHealth(),
          alertCount: monitor.getAlerts(false).length,
          profileCount: monitor.getAllPerformanceProfiles().length,
          traceCount: monitor.getAllExecutionTraces().length
        };
        return NextResponse.json({
          success: true,
          data: status
        });

      case 'dashboard':
        // Return comprehensive dashboard data
        const dashboardData = {
          health: monitor.getSystemHealth(),
          alerts: monitor.getAlerts(false).slice(0, 10), // Latest 10 alerts
          profiles: monitor.getAllPerformanceProfiles(),
          recentTraces: monitor.getAllExecutionTraces().slice(-5), // Latest 5 traces
          config: monitor.getConfig(),
          isMonitoring: monitor.isMonitoringActive()
        };
        return NextResponse.json({
          success: true,
          data: dashboardData
        });

      default:
        // Default: return system status
        const defaultStatus = {
          isMonitoring: monitor.isMonitoringActive(),
          health: monitor.getSystemHealth(),
          summary: {
            totalAlerts: monitor.getAlerts().length,
            unresolvedAlerts: monitor.getAlerts(false).length,
            agents: monitor.getAllPerformanceProfiles().length,
            activeTraces: monitor.getAllExecutionTraces().filter(t => t.status === 'running').length
          }
        };
        return NextResponse.json({
          success: true,
          data: defaultStatus
        });
    }
  } catch (error) {
    console.error('Error in monitor GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get monitoring data' },
      { status: 500 }
    );
  }
}

// POST /api/agents/monitor - Control monitoring and create resources
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'start':
        monitor.startMonitoring();
        return NextResponse.json({
          success: true,
          data: { message: 'Monitoring started', isMonitoring: true }
        });

      case 'stop':
        monitor.stopMonitoring();
        return NextResponse.json({
          success: true,
          data: { message: 'Monitoring stopped', isMonitoring: false }
        });

      case 'generate_profile':
        const { agentId } = params;
        if (!agentId) {
          return NextResponse.json(
            { success: false, error: 'Agent ID is required' },
            { status: 400 }
          );
        }

        const profile = await monitor.generatePerformanceProfile(agentId);
        return NextResponse.json({
          success: true,
          data: { profile, message: 'Performance profile generated' }
        });

      case 'start_trace':
        const { executionId } = params;
        if (!executionId) {
          return NextResponse.json(
            { success: false, error: 'Execution ID is required' },
            { status: 400 }
          );
        }

        monitor.startExecutionTrace(executionId);
        return NextResponse.json({
          success: true,
          data: { message: 'Execution trace started', executionId }
        });

      case 'resolve_alert':
        const { alertId, resolvedBy, resolution } = params;
        if (!alertId || !resolvedBy) {
          return NextResponse.json(
            { success: false, error: 'Alert ID and resolvedBy are required' },
            { status: 400 }
          );
        }

        await monitor.resolveAlert(alertId, resolvedBy, resolution);
        return NextResponse.json({
          success: true,
          data: { message: 'Alert resolved', alertId }
        });

      case 'test_health_check':
        // Force a health check
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate health check
        const healthAfterCheck = monitor.getSystemHealth();
        return NextResponse.json({
          success: true,
          data: { 
            message: 'Health check completed', 
            health: healthAfterCheck,
            timestamp: new Date()
          }
        });

      case 'simulate_alert':
        // Create a test alert for demonstration
        const testAlert = {
          type: params.type || 'warning',
          category: params.category || 'performance',
          title: params.title || 'Test Alert',
          message: params.message || 'This is a test alert created via API',
          severity: params.severity || 5
        };

        // This would normally be done internally by the monitor
        const testAlertId = `test-alert-${Date.now()}`;
        return NextResponse.json({
          success: true,
          data: { 
            message: 'Test alert created', 
            alertId: testAlertId,
            alert: testAlert
          }
        });

      case 'generate_test_data':
        // Generate test performance data for demonstration
        const testData = {
          metrics: {
            cpu: 45 + Math.random() * 30,
            memory: 60 + Math.random() * 25,
            network: 100 + Math.random() * 50,
            agents: {
              total: 5,
              active: 4,
              busy: 2
            }
          },
          alerts: [
            {
              id: `alert-${Date.now()}`,
              type: 'warning',
              title: 'High CPU Usage',
              message: 'CPU usage is above 70%',
              timestamp: new Date(),
              resolved: false
            }
          ],
          traces: [
            {
              executionId: `exec-${Date.now()}`,
              workflowName: 'Customer Onboarding',
              status: 'running',
              startTime: new Date(),
              steps: 3,
              completedSteps: 2
            }
          ]
        };

        return NextResponse.json({
          success: true,
          data: { 
            message: 'Test data generated', 
            testData,
            timestamp: new Date()
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in monitor POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process monitoring request' },
      { status: 500 }
    );
  }
}

// PUT /api/agents/monitor - Update configuration and resources
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'update_config':
        const { config } = params;
        if (!config) {
          return NextResponse.json(
            { success: false, error: 'Configuration is required' },
            { status: 400 }
          );
        }

        monitor.updateConfig(config);
        return NextResponse.json({
          success: true,
          data: { 
            message: 'Configuration updated', 
            config: monitor.getConfig()
          }
        });

      case 'update_trace':
        const { executionId, stepId, update } = params;
        if (!executionId || !stepId || !update) {
          return NextResponse.json(
            { success: false, error: 'Execution ID, step ID, and update data are required' },
            { status: 400 }
          );
        }

        monitor.updateExecutionTrace(executionId, stepId, update);
        return NextResponse.json({
          success: true,
          data: { 
            message: 'Execution trace updated', 
            executionId,
            stepId
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in monitor PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update monitoring resource' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/monitor - Clean up resources
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const alertId = searchParams.get('alertId');
    const executionId = searchParams.get('executionId');

    switch (action) {
      case 'clear_alerts':
        // This would clear resolved alerts older than retention period
        const clearedCount = 0; // Mock count
        return NextResponse.json({
          success: true,
          data: { 
            message: 'Resolved alerts cleared', 
            clearedCount
          }
        });

      case 'clear_traces':
        // This would clear old execution traces
        const clearedTraces = 0; // Mock count
        return NextResponse.json({
          success: true,
          data: { 
            message: 'Old execution traces cleared', 
            clearedTraces
          }
        });

      case 'clear_metrics':
        // This would clear old metric data
        const clearedMetrics = 0; // Mock count
        return NextResponse.json({
          success: true,
          data: { 
            message: 'Old metrics cleared', 
            clearedMetrics
          }
        });

      case 'cleanup':
        // Full cleanup
        monitor.cleanup();
        return NextResponse.json({
          success: true,
          data: { message: 'Monitor cleanup completed' }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in monitor DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete monitoring resource' },
      { status: 500 }
    );
  }
}

// WebSocket-like endpoint for real-time updates (using Server-Sent Events)
export async function GET_STREAM(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stream = searchParams.get('stream');
  
  if (stream !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Stream parameter required' },
      { status: 400 }
    );
  }

  // Create a readable stream for Server-Sent Events
  const encoder = new TextEncoder();
  
  const stream_response = new ReadableStream({
    start(controller) {
      // Send initial data
      const initialData = {
        type: 'initial',
        data: {
          health: monitor.getSystemHealth(),
          alerts: monitor.getAlerts(false).slice(0, 5),
          timestamp: new Date()
        }
      };
      
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));
      
      // Set up event listeners for real-time updates
      const healthUpdated = (health: any) => {
        const update = {
          type: 'health_update',
          data: { health, timestamp: new Date() }
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(update)}\n\n`));
      };
      
      const alertCreated = (alert: any) => {
        const update = {
          type: 'alert_created',
          data: { alert, timestamp: new Date() }
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(update)}\n\n`));
      };
      
      const metricsCollected = (timestamp: Date) => {
        const update = {
          type: 'metrics_update',
          data: { 
            metrics: monitor.getSystemHealth().metrics,
            timestamp 
          }
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(update)}\n\n`));
      };
      
      // Register event listeners
      monitor.on('health:updated', healthUpdated);
      monitor.on('alert:created', alertCreated);
      monitor.on('metrics:collected', metricsCollected);
      
      // Send periodic updates
      const interval = setInterval(() => {
        const update = {
          type: 'periodic_update',
          data: {
            health: monitor.getSystemHealth(),
            timestamp: new Date()
          }
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(update)}\n\n`));
      }, 30000); // Every 30 seconds
      
      // Cleanup function
      const cleanup = () => {
        monitor.off('health:updated', healthUpdated);
        monitor.off('alert:created', alertCreated);
        monitor.off('metrics:collected', metricsCollected);
        clearInterval(interval);
      };
      
      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup);
    }
  });

  return new Response(stream_response, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
} 