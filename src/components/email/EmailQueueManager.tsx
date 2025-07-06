import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

// Define types
interface Email {
  subject: string;
  content: string;
  from: string;
  to: string;
}

interface QueueItem {
  id: string;
  email_id: string;
  contact_id: string;
  status: string;
  priority: string;
  processing_attempts: number;
  last_processed_at: string;
  error_message?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  created_by?: string;
  organization_id?: string;
  requires_manual_review: boolean;
  assigned_to?: string;
  due_at?: string;
  emails: Email;
}

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getVariant = () => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'review':
      case 'requires_review':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant() as any}>
      {status.replace('_', ' ')}
    </Badge>
  );
};

// Priority badge component
const PriorityBadge = ({ priority }: { priority: string }) => {
  const getVariant = () => {
    switch (priority) {
      case 'low':
        return 'outline';
      case 'medium':
        return 'secondary';
      case 'high':
        return 'default';
      case 'urgent':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant() as any}>
      {priority}
    </Badge>
  );
};

export default function EmailQueueManager() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { toast } = useToast();

  // Fetch queue items
  const fetchQueueItems = async () => {
    setLoading(true);
    try {
      let url = '/api/email-queue';
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch queue items');
      }
      
      const data = await response.json();
      setQueueItems(data);
    } catch (error) {
      console.error('Error fetching queue items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch email queue items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Process next batch of emails
  const processNextBatch = async () => {
    try {
      const response = await fetch('/api/email-queue/process-with-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchSize: 5,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process emails');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Processing Complete',
        description: `Processed ${result.processed} emails (${result.succeeded} completed, ${result.failed} failed, ${result.requiresReview} require review, ${result.withRecommendations} with recommendations)`,
      });
      
      // Refresh the queue
      fetchQueueItems();
    } catch (error) {
      console.error('Error processing emails:', error);
      toast({
        title: 'Error',
        description: 'Failed to process emails',
        variant: 'destructive',
      });
    }
  };

  // Reset failed items
  const resetFailedItems = async () => {
    try {
      const response = await fetch('/api/email-queue/reset-failed', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset failed items');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Reset Complete',
        description: `Reset ${result.count} failed items to pending status`,
      });
      
      // Refresh the queue
      fetchQueueItems();
    } catch (error) {
      console.error('Error resetting failed items:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset failed items',
        variant: 'destructive',
      });
    }
  };

  // Clean up old items
  const cleanupOldItems = async () => {
    try {
      const response = await fetch('/api/email-queue/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          daysToKeep: 30,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to clean up old items');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Cleanup Complete',
        description: `Removed ${result.count} old completed items`,
      });
      
      // Refresh the queue
      fetchQueueItems();
    } catch (error) {
      console.error('Error cleaning up old items:', error);
      toast({
        title: 'Error',
        description: 'Failed to clean up old items',
        variant: 'destructive',
      });
    }
  };

  // Load queue items on component mount and when filters change
  useEffect(() => {
    fetchQueueItems();
  }, [statusFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Queue</h2>
          <p className="text-muted-foreground">
            Manage and process emails in the queue
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={processNextBatch}>Process Next Batch</Button>
          <Button variant="outline" onClick={resetFailedItems}>
            Reset Failed
          </Button>
          <Button variant="outline" onClick={cleanupOldItems}>
            Cleanup Old
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Status:</span>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="requires_review">Requires Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Priority:</span>
          <Select
            value={priorityFilter}
            onValueChange={setPriorityFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="ghost" onClick={fetchQueueItems}>
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="review">Requires Review</TabsTrigger>
        </TabsList>
        
        <TabsContent value="queue" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Last Processed</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      </TableRow>
                    ))
                  ) : queueItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No emails in queue
                      </TableCell>
                    </TableRow>
                  ) : (
                    queueItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.emails?.subject || 'No subject'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={item.priority} />
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {item.last_processed_at 
                            ? formatDistanceToNow(new Date(item.last_processed_at), { addSuffix: true })
                            : 'Never'}
                        </TableCell>
                        <TableCell>{item.processing_attempts}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // View email details
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="review" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      </TableRow>
                    ))
                  ) : (
                    queueItems
                      .filter(item => item.status === 'requires_review' || item.status === 'review')
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.emails?.subject || 'No subject'}
                          </TableCell>
                          <TableCell>{item.emails?.from || 'Unknown'}</TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // View email for review
                                }}
                              >
                                Review
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600"
                                onClick={() => {
                                  // Approve email
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => {
                                  // Reject email
                                }}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                  {!loading && queueItems.filter(item => 
                    item.status === 'requires_review' || item.status === 'review'
                  ).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No emails requiring review
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
