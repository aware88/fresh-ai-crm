'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  X, 
  Clock,
  Mail,
  TrendingUp
} from 'lucide-react';

interface CompletedJob {
  jobId: string;
  status: 'completed' | 'failed';
  totalEmails: number;
  successfulEmails: number;
  failedEmails: number;
  endTime: Date;
  errorMessage?: string;
  results?: any;
}

export default function EmailLearningNotificationBanner() {
  const { data: session } = useSession();
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [dismissedJobs, setDismissedJobs] = useState<Set<string>>(new Set());

  // Only check for jobs when explicitly requested
  useEffect(() => {
    if (!session?.user?.id) return;

    // Completely disable automatic polling
    // Only check for jobs when the user is actively using email learning features
    
    // This component will still display notifications when they appear,
    // but won't automatically poll for them
    
    return () => {};
  }, [session, dismissedJobs]);

  const dismissJob = (jobId: string) => {
    setDismissedJobs(prev => new Set([...prev, jobId]));
    setCompletedJobs(prev => prev.filter(job => job.jobId !== jobId));
  };

  const formatDuration = (job: CompletedJob) => {
    if (!job.results?.processingTime) return '';
    const seconds = Math.floor(job.results.processingTime / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  if (completedJobs.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {completedJobs.map(job => (
        <Card 
          key={job.jobId}
          className={`shadow-lg border-2 animate-in slide-in-from-right-full duration-300 ${
            job.status === 'completed' 
              ? 'border-green-200 bg-green-50' 
              : 'border-red-200 bg-red-50'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {job.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {job.status === 'completed' 
                      ? 'Email Learning Complete!' 
                      : 'Email Learning Failed'
                    }
                  </div>
                  
                  <div className="text-xs text-gray-600 mt-1">
                    {job.status === 'completed' ? (
                      <div className="space-y-1">
                        <div>
                          Successfully processed {job.successfulEmails} of {job.totalEmails} emails
                        </div>
                        {job.failedEmails > 0 && (
                          <div className="text-amber-600">
                            {job.failedEmails} emails failed processing
                          </div>
                        )}
                        {formatDuration(job) && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Completed in {formatDuration(job)}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {job.errorMessage || 'Unknown error occurred'}
                      </div>
                    )}
                  </div>

                  {job.status === 'completed' && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Mail className="h-3 w-3 mr-1" />
                        {job.totalEmails} emails
                      </Badge>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {job.successfulEmails} processed
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissJob(job.jobId)}
                className="h-6 w-6 p-0 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
