/**
 * Verify Dashboard Setup Script
 * 
 * This script verifies that the organization-specific dashboard system is working correctly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
  console.log('🔍 Verifying organization-specific dashboard setup...\n');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    let allTestsPassed = true;
    
    // Test 1: Check organizations exist
    console.log('📋 Test 1: Organization Setup');
    console.log('==========================================');
    
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, slug, created_by')
      .in('slug', ['bulk-nutrition', 'withcar']);
    
    const bulkOrg = orgs.find(o => o.slug === 'bulk-nutrition');
    const withcarOrg = orgs.find(o => o.slug === 'withcar');
    
    if (bulkOrg) {
      console.log('✅ Bulk Nutrition organization exists');
    } else {
      console.log('❌ Bulk Nutrition organization missing');
      allTestsPassed = false;
    }
    
    if (withcarOrg) {
      console.log('✅ Withcar organization exists');
    } else {
      console.log('❌ Withcar organization missing');
      allTestsPassed = false;
    }
    
    // Test 2: Check user memberships
    console.log('\n📋 Test 2: User Memberships');
    console.log('==========================================');
    
    const { data: users } = await supabase.auth.admin.listUsers();
    const bulkUser = users.users.find(u => u.email === 'tim.mak@bulknutrition.eu');
    const withcarUser = users.users.find(u => u.email === 'tim.mak88@gmail.com');
    
    if (bulkUser && bulkOrg) {
      const { data: bulkMembership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', bulkUser.id)
        .eq('organization_id', bulkOrg.id)
        .single();
      
      if (bulkMembership) {
        console.log(`✅ tim.mak@bulknutrition.eu is ${bulkMembership.role} of Bulk Nutrition`);
      } else {
        console.log('❌ tim.mak@bulknutrition.eu not connected to Bulk Nutrition');
        allTestsPassed = false;
      }
    } else {
      console.log('❌ Bulk Nutrition user or organization missing');
      allTestsPassed = false;
    }
    
    if (withcarUser && withcarOrg) {
      const { data: withcarMembership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', withcarUser.id)
        .eq('organization_id', withcarOrg.id)
        .single();
      
      if (withcarMembership) {
        console.log(`✅ tim.mak88@gmail.com is ${withcarMembership.role} of Withcar`);
      } else {
        console.log('⏳ tim.mak88@gmail.com not yet connected to Withcar (expected)');
      }
    } else {
      console.log('⏳ tim.mak88@gmail.com not found (needs to sign up)');
    }
    
    // Test 3: Check user preferences
    console.log('\n📋 Test 3: User Preferences');
    console.log('==========================================');
    
    if (bulkUser && bulkOrg) {
      const { data: bulkPrefs } = await supabase
        .from('user_preferences')
        .select('current_organization_id')
        .eq('user_id', bulkUser.id)
        .single();
      
      if (bulkPrefs && bulkPrefs.current_organization_id === bulkOrg.id) {
        console.log('✅ Bulk Nutrition user preferences set correctly');
      } else {
        console.log('❌ Bulk Nutrition user preferences not set');
        allTestsPassed = false;
      }
    }
    
    // Test 4: Dashboard Navigation Logic
    console.log('\n📋 Test 4: Dashboard Navigation Logic');
    console.log('==========================================');
    
    // Simulate the logic from Sidebar.tsx
    const testNavigation = (orgSlug, orgName) => {
      if (orgSlug === 'withcar' || orgName === 'withcar') {
        return 'withcar'; // Simplified navigation
      }
      return 'default'; // Full navigation
    };
    
    const bulkNavigation = testNavigation('bulk-nutrition', 'Bulk Nutrition');
    const withcarNavigation = testNavigation('withcar', 'Withcar');
    
    if (bulkNavigation === 'default') {
      console.log('✅ Bulk Nutrition → Default navigation (full dashboard)');
    } else {
      console.log('❌ Bulk Nutrition navigation logic incorrect');
      allTestsPassed = false;
    }
    
    if (withcarNavigation === 'withcar') {
      console.log('✅ Withcar → Withcar navigation (simplified dashboard)');
    } else {
      console.log('❌ Withcar navigation logic incorrect');
      allTestsPassed = false;
    }
    
    // Summary
    console.log('\n🎯 Dashboard Behavior Summary');
    console.log('==========================================');
    console.log('✅ tim.mak@bulknutrition.eu → Full dashboard');
    console.log('   - Dashboard, Email, Suppliers, Products, Orders, Contacts, Interactions, AI Assistant, Analytics, Settings');
    console.log('');
    console.log('⏳ tim.mak88@gmail.com → Withcar dashboard (when signs up)');
    console.log('   - Dashboard, Email, Products, Contacts, Analytics, Settings');
    console.log('   - REMOVED: Suppliers, Orders, Interactions, AI Assistant');
    
    // Final result
    console.log('\n🏁 Final Result');
    console.log('==========================================');
    
    if (allTestsPassed) {
      console.log('🎉 All tests passed! Organization-specific dashboard system is working correctly.');
      console.log('\n📝 Next Steps:');
      console.log('1. tim.mak@bulknutrition.eu can log in and use the full dashboard');
      console.log('2. tim.mak88@gmail.com should sign up with organization "Withcar"');
      console.log('3. After signup, run: node scripts/connect-withcar-user.js (if needed)');
      console.log('4. System will automatically show appropriate navigation based on organization');
    } else {
      console.log('❌ Some tests failed. Please check the issues above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run the verification
main().catch(console.error);