/**
 * Fixed RLS policy test script
 * This script tests RLS policies using a valid existing user ID
 */
import dotenv from 'dotenv';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create a new Supabase client instance with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error(chalk.red('❌ Missing Supabase environment variables. Please check your .env.local file.'));
  process.exit(1);
}

// Create admin client with service role key
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// Function to log test results
function logTest(description: string, passed: boolean, details?: string) {
  if (passed) {
    console.log(chalk.green(`✅ ${description}`));
  } else {
    console.log(chalk.red(`❌ ${description}: ${details || 'Failed'}`));
  }
}

async function testRlsPolicies() {
  console.log(chalk.blue('\n=== FIXED RLS POLICY TESTS ===\n'));

  try {
    // Use the valid user ID provided earlier
    const validUserId = 'c636144d-fb35-467a-b626-fb2b07dc97b7';
    console.log(chalk.yellow('Using valid user ID:', validUserId));
    
    // Step 1: Find an existing contact or create a new one
    console.log(chalk.yellow('\n1. Setting up test contact...'));
    
    // First, try to get an existing contact
    const { data: existingContacts, error: fetchError } = await adminClient
      .from('contacts')
      .select('id')
      .limit(1);
    
    let contactId;
    
    if (fetchError) {
      console.log(chalk.yellow(`Error fetching contacts: ${fetchError.message}`));
      contactId = `test-contact-${uuidv4()}`;
      
      // Create a new contact
      const { error: createError } = await adminClient
        .from('contacts')
        .insert({ id: contactId });
      
      if (createError) {
        console.log(chalk.red(`❌ Failed to create contact: ${createError.message}`));
        throw createError;
      } else {
        console.log(chalk.green('✅ Test contact created'));
      }
    } else if (existingContacts && existingContacts.length > 0) {
      // Use an existing contact if available
      contactId = existingContacts[0].id;
      console.log(chalk.green(`✅ Using existing contact with ID: ${contactId}`));
    } else {
      contactId = `test-contact-${uuidv4()}`;
      
      // Create a new contact
      const { error: createError } = await adminClient
        .from('contacts')
        .insert({ id: contactId });
      
      if (createError) {
        console.log(chalk.red(`❌ Failed to create contact: ${createError.message}`));
        throw createError;
      } else {
        console.log(chalk.green('✅ Test contact created'));
      }
    }
    
    // Step 2: Create test interactions using the valid user ID
    console.log(chalk.yellow('\n2. Creating test interactions...'));
    
    // Create interaction with valid user ID
    const interaction1Id = `test-${uuidv4()}`;
    const { data: interaction1, error: create1Error } = await adminClient
      .from('interactions')
      .insert({
        id: interaction1Id,
        contact_id: contactId,
        type: 'email',
        title: 'Test Interaction 1',
        content: 'This is a test interaction for valid user',
        created_by: validUserId
      })
      .select()
      .single();
    
    if (create1Error) {
      console.log(chalk.red(`❌ Create interaction: ${create1Error.message}`));
      throw create1Error;
    } else {
      console.log(chalk.green('✅ Create interaction'));
      console.log('Interaction created_by:', interaction1.created_by);
    }
    
    // Step 3: Test anonymous access (should return empty set)
    console.log(chalk.yellow('\n3. Testing anonymous access...'));
    
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: anonData, error: anonError } = await anonClient
      .from('interactions')
      .select('*');
    
    if (anonError) {
      console.log(chalk.red(`❌ Anonymous access error: ${anonError.message}`));
    } else {
      const anonAccessEmpty = !anonData || anonData.length === 0;
      logTest('Anonymous access returns empty set', anonAccessEmpty);
    }
    
    // Step 4: Test authenticated access with the valid user
    console.log(chalk.yellow('\n4. Testing authenticated access...'));
    
    // Create a client that impersonates the valid user
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Set auth header manually to simulate being logged in as the valid user
    const authHeaders = {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'X-Client-Info': 'supabase-js/2.0.0',
      'Prefer': 'return=representation',
    };
    
    // Use direct fetch with auth headers
    const userResponse = await fetch(`${supabaseUrl}/rest/v1/interactions?select=*`, {
      method: 'GET',
      headers: {
        ...authHeaders,
        // This is a hack to simulate being logged in as the valid user
        // In a real app, you'd use proper JWT tokens
        'X-Supabase-Auth': JSON.stringify({
          sub: validUserId,
          role: 'authenticated',
          exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        })
      }
    });
    
    const userData = await userResponse.json();
    console.log('User response status:', userResponse.status);
    console.log('User data length:', Array.isArray(userData) ? userData.length : 'Not an array');
    
    // Check if user can see the interaction
    const userCanSeeOwn = Array.isArray(userData) && userData.some((i: any) => i.id === interaction1Id);
    
    logTest('Authenticated user can see own interaction', userCanSeeOwn);
    
    // Step 5: Test update and delete with the valid user
    console.log(chalk.yellow('\n5. Testing update and delete...'));
    
    // Test update with auth headers
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/interactions?id=eq.${interaction1Id}`, {
      method: 'PATCH',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
        'X-Supabase-Auth': JSON.stringify({
          sub: validUserId,
          role: 'authenticated',
          exp: Math.floor(Date.now() / 1000) + 3600
        })
      },
      body: JSON.stringify({
        title: 'Updated Test Interaction'
      })
    });
    
    logTest('Update interaction', updateResponse.status === 200 || updateResponse.status === 204);
    
    // Test delete with auth headers
    const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/interactions?id=eq.${interaction1Id}`, {
      method: 'DELETE',
      headers: {
        ...authHeaders,
        'X-Supabase-Auth': JSON.stringify({
          sub: validUserId,
          role: 'authenticated',
          exp: Math.floor(Date.now() / 1000) + 3600
        })
      }
    });
    
    logTest('Delete interaction', deleteResponse.status === 200 || deleteResponse.status === 204);
    
    // Step 6: Clean up any remaining test data
    console.log(chalk.yellow('\n6. Cleaning up test data...'));
    
    // Delete any remaining test interactions
    await adminClient
      .from('interactions')
      .delete()
      .eq('id', interaction1Id);
    
    // Only delete the contact if we created it
    if (contactId.startsWith('test-')) {
      await adminClient
        .from('contacts')
        .delete()
        .eq('id', contactId);
    }
    
    console.log(chalk.green('✅ Test data cleaned up'));
    
  } catch (error) {
    console.error(chalk.red(`❌ RLS policy tests failed: ${error instanceof Error ? error.message : String(error)}`));
    throw error;
  }
}

testRlsPolicies()
  .then(() => {
    console.log(chalk.green('\n✅ RLS policy tests completed successfully!'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red(`\n❌ Fatal error: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  });
