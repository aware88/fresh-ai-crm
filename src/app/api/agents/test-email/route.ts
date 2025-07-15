import { NextRequest, NextResponse } from 'next/server';
import { agentSystem } from '@/lib/agents/agent-system';

// POST /api/agents/test-email - Test the email agent with sample data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType = 'full_flow' } = body;

    // Sample email contexts for testing
    const sampleEmails = [
      {
        from: 'john.doe@example.com',
        to: 'support@yourcompany.com',
        subject: 'Product inquiry - Need pricing information',
        body: `Hi there,

I'm interested in your CRM solution and would like to get some pricing information. We're a small business with about 20 employees and need something that can handle our customer communications and sales pipeline.

Could you please send me a quote and let me know about any available demos?

Thanks,
John Doe
CEO, Example Corp`,
        timestamp: new Date(),
        customerData: {
          companySize: 'small',
          industry: 'technology',
          previousInteractions: 0
        }
      },
      {
        from: 'sarah.smith@techcorp.com',
        to: 'support@yourcompany.com',
        subject: 'URGENT: System down - need immediate help',
        body: `Hello,

Our CRM system has been down for the past 2 hours and we can't access any customer data. This is causing major issues for our sales team. 

We need immediate assistance to get this resolved. Please call me at 555-0123 ASAP.

This is affecting our business operations!

Sarah Smith
IT Manager, TechCorp`,
        timestamp: new Date(),
        customerData: {
          companySize: 'medium',
          industry: 'technology',
          previousInteractions: 15,
          priority: 'high'
        }
      },
      {
        from: 'mike.johnson@retail.com',
        to: 'sales@yourcompany.com',
        subject: 'Follow-up on demo - ready to move forward',
        body: `Hi,

Thanks for the great demo last week. Our team was impressed with the features and we're ready to move forward with the implementation.

Can you prepare a proposal for 50 users? We'd like to start with the Professional plan and need the integration with our existing accounting software.

When can we schedule a kick-off meeting?

Best regards,
Mike Johnson
Operations Director`,
        timestamp: new Date(),
        customerData: {
          companySize: 'medium',
          industry: 'retail',
          previousInteractions: 8,
          demoCompleted: true,
          interestedPlan: 'professional'
        }
      }
    ];

    if (testType === 'quick_analysis') {
      // Quick analysis test - just analyze without processing
      const results = [];
      
      for (const email of sampleEmails) {
        const taskId = await agentSystem.addTask({
          type: 'email_response',
          input: {
            emailContext: email,
            options: {
              tone: 'professional',
              length: 'detailed',
              includeAttachments: false,
              scheduleFollowUp: true,
              escalateToHuman: false
            }
          },
          priority: email.subject.includes('URGENT') ? 'urgent' : 'medium',
          status: 'queued'
        });
        
        results.push({
          taskId,
          email: {
            from: email.from,
            subject: email.subject,
            priority: email.subject.includes('URGENT') ? 'urgent' : 'medium'
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          message: 'Email analysis tasks created',
          tasks: results,
          totalTasks: results.length
        }
      });
    }

    if (testType === 'full_flow') {
      // Full flow test - create agents and process emails
      
      // Create an email agent if it doesn't exist
      const existingAgents = agentSystem.getAllAgents();
      let emailAgent = existingAgents.find(agent => agent.type === 'email');
      
      if (!emailAgent) {
        const agentId = await agentSystem.createAgent('Email Assistant', 'email', [
          { id: 'email_read', name: 'Email Reading', description: 'Read and analyze emails', enabled: true },
          { id: 'email_compose', name: 'Email Composition', description: 'Compose email responses', enabled: true },
          { id: 'email_send', name: 'Email Sending', description: 'Send emails', enabled: true },
          { id: 'personality_analysis', name: 'Personality Analysis', description: 'Analyze sender personality', enabled: true },
        ]);
        emailAgent = agentSystem.getAgent(agentId);
      }

      // Start the system if not running
      const systemMetrics = agentSystem.getSystemMetrics();
      if (!systemMetrics.isRunning) {
        await agentSystem.start();
      }

      // Create tasks for each sample email
      const tasks = [];
      for (const email of sampleEmails) {
        const taskId = await agentSystem.addTask({
          type: 'email_response',
          input: {
            emailContext: email,
            options: {
              tone: 'professional',
              length: 'detailed',
              includeAttachments: false,
              scheduleFollowUp: true,
              escalateToHuman: false
            }
          },
          priority: email.subject.includes('URGENT') ? 'urgent' : 'medium',
          status: 'queued',
          agentId: emailAgent?.id
        });
        
        tasks.push({
          taskId,
          email: {
            from: email.from,
            subject: email.subject,
            urgency: email.subject.includes('URGENT') ? 'urgent' : 'medium'
          }
        });
      }

      // Wait a moment for initial processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get updated system status
      const updatedMetrics = agentSystem.getSystemMetrics();
      const taskQueue = agentSystem.getTaskQueue();
      const agents = agentSystem.getAllAgents();

      return NextResponse.json({
        success: true,
        data: {
          message: 'Email agent test completed',
          emailAgent: emailAgent ? {
            id: emailAgent.id,
            name: emailAgent.name,
            status: emailAgent.status,
            capabilities: emailAgent.capabilities.length,
            thoughts: emailAgent.thoughts.length,
            metrics: emailAgent.metrics
          } : null,
          tasks: tasks,
          systemStatus: {
            isRunning: updatedMetrics.isRunning,
            totalAgents: updatedMetrics.totalAgents,
            queuedTasks: updatedMetrics.queuedTasks,
            processingTasks: updatedMetrics.processingTasks,
            completedTasks: updatedMetrics.completedTasks
          },
          recentThoughts: emailAgent?.thoughts.slice(-5).map(thought => ({
            type: thought.type,
            content: thought.content.substring(0, 100) + '...',
            timestamp: thought.timestamp
          })) || []
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid test type. Use "quick_analysis" or "full_flow"'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in email agent test:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test email agent' },
      { status: 500 }
    );
  }
} 