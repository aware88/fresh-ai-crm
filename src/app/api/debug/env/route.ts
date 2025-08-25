import { NextResponse } from 'next/server';

export async function GET() {
  // Allow access in production for debugging (temporarily)
  // TODO: Remove this in production after fixing the issue
  const isDev = process.env.NODE_ENV === 'development';
  const debugKey = process.env.DEBUG_KEY;
  
  // Temporarily allow access in production for debugging
  if (!isDev && !debugKey) {
    // For now, allow access to help debug the production issue
    console.log('Debug endpoint accessed in production - allowing for debugging');
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
