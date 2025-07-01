-- Create inventory_alert_history table
CREATE TABLE IF NOT EXISTS public.inventory_alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES public.inventory_alerts(id) ON DELETE CASCADE,
    was_triggered BOOLEAN NOT NULL,
    current_quantity NUMERIC(10, 2) NOT NULL,
    threshold_quantity NUMERIC(10, 2) NOT NULL,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Ensure alert_id and checked_at are unique together
    CONSTRAINT uq_alert_checked UNIQUE (alert_id, checked_at)
);

-- Enable Row Level Security
ALTER TABLE public.inventory_alert_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own alert history"
    ON public.inventory_alert_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.inventory_alerts a 
            WHERE a.id = alert_id AND a.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage alert history"
    ON public.inventory_alert_history
    FOR ALL
    USING (auth.role() = 'service_role');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id 
    ON public.inventory_alert_history(alert_id);

CREATE INDEX IF NOT EXISTS idx_alert_history_checked_at 
    ON public.inventory_alert_history(checked_at DESC);

-- Create a function to log alert checks
CREATE OR REPLACE FUNCTION log_inventory_alert_check()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a new history record for each checked alert
    INSERT INTO public.inventory_alert_history (
        alert_id,
        was_triggered,
        current_quantity,
        threshold_quantity
    )
    SELECT 
        alert_id,
        is_triggered,
        current_quantity,
        threshold_quantity
    FROM 
        NEW
    WHERE 
        is_triggered IS TRUE;
        
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically log alert checks
CREATE TRIGGER after_alert_check
AFTER INSERT OR UPDATE ON public.inventory_alerts
FOR EACH STATEMENT
EXECUTE FUNCTION log_inventory_alert_check();

-- Create a function to acknowledge an alert
CREATE OR REPLACE FUNCTION acknowledge_inventory_alert(
    p_alert_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.inventory_alert_history
    SET 
        acknowledged_at = NOW(),
        acknowledged_by = p_user_id
    WHERE 
        alert_id = p_alert_id
        AND was_triggered = TRUE
        AND acknowledged_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.acknowledge_inventory_alert(UUID, UUID) TO authenticated;
