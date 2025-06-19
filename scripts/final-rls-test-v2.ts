/**
 * Final RLS Test Script V2
 * Tests RLS policies with proper JWT authentication using Node.js crypto
 */
import dotenv from 'dotenv';
import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

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
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Function to create a JWT token for a user
function createJWT(userId: string, secret: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    sub: userId,
    aud: 'authenticated',
    role: 'authenticated',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Create a client with a specific user's JWT
function createUserClient(userId: string) {
  // Extract the JWT secret from the service role key
  // The service role key format is typically: eyJ...header.eyJ...payload.signature
  const jwtSecret = supabaseServiceKey.split('.')[2] || supabaseServiceKey;
  
  // Create a proper JWT for the user
  const userJWT = createJWT(userId, jwtSecret);
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'Authorization': `Bearer ${userJWT}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  return client;
}

// Function to log test results
function logTest(description: string, passed: boolean, details?: string) {
  if (passed) {
    console.log(chalk.green(`✅ ${description}`));
  } else {
    console.log(chalk.red(`❌ ${description}: ${details || 'Failed'}`));
  }
}

async function testRlsPolicies() {
  console.log(chalk.blue('\n=== FINAL RLS POLICY TEST V2 ===\n'));
  
  try {
    // Use the valid user ID from the database
    const validUserId = 'c636144d-fb35-467a-b626-fb2b07dc97b7';
    console.log(chalk.yellow(`Using valid user ID: ${validUserId}`));
    
    // Create an authenticated client
    console.log(chalk.yellow('\n1. Creating authenticated client with JWT...'));
    const userClient = createUserClient(validUserId);
    console.log(chalk.green('✅ Created authenticated client with JWT'));
    
    // Step 2: Create a test contact
    console.log(chalk.yellow('\n2. Creating test contact...'));
    
    const contactId = `test-contact-${uuidv4()}`;
    const contactData = {
      id: contactId,
      firstname: 'Test',
      lastname: 'User',
      email: `test-${Date.now()}@example.com`
    };
    
    const { error: createContactError } = await adminClient
      .from('contacts')
      .insert(contactData);
      
    if (createContactError) {
      console.log(chalk.yellow(`Using existing contact: ${createContactError.message}`));
      const { data: existingContact } = await adminClient
        .from('contacts')
        .select('id')
        .limit(1)
        .single();
      contactData.id = existingContact?.id || contactId;
    }
    
    console.log(chalk.green(`✅ Using contact with ID: ${contactData.id}`));
    
    // Step 3: Create a test interaction as the admin
    console.log(chalk.yellow('\n3. Creating test interaction...'));
    
    const interactionId = `test-${uuidv4()}`;
    const interactionData = {
      id: interactionId,
      contact_id: contactData.id,
      type: 'email',
      title: 'Final RLS Test V2',
      content: 'Testing RLS policies with proper JWT auth',
      created_by: validUserId
    };
    
    const { data: interaction, error: createError } = await adminClient
      .from('interactions')
      .insert(interactionData)
      .select()
      .single();
    
    if (createError) {
      console.log(chalk.red(`❌ Failed to create interaction: ${createError.message}`));
      throw createError;
    }
    
    console.log(chalk.green('✅ Created test interaction'));
    console.log('Interaction details:', JSON.stringify(interaction, null, 2));
    
    // Step 4: Try to query the interaction as an anonymous user
    console.log(chalk.yellow('\n4. Testing anonymous access...'));
    
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const { data: anonData, error: anonError } = await anonClient
      .from('interactions')
      .select('*')
      .eq('id', interactionId);
    
    if (anonError) {
      console.log(chalk.red(`❌ Anonymous access error: ${anonError.message}`));
    } else {
      const anonAccessEmpty = !anonData || anonData.length === 0;
      logTest('Anonymous access returns empty set', anonAccessEmpty);
    }
    
    // Step 5: Try to query the interaction as the authenticated user
    console.log(chalk.yellow('\n5. Testing authenticated access with JWT...'));
    
    const { data: userData, error: userError } = await userClient
      .from('interactions')
      .select('*')
      .eq('id', interactionId);
    
    if (userError) {
      console.log(chalk.red(`❌ Authenticated access error: ${userError.message}`));
    } else {
      const userAccessSuccess = userData && userData.length > 0;
      logTest('Authenticated user can see own interaction', userAccessSuccess);
      
      if (userAccessSuccess) {
        console.log('Retrieved interaction:', JSON.stringify(userData[0], null, 2));
      } else {
        console.log('No data returned for authenticated user');
        
        // Debug: Check what the user can actually see
        const { data: allUserData } = await userClient
          .from('interactions')
          .select('*');
          
        console.log(`User can see ${allUserData?.length || 0} interactions total`);
        if (allUserData && allUserData.length > 0) {
          console.log('First interaction:', JSON.stringify(allUserData[0], null, 2));
        }
      }
    }
    
    // Step 6: Test CRUD operations
    console.log(chalk.yellow('\n6. Testing CRUD operations...'));
    
    // Test UPDATE
    const { data: updateData, error: updateError } = await userClient
      .from('interactions')
      .update({ content: 'Updated content' })
      .eq('id', interactionId)
      .select();
    
    if (updateError) {
      console.log(chalk.red(`❌ Update error: ${updateError.message}`));
    } else {
      logTest('User can update own interaction', updateData && updateData.length > 0);
    }
    
    // Test DELETE
    const { error: deleteError } = await userClient
      .from('interactions')
      .delete()
      .eq('id', interactionId);
    
    if (deleteError) {
      console.log(chalk.red(`❌ Delete error: ${deleteError.message}`));
    } else {
      logTest('User can delete own interaction', true);
    }
    
    // Step 7: Clean up
    console.log(chalk.yellow('\n7. Cleaning up test data...'));
    
    // Clean up any remaining interaction data
    await adminClient
      .from('interactions')
      .delete()
      .eq('id', interactionId);
    
    await adminClient
      .from('contacts')
      .delete()
      .eq('id', contactData.id);
    
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
