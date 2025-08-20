import { NextRequest, NextResponse } from 'next/server';
import { webhookService } from '@/lib/email/webhook-service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, provider, accountId } = body;

    switch (action) {
      case 'register':
        if (!provider || !accountId) {
          return NextResponse.json(
            { error: 'Provider and accountId are required for registration' },
            { status: 400 }
          );
        }
        
        const webhookId = await webhookService.registerWebhook(provider, accountId);
        
        return NextResponse.json({
          success: true,
          webhookId,
          message: `Webhook registered for ${provider}`
        });

      case 'setup-all':
        await webhookService.setupWebhooksForAllAccounts();
        
        return NextResponse.json({
          success: true,
          message: 'Webhooks setup initiated for all accounts'
        });

      case 'deactivate':
        if (!body.webhookId) {
          return NextResponse.json(
            { error: 'webhookId is required for deactivation' },
            { status: 400 }
          );
        }
        
        await webhookService.deactivateWebhook(body.webhookId);
        
        return NextResponse.json({
          success: true,
          message: 'Webhook deactivated'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: register, setup-all, or deactivate' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Webhook management error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to manage webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhooks = await webhookService.getActiveWebhooks();
    
    return NextResponse.json({
      success: true,
      webhooks,
      count: webhooks.length
    });

  } catch (error) {
    console.error('Failed to get webhooks:', error);
    
    return NextResponse.json(
      { error: 'Failed to get webhooks' },
      { status: 500 }
    );
  }
}




