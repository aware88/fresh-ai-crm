import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MicrosoftTokenService } from '@/lib/services/microsoft-token-service';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Delete the tokens from the database
    await MicrosoftTokenService.deleteTokens(userId);
    
    return NextResponse.json({
      success: true,
      message: 'Successfully disconnected from Outlook',
    });
  } catch (error) {
    console.error('Error disconnecting from Outlook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect from Outlook' },
      { status: 500 }
    );
  }
}
