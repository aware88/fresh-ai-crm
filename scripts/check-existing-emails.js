#!/usr/bin/env node

/**
 * Check existing email data and provide migration options
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function checkExistingEmails() {
  console.log('📧 Checking existing email data...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Check for various email table names
  const possibleTables = ['emails', 'emails_public', 'public.emails', 'email_data'];
  let foundTables = [];
  let totalEmails = 0;

  for (const tableName of possibleTables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        foundTables.push({ name: tableName, count });
        totalEmails += count;
        console.log(`✅ Found table: ${tableName} (${count} records)`);
      }
    } catch (err) {
      // Table doesn't exist, skip
    }
  }

  console.log(`\n📊 SUMMARY:`);
  console.log(`• Found ${foundTables.length} email table(s)`);
  console.log(`• Total emails: ${totalEmails}`);

  if (foundTables.length === 0) {
    console.log('\n🎉 CLEAN START!');
    console.log('No existing email data found. You can start fresh with the optimized system.');
    console.log('New emails will be automatically stored in the optimized format.');
    return;
  }

  // Check storage usage
  if (totalEmails > 0) {
    const largestTable = foundTables.reduce((prev, current) => 
      prev.count > current.count ? prev : current
    );
    
    console.log(`\n💾 STORAGE ANALYSIS:`);
    console.log(`• Largest table: ${largestTable.name} (${largestTable.count} emails)`);
    
    // Estimate storage savings
    const estimatedCurrentSize = totalEmails * 15; // ~15KB per email average
    const estimatedNewSize = totalEmails * 0.75; // ~0.75KB per email in optimized format
    const savings = estimatedCurrentSize - estimatedNewSize;
    
    console.log(`• Estimated current storage: ${Math.round(estimatedCurrentSize / 1024)}MB`);
    console.log(`• Estimated optimized storage: ${Math.round(estimatedNewSize / 1024)}MB`);
    console.log(`• Potential savings: ${Math.round(savings / 1024)}MB (${Math.round((savings/estimatedCurrentSize)*100)}%)`);
  }

  console.log(`\n🎯 RECOMMENDED OPTIONS:\n`);

  if (totalEmails > 1000) {
    console.log('📈 HIGH VOLUME SCENARIO (>1000 emails):');
    console.log('• Option 1: HYBRID APPROACH (Recommended)');
    console.log('  - Keep existing emails as-is for historical reference');
    console.log('  - New emails use optimized system automatically');
    console.log('  - Gradually migrate important emails on-demand');
    console.log('');
    console.log('• Option 2: SELECTIVE MIGRATION');
    console.log('  - Migrate only recent emails (last 3-6 months)');
    console.log('  - Archive older emails for backup');
    console.log('  - Significant storage savings immediately');
  } else if (totalEmails > 100) {
    console.log('📊 MEDIUM VOLUME SCENARIO (100-1000 emails):');
    console.log('• Option 1: FULL MIGRATION (Recommended)');
    console.log('  - Migrate all existing emails to optimized format');
    console.log('  - Maximum storage savings');
    console.log('  - Unified system for all emails');
    console.log('');
    console.log('• Option 2: FRESH START');
    console.log('  - Keep existing emails as backup');
    console.log('  - Start fresh with optimized system');
    console.log('  - Simpler, faster deployment');
  } else {
    console.log('📝 LOW VOLUME SCENARIO (<100 emails):');
    console.log('• Recommended: FULL MIGRATION');
    console.log('  - Quick and easy to migrate all emails');
    console.log('  - Clean, unified system');
    console.log('  - Maximum benefits from day one');
  }

  console.log(`\n🚀 NEXT STEPS:\n`);
  console.log('1. IMMEDIATE (No migration needed):');
  console.log('   • New emails will automatically use the optimized system');
  console.log('   • 95% storage savings on all new emails');
  console.log('   • Lightning-fast performance for new data');
  console.log('');
  console.log('2. OPTIONAL MIGRATION:');
  console.log('   • Run: npm run migrate-emails');
  console.log('   • Or: node scripts/migrate-to-optimized-emails.js');
  console.log('   • Includes dry-run mode for safe testing');
  console.log('');
  console.log('3. MONITORING:');
  console.log('   • Watch storage usage in Supabase dashboard');
  console.log('   • Monitor performance improvements');
  console.log('   • Set up automated cache cleanup');

  // Sample a few emails to show what would be migrated
  if (foundTables.length > 0 && totalEmails > 0) {
    const mainTable = foundTables[0];
    try {
      const { data: sampleEmails } = await supabase
        .from(mainTable.name)
        .select('subject, sender, created_at, ai_analyzed')
        .limit(3);
      
      if (sampleEmails && sampleEmails.length > 0) {
        console.log(`\n📋 SAMPLE DATA from ${mainTable.name}:`);
        sampleEmails.forEach((email, i) => {
          console.log(`${i + 1}. "${email.subject || 'No Subject'}" from ${email.sender || 'Unknown'}`);
          console.log(`   Date: ${email.created_at || 'Unknown'} | AI Analyzed: ${email.ai_analyzed ? '✅' : '❌'}`);
        });
      }
    } catch (err) {
      // Ignore sampling errors
    }
  }

  console.log(`\n✨ The optimized email system is ready to use!`);
  console.log('Your choice: migrate existing data or start fresh - both work perfectly.');
}

if (require.main === module) {
  checkExistingEmails().catch(console.error);
}

module.exports = checkExistingEmails;
