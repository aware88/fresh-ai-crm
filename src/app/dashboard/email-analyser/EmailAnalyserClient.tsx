"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Inbox, RefreshCw, Loader2, User, Mail, Eye, Calendar, Clock, ArrowUpRight, Filter, ChevronRight, MessageSquare, CheckCircle2, AlertCircle, Search, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Contact {
  id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

interface Email {
  id: string;
  sender: string;
  subject: string;
  raw_content: string;
  analysis: string;
  created_at: string;
  contact_id?: string;
  contacts?: {
    id: string;
    full_name: string;
    email: string;
  }[];
}

type EmailWithContacts = Email & { contacts: Contact[] };

export default function EmailAnalyserClient() {
  // State management
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emails, setEmails] = useState<EmailWithContacts[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailWithContacts | null>(null);
  const [lastProcessed, setLastProcessed] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGeneratingResponse, setIsGeneratingResponse] = useState<boolean>(false);
  const [response, setResponse] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [emailContent, setEmailContent] = useState<string>('');
  const [generatingResponse, setGeneratingResponse] = useState<boolean>(false);
  
  // Additional state variables
  const [activeView, setActiveView] = useState<'inbox' | 'analysis' | 'response'>('inbox');
  const [suggestedResponse, setSuggestedResponse] = useState<string>('');
  const [stats, setStats] = useState<{ processed: number; errors: number }>({ 
    processed: 0, 
    errors: 0 
  });
  
  // Hooks
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();

  // Load emails on component mount
  useEffect(() => {
    loadEmails();
  }, []);

  // Function to load emails (tries emails table first, falls back to contacts with notes)
  const loadEmails = async () => {
    setLoading(true);
    setError(null);
    try {
      try {
        // First try to load from emails table with a left join to contacts
        const { data: emailsData, error: emailsError } = await supabase
          .from('emails')
          .select(`
            id,
            subject,
            sender,
            recipient,
            raw_content,
            analysis,
            contact_id,
            created_at,
            updated_at,
            contacts!emails_contact_id_fkey (
              id,
              firstname,
              lastname,
              email
            )
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        if (emailsError) throw emailsError;
        if (!emailsData) return;

        console.log('Loading emails from emails table:', emailsData.length);
        
        // Define a type for the raw email data from the database
        type RawEmail = {
          id: string;
          subject: string | null;
          sender: string | null;
          recipient: string | null;
          raw_content: string | null;
          analysis: string | null;
          contact_id: string | null;
          created_at: string | null;
          updated_at: string | null;
          contacts: Array<{
            id: string;
            firstname: string | null;
            lastname: string | null;
            email: string;
          }> | null;
        };
        
        // Format the data to match our expected structure
        const validEmails: EmailWithContacts[] = [];
        
        for (const email of emailsData) {
          if (!email) continue;
          
          try {
            const rawEmail = email as unknown as RawEmail;
            const contacts: Contact[] = [];
            
            if (rawEmail.contacts && rawEmail.contacts.length > 0) {
              for (const contact of rawEmail.contacts) {
                if (!contact) continue;
                contacts.push({
                  id: contact.id,
                  full_name: [contact.firstname, contact.lastname].filter(Boolean).join(' ').trim() || contact.email,
                  email: contact.email,
                  first_name: contact.firstname || undefined,
                  last_name: contact.lastname || undefined
                });
              }
            }
            
            const emailWithContacts: EmailWithContacts = {
              id: rawEmail.id || '',
              subject: rawEmail.subject || '(No subject)',
              sender: rawEmail.sender || 'unknown@example.com',
              raw_content: rawEmail.raw_content || '',
              analysis: rawEmail.analysis || '',
              created_at: rawEmail.created_at || new Date().toISOString(),
              contact_id: rawEmail.contact_id || undefined,
              contacts
            };
            
            validEmails.push(emailWithContacts);
          } catch (err) {
            console.error('Error processing email:', email.id, err);
          }
        }
        
        setEmails(validEmails);
      } catch (error) {
        console.error('Error loading emails:', error);
        setError('Failed to load emails. Please try again.');
      } finally {
        setLoading(false);
      }
      
      // Fall back to loading from contacts with notes
      console.log('Emails table not found or empty, loading from contacts notes');
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          id,
          firstname,
          lastname,
          email,
          notes,
          lastcontact,
          createdat
        `)
        .not('notes', 'is', null)
        .order('lastcontact', { ascending: false })
        .limit(5);

      if (error) {
        throw new Error(`Failed to fetch contacts with emails: ${error.message}`);
      }

      // Convert contact notes to email-like objects
      const convertedEmails = (data || []).reduce<EmailWithContacts[]>((emails, contact) => {
        if (!contact) return emails;
        
        const emailMatch = contact.notes?.match(/Email from: (.+?)\nSubject: (.+?)\nDate: (.+?)\n\nAnalysis:\n([\s\S]+?)\n\n/m);
        if (!emailMatch) return emails;
        
        const [_, sender, subject, date, analysis] = emailMatch;
        
        // Extract raw content if available
        const contentMatch = contact.notes?.match(/Content:\n([\s\S]+?)\n\n---/m);
        const raw_content = contentMatch ? contentMatch[1] : '';
        
        const emailWithContacts: EmailWithContacts = {
          id: contact.id,
          sender: sender || 'unknown@example.com',
          subject: subject || '(No subject)',
          analysis: analysis || '',
          raw_content: raw_content,
          created_at: date || contact.lastcontact || contact.createdat || new Date().toISOString(),
          contact_id: contact.id,
          contacts: [{
            id: contact.id,
            full_name: `${contact.firstname || ''} ${contact.lastname || ''}`.trim() || contact.email,
            email: contact.email,
            first_name: contact.firstname || undefined,
            last_name: contact.lastname || undefined
          }]
        };
        
        return [...emails, emailWithContacts];
      }, []);

      setEmails(convertedEmails);
    } catch (err: any) {
      console.error('Error loading emails:', err);
      setError(err.message || 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  // Function to process new emails
  const processEmails = async () => {
    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    // Check if user is authenticated
    if (status === 'loading') {
      console.log('Session still loading, waiting...');
      setProcessing(false);
      return;
    }
    
    try {
      // Get Supabase session as a fallback
      let authToken = null;
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      if (supabaseSession?.access_token) {
        authToken = supabaseSession.access_token;
        console.log('Got Supabase auth token');
      } else {
        console.log('No Supabase session available');
      }
      
      if (status === 'unauthenticated' && !authToken) {
        console.log('No authentication method available, redirecting to sign in');
        toast({
          title: 'Authentication required',
          description: 'Please sign in to process emails',
          variant: 'destructive',
        });
        router.push('/signin');
        setProcessing(false);
        return;
      }
    
      console.log('NextAuth session status:', status);
      console.log('NextAuth session data:', session);
      
      // Show processing status updates to user
      setSuccess('Connecting to email server... (Test mode: processing only the most recent unread email)');
      
      // Set up a timeout indicator for long-running processes
      const processingUpdates = [
        { message: 'Fetching emails...', delay: 3000 },
        { message: 'Analyzing emails...', delay: 8000 },
        { message: 'Still working...', delay: 15000 },
        { message: 'This is taking longer than expected...', delay: 25000 }
      ];
      
      // Set up the processing status updates
      const updateTimers = processingUpdates.map(update => {
        return setTimeout(() => {
          if (processing) { // Only update if still processing
            setSuccess(update.message);
          }
        }, update.delay);
      });
      
      // Trigger server-side email processing via API route with proper headers
      console.log('Making API call to process emails...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // Client-side timeout after 45s
        
        const res = await fetch('/api/emails/process', { 
          method: 'POST', 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ authToken }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('API response status:', res.status);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.message || `Server error: ${res.status}`;
          console.error('Email processing failed:', errorMessage);
          setError(errorMessage);
          setProcessing(false);
          return;
        }
        
        const data = await res.json();
        console.log('Email processing result:', data);
        
        const processedEmails = data.emails || [];
        const processedCount = data.processed || processedEmails.length || 0;
        const errorCount = data.errors || 0;
        
        setSuccess(`Successfully processed ${processedCount} emails with ${errorCount} errors`);
        setEmails(prev => [...processedEmails, ...prev]);
        setLastProcessed(new Date().toISOString());
        setStats({
          processed: processedCount,
          errors: errorCount
        });
        
        // Clear all timeout timers
        updateTimers.forEach(clearTimeout);
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          setError('Email processing timed out. Please try again later.');
        } else {
          setError(err.message || 'An error occurred during email processing');
          console.error('Error processing emails (inner catch):', err);
        }
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while processing emails');
      console.error('Error processing emails (outer catch):', error);
    } finally {
      setProcessing(false);
    }
  };

  const generateResponse = async () => {
    if (!selectedEmail) return;

    try {
      setGeneratingResponse(true);
      setError(null);

      // Simulate response generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuggestedResponse(`Dear ${getSenderName(selectedEmail.sender)},\n\nThank you for your email regarding "${selectedEmail.subject}". I've reviewed your message and...\n\nLooking forward to your response.\n\nBest regards,\nYour Name`);
      
      // For actual implementation
      /*
      const response = await fetch(`/api/emails/${selectedEmail.id}/generate-response`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate response');
      }

      const data = await response.json();
      setSuggestedResponse(data.response);
      */
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while generating response';
      setError(errorMessage);
      console.error('Error generating response:', error);
    } finally {
      setGeneratingResponse(false);
    }
  };

  const viewEmail = (email: EmailWithContacts) => {
    setSelectedEmail(email);
    setSuggestedResponse('');
    setActiveView('analysis');
  };

  useEffect(() => {
    if (session) {
      loadEmails();
    }
  }, [session]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPpp');
  };

  // Helper function to truncate text with ellipsis
  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Helper functions to get names
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getSenderName = (sender: string) => {
    const match = sender.match(/(.+)\s*<(.+)>/);
    if (match) {
      return match[1].trim();
    }
    return sender.split('@')[0];
  };

  const getContactName = (contact: Contact) => {
    if (contact.first_name && contact.last_name) {
      return `${contact.first_name} ${contact.last_name}`;
    }
    if (contact.first_name) {
      return contact.first_name;
    }
    if (contact.email) {
      return getSenderName(contact.email);
    }
    return 'Unknown Contact';
  };

  // Filter emails based on search query and active tab
  const filteredEmails = (emails || []).filter(email => {
    if (!email) return false;
    
    const matchesSearch = 
      (email.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (email.sender || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (email.raw_content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (email.analysis || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') {
      return matchesSearch;
    } else if (activeTab === 'contacts') {
      return matchesSearch && !!email.contact_id;
    } else if (activeTab === 'unlinked') {
      return matchesSearch && !email.contact_id;
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {/* Removed duplicate headline */}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadEmails}
            variant="outline"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          <Button
            onClick={processEmails}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Inbox className="mr-2 h-4 w-4" />
                Process New Emails
              </>
            )}
          </Button>
        </div>
      </div>

      {/* View Navigation */}
      <div className="border-b">
        <div className="flex h-10 items-center space-x-4">
          <div
            className={`flex items-center space-x-2 border-b-2 px-4 ${activeView === 'inbox' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveView('inbox')}
            role="button"
            tabIndex={0}
          >
            <Inbox className="h-4 w-4" />
            <span>Inbox</span>
          </div>
          <div
            className={`flex items-center space-x-2 border-b-2 px-4 ${activeView === 'response' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => selectedEmail && setActiveView('response')}
            role="button"
            tabIndex={0}
            style={{ opacity: selectedEmail ? 1 : 0.5, cursor: selectedEmail ? 'pointer' : 'not-allowed' }}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Response</span>
          </div>
          <div
            className={`flex items-center space-x-2 border-b-2 px-4 ${activeView === 'analysis' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            onClick={() => selectedEmail && setActiveView('analysis')}
            role="button"
            tabIndex={0}
            style={{ opacity: selectedEmail ? 1 : 0.5, cursor: selectedEmail ? 'pointer' : 'not-allowed' }}
          >
            <Eye className="h-4 w-4" />
            <span>AI Analysis</span>
          </div>
        </div>
      </div>

      {lastProcessed && stats && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Last email processing</AlertTitle>
          <AlertDescription>
            Processed {stats.processed} emails with {stats.errors} errors at {format(new Date(lastProcessed), 'PPpp')}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Inbox View */}
      {activeView === 'inbox' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Analyzed Emails</CardTitle>
                    <CardDescription>
                      {filteredEmails.length} of {emails.length} emails shown
                    </CardDescription>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search emails..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <div className="px-6 pb-3">
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="contacts">With Contact</TabsTrigger>
                    <TabsTrigger value="unlinked">Unlinked</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="p-8 text-center">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">No emails found</h3>
                    <p className="text-sm text-muted-foreground">
                      {emails.length > 0 
                        ? 'Try a different filter or tab' 
                        : 'Process new emails to see them here'}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="divide-y">
                      {filteredEmails.map((email) => (
                        <div
                          key={email.id}
                          className={cn(
                            "p-4 cursor-pointer hover:bg-muted/50 flex items-start gap-3",
                            selectedEmail?.id === email.id ? 'bg-muted' : ''
                          )}
                          onClick={() => viewEmail(email)}
                        >
                          <Avatar className="h-9 w-9 mt-1">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(getSenderName(email.sender))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="font-semibold truncate text-foreground">{email.subject || '(No subject)'}</div>
                              <div className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                                {format(new Date(email.created_at), 'MMM d, HH:mm')}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-primary mt-1 truncate">
                              {email.contacts && email.contacts.length > 0 
                                ? getContactName(email.contacts[0]) 
                                : getSenderName(email.sender)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-snug">
                              {email.analysis 
                                ? truncateText(email.analysis, 120)
                                : 'No analysis available'}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                              {email.contact_id && (
                                <Badge variant="outline" className="ml-2 py-0 h-5">
                                  <User className="h-3 w-3 mr-1" />
                                  Contact
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Email Details */}
          <div className="md:col-span-2">
            {selectedEmail ? (
              <Tabs defaultValue="content">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Email Content</TabsTrigger>
                  <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
                  <TabsTrigger value="contact">Contact Info</TabsTrigger>
                </TabsList>
                
                <TabsContent value="analysis" className="mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{selectedEmail.subject || '(No subject)'}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span>From:</span> 
                            <span className="font-medium">{selectedEmail.sender}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(selectedEmail.created_at), { addSuffix: true })}
                            </span>
                          </CardDescription>
                        </div>
                        {selectedEmail.contacts && selectedEmail.contacts.length > 0 && (
                          <Badge variant="outline" className="ml-2">
                            <User className="h-3 w-3 mr-1" />
                            {getContactName(selectedEmail.contacts[0])}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none dark:prose-invert">
                        <ScrollArea className="h-[600px]">
                          <div className="whitespace-pre-wrap">
                            {selectedEmail.analysis ? (
                              <div dangerouslySetInnerHTML={{ __html: selectedEmail.analysis.replace(/\n/g, '<br/>') }} />
                            ) : (
                              <div className="text-muted-foreground text-center py-8">
                                <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                                <p>No analysis available for this email.</p>
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="content" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Original Email</CardTitle>
                      <CardDescription>
                        From {selectedEmail.sender} on {format(new Date(selectedEmail.created_at), 'PPpp')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[600px]">
                        <div className="space-y-4">
                          <div className="p-4 rounded-md bg-muted/30">
                            <div className="font-medium text-lg mb-1">Subject: {selectedEmail.subject || '(No subject)'}</div>
                            <div className="text-sm text-muted-foreground mb-4">Sent by: {selectedEmail.sender}</div>
                          </div>
                          
                          <div className="prose max-w-none dark:prose-invert">
                            {selectedEmail.raw_content ? (
                              <div className="whitespace-pre-wrap">{selectedEmail.raw_content}</div>
                            ) : (
                              <div className="italic text-muted-foreground text-center py-8">
                                <p>Email content is not available.</p>
                                <p>This may be because the email was stored as a note before the email storage feature was implemented.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

              <TabsContent value="contact" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                      {selectedEmail.contacts && selectedEmail.contacts.length > 0
                        ? 'This email is linked to a contact' 
                        : 'This email is not linked to any contact'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedEmail.contacts && selectedEmail.contacts.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="text-lg">
                              {getInitials(getContactName(selectedEmail.contacts[0]))}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="text-lg font-medium">
                              {getContactName(selectedEmail.contacts[0])}
                            </h3>
                            <p className="text-sm text-muted-foreground">{selectedEmail.contacts[0].email}</p>
                            <Link 
                              href={`/dashboard/contacts/${selectedEmail.contact_id}`}
                              className="text-sm flex items-center gap-1 text-primary mt-1"
                            >
                              View contact <ChevronRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <h3 className="text-lg font-medium">No linked contact</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          This email sender is not linked to any contact in your CRM
                        </p>
                        <Button
                          onClick={() => {
                            // Extract name from email address
                            const emailName = selectedEmail.sender.split('@')[0];
                            const nameParts = emailName.split(/[._-]/);
                            const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : '';
                            const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : '';
                            
                            // Navigate to create contact page with pre-filled data
                            window.location.href = `/dashboard/contacts/new?firstName=${firstName}&lastName=${lastName}&email=${encodeURIComponent(selectedEmail.sender)}`;
                          }}
                        >
                          Create Contact
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-20">
              <Mail className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No email selected</h3>
              <p className="text-muted-foreground">
                Select an email from the list to view its details
              </p>
            </div>
          )}
          </div>
        </div>
      )}
      
      {/* Analysis View */}
      {activeView === 'analysis' && selectedEmail && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedEmail.subject || '(No subject)'}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span>From:</span> 
                    <span className="font-medium">{selectedEmail.sender}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(selectedEmail.created_at), { addSuffix: true })}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none dark:prose-invert">
                <ScrollArea className="h-[600px]">
                  <div className="whitespace-pre-wrap">
                    {selectedEmail.analysis ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.analysis.replace(/\n/g, '<br/>') }} />
                    ) : (
                      <div className="text-muted-foreground text-center py-8">
                        <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                        <p>No analysis available for this email.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Response View */}
      {activeView === 'response' && selectedEmail && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Response</CardTitle>
              <CardDescription>
                Generate an AI-powered response to this email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!suggestedResponse ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <h3 className="text-lg font-medium">No response generated yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click the button below to generate a suggested response
                    </p>
                    <Button 
                      onClick={generateResponse}
                      disabled={generatingResponse}
                    >
                      {generatingResponse ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Generate Response
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Textarea 
                      value={suggestedResponse} 
                      onChange={(e) => setSuggestedResponse(e.target.value)}
                      className="min-h-[300px] font-mono"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSuggestedResponse('')}>
                        Clear
                      </Button>
                      <Button>
                        <Send className="mr-2 h-4 w-4" />
                        Send Response
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
