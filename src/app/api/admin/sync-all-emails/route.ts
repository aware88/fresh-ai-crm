import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * Admin endpoint to manually trigger email sync for all accounts
 * GET /api/admin/sync-all-emails
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = createServiceRoleClient();
    
    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    console.log('🔄 Admin triggered sync for all email accounts');
    
    // Trigger the auto-sync cron job
    const cronUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cron/auto-sync-emails`;
    const response = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET || process.env.CRON_SECRET_KEY || ''}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Cron job failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Email sync triggered for all accounts',
      results: result.results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Admin sync failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/sync-all-emails
 * Sync a specific account
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { accountId, forceFullSync = false } = await request.json();
    
    const supabase = createServiceRoleClient();
    
    // Get the account
    const { data: account } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();
    
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    
    // Check if user owns this account or is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    if (account.user_id !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    console.log(`🔄 Manual sync triggered for ${account.email}`);
    
    // Clear sync state if forcing full sync
    if (forceFullSync) {
      await supabase
        .from('email_sync_state')
        .delete()
        .eq('account_id', accountId);
    }
    
    // Determine sync endpoint
    let syncUrl;
    if (account.provider_type === 'microsoft' || account.provider_type === 'outlook') {
      syncUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/emails/graph/sync`;
    } else if (account.provider_type === 'google' || account.provider_type === 'gmail') {
      syncUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/emails/gmail/sync`;
    } else {
      syncUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/sync-to-database`;
    }
    
    // Perform sync
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '' // Forward cookies for auth
      },
      body: JSON.stringify({
        accountId,
        maxEmails: forceFullSync ? 5000 : 500,
        delta: !forceFullSync,
        folder: 'inbox'
      })
    });
    
    const result = await response.json();
    
    if (result.success || result.totalSaved > 0) {
      // Update sync timestamp
      await supabase
        .from('email_accounts')
        .update({
          last_sync_at: new Date().toISOString(),
          sync_error: null
        })
        .eq('id', accountId);
      
      // Trigger AI processing
      if (result.totalSaved > 0) {
        fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/learning/jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            userId: account.user_id,
            accountId,
            mode: 'incremental'
          })
        }).catch(err => console.error('AI processing failed:', err));
      }
      
      return NextResponse.json({
        success: true,
        account: account.email,
        emailsSynced: result.totalSaved || result.importCount || 0,
        breakdown: result.breakdown,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error(result.error || 'Sync failed');
    }
    
  } catch (error) {
    console.error('Manual sync failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed'
    }, { status: 500 });
  }
}