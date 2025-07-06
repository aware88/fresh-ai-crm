import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TwoFactorAuthService } from '@/lib/services/two-factor-auth-service';

/**
 * GET /api/user/two-factor-auth/status
 * Check if 2FA is enabled for the current user
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

    // Get recent attempts if 2FA is enabled
    let recentAttempts = null;
    if (isEnabled) {
      recentAttempts = await TwoFactorAuthService.getRecentAttempts(userId, 5);
    }

    return NextResponse.json({
      enabled: isEnabled,
      recentAttempts
    });
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return NextResponse.json(
      { error: 'Failed to check two-factor authentication status' },
      { status: 500 }
    );
  }
}
