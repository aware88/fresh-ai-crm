'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Calendar,
  Send,
  Eye,
  Timer,
  MoreHorizontal,
  TrendingUp,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import { EmailFollowup, FollowupStats } from '@/lib/email/follow-up-service';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';

interface FollowUpDashboardProps {
  className?: string;
}

export default function FollowUpDashboard({ className }: FollowUpDashboardProps) {
  const { data: session } = useSession();
  const [followups, setFollowups] = useState<EmailFollowup[]>([]);
  const [stats, setStats] = useState<FollowupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('due');

  useEffect(() => {
    if (session?.user?.id) {
      loadFollowups();
      loadStats();
    }
  }, [session, activeTab]);

  const loadFollowups = async () => {
    try {
      const params = new URLSearchParams();
      
      switch (activeTab) {
        case 'due':
          params.append('due_only', 'true');
          break;
        case 'pending':
          params.append('status', 'pending');
          break;
        case 'overdue':
          params.append('status', 'overdue');
          break;
        case 'completed':
          params.append('status', 'completed');
          params.append('limit', '20');
          break;
        case 'all':
          params.append('limit', '50');
          break;
      }

      const response = await fetch(`/api/email/followups?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFollowups(data.followups);
      }
    } catch (error) {
      console.error('Error loading follow-ups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load follow-ups',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/email/followups/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFollowupAction = async (followupId: string, action: string, additionalData?: any) => {
    try {
      const response = await fetch(`/api/email/followups/${followupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...additionalData })
      });

      if (response.ok) {
        await loadFollowups();
        await loadStats();
        
        toast({
          title: 'Success',
          description: `Follow-up ${action}d successfully`
        });
      } else {
        throw new Error('Failed to update follow-up');
      }
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to update follow-up',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'destructive';
      case 'due':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'completed':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Follow-ups</p>
                  <p className="text-2xl font-bold">{stats.total_followups}</p>
                </div>
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Due Today</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.due_followups}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue_followups}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Rate</p>
                  <p className="text-2xl font-bold text-green-600">{stats.response_rate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Follow-ups List */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Follow-ups
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 flex-shrink-0">
              <TabsTrigger value="due" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                Due ({stats?.due_followups || 0})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600">
                Overdue ({stats?.overdue_followups || 0})
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-600">
                Pending ({stats?.pending_followups || 0})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600">
                Completed
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600">
                All
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0 flex-1 min-h-0">
              <div className="divide-y h-full overflow-y-auto">
                <AnimatePresence>
                  {followups.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No follow-ups found</p>
                      <p className="text-sm">
                        {activeTab === 'due' && 'No follow-ups are due right now.'}
                        {activeTab === 'overdue' && 'Great! No overdue follow-ups.'}
                        {activeTab === 'pending' && 'No pending follow-ups.'}
                        {activeTab === 'completed' && 'No completed follow-ups yet.'}
                        {activeTab === 'all' && 'Start tracking your email follow-ups.'}
                      </p>
                    </div>
                  ) : (
                    followups.map((followup) => (
                      <motion.div
                        key={followup.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900 truncate">
                                {followup.original_subject}
                              </h3>
                              <Badge variant={getStatusColor(followup.status)}>
                                {followup.status}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getPriorityColor(followup.priority)}`}
                              >
                                {followup.priority}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>To: {followup.original_recipients.join(', ')}</span>
                              <span>•</span>
                              <span>
                                Due: {format(new Date(followup.follow_up_due_at), 'MMM dd, yyyy')}
                              </span>
                              <span>•</span>
                              <span>
                                {formatDistanceToNow(new Date(followup.follow_up_due_at), { addSuffix: true })}
                              </span>
                            </div>

                            {followup.context_summary && (
                              <p className="text-sm text-gray-600">
                                {followup.context_summary}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {followup.status !== 'completed' && followup.status !== 'cancelled' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleFollowupAction(followup.id!, 'complete')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                                
                                <Button
                                  size="sm"
                                  onClick={() => handleFollowupAction(followup.id!, 'sent')}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Mark Sent
                                </Button>
                              </>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleFollowupAction(followup.id!, 'snooze', {
                                    snoozeUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                                  })}
                                >
                                  <Timer className="h-4 w-4 mr-2" />
                                  Snooze 1 Day
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleFollowupAction(followup.id!, 'snooze', {
                                    snoozeUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                                  })}
                                >
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Snooze 1 Week
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleFollowupAction(followup.id!, 'cancel')}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
