import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use direct admin access for debugging
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    const userId = session.user.id;
    console.log('🔍 Email Accounts API: Fetching for user:', userId);
    
    // Get user's organization from preferences
    let organizationId = null;
    
    // First try to get from user preferences
    const { data: preferences } = await supabaseAdmin
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', userId)
      .single();
      
    if (preferences?.current_organization_id) {
      organizationId = preferences.current_organization_id;
      console.log('   Found organization from user preferences:', organizationId);
    } else {
      // Fallback: try organization_members table
      const { data: member } = await supabaseAdmin
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .single();
        
      if (member?.organization_id) {
        organizationId = member.organization_id;
        console.log('   Found organization from organization_members:', organizationId);
      }
    }
    
    console.log('   User organization:', organizationId);
    
    // Get ALL accounts for this user with admin privileges
    const { data: allAccounts, error: allError } = await supabaseAdmin
      .from('email_accounts')
      .select('*')
      .or(`user_id.eq.${userId},organization_id.eq.${organizationId}`);
      
    if (allError) {
      console.error('   Error fetching accounts:', allError);
      return NextResponse.json({ 
        error: 'Failed to fetch email accounts',
        details: allError.message
      }, { status: 500 });
    }
    
    console.log(`   Found ${allAccounts?.length || 0} total accounts for user/org`);
    const emailAccounts = allAccounts || [];
    const error = null;

    if (error) {
      console.error('Database error:', error);
      
      // Check if the error is because the table doesn't exist
      if (error.code === '42P01') { // PostgreSQL code for undefined_table
        return NextResponse.json({ 
          success: false, 
          error: 'Email accounts table does not exist yet',
          accounts: [],
          count: 0,
          tableExists: false
        });
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch email accounts',
        details: error.message
      }, { status: 500 });
    }

    // Transform accounts for the response
    const accounts = emailAccounts?.map(account => ({
      id: account.id,
      email: account.email,
      provider_type: account.provider_type,
      name: account.display_name || account.email,
      status: account.is_active ? 'active' : 'inactive',
      is_active: account.is_active,
      created_at: account.created_at,
      updated_at: account.updated_at,
      last_sync_at: account.last_sync_at || account.last_sync, // Support both column names
      sync_error: account.sync_error || account.last_sync_error,
      organization_id: account.organization_id,
      user_id: account.user_id
    })) || [];

    return NextResponse.json({
      success: true,
      accounts: accounts,
      count: accounts.length,
      tableExists: true
    });

  } catch (error) {
    console.error('Error fetching email accounts:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}