import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { MicrosoftTokenService } from '@/lib/services/microsoft-token-service';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Check for Outlook connection
    const { tokens: outlookTokenData, success: tokenFetchSuccess } = await MicrosoftTokenService.getTokens(userId);
    let outlookConnected = false;
    let outlookEmail = '';
    
    if (tokenFetchSuccess && outlookTokenData) {
      // If we have tokens, try to get a valid access token to verify the connection
      try {
        await MicrosoftTokenService.getValidAccessToken(userId);
        outlookConnected = true;
        outlookEmail = session.user.email || '';
      } catch (error) {
        console.error('Error validating Outlook access token:', error);
        // If token refresh fails, consider the connection broken
        outlookConnected = false;
      }
    }
    
    // Check for IMAP accounts
    // Try with service role client first to bypass RLS
    let imapAccounts = [];
    
    try {
      // Use service role client to bypass RLS
      const serviceClient = createServiceRoleClient();
      const { data: accounts, error } = await serviceClient
        .from('email_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching IMAP accounts with service role:', error);
        // Fallback to regular client if service role fails
        const supabase = await createServerClient();
        const { data: fallbackAccounts, error: fallbackError } = await supabase
          .from('email_accounts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true);
        
        if (fallbackError) {
          console.error('Error fetching IMAP accounts with regular client:', fallbackError);
        } else {
          imapAccounts = fallbackAccounts || [];
        }
      } else {
        imapAccounts = accounts || [];
      }
    } catch (error) {
      console.error('Error querying IMAP accounts:', error);
    }
    
    // Return combined status
    return NextResponse.json({
      success: true,
      outlookConnected,
      outlookEmail,
      imapAccounts,
      connected: outlookConnected || imapAccounts.length > 0
    });
  } catch (error) {
    console.error('Error checking email connection status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check connection status' },
      { status: 500 }
    );
  }
}
