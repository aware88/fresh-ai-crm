import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { readInboxAndProfile } from '@/lib/email/emailAnalyzer';
import { supabase } from '@/lib/supabaseClient';

// POST /api/emails/process
export async function POST(req: NextRequest) {
  try {
    console.log('Processing email request...');
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Get the session using getServerSession - in App Router, no need to pass req/res
    const session = await getServerSession(authOptions);
    console.log('Session from getServerSession:', session ? `Found user: ${session.user?.email}` : 'Not found');
    
    // Parse the request body once and store it for later use
    let authToken: string | null = null;
    let user = null;
    let body: { authToken?: string } = {};
    
    try {
      // Try to parse request body for auth token
      body = await req.json() as { authToken?: string };
      console.log('Request body received:', body.authToken ? 'Has authToken' : 'No authToken');
      authToken = body.authToken || null;
    } catch (e) {
      console.log('Error parsing request body:', e);
    }
    
    // If no session from NextAuth, try to get user from auth token
    if (!session?.user?.email && authToken) {
      try {
        // Verify token with Supabase directly
        const { data: userData, error } = await supabase.auth.getUser(authToken);
        if (!error && userData?.user) {
          user = userData.user;
          console.log('User authenticated via Supabase token:', user.email);
        } else {
          console.log('Supabase token verification failed:', error?.message);
          authToken = null; // Invalid token
        }
      } catch (e) {
        console.log('Error authenticating with token:', e);
        authToken = null;
      }
    }
    
    // Check if user is authenticated through either method
    if (!session?.user?.email && !user?.email) {
      console.log('No authenticated user found via any method');
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }
    
    const authenticatedEmail = session?.user?.email || user?.email;
    console.log(`Processing emails for user: ${authenticatedEmail}`);
    
    // Run the email processing pipeline with a timeout
    let results: { processed: number; errors: number; details: any[]; message?: string } = { 
      processed: 0, 
      errors: 0, 
      details: [] 
    };
    
    try {
      // Create a promise that rejects after 45 seconds (increased timeout for IMAP operations)
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Email processing timed out after 45 seconds')), 45000);
      });
      
      console.log('Starting email processing with timeout...');
      // Race the email processing against the timeout
      results = await Promise.race([
        readInboxAndProfile(authToken || undefined),
        timeout
      ]);
      
      if (results.message) {
        console.log(`Email processing message: ${results.message}`);
      } else {
        console.log('Email processing completed successfully');
      }
    } catch (processingError) {
      console.error('Email processing error:', processingError);
      return NextResponse.json(
        { 
          success: false, 
          message: processingError instanceof Error ? processingError.message : 'Error processing emails' 
        }, 
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        processed: results?.processed || 0,
        errors: results?.errors || 0,
        details: results?.details || [],
        message: results?.message || 'Emails processed successfully' 
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing emails:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error processing emails' 
      }, 
      { status: 500 }
    );
  }
}
