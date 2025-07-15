// create-user-preferences.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUserPreferencesTable() {
  try {
    console.log('Creating user_preferences table...');
    
    const sql = `
      CREATE TABLE IF NOT EXISTS public.user_preferences (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        
        -- Appearance settings
        theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
        font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
        
        -- Account settings
        two_factor_enabled BOOLEAN DEFAULT false,
        activity_emails BOOLEAN DEFAULT true,
        marketing_emails BOOLEAN DEFAULT false,
        
        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        
        -- Ensure one row per user
        UNIQUE(user_id)
      );
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
    
    if (error) {
      console.error('Error creating user_preferences table:', error);
      return false;
    }
    
    console.log('✅ user_preferences table created successfully');
    
    // Enable RLS and create policies
    const rlsSql = `
      -- Enable RLS
      ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
      
      -- RLS Policies
      CREATE POLICY "Users can view their own preferences"
          ON public.user_preferences
          FOR SELECT
          USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can insert their own preferences"
          ON public.user_preferences
          FOR INSERT
          WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own preferences"
          ON public.user_preferences
          FOR UPDATE
          USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete their own preferences"
          ON public.user_preferences
          FOR DELETE
          USING (auth.uid() = user_id);
      
      -- Indexes
      CREATE INDEX user_preferences_user_id_idx ON public.user_preferences (user_id);
    `;
    
    const { data: rlsData, error: rlsError } = await supabase.rpc('exec_sql', { sql_string: rlsSql });
    
    if (rlsError) {
      console.error('Error setting up RLS for user_preferences table:', rlsError);
      return false;
    }
    
    console.log('✅ RLS policies created successfully for user_preferences');
    return true;
  } catch (err) {
    console.error('Error:', err);
    return false;
  }
}

createUserPreferencesTable(); 