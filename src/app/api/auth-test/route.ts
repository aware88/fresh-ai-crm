import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  try {
    console.log('=== AUTH TEST API ROUTE ===');
    console.log('Request URL:', req.url);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Get session
    const session = await getServerSession(authOptions);
    console.log('Session from getServerSession:', session ? 'FOUND' : 'NOT FOUND');
    
    if (session) {
      console.log('Session user:', session.user);
      console.log('Session expires:', session.expires);
    }
    
    // Check cookies manually
    const cookieHeader = req.headers.get('cookie');
    console.log('Cookie header present:', !!cookieHeader);
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      const authCookies = cookies.filter(c => 
        c.includes('next-auth') || 
        c.includes('__Secure-next-auth') ||
        c.includes('__Host-next-auth')
      );
      console.log('Auth-related cookies:', authCookies);
    }
    
    // Return comprehensive response
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      session: session ? {
        user: session.user,
        expires: session.expires,
        hasUser: !!session.user,
        hasEmail: !!session.user?.email
      } : null,
      cookies: {
        present: !!cookieHeader,
        authCookiesCount: cookieHeader ? 
          cookieHeader.split(';').filter(c => c.includes('next-auth')).length : 0
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Same as GET but for POST requests
  return GET(req);
}
