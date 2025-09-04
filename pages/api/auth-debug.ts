import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Auth debug API called');
  
  try {
    // 1. Check NextAuth session
    console.log('Checking NextAuth session...');
    const session = await getServerSession(req, res, authOptions);
    
    // 2. Check Supabase session
    console.log('Checking Supabase session...');
    const { data: { session: supabaseSession }, error: supabaseError } = await supabase.auth.getSession();
    
    // 3. Check cookies
    console.log('Checking cookies...');
    const cookies = req.cookies;
    const authCookies = Object.keys(cookies).filter(key => 
      key.includes('next-auth') || key.includes('supabase')
    );
    
    // 4. Prepare response
    const debugInfo = {
      nextAuthSession: {
        exists: !!session,
        user: session?.user ? {
          email: session.user.email,
          name: session.user.name,
        } : null,
        expires: session?.expires,
      },
      supabaseSession: {
        exists: !!supabaseSession,
        user: supabaseSession?.user ? {
          email: supabaseSession.user.email,
          id: supabaseSession.user.id,
        } : null,
        expires: supabaseSession?.expires_at ? new Date(supabaseSession.expires_at * 1000).toISOString() : null,
      },
      authCookies: authCookies,
      allCookieNames: Object.keys(cookies),
      headers: {
        authorization: !!req.headers.authorization,
        cookie: !!req.headers.cookie,
      }
    };
    
    console.log('Auth debug info:', JSON.stringify(debugInfo, null, 2));
    
    // 5. Return debug info
    return res.status(200).json(debugInfo);
  } catch (error) {
    console.error('Auth debug error:', error);
    return res.status(500).json({ error: 'Auth debug failed', details: (error as Error).message });
  }
}
