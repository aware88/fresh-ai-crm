"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Inbox, RefreshCw, Loader2, User, Mail, Eye, Calendar, Clock, ArrowUpRight, Filter, ChevronRight, MessageSquare, CheckCircle2, AlertCircle, Search, Send, Database } from 'lucide-react';
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
import { MetakockaEmailInfo } from '@/components/emails/MetakockaEmailInfo';
import { MetakockaEmailResponse } from '@/components/emails/MetakockaEmailResponse';
import { getEmailAIContext } from '@/lib/integrations/metakocka/email-response-api';
import { ViewSwitcher, EmailView } from '@/components/emails/ViewSwitcher';

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
  const [activeView, setActiveView] = useState<EmailView>('inbox');
  const [suggestedResponse, setSuggestedResponse] = useState<string>('');
  const [stats, setStats] = useState<{ processed: number; errors: number }>({ processed: 0, errors: 0 });

  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // Load emails function with single try-catch block (as per memory)
  const loadEmails = async () => {
    setLoading(true);
    setError(null);
    
    if (!supabase) {
      setError('Database connection not available. Please refresh the page.');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Attempting to load emails from emails table...');
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

      if (emailsError) {
        console.error('Database error when loading emails:', emailsError);
        throw emailsError;
      }
      
      if (emailsData && emailsData.length > 0) {
        console.log('Loading emails from emails table:', emailsData.length);
        
        const validEmails: EmailWithContacts[] = [];
        
        for (const email of emailsData) {
          if (!email) continue;
          
          const contacts: Contact[] = [];
          
          if (email.contacts && Array.isArray(email.contacts)) {
            for (const contact of email.contacts) {
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
            id: email.id || '',
            subject: email.subject || '(No subject)',
            sender: email.sender || 'unknown@example.com',
            raw_content: email.raw_content || '',
            analysis: email.analysis || '',
            created_at: email.created_at || new Date().toISOString(),
            contact_id: email.contact_id || undefined,
            contacts
          };
          
          validEmails.push(emailWithContacts);
        }
        
        setEmails(validEmails);
        return;
      }
      
      // Fall back to loading from contacts with notes if no emails found
      console.log('No emails found, loading from contacts notes');
      const { data: contactsData, error: contactsError } = await supabase
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

      if (contactsError) {
        console.error('Database error when loading contacts:', contactsError);
        throw new Error(`Failed to fetch contacts with emails: ${contactsError.message}`);
      }
      
      if (!contactsData || contactsData.length === 0) {
        console.log('No contacts with notes found');
        setEmails([]);
        return;
      }

      // Convert contact notes to email-like objects
      const convertedEmails = (contactsData || []).reduce<EmailWithContacts[]>((emails, contact) => {
        if (!contact) return emails;
        
        const emailMatch = contact.notes?.match(/Email from: (.+?)\nSubject: (.+?)\nDate: (.+?)\n\nAnalysis:\n([\s\S]+?)\n\n/m);
        if (!emailMatch) return emails;
        
        const [_, sender, subject, date, analysis] = emailMatch;
        
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
      console.error('Error loading emails:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Failed to load emails. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Process emails function
  const processEmails = async () => {
    setProcessing(true);
    setError(null);
    setSuccess(null);
    
    if (!supabase) {
      setError('Database connection not available. Please refresh the page.');
      setProcessing(false);
      return;
    }
    
    if (status === 'loading') {
      console.log('Session still loading, waiting...');
      setProcessing(false);
      return;
    }
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('Emails processed successfully!');
      setLastProcessed(new Date().toISOString());
      
      // Reload emails to show updated data
      await loadEmails();
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage || 'An error occurred while processing emails');
      console.error('Error processing emails:', errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // Generate response function
  const generateResponse = async () => {
    if (!selectedEmail) return;
    
    setIsGeneratingResponse(true);
    setGeneratingResponse(true);
    
    try {
      // Simulate AI response generation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockResponse = `Thank you for your email regarding "${selectedEmail.subject}". I appreciate you reaching out and will review your request carefully. I'll get back to you within 24 hours with a detailed response.`;
      
      setResponse(mockResponse);
      setSuggestedResponse(mockResponse);
    } catch (error: any) {
      console.error('Error generating response:', error);
      setError('Failed to generate response. Please try again.');
    } finally {
      setIsGeneratingResponse(false);
      setGeneratingResponse(false);
    }
  };

  // View email function
  const viewEmail = (email: EmailWithContacts) => {
    setSelectedEmail(email);
    setActiveView('analysis');
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
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getSenderName = (email: EmailWithContacts) => {
    if (email.contacts && email.contacts.length > 0) {
      return email.contacts[0].full_name;
    }
    return email.sender;
  };

  const getContactName = (email: EmailWithContacts) => {
    if (email.contacts && email.contacts.length > 0) {
      return email.contacts[0].full_name;
    }
    return email.sender;
  };

  // Filter emails based on search query
  const filteredEmails = emails.filter(email => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.subject.toLowerCase().includes(query) ||
      email.sender.toLowerCase().includes(query) ||
      email.analysis.toLowerCase().includes(query) ||
      email.raw_content.toLowerCase().includes(query)
    );
  });

  // Load emails on component mount
  useEffect(() => {
    loadEmails();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {/* Header content */}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadEmails}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button
            onClick={processEmails}
            disabled={processing || emails.length === 0}
            size="sm"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Process Emails
          </Button>
        </div>
      </div>

      <div className="border-b">
        <div className="flex h-10 items-center space-x-4">
          <div
            className={cn(
              "cursor-pointer px-3 py-1.5 text-sm font-medium transition-colors",
              activeView === 'inbox' ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveView('inbox')}
          >
            Inbox
          </div>
          <div
            className={cn(
              "cursor-pointer px-3 py-1.5 text-sm font-medium transition-colors",
              activeView === 'analysis' ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveView('analysis')}
          >
            Analysis
          </div>
          <div
            className={cn(
              "cursor-pointer px-3 py-1.5 text-sm font-medium transition-colors",
              activeView === 'response' ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveView('response')}
          >
            Response
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {activeView === 'inbox' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Email Inbox</CardTitle>
                    <CardDescription>Recent emails for analysis</CardDescription>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="space-y-2 p-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex flex-col space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="p-8 text-center">
                    <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No emails found</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="divide-y">
                      {filteredEmails.map((email) => (
                        <div
                          key={email.id}
                          className={cn(
                            "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                            selectedEmail?.id === email.id && "bg-muted"
                          )}
                          onClick={() => viewEmail(email)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="font-semibold truncate text-foreground">{email.subject || '(No subject)'}</div>
                              <div className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                                {formatDate(email.created_at)}
                              </div>
                            </div>
                            <div className="text-sm font-medium text-primary mt-1 truncate">
                              {getSenderName(email)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-snug">
                              {truncateText(email.analysis || email.raw_content, 120)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                              <User className="h-3 w-3" />
                              <span>{getContactName(email)}</span>
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

          <div className="md:col-span-2">
            {selectedEmail ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedEmail.subject || '(No subject)'}</CardTitle>
                      <CardDescription>From: {selectedEmail.sender}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none dark:prose-invert">
                    {selectedEmail.analysis ? (
                      <div className="whitespace-pre-wrap">
                        {selectedEmail.analysis.split('\n').map((line, i) => (
                          <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\n/g, '<br/>') }} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-center py-8">
                        No analysis available for this email.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-20">
                <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select an email to view</h3>
                <p className="text-muted-foreground">Choose an email from the list to see its analysis</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'analysis' && selectedEmail && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Email Analysis</CardTitle>
                  <CardDescription>AI-powered analysis of the selected email</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                      No email content available.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'response' && selectedEmail && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Response</CardTitle>
              <CardDescription>AI-powered response generation for the selected email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={generateResponse}
                    disabled={isGeneratingResponse}
                  >
                    {isGeneratingResponse ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MessageSquare className="h-4 w-4 mr-2" />
                    )}
                    Generate Response
                  </Button>
                  <div>
                    {isGeneratingResponse && (
                      <span className="text-sm text-muted-foreground">Generating response...</span>
                    )}
                  </div>
                </div>
                
                {response && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Response generated successfully!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedEmail && activeView !== 'inbox' && (
        <div className="text-center py-20">
          <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No email selected</h3>
          <p className="text-muted-foreground">Please select an email from the inbox to continue</p>
        </div>
      )}
    </div>
  );
}
