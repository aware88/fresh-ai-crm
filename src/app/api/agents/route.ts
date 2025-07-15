import { NextRequest, NextResponse } from 'next/server';
import { agentSystem } from '@/lib/agents/agent-system';
import { AgentCapability } from '@/lib/agents/types';

// GET /api/agents - Get all agents and system status
export async function GET(request: NextRequest) {
  try {
    const agents = agentSystem.getAllAgents();
    const systemMetrics = agentSystem.getSystemMetrics();
    const config = agentSystem.getConfig();
    
    return NextResponse.json({
      success: true,
      data: {
        agents,
        systemMetrics,
        config,
        isRunning: systemMetrics.isRunning,
      }
    });
  } catch (error) {
    console.error('Error getting agents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, capabilities } = body;

    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: 'Name and type are required' },
        { status: 400 }
      );
    }

    // Default capabilities based on agent type
    const defaultCapabilities: Record<string, AgentCapability[]> = {
      email: [
        { id: 'email_read', name: 'Email Reading', description: 'Read and analyze emails', enabled: true },
        { id: 'email_compose', name: 'Email Composition', description: 'Compose email responses', enabled: true },
        { id: 'email_send', name: 'Email Sending', description: 'Send emails', enabled: true },
        { id: 'personality_analysis', name: 'Personality Analysis', description: 'Analyze sender personality', enabled: true },
      ],
      sales: [
        { id: 'lead_qualification', name: 'Lead Qualification', description: 'Qualify sales leads', enabled: true },
        { id: 'product_recommendation', name: 'Product Recommendation', description: 'Recommend products', enabled: true },
        { id: 'price_negotiation', name: 'Price Negotiation', description: 'Handle price negotiations', enabled: true },
        { id: 'crm_update', name: 'CRM Updates', description: 'Update CRM records', enabled: true },
      ],
      customer_success: [
        { id: 'support_ticket', name: 'Support Tickets', description: 'Handle support tickets', enabled: true },
        { id: 'customer_analysis', name: 'Customer Analysis', description: 'Analyze customer behavior', enabled: true },
        { id: 'churn_prediction', name: 'Churn Prediction', description: 'Predict customer churn', enabled: true },
        { id: 'satisfaction_survey', name: 'Satisfaction Surveys', description: 'Conduct satisfaction surveys', enabled: true },
      ],
      data_analyst: [
        { id: 'data_query', name: 'Data Querying', description: 'Query databases', enabled: true },
        { id: 'report_generation', name: 'Report Generation', description: 'Generate reports', enabled: true },
        { id: 'trend_analysis', name: 'Trend Analysis', description: 'Analyze trends', enabled: true },
        { id: 'insight_generation', name: 'Insight Generation', description: 'Generate insights', enabled: true },
      ],
      general: [
        { id: 'task_execution', name: 'Task Execution', description: 'Execute general tasks', enabled: true },
        { id: 'data_processing', name: 'Data Processing', description: 'Process data', enabled: true },
        { id: 'notification_sending', name: 'Notifications', description: 'Send notifications', enabled: true },
      ],
    };

    const agentCapabilities = capabilities || defaultCapabilities[type] || defaultCapabilities.general;
    
    const agentId = await agentSystem.createAgent(name, type, agentCapabilities);
    
    return NextResponse.json({
      success: true,
      data: { agentId }
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents - Remove an agent
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const success = await agentSystem.removeAgent(agentId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Agent removed successfully' }
    });
  } catch (error) {
    console.error('Error removing agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove agent' },
      { status: 500 }
    );
  }
} 