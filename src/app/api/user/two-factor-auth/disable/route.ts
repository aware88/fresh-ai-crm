import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TwoFactorAuthService } from '@/lib/services/two-factor-auth-service';
import { AuditService } from '@/lib/services/audit-service';

/**
 * POST /api/user/two-factor-auth/disable
 * Disable 2FA for the current user
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
    const { token, backupCode } = body;

    // Verify either the token or backup code
    let isValid = false;

    if (token) {
      isValid = await TwoFactorAuthService.verifyToken(userId, token, request);
    } else if (backupCode) {
      isValid = await TwoFactorAuthService.validateBackupCode(userId, backupCode, request);
    } else {
      return NextResponse.json({ error: 'Token or backup code is required' }, { status: 400 });
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token or backup code' }, { status: 400 });
    }

    // Disable 2FA
    const success = await TwoFactorAuthService.disable(userId);

    if (!success) {
      return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
    }

    // Log the audit event
    await AuditService.createAuditLogFromRequest(
      request,
      {
        user_id: userId,
        action_type: 'update',
        entity_type: 'two_factor_auth',
        entity_id: userId,
        metadata: { action: '2fa_disabled' }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to disable two-factor authentication' },
      { status: 500 }
    );
  }
}
