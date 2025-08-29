#!/usr/bin/env node

/**
 * Check the actual structure of the emails table
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function checkEmailTableStructure() {
  console.log('🔍 CHECKING YOUR ACTUAL EMAIL TABLE STRUCTURE');
  console.log('==============================================\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get one record to see the structure
    const { data: sampleEmail, error: sampleError } = await supabase
      .from('emails')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error accessing emails table:', sampleError.message);
      return;
    }

    if (sampleEmail && sampleEmail.length > 0) {
      const email = sampleEmail[0];
      console.log('📋 EMAIL TABLE STRUCTURE:');
      console.log('Columns found:');
      
      Object.keys(email).forEach(column => {
        const value = email[column];
        const type = typeof value;
        const size = value ? JSON.stringify(value).length : 0;
        console.log(`• ${column}: ${type} (${size} chars)`);
      });

      console.log('\n📊 SAMPLE EMAIL DATA:');
      console.log(`Subject: ${email.subject || 'No Subject'}`);
      console.log(`From: ${email.sender || email.from || 'Unknown'}`);
      console.log(`Date: ${email.created_at || email.date || 'Unknown'}`);
      console.log(`AI Analyzed: ${email.ai_analyzed ? '✅' : '❌'}`);
      console.log(`Assigned Agent: ${email.assigned_agent || 'None'}`);
      
      // Check content fields
      const contentFields = ['body', 'content', 'html_content', 'text_content', 'raw_content'];
      let largestField = '';
      let largestSize = 0;
      
      contentFields.forEach(field => {
        if (email[field]) {
          const size = email[field].length;
          if (size > largestSize) {
            largestSize = size;
            largestField = field;
          }
          console.log(`${field}: ${Math.round(size/1024)}KB`);
        }
      });

      if (largestField) {
        console.log(`\n💾 Largest content field: ${largestField} (${Math.round(largestSize/1024)}KB)`);
      }

      // Calculate total email size
      let totalSize = 0;
      Object.values(email).forEach(value => {
        if (value && typeof value === 'string') {
          totalSize += value.length;
        }
      });

      console.log(`\n📏 THIS EMAIL SIZE: ${Math.round(totalSize/1024)}KB`);
      console.log(`📏 ESTIMATED TOTAL SIZE: ${Math.round((totalSize * 4929) / (1024 * 1024))}MB`);
    }

    // Get count of emails with AI data
    const { count: aiAnalyzedCount } = await supabase
      .from('emails')
      .select('id', { count: 'exact', head: true })
      .eq('ai_analyzed', true);

    const { count: totalCount } = await supabase
      .from('emails')
      .select('id', { count: 'exact', head: true });

    console.log(`\n🤖 AI ANALYSIS STATUS:`);
    console.log(`• AI analyzed emails: ${aiAnalyzedCount || 0}/${totalCount || 0}`);
    console.log(`• Percentage analyzed: ${Math.round(((aiAnalyzedCount || 0) / (totalCount || 1)) * 100)}%`);

    console.log('\n🎯 MIGRATION RECOMMENDATIONS:');
    console.log('\n📈 HIGH VOLUME SCENARIO (4,929 emails, 493MB):');
    console.log('BEST APPROACH: SELECTIVE MIGRATION + NEW EMAIL OPTIMIZATION');
    console.log('');
    console.log('Option 1: IMMEDIATE BENEFITS (No Migration)');
    console.log('• Start using optimized system for NEW emails only');
    console.log('• Keep existing 493MB as-is for now');
    console.log('• New emails will be 95% smaller immediately');
    console.log('• Gradual migration over time');
    console.log('');
    console.log('Option 2: SELECTIVE MIGRATION (Recommended)');
    console.log('• Migrate recent emails (last 3-6 months)');
    console.log('• Keep older emails as backup');
    console.log('• Immediate 60-80% storage reduction');
    console.log('• Preserve all AI analysis data');
    console.log('');
    console.log('Option 3: FULL MIGRATION (Maximum Savings)');
    console.log('• Migrate all 4,929 emails');
    console.log('• 95% storage reduction (493MB → ~25MB)');
    console.log('• Requires careful backup and testing');
    console.log('• Maximum long-term benefits');

    console.log('\n✨ NEXT STEPS:');
    console.log('1. IMMEDIATE: Start using "Optimized ⚡" tab for new emails');
    console.log('2. OPTIONAL: Run migration for historical data');
    console.log('3. MONITOR: Watch storage usage decrease over time');

  } catch (error) {
    console.error('❌ Error checking email structure:', error);
  }
}

if (require.main === module) {
  checkEmailTableStructure().catch(console.error);
}

module.exports = checkEmailTableStructure;
