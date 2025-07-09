import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

/**
 * Simple API route to test authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Get the session using our fixed getServerSession method
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: 'Not authenticated',
        details: 'No valid session found'
      }, { status: 401 });
    }
    
    // Return success with minimal user info
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: session.user.id,
        email: session.user.email
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in test auth API:', error);
    return NextResponse.json(
      { 
        success: false,
        message: `Error: ${error.message}`,
        details: error.stack
      },
      { status: 500 }
    );
  }
}
