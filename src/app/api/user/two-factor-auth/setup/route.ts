import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TwoFactorAuthService } from '@/lib/services/two-factor-auth-service';
import { AuditService } from '@/lib/services/audit-service';

/**
 * POST /api/user/two-factor-auth/setup
 * Initialize 2FA setup for the current user
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const email = session.user.email;

    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Generate a new TOTP secret
    const { secretKey, otpauth } = await TwoFactorAuthService.generateSecret(userId, email);

    // Log the audit event
    await AuditService.createAuditLogFromRequest(
      request,
      {
        user_id: userId,
        action_type: 'create',
        entity_type: 'two_factor_auth',
        entity_id: userId,
        metadata: { action: '2fa_setup_initiated' }
      }
    );

    return NextResponse.json({
      secretKey,
      otpauth
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to set up two-factor authentication' },
      { status: 500 }
    );
  }
}
