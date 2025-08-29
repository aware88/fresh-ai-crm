'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Loader2,
  Mail,
  TrendingUp,
  X
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface EmailLearningJobProgress {
  jobId: string;
  userId: string;
  organizationId?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  totalEmails: number;
  processedEmails: number;
  successfulEmails: number;
  failedEmails: number;
  skippedEmails: number;
  startTime: Date | string;
  endTime?: Date | string;
  errorMessage?: string;
  results?: any;
}

interface EmailLearningProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
}

export default function EmailLearningProgressDialog({ 
  isOpen, 
  onClose, 
  jobId 
}: EmailLearningProgressDialogProps) {
  const { toast } = useToast();
  const [job, setJob] = useState<EmailLearningJobProgress | null>(null);
  const [loading, setLoading] = useState(false);

  // Poll for job progress
  useEffect(() => {
    if (!isOpen || !jobId) return;

    let interval: NodeJS.Timeout;
    
    const fetchJobProgress = async () => {
      try {
        const response = await fetch(`/api/email/learning/jobs/${jobId}`);
        if (response.ok) {
          const data = await response.json();
          setJob(data.job);

          // Stop polling if job is completed or failed
          if (data.job.status === 'completed' || data.job.status === 'failed') {
            if (interval) clearInterval(interval);
            
            // Show completion toast
            if (data.job.status === 'completed') {
              toast({
                title: "Email Learning Complete!",
                description: `Successfully processed ${data.job.successfulEmails} emails`,
                variant: "success"
              });
            } else {
              toast({
                title: "Email Learning Failed",
                description: data.job.errorMessage || "Unknown error occurred",
                variant: "destructive"
              });
            }
          }
        } else {
          console.error('Failed to fetch job progress');
          if (interval) clearInterval(interval);
        }
      } catch (error) {
        console.error('Error fetching job progress:', error);
        if (interval) clearInterval(interval);
      }
    };

    // Initial fetch
    fetchJobProgress();

    // Poll every 2 seconds if job is active
    interval = setInterval(fetchJobProgress, 2000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, jobId, toast]);

  const getStatusIcon = () => {
    if (!job) return <Loader2 className="h-5 w-5 animate-spin" />;
    
    switch (job.status) {
      case 'queued':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    if (!job) return <Badge variant="secondary">Loading...</Badge>;
    
    switch (job.status) {
      case 'queued':
        return <Badge variant="secondary">Queued</Badge>;
      case 'processing':
        return <Badge variant="default">Processing</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getProgressPercentage = () => {
    if (!job || job.totalEmails === 0) return 0;
    return Math.round((job.processedEmails / job.totalEmails) * 100);
  };

  const formatDuration = (startTime: Date | string, endTime?: Date | string) => {
    try {
      const start = startTime instanceof Date ? startTime : new Date(startTime);
      const end = endTime ? (endTime instanceof Date ? endTime : new Date(endTime)) : new Date();
      
      // Validate that we have valid dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Unknown duration';
      }
      
      const duration = end.getTime() - start.getTime();
      const seconds = Math.floor(duration / 1000);
      const minutes = Math.floor(seconds / 60);
      
      if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      }
      return `${seconds}s`;
    } catch (error) {
      console.error('Error formatting duration:', error);
      return 'Unknown duration';
    }
  };

  const handleClose = () => {
    onClose();
    setJob(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <DialogTitle>Email Learning Progress</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            AI is analyzing your email patterns to improve response quality
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon()}
                  <CardTitle className="text-sm">Status</CardTitle>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {job ? (
                <div className="space-y-3">
                  {/* Progress Bar */}
                  {job.status === 'processing' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing emails...</span>
                        <span>{getProgressPercentage()}%</span>
                      </div>
                      <Progress value={getProgressPercentage()} className="w-full" />
                    </div>
                  )}

                  {/* Email Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{job.totalEmails}</div>
                        <div className="text-gray-500">Total Emails</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{job.processedEmails}</div>
                        <div className="text-gray-500">Processed</div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Stats */}
                  {(job.status === 'completed' || job.status === 'failed') && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-medium text-green-700">{job.successfulEmails}</div>
                        <div className="text-green-600">Success</div>
                      </div>
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="font-medium text-red-700">{job.failedEmails}</div>
                        <div className="text-red-600">Failed</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-medium text-gray-700">{job.skippedEmails}</div>
                        <div className="text-gray-600">Skipped</div>
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>
                      Duration: {formatDuration(job.startTime, job.endTime)}
                    </span>
                  </div>

                  {/* Error Message */}
                  {job.status === 'failed' && job.errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        <div className="text-sm text-red-700">
                          <div className="font-medium">Error:</div>
                          <div>{job.errorMessage}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading job details...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            {job?.status === 'completed' && (
              <Button onClick={handleClose} className="w-full">
                View Results
              </Button>
            )}
            {job?.status === 'failed' && (
              <Button onClick={handleClose} variant="outline" className="w-full">
                Close
              </Button>
            )}
            {(job?.status === 'processing' || job?.status === 'queued') && (
              <Button onClick={handleClose} variant="outline" className="w-full">
                Run in Background
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
