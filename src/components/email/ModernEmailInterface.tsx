'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  Mail,
  Inbox,
  Send,
  Star,
  Archive,
  Trash2,
  Search,
  Filter,
  MoreVertical,
  Reply,
  ReplyAll,
  Forward,
  Paperclip,
  Calendar,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Edit3,
  AlertCircle,
  CheckCircle,
  Circle,
  Sparkles,
  Bot,
  User,
  Users,
  Settings,
  Plus,
  RefreshCw,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ComposeEmailModal from './ComposeEmailModal';
import { generateEmailTags, getTagClasses } from '@/lib/email/email-tags';
import { toast } from 'sonner';

interface EmailAccount {
  id: string;
  email: string;
  provider_type: string;
  is_active: boolean;
  real_time_sync_active?: boolean;
}

interface Email {
  id: string;
  message_id: string;
  subject: string;
  sender_email: string;
  sender_name?: string;
  recipient_email: string;
  sent_at: string;
  received_at?: string; // For incoming emails
  is_read: boolean;
  is_starred?: boolean;
  has_attachments?: boolean;
  folder: string;
  preview?: string;
  preview_text?: string; // Primary preview field from email_index
  body_text?: string;
  body_html?: string;
  plain_content?: string; // From email_content_cache
  labels?: string[];
  priority?: 'high' | 'normal' | 'low';
}

interface ModernEmailInterfaceProps {
  emailAccountId?: string;
  onAnalyzeEmail?: (emailId: string, emailData?: any) => void;
  onSalesAgent?: (emailId: string, emailData?: any) => void;
  onCompose?: () => void;
  onAccountChange?: (accountId: string) => void;
  accounts?: EmailAccount[];
}

export default function ModernEmailInterface({
  emailAccountId,
  onAnalyzeEmail,
  onSalesAgent,
  onCompose,
  onAccountChange,
  accounts = [],
}: ModernEmailInterfaceProps) {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [folderCounts, setFolderCounts] = useState<{ [key: string]: number }>({});
  const [emailContent, setEmailContent] = useState<string>('');
  const [emailAttachments, setEmailAttachments] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'normal' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'sender' | 'subject'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'unread' | 'read' | 'important' | 'with-attachments'>('all');
  const [replyMode, setReplyMode] = useState<'reply' | 'replyAll' | 'forward' | null>(null);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiDraftContent, setAiDraftContent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const emailsPerPage = 25; // Show 25 emails per page instead of 100

  // Folder configuration with icons and colors
  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, color: 'text-blue-600' },
    { id: 'sent', label: 'Sent', icon: Send, color: 'text-green-600' },
    { id: 'starred', label: 'Starred', icon: Star, color: 'text-yellow-600' },
    { id: 'drafts', label: 'Drafts', icon: Edit3, color: 'text-gray-600' },
    { id: 'archive', label: 'Archive', icon: Archive, color: 'text-purple-600' },
    { id: 'trash', label: 'Trash', icon: Trash2, color: 'text-red-600' },
  ];

  // Auto-sync function
  const performAutoSync = async () => {
    if (!emailAccountId) return;
    
    // Only perform auto-sync if user is properly authenticated
    try {
      const sessionCheck = await fetch('/api/auth/session');
      const sessionData = await sessionCheck.json();
      if (!sessionData?.user?.id) {
        console.log('⏸️ Skipping auto-sync: User not authenticated');
        return;
      }
    } catch (error) {
      console.log('⏸️ Skipping auto-sync: Session check failed');
      return;
    }
    
    try {
      const response = await fetch('/api/email/auto-sync-on-load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: emailAccountId })
      });
      const data = await response.json();
      
      if (data.synced) {
        console.log(`✅ Auto-synced ${data.emailsSynced} new emails`);
        // Refresh email list after sync
        setTimeout(() => fetchEmails(), 1000);
        toast.success(`Synced ${data.emailsSynced} new emails`);
      } else {
        console.log(`📧 Emails are up to date (last sync: ${data.minutesSinceSync || 0} min ago)`);
      }
    } catch (err) {
      console.error('Auto-sync error:', err);
    }
  };

  // Initial fetch and auto-sync
  useEffect(() => {
    if (emailAccountId) {
      performAutoSync();
      fetchEmails();
    }
  }, [emailAccountId, selectedFolder]);

  // Set up periodic auto-sync every 2 minutes
  useEffect(() => {
    if (!emailAccountId) return;
    
    // Sync every 2 minutes while the email tab is open
    const syncInterval = setInterval(() => {
      console.log('⏰ Running periodic auto-sync...');
      performAutoSync();
    }, 2 * 60 * 1000); // 2 minutes
    
    // Cleanup interval on unmount
    return () => clearInterval(syncInterval);
  }, [emailAccountId]);

  const fetchEmails = async () => {
    if (!emailAccountId) return;
    
    setLoading(true);
    try {
      const folderMap: { [key: string]: string } = {
        inbox: 'INBOX',
        sent: 'Sent',
        starred: 'INBOX',
        drafts: 'Drafts',
        archive: 'Archive',
        trash: 'Trash',
      };

      const response = await fetch(
        `/api/emails/optimized-list?accountId=${emailAccountId}&folder=${folderMap[selectedFolder] || 'INBOX'}&limit=50`
      );
      
      if (response.ok) {
        const data = await response.json();
        let emailList = data.emails || [];
        
        // Filter starred emails if in starred folder
        if (selectedFolder === 'starred') {
          emailList = emailList.filter((e: Email) => e.is_starred);
        }
        
        // Debug: Log the first email to see available preview fields
        if (emailList.length > 0) {
          console.log('📧 Email preview data from API:', {
            subject: emailList[0].subject,
            preview_text: emailList[0].preview_text?.substring(0, 80),
            plain_content: emailList[0].plain_content?.substring(0, 80),
            html_content: emailList[0].html_content ? 'Available' : 'None',
            hasPreview: !!emailList[0].preview_text,
            sent_at: emailList[0].sent_at,
            received_at: emailList[0].received_at,
            created_at: emailList[0].created_at,
          });
        }
        
        setEmails(emailList);
        
        // Update folder counts
        updateFolderCounts(emailList);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFolderCounts = (emailList: Email[]) => {
    // This would be enhanced to fetch actual counts from API
    // For now, just show the current folder count
    const currentCount = emailList.length;
    setFolderCounts(prev => ({
      ...prev,
      [selectedFolder]: currentCount,
    }));
  };

  const handleRefresh = async (forceSync = false) => {
    setIsRefreshing(true);
    
    // If force sync, call the force sync endpoint first
    if (forceSync && emailAccountId) {
      try {
        const response = await fetch('/api/email/force-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            accountId: emailAccountId,
            receivedCount: 2500,
            sentCount: 2500
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          toast.success(`Synced ${result.emailsSynced || 0} new emails`);
        } else {
          toast.error('Sync failed: ' + (result.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Force sync error:', error);
        toast.error('Failed to sync emails');
      }
    }
    
    await fetchEmails();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // No longer needed - both reply and reply-all use the same cached draft
  const generateAIDraft = async () => {
    // Draft is already loaded from cache in handleEmailSelect
    return aiDraftContent;
  };

  const handleReply = async (type: 'reply' | 'replyAll' | 'forward') => {
    if (!selectedEmail) return;
    
    setReplyMode(type);
    
    // For forward, no AI draft needed
    if (type === 'forward') {
      setAiDraftContent(''); // Clear any draft
      setShowComposeModal(true);
      return;
    }
    
    // For both reply and reply-all, use the same cached draft
    // The draft is already loaded from cache when the email was selected
    // The compose modal will handle the recipient differences
    
    // Open compose modal with pre-filled data
    setShowComposeModal(true);
  };

  const handleEmailSelect = async (email: Email) => {
    setSelectedEmail(email);
    setEmailContent('');
    setEmailAttachments([]); // Reset attachments
    setAiDraftContent(''); // Reset previous draft
    
    // Mark as read
    if (!email.is_read) {
      markAsRead(email.id);
    }
    
    // Fetch full email content and cached AI draft in parallel
    setLoadingContent(true);
    
    try {
      // Fetch email content
      const contentPromise = fetch(`/api/email/${email.message_id}`).then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          let content = data.html_content || data.plain_content || '';
          
          // Process HTML to fix images and add security
          if (data.html_content) {
            // Create a temporary div to parse HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = content;
            
            // Fix all images
            const images = tempDiv.querySelectorAll('img');
            images.forEach(img => {
              // Add loading lazy attribute
              img.setAttribute('loading', 'lazy');
              
              // Add error handling
              img.onerror = function() {
                this.style.display = 'none';
              };
              
              // If src starts with cid: (embedded image), hide it for now
              const src = img.getAttribute('src');
              if (src && src.startsWith('cid:')) {
                img.style.display = 'none';
              }
              
              // Add max width to prevent overflow
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
            });
            
            // Remove potentially dangerous elements
            const scripts = tempDiv.querySelectorAll('script, iframe, embed, object');
            scripts.forEach(el => el.remove());
            
            content = tempDiv.innerHTML;
          } else if (data.plain_content) {
            // Convert plain text to HTML with proper line breaks
            content = data.plain_content
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\n/g, '<br>');
          }
          
          // Save attachments if any
          if (data.attachments && data.attachments.length > 0) {
            setEmailAttachments(data.attachments);
          } else {
            setEmailAttachments([]);
          }
          
          setEmailContent(content);
          return content;
        }
        return '';
      });
      
      // Fetch cached AI draft (should be instant)
      const draftPromise = fetch(`/api/emails/ai-cache?emailId=${email.message_id}`)
        .then(async (response) => {
          if (response.ok) {
            const data = await response.json();
            if (data.cached && data.draft) {
              // Use cached draft
              const draftContent = data.draft.body || data.draft.content || '';
              setAiDraftContent(draftContent);
              console.log('[Email] Using cached draft, age:', data.cacheAge, 'seconds');
              return draftContent;
            } else {
              // No cache found, trigger background generation for next time
              console.log('[Email] No cached draft found, triggering background generation');
              fetch('/api/emails/ai-cache', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  emailId: email.message_id,
                  forceReprocess: false 
                })
              }).catch(err => console.error('[Email] Background generation failed:', err));
            }
          }
          return '';
        })
        .catch(error => {
          console.error('[Email] Failed to fetch cached draft:', error);
          return '';
        });
      
      // Wait for both to complete
      await Promise.all([contentPromise, draftPromise]);
      
    } catch (error) {
      console.error('[Email] Failed to fetch email content:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      await fetch(`/api/email/${emailId}/read-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true }),
      });
      
      setEmails(prev =>
        prev.map(e => (e.id === emailId ? { ...e, is_read: true } : e))
      );
    } catch (error) {
      console.error('Failed to mark email as read:', error);
    }
  };

  const markAsUnread = async (emailId: string) => {
    try {
      await fetch(`/api/email/${emailId}/read-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: false }),
      });
      
      setEmails(prev =>
        prev.map(e => (e.id === emailId ? { ...e, is_read: false } : e))
      );
    } catch (error) {
      console.error('Failed to mark email as unread:', error);
    }
  };

  const handlePrintEmail = (email: Email) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Email</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
              .content { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <div class="header">
              <h3>${email.subject}</h3>
              <p><strong>From:</strong> ${email.sender_name} &lt;${email.sender_email}&gt;</p>
              <p><strong>Date:</strong> ${new Date(email.received_at).toLocaleString()}</p>
            </div>
            <div class="content">${email.body_text || email.body_html || 'No content'}</div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleReportSpam = async (emailId: string) => {
    try {
      await fetch(`/api/emails/report-spam/${emailId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      // You might want to remove the email from the list or mark it as spam
      console.log('Email reported as spam');
    } catch (error) {
      console.error('Failed to report spam:', error);
    }
  };

  const handleAddLabel = (emailId: string) => {
    // This would typically open a label selection dialog
    console.log('Add label functionality - to be implemented with label dialog');
  };


  const toggleStar = async (email: Email, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStarred = !email.is_starred;
    
    try {
      // Update locally first for instant feedback
      setEmails(prev =>
        prev.map(e => (e.id === email.id ? { ...e, is_starred: newStarred } : e))
      );
      
      // Then update on server
      await fetch(`/api/emails/update/${email.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_starred: newStarred }),
      });
    } catch (error) {
      console.error('Failed to toggle star:', error);
      // Revert on error
      setEmails(prev =>
        prev.map(e => (e.id === email.id ? { ...e, is_starred: !newStarred } : e))
      );
    }
  };

  // Handler functions for dropdowns
  const handleMarkAllAsRead = async () => {
    try {
      // Update UI first for immediate feedback
      setEmails(prev => prev.map(email => ({ ...email, is_read: true })));
      
      // Then update on server
      const visibleEmailIds = filteredEmails.map(email => email.message_id);
      await fetch('/api/emails/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emailIds: visibleEmailIds, 
          updates: { is_read: true } 
        }),
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      // Refresh emails on error
      fetchEmails();
    }
  };

  const handleRefreshEmails = () => {
    fetchEmails();
  };

  const handleSelectAll = () => {
    const allIds = filteredEmails.map(email => email.message_id);
    setSelectedEmails(new Set(allIds));
  };

  const handleArchiveAll = async () => {
    try {
      const visibleEmailIds = filteredEmails.map(email => email.message_id);
      await fetch('/api/emails/bulk-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIds: visibleEmailIds }),
      });
      
      // Remove archived emails from view
      setEmails(prev => 
        prev.filter(email => !visibleEmailIds.includes(email.message_id))
      );
    } catch (error) {
      console.error('Failed to archive all:', error);
    }
  };

  const allFilteredEmails = emails
    .filter(email => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          email.subject?.toLowerCase().includes(query) ||
          email.sender_email?.toLowerCase().includes(query) ||
          email.sender_name?.toLowerCase().includes(query) ||
          email.preview?.toLowerCase().includes(query);
        if (!matches) return false;
      }
      
      // Priority filter
      if (filterPriority !== 'all' && email.priority !== filterPriority) {
        return false;
      }
      
      // Status filter (read/unread/important/attachments)
      if (filterBy !== 'all') {
        switch (filterBy) {
          case 'unread':
            if (email.is_read) return false;
            break;
          case 'read':
            if (!email.is_read) return false;
            break;
          case 'important':
            if (!email.is_starred && email.priority !== 'high') return false;
            break;
          case 'with-attachments':
            if (!email.has_attachments) return false;
            break;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'sender':
          return (a.sender_name || a.sender_email).localeCompare(b.sender_name || b.sender_email);
        case 'subject':
          return a.subject.localeCompare(b.subject);
        case 'date':
        default:
          return new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime();
      }
    });

  // Calculate pagination
  const totalPages = Math.ceil(allFilteredEmails.length / emailsPerPage);
  const startIndex = (currentPage - 1) * emailsPerPage;
  const endIndex = startIndex + emailsPerPage;
  const filteredEmails = allFilteredEmails.slice(startIndex, endIndex);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPriority, filterBy, sortBy, selectedFolder]);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'low':
        return 'text-gray-400';
      default:
        return 'text-blue-500';
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email ? email[0].toUpperCase() : '?';
  };

  const getEmailBodyPreview = (email: any) => {
    // Priority order for preview content - prefer processed content from API
    const possibleFields = [
      email.preview_text,   // Enhanced from API (processed from cache + original preview)
      email.plain_content,  // Flattened from email_content_cache
      email.html_content,   // Flattened from email_content_cache (will be processed)
      email.body_text,      // Legacy field
      email.content,        // Generic content field
      email.text_content,   // Other text field
      email.fetched_content // Async fetched content
    ];

    for (const field of possibleFields) {
      if (field && typeof field === 'string' && field.trim().length > 0) {
        // Skip if it's just the subject repeated or generic placeholder
        const fieldTrimmed = field.trim();
        if (fieldTrimmed === email.subject || 
            fieldTrimmed.toLowerCase().includes('email from') ||
            fieldTrimmed.toLowerCase() === 'click to view email content' ||
            fieldTrimmed.toLowerCase() === 'loading email content...') {
          continue;
        }
        
        // Process content based on format
        let textContent = field;
        
        // If it looks like HTML, strip tags
        if (field.includes('<') && field.includes('>')) {
          textContent = field.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        } else {
          // Clean plain text whitespace
          textContent = field.replace(/\s+/g, ' ').trim();
        }
        
        // Return cleaned content if valid
        if (textContent.length > 0 && textContent !== email.subject) {
          return textContent.length > 150 
            ? textContent.slice(0, 150) + '...'
            : textContent;
        }
      }
    }

    // Don't fetch content automatically for preview - only when email is selected
    // This prevents flooding the API with requests for all 100 emails
    // The preview_text should already be available from the database
    
    // Return empty string instead of generic message since sender is already shown in row 1
    return '';
  };

  const fetchEmailContentAsync = async (messageId: string) => {
    try {
      const response = await fetch(`/api/email/${messageId}`);
      if (response.ok) {
        const data = await response.json();
        return data.plain || data.text || null;
      }
    } catch (error) {
      console.error('Error fetching email content:', error);
    }
    return null;
  };

  const getEmailTags = (email: any) => {
    // Map email data to tag format
    const tagData = {
      importance: email.importance,
      assigned_agent: email.assigned_agent,
      agent_priority: email.agent_priority,
      upsell_data: email.upsell_data,
      sentiment_score: email.sentiment_score,
      language_code: email.language_code,
      ai_analyzed: email.ai_analyzed,
      has_attachments: email.has_attachments,
      classification: {
        category: email.category || email.assigned_agent,
        intent: email.intent,
        sentiment: email.sentiment,
        urgency: email.urgency
      }
    };
    
    return generateEmailTags(tagData);
  };

  return (
    <TooltipProvider>
      <div className="flex h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-200">
        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{ width: isSidebarCollapsed ? '64px' : '240px' }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="border-r border-gray-200 bg-white flex flex-col"
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              {!isSidebarCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900">Mail</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="h-8 w-8"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Compose Button */}
          <div className="p-3">
            <Button
              onClick={() => setShowComposeModal(true)}
              className={cn(
                "w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md",
                isSidebarCollapsed ? "px-0" : ""
              )}
            >
              {isSidebarCollapsed ? (
                <Plus className="h-4 w-4" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Compose
                </>
              )}
            </Button>
          </div>

          {/* Folders */}
          <ScrollArea className="flex-1 px-3">
            <div className="space-y-1 pb-4">
              {folders.map((folder) => {
                const Icon = folder.icon;
                const isSelected = selectedFolder === folder.id;
                
                return (
                  <Tooltip key={folder.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setSelectedFolder(folder.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                          isSelected
                            ? "bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 font-medium"
                            : "hover:bg-gray-100 text-gray-700"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 flex-shrink-0", folder.color)} />
                        {!isSidebarCollapsed && (
                          <>
                            <span className="flex-1 text-left text-sm">{folder.label}</span>
                            {folderCounts[folder.id] > 0 && (
                              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                                {folderCounts[folder.id]}
                              </Badge>
                            )}
                          </>
                        )}
                      </button>
                    </TooltipTrigger>
                    {isSidebarCollapsed && (
                      <TooltipContent side="right">
                        <p>{folder.label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </ScrollArea>

          {/* Account Switcher */}
          {!isSidebarCollapsed && accounts.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start text-xs">
                    <User className="h-3 w-3 mr-2" />
                    <span className="truncate">
                      {accounts.find(a => a.id === emailAccountId)?.email || 'Select Account'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-white border border-gray-200 shadow-lg z-50">
                  {accounts.map((account) => (
                    <DropdownMenuItem
                      key={account.id}
                      onClick={() => onAccountChange?.(account.id)}
                    >
                      <Mail className="h-3 w-3 mr-2" />
                      <span className="truncate">{account.email}</span>
                      {account.real_time_sync_active && (
                        <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </motion.div>

        {/* Email List */}
        <div className="w-[400px] border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-100">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-20 h-9 bg-gray-50 border-gray-200 focus:bg-white"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-lg z-50">
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-500 mb-2">Priority</p>
                        <div className="space-y-1">
                          {['all', 'high', 'normal', 'low'].map((priority) => (
                            <button
                              key={priority}
                              onClick={() => setFilterPriority(priority as any)}
                              className={cn(
                                "w-full text-left px-2 py-1 rounded text-sm",
                                filterPriority === priority
                                  ? "bg-purple-100 text-purple-700"
                                  : "hover:bg-gray-100"
                              )}
                            >
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-500 mb-2">Sort by</p>
                        <div className="space-y-1">
                          {['date', 'sender', 'subject'].map((sort) => (
                            <button
                              key={sort}
                              onClick={() => setSortBy(sort as any)}
                              className={cn(
                                "w-full text-left px-2 py-1 rounded text-sm",
                                sortBy === sort
                                  ? "bg-purple-100 text-purple-700"
                                  : "hover:bg-gray-100"
                              )}
                            >
                              {sort.charAt(0).toUpperCase() + sort.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
                      <DropdownMenuItem 
                        onClick={() => handleRefresh(false)} 
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3 mr-2" />
                        Quick Refresh
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleRefresh(true)} 
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <Download className="h-3 w-3 mr-2" />
                        Force Full Sync
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Active Filters Display */}
              {(filterPriority !== 'all' || sortBy !== 'date' || filterBy !== 'all') && (
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs text-gray-500">Active:</span>
                  {filterPriority !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Priority: {filterPriority}
                    </Badge>
                  )}
                  {filterBy !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Filter: {filterBy}
                    </Badge>
                  )}
                  {sortBy !== 'date' && (
                    <Badge variant="secondary" className="text-xs">
                      Sort: {sortBy}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Email List Header */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {allFilteredEmails.length > 0 ? 
                  `${startIndex + 1}-${Math.min(endIndex, allFilteredEmails.length)} of ${allFilteredEmails.length}` : 
                  '0 messages'}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Filter className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
                  <DropdownMenuItem onClick={() => setFilterBy('all')} className="hover:bg-gray-50 cursor-pointer">All emails</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy('unread')} className="hover:bg-gray-50 cursor-pointer">Unread only</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy('read')} className="hover:bg-gray-50 cursor-pointer">Read only</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy('important')} className="hover:bg-gray-50 cursor-pointer">Important</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy('with-attachments')} className="hover:bg-gray-50 cursor-pointer">Has attachments</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
                  <DropdownMenuItem onClick={() => handleMarkAllAsRead()} className="hover:bg-gray-50 cursor-pointer">Mark all as read</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRefreshEmails()} className="hover:bg-gray-50 cursor-pointer">Refresh</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSelectAll()} className="hover:bg-gray-50 cursor-pointer">Select all</DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-200" />
                  <DropdownMenuItem onClick={() => handleArchiveAll()} className="hover:bg-gray-50 cursor-pointer">Archive all</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Email List */}
          <ScrollArea className="flex-1">
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No emails found</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredEmails.map((email, index) => (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleEmailSelect(email)}
                      className={cn(
                        "px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0",
                        selectedEmail?.id === email.id && "bg-gradient-to-r from-purple-50 to-blue-50",
                        !email.is_read && "bg-blue-50/30"
                      )}
                    >
                      <div className="flex flex-col gap-2">
                        {/* Row 1: Sender, Date/Time, Icons */}
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
                              {getInitials(email.sender_name, email.sender_email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <span className={cn(
                              "text-sm font-medium truncate block",
                              !email.is_read ? "text-gray-900" : "text-gray-700"
                            )}>
                              {email.sender_name || email.sender_email}
                            </span>
                          </div>
                          {email.priority === 'high' && (
                            <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                          )}
                          {/* Date/Time - Simplified */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-[11px] text-gray-600 font-medium">
                              {(() => {
                                const dateStr = email.sent_at || email.received_at || email.created_at;
                                if (!dateStr) return 'No date';
                                try {
                                  const date = new Date(dateStr);
                                  if (isNaN(date.getTime())) return 'Invalid';
                                  return format(date, 'MMM d');
                                } catch {
                                  return 'Error';
                                }
                              })()}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {(() => {
                                const dateStr = email.sent_at || email.received_at || email.created_at;
                                if (!dateStr) return '';
                                try {
                                  const date = new Date(dateStr);
                                  if (isNaN(date.getTime())) return '';
                                  return format(date, 'h:mm a');
                                } catch {
                                  return '';
                                }
                              })()}
                            </div>
                          </div>
                          {email.has_attachments && (
                            <Paperclip className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          )}
                          <button
                            onClick={(e) => toggleStar(email, e)}
                            className="hover:scale-110 transition-transform flex-shrink-0"
                          >
                            <Star
                              className={cn(
                                "h-3 w-3",
                                email.is_starred
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-400"
                              )}
                            />
                          </button>
                        </div>

                        {/* Row 2: Subject */}
                        <div>
                          <p className={cn(
                            "text-sm truncate",
                            !email.is_read ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                          )}>
                            {email.subject || '(No subject)'}
                          </p>
                        </div>

                        {/* Row 3: Preview - Fixed width like shadcn example */}
                        <div>
                          <p className="text-xs text-gray-600 line-clamp-2 w-[340px] whitespace-break-spaces">
                            {getEmailBodyPreview(email)}
                          </p>
                        </div>

                        {/* Row 4: AI-Generated Tags */}
                        <div className="min-h-[16px]">
                            {(() => {
                              const aiTags = getEmailTags(email);
                              return aiTags.length > 0 ? (
                                <div className="flex gap-1 flex-wrap">
                                  {aiTags.map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className={getTagClasses(tag)}
                                    >
                                      {tag.label}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                // Show manual labels if no AI tags available (backward compatibility)
                                email.labels && email.labels.length > 0 ? (
                                  <div className="flex gap-1 flex-wrap">
                                    {email.labels.slice(0, 3).map((label, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs px-1.5 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200"
                                      >
                                        {label}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : null
                              );
                            })()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Email Detail */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedEmail(null)}
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900 leading-tight">
                        {selectedEmail.subject || '(No subject)'}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedEmail.labels?.map((label) => (
                          <Badge key={label} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleReply('reply')}
                          disabled={aiDraftLoading}
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reply</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleReply('replyAll')}
                          disabled={aiDraftLoading}
                        >
                          <ReplyAll className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reply All</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleReply('forward')}
                          disabled={aiDraftLoading}
                        >
                          <Forward className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Forward</TooltipContent>
                    </Tooltip>
                    <Separator orientation="vertical" className="mx-1 h-4" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onAnalyzeEmail?.(selectedEmail.id, selectedEmail)}
                        >
                          <Sparkles className="h-4 w-4 text-purple-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>AI Analysis</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onSalesAgent?.(selectedEmail.id, selectedEmail)}
                        >
                          <Bot className="h-4 w-4 text-blue-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Sales Agent</TooltipContent>
                    </Tooltip>
                    <Separator orientation="vertical" className="mx-1 h-4" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Archive className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Archive</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg z-50">
                        <DropdownMenuItem 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => markAsUnread(selectedEmail.id)}
                        >
                          Mark as unread
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleAddLabel(selectedEmail.id)}
                        >
                          Add label
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handlePrintEmail(selectedEmail)}
                        >
                          Print
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-200" />
                        <DropdownMenuItem 
                          className="hover:bg-gray-50 cursor-pointer text-red-600"
                          onClick={() => handleReportSpam(selectedEmail.id)}
                        >
                          Report spam
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Email Content */}
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-4xl mx-auto">
                  {/* Sender Info */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                          {getInitials(selectedEmail.sender_name, selectedEmail.sender_email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedEmail.sender_name || selectedEmail.sender_email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedEmail.sender_email}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {(() => {
                            const dateStr = selectedEmail.sent_at || selectedEmail.received_at || selectedEmail.created_at;
                            if (!dateStr) return 'No date available';
                            
                            try {
                              const date = new Date(dateStr);
                              if (isNaN(date.getTime()) || date.getFullYear() < 2000) {
                                return 'Date not available';
                              }
                              return format(date, 'PPpp');
                            } catch (e) {
                              return 'Invalid date';
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Body */}
                  {loadingContent ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                    </div>
                  ) : emailContent ? (
                    <div 
                      className="prose prose-sm max-w-none prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-a:text-blue-600 prose-a:underline"
                      dangerouslySetInnerHTML={{ __html: emailContent }}
                    />
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-600">
                        {selectedEmail.preview || 'No content available'}
                      </p>
                    </div>
                  )}
                  
                  {/* Attachments Section */}
                  {emailAttachments && emailAttachments.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Attachments ({emailAttachments.length})
                      </h3>
                      <div className="space-y-2">
                        {emailAttachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                          >
                            <div className="flex-shrink-0">
                              {attachment.contentType?.includes('image') ? (
                                <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center">
                                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              ) : attachment.contentType?.includes('pdf') ? (
                                <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {attachment.filename || attachment.name || 'Unnamed file'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Size unknown'}
                                {attachment.contentType && ` • ${attachment.contentType.split('/')[1]?.toUpperCase() || attachment.contentType}`}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                // Handle download - you'll need to implement this based on how attachments are stored
                                console.log('Download attachment:', attachment);
                                toast.info('Attachment download functionality coming soon');
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Mail className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select an email to read
                </h3>
                <p className="text-sm text-gray-500">
                  Choose an email from the list to view its contents
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Compose Modal */}
      <ComposeEmailModal
        isOpen={showComposeModal}
        onClose={() => {
          setShowComposeModal(false);
          setReplyMode(null);
          setAiDraftContent('');
        }}
        onSend={async (emailData) => {
          try {
            // Send email via API
            const response = await fetch('/api/email/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...emailData,
                accountId: emailAccountId,
              }),
            });
            
            if (response.ok) {
              toast.success('Email sent successfully');
              await fetchEmails();
            } else {
              throw new Error('Failed to send email');
            }
          } catch (error) {
            console.error('Failed to send email:', error);
            toast.error('Failed to send email');
            throw error;
          }
        }}
        onDraftSave={async (emailData) => {
          try {
            // Save draft via API
            const response = await fetch('/api/email/save-draft', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...emailData,
                accountId: emailAccountId,
              }),
            });
            
            if (response.ok) {
              toast.success('Draft saved');
            } else {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to save draft');
            }
          } catch (error) {
            console.error('Failed to save draft:', error);
            toast.error('Failed to save draft');
            throw error;
          }
        }}
        onAIDraft={async (prompt) => {
          try {
            // Generate AI content
            const response = await fetch('/api/ai/generate-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt }),
            });
            
            if (response.ok) {
              const data = await response.json();
              return data.content;
            } else {
              throw new Error('Failed to generate content');
            }
          } catch (error) {
            console.error('Failed to generate AI content:', error);
            toast.error('Failed to generate content');
            throw error;
          }
        }}
        accounts={accounts}
        selectedAccountId={emailAccountId}
        defaultTo={
          replyMode === 'reply' 
            ? selectedEmail?.sender_email || ''
            : replyMode === 'replyAll'
            ? selectedEmail?.sender_email || ''
            : '' // forward
        }
        defaultCc={
          replyMode === 'replyAll' && selectedEmail
            ? (() => {
                // For Reply All, include all original recipients except current user and sender
                const currentUserEmail = accounts.find(a => a.id === emailAccountId)?.email;
                const ccEmails = [];
                
                // Add original recipient if it's not the current user or sender
                if (selectedEmail.recipient_email && 
                    selectedEmail.recipient_email !== currentUserEmail && 
                    selectedEmail.recipient_email !== selectedEmail.sender_email) {
                  ccEmails.push(selectedEmail.recipient_email);
                }
                
                // TODO: Add original CC recipients if available in the email data
                // This would require expanding the email data structure to include original CC
                
                return ccEmails;
              })()
            : []
        }
        defaultSubject={
          replyMode && selectedEmail 
            ? replyMode === 'forward' 
              ? `Fwd: ${selectedEmail.subject}`
              : `Re: ${selectedEmail.subject}`
            : ''
        }
        defaultBody={aiDraftContent}
        replyTo={replyMode ? selectedEmail : undefined}
      />
    </TooltipProvider>
  );
}