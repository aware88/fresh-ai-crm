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
        emailRedirectTo: `${baseUrl}/auth/confirm`,
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
        // Add a longer delay to ensure user is fully created in Supabase
        console.log('🏢 Waiting for user creation to propagate...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🏢 Attempting to create organization for user:', userData.user.id);
        
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
          const errorText = await orgResponse.text();
          console.error('❌ Failed to create organization:', errorText);
          
          // Try to parse the error response
          let errorObj;
          try {
            errorObj = JSON.parse(errorText);
          } catch {
            errorObj = { error: errorText };
          }
          
          // If it's a user not found error, we'll skip organization creation
          // The user signup was successful, so we don't want to fail the entire process
          if (errorObj.error && errorObj.error.includes('User not found')) {
            console.log('⚠️ Organization creation skipped due to user propagation delay. User can create organization later.');
          } else {
            console.error('❌ Organization creation failed with unexpected error:', errorObj);
          }
        } else {
          const orgData = await orgResponse.json();
          console.log('✅ Organization created successfully:', orgData);
        }
      } catch (orgError) {
        console.error('❌ Exception during organization creation:', orgError);
        // Don't fail the signup, just log the error
        console.log('⚠️ Organization creation failed, but user signup was successful. User can create organization later.');
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