import { NextRequest, NextResponse } from 'next/server';
import { agentSystem } from '@/lib/agents/agent-system';

// POST /api/agents/system - Control system (start/stop)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    switch (action) {
      case 'start':
        await agentSystem.start();
        return NextResponse.json({
          success: true,
          data: { message: 'Agent system started', isRunning: true }
        });

      case 'stop':
        await agentSystem.stop();
        return NextResponse.json({
          success: true,
          data: { message: 'Agent system stopped', isRunning: false }
        });

      case 'configure':
        if (config) {
          agentSystem.updateConfig(config);
          return NextResponse.json({
            success: true,
            data: { message: 'Configuration updated', config: agentSystem.getConfig() }
          });
        }
        return NextResponse.json(
          { success: false, error: 'Configuration is required' },
          { status: 400 }
        );

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: start, stop, or configure' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error controlling agent system:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to control agent system' },
      { status: 500 }
    );
  }
}

// GET /api/agents/system - Get system status and configuration
export async function GET(request: NextRequest) {
  try {
    const systemMetrics = agentSystem.getSystemMetrics();
    const config = agentSystem.getConfig();
    
    return NextResponse.json({
      success: true,
      data: {
        systemMetrics,
        config,
        isRunning: systemMetrics.isRunning,
      }
    });
  } catch (error) {
    console.error('Error getting system status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get system status' },
      { status: 500 }
    );
  }
} 