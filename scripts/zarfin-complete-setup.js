/**
 * Complete setup for Zarfin: Sync 5000 emails + Trigger AI Learning
 * This does both steps needed for effective AI learning
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function completeSetup() {
  console.log('🚀 Complete Zarfin Setup: Email Sync + AI Learning\n');
  
  try {
    // Step 1: Find Zarfin's account
    const { data: accounts, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .ilike('email', '%zarfin%');
    
    if (accountError || !accounts?.length) {
      console.error('❌ Could not find Zarfin\'s email account:', accountError);
      return;
    }
    
    const account = accounts[0];
    console.log(`👤 Found account: ${account.email} (${account.provider_type})`);
    console.log(`📧 Account ID: ${account.id}`);
    console.log(`👨‍💻 User ID: ${account.user_id}\n`);
    
    // Check current email count
    const { count: currentCount } = await supabase
      .from('email_index')
      .select('*', { count: 'exact' })
      .eq('email_account_id', account.id);
    
    console.log(`📊 Current emails in database: ${currentCount || 0}`);
    
    // Step 2: Sync emails (if needed)
    if ((currentCount || 0) < 1000) {
      console.log('\n🔄 STEP 1: Syncing emails (need at least 1000 for good AI learning)...');
      
      // Clear sync state for fresh sync
      await supabase
        .from('email_sync_state')
        .delete()
        .eq('account_id', account.id);
      
      // Determine sync endpoint
      let syncUrl;
      if (account.provider_type === 'microsoft' || account.provider_type === 'outlook') {
        syncUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/emails/graph/sync`;
      } else if (account.provider_type === 'google' || account.provider_type === 'gmail') {
        syncUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/emails/gmail/sync`;
      } else {
        syncUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/sync-to-database`;
      }
      
      const syncStartTime = Date.now();
      
      try {
        const response = await fetch(syncUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: account.id,
            maxEmails: 5000,
            delta: false,
            folder: 'inbox',
            internalCall: true // Bypass auth for internal calls
          })
        });
        
        const result = await response.json();
        const syncDuration = ((Date.now() - syncStartTime) / 1000).toFixed(2);
        
        if (result.success || result.totalSaved > 0) {
          console.log(`✅ Email sync completed in ${syncDuration}s`);
          console.log(`📈 Synced: ${result.totalSaved || result.importCount || 0} emails`);
          
          // Check new total
          const { count: newCount } = await supabase
            .from('email_index')
            .select('*', { count: 'exact' })
            .eq('email_account_id', account.id);
          
          console.log(`📊 Total emails now: ${newCount || 0}`);
        } else {
          console.error('❌ Email sync failed:', result.error);
          return;
        }
      } catch (syncError) {
        if (syncError.code === 'ECONNREFUSED') {
          console.log('⚠️  Development server not running, skipping email sync');
          console.log('   Run manually: node scripts/force-sync-zarfin.js');
        } else {
          console.error('❌ Email sync error:', syncError.message);
        }
      }
    } else {
      console.log('✅ Already have enough emails for AI learning');
    }
    
    // Step 3: Check final email count
    const { count: finalCount } = await supabase
      .from('email_index')
      .select('*', { count: 'exact' })
      .eq('email_account_id', account.id);
    
    if ((finalCount || 0) < 100) {
      console.log('\n⚠️  Not enough emails for AI learning (need at least 100)');
      console.log(`   Current: ${finalCount || 0} emails`);
      console.log('   Please run email sync first or check email account connection');
      return;
    }
    
    // Step 4: Trigger AI Learning
    console.log('\n🤖 STEP 2: Starting AI Learning Process...');
    console.log(`Processing ${finalCount} emails for pattern extraction`);
    
    try {
      // Use the background job service for AI learning
      const learningUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/learning/initial`;
      
      const learningStartTime = Date.now();
      
      const learningResponse = await fetch(learningUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxEmails: finalCount,
          organizationId: null, // Will be fetched automatically
          accountId: account.id
        })
      });
      
      const learningResult = await learningResponse.json();
      
      if (learningResult.success || learningResult.jobId) {
        const jobId = learningResult.jobId;
        console.log(`✅ AI Learning job started: ${jobId}`);
        
        if (jobId) {
          console.log('\n📊 Monitoring job progress...');
          
          // Monitor job progress
          let completed = false;
          let attempts = 0;
          const maxAttempts = 60; // 5 minutes max
          
          while (!completed && attempts < maxAttempts) {
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            
            try {
              const statusResponse = await fetch(
                `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/learning/jobs/${jobId}`
              );
              const status = await statusResponse.json();
              
              if (status.job) {
                const progress = Math.round((status.job.processedEmails / status.job.totalEmails) * 100);
                console.log(`⏳ Progress: ${status.job.processedEmails}/${status.job.totalEmails} (${progress}%)`);
                
                if (status.job.status === 'completed') {
                  completed = true;
                  const learningDuration = ((Date.now() - learningStartTime) / 1000).toFixed(2);
                  console.log(`🎉 AI Learning completed in ${learningDuration}s!`);
                  console.log(`✨ Successful: ${status.job.successfulEmails}`);
                  console.log(`❌ Failed: ${status.job.failedEmails}`);
                  console.log(`⏭️  Skipped: ${status.job.skippedEmails}`);
                } else if (status.job.status === 'failed') {
                  completed = true;
                  console.error('❌ AI Learning job failed:', status.job.errorMessage);
                }
              }
            } catch (statusError) {
              console.log('⚠️  Could not check job status (server may not be running)');
              break;
            }
          }
          
          if (!completed && attempts >= maxAttempts) {
            console.log('⏰ Job monitoring timeout - check status later via dashboard');
          }
        }
        
        // Check learning results
        const { count: patternsCount } = await supabase
          .from('email_patterns')
          .select('*', { count: 'exact' })
          .eq('user_id', account.user_id);
        
        console.log(`\n📊 Final Results:`);
        console.log(`📧 Total emails processed: ${finalCount}`);
        console.log(`🧠 AI patterns created: ${patternsCount || 0}`);
        
        if ((patternsCount || 0) > 0) {
          console.log(`\n🎯 SUCCESS! Zarfin's AI learning is complete!`);
          console.log(`✅ The system can now generate personalized email responses`);
          console.log(`✅ AI tags and highlights should now appear in the email interface`);
          console.log(`✅ Email analysis and sales agent features are ready to use`);
        } else {
          console.log(`\n⚠️  No patterns were created - may need to check AI learning service`);
        }
        
      } else {
        console.error('❌ AI Learning failed:', learningResult.error);
      }
      
    } catch (learningError) {
      if (learningError.code === 'ECONNREFUSED') {
        console.log('\n⚠️  Development server not running for AI learning');
        console.log('   Alternative: Use the admin panel to trigger learning once server is running');
        console.log(`   Or call: POST /api/email/learning/initial`);
        console.log(`   Body: {"maxEmails": ${finalCount}, "accountId": "${account.id}"}`);
      } else {
        console.error('❌ AI Learning error:', learningError.message);
      }
    }
    
    console.log('\n🏁 Setup process complete!');
    
  } catch (error) {
    console.error('💥 Setup failed:', error);
  }
}

// Run the complete setup
completeSetup();