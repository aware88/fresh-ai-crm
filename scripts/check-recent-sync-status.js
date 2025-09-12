#!/usr/bin/env node

/**
 * Check recent email sync status and why new emails aren't appearing
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USER_ID = '2aee7a5b-c7b2-41b4-ae23-dddbc6e37718';
const ACCOUNT_ID = '0d91ab34-e7b8-4d09-9351-7f22fca4a975';

async function checkSyncStatus() {
  try {
    console.log('📊 Checking Recent Email Sync Status...');
    console.log(`👤 User: ${USER_ID}`);
    console.log(`📧 Account: ${ACCOUNT_ID}`);
    
    // Check most recent emails
    console.log('\n📅 Most Recent Emails:');
    const { data: recentEmails, error: recentError } = await supabase
      .from('email_index')
      .select('message_id, subject, sender_email, received_at, created_at')
      .eq('user_id', USER_ID)
      .order('received_at', { ascending: false })
      .limit(10);
    
    if (recentError) {
      console.log('❌ Error fetching recent emails:', recentError);
      return;
    }
    
    if (recentEmails && recentEmails.length > 0) {
      recentEmails.forEach((email, index) => {
        const receivedDate = new Date(email.received_at);
        const syncedDate = new Date(email.created_at);
        const isToday = receivedDate.toDateString() === new Date().toDateString();
        const isYesterday = receivedDate.toDateString() === new Date(Date.now() - 86400000).toDateString();
        
        console.log(`${index + 1}. ${email.subject?.substring(0, 50)}...`);
        console.log(`   From: ${email.sender_email}`);
        console.log(`   Received: ${receivedDate.toLocaleString()} ${isToday ? '(TODAY)' : isYesterday ? '(YESTERDAY)' : ''}`);
        console.log(`   Synced: ${syncedDate.toLocaleString()}`);
        console.log('');
      });
    }
    
    // Check email account sync settings
    console.log('🔧 Email Account Sync Settings:');
    const { data: accountInfo, error: accountError } = await supabase
      .from('email_accounts')
      .select('id, email, sync_enabled, last_sync_at, sync_token, provider')
      .eq('id', ACCOUNT_ID)
      .single();
    
    if (accountError) {
      console.log('❌ Error fetching account info:', accountError);
    } else {
      const lastSyncDate = accountInfo.last_sync_at ? new Date(accountInfo.last_sync_at) : null;
      console.log(`📧 Account: ${accountInfo.email}`);
      console.log(`🔄 Sync Enabled: ${accountInfo.sync_enabled}`);
      console.log(`⏰ Last Sync: ${lastSyncDate ? lastSyncDate.toLocaleString() : 'Never'}`);
      console.log(`🔑 Has Token: ${!!accountInfo.sync_token}`);
      console.log(`🏢 Provider: ${accountInfo.provider}`);
    }
    
    // Check for any sync jobs or background tasks
    console.log('\n⚙️  Background Sync Status:');
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    
    // Check if there have been any recent sync attempts
    const { data: recentSyncs, error: syncError } = await supabase
      .from('email_index')
      .select('created_at')
      .eq('user_id', USER_ID)
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false });
    
    if (syncError) {
      console.log('❌ Error checking recent syncs:', syncError);
    } else {
      console.log(`📥 Emails synced in last hour: ${recentSyncs?.length || 0}`);
    }
    
    // Summary and recommendations
    console.log('\n🔍 Analysis:');
    if (recentEmails && recentEmails.length > 0) {
      const mostRecent = new Date(recentEmails[0].received_at);
      const hoursAgo = Math.floor((now - mostRecent) / (1000 * 60 * 60));
      
      console.log(`📧 Most recent email was ${hoursAgo} hours ago`);
      
      if (hoursAgo < 1) {
        console.log('✅ Sync appears to be working - very recent email found');
      } else if (hoursAgo < 24) {
        console.log('⚠️  No emails today - could be normal or sync issue');
      } else {
        console.log('❌ No recent emails - likely sync issue');
      }
    }
    
    if (accountInfo) {
      if (!accountInfo.sync_enabled) {
        console.log('❌ ISSUE: Account sync is disabled');
      }
      if (!accountInfo.sync_token) {
        console.log('❌ ISSUE: No sync token - authentication may have expired');
      }
      if (accountInfo.last_sync_at) {
        const lastSyncHours = Math.floor((now - new Date(accountInfo.last_sync_at)) / (1000 * 60 * 60));
        if (lastSyncHours > 2) {
          console.log(`⚠️  ISSUE: Last sync was ${lastSyncHours} hours ago (background sync should run every 2 minutes)`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

checkSyncStatus();