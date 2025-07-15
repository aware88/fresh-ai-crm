import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID from session - it could be in id or sub field
    const userId = (session.user as any).id || (session.user as any).sub;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found in session' },
        { status: 401 }
      );
    }
    
    // Check for any active email accounts
    const supabase = createServiceRoleClient();
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Error fetching email accounts:', error);
      // If the table doesn't exist, treat it as no accounts connected
      if (error.code === '42P01') { // PostgreSQL code for undefined_table
        return NextResponse.json({
          success: true,
          connected: false,
          totalAccounts: 0,
          accounts: {
            google: 0,
            microsoft: 0,
            imap: 0
          },
          emailAccounts: []
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to check email accounts' },
        { status: 500 }
      );
    }
    
    const emailAccounts = accounts || [];
    const connected = emailAccounts.length > 0;
    
    // Get counts by provider type
    const googleAccounts = emailAccounts.filter(acc => acc.provider_type === 'google');
    const microsoftAccounts = emailAccounts.filter(acc => acc.provider_type === 'microsoft' || acc.provider_type === 'outlook');
    const imapAccounts = emailAccounts.filter(acc => acc.provider_type === 'imap');
    
    return NextResponse.json({
      success: true,
      connected,
      totalAccounts: emailAccounts.length,
      accounts: {
        google: googleAccounts.length,
        microsoft: microsoftAccounts.length,
        imap: imapAccounts.length
      },
      emailAccounts: emailAccounts.map(acc => ({
        id: acc.id,
        email: acc.email,
        provider_type: acc.provider_type,
        display_name: acc.display_name,
        is_active: acc.is_active,
        created_at: acc.created_at
      }))
    });
  } catch (error) {
    console.error('Error checking email status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check email status' },
      { status: 500 }
    );
  }
} 