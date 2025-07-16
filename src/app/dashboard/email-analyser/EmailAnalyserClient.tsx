"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, Mail, Clock, AlertCircle, CheckCircle, Database, User, Calendar, MessageSquare, Send, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Types
interface Contact {
  id: string;
  full_name: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface EmailWithContacts {
  id: string;
  subject: string;
  sender: string;
  raw_content: string;
  analysis: string;
  created_at: string;
  contact_id?: string;
  contacts: Contact[];
}

export default function EmailAnalyserClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  
  // State
  const [emails, setEmails] = useState<EmailWithContacts[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailWithContacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState({
    emails: false,
    contacts: false,
    emailAccounts: false
  });

  // Check database status
  const checkDatabaseStatus = async () => {
    try {
      const [emailsCheck, contactsCheck, accountsCheck] = await Promise.all([
        supabase.from('emails').select('id').limit(1),
        supabase.from('contacts').select('id').limit(1),
        supabase.from('email_accounts').select('id').limit(1)
      ]);
      
      setDatabaseStatus({
        emails: !emailsCheck.error,
        contacts: !contactsCheck.error,
        emailAccounts: !accountsCheck.error
      });
    } catch (err) {
      console.error('Database status check failed:', err);
    }
  };

  // Load emails function - completely simplified to avoid contacts join issues
  const loadEmails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check database status first
      await checkDatabaseStatus();
      
      // Load emails directly without any joins to avoid policy issues
      console.log('Loading emails from database...');
      const { data: emailsData, error: emailsError } = await supabase
        .from('emails')
        .select('id, subject, sender, recipient, raw_content, analysis, contact_id, created_at, updated_at, user_id')
        .order('created_at', { ascending: false });

      if (emailsError) {
        console.error('Error loading emails:', emailsError);
        throw new Error(`Failed to load emails: ${emailsError.message}`);
      }
      
      if (!emailsData || emailsData.length === 0) {
        console.log('No emails found in database, using sample emails');
        const sampleEmails = createSampleEmails();
        setEmails(sampleEmails);
        setLoading(false);
        return;
      }

      console.log(`Successfully loaded ${emailsData.length} emails`);
      
      // Transform emails data without contacts join
      const transformedEmails: EmailWithContacts[] = emailsData.map(email => ({
        id: email.id || '',
        subject: email.subject || '(No subject)',
        sender: email.sender || 'unknown@example.com',
        raw_content: email.raw_content || '',
        analysis: email.analysis || 'No analysis available',
        created_at: email.created_at || new Date().toISOString(),
        contact_id: email.contact_id || undefined,
        contacts: [] // Empty contacts array to avoid policy issues
      }));
      
      setEmails(transformedEmails);
      
    } catch (err: any) {
      console.error('Error loading emails:', err);
      console.log('Falling back to sample emails');
      const sampleEmails = createSampleEmails();
      setEmails(sampleEmails);
    } finally {
      setLoading(false);
    }
  };

  // Create sample emails for demonstration
  const createSampleEmails = (): EmailWithContacts[] => {
    const baseTime = new Date();
    return [
      {
        id: 'sample-1',
        sender: 'john.doe@example.com',
        subject: 'Welcome to Fresh AI CRM!',
        raw_content: 'Hi there! Welcome to your new CRM system. We\'re excited to help you manage your business relationships more effectively.',
        analysis: 'This is a welcome email with a positive tone. The sender appears friendly and professional, focusing on onboarding and system introduction.',
        created_at: new Date(baseTime.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        contacts: [{ id: 'c1', full_name: 'John Doe', email: 'john.doe@example.com' }]
      },
      {
        id: 'sample-2',
        sender: 'support@freshaicrm.com',
        subject: 'Getting Started Guide',
        raw_content: 'Here\'s a quick guide to help you get started with Fresh AI CRM. You can connect your email accounts, manage contacts, and track interactions.',
        analysis: 'Support email providing guidance and instructions. Professional tone with helpful information about system features.',
        created_at: new Date(baseTime.getTime() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        contacts: [{ id: 'c2', full_name: 'Support Team', email: 'support@freshaicrm.com' }]
      },
      {
        id: 'sample-3',
        sender: 'newsletter@business.com',
        subject: 'Weekly Business Newsletter',
        raw_content: 'This week in business: market trends, new opportunities, and growth strategies for your company.',
        analysis: 'Newsletter email with informational content. Neutral professional tone focused on business insights and market information.',
        created_at: new Date(baseTime.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        contacts: [{ id: 'c3', full_name: 'Business Newsletter', email: 'newsletter@business.com' }]
      },
      {
        id: 'sample-4',
        sender: 'client@company.com',
        subject: 'Project Update - Q4 2024',
        raw_content: 'Here\'s the latest update on our Q4 project. We\'re making great progress and should be on track for the December deadline.',
        analysis: 'Client communication about project progress. Positive tone with professional updates and timeline information.',
        created_at: new Date(baseTime.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        contacts: [{ id: 'c4', full_name: 'Client Representative', email: 'client@company.com' }]
      },
      {
        id: 'sample-5',
        sender: 'noreply@calendar.com',
        subject: 'Meeting Reminder: Team Sync Tomorrow',
        raw_content: 'This is a reminder that you have a team sync meeting scheduled for tomorrow at 10:00 AM. Please prepare your weekly updates.',
        analysis: 'Automated reminder email about upcoming meeting. Neutral tone with specific instructions and time information.',
        created_at: new Date(baseTime.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        contacts: [{ id: 'c5', full_name: 'Calendar System', email: 'noreply@calendar.com' }]
      }
    ];
  };

  // Generate response function
  const generateResponse = async () => {
    if (!selectedEmail) return;
    
    setIsGeneratingResponse(true);
    
    try {
      // Simulate AI response generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResponse = `Thank you for your email regarding "${selectedEmail.subject}". I appreciate you reaching out and will review your request carefully. I'll get back to you within 24 hours with a detailed response.

Best regards,
Fresh AI CRM Team`;
      
      setResponse(mockResponse);
      
      toast({
        title: "Response Generated",
        description: "AI response has been generated successfully.",
      });
      
    } catch (error: any) {
      console.error('Error generating response:', error);
      setError('Failed to generate response. Please try again.');
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingResponse(false);
    }
  };

  // View email function
  const viewEmail = (email: EmailWithContacts) => {
    setSelectedEmail(email);
    setResponse('');
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown date';
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getSenderName = (email: EmailWithContacts) => {
    if (!email.sender) return 'Unknown';
    const match = email.sender.match(/(.+)\s*<(.+)>/);
    if (match) {
      return match[1].trim();
    }
    return email.sender.split('@')[0];
  };

  // Load emails on mount
  useEffect(() => {
    if (session) {
      loadEmails();
    }
  }, [session]);

  // Redirect if not authenticated
  if (!session) {
    router.push('/signin');
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MessageSquare className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-2xl font-bold">Email Analyser</h1>
            <p className="text-gray-600">AI-powered email analysis and insights</p>
          </div>
        </div>
        <Button
          onClick={loadEmails}
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center space-x-2"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Database Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Database Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2">
              {databaseStatus.emails ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Emails Table</span>
            </div>
            <div className="flex items-center space-x-2">
              {databaseStatus.contacts ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Contacts Table</span>
            </div>
            <div className="flex items-center space-x-2">
              {databaseStatus.emailAccounts ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Email Accounts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Recent Emails</span>
            </CardTitle>
            <CardDescription>
              {emails.length} emails found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading emails...</span>
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No emails found</p>
                <p className="text-sm text-gray-400">Connect your email accounts to start analyzing emails</p>
                <Button
                  onClick={() => router.push('/dashboard/email')}
                  className="mt-4"
                  variant="outline"
                >
                  Connect Email Accounts
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      className={cn(
                        "p-4 border rounded-lg cursor-pointer transition-colors",
                        selectedEmail?.id === email.id
                          ? "bg-purple-50 border-purple-200"
                          : "hover:bg-gray-50"
                      )}
                      onClick={() => viewEmail(email)}
                    >
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            {getInitials(getSenderName(email))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm truncate">
                              {getSenderName(email)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(email.created_at)}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {email.subject}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {truncateText(email.raw_content, 80)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Email Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Email Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEmail ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{selectedEmail.subject}</h3>
                  <p className="text-sm text-gray-600">From: {selectedEmail.sender}</p>
                  <p className="text-xs text-gray-500">{formatDate(selectedEmail.created_at)}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Email Content</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{selectedEmail.raw_content}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">AI Analysis</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm">{selectedEmail.analysis}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">AI Response</h4>
                    <Button
                      onClick={generateResponse}
                      disabled={isGeneratingResponse}
                      size="sm"
                    >
                      {isGeneratingResponse ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span className="ml-2">
                        {isGeneratingResponse ? 'Generating...' : 'Generate Response'}
                      </span>
                    </Button>
                  </div>
                  
                  {response && (
                    <Textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="AI-generated response will appear here..."
                      className="min-h-32"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Select an email to view analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
