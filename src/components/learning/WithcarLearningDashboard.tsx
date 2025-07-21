'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import WithcarLearningDemo from './WithcarLearningDemo';
import {
  Upload,
  Brain,
  FileText,
  TrendingUp,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Zap,
  BarChart3
} from 'lucide-react';

interface EmailSample {
  id: string;
  original_subject: string;
  email_type: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
  analysis_completed_at?: string;
}

interface EmailPattern {
  patternType: string;
  emailCategory: string;
  patternText: string;
  context: string;
  confidence: number;
  tags: string[];
}

interface StyleSummary {
  totalPatterns: number;
  commonTones: string[];
  frequentPhrases: string[];
  preferredStructure: string;
  languageDistribution: Record<string, number>;
}

export default function WithcarLearningDashboard() {
  const [emailContent, setEmailContent] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailType, setEmailType] = useState('customer_response');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [styleSummary, setStyleSummary] = useState<StyleSummary | null>(null);
  const [recentSamples, setRecentSamples] = useState<EmailSample[]>([]);
  const [patterns, setPatterns] = useState<EmailPattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<EmailPattern | null>(null);
  
  const { toast } = useToast();

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/learning/withcar-emails');
      if (!response.ok) {
        throw new Error('Failed to load learning data');
      }

      const data = await response.json();
      
      if (data.success && data.overview) {
        setStyleSummary(data.overview.styleSummary);
        setRecentSamples(data.overview.recentSamples);
      }

      // Load patterns - get all categories instead of just 'support'
      const patternsResponse = await fetch('/api/learning/withcar-emails?action=patterns');
      if (patternsResponse.ok) {
        const patternsData = await patternsResponse.json();
        if (patternsData.success) {
          setPatterns(patternsData.patterns);
        }
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load learning data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Analyze single email
  const handleAnalyzeSingleEmail = async () => {
    if (!emailContent.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please provide email content to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (emailContent.trim().length < 20) {
      toast({
        title: "Content Too Short",
        description: "Please provide a more substantial email content for better pattern learning.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);

      const response = await fetch('/api/learning/withcar-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'single',
          emails: [{
            content: emailContent,
            subject: emailSubject || 'Untitled',
            type: emailType
          }]
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      toast({
        title: "Email Analyzed!",
        description: `Successfully extracted ${data.analysis.patterns.length} patterns from the email.`,
      });

      // Clear form
      setEmailContent('');
      setEmailSubject('');
      
      // Refresh data
      await loadDashboardData();

    } catch (error) {
      console.error('Error analyzing email:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze email",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Upload multiple emails
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      
      const content = await file.text();
      const emails = parseEmailFile(content, file.name);

      if (emails.length === 0) {
        throw new Error('No valid emails found in file');
      }

      const response = await fetch('/api/learning/withcar-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'batch',
          emails
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Batch upload failed');
      }

      toast({
        title: "Batch Upload Complete!",
        description: `${data.processed} emails processed successfully out of ${data.totalEmails} total.`,
      });

      // Refresh data
      await loadDashboardData();

    } catch (error) {
      console.error('Error uploading emails:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to process email file",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      // Reset file input
      event.target.value = '';
    }
  };

  // Simple email file parser
  const parseEmailFile = (content: string, filename: string): Array<{
    id: string;
    content: string;
    type: string;
    subject: string;
  }> => {
    const emails: Array<{
      id: string;
      content: string;
      type: string;
      subject: string;
    }> = [];
    
    if (filename.endsWith('.txt')) {
      // Simple text file - assume each email is separated by "---" or double newlines
      const emailTexts = content.split(/\n\s*---\s*\n|\n\s*\n\s*\n/)
        .filter(text => text.trim().length > 50);
      
      emailTexts.forEach((emailText, index) => {
        emails.push({
          id: `file-${index}`,
          content: emailText.trim(),
          type: 'customer_response',
          subject: `Email ${index + 1} from ${filename}`
        });
      });
    }
    
    return emails;
  };

  // Reset all learning data
  const handleResetLearning = async () => {
    if (!confirm('Are you sure you want to reset all learned patterns? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/learning/withcar-emails?action=reset_all', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Reset failed');
      }

      toast({
        title: "Learning Data Reset",
        description: "All learned patterns and email samples have been cleared.",
      });

      // Refresh data
      await loadDashboardData();

    } catch (error) {
      console.error('Error resetting learning data:', error);
      toast({
        title: "Reset Failed",
        description: error instanceof Error ? error.message : "Failed to reset learning data",
        variant: "destructive",
      });
    }
  };

  const getPatternTypeColor = (type: string) => {
    const colors = {
      'greeting': 'bg-blue-100 text-blue-800',
      'closing': 'bg-green-100 text-green-800',
      'tone': 'bg-purple-100 text-purple-800',
      'phrase': 'bg-orange-100 text-orange-800',
      'structure': 'bg-gray-100 text-gray-800',
      'transition': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading learning dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600" />
            Withcar Email Learning
          </h1>
          <p className="text-gray-600">
            Teach the AI your email style by analyzing sent Withcar emails
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetLearning}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset Learning
          </Button>
        </div>
      </div>

      {/* Learning Summary */}
      {styleSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Learning Summary
            </CardTitle>
            <CardDescription>
              Overview of your learned email patterns and style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {styleSummary.totalPatterns}
                </div>
                <div className="text-sm text-gray-600">Total Patterns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {styleSummary.commonTones.length}
                </div>
                <div className="text-sm text-gray-600">Common Tones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {styleSummary.frequentPhrases.length}
                </div>
                <div className="text-sm text-gray-600">Key Phrases</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Object.keys(styleSummary.languageDistribution).length}
                </div>
                <div className="text-sm text-gray-600">Languages</div>
              </div>
            </div>
            
            {styleSummary.totalPatterns > 0 && (
              <>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Common Tones</h4>
                    <div className="flex flex-wrap gap-2">
                      {styleSummary.commonTones.slice(0, 5).map((tone, index) => (
                        <Badge key={index} variant="secondary">{tone}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Frequent Phrases</h4>
                    <div className="flex flex-wrap gap-2">
                      {styleSummary.frequentPhrases.slice(0, 3).map((phrase, index) => (
                        <Badge key={index} variant="outline" className="max-w-[200px] truncate">
                          {phrase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload & Analyze</TabsTrigger>
          <TabsTrigger value="demo">Demo</TabsTrigger>
          <TabsTrigger value="patterns">Learned Patterns</TabsTrigger>
          <TabsTrigger value="samples">Email Samples</TabsTrigger>
        </TabsList>

        {/* Upload & Analyze Tab */}
        <TabsContent value="upload" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Single Email Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Analyze Single Email
                </CardTitle>
                <CardDescription>
                  Paste a Withcar email to extract patterns and learn your style
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-subject">Subject (optional)</Label>
                  <Input
                    id="email-subject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject line"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-type">Email Type</Label>
                  <select
                    id="email-type"
                    value={emailType}
                    onChange={(e) => setEmailType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="customer_response">Customer Response</option>
                    <option value="inquiry_response">Inquiry Response</option>
                    <option value="support">Support</option>
                    <option value="sales">Sales</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-content">Email Content</Label>
                  <Textarea
                    id="email-content"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="Paste the full email content here..."
                    className="min-h-[200px] font-mono text-sm"
                    rows={10}
                  />
                </div>

                <Button
                  onClick={handleAnalyzeSingleEmail}
                  disabled={isAnalyzing || !emailContent.trim()}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Zap className="h-4 w-4 mr-2 animate-pulse" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze & Learn
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Batch Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-green-600" />
                  Batch Upload
                </CardTitle>
                <CardDescription>
                  Upload a text file containing multiple Withcar emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <BookOpen className="h-4 w-4" />
                  <AlertTitle>File Format</AlertTitle>
                  <AlertDescription>
                    Upload a .txt file with emails separated by "---" or double line breaks.
                    Maximum file size: 5MB.
                  </AlertDescription>
                </Alert>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <Label htmlFor="email-file" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-800">
                      Click to upload email file
                    </span>
                    <span className="text-gray-600"> or drag and drop</span>
                  </Label>
                  <Input
                    id="email-file"
                    type="file"
                    accept=".txt,.eml"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isAnalyzing}
                  />
                </div>

                {isAnalyzing && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Processing emails...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demo Tab */}
        <TabsContent value="demo" className="space-y-4">
          <WithcarLearningDemo />
        </TabsContent>

        {/* Learned Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Learned Patterns
              </CardTitle>
              <CardDescription>
                Patterns extracted from your Withcar emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patterns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No patterns learned yet.</p>
                  <p className="text-sm">Upload some Withcar emails to start learning!</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {patterns.map((pattern, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedPattern(pattern)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getPatternTypeColor(pattern.patternType)}>
                            {pattern.patternType}
                          </Badge>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {pattern.emailCategory}
                            </Badge>
                            <div className="text-xs text-gray-500">
                              {Math.round(pattern.confidence * 100)}%
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-800 mb-1">
                          {pattern.patternText.length > 100 
                            ? pattern.patternText.substring(0, 100) + '...'
                            : pattern.patternText
                          }
                        </p>
                        <p className="text-xs text-gray-600">
                          {pattern.context}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Samples Tab */}
        <TabsContent value="samples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Email Samples
              </CardTitle>
              <CardDescription>
                Recently analyzed Withcar email samples
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentSamples.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No email samples yet.</p>
                  <p className="text-sm">Upload emails to see them here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSamples.map((sample) => (
                    <div key={sample.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate">
                          {sample.original_subject}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {sample.email_type}
                          </Badge>
                          {sample.processing_status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {sample.processing_status === 'processing' && (
                            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                          )}
                          {sample.processing_status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Uploaded: {new Date(sample.created_at).toLocaleDateString()}
                        {sample.analysis_completed_at && (
                          <> • Analyzed: {new Date(sample.analysis_completed_at).toLocaleDateString()}</>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 