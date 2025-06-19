-- Create contact_personality_history table
CREATE TABLE IF NOT EXISTS public.contact_personality_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id TEXT NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  personality_type TEXT NOT NULL,
  analysis_summary TEXT,
  source_email_id TEXT REFERENCES public.emails(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_personality_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their contact's personality history"
  ON public.contact_personality_history
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE id = contact_id 
    AND (user_id = auth.uid() OR user_id IS NULL)
  ));

CREATE POLICY "Users can insert personality history for their contacts"
  ON public.contact_personality_history
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contacts 
    WHERE id = contact_id 
    AND (user_id = auth.uid() OR user_id IS NULL)
  ));

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_contact_personality_history_modtime
BEFORE UPDATE ON public.contact_personality_history
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Create index for faster lookups
CREATE INDEX idx_contact_personality_history_contact_id 
ON public.contact_personality_history(contact_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.contact_personality_history TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.contact_personality_history_id_seq TO authenticated;
