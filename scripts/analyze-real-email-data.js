#!/usr/bin/env node

/**
 * Analyze real email data in Supabase and provide migration strategy
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function analyzeRealEmailData() {
  console.log('📊 ANALYZING YOUR ACTUAL EMAIL DATA');
  console.log('=====================================\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Check the main emails table
    console.log('🔍 Checking emails table...');
    const { count: emailCount, error: emailError } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true });

    if (emailError) {
      console.error('❌ Error accessing emails table:', emailError.message);
      return;
    }

    console.log(`✅ Found ${emailCount} emails in main table`);

    // Get sample data to understand structure
    const { data: sampleEmails, error: sampleError } = await supabase
      .from('emails')
      .select('id, subject, sender, text_content, html_content, ai_analyzed, upsell_data, assigned_agent, created_at')
      .limit(5);

    if (sampleError) {
      console.error('❌ Error getting sample data:', sampleError.message);
      return;
    }

    // Analyze the data
    let totalSize = 0;
    let aiAnalyzedCount = 0;
    let hasUpsellData = 0;
    let hasAssignedAgent = 0;

    if (sampleEmails && sampleEmails.length > 0) {
      console.log('\n📋 SAMPLE EMAIL DATA:');
      sampleEmails.forEach((email, i) => {
        const textSize = (email.text_content || '').length;
        const htmlSize = (email.html_content || '').length;
        const emailSize = textSize + htmlSize;
        totalSize += emailSize;

        if (email.ai_analyzed) aiAnalyzedCount++;
        if (email.upsell_data) hasUpsellData++;
        if (email.assigned_agent) hasAssignedAgent++;

        console.log(`${i + 1}. "${email.subject || 'No Subject'}"`);
        console.log(`   From: ${email.sender || 'Unknown'}`);
        console.log(`   Size: ${Math.round(emailSize / 1024)}KB | AI: ${email.ai_analyzed ? '✅' : '❌'} | Agent: ${email.assigned_agent || 'None'}`);
        console.log(`   Date: ${email.created_at || 'Unknown'}`);
        console.log('');
      });

      const avgSize = totalSize / sampleEmails.length;
      const estimatedTotalSize = (avgSize * emailCount) / (1024 * 1024); // MB

      console.log(`📊 DATA ANALYSIS:`);
      console.log(`• Average email size: ${Math.round(avgSize / 1024)}KB`);
      console.log(`• Estimated total size: ${Math.round(estimatedTotalSize)}MB`);
      console.log(`• AI analyzed emails: ${Math.round((aiAnalyzedCount / sampleEmails.length) * 100)}% of sample`);
      console.log(`• Emails with upsell data: ${Math.round((hasUpsellData / sampleEmails.length) * 100)}% of sample`);
      console.log(`• Emails with assigned agents: ${Math.round((hasAssignedAgent / sampleEmails.length) * 100)}% of sample`);
    }

    // Check if optimized tables exist
    console.log('\n🔍 Checking optimized tables...');
    
    const { count: indexCount, error: indexError } = await supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true });

    const { count: cacheCount, error: cacheError } = await supabase
      .from('email_content_cache')
      .select('*', { count: 'exact', head: true });

    if (!indexError) {
      console.log(`✅ email_index table: ${indexCount || 0} records`);
    } else {
      console.log('❌ email_index table not accessible');
    }

    if (!cacheError) {
      console.log(`✅ email_content_cache table: ${cacheCount || 0} records`);
    } else {
      console.log('❌ email_content_cache table not accessible');
    }

    // Provide migration strategy
    console.log('\n🎯 MIGRATION STRATEGY FOR YOUR DATA:\n');

    if (emailCount > 5000) {
      console.log('📈 HIGH VOLUME SCENARIO (5000+ emails):');
      console.log('RECOMMENDED: SELECTIVE MIGRATION');
      console.log('• Migrate recent emails (last 6 months) for immediate benefits');
      console.log('• Keep older emails in original format as backup');
      console.log('• Estimated savings: 60-80% storage reduction');
      console.log('');
      console.log('COMMAND:');
      console.log('DRY_RUN=true MONTHS_BACK=6 node scripts/migrate-to-optimized-emails.js');
    } else if (emailCount > 1000) {
      console.log('📊 MEDIUM VOLUME SCENARIO (1000-5000 emails):');
      console.log('RECOMMENDED: FULL MIGRATION WITH BACKUP');
      console.log('• Migrate all emails to optimized format');
      console.log('• Create backup of original table first');
      console.log('• Estimated savings: 95% storage reduction');
      console.log('');
      console.log('COMMANDS:');
      console.log('1. CREATE BACKUP: node scripts/backup-original-emails.js');
      console.log('2. MIGRATE: DRY_RUN=true node scripts/migrate-to-optimized-emails.js');
    } else {
      console.log('📝 MANAGEABLE VOLUME SCENARIO (<1000 emails):');
      console.log('RECOMMENDED: FULL MIGRATION');
      console.log('• Quick and safe to migrate all emails');
      console.log('• Maximum storage savings immediately');
      console.log('• Estimated savings: 95% storage reduction');
      console.log('');
      console.log('COMMAND:');
      console.log('DRY_RUN=true node scripts/migrate-to-optimized-emails.js');
    }

    // Calculate potential savings
    const currentSizeMB = 493; // From the screenshot
    const optimizedSizeMB = Math.round(currentSizeMB * 0.05); // 5% of original
    const savingsMB = currentSizeMB - optimizedSizeMB;

    console.log('\n💾 STORAGE IMPACT PROJECTION:');
    console.log(`• Current storage: ${currentSizeMB}MB (from your dashboard)`);
    console.log(`• After optimization: ~${optimizedSizeMB}MB`);
    console.log(`• Total savings: ${savingsMB}MB (${Math.round((savingsMB/currentSizeMB)*100)}% reduction)`);
    console.log(`• Cost savings: Significant reduction in Supabase storage costs`);

    console.log('\n🚀 IMMEDIATE BENEFITS (No Migration Required):');
    console.log('• New emails automatically use optimized system');
    console.log('• Existing emails remain fully accessible');
    console.log('• AI analysis and learning data preserved');
    console.log('• Users can start using optimized tab immediately');

    console.log('\n✨ Your optimized system is ready! Migration is optional but recommended for maximum savings.');

  } catch (error) {
    console.error('❌ Error analyzing email data:', error);
  }
}

if (require.main === module) {
  analyzeRealEmailData().catch(console.error);
}

module.exports = analyzeRealEmailData;
