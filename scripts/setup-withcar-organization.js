/**
 * Withcar Organization Setup Script
 * 
 * This script configures the Withcar organization with proper Metakocka API credentials
 * and sets up automotive-specific settings.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const WITHCAR_SETTINGS = {
  // Organization Details
  organization_name: 'Withcar',
  organization_slug: 'withcar',
  
  // Metakocka API Credentials
  metakocka_company_id: '2889',
  metakocka_api_key: 'd1233595-4309-4ff2-aaf0-5e2b2a191270',
  metakocka_integration_enabled: true,
  
  // Automotive Intelligence Settings
  automotive_matching: {
    enabled: true,
    precision_mode: 'strict',
    vin_decoding: true,
    technical_specs: true,
    quality_assessment: true,
    main_manufacturer: 'Gledring',
    specializes_in: [
      'gumijasti_tepihi',
      'gumi_korito',
      'tekstilne_preproge',
      'stresni_nosilci'
    ]
  },
  
  // Email Processing Configuration
  email_processing: {
    enabled: true,
    classification_confidence: 0.8,
    max_response_tokens: 1000,
    temperature: 0.7,
    delays: {
      customer_service: 300, // 5 minutes
      sales: 0, // immediate
      product_inquiry: 60, // 1 minute
      complaint: 0, // immediate
      general: 600 // 10 minutes
    }
  },
  
  // AI Processing Configuration
  ai_processing: {
    enabled: true,
    model: 'gpt-4o',
    max_tokens: 1000,
    temperature: 0.7,
    system_prompt: `You are a customer service AI for Withcar, a Slovenian automotive accessories company. 
    Withcar specializes in precision-fit automotive accessories, especially Gledring rubber floor mats and trunk liners.
    You are knowledgeable about car-specific products and provide helpful, professional service in multiple languages.
    Focus on exact vehicle compatibility and premium quality products.`,
    response_style: 'professional',
    tone: 'helpful',
    language_detection: true,
    multilanguage: true
  },
  
  // EU Multilanguage Support
  eu_languages: {
    enabled: true,
    supported_languages: [
      'sl', 'en', 'de', 'fr', 'it', 'es', 'hr', 'hu', 'pl', 'cs', 'sk',
      'da', 'sv', 'no', 'fi', 'et', 'lv', 'lt', 'pt', 'ro', 'bg', 'el', 'mt', 'nl'
    ],
    default_language: 'sl',
    auto_detect: true,
    cultural_context: true
  },
  
  // Business Rules
  business_rules: {
    free_shipping_threshold: 2, // 2 items
    return_period_days: 30,
    warranty_period_years: 5,
    business_hours: {
      monday: '08:00-17:00',
      tuesday: '08:00-17:00',
      wednesday: '08:00-17:00',
      thursday: '08:00-17:00',
      friday: '08:00-17:00',
      saturday: '08:00-12:00',
      sunday: 'closed'
    },
    timezone: 'Europe/Ljubljana'
  },
  
  // Upselling Framework
  upselling_framework: {
    enabled: true,
    confidence_threshold: 0.7,
    max_suggestions: 3,
    strategy: 'complementary_products',
    bundles: {
      'floor_mats': ['trunk_liners', 'cargo_barriers'],
      'trunk_liners': ['floor_mats', 'cargo_protection'],
      'roof_racks': ['roof_boxes', 'bike_carriers'],
      'car_covers': ['car_care_products'],
      'seasonal_winter': ['snow_chains', 'winter_mats', 'car_covers'],
      'seasonal_summer': ['sunshades', 'roof_racks', 'bike_carriers']
    }
  },
  
  // Seasonal Recommendations
  seasonal_recommendations: {
    enabled: true,
    weather_based: true,
    maintenance_schedules: true,
    holiday_campaigns: true,
    spring: ['floor_mats', 'trunk_liners', 'car_care'],
    summer: ['sunshades', 'roof_racks', 'bike_carriers'],
    autumn: ['floor_mats', 'trunk_liners', 'car_covers'],
    winter: ['snow_chains', 'winter_mats', 'car_covers']
  },
  
  // Analytics & Monitoring
  analytics: {
    enabled: true,
    interaction_logging: true,
    performance_monitoring: true,
    customer_behavior_analysis: true,
    revenue_tracking: true,
    a_b_testing: true
  },
  
  // Communication Preferences
  communication_preferences: {
    formal_address: true, // Use formal address in Slovenian
    signature: 'Ekipa Withcar',
    contact_info: {
      phone: '01 7508 204',
      email: 'tim.mak88@gmail.com', // Testing email
      website: 'https://www.withcar.si'
    },
    branding: {
      logo_url: 'https://www.withcar.si/skin/frontend/withcar/v2/images/logo-black.png',
      primary_color: '#000000',
      secondary_color: '#ffffff'
    }
  },
  
  // Email Processing Settings
  email_processing_settings: {
    primary_email: 'tim.mak88@gmail.com',
    forwarding_enabled: true,
    auto_response: true,
    testing_mode: true
  }
};

async function main() {
  console.log('🚀 Setting up Withcar organization...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // 1. Generate system user ID (for testing purposes)
    console.log('📋 Step 1: Setting up system user ID...');
    
    // Generate a fixed UUID for testing - this would be a real user ID in production
    const systemUserId = '00000000-0000-0000-0000-000000000001';
    console.log('✅ Using system user ID:', systemUserId);
    
    // 2. Find or create Withcar organization
    console.log('📋 Step 2: Finding or creating Withcar organization...');
    
    let { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('name', 'Withcar')
      .single();
    
    let orgId;
    
         if (orgError && orgError.code === 'PGRST116') {
       // Organization doesn't exist, create it
       console.log('Creating new Withcar organization...');
       
       const { data: newOrgData, error: newOrgError } = await supabase
         .from('organizations')
         .insert({
           name: 'Withcar',
           slug: 'withcar',
           subscription_tier: 'business',
           subscription_status: 'active',
           created_by: systemUserId
         })
         .select('id')
         .single();
      
      if (newOrgError) {
        console.error('❌ Error creating organization:', newOrgError);
        process.exit(1);
      }
      
      orgId = newOrgData.id;
      console.log(`✅ Created new Withcar organization with ID: ${orgId}`);
    } else if (orgError) {
      console.error('❌ Error finding organization:', orgError);
      process.exit(1);
    } else {
      orgId = orgData.id;
      console.log(`✅ Found existing Withcar organization with ID: ${orgId}`);
    }
    
    // 3. Configure organization settings
    console.log('⚙️ Step 3: Configuring organization settings...');
    
    const settingsToInsert = [];
    
    // Flatten the settings object
    function flattenSettings(obj, prefix = '') {
      for (const [key, value] of Object.entries(obj)) {
        const settingKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flattenSettings(value, settingKey);
        } else {
                   settingsToInsert.push({
           organization_id: orgId,
           setting_key: settingKey,
           setting_value: value,
           description: `Withcar setting: ${settingKey}`,
           is_active: true,
           created_by: systemUserId // Using system user ID for settings
         });
        }
      }
    }
    
    flattenSettings(WITHCAR_SETTINGS);
    
    // Clear existing settings and insert new ones
    await supabase
      .from('organization_settings')
      .delete()
      .eq('organization_id', orgId);
    
    const { error: settingsError } = await supabase
      .from('organization_settings')
      .insert(settingsToInsert);
    
    if (settingsError) {
      console.error('❌ Error configuring settings:', settingsError);
      process.exit(1);
    }
    
    console.log(`✅ Configured ${settingsToInsert.length} organization settings`);
    
    // 4. Summary
    console.log('\n🎉 Withcar organization setup complete!');
    console.log('\n📊 Configuration Summary:');
    console.log(`• Organization ID: ${orgId}`);
    console.log(`• Metakocka Company ID: ${WITHCAR_SETTINGS.metakocka_company_id}`);
    console.log(`• Supported Languages: ${WITHCAR_SETTINGS.eu_languages.supported_languages.length}`);
    console.log(`• AI Processing: ${WITHCAR_SETTINGS.ai_processing.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`• Automotive Matching: ${WITHCAR_SETTINGS.automotive_matching.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`• Upselling Framework: ${WITHCAR_SETTINGS.upselling_framework.enabled ? 'Enabled' : 'Disabled'}`);
    console.log(`• Email Processing: ${WITHCAR_SETTINGS.email_processing.enabled ? 'Enabled' : 'Disabled'}`);
    
    console.log('\n📧 Email Delay Configuration:');
    console.log(`• Customer Service: ${WITHCAR_SETTINGS.email_processing.delays.customer_service / 60} minutes`);
    console.log(`• Sales: ${WITHCAR_SETTINGS.email_processing.delays.sales} seconds (immediate)`);
    console.log(`• Product Inquiry: ${WITHCAR_SETTINGS.email_processing.delays.product_inquiry} seconds`);
    console.log(`• Complaints: ${WITHCAR_SETTINGS.email_processing.delays.complaint} seconds (immediate)`);
    console.log(`• General: ${WITHCAR_SETTINGS.email_processing.delays.general / 60} minutes`);
    
    console.log('\n✅ Ready to process Withcar customer emails!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
main().catch(console.error); 