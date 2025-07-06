import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WebhookManagementService } from '@/lib/services/webhook-management-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/webhooks/configurations/[id]
 * Get a webhook configuration by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the webhook configuration
    const webhookConfiguration = await WebhookManagementService.getWebhookConfigurationById(params.id);

    if (!webhookConfiguration) {
      return NextResponse.json({ error: 'Webhook configuration not found' }, { status: 404 });
    }

    // Remove secret key from the response for security
    const { secret_key, ...sanitizedConfiguration } = webhookConfiguration;

    return NextResponse.json(sanitizedConfiguration);
  } catch (error) {
    console.error('Error getting webhook configuration:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/webhooks/configurations/[id]
 * Update a webhook configuration
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name, endpoint_url, events, is_active, metadata } = body;

    // Update webhook configuration
    const webhookConfiguration = await WebhookManagementService.updateWebhookConfiguration(
      params.id,
      {
        name,
        endpoint_url,
        events,
        is_active,
        metadata,
      }
    );

    // Remove secret key from the response for security
    const { secret_key, ...sanitizedConfiguration } = webhookConfiguration;

    return NextResponse.json(sanitizedConfiguration);
  } catch (error) {
    console.error('Error updating webhook configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook configuration' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/configurations/[id]
 * Delete a webhook configuration
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete webhook configuration
    await WebhookManagementService.deleteWebhookConfiguration(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting webhook configuration:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook configuration' },
      { status: 500 }
    );
  }
}
