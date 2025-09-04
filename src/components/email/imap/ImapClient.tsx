import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FaInbox, FaSpinner, FaReply, FaRobot } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";
import { Send, FileText, RefreshCw } from "lucide-react";
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  DollarSign, 
  AlertTriangle, 
  CreditCard, 
  Bot,
  Clock,
  Zap
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { generateEmailPreview } from '@/lib/email/utils';
import { analyzeEmailForUpsell, EmailWithUpsell } from '@/lib/email/enhanced-upsell-detection';
import { sortEmailsByUpsellPriority } from '@/lib/email/upsellDetection';
import EmailRenderer from '../EmailRenderer';
import CustomerInfoWidget from '../CustomerInfoWidget';
import AIDraftWindow from '../AIDraftWindow';
import { UpsellBadge } from '../UpsellIndicator';
import { EmailViewProvider, useEmailView } from '@/contexts/EmailViewContext';
import { motion, AnimatePresence } from 'framer-motion';
// import { EmailColorLegend } from '../EmailColorLegend';
import { sortEmailsSmart, getEmailBorderColor, markEmailAsReplied } from '@/lib/email/smart-email-sorting';
import { ProgressiveEmailLoader } from '@/lib/email/progressive-email-loader';
import { PermanentEmailStorage } from '@/lib/email/permanent-email-storage';
import { shouldEnableSmartSorting, shouldShowOpportunityBadges } from '@/lib/settings/display-settings';

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  folder: string;
  attachments: any[];
  // Agent assignment fields
  assigned_agent?: 'customer' | 'sales' | 'dispute' | 'billing' | 'auto_reply';
  highlight_color?: string;
  agent_priority?: 'low' | 'medium' | 'high' | 'urgent';
  auto_reply_enabled?: boolean;
  // Upsell analysis data
  upsellData?: EmailWithUpsell;
  // Reply tracking
  replied?: boolean;
  last_reply_at?: string;
}

// Create a compatible interface for sorting that matches the EmailForSorting from smart-email-sorting.ts
interface EmailForSorting {
  id: string;
  date: string;
  read: boolean;
  assigned_agent?: 'customer' | 'sales' | 'dispute' | 'billing' | 'auto_reply';
  highlight_color?: string;
  agent_priority?: 'low' | 'medium' | 'high' | 'urgent';
  upsellData?: {
    hasUpsellOpportunity: boolean;
    highestConfidence?: 'high' | 'medium' | 'low';
    totalPotentialValue?: number;
  };
  replied?: boolean;
  last_reply_at?: string;
}

// Helper function to convert Email to EmailForSorting
function emailToSortingFormat(email: Email): EmailForSorting {
  return {
    id: email.id,
    date: email.date,
    read: email.read,
    assigned_agent: email.assigned_agent,
    highlight_color: email.highlight_color,
    agent_priority: email.agent_priority,
    upsellData: email.upsellData ? {
      hasUpsellOpportunity: email.upsellData.hasUpsellOpportunity,
      highestConfidence: email.upsellData.highestConfidence === null ? undefined : email.upsellData.highestConfidence,
      totalPotentialValue: email.upsellData.totalPotentialValue
    } : undefined,
    replied: email.replied,
    last_reply_at: email.last_reply_at
  };
}

// Helper function to convert EmailForSorting back to Email (for state updates)
function sortingToEmailFormat(email: EmailForSorting, originalEmail: Email): Email {
  return {
    ...originalEmail,
    id: email.id,
    date: email.date,
    read: email.read,
    assigned_agent: email.assigned_agent,
    highlight_color: email.highlight_color,
    agent_priority: email.agent_priority,
    replied: email.replied,
    last_reply_at: email.last_reply_at
  };
}

interface ImapClientProps {
  account: any;
  folder?: string;
  onSalesAgent: (emailId: string, emailData?: any) => void;
  isSalesProcessing: boolean;
  onEmailCountChange?: (count: number) => void;
}

function ImapClientContent({ account, folder = 'Inbox', onSalesAgent, isSalesProcessing, onEmailCountChange }: ImapClientProps) {
  const { data: session } = useSession();
  const supabase = createClientComponentClient();
  const {
    viewMode,
    selectedEmailId,
    emailData,
    showDraftWindow,
    setSelectedEmailId,
    setEmailData,
    setViewMode,
    startReply,
    closeDraftWindow,
    backToList
  } = useEmailView();
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 50, phase: 'initial' as const });
  const [readEmails, setReadEmails] = useLocalStorage<Set<string>>(`readEmails_${account?.id}`, new Set());
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreEmails, setHasMoreEmails] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string>(folder || 'Inbox');
  const [folders, setFolders] = useState<any[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);


  // Load folders function
  const loadFolders = async () => {
    if (!session?.user || !account?.id || account.provider_type !== 'imap') return;
    
    try {
      console.log('Loading folders for account:', account.id);
      const response = await fetch(`/api/email/imap-folders?accountId=${account.id}`);
      const data = await response.json();
      
      console.log('Folders response:', data);
      if (data.success && data.folders) {
        setFolders(data.folders);
        console.log('Set folders:', data.folders);
      } else {
        console.warn('No folders returned, using default folders:', data);
        // Set default folders if API fails
        setFolders([
          { name: 'INBOX', path: 'INBOX', displayName: 'Inbox' },
          { name: 'Sent', path: 'Sent', displayName: 'Sent' },
          { name: 'Drafts', path: 'Drafts', displayName: 'Drafts' }
        ]);
      }
    } catch (error) {
      console.error('Error loading folders, using defaults:', error);
      // Set default folders if there's an error
      setFolders([
        { name: 'INBOX', path: 'INBOX', displayName: 'Inbox' },
        { name: 'Sent', path: 'Sent', displayName: 'Sent' },
        { name: 'Drafts', path: 'Drafts', displayName: 'Drafts' }
      ]);
    }
  };

  // Load emails function
  const loadEmails = async (folder: string = currentFolder) => {
    if (!session?.user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    if (!account?.id) {
      setError('No email account selected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Reset infinite scroll state when loading new folder
      setEmails([]); // Clear existing emails
      setDisplayCount(10);
      setHasMoreEmails(true);
      
      // Reset page counter for initial load
      const pageKey = `emailPage_${account?.id}_${folder}`;
      localStorage.setItem(pageKey, '1'); // Set to page 1 for initial load
      
      console.log('Loading emails with permanent storage...', { 
        accountType: account?.provider_type, 
        accountId: account?.id,
        folder 
      });

      // Use permanent storage system - handles caching, AI analysis, and progressive loading
      const emailStorage = new PermanentEmailStorage();
      const storedEmails = await emailStorage.loadEmails(account.id, account.organization_id, folder, 50);
      
      console.log(`Loaded ${storedEmails.length} emails from permanent storage`);
      
      // Transform stored emails to UI format
      const transformedEmails: Email[] = storedEmails.map((email: any) => ({
        id: email.id,
        from: email.sender || email.from_address || 'Unknown Sender',
        subject: email.subject || '(No Subject)',
        body: email.raw_content || email.html_content || '',
        date: email.created_at || email.received_date || new Date().toISOString(),
        read: readEmails.has(email.id) || email.processing_status !== 'pending',
        folder: email.folder || 'inbox',
        attachments: email.attachments || [],
        // AI analysis data (already processed and stored permanently)
        assigned_agent: email.assigned_agent,
        highlight_color: email.highlight_color,
        agent_priority: email.agent_priority,
        upsellData: email.upsell_data,  // This should work correctly now
        replied: email.replied,
        auto_reply_enabled: false
      }));

      console.log('Setting emails in state:', transformedEmails.length, 'emails');
      setEmails(transformedEmails);
      setLoading(false);
      
      // Check if there are more emails available
      setHasMoreEmails(storedEmails.length >= 50);
      
    } catch (error) {
      console.error('Error loading emails from permanent storage:', error);
      setError('Failed to load emails. Please try again.');
      setEmails([]);
      setLoading(false);
    }
  };

  // Refresh emails
  const refreshEmails = async () => {
    console.log('Refreshing emails...');
    setEmails([]);
    await loadEmails(currentFolder);
  };



  // Load more emails (for infinite scroll)
  const loadMoreEmails = useCallback(async (triggerLoadMore: boolean = false) => {
    if (isLoadingMore || !hasMoreEmails || !account?.id) return;

    try {
      setIsLoadingMore(true);
      
      const emailStorage = new PermanentEmailStorage();
      const moreEmails = await emailStorage.loadEmails(account.id, account.organization_id, currentFolder, 20);
      
      if (moreEmails.length === 0) {
        setHasMoreEmails(false);
        return;
      }
      
      // Transform and append new emails
      const transformedEmails: Email[] = moreEmails.map((email: any) => ({
        id: email.id,
        from: email.sender || email.from_address || 'Unknown Sender',
        subject: email.subject || '(No Subject)',
        body: email.raw_content || email.html_content || '',
        date: email.created_at || email.received_date || new Date().toISOString(),
        read: readEmails.has(email.id) || email.processing_status !== 'pending',
        folder: email.folder || 'inbox',
        attachments: email.attachments || [],
        assigned_agent: email.assigned_agent,
        highlight_color: email.highlight_color,
        agent_priority: email.agent_priority,
        upsellData: email.upsell_data,
        replied: email.replied,
        auto_reply_enabled: false
      }));

      setEmails(prev => [...prev, ...transformedEmails]);
      setHasMoreEmails(moreEmails.length >= 20);
    } catch (error) {
      console.error('Error loading more emails:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreEmails, emails.length, account, currentFolder, readEmails]);

  // Skip the rest of the old broken code and continue with the working functions
  const skipOldCode = () => {
    // This function exists to skip over the broken old code
    return true;
  };

  // Helper function for showing sample data when needed
  const showSampleData = () => {
    // If no emails found, show sample data
    console.log('No emails found, showing sample data');
    const sampleEmails: Email[] = [
      {
        id: 'sample-1',
        from: 'john.doe@example.com',
        subject: 'Welcome to Fresh AI CRM!',
        body: 'Hi there! Welcome to your new CRM system. We\'re excited to help you manage your business relationships more effectively.',
        date: new Date(Date.now() - 86400000).toISOString(),
        read: false,
        folder: 'inbox',
        attachments: []
      },
      {
        id: 'sample-2',
        from: 'support@freshaicrm.com',
        subject: 'Getting Started Guide',
        body: 'Here\'s a quick guide to help you get started with Fresh AI CRM. You can connect your email accounts, manage contacts, and track interactions.',
        date: new Date(Date.now() - 172800000).toISOString(),
        read: true,
        folder: 'inbox',
        attachments: []
      }
    ];

    setEmails(sampleEmails);
    setLoading(false);
  };

  // Handle folder change
  const handleFolderChange = (folder: string) => {
    console.log('Changing to folder:', folder);
    let actualFolderName = folder;
    
    // For Google accounts, use Gmail folder names
    if (account?.provider_type === 'google') {
      // Gmail uses lowercase folder names, map display names to Gmail queries
      if (folder === 'Inbox') {
        actualFolderName = 'inbox';
      } else if (folder === 'Sent') {
        actualFolderName = 'sent';
      } else if (folder === 'Drafts') {
        actualFolderName = 'drafts';
      }
    } else {
      // For IMAP accounts, map display folder names to actual IMAP folder names
      if (folder === 'Inbox') {
        actualFolderName = 'INBOX';
      } else if (folder === 'Sent') {
        // Try common sent folder names
        const sentFolder = folders.find(f => 
          f.name.toLowerCase().includes('sent') || 
          f.displayName?.toLowerCase() === 'sent'
        );
        actualFolderName = sentFolder?.name || 'Sent';
      } else if (folder === 'Drafts') {
        // Try common draft folder names  
        const draftFolder = folders.find(f => 
          f.name.toLowerCase().includes('draft') || 
          f.displayName?.toLowerCase() === 'drafts'
        );
        actualFolderName = draftFolder?.name || 'Drafts';
      }
    }
    
    console.log('Using folder name:', actualFolderName);
    setCurrentFolder(folder);
    setSelectedEmail(null);
    setEmails([]); // Clear existing emails to prevent duplicates
    setDisplayCount(10); // Reset display count
    setHasMoreEmails(true); // Reset pagination state
    setNextPageToken(null); // Reset Gmail page token
    
    // Reset page counter for IMAP accounts
    if (account?.provider_type === 'imap') {
      const pageKey = `emailPage_${account?.id}_${folder}`;
      localStorage.removeItem(pageKey);
    }
    
    loadEmails(actualFolderName);
  };

  // Initialize component
  // Update currentFolder when folder prop changes
  useEffect(() => {
    if (folder && folder !== currentFolder) {
      setCurrentFolder(folder);
    }
  }, [folder, currentFolder]);

  useEffect(() => {
    if (session?.user) {
      loadFolders();
      loadEmails();
    }
  }, [session, account?.id, currentFolder]);

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setSelectedEmailId(email.id);
    setEmailData({
      subject: email.subject,
      body: email.body,
      from: email.from,
      to: ''
    });
    setViewMode('detail');
  };

  const handleReply = () => {
    if (selectedEmail) {
      startReply(selectedEmail.id, {
        subject: `Re: ${selectedEmail.subject}`,
        body: `<br/><br/>On ${new Date(selectedEmail.date).toLocaleString()}, ${selectedEmail.from} wrote:<br/>`,
        from: selectedEmail.from,
        to: ''
      }, 'reply');
    }
  };

  const handleMarkAsReplied = (emailId: string) => {
    setEmails(prevEmails => 
      prevEmails.map(email => 
        email.id === emailId 
          ? sortingToEmailFormat(markEmailAsReplied(emailToSortingFormat(email)), email)
          : email
      )
    );
  };

  const handleSalesAgent = () => {
    if (selectedEmail) {
      onSalesAgent(selectedEmail.id, selectedEmail);
    }
  };

  // Helper function to get agent icon
  const getAgentIcon = (agentType?: string) => {
    switch (agentType) {
      case 'sales': return <DollarSign className="h-3 w-3" />;
      case 'customer': return <User className="h-3 w-3" />;
      case 'dispute': return <AlertTriangle className="h-3 w-3" />;
      case 'billing': return <CreditCard className="h-3 w-3" />;
      case 'auto_reply': return <Bot className="h-3 w-3" />;
      default: return <Bot className="h-3 w-3" />;
    }
  };

  // Helper function to get agent label
  const getAgentLabel = (agentType?: string) => {
    switch (agentType) {
      case 'sales': return 'Sales';
      case 'customer': return 'Support';
      case 'dispute': return 'Dispute';
      case 'billing': return 'Billing';
      case 'auto_reply': return 'Auto Reply';
      default: return 'General';
    }
  };

  // Helper function to get priority icon
  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent': return <Zap className="h-3 w-3 text-red-500" />;
      case 'high': return <Clock className="h-3 w-3 text-orange-500" />;
      default: return null;
    }
  };



  // Infinite scroll effect - only within email container
  useEffect(() => {
    if (isLoadingMore || !hasMoreEmails) return;

    const scrollContainer = document.getElementById('email-scroll-container');
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (isLoadingMore) return; // Prevent multiple simultaneous loads
      
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      // Trigger load when user scrolls to within 200px of bottom
      if (scrollHeight - (scrollTop + clientHeight) < 200) {
        loadMoreEmails(true);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [isLoadingMore, hasMoreEmails, emails.length, loadMoreEmails]);


  // Sort emails based on user preference
  const sortedEmails = shouldEnableSmartSorting() 
    ? sortEmailsSmart(emails.map(emailToSortingFormat)) 
    : [...emails].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const displayedEmails = sortedEmails.slice(0, displayCount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FaSpinner className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <span className="text-gray-600">Loading emails...</span>
          {loadingProgress.loaded > 0 && (
            <div className="mt-2">
              <div className="text-sm text-gray-500">
                {loadingProgress.loaded} of {loadingProgress.total} emails loaded
              </div>
              <div className="w-48 bg-gray-200 rounded-full h-2 mt-1 mx-auto">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(loadingProgress.loaded / loadingProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={refreshEmails} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
          <div className="flex-1 flex gap-3 p-3 min-h-0 h-full">
            <div className="email-list-container bg-gray-50 rounded-lg border" style={{ width: '380px', height: '100%', flexShrink: 0 }}>
              {/* Email list header with color legend */}
              <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-white rounded-t-lg">
                <h3 className="text-sm font-medium text-gray-900">
                  Emails ({emails.length})
                </h3>
                {/* <EmailColorLegend /> */}
              </div>
              <div className="h-full overflow-y-auto" id="email-scroll-container" style={{ height: 'calc(100% - 60px)' }}>
                <div className="p-2">

                  <div className="space-y-1">
                    {emails.length === 0 ? (
                      <div className="text-center py-8">
                        <FaInbox className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500">No emails found</p>
                        <p className="text-sm text-gray-400">Your emails will appear here</p>

                      </div>
                    ) : (
                      <>
                        {displayedEmails.map((email) => (
                          <div
                            key={email.id}
                            className={`email-list-item cursor-pointer p-2 rounded-lg border transition-all duration-200 ${
                              selectedEmail?.id === email.id
                                ? 'selected bg-blue-50 border-blue-300 shadow-sm'
                                : email.read
                                ? 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                : 'unread bg-blue-25 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                            }`}
                            onClick={() => handleEmailClick(email as Email)}
                                        style={{
              borderLeft: shouldEnableSmartSorting() 
                ? `4px solid ${getEmailBorderColor(emailToSortingFormat(email as Email), selectedEmail?.id === email.id)}`
                : selectedEmail?.id === email.id 
                ? '4px solid #3B82F6'
                : !email.read 
                ? '4px solid #3B82F6' 
                : '4px solid transparent'
            }}
                          >
                            <div className="w-full">
                                <div className="flex items-start justify-between mb-0.5">
                                  <p className={`text-xs font-medium truncate flex-1 pr-1 ${
                                    email.read ? 'text-gray-600' : 'text-gray-800'
                                  }`}
                                   title={(email as Email).from}
                                   style={{ maxWidth: 'calc(100% - 70px)' }}>
                                    {(email as Email).from}
                                  </p>
                                  <div className="flex items-center space-x-2 flex-shrink-0 min-w-[70px] justify-end">
                                    {!email.read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    )}
                                    <span className={`text-xs whitespace-nowrap ${!email.read ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                                      {new Date(email.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                                      {new Date(email.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                                <p className={`email-subject text-sm mb-0.5 leading-tight ${
                                  email.read ? 'font-normal text-gray-700' : 'font-bold text-blue-900'
                                }`}
                                   style={{
                                     display: '-webkit-box',
                                     WebkitLineClamp: 2,
                                     WebkitBoxOrient: 'vertical',
                                     overflow: 'hidden',
                                     textOverflow: 'ellipsis'
                                   }}
                                   title={(email as Email).subject}>
                                  {(email as Email).subject}
                                </p>
                                
                                {/* Agent, Priority, and Upsell Badges */}
                                <div className="flex items-center flex-wrap gap-1 mb-0.5">
                                  {email.assigned_agent && (
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs px-1 py-0 h-4 bg-white border-gray-300"
                                      style={{ 
                                        backgroundColor: email.highlight_color ? `${email.highlight_color}20` : undefined,
                                        borderColor: email.highlight_color || undefined 
                                      }}
                                    >
                                      {getAgentIcon(email.assigned_agent)}
                                      <span className="ml-1">{getAgentLabel(email.assigned_agent)}</span>
                                    </Badge>
                                  )}
                                  {getPriorityIcon(email.agent_priority)}
                                  {(email as Email).upsellData && shouldShowOpportunityBadges() && (
                                    <UpsellBadge 
                                      upsellData={(email as Email).upsellData!}
                                      onClick={() => {
                                        // Optional: Could open upsell details modal
                                        console.log('Upsell opportunity clicked:', (email as Email).upsellData);
                                      }}
                                    />
                                  )}
                                </div>
                                
                                <p className="email-preview text-xs text-gray-500 leading-tight" 
                                   style={{
                                     display: '-webkit-box',
                                     WebkitLineClamp: 1,
                                     WebkitBoxOrient: 'vertical',
                                     overflow: 'hidden',
                                     textOverflow: 'ellipsis'
                                   }}>
                                  {generateEmailPreview((email as Email).body, 70)}
                                </p>
                              </div>
                          </div>
                        ))}
                        
                        {/* Loading indicator */}
                        {isLoadingMore && (
                          <div className="text-center py-4">
                            <FaSpinner className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                            <p className="text-sm text-gray-500 mt-2">Loading more emails...</p>
                          </div>
                        )}
                        
                        {/* End of emails indicator */}
                        {!hasMoreEmails && emails.length > 0 && displayedEmails.length >= emails.length && (
                          <div className="text-center py-4 text-sm text-gray-400">
                            No more emails to load
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Email Detail View */}
            <div className="flex-1 min-w-0 flex flex-col" style={{ height: '100%' }}>
              <AnimatePresence mode="wait">
                {viewMode === 'list' && (
                  <motion.div
                    key="no-selection"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="bg-white h-full rounded-lg border shadow-sm flex items-center justify-center">
                      <CardContent className="h-full flex items-center justify-center">
                        <div className="text-center py-16">
                          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <FaInbox className="h-10 w-10 text-gray-400" />
                          </div>
                          <p className="text-lg font-medium text-gray-500">Select an email to view</p>
                          <p className="text-sm text-gray-400">Your selection will be displayed here.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {viewMode === 'detail' && selectedEmail && (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="h-full flex flex-col"
                  >
                    {/* Email Header - Fixed */}
                    <Card className="bg-white rounded-lg rounded-b-none border-b-0 shadow-sm flex-shrink-0">
                      <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-800 leading-tight">{selectedEmail.subject}</CardTitle>
                            <CardDescription className="text-sm text-gray-600">
                              From: {selectedEmail.from} | On: {new Date(selectedEmail.date).toLocaleString()}
                            </CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Button onClick={handleReply} variant="outline" size="sm">
                              Reply
                            </Button>
                            <Button
                              onClick={handleSalesAgent}
                              disabled={isSalesProcessing}
                              variant="outline"
                              size="sm"
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            >
                              {isSalesProcessing ? (
                                <>
                                  <FaSpinner className="h-3 w-3 mr-1 animate-spin" />
                                  AI Working...
                                </>
                              ) : (
                                <>
                                  <FaRobot className="h-3 w-3 mr-1" />
                                  AI Analysis & Draft
                                </>
                              )}
                            </Button>
                            <Button onClick={backToList} variant="outline" size="sm">
                              Back
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                    
                    {/* Email Body - Scrollable */}
                    <Card className="flex-1 bg-white rounded-none border-t-0 border-b-0 shadow-sm min-h-0 overflow-hidden">
                      <CardContent className="p-4 h-full overflow-y-auto">
                        <EmailRenderer content={selectedEmail.body} />
                      </CardContent>
                    </Card>
                    
                    {/* Customer Info - Fixed at bottom */}
                    <Card className="bg-white rounded-lg rounded-t-none border-t-0 shadow-sm flex-shrink-0">
                      <div className="p-3 border-t bg-gray-50">
                        <CustomerInfoWidget 
                          customerEmail={selectedEmail.from} 
                        />
                      </div>
                    </Card>
                  </motion.div>
                )}

                {viewMode === 'split-reply' && selectedEmail && (
                  <motion.div
                    key="split-reply"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="flex flex-col h-full"
                  >
                    {/* Email Body - Top Half */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="flex-1 min-h-0 mb-2"
                    >
                      <Card className="bg-white rounded-lg shadow-sm h-full flex flex-col">
                        <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100 py-2 flex-shrink-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-md font-semibold text-gray-800 leading-tight">{selectedEmail.subject}</CardTitle>
                              <CardDescription className="text-xs text-gray-600">
                                From: {selectedEmail.from}
                              </CardDescription>
                            </div>
                            <Button onClick={closeDraftWindow} variant="outline" size="sm">
                              Close Reply
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 h-full overflow-y-auto">
                          <EmailRenderer content={selectedEmail.body} />
                        </CardContent>
                      </Card>
                    </motion.div>
                    
                    {/* Draft Window - Bottom Half */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="flex-1 min-h-0"
                    >
                      <AIDraftWindow
                        emailId={selectedEmail.id}
                        originalEmail={{
                          subject: selectedEmail.subject,
                          body: selectedEmail.body,
                          from: selectedEmail.from,
                          to: ''
                        }}
                        onSendDraft={async (draftData) => {
                          console.log('Sending draft:', draftData);
                          closeDraftWindow();
                        }}
                        onRegenerateDraft={async () => {
                          console.log('Regenerating draft...');
                        }}
                        className="h-full"
                        position="inline"
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
    </div>
  );
}

export default function ImapClient({ account, folder, onSalesAgent, isSalesProcessing, onEmailCountChange }: ImapClientProps) {
  return (
    <EmailViewProvider>
      <ImapClientContent account={account} folder={folder} onSalesAgent={onSalesAgent} isSalesProcessing={isSalesProcessing} onEmailCountChange={onEmailCountChange} />
    </EmailViewProvider>
  );
} 