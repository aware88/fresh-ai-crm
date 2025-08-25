import { NextResponse } from 'next/server';

export async function GET() {
  // Only allow in development or with a debug key
  const isDev = process.env.NODE_ENV === 'development';
  const debugKey = process.env.DEBUG_KEY;
  
  if (!isDev && !debugKey) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Check environment variables (safely)
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    
    // Show first few characters to verify they're set correctly (but not expose full keys)
    supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    supabaseAnonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
    nextAuthUrl: process.env.NEXTAUTH_URL,
    
    // Check if we're in a build environment
    isBuildEnv: process.env.NEXT_PHASE === 'phase-production-build',
    
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(envCheck);
}
