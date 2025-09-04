#!/usr/bin/env node

/**
 * Script to fix RLS policies for email tables
 * This handles the mismatch between NextAuth and Supabase Auth
 */

require('dotenv').config({ path: '.env.local' });

async function fixEmailRLS() {
  const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  console.log('🔧 Fixing Email RLS Policies...');
  console.log(`📍 API URL: ${apiUrl}`);
  
  try {
    // First, get the current status
    console.log('\n📊 Getting current RLS status...');
    const statusResponse = await fetch(`${apiUrl}/api/fix-email-rls`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('Current policies:', JSON.stringify(status.policies, null, 2));
      console.log('RLS Status:', JSON.stringify(status.rlsStatus, null, 2));
    } else {
      console.log('⚠️  Could not get current status - API may require authentication');
      console.log('Note: This script needs to be run while the Next.js server is running');
      console.log('You may need to manually authenticate in the browser first');
    }

    // Now apply the fix
    console.log('\n🚀 Applying RLS fix...');
    const response = await fetch(`${apiUrl}/api/fix-email-rls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ RLS policies fixed successfully!');
      console.log('\n📋 New policies:');
      if (result.policies) {
        result.policies.forEach((policy) => {
          console.log(`  - ${policy.tablename}: ${policy.policyname} (${policy.cmd})`);
        });
      }
      console.log('\n⚠️  Important:', result.note);
    } else {
      console.error('❌ Failed to fix RLS policies:', result.error);
      if (result.details) {
        console.error('Details:', result.details);
      }
      console.log('\n💡 Note: Make sure you are authenticated in the browser and the Next.js server is running');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tips:');
    console.log('1. Make sure the Next.js server is running (npm run dev)');
    console.log('2. Make sure you are logged in to the application');
    console.log('3. Try accessing the API directly in the browser first');
  }
}

// Run the script
fixEmailRLS().catch(console.error);
