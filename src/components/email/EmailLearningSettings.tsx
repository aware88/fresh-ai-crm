'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Mail, 
  Zap, 
  Settings, 
  BarChart3,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  TrendingUp,
  Play,
  Pause,
  Eye
} from 'lucide-react';
import EmailLearningProgressDialog from './EmailLearningProgressDialog';
import AccountSelector from './AccountSelector';
import { useEmailAccounts } from '@/hooks/useEmailAccounts';

interface LearningStatus {
  has_initial_learning: boolean;
  patterns_count: number;
  avg_confidence: number;
  pattern_types: string[];
  last_learning_session: any;
  learning_quality: 'high' | 'medium' | 'low';
}

interface LearningConfig {
  max_emails_to_analyze: number;
  learning_email_types: string[];
  excluded_senders: string[];
  learning_sensitivity: 'conservative' | 'balanced' | 'aggressive';
  minimum_pattern_confidence: number;
  auto_draft_enabled: boolean;
  auto_draft_confidence_threshold: number;
}

export default function EmailLearningSettings() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const { activeAccounts, loading: accountsLoading } = useEmailAccounts();
  
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [learningStatus, setLearningStatus] = useState<LearningStatus | null>(null);
  const [learningConfig, setLearningConfig] = useState<LearningConfig>({
    max_emails_to_analyze: 10000,
    learning_email_types: ['sent', 'received'],
    excluded_senders: [],
    learning_sensitivity: 'balanced',
    minimum_pattern_confidence: 0.6,
    auto_draft_enabled: true,
    auto_draft_confidence_threshold: 0.7
  });
  
  const [isLearning, setIsLearning] = useState(false);
  const [learningProgress, setLearningProgress] = useState(0);
  const [newExcludedSender, setNewExcludedSender] = useState('');
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (session?.user?.id) {
      loadLearningStatus();
      loadLearningConfig();
      loadActiveJobs();
    }
  }, [session]);

  // Auto-select primary account when accounts load
  useEffect(() => {
    if (!accountsLoading && activeAccounts.length > 0 && !selectedAccountId) {
      // Find primary account or use first active account
      const primaryAccount = activeAccounts.find(account => account.is_primary);
      const defaultAccount = primaryAccount || activeAccounts[0];
      setSelectedAccountId(defaultAccount.id);
    }
  }, [accountsLoading, activeAccounts, selectedAccountId]);

  // Poll for active jobs only when there are active jobs
  useEffect(() => {
    if (!session?.user?.id) return;

    // Only poll if there are active jobs (processing or queued)
    const hasActiveJobs = activeJobs.some(job => 
      job.status === 'processing' || job.status === 'queued'
    );

    if (!hasActiveJobs) {
      return; // No interval needed
    }

    const interval = setInterval(() => {
      loadActiveJobs();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [session, activeJobs]); // Re-evaluate when activeJobs change

  const loadLearningStatus = async () => {
    try {
      const response = await fetch('/api/email/learning/initial');
      if (response.ok) {
        const data = await response.json();
        setLearningStatus(data.status);
      }
    } catch (error) {
      console.error('Error loading learning status:', error);
    }
  };

  const loadLearningConfig = async () => {
    try {
      // For now, use default config. In Phase 4, we'll load from database
      setLoading(false);
    } catch (error) {
      console.error('Error loading learning config:', error);
      setLoading(false);
    }
  };

  const loadActiveJobs = async () => {
    try {
      const response = await fetch('/api/email/learning/jobs');
      if (response.ok) {
        const data = await response.json();
        setActiveJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error loading active jobs:', error);
    }
  };

  const startInitialLearning = async () => {
    if (!session?.user?.id || !selectedAccountId) {
      toast({
        title: "Account Required",
        description: "Please select an email account before starting AI learning.",
        variant: "destructive"
      });
      return;
    }

    // Check if there's already an active job
    const existingJob = activeJobs.find(job => 
      job.status === 'processing' || job.status === 'queued'
    );

    if (existingJob) {
      setCurrentJobId(existingJob.jobId);
      setShowProgressDialog(true);
      return;
    }

    setIsLearning(true);

    try {
      const response = await fetch('/api/email/learning/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxEmails: learningConfig.max_emails_to_analyze,
          daysBack: 90,
          organizationId: null, // Will be implemented later
          accountId: selectedAccountId // Account-specific learning
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        setCurrentJobId(data.jobId);
        setShowProgressDialog(true);
        
        toast({
          title: "Email Learning Started",
          description: "Processing will continue in the background. You'll be notified when complete.",
          variant: "default"
        });

        // Reload active jobs and status
        await loadActiveJobs();
        await loadLearningStatus();
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Start Learning",
          description: error.details || "Failed to start learning process",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error starting learning:', error);
      toast({
        title: "Error",
        description: "Failed to start learning process",
        variant: "destructive"
      });
    } finally {
      setIsLearning(false);
    }
  };

  const viewJobProgress = (jobId: string) => {
    setCurrentJobId(jobId);
    setShowProgressDialog(true);
  };

  const getActiveJobsStatus = () => {
    const processingJobs = activeJobs.filter(job => job.status === 'processing');
    const queuedJobs = activeJobs.filter(job => job.status === 'queued');
    const completedJobs = activeJobs.filter(job => job.status === 'completed');
    const failedJobs = activeJobs.filter(job => job.status === 'failed');
    
    if (processingJobs.length > 0) {
      return {
        status: 'processing',
        message: `Processing ${processingJobs[0].processedEmails || 0}/${processingJobs[0].totalEmails || 0} emails`,
        job: processingJobs[0]
      };
    }
    
    if (queuedJobs.length > 0) {
      return {
        status: 'queued',
        message: 'Learning job is queued',
        job: queuedJobs[0]
      };
    }
    
    // Show completed status for recently completed jobs (within last 30 seconds)
    if (completedJobs.length > 0) {
      const recentCompleted = completedJobs.find(job => {
        const completedTime = new Date(job.endTime || job.completedAt);
        const now = new Date();
        return (now.getTime() - completedTime.getTime()) < 30000; // 30 seconds
      });
      
      if (recentCompleted) {
        return {
          status: 'completed',
          message: `Completed! Processed ${recentCompleted.successfulEmails || 0} emails successfully`,
          job: recentCompleted
        };
      }
    }
    
    if (failedJobs.length > 0) {
      const recentFailed = failedJobs.find(job => {
        const failedTime = new Date(job.endTime || job.completedAt);
        const now = new Date();
        return (now.getTime() - failedTime.getTime()) < 60000; // 1 minute
      });
      
      if (recentFailed) {
        return {
          status: 'failed',
          message: `Learning failed: ${recentFailed.errorMessage || 'Unknown error'}`,
          job: recentFailed
        };
      }
    }
    
    return null;
  };

  const addExcludedSender = () => {
    if (newExcludedSender.trim() && !learningConfig.excluded_senders.includes(newExcludedSender.trim())) {
      setLearningConfig(prev => ({
        ...prev,
        excluded_senders: [...prev.excluded_senders, newExcludedSender.trim()]
      }));
      setNewExcludedSender('');
    }
  };

  const removeExcludedSender = (sender: string) => {
    setLearningConfig(prev => ({
      ...prev,
      excluded_senders: prev.excluded_senders.filter(s => s !== sender)
    }));
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || accountsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {loading ? 'Loading AI learning settings...' : 'Loading email accounts...'}
          </p>
        </div>
      </div>
    );
  }

  // Show message if no email accounts
  if (activeAccounts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Accounts Found</h3>
          <p className="text-gray-500 mb-4">
            You need to connect at least one email account before you can use AI learning.
          </p>
          <Button onClick={() => window.location.href = '/settings/email-accounts'}>
            Add Email Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Account Selection
          </CardTitle>
          <CardDescription>
            Choose which email account to learn from. Each account maintains separate AI patterns and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountSelector
            accounts={activeAccounts}
            selectedAccountId={selectedAccountId}
            onAccountSelect={setSelectedAccountId}
            placeholder="Select an email account to learn from"
            label="Learn from Email Account"
            showAllAccountsOption={false}
          />
          
          {!selectedAccountId && activeAccounts.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <p className="text-sm text-blue-800">
                  Please select an email account to view AI learning settings and patterns for that account.
                </p>
              </div>
            </div>
          )}
          
          {selectedAccountId && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-green-800">
                  AI learning will be specific to this email account. Patterns won't affect other email accounts.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Only show learning settings if account is selected */}
      {selectedAccountId && (
        <>
          {/* Learning Status Card */}
          <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            <CardTitle>Email Learning Status</CardTitle>
          </div>
          <CardDescription>
            Your AI learns from your email communication patterns to provide better responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {learningStatus ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {learningStatus.patterns_count}
                  </div>
                  <div className="text-sm text-gray-600">Learned Patterns</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(learningStatus.avg_confidence * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Confidence</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Badge className={getQualityColor(learningStatus.learning_quality)}>
                    {learningStatus.learning_quality.toUpperCase()} Quality
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">Learning Quality</div>
                </div>
              </div>

              {learningStatus.pattern_types.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Pattern Types Learned</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {learningStatus.pattern_types.map(type => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {learningStatus.last_learning_session && (
                <div className="text-sm text-gray-600">
                  Last learning session: {new Date(learningStatus.last_learning_session.created_at).toLocaleDateString()}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Learning Data Yet</h3>
              <p className="text-gray-600 mb-4">
                Start the learning process to analyze your email patterns
              </p>
            </div>
          )}

          {/* Active Job Status */}
          {getActiveJobsStatus() && (
            <div className={`border rounded-lg p-4 mb-4 ${
              getActiveJobsStatus()?.status === 'completed' 
                ? 'bg-green-50 border-green-200' 
                : getActiveJobsStatus()?.status === 'failed'
                ? 'bg-red-50 border-red-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getActiveJobsStatus()?.status === 'processing' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  ) : getActiveJobsStatus()?.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : getActiveJobsStatus()?.status === 'failed' ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <div className={`font-medium ${
                      getActiveJobsStatus()?.status === 'completed' 
                        ? 'text-green-900' 
                        : getActiveJobsStatus()?.status === 'failed'
                        ? 'text-red-900'
                        : 'text-blue-900'
                    }`}>
                      {getActiveJobsStatus()?.status === 'processing' ? 'Learning in Progress' 
                       : getActiveJobsStatus()?.status === 'completed' ? 'Learning Completed!'
                       : getActiveJobsStatus()?.status === 'failed' ? 'Learning Failed'
                       : 'Learning Queued'}
                    </div>
                    <div className={`text-sm ${
                      getActiveJobsStatus()?.status === 'completed' 
                        ? 'text-green-700' 
                        : getActiveJobsStatus()?.status === 'failed'
                        ? 'text-red-700'
                        : 'text-blue-700'
                    }`}>
                      {getActiveJobsStatus()?.message}
                    </div>
                  </div>
                </div>
                {getActiveJobsStatus()?.status !== 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewJobProgress(getActiveJobsStatus()?.job?.jobId)}
                    className={
                      getActiveJobsStatus()?.status === 'failed'
                        ? 'border-red-300 text-red-700 hover:bg-red-100'
                        : 'border-blue-300 text-blue-700 hover:bg-blue-100'
                    }
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Progress
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={startInitialLearning}
              disabled={isLearning || !!getActiveJobsStatus()}
              className="flex items-center gap-2"
            >
              {isLearning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : getActiveJobsStatus() ? (
                <Pause className="h-4 w-4" />
              ) : learningStatus?.has_initial_learning ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {getActiveJobsStatus() 
                ? 'Learning Active' 
                : learningStatus?.has_initial_learning 
                  ? 'Refresh Learning' 
                  : 'Start Learning'
              }
            </Button>
            
            {learningStatus?.has_initial_learning && (
              <Button variant="outline" onClick={loadLearningStatus}>
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Learning Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <CardTitle>Learning Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure how the AI learns from your emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Analysis Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Email Analysis Settings</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max-emails">Maximum Emails to Analyze</Label>
                <Input
                  id="max-emails"
                  type="number"
                  min="50"
                  max="10000"
                  value={learningConfig.max_emails_to_analyze}
                  onChange={(e) => setLearningConfig(prev => ({
                    ...prev,
                    max_emails_to_analyze: parseInt(e.target.value) || 5000
                  }))}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 10,000 emails for maximum intelligence (~$3-5 one-time cost)
                </p>
              </div>

              <div>
                <Label htmlFor="learning-sensitivity">Learning Sensitivity</Label>
                <Select
                  value={learningConfig.learning_sensitivity}
                  onValueChange={(value: any) => setLearningConfig(prev => ({
                    ...prev,
                    learning_sensitivity: value
                  }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative - High quality patterns only</SelectItem>
                    <SelectItem value="balanced">Balanced - Good mix of quality and coverage</SelectItem>
                    <SelectItem value="aggressive">Aggressive - Learn from all available patterns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Email Types to Learn From</Label>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="learn-sent"
                    checked={learningConfig.learning_email_types.includes('sent')}
                    onCheckedChange={(checked) => {
                      setLearningConfig(prev => ({
                        ...prev,
                        learning_email_types: checked 
                          ? [...prev.learning_email_types.filter(t => t !== 'sent'), 'sent']
                          : prev.learning_email_types.filter(t => t !== 'sent')
                      }));
                    }}
                  />
                  <Label htmlFor="learn-sent">Sent Emails</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="learn-received"
                    checked={learningConfig.learning_email_types.includes('received')}
                    onCheckedChange={(checked) => {
                      setLearningConfig(prev => ({
                        ...prev,
                        learning_email_types: checked 
                          ? [...prev.learning_email_types.filter(t => t !== 'received'), 'received']
                          : prev.learning_email_types.filter(t => t !== 'received')
                      }));
                    }}
                  />
                  <Label htmlFor="learn-received">Received Emails</Label>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Excluded Senders */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Excluded Senders</Label>
            <p className="text-sm text-gray-600">
              Email addresses to exclude from learning (e.g., newsletters, automated emails)
            </p>
            
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address to exclude"
                value={newExcludedSender}
                onChange={(e) => setNewExcludedSender(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addExcludedSender()}
              />
              <Button onClick={addExcludedSender} variant="outline">
                Add
              </Button>
            </div>

            {learningConfig.excluded_senders.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {learningConfig.excluded_senders.map(sender => (
                  <Badge key={sender} variant="secondary" className="flex items-center gap-1">
                    {sender}
                    <button
                      onClick={() => removeExcludedSender(sender)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Auto-Draft Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Auto-Draft Settings</Label>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-draft"
                checked={learningConfig.auto_draft_enabled}
                onCheckedChange={(checked) => setLearningConfig(prev => ({
                  ...prev,
                  auto_draft_enabled: checked
                }))}
              />
              <Label htmlFor="auto-draft">Enable automatic draft generation</Label>
            </div>

            {learningConfig.auto_draft_enabled && (
              <div>
                <Label htmlFor="confidence-threshold">
                  Confidence Threshold ({Math.round(learningConfig.auto_draft_confidence_threshold * 100)}%)
                </Label>
                <Input
                  id="confidence-threshold"
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={learningConfig.auto_draft_confidence_threshold}
                  onChange={(e) => setLearningConfig(prev => ({
                    ...prev,
                    auto_draft_confidence_threshold: parseFloat(e.target.value)
                  }))}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only generate drafts when confidence is above this threshold
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips and Best Practices */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <CardTitle>Tips for Better Learning</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">✓ Good Practices</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Maintain consistent communication style</li>
                <li>• Include both questions and responses</li>
                <li>• Use clear subject lines</li>
                <li>• Respond to emails in a timely manner</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-red-600">✗ Avoid</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Very short or unclear responses</li>
                <li>• Inconsistent tone across emails</li>
                <li>• Including automated/newsletter emails</li>
                <li>• Personal/confidential conversations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
        
        </>
      )}

      {/* Progress Dialog */}
      <EmailLearningProgressDialog
        isOpen={showProgressDialog}
        onClose={() => {
          setShowProgressDialog(false);
          setCurrentJobId(null);
        }}
        jobId={currentJobId}
      />
    </div>
  );
}


