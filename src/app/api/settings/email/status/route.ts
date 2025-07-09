import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MicrosoftTokenService } from '@/lib/services/microsoft-token-service';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const tokenData = await MicrosoftTokenService.getTokens(userId);
    
    if (tokenData) {
      // If we have tokens, try to get a valid access token to verify the connection
      try {
        await MicrosoftTokenService.getValidAccessToken(userId);
        
        return NextResponse.json({
          success: true,
          connected: true,
          email: session.user.email || '',
        });
      } catch (error) {
        console.error('Error validating access token:', error);
        
        // If token refresh fails, consider the connection broken
        return NextResponse.json({
          success: true,
          connected: false,
        });
      }
    } else {
      // No tokens found, user is not connected
      return NextResponse.json({
        success: true,
        connected: false,
      });
    }
  } catch (error) {
    console.error('Error checking email connection status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check connection status' },
      { status: 500 }
    );
  }
}
