import { NextRequest, NextResponse } from 'next/server';
import { agentSystem } from '@/lib/agents/agent-system';

// GET /api/agents/tasks - Get task queue and history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const status = searchParams.get('status');
    
    const taskQueue = agentSystem.getTaskQueue();
    
    let filteredTasks = taskQueue;
    
    if (agentId) {
      filteredTasks = filteredTasks.filter(task => task.agentId === agentId);
    }
    
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        tasks: filteredTasks,
        total: filteredTasks.length,
        byStatus: {
          queued: filteredTasks.filter(t => t.status === 'queued').length,
          processing: filteredTasks.filter(t => t.status === 'processing').length,
          completed: filteredTasks.filter(t => t.status === 'completed').length,
          failed: filteredTasks.filter(t => t.status === 'failed').length,
          cancelled: filteredTasks.filter(t => t.status === 'cancelled').length,
        }
      }
    });
  } catch (error) {
    console.error('Error getting tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get tasks' },
      { status: 500 }
    );
  }
}

// POST /api/agents/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, input, priority = 'medium', agentId, metadata } = body;

    if (!type || !input) {
      return NextResponse.json(
        { success: false, error: 'Type and input are required' },
        { status: 400 }
      );
    }

    const validTypes = ['email_response', 'product_search', 'customer_analysis', 'data_query', 'custom'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid task type. Valid types: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { success: false, error: `Invalid priority. Valid priorities: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    const taskId = await agentSystem.addTask({
      type,
      input,
      priority,
      status: 'queued',
      agentId,
      metadata,
    });

    return NextResponse.json({
      success: true,
      data: { taskId, message: 'Task created successfully' }
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/tasks - Cancel a task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const success = await agentSystem.cancelTask(taskId);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Task not found or cannot be cancelled' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Task cancelled successfully' }
    });
  } catch (error) {
    console.error('Error cancelling task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel task' },
      { status: 500 }
    );
  }
} 