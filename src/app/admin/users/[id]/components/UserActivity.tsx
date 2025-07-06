'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  created_at: string;
}

interface UserActivityProps {
  userId: string;
}

export default function UserActivity({ userId }: UserActivityProps) {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivityLogs = async (pageNum = 1, append = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/activity?page=${pageNum}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      
      const data = await response.json();
      
      if (append) {
        setActivityLogs(prev => [...prev, ...data.logs]);
      } else {
        setActivityLogs(data.logs || []);
      }
      
      setHasMore(data.has_more || false);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
  }, [userId]);

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchActivityLogs(page + 1, true);
    }
  };

  const handleRefresh = () => {
    fetchActivityLogs(1, false);
  };

  function getActionBadgeColor(action: string): string {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'login':
        return 'bg-purple-100 text-purple-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  function formatEntityType(entityType: string): string {
    return entityType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  function formatDetails(details: Record<string, any>): string {
    if (!details) return '';
    
    try {
      // Format details based on action and entity type
      if (typeof details === 'object') {
        const formattedDetails = [];
        
        for (const [key, value] of Object.entries(details)) {
          if (key === 'changes' && typeof value === 'object') {
            formattedDetails.push('Changed: ' + Object.keys(value).join(', '));
          } else if (key !== 'id' && key !== 'user_id') {
            formattedDetails.push(`${key}: ${value}`);
          }
        }
        
        return formattedDetails.join(', ');
      }
      
      return String(details);
    } catch (e) {
      return 'Unable to format details';
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            Recent activity for this user across the system.
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && activityLogs.length === 0 ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        ) : activityLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No activity logs found for this user.
          </div>
        ) : (
          <div className="space-y-4">
            {activityLogs.map((log) => (
              <div 
                key={log.id} 
                className="border rounded-md p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getActionBadgeColor(log.action)}>
                    {log.action.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {formatDate(log.created_at)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {formatEntityType(log.entity_type)}
                    {log.entity_id && ` (ID: ${log.entity_id.substring(0, 8)}...)`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDetails(log.details)}
                  </p>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={handleLoadMore} 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
