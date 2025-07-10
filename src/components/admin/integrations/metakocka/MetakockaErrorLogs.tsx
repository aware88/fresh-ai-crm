'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, Download, RefreshCw, CheckCircle, AlertTriangle, X, Clock, Calendar, Tag, User, Info, HelpCircle, ChevronDown, ChevronUp, ArrowDownToLine, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { metakockaLogService } from '@/services/metakocka/MetakockaLogService';
import { useHotkeys } from 'react-hotkeys-hook';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type ErrorLog = {
  id: string;
  organization_id: string;
  organization_name: string;
  entity_type: 'product' | 'contact' | 'sales_document';
  entity_id: string;
  entity_name: string;
  error_message: string;
  error_code: string;
  error_details: string;
  created_at: string;
  error_status: 'new' | 'in_progress' | 'resolved';
  assigned_to: string | null;
  resolution: string | null;
  tags?: string[];
  operation?: string;
  status?: 'success' | 'error' | 'warning';
  details?: any;
};

type ErrorStats = {
  totalErrors: number;
  newErrors: number;
  inProgressErrors: number;
  resolvedErrors: number;
  organizationCount: number;
};

type SavedFilter = {
  id: string;
  name: string;
  filter: {
    organizations: string[];
    entityTypes: string[];
    statuses: string[];
    searchQuery: string;
    tags: string[];
  };
};

export function MetakockaErrorLogs() {
  // State for error logs and filtering
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    organizations: [] as string[],
    entityTypes: [] as string[],
    statuses: [] as string[],
    tags: [] as string[],
    dateFrom: '',
    dateTo: ''
  });
  
  // State for dialogs
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [resolution, setResolution] = useState('');
  const [keyboardShortcutsDialogOpen, setKeyboardShortcutsDialogOpen] = useState(false);
  
  // State for bulk actions
  const [selectedErrorIds, setSelectedErrorIds] = useState<string[]>([]);
  const [bulkActionMenuOpen, setBulkActionMenuOpen] = useState(false);
  const [bulkResolutionDialogOpen, setBulkResolutionDialogOpen] = useState(false);
  const [bulkResolution, setBulkResolution] = useState('');
  
  // State for saved filters
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [saveFilterDialogOpen, setSaveFilterDialogOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  
  // State for statistics
  const [stats, setStats] = useState<ErrorStats>({
    totalErrors: 0,
    newErrors: 0,
    inProgressErrors: 0,
    resolvedErrors: 0,
    organizationCount: 0
  });
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch error logs and stats
  useEffect(() => {
    fetchErrorLogs();
    fetchErrorStats();
  }, []);
  
  // Keyboard shortcuts
  useHotkeys('ctrl+f', (e: KeyboardEvent) => {
    e.preventDefault();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, { enableOnFormTags: ['INPUT'] });
  
  useHotkeys('ctrl+r', (e: KeyboardEvent) => {
    e.preventDefault();
    refreshErrorLogs();
  });
  
  useHotkeys('ctrl+e', (e: KeyboardEvent) => {
    e.preventDefault();
    exportAsCSV();
  });
  
  useHotkeys('?', () => {
    setKeyboardShortcutsDialogOpen(true);
  });
  
  const fetchErrorStats = async () => {
    try {
      // In a real implementation, this would use the metakockaLogService
      // For now, we'll simulate the data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setStats({
        totalErrors: 15,
        newErrors: 5,
        inProgressErrors: 3,
        resolvedErrors: 7,
        organizationCount: 3
      });
    } catch (error) {
      console.error('Error fetching error stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch error statistics',
        variant: 'destructive'
      });
    }
  };
  
  const fetchErrorLogs = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would use the metakockaLogService
      // For now, we'll simulate the data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: ErrorLog[] = [
        {
          id: 'err1',
          organization_id: 'org1',
          organization_name: 'Acme Inc.',
          entity_type: 'product',
          entity_id: 'prod123',
          entity_name: 'Premium Widget',
          error_message: 'Failed to sync product: Invalid SKU format',
          error_code: 'MK-PROD-001',
          error_details: 'The SKU format provided does not match the required pattern for Metakocka. Expected format: XXX-000-XXX.',
          created_at: '2025-07-01T14:25:30Z',
          error_status: 'new',
          assigned_to: null,
          resolution: null,
          tags: ['product', 'sku', 'validation'],
          operation: 'sync_to_metakocka',
          status: 'error',
          details: { field: 'sku', expected: 'XXX-000-XXX', received: 'WIDGET-123' }
        },
        {
          id: 'err2',
          organization_id: 'org1',
          organization_name: 'Acme Inc.',
          entity_type: 'contact',
          entity_id: 'cont456',
          entity_name: 'John Smith',
          error_message: 'Failed to sync contact: Missing required field',
          error_code: 'MK-CONT-002',
          error_details: 'The contact is missing a required field: VAT ID. This field is mandatory for business contacts in Metakocka.',
          created_at: '2025-07-01T15:10:45Z',
          error_status: 'in_progress',
          assigned_to: 'user123',
          resolution: null,
          tags: ['contact', 'missing-field', 'vat-id'],
          operation: 'sync_to_metakocka',
          status: 'error',
          details: { field: 'vat_id', required: true }
        },
        {
          id: 'err3',
          organization_id: 'org2',
          organization_name: 'Globex Corporation',
          entity_type: 'sales_document',
          entity_id: 'inv789',
          entity_name: 'Invoice #INV-2025-0123',
          error_message: 'Failed to sync sales document: Invalid tax rate',
          error_code: 'MK-DOC-003',
          error_details: 'The tax rate specified (28%) is not valid in Metakocka. Valid tax rates are: 0%, 5%, 9.5%, 22%.',
          created_at: '2025-07-01T12:15:20Z',
          error_status: 'resolved',
          assigned_to: 'user456',
          resolution: 'Updated tax rate to 22% as per client request',
          tags: ['sales-document', 'invoice', 'tax-rate'],
          operation: 'sync_to_metakocka',
          status: 'error',
          details: { field: 'tax_rate', value: '28', valid_values: ['0', '5', '9.5', '22'] }
        },
        {
          id: 'err4',
          organization_id: 'org3',
          organization_name: 'Wayne Enterprises',
          entity_type: 'product',
          entity_id: 'prod789',
          entity_name: 'Deluxe Gadget',
          error_message: 'Failed to sync product: API connection timeout',
          error_code: 'MK-API-001',
          error_details: 'Connection to Metakocka API timed out after 30 seconds.',
          created_at: '2025-07-01T09:45:12Z',
          error_status: 'new',
          assigned_to: null,
          resolution: null,
          tags: ['product', 'api', 'timeout'],
          operation: 'sync_to_metakocka',
          status: 'error',
          details: { timeout: 30, endpoint: '/api/products/create' }
        },
        {
          id: 'err5',
          organization_id: 'org2',
          organization_name: 'Globex Corporation',
          entity_type: 'contact',
          entity_id: 'cont789',
          entity_name: 'Jane Doe',
          error_message: 'Failed to sync contact: Duplicate email address',
          error_code: 'MK-CONT-003',
          error_details: 'The contact has a duplicate email address in Metakocka. Email addresses must be unique.',
          created_at: '2025-06-30T09:15:20Z',
          error_status: 'in_progress',
          assigned_to: 'user456',
          resolution: null,
          tags: ['contact', 'duplicate', 'email'],
          operation: 'sync_to_metakocka',
          status: 'error',
          details: { field: 'email', value: 'jane.doe@example.com' },
        },
        {
          id: 'err4',
          organization_id: 'org2',
          organization_name: 'Globex Corporation',
          entity_type: 'product',
          entity_id: 'prod789',
          entity_name: 'Basic Widget',
          error_message: 'Failed to sync product: Price cannot be negative',
          error_code: 'MK-PROD-004',
          error_details: 'The product price is set to -10.00 EUR. Metakocka does not allow negative prices for products.',
          timestamp: '2025-06-29T11:30:15Z',
          status: 'new',
          assigned_to: null,
          resolution: null,
        },
        {
          id: 'err5',
          organization_id: 'org1',
          organization_name: 'Acme Inc.',
          entity_type: 'sales_document',
          entity_id: 'ord101',
          entity_name: 'Order #ORD-2025-0045',
          error_message: 'Failed to sync sales document: Customer not found',
          error_code: 'MK-DOC-005',
          error_details: 'The customer associated with this order was not found in Metakocka. Customer ID: CUST-12345',
          timestamp: '2025-07-02T08:20:10Z',
          status: 'new',
          assigned_to: null,
          resolution: null,
        },
      ];
      
      setErrorLogs(mockData);
    } catch (error) {
      console.error('Error fetching error logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshErrorLogs = async () => {
    setRefreshing(true);
    await fetchErrorLogs();
    setRefreshing(false);
  };
  
  // Open error details dialog
  const openErrorDetails = (error: ErrorLog) => {
    setSelectedError(error);
    setResolution(error.resolution || '');
    setDetailsDialogOpen(true);
  };
  
  // Resolve error
  const resolveError = async () => {
    if (!selectedError || !resolution) return;
    
    try {
      // In a real implementation, this would be an API call using metakockaLogService
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the error log in the state
      setErrorLogs(prev =>
        prev.map(log =>
          log.id === selectedError.id
            ? { ...log, error_status: 'resolved', resolution }
            : log
        )
      );
      
      toast({
        title: 'Success',
        description: 'Error log has been resolved',
        variant: 'default'
      });
      
      // Close the dialog
      setDetailsDialogOpen(false);
      setSelectedError(null);
    } catch (error) {
      console.error('Error resolving error log:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve error log',
        variant: 'destructive'
      });
    }
  };
  
  // Apply filters to error logs
  const applyFilters = () => {
    // In a real implementation, this would call the API with filters
    // For now, we'll just filter the mock data client-side
    return errorLogs.filter(log => {
      // Filter by tab
      if (activeTab === 'new' && log.error_status !== 'new') return false;
      if (activeTab === 'in_progress' && log.error_status !== 'in_progress') return false;
      if (activeTab === 'resolved' && log.error_status !== 'resolved') return false;
      
      // Filter by organization
      if (filters.organizations.length > 0 && !filters.organizations.includes(log.organization_id)) {
        return false;
      }
      
      // Filter by entity type
      if (filters.entityTypes.length > 0 && !filters.entityTypes.includes(log.entity_type)) {
        return false;
      }
      
      // Filter by status
      if (filters.statuses.length > 0 && !filters.statuses.includes(log.error_status)) {
        return false;
      }
      
      // Filter by tags
      if (filters.tags.length > 0 && (!log.tags || !filters.tags.some(tag => log.tags?.includes(tag)))) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          log.entity_name.toLowerCase().includes(query) ||
          log.error_message.toLowerCase().includes(query) ||
          log.error_code.toLowerCase().includes(query) ||
          log.error_details.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Get unique organizations, entity types, and statuses for filters
  const uniqueOrganizations = Array.from(
    new Set(errorLogs.map(log => log.organization_id))
  ).map(id => ({
    id,
    name: errorLogs.find(log => log.organization_id === id)?.organization_name || '',
  }));
  
  const uniqueEntityTypes = Array.from(
    new Set(errorLogs.map(log => log.entity_type))
  );
  
  const uniqueStatuses = Array.from(new Set(errorLogs.map(log => log.status)));
  
  // Toggle organization filter
  const toggleOrganizationFilter = (orgId: string) => {
    setFilters(prev => ({
      ...prev,
      organizations: prev.organizations.includes(orgId)
        ? prev.organizations.filter(id => id !== orgId)
        : [...prev.organizations, orgId],
    }));
  };
  
  // Toggle entity type filter
  const toggleEntityTypeFilter = (entityType: string) => {
    setFilters(prev => ({
      ...prev,
      entityTypes: prev.entityTypes.includes(entityType)
        ? prev.entityTypes.filter(type => type !== entityType)
        : [...prev.entityTypes, entityType],
    }));
  };
  
  // Toggle status filter
  const toggleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status],
    }));
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      organizations: [],
      entityTypes: [],
      statuses: [],
    });
    setSearchQuery('');
  };
  
  // Export error logs as CSV
  const exportAsCSV = () => {
    // In a real implementation, this would generate and download a CSV file
    alert('Exporting error logs as CSV...');
  };
  
  // Render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>New</span>
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="secondary" className="bg-blue-500 text-white flex items-center gap-1">
            <span>In Progress</span>
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="success" className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Resolved</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Bulk action handlers
  const handleBulkResolve = async () => {
    if (selectedErrorIds.length === 0 || !bulkResolution) return;
    
    try {
      // In a real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the error logs in the state
      setErrorLogs(prev => 
        prev.map(log => 
          selectedErrorIds.includes(log.id)
            ? { ...log, error_status: 'resolved', resolution: bulkResolution }
            : log
        )
      );
      
      toast({
        title: 'Success',
        description: `${selectedErrorIds.length} errors have been resolved`,
        variant: 'default'
      });
      
      // Close the dialog and clear selection
      setBulkResolutionDialogOpen(false);
      setSelectedErrorIds([]);
      setBulkResolution('');
    } catch (error) {
      console.error('Error resolving error logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve error logs',
        variant: 'destructive'
      });
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedErrorIds.length === 0) return;
    
    try {
      // In a real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove the error logs from the state
      setErrorLogs(prev => prev.filter(log => !selectedErrorIds.includes(log.id)));
      
      toast({
        title: 'Success',
        description: `${selectedErrorIds.length} errors have been deleted`,
        variant: 'default'
      });
      
      // Clear selection
      setSelectedErrorIds([]);
    } catch (error) {
      console.error('Error deleting error logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete error logs',
        variant: 'destructive'
      });
    }
  };
  
  // Reference for advanced search input to focus with keyboard shortcut
  const advancedSearchInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize error stats
  const [errorStats, setErrorStats] = useState<ErrorStats>({
    totalErrors: 0,
    newErrors: 0,
    inProgressErrors: 0,
    resolvedErrors: 0,
    organizationCount: 0
  });
  
  // Keyboard shortcuts
  useHotkeys('ctrl+f', (e) => {
    e.preventDefault();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, { enableOnFormTags: ['INPUT'] });
  
  useHotkeys('ctrl+r', () => {
    refreshErrorLogs();
  });
  
  useHotkeys('ctrl+e', () => {
    exportAsCSV();
  });
  
  useHotkeys('ctrl+h', () => {
    setKeyboardShortcutsDialogOpen(true);
  });
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
        <span className="ml-2">Loading error logs...</span>
      </div>
    );
  }
  
  // Apply filters to error logs
  const filteredLogs = applyFilters();
  
  // Calculate stats
  useEffect(() => {
    if (errorLogs.length > 0) {
      const newErrors = errorLogs.filter(log => log.error_status === 'new').length;
      const inProgressErrors = errorLogs.filter(log => log.error_status === 'in_progress').length;
      const resolvedErrors = errorLogs.filter(log => log.error_status === 'resolved').length;
      const uniqueOrgs = new Set(errorLogs.map(log => log.organization_id)).size;
      
      setErrorStats({
        totalErrors: errorLogs.length,
        newErrors,
        inProgressErrors,
        resolvedErrors,
        organizationCount: uniqueOrgs
      });
    }
  }, [errorLogs]);
  
  return (
    <div className="space-y-4">
      {/* Error Statistics Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Error Log Statistics</CardTitle>
          <CardDescription>Overview of Metakocka integration errors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Errors</span>
                <span className="text-sm font-bold">{errorStats.totalErrors}</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">New</span>
                <span className="text-sm font-bold">{errorStats.newErrors}</span>
              </div>
              <Progress 
                value={errorStats.totalErrors > 0 ? (errorStats.newErrors / errorStats.totalErrors) * 100 : 0} 
                className="h-2 bg-gray-200" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">In Progress</span>
                <span className="text-sm font-bold">{errorStats.inProgressErrors}</span>
              </div>
              <Progress 
                value={errorStats.totalErrors > 0 ? (errorStats.inProgressErrors / errorStats.totalErrors) * 100 : 0} 
                className="h-2 bg-gray-200" 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Resolved</span>
                <span className="text-sm font-bold">{errorStats.resolvedErrors}</span>
              </div>
              <Progress 
                value={errorStats.totalErrors > 0 ? (errorStats.resolvedErrors / errorStats.totalErrors) * 100 : 0} 
                className="h-2 bg-gray-200" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Bulk Actions */}
      {selectedErrorIds.length > 0 && (
        <div className="bg-muted p-2 rounded-md flex justify-between items-center">
          <span className="text-sm">{selectedErrorIds.length} items selected</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkResolutionDialogOpen(true)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Resolved
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}
      
      {/* Actions and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshErrorLogs}
                  disabled={refreshing}
                >
                  {refreshing ? <Spinner size="sm" className="mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh logs (Ctrl+R)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={exportAsCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export to CSV (Ctrl+E)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setKeyboardShortcutsDialogOpen(true)}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Shortcuts
                </Button>
              </TooltipTrigger>
              <TooltipContent>View keyboard shortcuts (Ctrl+H)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search error logs... (Ctrl+F)"
            className="pl-8 w-full sm:w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            ref={searchInputRef}
          />
        </div>
      </div>
      
      {/* Error Logs Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Error Logs</CardTitle>
          <CardDescription>
            {filteredLogs.length} {filteredLogs.length === 1 ? 'error' : 'errors'} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="new">New</TabsTrigger>
              <TabsTrigger value="in_progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px]">
                      <Checkbox 
                        checked={filteredLogs.length > 0 && selectedErrorIds.length === filteredLogs.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedErrorIds(filteredLogs.map(log => log.id));
                          } else {
                            setSelectedErrorIds([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No error logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedErrorIds.includes(log.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedErrorIds([...selectedErrorIds, log.id]);
                              } else {
                                setSelectedErrorIds(selectedErrorIds.filter(id => id !== log.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{log.organization_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{log.entity_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1).replace('_', ' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col max-w-[300px] truncate">
                            <span className="font-medium">{log.error_message}</span>
                            <span className="text-xs text-muted-foreground">{log.error_code}</span>
                          </div>
                        </TableCell>
                        <TableCell>{renderStatusBadge(log.error_status)}</TableCell>
                        <TableCell>{formatDate(log.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openErrorDetails(log)}
                          >
                            <Info className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Error Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
            <DialogDescription>
              View and resolve error information
            </DialogDescription>
          </DialogHeader>
          
          {selectedError && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Organization</h4>
                  <p>{selectedError.organization_name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Status</h4>
                  <div>{renderStatusBadge(selectedError.error_status)}</div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Entity</h4>
                  <p>{selectedError.entity_name} ({selectedError.entity_type})</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Date</h4>
                  <p>{formatDate(selectedError.created_at)}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Error Message</h4>
                <div className="bg-muted p-2 rounded">{selectedError.error_message}</div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Error Code</h4>
                <div className="bg-muted p-2 rounded">{selectedError.error_code}</div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Error Details</h4>
                <pre className="bg-muted p-2 rounded overflow-auto max-h-[200px] text-xs">
                  {selectedError.error_details}
                </pre>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Resolution</h4>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Enter resolution details..."
                  disabled={selectedError.error_status === 'resolved'}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={resolveError}
              disabled={!resolution || selectedError?.error_status === 'resolved'}
            >
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bulk Resolution Dialog */}
      <Dialog open={bulkResolutionDialogOpen} onOpenChange={setBulkResolutionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Multiple Errors</DialogTitle>
            <DialogDescription>
              You are about to resolve {selectedErrorIds.length} error logs.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkResolution">Resolution</Label>
              <Textarea
                id="bulkResolution"
                value={bulkResolution}
                onChange={(e) => setBulkResolution(e.target.value)}
                placeholder="Enter resolution details..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkResolutionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkResolve} disabled={!bulkResolution}>
              Resolve {selectedErrorIds.length} Errors
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={keyboardShortcutsDialogOpen} onOpenChange={setKeyboardShortcutsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Use these shortcuts to improve your workflow
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Ctrl+F</div>
              <div className="text-sm">Focus search input</div>
              
              <div className="text-sm font-medium">Ctrl+R</div>
              <div className="text-sm">Refresh error logs</div>
              
              <div className="text-sm font-medium">Ctrl+E</div>
              <div className="text-sm">Export as CSV</div>
              
              <div className="text-sm font-medium">Ctrl+H</div>
              <div className="text-sm">Show this help dialog</div>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setKeyboardShortcutsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
