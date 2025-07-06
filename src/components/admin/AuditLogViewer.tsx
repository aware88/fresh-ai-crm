"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, RefreshCw, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  previous_state: Record<string, any> | null;
  new_state: Record<string, any> | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AuditLogViewerProps {
  organizationId?: string;
}

export default function AuditLogViewer({ organizationId }: AuditLogViewerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  
  // Filter state
  const [actionType, setActionType] = useState<string>('');
  const [entityType, setEntityType] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Data state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Action type options
  const actionTypes = ['create', 'update', 'delete', 'login', 'logout', 'export'];
  
  // Entity type options
  const entityTypes = [
    'organization_subscriptions', 
    'organization_members', 
    'organizations', 
    'webhook_configurations',
    'users'
  ];
  
  // Load audit logs
  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (organizationId) {
        params.append('organizationId', organizationId);
      }
      
      if (actionType) {
        params.append('actionType', actionType);
      }
      
      if (entityType) {
        params.append('entityType', entityType);
      }
      
      if (userId) {
        params.append('userId', userId);
      }
      
      if (fromDate) {
        params.append('fromDate', fromDate.toISOString());
      }
      
      if (toDate) {
        params.append('toDate', toDate.toISOString());
      }
      
      if (searchTerm) {
        params.append('entityId', searchTerm);
      }
      
      params.append('limit', limit.toString());
      params.append('offset', ((page - 1) * limit).toString());
      
      // Fetch audit logs
      const response = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }
      
      const data = await response.json();
      setLogs(data.logs);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error loading audit logs:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Load logs on initial render and when filters change
  useEffect(() => {
    loadAuditLogs();
  }, [page, limit, organizationId]);
  
  // Apply filters
  const applyFilters = () => {
    setPage(1); // Reset to first page when applying filters
    loadAuditLogs();
  };
  
  // Reset filters
  const resetFilters = () => {
    setActionType('');
    setEntityType('');
    setUserId('');
    setFromDate(undefined);
    setToDate(undefined);
    setSearchTerm('');
    setPage(1);
    loadAuditLogs();
  };
  
  // Export logs as CSV
  const exportLogs = () => {
    // Convert logs to CSV format
    const headers = [
      'ID', 'User ID', 'Organization ID', 'Action Type', 'Entity Type',
      'Entity ID', 'IP Address', 'Created At'
    ];
    
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.user_id || '',
        log.organization_id || '',
        log.action_type,
        log.entity_type,
        log.entity_id || '',
        log.ip_address || '',
        log.created_at
      ].join(','))
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // View log details
  const viewLogDetails = (logId: string) => {
    router.push(`/dashboard/admin/audit-logs/${logId}`);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(total / limit);
  
  // Generate pagination items
  const paginationItems = () => {
    const items = [];
    
    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            if (page > 1) setPage(page - 1);
          }} 
          aria-disabled={page === 1}
        />
      </PaginationItem>
    );
    
    // First page
    items.push(
      <PaginationItem key="1">
        <PaginationLink 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            setPage(1);
          }}
          isActive={page === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Ellipsis if needed
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Pages around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              setPage(i);
            }}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Ellipsis if needed
    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Last page if there are more than 1 page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              setPage(totalPages);
            }}
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            if (page < totalPages) setPage(page + 1);
          }} 
          aria-disabled={page === totalPages}
        />
      </PaginationItem>
    );
    
    return items;
  };
  
  // Get action type badge color
  const getActionTypeBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'default';
      case 'update':
        return 'outline';
      case 'delete':
        return 'destructive';
      case 'login':
        return 'secondary';
      case 'logout':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          View and search security audit logs for system activities
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Action Type</label>
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  {actionTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Entity Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Entity Type</label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Entities</SelectItem>
                  {entityTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* User ID Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              <Input 
                placeholder="Filter by User ID" 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* From Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* To Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Entity ID / Search Term */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Entity ID / Search</label>
              <div className="flex">
                <Input 
                  placeholder="Search by Entity ID" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="rounded-r-none"
                />
                <Button 
                  type="button" 
                  onClick={applyFilters}
                  className="rounded-l-none"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
            
            <div className="space-x-2">
              <Button 
                variant="outline" 
                onClick={loadAuditLogs}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              
              <Button 
                variant="outline" 
                onClick={exportLogs}
                disabled={logs.length === 0 || loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {/* Audit logs table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow 
                    key={log.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => viewLogDetails(log.id)}
                  >
                    <TableCell className="whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionTypeBadgeVariant(log.action_type)}>
                        {log.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.entity_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.entity_id ? log.entity_id.substring(0, 8) + '...' : 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.user_id ? log.user_id.substring(0, 8) + '...' : 'System'}
                    </TableCell>
                    <TableCell>
                      {log.ip_address || 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {logs.length} of {total} logs
        </div>
        
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              {paginationItems()}
            </PaginationContent>
          </Pagination>
        )}
      </CardFooter>
    </Card>
  );
}
