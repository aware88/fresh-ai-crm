-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(50) DEFAULT 'light',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(100) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view and update only their own preferences
DROP POLICY IF EXISTS user_preferences_select_policy ON public.user_preferences;
CREATE POLICY user_preferences_select_policy ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_preferences_insert_policy ON public.user_preferences;
CREATE POLICY user_preferences_insert_policy ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_preferences_update_policy ON public.user_preferences;
CREATE POLICY user_preferences_update_policy ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle user preference updates
CREATE OR REPLACE FUNCTION public.handle_user_preference_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updating the updated_at timestamp
DROP TRIGGER IF EXISTS user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_preference_update();

-- Create function to create default user preferences for a user
CREATE OR REPLACE FUNCTION public.create_user_preferences_for_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create default user preferences for all existing users
CREATE OR REPLACE FUNCTION public.create_user_preferences_for_all_users()
RETURNS INTEGER AS $$
DECLARE
  user_count INTEGER := 0;
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id FROM auth.users
  LOOP
    PERFORM public.create_user_preferences_for_user(user_record.id);
    user_count := user_count + 1;
  END LOOP;
  
  RETURN user_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We can't create a trigger on auth.users as we don't have permission
-- Instead, call create_user_preferences_for_user() when a new user is created
-- or call create_user_preferences_for_all_users() to create preferences for all existing users
