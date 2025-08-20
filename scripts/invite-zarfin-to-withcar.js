#!/usr/bin/env node

/**
 * Invite Zarfin to WithCar Organization
 * 
 * This script directly invites zarfin.jakupovic@withcar.si to the WithCar organization
 * bypassing the UI issues and sending the invitation email directly.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class ZarfinInviter {
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
    console.log('👤 ZARFIN WITHCAR INVITATION');
    console.log('═'.repeat(30));
    console.log();
    console.log(`📧 Inviting: ${this.zarfinEmail}`);
    console.log(`🏢 To Organization: WithCar (${this.withcarOrgId})`);
    console.log();

    try {
      // Step 1: Check if user already exists
      await this.checkExistingUser();
      
      // Step 2: Verify subscription allows new users
      await this.verifySubscription();
      
      // Step 3: Send invitation
      await this.sendInvitation();
      
      // Step 4: Add to organization
      await this.addToOrganization();
      
      console.log('✅ Invitation sent successfully!');
      console.log();
      console.log('📬 What happens next:');
      console.log('1. Zarfin will receive an invitation email');
      console.log('2. He clicks the link in the email');
      console.log('3. He sets up his password');
      console.log('4. He can then connect his Microsoft account for email access');
      console.log();
      console.log('🔗 After Zarfin signs up, you can use his account to connect:');
      console.log('   Settings > Email Accounts > Connect Microsoft Account');
      console.log(`   Login with: ${this.zarfinEmail}`);
      
    } catch (error) {
      console.error('❌ Invitation failed:', error.message);
      process.exit(1);
    }
  }

  async checkExistingUser() {
    console.log('🔍 Step 1: Checking if user already exists...');
    
    // Check if user exists in auth
    const { data: authUsers, error } = await this.supabase.auth.admin.listUsers();
    
    if (error) {
      throw new Error(`Failed to check existing users: ${error.message}`);
    }

    const existingUser = authUsers.users?.find(u => u.email === this.zarfinEmail);
    
    if (existingUser) {
      console.log(`✅ User already exists: ${existingUser.id}`);
      this.existingUserId = existingUser.id;
      
      // Check if already member of organization
      const { data: membership, error: memberError } = await this.supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', this.withcarOrgId)
        .eq('user_id', existingUser.id)
        .single();
      
      if (membership && !memberError) {
        console.log('⚠️  User is already a member of WithCar organization');
        console.log('   No invitation needed - user can login directly');
        return;
      }
    } else {
      console.log('📝 User does not exist yet - will create new account');
    }
    
    console.log();
  }

  async verifySubscription() {
    console.log('💳 Step 2: Verifying subscription allows new users...');
    
    // Check current subscription
    const { data: subscription, error } = await this.supabase
      .from('organization_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('organization_id', this.withcarOrgId)
      .eq('status', 'active')
      .single();
    
    if (error || !subscription) {
      throw new Error('No active subscription found for WithCar organization');
    }

    console.log(`✅ Active subscription: ${subscription.subscription_plans.name}`);
    console.log(`   Features: ${JSON.stringify(subscription.subscription_plans.features)}`);
    
    // Check user count
    const { count: currentUserCount } = await this.supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', this.withcarOrgId);
    
    console.log(`👥 Current users: ${currentUserCount}`);
    
    // Premium Enterprise should allow unlimited users
    if (subscription.subscription_plans.features?.MAX_USERS === -1) {
      console.log('✅ Unlimited users allowed');
    } else {
      console.log('⚠️  User limit may apply');
    }
    
    console.log();
  }

  async sendInvitation() {
    console.log('📧 Step 3: Sending invitation...');
    
    if (this.existingUserId) {
      console.log('✅ User already exists - skipping invitation email');
      return;
    }

    // Send invitation email with proper redirect URL
    const { data: newUser, error } = await this.supabase.auth.admin.inviteUserByEmail(
      this.zarfinEmail,
      {
        redirectTo: 'https://app.helloaris.com/auth/invitation-accept',
        data: {
          first_name: 'Zarfin',
          last_name: 'Jakupovic',
          organization: 'WithCar'
        }
      }
    );
    
    if (error) {
      throw new Error(`Failed to send invitation: ${error.message}`);
    }

    console.log(`✅ Invitation sent to ${this.zarfinEmail}`);
    console.log(`   User ID: ${newUser.user.id}`);
    this.newUserId = newUser.user.id;
    
    console.log();
  }

  async addToOrganization() {
    console.log('🏢 Step 4: Adding user to WithCar organization...');
    
    const userId = this.existingUserId || this.newUserId;
    
    if (!userId) {
      throw new Error('No user ID available');
    }

    // Add user to organization_members
    const { error } = await this.supabase
      .from('organization_members')
      .insert({
        organization_id: this.withcarOrgId,
        user_id: userId,
        role: 'admin', // Make Zarfin an admin so he can help with setup
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      // Check if it's a duplicate key error (user already member)
      if (error.code === '23505') {
        console.log('✅ User is already a member of the organization');
      } else {
        throw new Error(`Failed to add user to organization: ${error.message}`);
      }
    } else {
      console.log('✅ User added to WithCar organization as admin');
    }
    
    // Update user preferences to set WithCar as current organization
    const { error: prefsError } = await this.supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        current_organization_id: this.withcarOrgId,
        updated_at: new Date().toISOString()
      });
    
    if (prefsError) {
      console.log('⚠️  Could not update user preferences (this is ok)');
    } else {
      console.log('✅ Set WithCar as default organization for user');
    }
    
    console.log();
  }
}

// Run the inviter
async function main() {
  const inviter = new ZarfinInviter();
  await inviter.run();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ZarfinInviter;




