import { NextRequest, NextResponse } from 'next/server';
import { MultiAgentOrchestrator } from '@/lib/agents/multi-agent-orchestrator';

// Global orchestrator instance
const orchestrator = new MultiAgentOrchestrator();

// GET /api/agents/orchestrator - Get orchestrator status and metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'metrics':
        const metrics = orchestrator.getMetrics();
        return NextResponse.json({
          success: true,
          data: { metrics }
        });

      case 'workflows':
        const workflows = orchestrator.getAllWorkflows();
        return NextResponse.json({
          success: true,
          data: { workflows, count: workflows.length }
        });

      case 'executions':
        const executions = orchestrator.getExecutions();
        return NextResponse.json({
          success: true,
          data: { executions, count: executions.length }
        });

      case 'handoffs':
        const handoffs = orchestrator.getHandoffs();
        return NextResponse.json({
          success: true,
          data: { handoffs, count: handoffs.length }
        });

      case 'collaborations':
        const collaborations = orchestrator.getCollaborations();
        return NextResponse.json({
          success: true,
          data: { collaborations, count: collaborations.length }
        });

      default:
        // Return general status
        const status = {
          isRunning: orchestrator.isRunningStatus(),
          metrics: orchestrator.getMetrics(),
          workflowCount: orchestrator.getAllWorkflows().length,
          executionCount: orchestrator.getExecutions().length,
          agentCount: orchestrator.getAllAgents().length
        };

        return NextResponse.json({
          success: true,
          data: status
        });
    }
  } catch (error) {
    console.error('Error in orchestrator GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get orchestrator status' },
      { status: 500 }
    );
  }
}

// POST /api/agents/orchestrator - Control orchestrator and execute workflows
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'start':
        orchestrator.start();
        return NextResponse.json({
          success: true,
          data: { message: 'Orchestrator started', isRunning: true }
        });

      case 'stop':
        orchestrator.stop();
        return NextResponse.json({
          success: true,
          data: { message: 'Orchestrator stopped', isRunning: false }
        });

      case 'execute_workflow':
        const { workflowId, context, triggeredBy } = params;
        if (!workflowId) {
          return NextResponse.json(
            { success: false, error: 'Workflow ID is required' },
            { status: 400 }
          );
        }

        const executionId = await orchestrator.executeWorkflow(
          workflowId,
          context || {},
          triggeredBy || 'manual'
        );

        return NextResponse.json({
          success: true,
          data: { executionId, message: 'Workflow execution started' }
        });

      case 'create_workflow':
        const { workflow } = params;
        if (!workflow) {
          return NextResponse.json(
            { success: false, error: 'Workflow definition is required' },
            { status: 400 }
          );
        }

        const newWorkflowId = orchestrator.createWorkflow(workflow);
        return NextResponse.json({
          success: true,
          data: { workflowId: newWorkflowId, message: 'Workflow created' }
        });

      case 'request_handoff':
        const { fromAgent, toAgent, taskId, handoffContext, reason } = params;
        if (!fromAgent || !toAgent || !taskId) {
          return NextResponse.json(
            { success: false, error: 'fromAgent, toAgent, and taskId are required' },
            { status: 400 }
          );
        }

        const handoffId = await orchestrator.requestHandoff(
          fromAgent,
          toAgent,
          taskId,
          handoffContext || {},
          reason || 'Task handoff requested'
        );

        return NextResponse.json({
          success: true,
          data: { handoffId, message: 'Handoff requested' }
        });

      case 'request_collaboration':
        const { requestingAgent, targetAgent, collaborationType, description, collaborationContext } = params;
        if (!requestingAgent || !targetAgent || !collaborationType) {
          return NextResponse.json(
            { success: false, error: 'requestingAgent, targetAgent, and collaborationType are required' },
            { status: 400 }
          );
        }

        const collaborationId = await orchestrator.requestCollaboration(
          requestingAgent,
          targetAgent,
          collaborationType,
          description || 'Collaboration requested',
          collaborationContext || {}
        );

        return NextResponse.json({
          success: true,
          data: { collaborationId, message: 'Collaboration requested' }
        });

      case 'register_agent':
        const { agent } = params;
        if (!agent) {
          return NextResponse.json(
            { success: false, error: 'Agent object is required' },
            { status: 400 }
          );
        }

        orchestrator.registerAgent(agent);
        return NextResponse.json({
          success: true,
          data: { message: 'Agent registered successfully' }
        });

      case 'test_workflow':
        // Test workflow execution with sample data
        const workflows = orchestrator.getAllWorkflows();
        if (workflows.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No workflows available for testing' },
            { status: 400 }
          );
        }

        const testWorkflow = workflows[0]; // Use first workflow for testing
        const testExecutionId = await orchestrator.executeWorkflow(
          testWorkflow.id,
          { testMode: true, sampleData: 'test execution' },
          'test'
        );

        return NextResponse.json({
          success: true,
          data: {
            executionId: testExecutionId,
            workflowName: testWorkflow.name,
            message: 'Test workflow execution started'
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in orchestrator POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process orchestrator request' },
      { status: 500 }
    );
  }
}

// PUT /api/agents/orchestrator - Update workflow or configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'update_workflow':
        const { workflowId, updates } = params;
        if (!workflowId || !updates) {
          return NextResponse.json(
            { success: false, error: 'Workflow ID and updates are required' },
            { status: 400 }
          );
        }

        const success = orchestrator.updateWorkflow(workflowId, updates);
        if (!success) {
          return NextResponse.json(
            { success: false, error: 'Workflow not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: { message: 'Workflow updated successfully' }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in orchestrator PUT:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update orchestrator' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/orchestrator - Delete workflow
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json(
        { success: false, error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    const success = orchestrator.deleteWorkflow(workflowId);
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Workflow deleted successfully' }
    });
  } catch (error) {
    console.error('Error in orchestrator DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
} 