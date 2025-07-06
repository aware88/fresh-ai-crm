import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WebhookManagementService } from '@/lib/services/webhook-management-service';

/**
 * GET /api/webhooks/configurations
 * Get webhook configurations for the current user's organization
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the organization ID from the query parameters
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Get webhook configurations
    const webhookConfigurations = await WebhookManagementService.getWebhookConfigurations(organizationId);

    // Remove secret keys from the response for security
    const sanitizedConfigurations = webhookConfigurations.map(config => {
      const { secret_key, ...rest } = config;
      return rest;
    });

    return NextResponse.json(sanitizedConfigurations);
  } catch (error) {
    console.error('Error getting webhook configurations:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook configurations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/configurations
 * Create a new webhook configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { organization_id, name, endpoint_url, events, metadata } = body;

    // Validate required fields
    if (!organization_id || !name || !endpoint_url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Missing required fields: organization_id, name, endpoint_url, events' },
        { status: 400 }
      );
    }

    // Create webhook configuration
    const webhookConfiguration = await WebhookManagementService.createWebhookConfiguration({
      organization_id,
      name,
      endpoint_url,
      events,
      metadata,
    });

    // Return the created webhook configuration with the secret key
    // This is the only time the secret key will be returned
    return NextResponse.json(webhookConfiguration, { status: 201 });
  } catch (error) {
    console.error('Error creating webhook configuration:', error);
    return NextResponse.json(
      { error: 'Failed to create webhook configuration' },
      { status: 500 }
    );
  }
}
