import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

/**
 * GET handler for testing authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Get the session using getServerSession
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        message: 'Not authenticated',
        session: null
      }, { status: 200 });
    }
    
    // Return session info (excluding sensitive data)
    return NextResponse.json({
      authenticated: true,
      message: 'Successfully authenticated',
      session: {
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        },
        expires: session.expires
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in test auth API:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        message: `Error: ${error.message}`,
        error: error.stack
      },
      { status: 500 }
    );
  }
}
