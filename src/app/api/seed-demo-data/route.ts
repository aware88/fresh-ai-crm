import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * POST /api/seed-demo-data
 * Seeds demo data for the current user's organization
 */
export async function POST(request: NextRequest) {
  try {
    // Get session to verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`🌱 Seeding demo data for user: ${userId}`);

    // Get Supabase client
    const supabase = await createServerClient();

    // Get user's organization from preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', userId)
      .single();
    
    const organizationId = preferences?.current_organization_id;
    console.log(`🏢 User organization: ${organizationId || 'none'}`);

    // Generate sample data
    const timestamp = new Date().toISOString();
    const sampleContacts = Array(10).fill(0).map((_, i) => ({
      firstname: `Contact ${i + 1}`,
      lastname: `Sample`,
      email: `contact${i + 1}@example.com`,
      phone: `+1555${100000 + i}`,
      organization_id: organizationId,
      user_id: userId,
      created_by: userId,
      updated_by: userId,
      created_at: timestamp,
      updated_at: timestamp,
      address: '123 Sample St',
      reliabilityScore: Math.floor(Math.random() * 100)
    }));

    // Create sample email account
    const sampleEmailAccount = {
      email: 'demo@example.com',
      display_name: 'Demo Account',
      provider_type: 'imap',
      is_active: true,
      organization_id: organizationId,
      user_id: userId,
      created_by: userId,
      updated_by: userId,
      created_at: timestamp,
      updated_at: timestamp,
      access_token: 'sample_token',
      refresh_token: 'sample_refresh_token',
      token_expires_at: new Date(Date.now() + 86400000).toISOString() // 1 day from now
    };

    // Insert sample contacts
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .insert(sampleContacts)
      .select();

    if (contactsError) {
      console.error('Error inserting sample contacts:', contactsError);
      return NextResponse.json({ 
        error: 'Failed to insert sample contacts',
        details: contactsError
      }, { status: 500 });
    }

    // Insert sample email account
    const { data: emailData, error: emailError } = await supabase
      .from('email_accounts')
      .insert(sampleEmailAccount)
      .select();

    if (emailError) {
      console.error('Error inserting sample email account:', emailError);
      return NextResponse.json({ 
        error: 'Failed to insert sample email account',
        details: emailError
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Sample data created successfully',
      contactsCount: contactsData?.length || 0,
      emailAccountsCount: emailData?.length || 0
    });
  } catch (error) {
    console.error('Error in seed-demo-data API:', error);
    return NextResponse.json({ 
      error: 'Failed to seed demo data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

