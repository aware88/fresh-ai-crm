"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface JobResult {
  processed: number;
  errors: number;
}

interface JobResults {
  renewalReminders?: JobResult;
  trialEndingReminders?: JobResult;
  paymentFailureNotifications?: JobResult;
}

export default function NotificationJobRunner() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<JobResults | null>(null);
  const [selectedJobs, setSelectedJobs] = useState<string[]>(['all']);

  const jobOptions = [
    { id: 'all', label: 'All Jobs' },
    { id: 'renewal_reminders', label: 'Subscription Renewal Reminders' },
    { id: 'trial_ending_reminders', label: 'Trial Ending Reminders' },
    { id: 'payment_failure_notifications', label: 'Payment Failure Notifications' },
  ];

  const runJobs = async () => {
    setLoading(true);
    setResults(null);
    
    try {
      const response = await fetch('/api/jobs/run-notification-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobs: selectedJobs }),
      });

      if (!response.ok) {
        throw new Error('Failed to run notification jobs');
      }

      const data = await response.json();
      setResults(data.results);
      
      toast({
        title: 'Jobs Completed',
        description: `Processed ${data.totals.processed} notifications with ${data.totals.errors} errors`,
        variant: data.totals.errors > 0 ? 'destructive' : 'default',
      });
    } catch (error) {
      console.error('Error running notification jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to run notification jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelection = (jobId: string) => {
    setSelectedJobs(prev => {
      // Handle the "All Jobs" special case
      if (jobId === 'all') {
        return prev.includes('all') ? [] : ['all'];
      }
      
      // If "All Jobs" is currently selected, remove it when selecting a specific job
      const withoutAll = prev.filter(id => id !== 'all');
      
      // Toggle the selected job
      const newSelection = prev.includes(jobId)
        ? withoutAll.filter(id => id !== jobId)
        : [...withoutAll, jobId];
        
      return newSelection.length === 0 ? ['all'] : newSelection;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Notification Jobs</CardTitle>
        <CardDescription>
          Manually trigger notification jobs to send subscription-related notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-2">
            {jobOptions.map((job) => (
              <div key={job.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`job-${job.id}`} 
                  checked={selectedJobs.includes(job.id)}
                  onCheckedChange={() => handleJobSelection(job.id)}
                />
                <label 
                  htmlFor={`job-${job.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {job.label}
                </label>
              </div>
            ))}
          </div>

          {results && (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-medium">Results:</h3>
              
              {results.renewalReminders && (
                <div className="text-sm border rounded-md p-3">
                  <div className="flex items-center">
                    <span className="font-medium">Renewal Reminders:</span>
                    {results.renewalReminders.errors > 0 ? (
                      <AlertCircle className="h-4 w-4 ml-2 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                    )}
                  </div>
                  <p>Processed: {results.renewalReminders.processed}</p>
                  <p>Errors: {results.renewalReminders.errors}</p>
                </div>
              )}
              
              {results.trialEndingReminders && (
                <div className="text-sm border rounded-md p-3">
                  <div className="flex items-center">
                    <span className="font-medium">Trial Ending Reminders:</span>
                    {results.trialEndingReminders.errors > 0 ? (
                      <AlertCircle className="h-4 w-4 ml-2 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                    )}
                  </div>
                  <p>Processed: {results.trialEndingReminders.processed}</p>
                  <p>Errors: {results.trialEndingReminders.errors}</p>
                </div>
              )}
              
              {results.paymentFailureNotifications && (
                <div className="text-sm border rounded-md p-3">
                  <div className="flex items-center">
                    <span className="font-medium">Payment Failure Notifications:</span>
                    {results.paymentFailureNotifications.errors > 0 ? (
                      <AlertCircle className="h-4 w-4 ml-2 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                    )}
                  </div>
                  <p>Processed: {results.paymentFailureNotifications.processed}</p>
                  <p>Errors: {results.paymentFailureNotifications.errors}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={runJobs} disabled={loading}>
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Running Jobs...
            </>
          ) : (
            'Run Selected Jobs'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
