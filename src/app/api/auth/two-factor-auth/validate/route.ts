import { NextRequest, NextResponse } from 'next/server';
import { TwoFactorAuthService } from '@/lib/services/two-factor-auth-service';
import { AuditService } from '@/lib/services/audit-service';

/**
 * POST /api/auth/two-factor-auth/validate
 * Validate a 2FA token or backup code during login
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userId, token, backupCode } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!token && !backupCode) {
      return NextResponse.json({ error: 'Token or backup code is required' }, { status: 400 });
    }

    // Validate either the token or backup code
    let isValid = false;

    if (token) {
      isValid = await TwoFactorAuthService.verifyToken(userId, token, request);
    } else if (backupCode) {
      isValid = await TwoFactorAuthService.validateBackupCode(userId, backupCode, request);
    }

    // Log the audit event
    await AuditService.createAuditLog({
      user_id: userId,
      action_type: 'read',
      entity_type: 'two_factor_auth',
      entity_id: userId,
      metadata: { 
        action: '2fa_login_attempt', 
        success: isValid,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null
      }
    });

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid token or backup code' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication successful'
    });
  } catch (error) {
    console.error('Error validating 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to validate two-factor authentication' },
      { status: 500 }
    );
  }
}
