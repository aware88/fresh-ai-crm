const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Import the real AI learning service
const path = require('path');
const EmailLearningService = require('../src/lib/email/email-learning-service.js').default;

async function runRealAILearning() {
  console.log('🧠 Starting REAL AI Learning with EmailLearningService...');
  console.log('📊 Will process all 311 emails using proper AI pattern extraction');
  
  try {
    // Get all email message IDs for Zarfin
    const userId = '2aee7a5b-c7b2-41b4-ae23-dddbc6e37718';
    const organizationId = undefined; // Will be auto-detected
    
    const { data: emails, error } = await supabase
      .from('email_index')
      .select('message_id')
      .eq('user_id', userId)
      .order('received_at', { ascending: false });
    
    if (error || !emails) {
      console.error('❌ Error fetching emails:', error);
      return;
    }
    
    console.log(`📧 Found ${emails.length} emails to process`);
    const messageIds = emails.map(email => email.message_id);
    
    // Initialize the real learning service
    const learningService = new EmailLearningService();
    
    console.log('🔄 Starting batch processing...');
    
    // Process in smaller batches to monitor progress
    const batchSize = 20;
    let totalSuccessful = 0;
    let totalFailed = 0;
    
    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(messageIds.length / batchSize);
      
      console.log(`\\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} emails)...`);
      
      try {
        const result = await learningService.processEmailsBatch(batch, userId, organizationId);
        totalSuccessful += result.successful;
        totalFailed += result.failed;
        
        console.log(`  ✅ Batch ${batchNum}: ${result.successful} successful, ${result.failed} failed`);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ❌ Batch ${batchNum} failed:`, error.message);
        totalFailed += batch.length;
      }
      
      // Progress update
      const progress = Math.round(((i + batchSize) / messageIds.length) * 100);
      console.log(`📊 Progress: ${Math.min(progress, 100)}% (${totalSuccessful} successful, ${totalFailed} failed)`);
    }
    
    console.log('\\n🎉 Real AI Learning Complete!');
    console.log(`📈 Total processed: ${messageIds.length} emails`);
    console.log(`✅ Successful: ${totalSuccessful}`);
    console.log(`❌ Failed: ${totalFailed}`);
    
    // Check resulting patterns
    const { data: patterns } = await supabase
      .from('email_patterns')
      .select('pattern_type, confidence, pattern_text')
      .eq('user_id', userId)
      .order('confidence', { ascending: false });
    
    if (patterns) {
      console.log(`\\n🎯 Learning Results: ${patterns.length} patterns extracted`);
      patterns.slice(0, 10).forEach((pattern, i) => {
        console.log(`  ${i+1}. ${pattern.pattern_type} (${Math.round(pattern.confidence * 100)}%): ${pattern.pattern_text?.substring(0, 80)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

runRealAILearning();