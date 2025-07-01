/**
 * OrderStatusBadge Component
 * 
 * Displays a visually styled badge for order statuses
 */

import { Badge } from '@/components/ui/badge';
import { OrderStatus } from '@/types/order';

interface OrderStatusBadgeProps {
  status: OrderStatus | string;
}

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  // Define status colors and labels
  const statusConfig: Record<string, { color: string; label: string }> = {
    draft: { color: 'bg-gray-200 text-gray-800', label: 'Draft' },
    confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
    processing: { color: 'bg-yellow-100 text-yellow-800', label: 'Processing' },
    partially_fulfilled: { color: 'bg-amber-100 text-amber-800', label: 'Partially Fulfilled' },
    fulfilled: { color: 'bg-green-100 text-green-800', label: 'Fulfilled' },
    cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    on_hold: { color: 'bg-purple-100 text-purple-800', label: 'On Hold' },
  };
  
  // Get config for current status or use default
  const config = statusConfig[status] || { color: 'bg-gray-200 text-gray-800', label: status };
  
  return (
    <Badge className={`${config.color} font-medium`} variant="outline">
      {config.label}
    </Badge>
  );
}
