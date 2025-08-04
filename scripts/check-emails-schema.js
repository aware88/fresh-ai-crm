// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function checkEmailsSchema() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔍 Checking emails table schema...\n');
    
    // Try to insert a minimal test record to see what columns are required
    const testEmail = {
      subject: 'Test Email Schema Check',
      sender: 'test@example.com',
      raw_content: 'This is a test email to check the schema.',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('emails')
      .insert([testEmail])
      .select('*');
    
    if (error) {
      console.error('❌ Error inserting test email:', error);
      console.log('\n💡 This tells us what columns are missing or required.');
      
      // Try to get the actual schema by querying an empty result
      const { data: emptyData, error: emptyError } = await supabase
        .from('emails')
        .select('*')
        .limit(0);
      
      if (emptyError) {
        console.error('❌ Error getting schema:', emptyError);
      } else {
        console.log('✅ emails table exists but is empty');
      }
    } else {
      console.log('✅ Test email inserted successfully!');
      console.log('📋 Available columns in emails table:');
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        columns.forEach(column => {
          console.log(`   - ${column}: ${typeof data[0][column]} (${data[0][column] === null ? 'null' : 'has value'})`);
        });
        
        // Clean up the test record
        await supabase
          .from('emails')
          .delete()
          .eq('id', data[0].id);
        
        console.log('\n🧹 Test record cleaned up');
      }
    }
    
  } catch (error) {
    console.error('💥 Exception checking emails schema:', error);
  }
}

checkEmailsSchema(); 