import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, subscriptionPlan, isOrganization, orgName, orgSlug } = body;
    
    // Get the base URL dynamically
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, password, first name, and last name are required' },
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

    // Create the full name
    const fullName = `${firstName} ${lastName}`.trim();

    // Sign up the user with proper metadata
    const { data: userData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          subscription_plan: subscriptionPlan,
          is_organization: isOrganization || false,
        },
      },
    });

    if (signUpError) {
      console.error('Signup error:', signUpError);
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!userData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // If this is an organization signup, create the organization
    if (isOrganization && orgName && orgSlug && userData.user) {
      try {
        const orgResponse = await fetch(`${baseUrl}/api/admin/organizations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: orgName,
            slug: orgSlug,
            admin_user_id: userData.user.id,
            subscription_plan: subscriptionPlan,
          }),
        });

        if (!orgResponse.ok) {
          console.error('Failed to create organization');
          // Don't fail the signup, just log the error
        }
      } catch (orgError) {
        console.error('Error creating organization:', orgError);
        // Don't fail the signup, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        full_name: fullName,
      },
    });
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 