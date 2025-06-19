import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
