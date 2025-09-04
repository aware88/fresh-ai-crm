import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@/lib/supabase/server';
import { createClient as createDirectClient } from '@supabase/supabase-js';
import { getUID } from '@/lib/auth/utils';

/**
 * GET /api/dashboard/email-accounts
 * Returns the count of email accounts for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as any)?.id || (session?.user as any)?.userId;
    const uid = sessionUserId || await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create direct admin client to bypass RLS
    const directClient = createDirectClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    console.log('🔍 Email Accounts API: Fetching count for user:', uid);
    
    // Get ONLY accounts for this specific user - NO organization sharing
    const { data: userAccounts, error: fetchError } = await directClient
      .from('email_accounts')
      .select('*')
      .eq('user_id', uid);
    
    if (fetchError) {
      console.error('❌ Error fetching accounts:', fetchError);
      return NextResponse.json({ count: 0, error: fetchError.message });
    }
    
    const emailAccountsCount = userAccounts?.length || 0;
    console.log(`📊 Found ${emailAccountsCount} email accounts for user ${uid}`);
    
    // Log user's accounts for debugging (ONLY their own accounts)
    console.log('📧 User accounts:');
    userAccounts?.forEach(account => {
      console.log(`   - ${account.email} (user: ${account.user_id})`);
    });
    
    return NextResponse.json({ count: emailAccountsCount });
  } catch (error) {
    console.error('Error in email accounts API:', error);
    return NextResponse.json({ error: 'Internal server error', count: 0 }, { status: 500 });
  }
}
