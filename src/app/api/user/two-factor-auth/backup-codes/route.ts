import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TwoFactorAuthService } from '@/lib/services/two-factor-auth-service';
import { AuditService } from '@/lib/services/audit-service';

/**
 * POST /api/user/two-factor-auth/backup-codes
 * Regenerate backup codes for the current user
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse request body
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Verify the token
    const isValid = await TwoFactorAuthService.verifyToken(userId, token, request);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    // Regenerate backup codes
    const backupCodes = await TwoFactorAuthService.regenerateBackupCodes(userId);

    // Log the audit event
    await AuditService.createAuditLogFromRequest(
      request,
      {
        user_id: userId,
        action_type: 'update',
        entity_type: 'two_factor_auth',
        entity_id: userId,
        metadata: { action: 'backup_codes_regenerated' }
      }
    );

    return NextResponse.json({
      success: true,
      backupCodes
    });
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate backup codes' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/two-factor-auth/backup-codes
 * Get the current user's backup codes
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if 2FA is enabled
    const isEnabled = await TwoFactorAuthService.isEnabled(userId);

    if (!isEnabled) {
      return NextResponse.json({ error: '2FA is not enabled' }, { status: 400 });
    }

    // Get the user's 2FA config
    const config = await TwoFactorAuthService.getConfig(userId);

    if (!config) {
      return NextResponse.json({ error: '2FA configuration not found' }, { status: 404 });
    }

    return NextResponse.json({
      backupCodes: config.backup_codes
    });
  } catch (error) {
    console.error('Error getting backup codes:', error);
    return NextResponse.json(
      { error: 'Failed to get backup codes' },
      { status: 500 }
    );
  }
}
