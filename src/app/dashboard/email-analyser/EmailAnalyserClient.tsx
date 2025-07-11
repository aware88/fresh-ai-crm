"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Inbox, RefreshCw, Loader2, User, Mail, Eye, Calendar, Clock, ArrowUpRight, Filter, ChevronRight, MessageSquare, CheckCircle2, AlertCircle, Search, Send, Database, X, Download, Share, Tag, Link2, ExternalLink, FileText, Paperclip, Copy, ChevronsUpDown, MoreHorizontal, Archive, Reply, Forward, Trash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow, format, parseISO, isValid } from 'date-fns';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useEmailSettings } from '@/hooks/useEmailSettings';
import { useDebounce } from '@/hooks/useDebounce';
import { EmailActionMenu } from '@/components/emails/EmailActionMenu';
import { EmailAttachments } from '@/components/emails/EmailAttachments';

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
  recipient?: string;
  cc?: string;
  bcc?: string;
  subject: string;
  raw_content: string;
  html_content?: string;
  analysis: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  priority?: 'high' | 'normal' | 'low';
  created_at: string;
  processed_at?: string;
  read_at?: string;
  contact_id?: string;
  organization_id?: string;
  thread_id?: string;
  in_reply_to?: string;
  has_attachments?: boolean;
  attachments?: {
    id: string;
    filename: string;
    size: number;
    content_type: string;
    url?: string;
  }[];
  tags?: string[];
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
  
  // Advanced state management
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<'created_at' | 'sender' | 'subject'>('created_at');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('detailed');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAttachmentsOnly, setShowAttachmentsOnly] = useState<boolean>(false);
  const [showReadOnly, setShowReadOnly] = useState<boolean>(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [isLoadingMetakockaData, setIsLoadingMetakockaData] = useState<boolean>(false);
  const [metakockaError, setMetakockaError] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [selectedPriority, setSelectedPriority] = useState<'high' | 'normal' | 'low' | null>(null);
  const [selectedSentiment, setSelectedSentiment] = useState<'positive' | 'negative' | 'neutral' | null>(null);
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>({start: null, end: null});
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState<boolean>(false);
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [isSelectAll, setIsSelectAll] = useState<boolean>(false);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const responseTextareaRef = useRef<HTMLTextAreaElement>(null);
  const emailListRef = useRef<HTMLDivElement>(null);
  
  // Settings
  const { emailSettings } = useEmailSettings();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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

  // Process emails function with enhanced API integration
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
      console.log('Starting email processing...');
      
      // Create abort controller for timeout handling
      const controller = new AbortController();
      const updateTimers: NodeJS.Timeout[] = [];
      
      // Set up timeout (30 seconds)
      const timeoutId = setTimeout(() => {
        console.log('Email processing timeout reached');
        controller.abort();
      }, 30000);
      
      try {
        console.log('Making API request to process emails...');
        const res = await fetch('/api/emails/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: session?.user?.id,
            userEmail: session?.user?.email
          }),
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
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError(errorMessage || 'An error occurred during email processing');
          console.error('Error processing emails (inner catch):', errorMessage);
        }
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage || 'An error occurred while processing emails');
      console.error('Error processing emails (outer catch):', errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  // Generate response function with Metakocka integration
  const generateResponse = async () => {
    if (!selectedEmail) return;
    
    setIsGeneratingResponse(true);
    setGeneratingResponse(true);
    
    try {
      console.log('Generating AI response for email:', selectedEmail.id);
      
      // Get Metakocka context if available
      let metakockaContext = '';
      try {
        const context = await getEmailAIContext(selectedEmail.id);
        metakockaContext = context || '';
        console.log('Retrieved Metakocka context:', metakockaContext ? 'Available' : 'Not available');
      } catch (contextError) {
        console.warn('Failed to get Metakocka context:', contextError);
      }
      
      // Simulate AI response generation with context
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      let mockResponse = `Thank you for your email regarding "${selectedEmail.subject}". I appreciate you reaching out and will review your request carefully.`;
      
      // Add context-aware response if Metakocka data is available
      if (metakockaContext) {
        mockResponse += ` Based on our records and your previous interactions, I'll provide you with a comprehensive response that takes into account your specific needs and history with us.`;
      }
      
      mockResponse += ` I'll get back to you within 24 hours with a detailed response.`;
      
      setResponse(mockResponse);
      setSuggestedResponse(mockResponse);
      
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
      setGeneratingResponse(false);
    }
  };

  // View email function
  const viewEmail = (email: EmailWithContacts) => {
    setSelectedEmail(email);
    setActiveView('analysis');
  };

  // Enhanced utility functions
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Invalid date';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatFullDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Invalid date';
      return format(date, 'PPpp');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return '??';
    
    return name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileText className="h-4 w-4" />;
    if (mimeType.startsWith('application/pdf')) return <FileText className="h-4 w-4" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileText className="h-4 w-4" />;
    if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className="h-4 w-4" />;
    return <Paperclip className="h-4 w-4" />;
  };
  
  // Handle attachment download
  const handleDownloadAttachment = async (attachment: NonNullable<Email['attachments']>[number]) => {
    try {
      if (!attachment.url) {
        toast({
          title: "Download Failed",
          description: "Attachment URL not available",
          variant: "destructive"
        });
        return;
      }
      
      // Simulate download in this example
      toast({
        title: "Downloading",
        description: `Downloading ${attachment.filename}...`,
      });
      
      // In a real implementation, you would fetch the file and trigger download
      // const response = await fetch(attachment.url);
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = attachment.filename;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download attachment",
        variant: "destructive"
      });
    }
  };
  
  // Mark email as read
  const markAsRead = async (emailId: string) => {
    try {
      setIsMarkingAsRead(true);
      
      // In a real implementation, you would call an API
      // await fetch(`/api/emails/${emailId}/read`, { method: 'POST' });
      
      // Update local state
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === emailId ? { ...email, read_at: new Date().toISOString() } : email
        )
      );
      
      toast({
        title: "Email Marked as Read",
        description: "Email has been marked as read",
      });
    } catch (error) {
      console.error('Error marking email as read:', error);
      toast({
        title: "Action Failed",
        description: "Failed to mark email as read",
        variant: "destructive"
      });
    } finally {
      setIsMarkingAsRead(false);
    }
  };
  
  // Archive email
  const archiveEmail = async (emailId: string) => {
    try {
      setIsArchiving(true);
      
      // In a real implementation, you would call an API
      // await fetch(`/api/emails/${emailId}/archive`, { method: 'POST' });
      
      // Update local state - remove from list
      setEmails(prevEmails => prevEmails.filter(email => email.id !== emailId));
      
      // If the archived email was selected, clear selection
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
        setActiveView('inbox');
      }
      
      toast({
        title: "Email Archived",
        description: "Email has been archived successfully",
      });
    } catch (error) {
      console.error('Error archiving email:', error);
      toast({
        title: "Action Failed",
        description: "Failed to archive email",
        variant: "destructive"
      });
    } finally {
      setIsArchiving(false);
    }
  };
  
  // Export emails
  const exportEmails = async () => {
    try {
      setIsExporting(true);
      
      // In a real implementation, you would generate the export file
      const emailsToExport = selectedEmailIds.length > 0 
        ? emails.filter(email => selectedEmailIds.includes(email.id))
        : emails;
      
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Export Complete",
        description: `${emailsToExport.length} emails exported as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting emails:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export emails",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Toggle select all emails
  const toggleSelectAll = () => {
    if (isSelectAll) {
      setSelectedEmailIds([]);
    } else {
      setSelectedEmailIds(filteredEmails.map(email => email.id));
    }
    setIsSelectAll(!isSelectAll);
  };
  
  // Toggle select email
  const toggleSelectEmail = (emailId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedEmailIds(prev => [...prev, emailId]);
    } else {
      setSelectedEmailIds(prev => prev.filter(id => id !== emailId));
    }
  };

  const truncateText = (text: string, maxLength: number = 100): string => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Using the getInitials function defined above

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

  const getEmailSenderName = (email: EmailWithContacts) => {
    if (email.contacts && email.contacts.length > 0) {
      return getContactName(email.contacts[0]);
    }
    return getSenderName(email.sender);
  };

  const getEmailContactName = (email: EmailWithContacts) => {
    if (email.contacts && email.contacts.length > 0) {
      return getContactName(email.contacts[0]);
    }
    return getSenderName(email.sender);
  };
  
  // Advanced email filtering system with multiple criteria
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      // Filter by tab
      if (activeTab === 'contacts' && (!email.contacts || email.contacts.length === 0)) {
        return false;
      }
      if (activeTab === 'unlinked' && email.contacts && email.contacts.length > 0) {
        return false;
      }
      
      // Filter by search query
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchesSearch = (
          (email.subject && email.subject.toLowerCase().includes(query)) ||
          (email.sender && email.sender.toLowerCase().includes(query)) ||
          (email.raw_content && email.raw_content.toLowerCase().includes(query)) ||
          (email.analysis && email.analysis.toLowerCase().includes(query)) ||
          (email.contacts && email.contacts.some(contact => 
            contact.full_name.toLowerCase().includes(query) || 
            contact.email.toLowerCase().includes(query)
          ))
        );
        if (!matchesSearch) return false;
      }
      
      // Filter by attachments
      if (showAttachmentsOnly && (!email.has_attachments || !email.attachments || email.attachments.length === 0)) {
        return false;
      }
      
      // Filter by read status
      if (showReadOnly && !email.read_at) {
        return false;
      }
      if (showUnreadOnly && email.read_at) {
        return false;
      }
      
      // Filter by tags
      if (selectedTags.length > 0 && (!email.tags || !selectedTags.some(tag => email.tags?.includes(tag)))) {
        return false;
      }
      
      // Filter by priority
      if (selectedPriority && email.priority !== selectedPriority) {
        return false;
      }
      
      // Filter by sentiment
      if (selectedSentiment && email.sentiment !== selectedSentiment) {
        return false;
      }
      
      // Filter by date range
      if (dateRange.start && dateRange.end) {
        const emailDate = new Date(email.created_at);
        if (emailDate < dateRange.start || emailDate > dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
  }, [
    emails, 
    activeTab, 
    debouncedSearchQuery, 
    showAttachmentsOnly, 
    showReadOnly, 
    showUnreadOnly, 
    selectedTags, 
    selectedPriority, 
    selectedSentiment, 
    dateRange
  ]);
  
  // Sort emails
  const sortedEmails = useMemo(() => {
    return [...filteredEmails].sort((a, b) => {
      if (sortField === 'created_at') {
        return sortOrder === 'desc' 
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortField === 'sender') {
        const senderA = getSenderName(a.sender);
        const senderB = getSenderName(b.sender);
        return sortOrder === 'desc' 
          ? senderB.localeCompare(senderA)
          : senderA.localeCompare(senderB);
      }
      if (sortField === 'subject') {
        return sortOrder === 'desc' 
          ? (b.subject || '').localeCompare(a.subject || '')
          : (a.subject || '').localeCompare(b.subject || '');
      }
      return 0;
    });
  }, [filteredEmails, sortField, sortOrder]);
  
  // Toggle sort order
  const toggleSortOrder = (field: 'created_at' | 'sender' | 'subject') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setShowAttachmentsOnly(false);
    setShowReadOnly(false);
    setShowUnreadOnly(false);
    setSelectedTags([]);
    setSelectedPriority(null);
    setSelectedSentiment(null);
    setDateRange({start: null, end: null});
    setSortField('created_at');
    setSortOrder('desc');
  };
  
  // Advanced Filter UI Component
  const AdvancedFiltersPopover = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {(showAttachmentsOnly || showReadOnly || showUnreadOnly || selectedTags.length > 0 || 
           selectedPriority || selectedSentiment || dateRange.start || dateRange.end) && (
            <Badge variant="secondary" className="ml-2 px-1 py-0">
              {[showAttachmentsOnly, showReadOnly, showUnreadOnly, selectedTags.length > 0, 
                selectedPriority, selectedSentiment, dateRange.start].filter(Boolean).length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Filter Emails</h4>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch 
                id="attachments-only" 
                checked={showAttachmentsOnly}
                onCheckedChange={setShowAttachmentsOnly}
              />
              <Label htmlFor="attachments-only">With Attachments</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="read-only" 
                checked={showReadOnly}
                onCheckedChange={(checked) => {
                  setShowReadOnly(checked);
                  if (checked) setShowUnreadOnly(false);
                }}
              />
              <Label htmlFor="read-only">Read Only</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="unread-only" 
                checked={showUnreadOnly}
                onCheckedChange={(checked) => {
                  setShowUnreadOnly(checked);
                  if (checked) setShowReadOnly(false);
                }}
              />
              <Label htmlFor="unread-only">Unread Only</Label>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex gap-2">
              <Button 
                variant={selectedPriority === 'high' ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedPriority(selectedPriority === 'high' ? null : 'high')}
              >
                High
              </Button>
              <Button 
                variant={selectedPriority === 'normal' ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedPriority(selectedPriority === 'normal' ? null : 'normal')}
              >
                Normal
              </Button>
              <Button 
                variant={selectedPriority === 'low' ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedPriority(selectedPriority === 'low' ? null : 'low')}
              >
                Low
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Sentiment</Label>
            <div className="flex gap-2">
              <Button 
                variant={selectedSentiment === 'positive' ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedSentiment(selectedSentiment === 'positive' ? null : 'positive')}
              >
                Positive
              </Button>
              <Button 
                variant={selectedSentiment === 'neutral' ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedSentiment(selectedSentiment === 'neutral' ? null : 'neutral')}
              >
                Neutral
              </Button>
              <Button 
                variant={selectedSentiment === 'negative' ? "default" : "outline"} 
                size="sm"
                onClick={() => setSelectedSentiment(selectedSentiment === 'negative' ? null : 'negative')}
              >
                Negative
              </Button>
            </div>
          </div>
          
          <div className="pt-2 flex justify-between">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset All
            </Button>
            <Button size="sm">
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
  
  // Email actions handlers
  const handleViewAttachments = (email: EmailWithContacts) => {
    toast({
      title: "Attachments",
      description: `Viewing ${email.attachments?.length || 0} attachments from email: ${email.subject}`,
    });
  };
  
  const handleReply = (email: EmailWithContacts) => {
    toast({
      title: "Reply",
      description: `Replying to: ${email.subject}`,
    });
  };
  
  const handleForward = (email: EmailWithContacts) => {
    toast({
      title: "Forward",
      description: `Forwarding: ${email.subject}`,
    });
  };
  
  const handleDelete = (id: string) => {
    toast({
      title: "Delete",
      description: "Email will be deleted permanently.",
      variant: "destructive",
    });
  };
  
  // Email attachment wrapper function to integrate with our imported component
  const renderEmailAttachments = (attachments?: Email['attachments']) => {
    if (!attachments || attachments.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Attachments ({attachments.length})</h4>
        <EmailAttachments 
          attachments={attachments} 
          onDownload={handleDownloadAttachment} 
        />
      </div>
    );
  };
  
  // Email Batch Actions Component
  const EmailBatchActions = () => {
    const hasSelectedEmails = selectedEmailIds.length > 0;
    
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="select-all" 
            checked={isSelectAll} 
            onCheckedChange={toggleSelectAll}
          />
          <Label htmlFor="select-all" className="text-xs">
            {hasSelectedEmails ? `${selectedEmailIds.length} selected` : 'Select all'}
          </Label>
        </div>
        
        {hasSelectedEmails && (
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Archive className="h-4 w-4 mr-1" />
              Archive
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Trash className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportEmails()}>
                  <Download className="mr-2 h-4 w-4" />
                  Export ({selectedEmailIds.length})
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Tag className="mr-2 h-4 w-4" />
                  Add Tags
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    );
  };

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
          <div
            className={cn(
              "cursor-pointer px-3 py-1.5 text-sm font-medium transition-colors",
              activeView === 'metakocka' ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => selectedEmail && setActiveView('metakocka')}
            style={{ opacity: selectedEmail ? 1 : 0.5, cursor: selectedEmail ? 'pointer' : 'not-allowed' }}
          >
            Metakocka
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

      {lastProcessed && stats && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Last email processing</AlertTitle>
          <AlertDescription>
            Processed {stats.processed} emails with {stats.errors} errors at {format(new Date(lastProcessed), 'PPpp')}
          </AlertDescription>
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
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
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
                <div className="p-3 border-b">
                  <EmailBatchActions />
                </div>
                {loading ? (
                  <div className="space-y-3 p-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse p-4 border-b">
                        <div className="flex items-start space-x-3">
                          <div className="h-8 w-8 bg-muted rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                            <div className="h-3 bg-muted rounded w-full"></div>
                            <div className="h-3 bg-muted rounded w-2/3"></div>
                          </div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    {searchQuery ? (
                      <>
                        <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No matching emails</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          No emails found matching "{searchQuery}". Try adjusting your search terms or clearing the search.
                        </p>
                        <Button onClick={() => setSearchQuery('')} variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Clear Search
                        </Button>
                      </>
                    ) : (
                      <>
                        <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No emails available</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          {activeTab === 'contacts' 
                            ? 'No emails with linked contacts found. Process some emails first or switch to "All" to see unlinked emails.'
                            : activeTab === 'unlinked'
                            ? 'No unlinked emails found. All your emails appear to be linked to contacts.'
                            : 'No emails have been processed yet. Click "Process Emails" to analyze your recent emails.'}
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button onClick={loadEmails} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                          </Button>
                          {activeTab !== 'all' && (
                            <Button onClick={() => setActiveTab('all')} variant="outline">
                              <Mail className="h-4 w-4 mr-2" />
                              View All Emails
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="divide-y">
                      {filteredEmails.map((email) => (
                        <div
                          key={email.id}
                          className={cn(
                            "p-4 hover:bg-muted/50 transition-colors",
                            selectedEmail?.id === email.id && "bg-muted"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="pt-1" onClick={(e) => {
                              e.stopPropagation();
                              const isCurrentlySelected = selectedEmailIds.includes(email.id);
                              toggleSelectEmail(email.id, !isCurrentlySelected);
                            }}>
                              <Checkbox 
                                checked={selectedEmailIds.includes(email.id)}
                                className="mt-0.5"
                              />
                            </div>
                            <div 
                              className="flex-1 min-w-0 cursor-pointer" 
                              onClick={() => viewEmail(email)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="font-semibold truncate text-foreground">{email.subject || '(No subject)'}</div>
                                <div className="flex items-center gap-2">
                                  {email.has_attachments && (
                                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDate(email.created_at)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm font-medium text-primary mt-1 truncate">
                                {getEmailSenderName(email)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-snug">
                                {truncateText(email.analysis || email.raw_content, 120)}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                                <User className="h-3 w-3" />
                                <span>{getEmailContactName(email)}</span>
                              </div>
                            </div>
                            <div className="ml-auto pl-2">
                              <EmailActionMenu 
                                email={email as any} 
                                onMarkRead={markAsRead}
                                onArchive={archiveEmail}
                                onViewAttachments={(email) => handleViewAttachments(email as EmailWithContacts)}
                                onReply={(email) => handleReply(email as EmailWithContacts)}
                                onForward={(email) => handleForward(email as EmailWithContacts)}
                                onDelete={handleDelete}
                              />
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
                  <div className="space-y-6">
                    {/* Email metadata */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{formatFullDate(selectedEmail.created_at)}</span>
                      </div>
                      
                      {selectedEmail.priority && (
                        <div className="flex items-center">
                          <Badge variant={selectedEmail.priority === 'high' ? 'destructive' : 
                                      selectedEmail.priority === 'low' ? 'secondary' : 'outline'}>
                            {selectedEmail.priority.charAt(0).toUpperCase() + selectedEmail.priority.slice(1)} Priority
                          </Badge>
                        </div>
                      )}
                      
                      {selectedEmail.sentiment && (
                        <div className="flex items-center">
                          <Badge variant={selectedEmail.sentiment === 'positive' ? 'success' : 
                                      selectedEmail.sentiment === 'negative' ? 'destructive' : 'secondary'}>
                            {selectedEmail.sentiment.charAt(0).toUpperCase() + selectedEmail.sentiment.slice(1)}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Email content */}
                    <div className="border rounded-md p-4 bg-muted/30">
                      <h3 className="text-sm font-medium mb-2">Email Content</h3>
                      <div className="whitespace-pre-wrap text-sm">
                        {selectedEmail.raw_content || 'No content available'}
                      </div>
                    </div>
                    
                    {/* Attachments */}
                    {selectedEmail.has_attachments && (
                      renderEmailAttachments(selectedEmail.attachments)
                    )}
                    
                    {/* AI Analysis */}
                    <div>
                      <h3 className="text-sm font-medium mb-2">AI Analysis</h3>
                      <div className="prose max-w-none dark:prose-invert">
                        {selectedEmail.analysis ? (
                          <div className="whitespace-pre-wrap text-sm">
                            {selectedEmail.analysis.split('\n').map((line, i) => (
                              <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\n/g, '<br/>') }} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground text-center py-4">
                            No analysis available for this email.
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Contact information */}
                    {selectedEmail.contacts && selectedEmail.contacts.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Linked Contacts</h3>
                        <div className="space-y-2">
                          {selectedEmail.contacts.map(contact => (
                            <div key={contact.id} className="flex items-center justify-between p-2 rounded-md border">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>{getInitials(contact.full_name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{contact.full_name}</p>
                                  <p className="text-xs text-muted-foreground">{contact.email}</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/contacts/${contact.id}`}>
                                  <ArrowUpRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          ))}
                        </div>
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
              <div className="space-y-6">
                {/* Email Header */}
                <div className="p-4 rounded-lg bg-muted/30 border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium text-lg mb-1">
                        {selectedEmail.subject || '(No subject)'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        From: {getEmailSenderName(selectedEmail)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Date: {formatDate(selectedEmail.created_at)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        <Mail className="h-3 w-3 mr-1" />
                        {selectedEmail.contacts && selectedEmail.contacts.length > 0 ? 'Linked Contact' : 'Unlinked'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Email Content */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Email Content</h3>
                  <div className="p-4 rounded-lg border bg-card">
                    {selectedEmail.raw_content ? (
                      <div className="prose max-w-none dark:prose-invert">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {selectedEmail.raw_content}
                        </div>
                      </div>
                    ) : (
                      <div className="italic text-muted-foreground text-center py-8">
                        No email content available.
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Analysis */}
                {selectedEmail.analysis && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">AI Analysis</h3>
                    <div className="p-4 rounded-lg border bg-primary/5">
                      <div className="prose max-w-none dark:prose-invert">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {selectedEmail.analysis}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                {selectedEmail.contacts && selectedEmail.contacts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-3">Linked Contact</h3>
                    <div className="p-4 rounded-lg border bg-card">
                      {selectedEmail.contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {getInitials(contact.full_name)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{contact.full_name}</div>
                            <div className="text-sm text-muted-foreground">{contact.email}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  <>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Generated Response:</label>
                        <Textarea
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          className="mt-2 min-h-[200px]"
                          placeholder="Generated response will appear here..."
                        />
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={() => {
                            setIsSending(true);
                            setSendStatus('sending');
                            // Simulate sending
                            setTimeout(() => {
                              setIsSending(false);
                              setSendStatus('sent');
                              toast({
                                title: "Response Sent",
                                description: "Your response has been sent successfully.",
                              });
                            }, 2000);
                          }}
                          disabled={isSending || !response.trim()}
                        >
                          {isSending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          {isSending ? 'Sending...' : 'Send Response'}
                        </Button>
                        
                        {sendStatus === 'sent' && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            <span className="text-sm">Response sent successfully!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Metakocka View */}
      {activeView === 'metakocka' && selectedEmail && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Metakocka Integration</CardTitle>
              <CardDescription>
                View Metakocka data related to this email and generate AI responses with Metakocka context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Metakocka Email Info Component */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Related Metakocka Data</h3>
                  <MetakockaEmailInfo emailId={selectedEmail.id} />
                </div>
                
                {/* Metakocka AI Response Component */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Generate AI Response with Metakocka Context</h3>
                  <MetakockaEmailResponse 
                    emailId={selectedEmail.id} 
                    onResponseGenerated={(response) => {
                      setSuggestedResponse(response);
                      setActiveView('response');
                      toast({
                        title: "Response Generated",
                        description: "AI response with Metakocka context has been generated.",
                      });
                    }} 
                  />
                </div>
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
