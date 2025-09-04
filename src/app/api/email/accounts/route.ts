import { NextRequest, NextResponse } from 'next/server';
import { initializeEmailSecurity, getUserEmailAccounts, logEmailAccessAttempt } from '@/lib/email/security-validation';

export async function GET(request: NextRequest) {
  try {
    // Initialize security context
    const securityContext = await initializeEmailSecurity();
    if (!securityContext) {
      console.log('❌ /api/email/accounts - No valid security context');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 /api/email/accounts - User ID:', securityContext.userId);

    // Get user's email accounts using centralized security
    const accountValidations = await getUserEmailAccounts(securityContext);
    
    // Convert to the expected format
    const accounts = await Promise.all(accountValidations.map(async (validation) => {
      if (!validation.valid || !validation.accountId) return null;
      
      // Get full account details
      const { data: account, error } = await securityContext.supabase
        .from('email_accounts')
        .select(`
          id,
          email,
          display_name,
          provider_type,
          is_primary,
          last_sync_at,
          sync_error,
          is_active,
          created_at,
          updated_at
        `)
        .eq('id', validation.accountId)
        .eq('user_id', securityContext.userId) // Double-check security
        .single();
      
      return error ? null : account;
    }));

    // Filter out null results
    const validAccounts = accounts.filter(account => account !== null);

    console.log(`✅ /api/email/accounts - Found ${validAccounts.length} accounts for user ${securityContext.userId}`);
    
    // Log successful access
    logEmailAccessAttempt(
      securityContext.userId, 
      'list_accounts', 
      'all', 
      true, 
      { count: validAccounts.length }
    );
    
    if (validAccounts.length > 0) {
      console.log('📧 /api/email/accounts - Accounts found:');
      validAccounts.forEach((acc, index) => {
        console.log(`   ${index + 1}. ${acc.email} (ID: ${acc.id}, Primary: ${acc.is_primary}, Provider: ${acc.provider_type})`);
      });
      
      // Auto-set first account as primary if no primary exists
      const hasPrimary = validAccounts.some(acc => acc.is_primary);
      if (!hasPrimary && validAccounts.length > 0) {
        console.log('📧 No primary account found, setting first account as primary...');
        
        const { error: updateError } = await securityContext.supabase
          .from('email_accounts')
          .update({ is_primary: true })
          .eq('id', validAccounts[0].id)
          .eq('user_id', securityContext.userId); // Security check
        
        if (!updateError) {
          validAccounts[0].is_primary = true;
          console.log(`✅ Set ${validAccounts[0].email} as primary account`);
        } else {
          console.error('❌ Error setting primary account:', updateError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      accounts: validAccounts,
      count: validAccounts.length
    });

  } catch (error) {
    console.error('Error in email accounts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}