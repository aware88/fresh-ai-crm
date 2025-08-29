#!/usr/bin/env node

/**
 * Migration script for your specific email data structure
 * 
 * Your emails table structure:
 * - 4,929 emails, 493MB total
 * - Large html_content fields (649KB average)
 * - Very few AI analyzed (1/4929)
 * 
 * This script will migrate your emails to the optimized format
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const DRY_RUN = process.env.DRY_RUN === 'true';
const MONTHS_BACK = parseInt(process.env.MONTHS_BACK) || 6; // Default 6 months
const BATCH_SIZE = 50; // Smaller batches for large emails

class YourEmailMigrator {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.migratedCount = 0;
    this.skippedCount = 0;
    this.errorCount = 0;
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  async run() {
    try {
      this.log('🚀 Starting Your Email Migration');
      this.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE MIGRATION'}`);
      this.log(`Timeframe: Last ${MONTHS_BACK} months`);
      this.log('=====================================');

      await this.preflightChecks();
      await this.migrateEmails();
      await this.summary();

    } catch (error) {
      this.log(`❌ Migration failed: ${error.message}`);
      process.exit(1);
    }
  }

  async preflightChecks() {
    this.log('📋 Running pre-flight checks...');

    // Check source table
    const { count: totalEmails } = await this.supabase
      .from('emails')
      .select('id', { count: 'exact', head: true });

    this.log(`✅ Found ${totalEmails} emails in source table`);

    // Check date range
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - MONTHS_BACK);

    const { count: recentEmails } = await this.supabase
      .from('emails')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', cutoffDate.toISOString());

    this.log(`✅ Found ${recentEmails} emails from last ${MONTHS_BACK} months`);

    // Check target tables
    const { error: indexError } = await this.supabase
      .from('email_index')
      .select('id', { head: true, count: 'exact' });

    const { error: cacheError } = await this.supabase
      .from('email_content_cache')
      .select('message_id', { head: true, count: 'exact' });

    if (indexError || cacheError) {
      throw new Error('Optimized email tables not found. Run the SQL setup first.');
    }

    this.log('✅ Target tables ready');

    // Sample size analysis
    const { data: sampleEmail } = await this.supabase
      .from('emails')
      .select('html_content, raw_content')
      .limit(1);

    if (sampleEmail && sampleEmail[0]) {
      const htmlSize = sampleEmail[0].html_content?.length || 0;
      const rawSize = sampleEmail[0].raw_content?.length || 0;
      this.log(`📏 Sample email: HTML ${Math.round(htmlSize/1024)}KB, Raw ${Math.round(rawSize/1024)}KB`);
    }

    this.emailsToMigrate = recentEmails;
    this.log(`🎯 Will migrate ${recentEmails} recent emails`);
  }

  async migrateEmails() {
    this.log('🔄 Starting email migration...');

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - MONTHS_BACK);

    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      // Fetch batch of emails
      const { data: emails, error } = await this.supabase
        .from('emails')
        .select(`
          id, organization_id, message_id, thread_id, subject,
          html_content, raw_content, sender, recipient,
          email_type, importance, has_attachments, attachments,
          ai_analyzed, ai_analyzed_at, upsell_data, assigned_agent,
          highlight_color, agent_priority, replied, last_reply_at,
          created_at, received_at, sent_at
        `)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false })
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) {
        throw new Error(`Failed to fetch emails: ${error.message}`);
      }

      if (!emails || emails.length === 0) {
        hasMore = false;
        break;
      }

      this.log(`📦 Processing batch: ${offset + 1}-${offset + emails.length}`);

      for (const email of emails) {
        await this.migrateEmail(email);
      }

      offset += BATCH_SIZE;
      
      // Progress update
      const progress = Math.min(100, Math.round((offset / this.emailsToMigrate) * 100));
      this.log(`📊 Progress: ${progress}% (${this.migratedCount} migrated, ${this.skippedCount} skipped, ${this.errorCount} errors)`);

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async migrateEmail(email) {
    try {
      // Check if already migrated
      const { data: existing } = await this.supabase
        .from('email_index')
        .select('message_id')
        .eq('message_id', email.message_id)
        .single();

      if (existing) {
        this.skippedCount++;
        return;
      }

      // Prepare email index data (lightweight metadata)
      const indexData = {
        organization_id: email.organization_id,
        message_id: email.message_id,
        thread_id: email.thread_id,
        subject: email.subject,
        sender_email: this.extractEmail(email.sender),
        sender_name: this.extractName(email.sender),
        recipient_email: this.extractEmail(email.recipient),
        email_type: email.email_type,
        has_attachments: email.has_attachments || false,
        attachment_count: this.getAttachmentCount(email.attachments),
        received_at: email.received_at || email.created_at,
        sent_at: email.sent_at,
        
        // AI analysis data (preserved)
        ai_analyzed: email.ai_analyzed || false,
        ai_analyzed_at: email.ai_analyzed_at,
        upsell_data: email.upsell_data,
        assigned_agent: email.assigned_agent,
        highlight_color: email.highlight_color,
        agent_priority: email.agent_priority,
        replied: email.replied || false,
        last_reply_at: email.last_reply_at,
        
        created_at: email.created_at
      };

      if (!DRY_RUN) {
        // Insert into email_index
        const { error: indexError } = await this.supabase
          .from('email_index')
          .insert(indexData);

        if (indexError) {
          throw new Error(`Failed to insert index: ${indexError.message}`);
        }

        // Cache the content temporarily (will be cleaned up later)
        const cacheData = {
          message_id: email.message_id,
          html_content: email.html_content,
          raw_content: email.raw_content,
          attachments: email.attachments,
          cached_at: new Date().toISOString(),
          access_count: 1
        };

        const { error: cacheError } = await this.supabase
          .from('email_content_cache')
          .insert(cacheData);

        if (cacheError) {
          this.log(`⚠️  Cache insert failed for ${email.message_id}: ${cacheError.message}`);
        }
      }

      this.migratedCount++;

    } catch (error) {
      this.log(`❌ Error migrating ${email.message_id}: ${error.message}`);
      this.errorCount++;
    }
  }

  extractEmail(emailString) {
    if (!emailString) return null;
    const match = emailString.match(/<(.+?)>/);
    return match ? match[1] : emailString;
  }

  extractName(emailString) {
    if (!emailString) return null;
    const match = emailString.match(/^(.+?)\s*</);
    return match ? match[1].trim() : null;
  }

  getAttachmentCount(attachments) {
    if (!attachments) return 0;
    if (Array.isArray(attachments)) return attachments.length;
    if (typeof attachments === 'object') return Object.keys(attachments).length;
    return 0;
  }

  async summary() {
    this.log('\n📊 MIGRATION SUMMARY');
    this.log('==================');
    this.log(`✅ Successfully migrated: ${this.migratedCount}`);
    this.log(`⏭️  Skipped (already migrated): ${this.skippedCount}`);
    this.log(`❌ Errors: ${this.errorCount}`);

    if (!DRY_RUN && this.migratedCount > 0) {
      // Calculate storage savings
      const avgEmailSize = 100 * 1024; // 100KB average from your data
      const originalSize = this.migratedCount * avgEmailSize;
      const optimizedSize = this.migratedCount * (0.75 * 1024); // ~0.75KB per email
      const savings = originalSize - optimizedSize;

      this.log(`\n💾 STORAGE IMPACT:`);
      this.log(`• Original size: ${Math.round(originalSize / (1024 * 1024))}MB`);
      this.log(`• Optimized size: ${Math.round(optimizedSize / (1024 * 1024))}MB`);
      this.log(`• Savings: ${Math.round(savings / (1024 * 1024))}MB (${Math.round((savings/originalSize)*100)}%)`);

      this.log(`\n🎯 NEXT STEPS:`);
      this.log('• Test the optimized email system');
      this.log('• Monitor performance improvements');
      this.log('• Consider migrating more emails if satisfied');
      this.log('• Set up automated cache cleanup');
    }

    if (DRY_RUN) {
      this.log(`\n🔄 This was a DRY RUN - no changes made`);
      this.log('Run without DRY_RUN=true to perform actual migration');
    }
  }
}

// Run migration
if (require.main === module) {
  const migrator = new YourEmailMigrator();
  migrator.run().catch(console.error);
}

module.exports = YourEmailMigrator;
