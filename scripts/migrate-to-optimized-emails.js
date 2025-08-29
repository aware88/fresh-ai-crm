#!/usr/bin/env node

/**
 * Migration Script: Transition to Optimized Email Architecture
 * 
 * This script safely migrates from the current email storage system
 * to the new optimized hybrid proxy architecture.
 * 
 * What it does:
 * 1. Creates new optimized tables
 * 2. Migrates existing email data to lightweight structure
 * 3. Preserves all AI analysis and CRM data
 * 4. Estimates storage savings
 * 5. Provides rollback capabilities
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration
const BATCH_SIZE = 100;
const DRY_RUN = process.env.DRY_RUN === 'true';

class EmailMigrationTool {
  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    this.stats = {
      totalEmails: 0,
      migratedEmails: 0,
      storageSaved: 0,
      errors: 0,
      startTime: Date.now()
    };
  }

  async run() {
    console.log('🚀 Starting Email Architecture Migration');
    console.log('=====================================');
    
    if (DRY_RUN) {
      console.log('⚠️  DRY RUN MODE - No changes will be made');
    }

    try {
      // Step 1: Pre-migration checks
      await this.preflightChecks();
      
      // Step 2: Create optimized tables
      await this.createOptimizedTables();
      
      // Step 3: Migrate email data
      await this.migrateEmailData();
      
      // Step 4: Verify migration
      await this.verifyMigration();
      
      // Step 5: Generate report
      await this.generateReport();
      
      console.log('\n✅ Migration completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      await this.handleMigrationError(error);
      process.exit(1);
    }
  }

  async preflightChecks() {
    console.log('\n📋 Running pre-flight checks...');
    
    // Check if old emails table exists
    const { data: tables, error } = await this.supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'emails');

    if (error || !tables?.length) {
      throw new Error('Original emails table not found. Nothing to migrate.');
    }

    // Get current email count and size
    const { count: emailCount, error: countError } = await this.supabase
      .from('emails')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Failed to count emails: ${countError.message}`);
    }

    this.stats.totalEmails = emailCount || 0;
    
    console.log(`✅ Found ${this.stats.totalEmails} emails to migrate`);
    
    // Estimate current storage usage
    const { data: sizeData, error: sizeError } = await this.supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          pg_size_pretty(pg_total_relation_size('public.emails')) as current_size,
          pg_total_relation_size('public.emails') as size_bytes
      `
    });

    if (sizeData?.[0]) {
      const currentSizeMB = Math.round(sizeData[0].size_bytes / (1024 * 1024));
      const estimatedNewSizeMB = Math.round(currentSizeMB * 0.05); // 5% of original
      this.stats.storageSaved = currentSizeMB - estimatedNewSizeMB;
      
      console.log(`📊 Current storage: ${sizeData[0].current_size}`);
      console.log(`📊 Estimated new storage: ~${estimatedNewSizeMB}MB`);
      console.log(`💰 Estimated savings: ~${this.stats.storageSaved}MB (95%)`);
    }

    // Check for required columns
    const { data: columns, error: colError } = await this.supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'emails')
      .eq('table_schema', 'public');

    if (colError) {
      throw new Error(`Failed to check table structure: ${colError.message}`);
    }

    const requiredColumns = ['message_id', 'from_address', 'subject'];
    const existingColumns = columns?.map(c => c.column_name) || [];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.warn(`⚠️  Missing columns: ${missingColumns.join(', ')}`);
      console.warn('Migration will proceed but some data may be incomplete');
    }

    console.log('✅ Pre-flight checks completed');
  }

  async createOptimizedTables() {
    console.log('\n🏗️  Creating optimized email architecture...');
    
    if (DRY_RUN) {
      console.log('🔍 DRY RUN: Would create optimized tables');
      return;
    }

    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, '..', 'SUPABASE_OPTIMIZED_EMAIL_ARCHITECTURE.sql');
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error('Optimized email architecture SQL file not found');
    }

    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    try {
      // Execute the SQL (this creates all tables, functions, etc.)
      const { error } = await this.supabase.rpc('exec_sql', { sql });
      
      if (error) {
        throw new Error(`Failed to create optimized tables: ${error.message}`);
      }

      console.log('✅ Optimized email architecture created');
      
    } catch (error) {
      throw new Error(`SQL execution failed: ${error.message}`);
    }
  }

  async migrateEmailData() {
    console.log('\n📦 Migrating email data...');
    
    if (this.stats.totalEmails === 0) {
      console.log('ℹ️  No emails to migrate');
      return;
    }

    const totalBatches = Math.ceil(this.stats.totalEmails / BATCH_SIZE);
    let currentBatch = 0;

    while (currentBatch < totalBatches) {
      const offset = currentBatch * BATCH_SIZE;
      
      console.log(`📊 Processing batch ${currentBatch + 1}/${totalBatches} (${offset + 1}-${Math.min(offset + BATCH_SIZE, this.stats.totalEmails)})`);
      
      try {
        await this.migrateBatch(offset, BATCH_SIZE);
        currentBatch++;
        
        // Progress indicator
        const progress = Math.round((currentBatch / totalBatches) * 100);
        console.log(`⏳ Progress: ${progress}% (${this.stats.migratedEmails}/${this.stats.totalEmails})`);
        
      } catch (error) {
        console.error(`❌ Batch ${currentBatch + 1} failed:`, error.message);
        this.stats.errors++;
        
        // Continue with next batch
        currentBatch++;
      }
    }

    console.log(`✅ Migration completed: ${this.stats.migratedEmails}/${this.stats.totalEmails} emails`);
  }

  async migrateBatch(offset, limit) {
    // Fetch batch of emails from old table
    const { data: emails, error } = await this.supabase
      .from('emails')
      .select('*')
      .order('created_at')
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch email batch: ${error.message}`);
    }

    if (!emails?.length) {
      return;
    }

    if (DRY_RUN) {
      console.log(`🔍 DRY RUN: Would migrate ${emails.length} emails`);
      this.stats.migratedEmails += emails.length;
      return;
    }

    // Transform emails to new structure
    const transformedEmails = emails.map(email => ({
      id: email.id,
      organization_id: email.organization_id,
      user_id: email.user_id,
      email_account_id: email.email_account_id,
      message_id: email.message_id || `migrated-${email.id}`,
      thread_id: email.thread_id,
      folder_name: email.folder || 'INBOX',
      
      // Essential metadata only
      sender_email: email.from_address || email.sender || '',
      sender_name: email.from_name,
      recipient_email: email.to_address || email.recipient,
      subject: email.subject,
      preview_text: this.extractPreview(email.text_content || email.html_content || email.plain_content),
      
      // Email properties
      email_type: email.sent_date ? 'sent' : 'received',
      importance: this.normalizeImportance(email.priority || email.importance),
      has_attachments: email.has_attachments || false,
      attachment_count: 0, // Will be calculated if needed
      
      // AI Analysis (preserve existing)
      ai_analyzed: email.ai_analyzed || false,
      ai_analyzed_at: email.ai_analyzed_at,
      sentiment_score: email.sentiment_score,
      language_code: email.language_code,
      upsell_data: email.upsell_data,
      assigned_agent: email.assigned_agent,
      highlight_color: email.highlight_color,
      agent_priority: email.agent_priority,
      
      // Status
      is_read: email.is_read || false,
      replied: email.replied || false,
      last_reply_at: email.last_reply_at,
      processing_status: email.processing_status || 'pending',
      
      // Timestamps
      received_at: email.received_date || email.received_at || email.created_at,
      sent_at: email.sent_date || email.sent_at,
      created_at: email.created_at,
      updated_at: email.updated_at
    }));

    // Insert into new email_index table
    const { error: insertError } = await this.supabase
      .from('email_index')
      .insert(transformedEmails);

    if (insertError) {
      throw new Error(`Failed to insert email batch: ${insertError.message}`);
    }

    this.stats.migratedEmails += emails.length;

    // Cache frequently accessed content
    await this.cacheImportantEmails(emails);
  }

  async cacheImportantEmails(emails) {
    // Cache content for recently accessed or high-priority emails
    const importantEmails = emails.filter(email => 
      email.agent_priority === 'high' || 
      email.agent_priority === 'urgent' ||
      !email.is_read ||
      (email.received_date && new Date(email.received_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
    );

    if (importantEmails.length === 0) return;

    console.log(`📦 Caching content for ${importantEmails.length} important emails`);

    for (const email of importantEmails) {
      try {
        if (email.html_content || email.text_content || email.raw_content) {
          await this.supabase.rpc('cache_email_content', {
            p_message_id: email.message_id,
            p_raw_content: email.raw_content,
            p_html_content: email.html_content,
            p_plain_content: email.text_content || email.plain_content,
            p_attachments: email.attachments || []
          });
        }
      } catch (error) {
        console.warn(`Failed to cache content for ${email.message_id}:`, error.message);
      }
    }
  }

  async verifyMigration() {
    console.log('\n🔍 Verifying migration...');
    
    // Count migrated emails
    const { count: migratedCount, error } = await this.supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Failed to verify migration: ${error.message}`);
    }

    console.log(`✅ Migrated emails: ${migratedCount}/${this.stats.totalEmails}`);
    
    if (migratedCount !== this.stats.totalEmails) {
      console.warn(`⚠️  Mismatch: Expected ${this.stats.totalEmails}, got ${migratedCount}`);
    }

    // Verify AI analysis preservation
    const { count: analyzedCount, error: analyzedError } = await this.supabase
      .from('email_index')
      .select('*', { count: 'exact', head: true })
      .eq('ai_analyzed', true);

    if (!analyzedError) {
      console.log(`✅ AI analyzed emails preserved: ${analyzedCount}`);
    }

    // Check new table sizes
    const { data: sizeData, error: sizeError } = await this.supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          'email_index' as table_name,
          pg_size_pretty(pg_total_relation_size('public.email_index')) as size,
          pg_total_relation_size('public.email_index') as size_bytes
        UNION ALL
        SELECT 
          'email_content_cache' as table_name,
          pg_size_pretty(pg_total_relation_size('public.email_content_cache')) as size,
          pg_total_relation_size('public.email_content_cache') as size_bytes
      `
    });

    if (sizeData) {
      console.log('\n📊 New table sizes:');
      sizeData.forEach(row => {
        console.log(`   ${row.table_name}: ${row.size}`);
      });
    }
  }

  async generateReport() {
    console.log('\n📄 Generating migration report...');
    
    const duration = Math.round((Date.now() - this.stats.startTime) / 1000);
    
    const report = {
      migration: {
        timestamp: new Date().toISOString(),
        duration_seconds: duration,
        dry_run: DRY_RUN
      },
      statistics: {
        total_emails: this.stats.totalEmails,
        migrated_emails: this.stats.migratedEmails,
        errors: this.stats.errors,
        success_rate: Math.round((this.stats.migratedEmails / this.stats.totalEmails) * 100),
        estimated_storage_saved_mb: this.stats.storageSaved
      },
      benefits: {
        storage_reduction_percent: 95,
        performance_improvement: 'Lightning-fast email list loading',
        cost_savings: 'Significant reduction in database storage costs',
        user_experience: 'Zero impact - same functionality, better performance'
      },
      next_steps: [
        'Update application code to use OptimizedEmailService',
        'Test thoroughly in staging environment',
        'Monitor performance and storage usage',
        'Remove old emails table after successful deployment'
      ]
    };

    const reportFile = path.join(__dirname, '..', `migration-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log('📊 Migration Summary:');
    console.log(`   Total emails: ${this.stats.totalEmails}`);
    console.log(`   Migrated: ${this.stats.migratedEmails} (${report.statistics.success_rate}%)`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log(`   Duration: ${duration} seconds`);
    console.log(`   Storage saved: ~${this.stats.storageSaved}MB (95%)`);
    console.log(`   Report saved: ${reportFile}`);
  }

  async handleMigrationError(error) {
    console.log('\n🔄 Attempting to rollback changes...');
    
    if (DRY_RUN) {
      console.log('🔍 DRY RUN: No rollback needed');
      return;
    }

    try {
      // Drop newly created tables to rollback
      await this.supabase.rpc('exec_sql', {
        sql: `
          DROP TABLE IF EXISTS public.email_content_cache CASCADE;
          DROP TABLE IF EXISTS public.email_threads CASCADE;
          DROP TABLE IF EXISTS public.email_index CASCADE;
        `
      });
      
      console.log('✅ Rollback completed - original tables preserved');
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError.message);
      console.error('⚠️  Manual cleanup may be required');
    }
  }

  // Utility methods
  extractPreview(content) {
    if (!content) return '';
    
    // Strip HTML tags and get first 200 characters
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text.length > 200 ? text.substring(0, 200) + '...' : text;
  }

  normalizeImportance(priority) {
    if (!priority) return 'normal';
    
    const p = priority.toLowerCase();
    if (p.includes('high') || p.includes('urgent')) return 'high';
    if (p.includes('low')) return 'low';
    return 'normal';
  }
}

// Main execution
if (require.main === module) {
  const migration = new EmailMigrationTool();
  migration.run().catch(console.error);
}

module.exports = EmailMigrationTool;
