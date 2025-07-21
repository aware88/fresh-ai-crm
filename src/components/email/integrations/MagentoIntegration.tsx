'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ShoppingBag, Package, User, CreditCard, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface MagentoOrder {
  id: string;
  increment_id: string;
  customer_email: string;
  customer_firstname?: string;
  customer_lastname?: string;
  status: string;
  created_at: string;
  grand_total: number;
  currency_code: string;
  items: {
    name: string;
    sku: string;
    qty_ordered: number;
    price: number;
  }[];
}

interface MagentoIntegrationProps {
  emailAddress?: string;
  onOrderSelect?: (order: MagentoOrder) => void;
}

export default function MagentoIntegration({ emailAddress, onOrderSelect }: MagentoIntegrationProps) {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<MagentoOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check if Magento is connected
  useEffect(() => {
    async function checkConnection() {
      try {
        setLoading(true);
        // In a real implementation, this would check the connection status with the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock connection status
        setIsConnected(true);
        
        if (emailAddress) {
          fetchOrdersByEmail(emailAddress);
        }
      } catch (err: any) {
        console.error('Failed to check Magento connection:', err);
        setError('Failed to connect to Magento');
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkConnection();
  }, [emailAddress]);

  const fetchOrdersByEmail = async (email: string) => {
    if (!email) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would fetch from the Magento API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data - cleaned for testing
      const mockOrders: MagentoOrder[] = [];
      
      setOrders(mockOrders);
      setSuccess(`Found ${mockOrders.length} orders for ${email}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to fetch Magento orders:', err);
      setError('Failed to fetch orders from Magento');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (emailAddress) {
      fetchOrdersByEmail(emailAddress);
    }
  };

  const handleOrderClick = (order: MagentoOrder) => {
    if (onOrderSelect) {
      onOrderSelect(order);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  };

  if (loading && !orders.length) {
    return (
      <div className="magento-integration p-4 border rounded-lg bg-white">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
          <span>Loading Magento data...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="magento-integration p-4 border rounded-lg bg-white">
        <div className="flex items-center mb-4">
          <ShoppingBag className="h-5 w-5 mr-2 text-gray-500" />
          <h3 className="text-lg font-medium">Magento Integration</h3>
        </div>
        
        <div className="bg-red-50 p-4 rounded-md mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Not Connected</h4>
              <p className="text-sm text-red-700 mt-1">
                The Magento integration is not connected. Please check your API credentials and connection settings.
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsConnected(true)}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Connect to Magento
        </button>
      </div>
    );
  }

  return (
    <div className="magento-integration p-4 border rounded-lg bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <ShoppingBag className="h-5 w-5 mr-2 text-blue-500" />
          <h3 className="text-lg font-medium">Magento Integration</h3>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 hover:bg-gray-100 rounded-full"
          title="Refresh orders"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 p-3 rounded-md mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 p-3 rounded-md mb-4">
          <div className="flex items-start">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}
      
      {emailAddress ? (
        orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => (
              <div 
                key={order.id} 
                className="border rounded-md overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleOrderClick(order)}
              >
                <div className="flex justify-between items-center p-3 bg-gray-50 border-b">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="font-medium">Order #{order.increment_id}</span>
                  </div>
                  <span 
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </span>
                </div>
                
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-500" />
                      <span>
                        {order.customer_firstname} {order.customer_lastname}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-1 text-gray-500" />
                      <span>
                        {formatCurrency(order.grand_total, order.currency_code)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {formatDate(order.created_at)}
                  </div>
                  
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-1">Items:</p>
                    <ul className="text-sm">
                      {order.items.map((item, index) => (
                        <li key={index} className="flex justify-between">
                          <span>
                            {item.qty_ordered}x {item.name}
                          </span>
                          <span className="text-gray-600">
                            {formatCurrency(item.price * item.qty_ordered, order.currency_code)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-md">
            <Package className="h-8 w-8 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-600">No orders found for {emailAddress}</p>
          </div>
        )
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <p className="text-gray-600">Select an email to view associated Magento orders</p>
        </div>
      )}
    </div>
  );
}
