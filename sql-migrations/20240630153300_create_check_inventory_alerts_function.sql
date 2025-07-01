-- Create a function to check for triggered inventory alerts
CREATE OR REPLACE FUNCTION public.check_inventory_alerts(p_user_id UUID)
RETURNS TABLE (
  alert_id UUID,
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  current_quantity NUMERIC(10, 2),
  threshold_quantity NUMERIC(10, 2),
  is_triggered BOOLEAN,
  triggered_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH current_inventory AS (
    SELECT 
      pi.product_id,
      pi.quantity_available as current_quantity
    FROM 
      public.product_inventory pi
    WHERE 
      pi.user_id = p_user_id
  )
  SELECT 
    a.id as alert_id,
    a.product_id,
    p.name as product_name,
    p.sku as product_sku,
    COALESCE(ci.current_quantity, 0) as current_quantity,
    a.threshold_quantity,
    CASE 
      WHEN COALESCE(ci.current_quantity, 0) <= a.threshold_quantity THEN TRUE
      ELSE FALSE
    END as is_triggered,
    CASE 
      WHEN COALESCE(ci.current_quantity, 0) <= a.threshold_quantity THEN NOW()
      ELSE NULL
    END as triggered_at
  FROM 
    public.inventory_alerts a
    JOIN public.products p ON a.product_id = p.id
    LEFT JOIN current_inventory ci ON a.product_id = ci.product_id
  WHERE 
    a.user_id = p_user_id
    AND a.is_active = TRUE
    AND (
      -- Either this is the first check
      NOT EXISTS (
        SELECT 1 
        FROM public.inventory_alert_history h 
        WHERE h.alert_id = a.id
      )
      -- Or the alert state has changed
      OR EXISTS (
        SELECT 1 
        FROM public.inventory_alert_history h 
        WHERE h.alert_id = a.id
        AND h.was_triggered != (COALESCE(ci.current_quantity, 0) <= a.threshold_quantity)
        ORDER BY h.checked_at DESC 
        LIMIT 1
      )
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_inventory_alerts(UUID) TO authenticated;
