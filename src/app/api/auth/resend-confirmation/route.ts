import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use NEXTAUTH_URL for reliable email redirects in production
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    console.log('🔗 Using baseUrl for resend confirmation:', baseUrl);

    // Check if user exists first
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      console.error('Error checking existing users:', checkError);
      return NextResponse.json(
        { error: 'Failed to verify user status' },
        { status: 500 }
      );
    }

    const userExists = existingUser.users?.find(user => user.email === email);
    
    if (!userExists) {
      return NextResponse.json(
        { error: 'No account found with this email address. Please sign up first.' },
        { status: 400 }
      );
    }

    if (userExists.email_confirmed_at) {
      return NextResponse.json(
        { error: 'This email address is already confirmed. You can sign in normally.' },
        { status: 400 }
      );
    }

    console.log('🔄 Resending confirmation email for user:', email);

    // Resend confirmation email with proper redirect URL
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${baseUrl}/auth/confirm`,
      },
    });

    if (error) {
      console.error('Resend confirmation error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a few minutes before requesting another confirmation email.' },
          { status: 429 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.log('✅ Confirmation email resent successfully to:', email);

    return NextResponse.json({
      success: true,
      message: 'Confirmation email has been sent! Please check your inbox and spam folder.',
    });
  } catch (error) {
    console.error('Resend confirmation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 