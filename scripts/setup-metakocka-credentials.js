/**
 * Setup Metakocka Credentials Script
 *
 * This script inserts or updates Metakocka credentials for a specific user.
 * Usage: node setup-metakocka-credentials.js <user_email> <company_id> <secret_key>
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Read arguments
const userEmail = process.argv[2];
const companyId = process.argv[3];
const secretKey = process.argv[4];

// Validate input
if (!userEmail || !companyId || !secretKey) {
  console.error('Usage: node setup-metakocka-credentials.js <user_email> <company_id> <secret_key>');
  process.exit(1);
}

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  try {
    console.log(`Setting up Metakocka credentials for user: ${userEmail}`);
    
    // Find the user by email using Supabase Auth API
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1,
      filter: {
        email: userEmail
      }
    });
    
    if (userError || !userData || !userData.users || userData.users.length === 0) {
      console.error(`User not found: ${userEmail}`);
      if (userError) console.error(userError);
      process.exit(1);
    }
    
    const userId = userData.users[0].id;
    console.log(`Found user with ID: ${userId}`);
    
    // Check if credentials already exist for this user
    const { data: existingCreds, error: credError } = await supabase
      .from('metakocka_credentials')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (credError && credError.code !== 'PGRST116') {
      console.error('Error checking existing credentials:', credError);
    }
    
    // Insert or update credentials
    if (existingCreds) {
      console.log('Updating existing credentials...');
      const { error } = await supabase
        .from('metakocka_credentials')
        .update({
          company_id: companyId,
          secret_key: secretKey,
          api_endpoint: 'https://main.metakocka.si/rest/eshop/v1/json/',
          updated_at: new Date().toISOString(),
          is_active: true
        })
        .eq('user_id', userId);
        
      if (error) {
        console.error('Error updating credentials:', error);
        process.exit(1);
      }
      
      console.log('✅ Successfully updated Metakocka credentials');
    } else {
      console.log('Creating new credentials...');
      const { error } = await supabase
        .from('metakocka_credentials')
        .insert({
          user_id: userId,
          company_id: companyId,
          secret_key: secretKey,
          api_endpoint: 'https://main.metakocka.si/rest/eshop/v1/json/',
          is_active: true
        });
        
      if (error) {
        console.error('Error creating credentials:', error);
        process.exit(1);
      }
      
      console.log('✅ Successfully created Metakocka credentials');
    }
    
    // Check if user already has an organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', userId)
      .maybeSingle();
    
    if (orgError) {
      console.error('Error checking organization:', orgError);
      process.exit(1);
    }
    
    let orgId;
    
    if (!orgData) {
      // Create a new organization for Withcar
      console.log('Creating new organization for Withcar...');
      const { data: newOrgData, error: newOrgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Withcar',
          created_by: userId
        })
        .select('id')
        .single();
      
      if (newOrgError || !newOrgData) {
        console.error('Error creating organization:', newOrgError);
        process.exit(1);
      }
      
      orgId = newOrgData.id;
      console.log(`✅ Created new organization with ID: ${orgId}`);
    } else {
      orgId = orgData.id;
      console.log(`Found existing organization with ID: ${orgId}`);
    }
    
    // Enable Metakocka features for the organization
    
    // Now set up the feature flags for the organization
    console.log(`Enabling Metakocka features for organization: ${orgId}`);
      
      const features = [
        'METAKOCKA_INTEGRATION',
        'METAKOCKA_PRODUCT_SYNC',
        'METAKOCKA_CONTACT_SYNC',
        'METAKOCKA_SALES_DOCUMENT_SYNC',
        'METAKOCKA_ORDER_MANAGEMENT'
      ];
      
      for (const feature of features) {
        // Check if feature flag already exists
        const { data: existingFlag, error: flagError } = await supabase
          .from('feature_flags')
          .select('id')
          .eq('organization_id', orgId)
          .eq('feature_key', feature)
          .maybeSingle();
          
        if (flagError) {
          console.error(`Error checking feature flag ${feature}:`, flagError);
          continue;
        }
        
        if (existingFlag) {
          // Update existing flag
          const { error } = await supabase
            .from('feature_flags')
            .update({
              enabled: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingFlag.id);
            
          if (error) {
            console.error(`Error updating feature flag ${feature}:`, error);
          } else {
            console.log(`✅ Updated feature flag: ${feature}`);
          }
        } else {
          // Create new flag
          const { error } = await supabase
            .from('feature_flags')
            .insert({
              organization_id: orgId,
              feature_key: feature,
              enabled: true,
              created_by: userId
            });
            
          if (error) {
            console.error(`Error creating feature flag ${feature}:`, error);
          } else {
            console.log(`✅ Created feature flag: ${feature}`);
          }
        }
      }
    
    console.log('Metakocka setup complete!');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();
