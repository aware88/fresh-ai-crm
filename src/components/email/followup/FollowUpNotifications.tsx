'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { EmailFollowup } from '@/lib/email/follow-up-service';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface FollowUpNotificationsProps {
  className?: string;
  showBadge?: boolean;
  onFollowUpClick?: (followup: EmailFollowup) => void;
}

export default function FollowUpNotifications({
  className,
  showBadge = true,
  onFollowUpClick
}: FollowUpNotificationsProps) {
  const { data: session } = useSession();
  const [dueFollowups, setDueFollowups] = useState<EmailFollowup[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadDueFollowups();
      // Refresh every minute
      const interval = setInterval(loadDueFollowups, 60000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const loadDueFollowups = async () => {
    try {
      const response = await fetch('/api/email/followups?due_only=true');
      if (response.ok) {
        const data = await response.json();
        setDueFollowups(data.followups);
      }
    } catch (error) {
      console.error('Error loading due follow-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowupAction = async (followupId: string, action: string) => {
    try {
      const response = await fetch(`/api/email/followups/${followupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        await loadDueFollowups();
        toast({
          title: 'Success',
          description: `Follow-up ${action}d successfully`
        });
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

  const getUrgencyColor = (status: string, dueAt: string) => {
    const now = new Date();
    const due = new Date(dueAt);
    const hoursOverdue = (now.getTime() - due.getTime()) / (1000 * 60 * 60);

    if (status === 'overdue') {
      if (hoursOverdue > 24) return 'text-red-600 bg-red-50';
      return 'text-orange-600 bg-orange-50';
    }
    return 'text-blue-600 bg-blue-50';
  };

  const overdueCount = dueFollowups.filter(f => f.status === 'overdue').length;
  const dueCount = dueFollowups.filter(f => f.status === 'due').length;
  const totalCount = dueFollowups.length;

  if (loading) {
    return (
      <Button variant="ghost" size="sm" className={cn('relative', className)} disabled>
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn('relative', className)}
        >
          <Bell className={cn(
            'h-4 w-4',
            totalCount > 0 && 'text-blue-600'
          )} />
          
          {showBadge && totalCount > 0 && (
            <Badge 
              variant={overdueCount > 0 ? 'destructive' : 'secondary'}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {totalCount > 99 ? '99+' : totalCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Follow-up Reminders</h3>
            {totalCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {totalCount} pending
              </Badge>
            )}
          </div>
          
          {totalCount > 0 && (
            <div className="flex gap-4 mt-2 text-xs text-gray-600">
              {overdueCount > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-600" />
                  {overdueCount} overdue
                </span>
              )}
              {dueCount > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-600" />
                  {dueCount} due today
                </span>
              )}
            </div>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          <AnimatePresence>
            {totalCount === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs">No follow-ups due right now.</p>
              </div>
            ) : (
              <div className="divide-y">
                {dueFollowups.map((followup) => (
                  <motion.div
                    key={followup.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline"
                            className={cn(
                              'text-xs px-1 py-0',
                              getUrgencyColor(followup.status, followup.follow_up_due_at)
                            )}
                          >
                            {followup.status === 'overdue' ? (
                              <>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overdue
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3 mr-1" />
                                Due
                              </>
                            )}
                          </Badge>
                        </div>
                        
                        <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                          {followup.original_subject}
                        </h4>
                        
                        <p className="text-xs text-gray-600 truncate">
                          To: {followup.original_recipients.join(', ')}
                        </p>
                        
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(followup.follow_up_due_at), { addSuffix: true })}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFollowupAction(followup.id!, 'complete')}
                          className="h-6 px-2 text-xs"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                        
                        {onFollowUpClick && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              onFollowUpClick(followup);
                              setOpen(false);
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {totalCount > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setOpen(false);
                // Navigate to follow-ups tab - this should be handled by parent component
                if (onFollowUpClick) {
                  onFollowUpClick(null as any);
                }
              }}
            >
              View All Follow-ups
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
