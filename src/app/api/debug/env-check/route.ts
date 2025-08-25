import { NextResponse } from 'next/server';

export async function GET() {
  // This endpoint helps diagnose environment variable issues
  // It should be removed after debugging is complete
  
  const envCheck = {
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    
    // Check critical environment variables
    envVars: {
      // Supabase (public - these are inlined at build time)
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 
          'NOT SET'
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...' : 
          'NOT SET'
      },
      
      // Server-only variables (these should be available at runtime)
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        value: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
          process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...' : 
          'NOT SET'
      },
      OPENAI_API_KEY: {
        exists: !!process.env.OPENAI_API_KEY,
        value: process.env.OPENAI_API_KEY ? 
          process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 
          'NOT SET'
      },
      NEXTAUTH_SECRET: {
        exists: !!process.env.NEXTAUTH_SECRET,
        value: process.env.NEXTAUTH_SECRET ? 'SET (hidden)' : 'NOT SET'
      },
      NEXTAUTH_URL: {
        exists: !!process.env.NEXTAUTH_URL,
        value: process.env.NEXTAUTH_URL || 'NOT SET'
      }
    },
    
    // Show all environment variables that contain certain keywords
    relevantEnvVars: Object.keys(process.env)
      .filter(key => 
        key.includes('SUPABASE') || 
        key.includes('OPENAI') || 
        key.includes('NEXTAUTH') ||
        key.includes('GOOGLE') ||
        key.includes('MICROSOFT')
      )
      .sort(),
      
    // Runtime info
    runtime: {
      isServer: typeof window === 'undefined',
      isBuildTime: process.env.NEXT_PHASE === 'phase-production-build',
      currentWorkingDirectory: process.cwd(),
      platform: process.platform,
      nodeVersion: process.version
    }
  };

  // Log to server console as well
  console.log('='.repeat(80));
  console.log('ENV CHECK API CALLED');
  console.log('='.repeat(80));
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('SUPABASE vars exist:', {
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  });
  console.log('All relevant env vars:', envCheck.relevantEnvVars);
  console.log('='.repeat(80));

  return NextResponse.json(envCheck);
}

// Also support POST for testing
export async function POST() {
  return GET();
}
