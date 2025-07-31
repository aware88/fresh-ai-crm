const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client with service role (admin privileges)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function cleanupUsers() {
  console.log('🧹 Starting database cleanup...');
  
  const usersToDelete = [
    'tim.mak88@gmail.com',
    'test@example.com', 
    'tim.mak@bulknutrition.eu'
  ];
  
  try {
    // First, get the user IDs
    console.log('📋 Finding users to delete...');
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .in('email', usersToDelete);
    
    if (usersError) {
      console.error('❌ Error finding users:', usersError);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('ℹ️ No users found to delete');
      return;
    }
    
    console.log('👥 Found users:', users.map(u => u.email));
    const userIds = users.map(u => u.id);
    
    // Delete organization members
    console.log('🗑️ Deleting organization members...');
    const { error: membersError } = await supabase
      .from('organization_members')
      .delete()
      .in('user_id', userIds);
    
    if (membersError) {
      console.error('❌ Error deleting organization members:', membersError);
    } else {
      console.log('✅ Organization members deleted');
    }
    
    // Delete organizations created by these users
    console.log('🗑️ Deleting organizations...');
    const { error: orgsError } = await supabase
      .from('organizations')
      .delete()
      .in('created_by', userIds);
    
    if (orgsError) {
      console.error('❌ Error deleting organizations:', orgsError);
    } else {
      console.log('✅ Organizations deleted');
    }
    
    // Delete user preferences
    console.log('🗑️ Deleting user preferences...');
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .delete()
      .in('user_id', userIds);
    
    if (prefsError) {
      console.error('❌ Error deleting user preferences:', prefsError);
    } else {
      console.log('✅ User preferences deleted');
    }
    
    // Delete AI profiler data
    console.log('🗑️ Deleting AI profiler data...');
    const { error: profilerError } = await supabase
      .from('ai_profiler')
      .delete()
      .in('user_id', userIds);
    
    if (profilerError) {
      console.error('❌ Error deleting AI profiler data:', profilerError);
    } else {
      console.log('✅ AI profiler data deleted');
    }
    
    // Delete contacts
    console.log('🗑️ Deleting contacts...');
    const { error: contactsError } = await supabase
      .from('contacts')
      .delete()
      .in('user_id', userIds);
    
    if (contactsError) {
      console.error('❌ Error deleting contacts:', contactsError);
    } else {
      console.log('✅ Contacts deleted');
    }
    
    // Delete email accounts
    console.log('🗑️ Deleting email accounts...');
    const { error: emailAccountsError } = await supabase
      .from('email_accounts')
      .delete()
      .in('user_id', userIds);
    
    if (emailAccountsError) {
      console.error('❌ Error deleting email accounts:', emailAccountsError);
    } else {
      console.log('✅ Email accounts deleted');
    }
    
    // Delete email analysis history
    console.log('🗑️ Deleting email analysis history...');
    const { error: historyError } = await supabase
      .from('email_analysis_history')
      .delete()
      .in('user_id', userIds);
    
    if (historyError) {
      console.error('❌ Error deleting email analysis history:', historyError);
    } else {
      console.log('✅ Email analysis history deleted');
    }
    
    // Finally, delete the users from auth.users
    console.log('🗑️ Deleting users from auth.users...');
    const { error: deleteUsersError } = await supabase.auth.admin.deleteUsers(userIds);
    
    if (deleteUsersError) {
      console.error('❌ Error deleting users:', deleteUsersError);
    } else {
      console.log('✅ Users deleted from auth.users');
    }
    
    console.log('🎉 Database cleanup completed successfully!');
    
    // Verify cleanup
    console.log('📊 Verification - Remaining users:');
    const { data: remainingUsers } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (remainingUsers) {
      remainingUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.id})`);
      });
    }
    
  } catch (error) {
    console.error('💥 Fatal error during cleanup:', error);
  }
}

// Run the cleanup
cleanupUsers(); 