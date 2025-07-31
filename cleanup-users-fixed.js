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
    // First, get the user IDs using auth API
    console.log('📋 Finding users to delete...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error finding users:', usersError);
      return;
    }
    
    // Filter users by email
    const usersToDeleteData = users.users.filter(user => 
      usersToDelete.includes(user.email)
    );
    
    if (!usersToDeleteData || usersToDeleteData.length === 0) {
      console.log('ℹ️ No users found to delete');
      return;
    }
    
    console.log('👥 Found users:', usersToDeleteData.map(u => u.email));
    const userIds = usersToDeleteData.map(u => u.id);
    
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
    
    // Delete user preferences first (to avoid foreign key constraints)
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
    
    // Now delete organizations (after user_preferences are gone)
    console.log('🗑️ Deleting organizations...');
    const { error: orgsError } = await supabase
      .from('organizations')
      .delete()
      .in('created_by', userIds);
    
    if (orgsError) {
      console.error('❌ Error deleting organizations:', orgsError);
      console.log('⚠️ This might be due to foreign key constraints - continuing with other cleanup');
    } else {
      console.log('✅ Organizations deleted');
    }
    
    // Delete AI profiler data (check correct column name)
    console.log('🗑️ Deleting AI profiler data...');
    try {
      const { error: profilerError } = await supabase
        .from('ai_profiler')
        .delete()
        .in('user_id', userIds);
      
      if (profilerError) {
        console.error('❌ Error deleting AI profiler data:', profilerError);
      } else {
        console.log('✅ AI profiler data deleted');
      }
    } catch (error) {
      console.log('⚠️ AI profiler table might not exist or have different structure');
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
    
    // Try to delete email analysis history (table might not exist)
    console.log('🗑️ Deleting email analysis history...');
    try {
      const { error: historyError } = await supabase
        .from('email_analysis_history')
        .delete()
        .in('user_id', userIds);
      
      if (historyError) {
        console.error('❌ Error deleting email analysis history:', historyError);
      } else {
        console.log('✅ Email analysis history deleted');
      }
    } catch (error) {
      console.log('⚠️ Email analysis history table might not exist');
    }
    
    // Finally, delete the users from auth.users using correct method
    console.log('🗑️ Deleting users from auth.users...');
    for (const userId of userIds) {
      try {
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
        if (deleteUserError) {
          console.error(`❌ Error deleting user ${userId}:`, deleteUserError);
        } else {
          console.log(`✅ User ${userId} deleted`);
        }
      } catch (error) {
        console.error(`❌ Error deleting user ${userId}:`, error);
      }
    }
    
    console.log('🎉 Database cleanup completed!');
    
    // Verify cleanup
    console.log('📊 Verification - Remaining users:');
    const { data: remainingUsersData } = await supabase.auth.admin.listUsers();
    
    if (remainingUsersData && remainingUsersData.users) {
      remainingUsersData.users.slice(0, 10).forEach(user => {
        console.log(`  - ${user.email} (${user.id})`);
      });
    }
    
  } catch (error) {
    console.error('💥 Fatal error during cleanup:', error);
  }
}

// Run the cleanup
cleanupUsers(); 