#!/usr/bin/env node

/**
 * Resend Zarfin Invitation with Proper Redirect
 * 
 * This script resends the invitation to zarfin.jakupovic@withcar.si
 * with the correct redirect URL to fix the invitation acceptance flow.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class ZarfinInvitationResender {
  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Please check your .env file.');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    this.zarfinEmail = 'zarfin.jakupovic@withcar.si';
    this.withcarOrgId = '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
  }

  async run() {
    console.log('📧 RESENDING ZARFIN INVITATION');
    console.log('═'.repeat(35));
    console.log();
    console.log(`📬 Email: ${this.zarfinEmail}`);
    console.log(`🔗 Fixed Redirect: https://app.helloaris.com/auth/invitation-accept`);
    console.log();

    try {
      // Step 1: Check current user status
      await this.checkCurrentUserStatus();
      
      // Step 2: Delete the existing user if needed (to resend invitation)
      await this.handleExistingUser();
      
      // Step 3: Send new invitation with correct redirect
      await this.sendNewInvitation();
      
      // Step 4: Add to organization (if needed)
      await this.ensureOrganizationMembership();
      
      console.log('✅ Invitation resent successfully!');
      console.log();
      console.log('📬 What Zarfin should do now:');
      console.log('1. Check his email for the NEW invitation');
      console.log('2. Click the invitation link');
      console.log('3. He will be taken to the proper account setup page');
      console.log('4. Set his password and complete account setup');
      console.log('5. Sign in with his new credentials');
      
    } catch (error) {
      console.error('❌ Resend failed:', error.message);
      process.exit(1);
    }
  }

  async checkCurrentUserStatus() {
    console.log('🔍 Step 1: Checking current user status...');
    
    // Check if user exists in auth
    const { data: authUsers, error } = await this.supabase.auth.admin.listUsers();
    
    if (error) {
      throw new Error(`Failed to check existing users: ${error.message}`);
    }

    const existingUser = authUsers.users?.find(u => u.email === this.zarfinEmail);
    
    if (existingUser) {
      console.log(`📋 User Status:`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Email Confirmed: ${existingUser.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Created: ${existingUser.created_at}`);
      console.log(`   Last Sign In: ${existingUser.last_sign_in_at || 'Never'}`);
      
      this.existingUser = existingUser;
    } else {
      console.log('📭 No existing user found');
    }
    
    console.log();
  }

  async handleExistingUser() {
    if (!this.existingUser) {
      console.log('✅ No existing user - ready to send fresh invitation');
      return;
    }

    console.log('🔄 Step 2: Handling existing user...');
    
    // If user hasn't confirmed email, we can delete and recreate
    if (!this.existingUser.email_confirmed_at) {
      console.log('🗑️  Deleting unconfirmed user to resend invitation...');
      
      const { error } = await this.supabase.auth.admin.deleteUser(this.existingUser.id);
      
      if (error) {
        console.error('❌ Error deleting user:', error);
        console.log('⚠️  Will try to resend invitation to existing user instead');
      } else {
        console.log('✅ Unconfirmed user deleted successfully');
        this.existingUser = null; // Reset so we create fresh invitation
      }
    } else {
      console.log('⚠️  User already confirmed - will resend invitation to existing account');
    }
    
    console.log();
  }

  async sendNewInvitation() {
    console.log('📧 Step 3: Sending new invitation...');
    
    try {
      // Send invitation email with proper redirect URL
      const { data: newUser, error } = await this.supabase.auth.admin.inviteUserByEmail(
        this.zarfinEmail,
        {
          redirectTo: 'https://app.helloaris.com/auth/invitation-accept',
          data: {
            first_name: 'Zarfin',
            last_name: 'Jakupovic',
            organization: 'WithCar',
            invited_by: 'CRM Admin',
            invitation_resent: true
          }
        }
      );
      
      if (error) {
        throw new Error(`Failed to send invitation: ${error.message}`);
      }

      console.log(`✅ New invitation sent to ${this.zarfinEmail}`);
      console.log(`   User ID: ${newUser.user.id}`);
      console.log(`   Redirect URL: https://app.helloaris.com/auth/invitation-accept`);
      
      this.newUserId = newUser.user.id;
      
    } catch (error) {
      // If invitation fails because user exists, that's okay
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        console.log('✅ User already exists - invitation email should still be sent');
        
        // Get the existing user ID
        if (this.existingUser) {
          this.newUserId = this.existingUser.id;
        }
      } else {
        throw error;
      }
    }
    
    console.log();
  }

  async ensureOrganizationMembership() {
    console.log('🏢 Step 4: Ensuring organization membership...');
    
    const userId = this.newUserId || this.existingUser?.id;
    
    if (!userId) {
      console.log('⚠️  No user ID available - skipping organization membership');
      return;
    }

    // Check if user is already a member
    const { data: existingMembership, error: checkError } = await this.supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', this.withcarOrgId)
      .eq('user_id', userId)
      .single();
    
    if (existingMembership && !checkError) {
      console.log('✅ User is already a member of WithCar organization');
      return;
    }

    // Add user to organization
    const { error } = await this.supabase
      .from('organization_members')
      .insert({
        organization_id: this.withcarOrgId,
        user_id: userId,
        role: 'admin', // Make Zarfin an admin
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      if (error.code === '23505') {
        console.log('✅ User is already a member of the organization');
      } else {
        console.error('❌ Error adding user to organization:', error);
      }
    } else {
      console.log('✅ User added to WithCar organization as admin');
    }
    
    console.log();
  }
}

// Run the resender
async function main() {
  const resender = new ZarfinInvitationResender();
  await resender.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ZarfinInvitationResender;
