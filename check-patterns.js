const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPatterns() {
  console.log('🔍 Checking email_patterns table...');
  
  // Check if table exists and get patterns for user
  const { data: patterns, error } = await supabase
    .from('email_patterns')
    .select('*')
    .eq('user_id', '5f7cf338-4ac1-4bd9-960a-d12dc6ffdb03')
    .limit(5);

  if (error) {
    console.error('❌ Error querying email_patterns:', error.message);
    
    // Try the old table name
    console.log('🔍 Checking email_learning_patterns table...');
    const { data: oldPatterns, error: oldError } = await supabase
      .from('email_learning_patterns')
      .select('*')
      .eq('user_id', '5f7cf338-4ac1-4bd9-960a-d12dc6ffdb03')
      .limit(5);
      
    if (oldError) {
      console.error('❌ Error querying email_learning_patterns:', oldError.message);
    } else {
      console.log(`✅ Found ${oldPatterns?.length || 0} patterns in email_learning_patterns table`);
      if (oldPatterns && oldPatterns.length > 0) {
        console.log('📋 Sample pattern:', JSON.stringify(oldPatterns[0], null, 2));
      }
    }
  } else {
    console.log(`✅ Found ${patterns?.length || 0} patterns in email_patterns table`);
    if (patterns && patterns.length > 0) {
      console.log('📋 Sample pattern:', JSON.stringify(patterns[0], null, 2));
    }
  }
  
  // Also check total count
  const { count, error: countError } = await supabase
    .from('email_patterns')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', '5f7cf338-4ac1-4bd9-960a-d12dc6ffdb03');
    
  if (!countError) {
    console.log(`📊 Total patterns for user: ${count}`);
  }
}

checkPatterns().catch(console.error);


