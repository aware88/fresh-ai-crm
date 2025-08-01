import { Metadata } from 'next';
import { InventoryDashboard } from '@/components/integrations/metakocka/InventoryDashboard';

export const metadata: Metadata = {
  title: 'Inventory Management',
  description: 'Manage your inventory data synchronized from Metakocka',
};

export default function InventoryPage() {
  return (
    <div className="container mx-auto py-6">
      <InventoryDashboard />
    </div>
  );
}
