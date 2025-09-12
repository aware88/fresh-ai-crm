#!/usr/bin/env node

/**
 * Test Withcar Branding API Response
 */

const { promises: fs } = require('fs');
const path = require('path');

async function testWithcarBranding() {
  console.log('🎨 Testing Withcar branding data...\n');

  try {
    // Withcar organization ID
    const organizationId = '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
    
    // Check if branding file exists
    const brandingDir = path.join(process.cwd(), 'data', 'branding');
    const brandingFile = path.join(brandingDir, `${organizationId}.json`);
    
    console.log('📁 Checking branding file:', brandingFile);
    
    try {
      const brandingData = await fs.readFile(brandingFile, 'utf8');
      const existingBranding = JSON.parse(brandingData);
      
      console.log('✅ Branding file found!');
      console.log('📋 Branding data:');
      console.log(JSON.stringify(existingBranding, null, 2));
      
      console.log('\n🎨 Color values:');
      console.log(`Primary: ${existingBranding.primary_color}`);
      console.log(`Secondary: ${existingBranding.secondary_color}`);
      console.log(`Accent: ${existingBranding.accent_color}`);
      
    } catch (fileError) {
      console.log('❌ Branding file not found or invalid');
      console.error('Error:', fileError.message);
    }

    // Test what the API should return
    console.log('\n🔧 API would return:');
    console.log('{ "branding": ' + JSON.stringify({
      "id": "branding_577485fb-50b4-4bb2-a4c6-54b97e1545ad",
      "organization_id": "577485fb-50b4-4bb2-a4c6-54b97e1545ad",
      "primary_color": "#ea580c",
      "secondary_color": "#fb923c",
      "accent_color": "#ea580c",
      "organization_name": "Withcar",
      "logo_url": "/uploads/logos/logo-ab599c78-40f6-42bf-b8d1-1a89c08dee39.png"
    }, null, 2) + ' }');

    // Check what the frontend expects
    console.log('\n🖥️ Frontend expects data.branding to have:');
    console.log('- primary_color: string');
    console.log('- secondary_color: string');
    console.log('- accent_color: string');

  } catch (error) {
    console.error('❌ Error testing branding:', error);
  }
}

testWithcarBranding();