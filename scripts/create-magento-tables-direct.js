#!/usr/bin/env node

/**
 * Create Magento Tables Directly
 * 
 * This script creates the Magento tables directly using individual queries
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Supabase configuration from environment or defaults
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ehhaeqmwolhnwylnqdto.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure SUPABASE_SERVICE_ROLE_KEY is set');
  console.error('URL:', SUPABASE_URL);
  process.exit(1);
}

async function createMagentoTables() {
  console.log('🔧 Creating Magento Integration Tables...');
  console.log('🌐 Supabase URL:', SUPABASE_URL);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Test connection first
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message);
      process.exit(1);
    }
    
    console.log('✅ Supabase connection successful');

    // Create magento_connection_settings table
    console.log('📋 Creating magento_connection_settings table...');
    
    const createConnectionSettingsQuery = `
      CREATE TABLE IF NOT EXISTS magento_connection_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        api_url TEXT NOT NULL,
        api_key TEXT NOT NULL,
        api_user TEXT NOT NULL,
        store_id TEXT DEFAULT 'default',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id)
      );
    `;

    const { error: createError1 } = await supabase.rpc('exec', {
      sql: createConnectionSettingsQuery
    });

    if (createError1) {
      console.error('❌ Error creating connection settings table:', createError1.message);
    } else {
      console.log('✅ magento_connection_settings table created');
    }

    // Create magento_data_cache table
    console.log('📋 Creating magento_data_cache table...');
    
    const createCacheQuery = `
      CREATE TABLE IF NOT EXISTS magento_data_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        cache_key TEXT NOT NULL,
        cache_data JSONB NOT NULL,
        cache_type TEXT NOT NULL DEFAULT 'orders',
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(organization_id, cache_key)
      );
    `;

    const { error: createError2 } = await supabase.rpc('exec', {
      sql: createCacheQuery
    });

    if (createError2) {
      console.error('❌ Error creating cache table:', createError2.message);
    } else {
      console.log('✅ magento_data_cache table created');
    }

    // Enable RLS on both tables
    console.log('🔒 Enabling Row Level Security...');
    
    const enableRLSQueries = [
      'ALTER TABLE magento_connection_settings ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE magento_data_cache ENABLE ROW LEVEL SECURITY;'
    ];

    for (const query of enableRLSQueries) {
      const { error } = await supabase.rpc('exec', { sql: query });
      if (error) {
        console.log(`⚠️  RLS enable warning: ${error.message}`);
      }
    }

    // Find Withcar organization and insert configuration
    console.log('🔍 Looking for Withcar organization...');
    
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .ilike('name', '%withcar%')
      .limit(1)
      .single();

    if (orgError) {
      console.log('⚠️  Could not find Withcar organization:', orgError.message);
      console.log('📝 You can manually insert the configuration later');
    } else {
      console.log(`✅ Found Withcar organization: ${orgData.name} (${orgData.id})`);
      
      // Insert Magento configuration
      console.log('⚙️  Inserting Magento configuration...');
      
      const { error: insertError } = await supabase
        .from('magento_connection_settings')
        .upsert({
          organization_id: orgData.id,
          api_url: 'https://withcar.si/urednik',
          api_key: '4M40bZ&88w^1',
          api_user: 'tim',
          store_id: 'default',
          is_active: true
        }, {
          onConflict: 'organization_id'
        });

      if (insertError) {
        console.error('❌ Error inserting Magento configuration:', insertError.message);
      } else {
        console.log('✅ Magento configuration inserted successfully');
      }
    }

    console.log('\n🎉 Magento integration setup completed!');
    console.log('\n📋 Configuration Summary:');
    console.log('   API URL: https://withcar.si/urednik');
    console.log('   API User: tim');
    console.log('   API Key: 4M40bZ&88w^1');
    console.log('\n🧪 Next: Test the connection using the API endpoint');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
createMagentoTables();


