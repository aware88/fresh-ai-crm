'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Calendar,
  Send
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { EmailFollowup } from '@/lib/email/follow-up-service';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface FollowUpIndicatorProps {
  emailId: string;
  emailSubject: string;
  emailRecipients: string[];
  sentAt?: Date;
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

export default function FollowUpIndicator({
  emailId,
  emailSubject,
  emailRecipients,
  sentAt,
  className,
  showActions = true,
  compact = false
}: FollowUpIndicatorProps) {
  const [followup, setFollowup] = useState<EmailFollowup | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadFollowup();
  }, [emailId]);

  const loadFollowup = async () => {
    try {
      // Check if there's already a follow-up for this email
      const response = await fetch(`/api/email/followups?emailId=${emailId}`);
      if (response.ok) {
        const data = await response.json();
        const emailFollowup = data.followups.find((f: EmailFollowup) => f.email_id === emailId);
        setFollowup(emailFollowup || null);
      }
    } catch (error) {
      console.error('Error loading follow-up:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFollowup = async (days: number = 3) => {
    setCreating(true);
    try {
      const response = await fetch('/api/email/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId,
          originalSubject: emailSubject,
          originalRecipients: emailRecipients,
          originalSentAt: sentAt || new Date(),
          followUpDays: days,
          priority: 'medium',
          followUpType: 'manual',
          contextSummary: `Manual follow-up created for email: ${emailSubject}`,
          followUpReason: 'No response received'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFollowup(data.followup);
        toast({
          title: 'Follow-up created',
          description: `Will remind you in ${days} days if no response is received`
        });
      } else {
        throw new Error('Failed to create follow-up');
      }
    } catch (error) {
      console.error('Error creating follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to create follow-up',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const updateFollowupStatus = async (action: string) => {
    if (!followup?.id) return;

    try {
      const response = await fetch(`/api/email/followups/${followup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        await loadFollowup();
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle className="h-3 w-3" />;
      case 'due':
        return <Clock className="h-3 w-3" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Calendar className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'destructive';
      case 'due':
        return 'secondary';
      case 'completed':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string, dueAt: string) => {
    switch (status) {
      case 'overdue':
        return `Overdue ${formatDistanceToNow(new Date(dueAt), { addSuffix: true })}`;
      case 'due':
        return `Due ${formatDistanceToNow(new Date(dueAt), { addSuffix: true })}`;
      case 'completed':
        return 'Response received';
      case 'pending':
        return `Due ${formatDistanceToNow(new Date(dueAt), { addSuffix: true })}`;
      default:
        return 'Follow-up scheduled';
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="animate-pulse bg-gray-200 rounded h-5 w-16"></div>
      </div>
    );
  }

  if (!followup) {
    // No follow-up exists, show create button
    if (!showActions) return null;

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size={compact ? "sm" : "default"}
                variant="outline"
                onClick={() => createFollowup(3)}
                disabled={creating}
                className="h-6 px-2 text-xs"
              >
                {creating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Clock className="h-3 w-3" />
                  </motion.div>
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1" />
                    Follow-up
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create a follow-up reminder for this email</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Follow-up exists, show status
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={getStatusColor(followup.status)}
              className={cn(
                'flex items-center gap-1 cursor-pointer transition-all hover:scale-105',
                compact ? 'text-xs py-0 px-1' : 'text-xs',
                followup.status === 'overdue' && 'animate-pulse'
              )}
            >
              {getStatusIcon(followup.status)}
              {!compact && (
                <span className="capitalize">{followup.status}</span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{getStatusText(followup.status, followup.follow_up_due_at)}</p>
              <p className="text-xs text-gray-500">Priority: {followup.priority}</p>
              {followup.follow_up_reason && (
                <p className="text-xs text-gray-500">Reason: {followup.follow_up_reason}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showActions && followup.status !== 'completed' && followup.status !== 'cancelled' && (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateFollowupStatus('complete')}
                  className="h-6 w-6 p-0"
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark as completed (response received)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateFollowupStatus('sent')}
                  className="h-6 w-6 p-0"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark as sent (follow-up email sent)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
