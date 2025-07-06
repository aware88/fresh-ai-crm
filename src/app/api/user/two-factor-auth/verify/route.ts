import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TwoFactorAuthService } from '@/lib/services/two-factor-auth-service';
import { AuditService } from '@/lib/services/audit-service';

/**
 * POST /api/user/two-factor-auth/verify
 * Verify a TOTP token and enable 2FA if valid
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

    // Get the user's 2FA config including backup codes
    const config = await TwoFactorAuthService.getConfig(userId);

    // Log the audit event
    await AuditService.createAuditLogFromRequest(
      request,
      {
        user_id: userId,
        action_type: 'update',
        entity_type: 'two_factor_auth',
        entity_id: userId,
        metadata: { action: '2fa_enabled' }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
      backupCodes: config?.backup_codes || []
    });
  } catch (error) {
    console.error('Error verifying 2FA token:', error);
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}
