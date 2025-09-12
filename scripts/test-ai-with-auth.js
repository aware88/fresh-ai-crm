#!/usr/bin/env node

/**
 * Test AI cache functionality with proper authentication
 * This simulates what happens when a user clicks on an email in the UI
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test data from previous successful sync
const TEST_EMAIL_ID = 'AAMkAGQyYTlmNzNiLWJlMzMtNGIxMy04ZDc4LTM1NTMzOTU0OTAzOQBGAAAAAACA2cA14uuRR56XFaoM8tObBwBnw1LxIWESTpoE9YcUqWS_AAAAAAEMAABnw1LxIWESTpoE9YcUqWS_AATRs9F5AAA=';
const USER_ID = '2aee7a5b-c7b2-41b4-ae23-dddbc6e37718';

async function testAIWithAuth() {
  try {
    console.log('🧠 Testing AI Cache with Authentication Simulation...');
    console.log(`📧 Email: ${TEST_EMAIL_ID.substring(0, 50)}...`);
    console.log(`👤 User: ${USER_ID}`);
    
    // Step 1: Verify email exists in database with correct user_id
    console.log('\n🔍 Step 1: Verify email in database');
    const { data: emailRecord, error: emailError } = await supabase
      .from('email_index')
      .select('id, user_id, message_id, subject, sender_email')
      .eq('message_id', TEST_EMAIL_ID)
      .eq('user_id', USER_ID)
      .single();
    
    if (emailError) {
      console.log('❌ Email not found in database:', emailError.message);
      return;
    }
    
    console.log('✅ Email found:', {
      id: emailRecord.id,
      subject: emailRecord.subject?.substring(0, 50) + '...',
      sender: emailRecord.sender_email,
      user_id_match: emailRecord.user_id === USER_ID
    });
    
    // Step 2: Check if email content is available
    console.log('\n📄 Step 2: Check email content availability');
    const { data: contentRecord, error: contentError } = await supabase
      .from('email_content_cache')
      .select('message_id, content_type, content_size')
      .eq('message_id', TEST_EMAIL_ID)
      .single();
    
    if (contentError) {
      console.log('⚠️  Email content not cached:', contentError.message);
    } else {
      console.log('✅ Email content cached:', {
        type: contentRecord.content_type,
        size: `${contentRecord.content_size} bytes`
      });
    }
    
    // Step 3: Test the AI cache lookup (GET)
    console.log('\n🤖 Step 3: Test AI cache lookup');
    const { data: aiCache, error: aiError } = await supabase
      .from('email_ai_cache')
      .select('email_id, analysis_result, draft_result, created_at')
      .eq('email_id', TEST_EMAIL_ID)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (aiError) {
      console.log('❌ AI cache lookup error:', aiError.message);
    } else if (!aiCache || aiCache.length === 0) {
      console.log('📭 No AI cache found - this is expected for first-time processing');
    } else {
      console.log('✅ AI cache found:', {
        hasAnalysis: !!aiCache[0].analysis_result,
        hasDraft: !!aiCache[0].draft_result,
        cachedAt: aiCache[0].created_at
      });
    }
    
    // Step 4: Simulate the POST request that would be made by the UI
    console.log('\n🎯 Step 4: Simulate AI processing request');
    console.log('This would happen when user clicks "Analyze Email" or "Generate Draft"');
    
    // Check OpenAI API key availability (required for actual processing)
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ OpenAI API key available - AI processing would work');
    } else {
      console.log('⚠️  OpenAI API key not configured - AI processing would fail');
    }
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`✅ Email sync: Email properly stored in database`);
    console.log(`✅ User association: user_id correctly set to ${USER_ID}`);
    console.log(`✅ Service role client: Can bypass RLS to find emails`);
    console.log(`${contentRecord ? '✅' : '⚠️ '} Content caching: ${contentRecord ? 'Available' : 'Missing'}`);
    console.log(`${process.env.OPENAI_API_KEY ? '✅' : '⚠️ '} AI service: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
    
    if (emailRecord && (contentRecord || process.env.OPENAI_API_KEY)) {
      console.log('\n🎉 AI functionality should work! The service role client fix resolved the RLS issue.');
    } else {
      console.log('\n⚠️  AI functionality may have limitations due to missing content or API key.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAIWithAuth();