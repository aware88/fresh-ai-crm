#!/usr/bin/env node
/**
 * Manually sync Zarfin's emails
 * Run this while your app is running to trigger email sync
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

async function syncZarfinEmails() {
  console.log('📧 Starting manual email sync for Zarfin...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // First, get Zarfin's account details
  const { data: accounts } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('email', 'zarfin.jakupovic@withcar.si')
    .single();

  if (!accounts) {
    console.error('❌ Zarfin account not found');
    return;
  }

  console.log('Found Zarfin\'s account:');
  console.log('  ID:', accounts.id);
  console.log('  Email:', accounts.email);
  console.log('  Provider:', accounts.provider_type);
  console.log('  Sync Active:', accounts.real_time_sync_active);
  console.log('');

  const port = process.env.PORT || '3002';
  const baseUrl = `http://localhost:${port}`;

  try {
    console.log('🔄 Calling sync API...');
    
    // Call the Microsoft Graph sync endpoint
    const response = await fetch(`${baseUrl}/api/emails/graph/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-RealTime-Sync' // This bypasses authentication
      },
      body: JSON.stringify({
        accountId: accounts.id,
        folder: 'inbox',
        maxEmails: 50, // Start with 50 emails
        internalCall: true
      })
    });

    const responseText = await response.text();
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('\n✅ Sync successful!');
        console.log(`   Fetched ${result.totalFetched || 0} emails from Microsoft`);
        console.log(`   Saved ${result.savedCount || 0} new emails to database`);
        
        if (result.syncState) {
          console.log(`   Sync state updated: ${result.syncState}`);
        }
      } catch (e) {
        console.log('✅ Sync completed:', responseText);
      }
    } else {
      console.error('❌ Sync failed with status:', response.status);
      console.error('Response:', responseText);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Cannot connect to the app at', baseUrl);
      console.log('\n📌 Make sure your app is running on port', port);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

syncZarfinEmails().catch(console.error);