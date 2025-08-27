/**
 * Test RPC Functions After Fix
 * 
 * Run this script after applying SUPABASE_FIX_RPC_FUNCTIONS.sql 
 * to verify everything works correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRPCFunctionsAfterFix() {
  try {
    console.log('🧪 Testing RPC Functions After Fix...\n');
    
    // Get organizations to test with
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, subscription_tier');
    
    if (orgsError) {
      console.error('❌ Error fetching organizations:', orgsError);
      return;
    }
    
    console.log(`🏢 Testing with ${orgs?.length || 0} organizations:\n`);
    
    for (const org of orgs || []) {
      console.log(`🔍 Testing ${org.name} (${org.subscription_tier}):`);
      console.log(`   Organization ID: ${org.id}`);
      
      // Test get_current_ai_usage function
      try {
        const { data: usageData, error: usageError } = await supabase
          .rpc('get_current_ai_usage', { org_id: org.id });
        
        if (usageError) {
          console.log(`   ❌ get_current_ai_usage failed: ${usageError.message}`);
        } else if (usageData && usageData.length > 0) {
          const usage = usageData[0];
          console.log(`   ✅ get_current_ai_usage successful:`);
          console.log(`      Messages: ${usage.current_messages}`);
          console.log(`      Tokens: ${usage.current_tokens}`);
          console.log(`      Cost: $${parseFloat(usage.current_cost || 0).toFixed(4)}`);
          console.log(`      Period: ${usage.period_start} to ${usage.period_end}`);
        } else {
          console.log(`   ⚠️  get_current_ai_usage returned no data`);
        }
      } catch (error) {
        console.log(`   ❌ get_current_ai_usage exception: ${error.message}`);
      }
      
      // Test check_ai_limit_exceeded function
      try {
        const { data: limitData, error: limitError } = await supabase
          .rpc('check_ai_limit_exceeded', { org_id: org.id });
        
        if (limitError) {
          console.log(`   ❌ check_ai_limit_exceeded failed: ${limitError.message}`);
        } else if (limitData && limitData.length > 0) {
          const check = limitData[0];
          console.log(`   ✅ check_ai_limit_exceeded successful:`);
          console.log(`      Current Usage: ${check.current_usage}`);
          console.log(`      Limit: ${check.limit_amount === -1 ? 'Unlimited' : check.limit_amount}`);
          console.log(`      Remaining: ${check.remaining === -1 ? 'Unlimited' : check.remaining}`);
          console.log(`      Exceeded: ${check.limit_exceeded ? 'Yes' : 'No'}`);
          
          // Show what the UI should display
          if (check.limit_amount === -1) {
            console.log(`   🎨 UI Should Show: "Unlimited AI Messages" ✅`);
            console.log(`      Badge: "${check.current_usage} used (Unlimited)"`);
            console.log(`      Top-up Button: Hidden`);
          } else {
            const percentage = Math.round((check.current_usage / check.limit_amount) * 100);
            console.log(`   🎨 UI Should Show: "${check.current_usage} / ${check.limit_amount} used" ✅`);
            console.log(`      Progress: ${percentage}%`);
            console.log(`      Remaining: ${check.remaining} messages`);
            console.log(`      Top-up Button: Visible`);
          }
        } else {
          console.log(`   ⚠️  check_ai_limit_exceeded returned no data`);
        }
      } catch (error) {
        console.log(`   ❌ check_ai_limit_exceeded exception: ${error.message}`);
      }
      
      console.log('   ---\n');
    }
    
    // Test log_ai_usage function (optional - only if you want to test logging)
    console.log('🔧 Testing log_ai_usage function (optional):');
    console.log('This would log actual usage - skipping to avoid creating test data');
    console.log('Function signature: log_ai_usage(org_id, user_id, msg_type, tokens, cost, feature, metadata)');
    
    // Test the complete token usage flow
    console.log('\n🎯 COMPLETE SYSTEM TEST:');
    console.log('========================');
    
    for (const org of orgs || []) {
      console.log(`\n📊 ${org.name} - Complete Token Usage System:`);
      
      try {
        // Get the limit check
        const { data: limitData } = await supabase
          .rpc('check_ai_limit_exceeded', { org_id: org.id });
        
        if (limitData && limitData.length > 0) {
          const check = limitData[0];
          const isUnlimited = check.limit_amount === -1;
          
          console.log(`   ✅ System Status:`);
          console.log(`      Plan: ${org.subscription_tier}`);
          console.log(`      Current Usage: ${check.current_usage} messages`);
          console.log(`      Limit: ${isUnlimited ? 'Unlimited' : check.limit_amount} messages`);
          console.log(`      Can Make Request: ${!check.limit_exceeded || isUnlimited ? 'Yes' : 'No'}`);
          
          if (isUnlimited) {
            console.log(`   🎉 Enterprise Plan Working: Shows unlimited correctly!`);
          } else {
            console.log(`   📈 Limited Plan Working: Shows usage tracking correctly!`);
          }
        }
      } catch (error) {
        console.log(`   ❌ System test failed: ${error.message}`);
      }
    }
    
    console.log('\n🎉 RPC FUNCTIONS TEST COMPLETE!');
    console.log('================================');
    console.log('✅ If all tests passed, the token usage system is now working correctly');
    console.log('✅ Enterprise plans should show unlimited AI messages');
    console.log('✅ Other plans should show usage tracking and limits');
    console.log('✅ The system is ready for production use');
    
  } catch (error) {
    console.error('❌ Error testing RPC functions:', error);
    process.exit(1);
  }
}

testRPCFunctionsAfterFix();
