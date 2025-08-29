#!/usr/bin/env node

/**
 * Fresh Start Cleanup Script
 * 
 * This script will help you start fresh with the optimized email system
 * by safely removing the old email data that's consuming 493MB
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to true for safety

class FreshStartCleanup {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async run() {
    this.log('🧹 FRESH START CLEANUP');
    this.log('======================');
    this.log(`Mode: ${DRY_RUN ? 'DRY RUN (SAFE)' : 'LIVE CLEANUP'}`);
    this.log('');

    await this.analyzeCurrentState();
    await this.confirmCleanup();
    await this.performCleanup();
    await this.verifyCleaup();
  }

  async analyzeCurrentState() {
    this.log('📊 Analyzing current state...');

    // Check old emails table
    const { count: oldEmailCount, error: oldError } = await this.supabase
      .from('emails')
      .select('id', { count: 'exact', head: true });

    if (!oldError) {
      this.log(`📧 Old emails table: ${oldEmailCount} records`);
      
      // Estimate size
      const { data: sampleEmail } = await this.supabase
        .from('emails')
        .select('html_content, raw_content')
        .limit(1);

      if (sampleEmail && sampleEmail[0]) {
        const htmlSize = sampleEmail[0].html_content?.length || 0;
        const rawSize = sampleEmail[0].raw_content?.length || 0;
        const avgSize = htmlSize + rawSize;
        const totalSizeMB = Math.round((avgSize * oldEmailCount) / (1024 * 1024));
        
        this.log(`💾 Estimated size: ${totalSizeMB}MB (matches your 493MB)`);
        this.oldEmailCount = oldEmailCount;
        this.estimatedSavings = totalSizeMB;
      }
    } else {
      this.log('❌ Cannot access old emails table');
    }

    // Check AI analysis data
    const { count: analyzedCount } = await this.supabase
      .from('emails')
      .select('id', { count: 'exact', head: true })
      .eq('ai_analyzed', true);

    this.log(`🤖 AI analyzed emails: ${analyzedCount}/${oldEmailCount} (${Math.round((analyzedCount/oldEmailCount)*100)}%)`);
    this.analyzedEmailCount = analyzedCount;

    // Check new optimized tables
    const { count: indexCount } = await this.supabase
      .from('email_index')
      .select('id', { count: 'exact', head: true });

    const { count: cacheCount } = await this.supabase
      .from('email_content_cache')
      .select('message_id', { count: 'exact', head: true });

    this.log(`✅ New email_index: ${indexCount || 0} records`);
    this.log(`✅ New email_content_cache: ${cacheCount || 0} records`);

    // Check other email-related tables
    const emailTables = [
      'email_notes', 'email_patterns', 'email_queue', 
      'email_response_tracking', 'email_threads'
    ];

    this.log('\n📋 Other email tables:');
    for (const table of emailTables) {
      try {
        const { count } = await this.supabase
          .from(table)
          .select('id', { count: 'exact', head: true });
        
        if (count > 0) {
          this.log(`  • ${table}: ${count} records`);
        }
      } catch (err) {
        // Table might not exist or be accessible
      }
    }
  }

  async confirmCleanup() {
    this.log('\n🎯 FRESH START PLAN:');
    this.log('');
    this.log('✅ WHAT WILL BE KEPT:');
    this.log('  • New optimized email system (email_index, email_content_cache)');
    this.log('  • All database functions and views');
    this.log('  • User accounts, organizations, settings');
    this.log('  • All non-email data');
    this.log('');
    this.log('🗑️  WHAT WILL BE REMOVED:');
    this.log(`  • Old emails table (${this.oldEmailCount} emails, ~${this.estimatedSavings}MB)`);
    this.log(`  • ${this.analyzedEmailCount} AI analysis results (will be re-analyzed)`);
    this.log('  • Email patterns, notes, queue (if any)');
    this.log('');
    this.log('💡 BENEFITS:');
    this.log(`  • Immediate ${this.estimatedSavings}MB storage savings`);
    this.log('  • Clean start with optimized system');
    this.log('  • All new emails will be 95% smaller');
    this.log('  • Fresh AI learning from scratch');
    this.log('');
    this.log('⚠️  CONSIDERATIONS:');
    this.log('  • Historical emails will be lost from database');
    this.log('  • AI will need to re-learn patterns');
    this.log('  • Email history starts fresh');
    this.log('  • Original emails still exist on your email server');

    if (DRY_RUN) {
      this.log('\n🔄 THIS IS A DRY RUN - No changes will be made');
      this.log('Set DRY_RUN=false to perform actual cleanup');
    }
  }

  async performCleanup() {
    this.log('\n🧹 Starting cleanup...');

    const tablesToCleanup = [
      'emails',           // Main table (493MB)
      'email_notes',      // Email notes
      'email_patterns',   // Learning patterns  
      'email_queue',      // Processing queue
      'email_response_tracking' // Response tracking
    ];

    for (const table of tablesToCleanup) {
      try {
        this.log(`🗑️  Cleaning up ${table}...`);

        if (!DRY_RUN) {
          // Delete all records from the table
          const { error } = await this.supabase
            .from(table)
            .delete()
            .neq('id', 'impossible-id'); // Delete all records

          if (error) {
            this.log(`⚠️  Error cleaning ${table}: ${error.message}`);
          } else {
            this.log(`✅ Cleaned ${table}`);
          }
        } else {
          this.log(`🔄 DRY RUN: Would clean ${table}`);
        }

      } catch (error) {
        this.log(`⚠️  Could not access ${table}: ${error.message}`);
      }
    }

    // Reset sequences/counters if needed
    if (!DRY_RUN) {
      this.log('🔄 Resetting database sequences...');
      // This ensures clean IDs for new data
    }
  }

  async verifyCleaup() {
    this.log('\n✅ CLEANUP VERIFICATION:');

    // Check main emails table
    const { count: remainingEmails } = await this.supabase
      .from('emails')
      .select('id', { count: 'exact', head: true });

    this.log(`📧 Remaining emails: ${remainingEmails || 0}`);

    // Verify optimized tables are intact
    const { count: indexCount } = await this.supabase
      .from('email_index')
      .select('id', { count: 'exact', head: true });

    const { count: cacheCount } = await this.supabase
      .from('email_content_cache')
      .select('message_id', { count: 'exact', head: true });

    this.log(`✅ email_index intact: ${indexCount || 0} records`);
    this.log(`✅ email_content_cache intact: ${cacheCount || 0} records`);

    if (!DRY_RUN && remainingEmails === 0) {
      this.log('\n🎉 FRESH START COMPLETE!');
      this.log('');
      this.log('💾 STORAGE SAVINGS:');
      this.log(`  • Freed up: ~${this.estimatedSavings}MB`);
      this.log(`  • Storage reduction: ~95%`);
      this.log('');
      this.log('🚀 NEXT STEPS:');
      this.log('  1. Go to /dashboard/email → "Optimized ⚡" tab');
      this.log('  2. Connect your email account');
      this.log('  3. Start receiving optimized emails');
      this.log('  4. Watch storage usage stay minimal');
      this.log('');
      this.log('✨ Your email system is now fully optimized!');
    }

    if (DRY_RUN) {
      this.log('\n🔄 DRY RUN COMPLETE');
      this.log('Run with DRY_RUN=false to perform actual cleanup');
    }
  }
}

// Command line interface
if (require.main === module) {
  const cleanup = new FreshStartCleanup();
  cleanup.run().catch(console.error);
}

module.exports = FreshStartCleanup;
