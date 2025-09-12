import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // Try to fetch user profile from auth.users table first
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    
    if (authUser?.user?.user_metadata?.full_name) {
      return NextResponse.json({
        full_name: authUser.user.user_metadata.full_name,
        email: authUser.user.email,
        source: 'auth_metadata'
      });
    }

    // If no name in auth metadata, try profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', session.user.email)
      .single();

    if (profileError) {
      console.log('Profile lookup error (this is normal if no profiles table exists):', profileError.message);
    }

    if (profileData?.full_name) {
      return NextResponse.json({
        full_name: profileData.full_name,
        email: profileData.email,
        source: 'profiles_table'
      });
    }

    // Return empty profile if no name found
    return NextResponse.json({
      full_name: null,
      email: session.user.email,
      source: 'session_only'
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { full_name } = await request.json();

    if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    // Update user metadata in auth
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: full_name.trim()
      }
    });

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Also try to update profiles table if it exists
    await supabase
      .from('profiles')
      .upsert({
        email: session.user.email,
        full_name: full_name.trim(),
        updated_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      full_name: full_name.trim(),
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}