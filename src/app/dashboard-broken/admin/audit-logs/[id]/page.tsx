"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, UserIcon, Building, Globe, Clock, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

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

interface AuditLogDetailProps {
  params: {
    id: string;
  };
}

export default function AuditLogDetail({ params }: AuditLogDetailProps) {
  const router = useRouter();
  const [auditLog, setAuditLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAuditLog = async () => {
      try {
        const response = await fetch(`/api/admin/audit-logs/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Audit log not found');
          }
          throw new Error('Failed to fetch audit log');
        }
        
        const data = await response.json();
        setAuditLog(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching audit log:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuditLog();
  }, [params.id]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP p');
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
  
  // Format entity type for display
  const formatEntityType = (entityType: string) => {
    return entityType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };
  
  // Render JSON data with syntax highlighting
  const renderJson = (data: Record<string, any> | null) => {
    if (!data) return <p className="text-muted-foreground italic">No data</p>;
    
    return (
      <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };
  
  // Render changes between previous and new state
  const renderChanges = () => {
    if (!auditLog?.previous_state || !auditLog?.new_state) {
      return <p className="text-muted-foreground italic">No change data available</p>;
    }
    
    const changes: { key: string; previous: any; current: any }[] = [];
    
    // Find all keys in either object
    const allKeys = new Set([
      ...Object.keys(auditLog.previous_state),
      ...Object.keys(auditLog.new_state)
    ]);
    
    // Compare values
    allKeys.forEach(key => {
      const previousValue = auditLog.previous_state?.[key];
      const newValue = auditLog.new_state?.[key];
      
      // Only add if values are different
      if (JSON.stringify(previousValue) !== JSON.stringify(newValue)) {
        changes.push({
          key,
          previous: previousValue,
          current: newValue
        });
      }
    });
    
    if (changes.length === 0) {
      return <p className="text-muted-foreground italic">No changes detected</p>;
    }
    
    return (
      <div className="space-y-4">
        {changes.map((change, index) => (
          <div key={index} className="border rounded-md p-4">
            <h4 className="font-medium mb-2">{change.key}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Previous Value:</p>
                <pre className="bg-muted p-2 rounded-md overflow-auto max-h-32 text-xs">
                  {change.previous === undefined ? 'undefined' : JSON.stringify(change.previous, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Value:</p>
                <pre className="bg-muted p-2 rounded-md overflow-auto max-h-32 text-xs">
                  {change.current === undefined ? 'undefined' : JSON.stringify(change.current, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }
  
  if (error || !auditLog) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load audit log details</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error || 'Audit log not found'}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard/admin/audit-logs')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Audit Logs
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-6 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => router.push('/dashboard/admin/audit-logs')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Audit Logs
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log Details</h1>
          <p className="text-muted-foreground">
            Detailed information about this audit log entry
          </p>
        </div>
      </div>
      
      {/* Overview card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Audit Event Overview
          </CardTitle>
          <CardDescription>
            Basic information about this audit event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Event details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Event Type</h3>
                <div className="mt-1 flex items-center">
                  <Badge variant={getActionTypeBadgeVariant(auditLog.action_type)} className="text-sm">
                    {auditLog.action_type.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Entity Type</h3>
                <p className="mt-1">{formatEntityType(auditLog.entity_type)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Entity ID</h3>
                <p className="mt-1 font-mono text-sm">{auditLog.entity_id || 'N/A'}</p>
              </div>
            </div>
            
            {/* User details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">User</h3>
                <div className="mt-1 flex items-center">
                  <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-mono text-sm">{auditLog.user_id || 'System Action'}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Organization</h3>
                <div className="mt-1 flex items-center">
                  <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-mono text-sm">{auditLog.organization_id || 'N/A'}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">IP Address</h3>
                <div className="mt-1 flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{auditLog.ip_address || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {/* Time details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Timestamp</h3>
                <div className="mt-1 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{formatDate(auditLog.created_at)}</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">User Agent</h3>
                <p className="mt-1 text-xs text-muted-foreground truncate max-w-md">
                  {auditLog.user_agent || 'N/A'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Audit Log ID</h3>
                <p className="mt-1 font-mono text-xs">{auditLog.id}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Detailed data tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Information</CardTitle>
          <CardDescription>
            View the detailed data associated with this audit event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="changes">
            <TabsList className="mb-4">
              <TabsTrigger value="changes">Changes</TabsTrigger>
              <TabsTrigger value="previous">Previous State</TabsTrigger>
              <TabsTrigger value="new">New State</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>
            
            <TabsContent value="changes" className="space-y-4">
              <h3 className="text-lg font-medium">Changes Made</h3>
              <Separator className="my-2" />
              {renderChanges()}
            </TabsContent>
            
            <TabsContent value="previous" className="space-y-4">
              <h3 className="text-lg font-medium">Previous State</h3>
              <Separator className="my-2" />
              {renderJson(auditLog.previous_state)}
            </TabsContent>
            
            <TabsContent value="new" className="space-y-4">
              <h3 className="text-lg font-medium">New State</h3>
              <Separator className="my-2" />
              {renderJson(auditLog.new_state)}
            </TabsContent>
            
            <TabsContent value="metadata" className="space-y-4">
              <h3 className="text-lg font-medium">Metadata</h3>
              <Separator className="my-2" />
              {renderJson(auditLog.metadata)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
