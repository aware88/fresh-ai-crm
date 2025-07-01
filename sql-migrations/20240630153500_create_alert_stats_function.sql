-- Create a function to get alert statistics
CREATE OR REPLACE FUNCTION public.get_inventory_alert_stats(p_user_id UUID)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_alerts', COUNT(*),
    'active_alerts', COUNT(*) FILTER (WHERE is_active = TRUE),
    'triggered_alerts', (
      SELECT COUNT(DISTINCT alert_id)
      FROM public.inventory_alert_history h
      JOIN public.inventory_alerts a ON h.alert_id = a.id
      WHERE 
        a.user_id = p_user_id
        AND h.was_triggered = TRUE
        AND h.acknowledged_at IS NULL
        AND h.checked_at >= (NOW() - INTERVAL '24 hours')
    ),
    'recent_alerts', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'product_id', a.product_id,
          'product_name', p.name,
          'product_sku', p.sku,
          'threshold_quantity', a.threshold_quantity,
          'is_active', a.is_active,
          'is_triggered', h.was_triggered,
          'current_quantity', h.current_quantity,
          'checked_at', h.checked_at,
          'acknowledged_at', h.acknowledged_at
        )
        ORDER BY h.checked_at DESC
        LIMIT 5
      ), '[]'::jsonb)
      FROM public.inventory_alert_history h
      JOIN public.inventory_alerts a ON h.alert_id = a.id
      LEFT JOIN public.products p ON a.product_id = p.id
      WHERE a.user_id = p_user_id
      ORDER BY h.checked_at DESC
      LIMIT 5
    )
  ) INTO stats
  FROM public.inventory_alerts
  WHERE user_id = p_user_id;
  
  RETURN stats;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_inventory_alert_stats(UUID) TO authenticated;
