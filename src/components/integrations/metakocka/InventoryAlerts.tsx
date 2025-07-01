'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BellRing, CheckCircle, Plus, RefreshCw, X } from 'lucide-react';
import { InventoryAlert, InventoryAlertStats, InventoryAlertWithProduct } from '@/types/inventory';

interface InventoryAlertsProps {
  productId?: string;
  className?: string;
}

export function InventoryAlerts({ productId, className = '' }: InventoryAlertsProps) {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<InventoryAlertWithProduct[]>([]);
  const [stats, setStats] = useState<InventoryAlertStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    product_id: productId || '',
    threshold_quantity: 5,
    is_active: true,
  });

  // Fetch alerts and stats
  const fetchAlerts = async () => {
    try {
      setIsRefreshing(true);
      const url = productId 
        ? `/api/integrations/metakocka/inventory/alerts?product_id=${productId}`
        : '/api/integrations/metakocka/inventory/alerts';
      
      const [alertsRes, statsRes] = await Promise.all([
        fetch(url),
        fetch('/api/integrations/metakocka/inventory/alerts/stats')
      ]);

      if (!alertsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch alert data');
      }

      const alertsData = await alertsRes.json();
      const statsData = await statsRes.json();

      setAlerts(alertsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory alerts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Check for new alerts
  const checkForAlerts = async () => {
    try {
      const res = await fetch('/api/integrations/metakocka/inventory/alerts/check');
      if (!res.ok) throw new Error('Failed to check alerts');
      
      const triggeredAlerts = await res.json();
      
      if (triggeredAlerts.length > 0) {
        // Show toast for each triggered alert
        triggeredAlerts.forEach((alert: any) => {
          toast({
            title: 'Inventory Alert',
            description: `Low stock for ${alert.product_name} (${alert.product_sku || 'No SKU'}). Current: ${alert.current_quantity}, Threshold: ${alert.threshold_quantity}`,
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => acknowledgeAlert(alert.alert_id)}
              >
                Acknowledge
              </Button>
            ),
          });
        });
        
        // Refresh the alerts list
        fetchAlerts();
      }
    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  };

  // Toggle alert active status
  const toggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/integrations/metakocka/inventory/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!res.ok) throw new Error('Failed to update alert');
      
      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, is_active: isActive } : alert
      ));
      
      toast({
        title: 'Success',
        description: `Alert ${isActive ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to update alert',
        variant: 'destructive',
      });
    }
  };

  // Acknowledge an alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      const res = await fetch('/api/integrations/metakocka/inventory/alerts/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });

      if (!res.ok) throw new Error('Failed to acknowledge alert');
      
      // Refresh the alerts list
      fetchAlerts();
      
      toast({
        title: 'Success',
        description: 'Alert acknowledged',
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert',
        variant: 'destructive',
      });
    }
  };

  // Handle form submission
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/integrations/metakocka/inventory/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert),
      });

      if (!res.ok) throw new Error('Failed to create alert');
      
      const createdAlert = await res.json();
      
      // Update local state
      setAlerts([...alerts, createdAlert]);
      setShowCreateForm(false);
      
      toast({
        title: 'Success',
        description: 'Inventory alert created',
      });
    } catch (error) {
      console.error('Error creating alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to create inventory alert',
        variant: 'destructive',
      });
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAlerts();
    
    // Set up interval to check for alerts every 5 minutes
    const interval = setInterval(() => {
      checkForAlerts();
    }, 5 * 60 * 1000);
    
    // Initial check
    checkForAlerts();
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Stats Cards */}
      {stats && !productId && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <BellRing className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_alerts}</div>
              <p className="text-xs text-muted-foreground">Active: {stats.active_alerts}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Triggered Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.triggered_alerts}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent_alerts.length}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inventory Alerts</CardTitle>
            <p className="text-sm text-muted-foreground">
              {productId ? 'Product-specific alerts' : 'All inventory alerts'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchAlerts()}
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              size="sm" 
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Alert
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Create Alert Form */}
          {showCreateForm && (
            <form onSubmit={handleCreateAlert} className="mb-6 p-4 border rounded-lg bg-muted/20">
              <div className="grid gap-4 md:grid-cols-4">
                {!productId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none">Product</label>
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Select product..."
                      value={newAlert.product_id}
                      onChange={(e) => setNewAlert({...newAlert, product_id: e.target.value})}
                      required
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Threshold Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newAlert.threshold_quantity}
                    onChange={(e) => setNewAlert({...newAlert, threshold_quantity: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>
                
                <div className="flex items-end space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="alert-active" 
                      checked={newAlert.is_active}
                      onCheckedChange={(checked) => setNewAlert({...newAlert, is_active: checked})}
                    />
                    <label htmlFor="alert-active" className="text-sm font-medium leading-none">
                      Active
                    </label>
                  </div>
                  
                  <Button type="submit" size="sm">
                    Create Alert
                  </Button>
                </div>
              </div>
            </form>
          )}
          
          {alerts.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No alerts found</AlertTitle>
              <AlertDescription>
                {productId 
                  ? 'No alerts have been set up for this product.' 
                  : 'No inventory alerts have been created yet.'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Current Qty</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">
                        {alert.product_name || 'N/A'}
                      </TableCell>
                      <TableCell>{alert.product_sku || 'N/A'}</TableCell>
                      <TableCell>{alert.current_quantity ?? 'N/A'}</TableCell>
                      <TableCell>{alert.threshold_quantity}</TableCell>
                      <TableCell>
                        <Badge variant={alert.is_triggered ? 'destructive' : 'default'}>
                          {alert.is_triggered ? 'Triggered' : 'Normal'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(alert.updated_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Switch
                          checked={alert.is_active}
                          onCheckedChange={(checked) => toggleAlert(alert.id, checked)}
                          className="mr-2"
                        />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => acknowledgeAlert(alert.id)}
                          disabled={!alert.is_triggered}
                        >
                          Acknowledge
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
