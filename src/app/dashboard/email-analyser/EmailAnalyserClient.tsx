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

// Define types for emails and contacts
type Contact = {
  id: string;
  full_name: string;
  email: string;
};

type Email = {
  id: string;
  sender: string;
  subject: string;
  raw_content: string;
  analysis?: string;
  created_at: string;
};

type RawEmail = {
  id: string;
  sender: string;
  subject: string;
  raw_content: string;
  analysis?: string;
  created_at: string;
  contacts: any[];
};

type EmailWithContacts = Email & { contacts: Contact[] };

export default function EmailAnalyserClient() {
  // State for emails and UI
  const [emails, setEmails] = useState<EmailWithContacts[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailWithContacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();

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
        // Fall back to contacts method
      } else if (emailsData && emailsData.length > 0) {
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
        setLoading(false);
        return; // Successfully loaded emails, exit function
      }
      
      // Fall back to loading from contacts with notes
      console.log('Emails table not found or empty, loading from contacts notes');
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
        setEmails([]);
        setError('No emails or contacts with notes found.');
        setLoading(false);
        return;
      }
      
      // Transform contacts with notes into email-like objects
      const validEmails = contactsData.map(contact => ({
        id: contact.id,
        sender: contact.email || 'Unknown',
        subject: `Notes for ${contact.firstname || ''} ${contact.lastname || ''}`.trim(),
        raw_content: contact.notes || '',
        created_at: contact.lastcontact || contact.createdat || new Date().toISOString(),
        contacts: [{
          id: contact.id,
          full_name: `${contact.firstname || ''} ${contact.lastname || ''}`.trim() || 'Unknown',
          email: contact.email
        }]
      }));
      
      setEmails(validEmails);
      setLoading(false);
    } catch (error) {
      console.error('Error in loadEmails:', 
        error instanceof Error ? error.message : String(error));
      setError('Failed to load emails or contacts. Please try again later.');
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
              <CardDescription>View and analyze email content</CardDescription>
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
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-2">Analysis</h4>
                      <div className="text-sm">{selectedEmail.analysis}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
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
}
