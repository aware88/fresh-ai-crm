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
 * POST /api/webhooks/configurations/[id]/rotate-secret
 * Rotate the secret key for a webhook configuration
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user is an admin for the organization
    // This is enforced by the rotate_webhook_secret function in the database

    // Rotate the webhook secret
    const newSecretKey = await WebhookManagementService.rotateWebhookSecret(params.id);

    return NextResponse.json({ secret_key: newSecretKey });
  } catch (error) {
    console.error('Error rotating webhook secret:', error);
    return NextResponse.json(
      { error: 'Failed to rotate webhook secret' },
      { status: 500 }
    );
  }
}
