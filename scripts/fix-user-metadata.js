#!/usr/bin/env node

/**
 * Fix User Metadata - Remove hardcoded "Zarfin" names
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

class UserMetadataFixer {
  async run() {
    console.log('🔍 Checking for users with "Zarfin" metadata...\n');

    try {
      // List all auth users to see current state
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error listing users:', listError);
        return;
      }

      console.log(`📊 Found ${users.length} total users\n`);

      // Find users with Zarfin in metadata
      const zarfinUsers = users.filter(user => 
        user.user_metadata?.full_name === 'Zarfin' ||
        user.user_metadata?.name === 'Zarfin' ||
        user.user_metadata?.first_name === 'Zarfin'
      );

      if (zarfinUsers.length === 0) {
        console.log('✅ No users found with "Zarfin" metadata');
        return;
      }

      console.log(`🎯 Found ${zarfinUsers.length} users with "Zarfin" metadata:\n`);
      
      zarfinUsers.forEach((user, index) => {
        console.log(`${index + 1}. 📧 ${user.email}`);
        console.log(`   🆔 ID: ${user.id}`);
        console.log(`   📝 Metadata:`, JSON.stringify(user.user_metadata, null, 2));
        console.log('');
      });

      // Ask for confirmation before making changes
      console.log('⚠️  About to clear "Zarfin" from user metadata');
      console.log('   This will reset user names to empty/default values');
      console.log('   Users can set their own names in Settings > Profile\n');

      // Update each user's metadata to remove "Zarfin"
      for (const user of zarfinUsers) {
        console.log(`🔧 Updating user: ${user.email}`);
        
        // Create updated metadata without "Zarfin" references
        const updatedMetadata = { ...user.user_metadata };
        
        // Clear any Zarfin references
        if (updatedMetadata.full_name === 'Zarfin') {
          delete updatedMetadata.full_name;
        }
        if (updatedMetadata.name === 'Zarfin') {
          delete updatedMetadata.name;
        }
        if (updatedMetadata.first_name === 'Zarfin') {
          delete updatedMetadata.first_name;
        }

        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { user_metadata: updatedMetadata }
        );

        if (updateError) {
          console.error(`   ❌ Failed to update ${user.email}:`, updateError);
        } else {
          console.log(`   ✅ Updated ${user.email}`);
        }
      }

      console.log('\n🎉 User metadata cleanup complete!');
      console.log('📝 Users can now set their own names in Settings > Profile');

    } catch (error) {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Run the fixer
const fixer = new UserMetadataFixer();
fixer.run().catch(console.error);