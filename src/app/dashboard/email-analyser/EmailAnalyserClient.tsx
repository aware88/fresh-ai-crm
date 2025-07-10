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

// Define a type for the raw email data from the database
interface RawEmail {
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
}

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
  const [activeView, setActiveView] = useState<EmailView>('inbox');
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
    try {
      setLoading(true);
      setError(null);
      
      // Try to load from emails table first
      const { data: emailsData, error: emailsError } = await supabase
        .from('emails')
        .select('*, contacts(*)')
        .order('created_at', { ascending: false });
      
      if (emailsError) {
        console.error('Error loading emails:', emailsError.message);
        throw emailsError;
      }
      
      if (emailsData && emailsData.length > 0) {
        // Transform the data to match our expected format
        const validEmails = emailsData.map((email: RawEmail) => ({
          id: email.id,
          sender: email.sender || 'Unknown',
          subject: email.subject || 'No Subject',
          raw_content: email.raw_content || '',
          analysis: email.analysis || '',
          created_at: email.created_at || new Date().toISOString(),
          contacts: email.contacts ? email.contacts.map(contact => ({
            id: contact.id,
            full_name: `${contact.firstname || ''} ${contact.lastname || ''}`.trim() || 'Unknown',
            email: contact.email
          })) : []
        }));
        
        setEmails(validEmails);
      } else {
        // Fall back to loading from contacts with notes
        console.log('Emails table not found or empty, loading from contacts notes');
        try {
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
            console.error('Database error when loading contacts:', {
              code: contactsError.code,
              message: contactsError.message,
              details: contactsError.details,
              hint: contactsError.hint
            });
            throw new Error(`Failed to fetch contacts with emails: ${contactsError.message}`);
          console.log('No emails found in emails table');
          throw new Error('No emails found');
        }
        
        console.log('Loading emails from emails table:', emailsData.length);
        
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
        setLoading(false);
        return; // Successfully loaded emails, exit function
      } catch (error) {
        console.error('Error loading emails from emails table:', 
          error instanceof Error ? error.message : String(error));
        // Don't set error here, we'll try the fallback method
      }
      
      // Fall back to loading from contacts with notes
      console.log('Emails table not found or empty, loading from contacts notes');
      try {
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
          console.error('Database error when loading contacts:', {
            code: contactsError.code,
            message: contactsError.message,
            details: contactsError.details,
            hint: contactsError.hint
          });
          throw new Error(`Failed to fetch contacts with emails: ${contactsError.message}`);
        }
        
        if (!contactsData || contactsData.length === 0) {
          console.log('No contacts with notes found');
          setEmails([]);
          setLoading(false);
          return;
        }
        
        // Convert contacts with notes to email format
        const validEmails: EmailWithContacts[] = contactsData.map(contact => {
          const fullName = [contact.firstname, contact.lastname].filter(Boolean).join(' ').trim() || contact.email;
          
          const contactObj: Contact = {
            id: contact.id,
            full_name: fullName,
            email: contact.email,
            first_name: contact.firstname || undefined,
            last_name: contact.lastname || undefined
          };
          
          return {
            id: `contact-${contact.id}`,
            sender: contact.email,
            subject: `Notes for ${fullName}`,
            raw_content: contact.notes || '',
            analysis: '',
            created_at: contact.lastcontact || contact.createdat || new Date().toISOString(),
            contact_id: contact.id,
            contacts: [contactObj]
          };
        });
        
        setEmails(validEmails);
        setLoading(false);
      } catch (error) {
        console.error('Error loading contacts with notes:', 
          error instanceof Error ? error.message : String(error));
        setError('Failed to load emails or contacts. Please try again later.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Unexpected error in loadEmails:', 
        error instanceof Error ? error.message : String(error));
      setError('An unexpected error occurred. Please try again later.');
      setLoading(false);
    }
  };

  // Render the component
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4">Email Analyzer</h2>
      <p className="text-gray-500 mb-6">Analyze and respond to customer emails with AI assistance</p>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading emails...</span>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : emails.length === 0 ? (
        <div className="text-center py-10">
          <Database className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No emails found</h3>
          <p className="text-gray-500 mt-2">Connect your email account to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Emails</CardTitle>
              <CardDescription>Recent emails requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    className={cn(
                      "mb-2 p-3 rounded-md cursor-pointer hover:bg-muted transition-colors",
                      selectedEmail?.id === email.id ? "bg-muted" : ""
                    )}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium truncate">{email.subject}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {email.sender}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEmail ? (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold">{selectedEmail.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      From: {selectedEmail.sender} • {format(new Date(selectedEmail.created_at), 'PPpp')}
                    </p>
                  </div>
                  <div className="border rounded-md p-4 mb-4 whitespace-pre-wrap">
                    {selectedEmail.raw_content}
                  </div>
                  {selectedEmail.analysis && (
                    <Alert className="mb-4">
                      <AlertTitle>AI Analysis</AlertTitle>
                      <AlertDescription>{selectedEmail.analysis}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">No email selected</h3>
                  <p className="text-gray-500 mt-2">Select an email from the list to view its content</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
