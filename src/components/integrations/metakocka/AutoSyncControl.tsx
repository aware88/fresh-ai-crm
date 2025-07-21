'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, RefreshCw, AlertCircle, CheckCircle, Settings } from 'lucide-react';

interface AutoSyncConfig {
  enabled: boolean;
  intervals: {
    products: number;
    invoices: number;
    contacts: number;
    inventory: number;
  };
  direction: {
    products: 'metakocka_to_crm' | 'crm_to_metakocka' | 'bidirectional';
    invoices: 'metakocka_to_crm' | 'crm_to_metakocka' | 'bidirectional';
    contacts: 'metakocka_to_crm' | 'crm_to_metakocka' | 'bidirectional';
  };
  realTimeEnabled: boolean;
  webhooksEnabled: boolean;
}

interface AutoSyncStatus {
  isRunning: boolean;
  config: AutoSyncConfig;
  activeTimers: string[];
}

export default function AutoSyncControl() {
  const [status, setStatus] = useState<AutoSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load current status
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/metakocka/auto-sync');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        setError('Failed to load auto-sync status');
      }
    } catch (err) {
      setError('Failed to load auto-sync status');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoSync = async () => {
    if (!status) return;

    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);

      const action = status.isRunning ? 'stop' : 'start';
      const response = await fetch('/api/integrations/metakocka/auto-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message);
        await loadStatus(); // Reload status
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to toggle auto-sync');
      }
    } catch (err) {
      setError('Failed to toggle auto-sync');
    } finally {
      setUpdating(false);
    }
  };

  const updateConfig = async (newConfig: Partial<AutoSyncConfig>) => {
    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/integrations/metakocka/auto-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'configure', config: newConfig }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message);
        await loadStatus(); // Reload status
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to update configuration');
      }
    } catch (err) {
      setError('Failed to update configuration');
    } finally {
      setUpdating(false);
    }
  };

  const triggerManualSync = async () => {
    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/integrations/metakocka/auto-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'manual-sync' }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message || 'Manual sync triggered successfully');
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to trigger manual sync');
      }
    } catch (err) {
      setError('Failed to trigger manual sync');
    } finally {
      setUpdating(false);
    }
  };

  const handleIntervalChange = (type: string, value: string) => {
    if (!status) return;
    
    const newConfig = {
      ...status.config,
      intervals: {
        ...status.config.intervals,
        [type]: parseInt(value) || 0,
      },
    };
    
    updateConfig(newConfig);
  };

  const handleDirectionChange = (type: string, value: string) => {
    if (!status) return;
    
    const newConfig = {
      ...status.config,
      direction: {
        ...status.config.direction,
        [type]: value as 'metakocka_to_crm' | 'crm_to_metakocka' | 'bidirectional',
      },
    };
    
    updateConfig(newConfig);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Automatic Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Automatic Sync
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load auto-sync status</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Automatic Sync
          <Badge variant={status.isRunning ? 'default' : 'secondary'}>
            {status.isRunning ? 'Running' : 'Stopped'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Configure automatic synchronization between your CRM and Metakocka.
          Perfect for keeping your data in sync without manual intervention.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Main Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="auto-sync-enabled">Enable Automatic Sync</Label>
            <p className="text-sm text-gray-500">
              Automatically sync data between CRM and Metakocka in the background
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={triggerManualSync}
              disabled={updating}
              variant="outline"
              size="sm"
            >
              {updating ? 'Syncing...' : 'Sync Now'}
            </Button>
            <Button
              onClick={toggleAutoSync}
              disabled={updating}
              variant={status.isRunning ? 'destructive' : 'default'}
            >
              {updating ? 'Updating...' : status.isRunning ? 'Stop Sync' : 'Start Sync'}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Sync Intervals */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <Label className="text-base font-medium">Sync Intervals</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="products-interval">Products (minutes)</Label>
              <Input
                id="products-interval"
                type="number"
                value={status.config.intervals.products}
                onChange={(e) => handleIntervalChange('products', e.target.value)}
                disabled={updating}
                min="1"
                max="1440"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invoices-interval">Invoices (minutes)</Label>
              <Input
                id="invoices-interval"
                type="number"
                value={status.config.intervals.invoices}
                onChange={(e) => handleIntervalChange('invoices', e.target.value)}
                disabled={updating}
                min="1"
                max="1440"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contacts-interval">Contacts (minutes)</Label>
              <Input
                id="contacts-interval"
                type="number"
                value={status.config.intervals.contacts}
                onChange={(e) => handleIntervalChange('contacts', e.target.value)}
                disabled={updating}
                min="1"
                max="1440"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inventory-interval">Inventory (minutes)</Label>
              <Input
                id="inventory-interval"
                type="number"
                value={status.config.intervals.inventory}
                onChange={(e) => handleIntervalChange('inventory', e.target.value)}
                disabled={updating}
                min="1"
                max="1440"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Sync Directions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <Label className="text-base font-medium">Sync Directions</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="products-direction">Products</Label>
              <Select
                value={status.config.direction.products}
                onValueChange={(value) => handleDirectionChange('products', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metakocka_to_crm">Metakocka → CRM</SelectItem>
                  <SelectItem value="crm_to_metakocka">CRM → Metakocka</SelectItem>
                  <SelectItem value="bidirectional">Bidirectional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="invoices-direction">Invoices</Label>
              <Select
                value={status.config.direction.invoices}
                onValueChange={(value) => handleDirectionChange('invoices', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metakocka_to_crm">Metakocka → CRM</SelectItem>
                  <SelectItem value="crm_to_metakocka">CRM → Metakocka</SelectItem>
                  <SelectItem value="bidirectional">Bidirectional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contacts-direction">Contacts</Label>
              <Select
                value={status.config.direction.contacts}
                onValueChange={(value) => handleDirectionChange('contacts', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metakocka_to_crm">Metakocka → CRM</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                ℹ️ Contacts can only be synced FROM Metakocka to CRM
              </p>
            </div>
          </div>
        </div>

        {/* Status Information */}
        {status.isRunning && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-base font-medium">Active Sync Timers</Label>
              <div className="flex flex-wrap gap-2">
                {status.activeTimers.map((timer) => (
                  <Badge key={timer} variant="outline">
                    {timer}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Recommended Settings */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Recommended for Your Use Case</h4>
          <p className="text-sm text-blue-800 mb-2">
            Since your CRM is the "longer arm of Metakocka," we recommend:
          </p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Products: Metakocka → CRM (every 30 minutes)</li>
            <li>• Invoices: Metakocka → CRM (every 15 minutes)</li>
            <li>• Contacts: Bidirectional (every 60 minutes)</li>
            <li>• Inventory: Metakocka → CRM (every 10 minutes)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 