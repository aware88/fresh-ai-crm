import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, AlertCircle, CheckCircle, Clock, ArrowDownUp } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Progress } from '@/components/ui/progress';

type SyncStatus = {
  entity_type: 'products' | 'contacts' | 'sales_documents';
  organization_id: string;
  organization_name: string;
  total_items: number;
  synced_items: number;
  last_sync_at: string | null;
  status: 'in_progress' | 'completed' | 'failed' | 'idle';
  error_count: number;
};

export function MetakockaSyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch sync status
  useEffect(() => {
    fetchSyncStatus();
  }, []);
  
  const fetchSyncStatus = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would be an API call
      // For now, we'll simulate the data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: SyncStatus[] = [
        {
          entity_type: 'products',
          organization_id: 'org1',
          organization_name: 'Acme Inc.',
          total_items: 250,
          synced_items: 250,
          last_sync_at: '2025-07-01T14:25:00Z',
          status: 'completed',
          error_count: 0,
        },
        {
          entity_type: 'contacts',
          organization_id: 'org1',
          organization_name: 'Acme Inc.',
          total_items: 320,
          synced_items: 320,
          last_sync_at: '2025-07-01T14:30:00Z',
          status: 'completed',
          error_count: 0,
        },
        {
          entity_type: 'sales_documents',
          organization_id: 'org1',
          organization_name: 'Acme Inc.',
          total_items: 180,
          synced_items: 175,
          last_sync_at: '2025-07-01T14:35:00Z',
          status: 'in_progress',
          error_count: 0,
        },
        {
          entity_type: 'products',
          organization_id: 'org2',
          organization_name: 'Globex Corporation',
          total_items: 150,
          synced_items: 120,
          last_sync_at: '2025-06-30T08:45:00Z',
          status: 'failed',
          error_count: 30,
        },
        {
          entity_type: 'contacts',
          organization_id: 'org2',
          organization_name: 'Globex Corporation',
          total_items: 200,
          synced_items: 200,
          last_sync_at: '2025-06-30T08:40:00Z',
          status: 'completed',
          error_count: 0,
        },
        {
          entity_type: 'sales_documents',
          organization_id: 'org2',
          organization_name: 'Globex Corporation',
          total_items: 100,
          synced_items: 0,
          last_sync_at: null,
          status: 'idle',
          error_count: 0,
        },
      ];
      
      setSyncStatus(mockData);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshSyncStatus = async () => {
    setRefreshing(true);
    await fetchSyncStatus();
    setRefreshing(false);
  };
  
  // Filter sync status based on active tab
  const filteredSyncStatus = syncStatus.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'products') return item.entity_type === 'products';
    if (activeTab === 'contacts') return item.entity_type === 'contacts';
    if (activeTab === 'sales_documents') return item.entity_type === 'sales_documents';
    return true;
  });
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  // Calculate sync progress percentage
  const calculateProgress = (synced: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((synced / total) * 100);
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="success" className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Completed</span>
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="bg-blue-500 text-white flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>In Progress</span>
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Failed</span>
          </Badge>
        );
      case 'idle':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <span>Not Started</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <span>Unknown</span>
          </Badge>
        );
    }
  };
  
  // Calculate summary statistics
  const calculateSummary = () => {
    const summary = {
      total: syncStatus.length,
      completed: syncStatus.filter(item => item.status === 'completed').length,
      inProgress: syncStatus.filter(item => item.status === 'in_progress').length,
      failed: syncStatus.filter(item => item.status === 'failed').length,
      idle: syncStatus.filter(item => item.status === 'idle').length,
      totalItems: syncStatus.reduce((sum, item) => sum + item.total_items, 0),
      syncedItems: syncStatus.reduce((sum, item) => sum + item.synced_items, 0),
      errorCount: syncStatus.reduce((sum, item) => sum + item.error_count, 0),
    };
    
    return summary;
  };
  
  const summary = calculateSummary();
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Loading sync status...</span>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Synchronization Status</h2>
        <Button 
          onClick={refreshSyncStatus} 
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {refreshing ? <Spinner size="sm" /> : <RefreshCw className="h-4 w-4" />}
          <span>Refresh</span>
        </Button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.syncedItems} synced ({Math.round((summary.syncedItems / summary.totalItems) * 100)}%)
            </p>
            <Progress 
              value={calculateProgress(summary.syncedItems, summary.totalItems)} 
              className="h-1 mt-2" 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sync Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <div>
                <div className="text-2xl font-bold text-green-500">{summary.completed}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{summary.inProgress}</div>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">{summary.failed}</div>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-400">{summary.idle}</div>
                <p className="text-xs text-muted-foreground">Not Started</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(syncStatus.map(item => item.organization_id)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              With active Metakocka integration
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{summary.errorCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all synchronizations
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="all" onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="sales_documents">Sales Documents</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Sync Status Table */}
      {filteredSyncStatus.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-muted/20">
          <p className="text-muted-foreground">No synchronization data found.</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSyncStatus.map((item, index) => (
                <TableRow key={`${item.organization_id}-${item.entity_type}`}>
                  <TableCell>{item.organization_name}</TableCell>
                  <TableCell className="capitalize">{item.entity_type.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <div className="w-full">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{item.synced_items} / {item.total_items}</span>
                        <span>{calculateProgress(item.synced_items, item.total_items)}%</span>
                      </div>
                      <Progress 
                        value={calculateProgress(item.synced_items, item.total_items)} 
                        className="h-2" 
                      />
                    </div>
                  </TableCell>
                  <TableCell>{renderStatusBadge(item.status)}</TableCell>
                  <TableCell>{formatDate(item.last_sync_at)}</TableCell>
                  <TableCell>
                    {item.error_count > 0 ? (
                      <Badge variant="destructive">{item.error_count} errors</Badge>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-4">
        <Button variant="outline">
          <ArrowDownUp className="h-4 w-4 mr-2" />
          Run Manual Sync
        </Button>
      </div>
    </div>
  );
}
