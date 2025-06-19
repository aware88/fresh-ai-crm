/**
 * Improved RLS policy test script
 * This script tests RLS policies with better authentication handling
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
  console.log(chalk.blue('\n=== IMPROVED RLS POLICY TESTS ===\n'));

  try {
    // Generate test IDs
    const testUser1Id = uuidv4();
    const testUser2Id = uuidv4();
    const testContactId = `test-contact-${uuidv4()}`;
    
    console.log(chalk.yellow('Test User 1 ID:', testUser1Id));
    console.log(chalk.yellow('Test User 2 ID:', testUser2Id));

    // Step 1: Find an existing contact or create a new one
    console.log(chalk.yellow('\n1. Setting up test contact...'));
    
    // First, try to get an existing contact
    const { data: existingContacts, error: fetchError } = await adminClient
      .from('contacts')
      .select('id')
      .limit(1);
    
    let contactId = testContactId;
    
    if (fetchError) {
      console.log(chalk.yellow(`Error fetching contacts: ${fetchError.message}`));
    } else if (existingContacts && existingContacts.length > 0) {
      // Use an existing contact if available
      contactId = existingContacts[0].id;
      console.log(chalk.green(`✅ Using existing contact with ID: ${contactId}`));
    } else {
      // Create a new contact if none exist
      const { data: newContact, error: createError } = await adminClient
        .from('contacts')
        .insert({ id: contactId })
        .select()
        .single();
      
      if (createError) {
        console.log(chalk.red(`❌ Failed to create contact: ${createError.message}`));
        throw createError;
      } else {
        console.log(chalk.green('✅ Test contact created'));
      }
    }
    
    // Step 2: Create test interactions for two different users
    console.log(chalk.yellow('\n2. Creating test interactions...'));
    
    // Create interaction for user 1
    const interaction1Id = `test-${uuidv4()}`;
    const { data: interaction1, error: create1Error } = await adminClient
      .from('interactions')
      .insert({
        id: interaction1Id,
        contact_id: contactId,
        type: 'email',
        title: 'Test Interaction 1',
        content: 'This is a test interaction for user 1',
        created_by: testUser1Id
      })
      .select()
      .single();
    
    if (create1Error) {
      console.log(chalk.red(`❌ Create interaction for user 1: ${create1Error.message}`));
      throw create1Error;
    } else {
      console.log(chalk.green('✅ Create interaction for user 1'));
      console.log('Interaction 1 created_by:', interaction1.created_by);
    }
    
    // Create interaction for user 2
    const interaction2Id = `test-${uuidv4()}`;
    const { data: interaction2, error: create2Error } = await adminClient
      .from('interactions')
      .insert({
        id: interaction2Id,
        contact_id: contactId,
        type: 'note',
        title: 'Test Interaction 2',
        content: 'This is a test interaction for user 2',
        created_by: testUser2Id
      })
      .select()
      .single();
    
    if (create2Error) {
      console.log(chalk.red(`❌ Create interaction for user 2: ${create2Error.message}`));
      throw create2Error;
    } else {
      console.log(chalk.green('✅ Create interaction for user 2'));
      console.log('Interaction 2 created_by:', interaction2.created_by);
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
    
    // Step 4: Create authenticated clients for each test user
    console.log(chalk.yellow('\n4. Testing authenticated access with JWT tokens...'));
    
    // Create a JWT token for user 1
    const { data: authData1, error: authError1 } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: `test1-${uuidv4()}@example.com`,
      options: {
        data: {
          id: testUser1Id
        }
      }
    });
    
    if (authError1 || !authData1) {
      console.log(chalk.red(`❌ Failed to generate auth token for user 1: ${authError1?.message || 'No data'}`));
      
      // Fallback to direct fetch with auth header
      console.log(chalk.yellow('Falling back to direct fetch with auth header...'));
      
      // Create auth JWT payload for user 1
      const authPayload1 = {
        sub: testUser1Id,
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      
      console.log('Auth payload for user 1:', authPayload1);
      
      // Test user 1 access with direct fetch
      const user1Response = await fetch(`${supabaseUrl}/rest/v1/interactions?select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'X-Client-Info': 'supabase-js/2.0.0',
          'Prefer': 'return=representation',
          'X-Supabase-Auth': JSON.stringify(authPayload1)
        } as HeadersInit
      });
      
      const user1Data = await user1Response.json();
      console.log('User 1 response status:', user1Response.status);
      console.log('User 1 data length:', Array.isArray(user1Data) ? user1Data.length : 'Not an array');
      
      // Check if user 1 can only see their own interaction
      const user1CanSeeOwn = Array.isArray(user1Data) && user1Data.some((i: any) => i.id === interaction1Id);
      const user1CanSeeOthers = Array.isArray(user1Data) && user1Data.some((i: any) => i.id === interaction2Id);
      
      logTest('User 1 can see own interaction', user1CanSeeOwn);
      logTest('User 1 cannot see user 2\'s interaction', !user1CanSeeOthers);
      
      // Create auth JWT payload for user 2
      const authPayload2 = {
        sub: testUser2Id,
        role: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      
      console.log('Auth payload for user 2:', authPayload2);
      
      // Test user 2 access with direct fetch
      const user2Response = await fetch(`${supabaseUrl}/rest/v1/interactions?select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'X-Client-Info': 'supabase-js/2.0.0',
          'Prefer': 'return=representation',
          'X-Supabase-Auth': JSON.stringify(authPayload2)
        } as HeadersInit
      });
      
      const user2Data = await user2Response.json();
      console.log('User 2 response status:', user2Response.status);
      console.log('User 2 data length:', Array.isArray(user2Data) ? user2Data.length : 'Not an array');
      
      // Check if user 2 can only see their own interaction
      const user2CanSeeOwn = Array.isArray(user2Data) && user2Data.some((i: any) => i.id === interaction2Id);
      const user2CanSeeOthers = Array.isArray(user2Data) && user2Data.some((i: any) => i.id === interaction1Id);
      
      logTest('User 2 can see own interaction', user2CanSeeOwn);
      logTest('User 2 cannot see user 1\'s interaction', !user2CanSeeOthers);
    }
    
    // Step 5: Clean up test data
    console.log(chalk.yellow('\n5. Cleaning up test data...'));
    
    // Delete test interactions
    await adminClient
      .from('interactions')
      .delete()
      .in('id', [interaction1Id, interaction2Id]);
    
    // Only delete the contact if we created it
    if (contactId === testContactId) {
      await adminClient
        .from('contacts')
        .delete()
        .eq('id', testContactId);
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
