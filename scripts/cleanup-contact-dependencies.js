require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupContactDependencies(contactId) {
  try {
    console.log(`🧹 Cleaning up dependencies for contact: ${contactId}`);
    
    // List of tables that might reference the contact
    const dependentTables = [
      'contact_communication_metrics',
      'sentiment_evolution_events',
      'behavioral_milestone_events',
      'decision_context_factors',
      'contact_interactions',
      'contact_emails',
      'contact_notes',
      'contact_activities'
    ];
    
    // Delete from all dependent tables
    for (const table of dependentTables) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('contact_id', contactId);
        
        if (error) {
          if (error.code === '42P01') {
            // Table doesn't exist, skip
            console.log(`⏭️  Table ${table} doesn't exist, skipping`);
          } else {
            console.error(`❌ Error deleting from ${table}:`, error.message);
          }
        } else {
          console.log(`✅ Deleted from ${table}`);
        }
      } catch (err) {
        console.log(`⏭️  Skipping ${table}: ${err.message}`);
      }
    }
    
    // Now delete the contact
    const { error: contactError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);
    
    if (contactError) {
      console.error('❌ Error deleting contact:', contactError);
      return false;
    } else {
      console.log('✅ Successfully deleted contact');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error in cleanup:', error);
    return false;
  }
}

// If run directly, clean up the test contact
if (require.main === module) {
  const contactId = '16fc1a4b-1a5b-4882-ab77-c21132c33141';
  cleanupContactDependencies(contactId)
    .then(success => {
      if (success) {
        console.log('🎉 Contact cleanup completed successfully');
      } else {
        console.log('💥 Contact cleanup failed');
      }
      process.exit(success ? 0 : 1);
    });
}

module.exports = { cleanupContactDependencies }; 