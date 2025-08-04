/**
 * Fix Withcar User Preferences Script
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
  console.log('🔧 Fixing Withcar user preferences...');
  
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
    // Get the Withcar user and organization
    const { data: users } = await supabase.auth.admin.listUsers();
    const withcarUser = users.users.find(u => u.email === 'tim.mak88@gmail.com');
    
    const { data: withcarOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'withcar')
      .single();
    
    if (withcarUser && withcarOrg) {
      // Update existing user preferences
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({
          current_organization_id: withcarOrg.id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', withcarUser.id);
      
      if (updateError) {
        console.error('❌ Error updating user preferences:', updateError);
      } else {
        console.log('✅ Updated user preferences for tim.mak88@gmail.com');
      }
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);