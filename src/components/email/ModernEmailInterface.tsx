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
  is_read: boolean;
  is_starred?: boolean;
  has_attachments?: boolean;
  folder: string;
  preview?: string;
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
  const [loadingContent, setLoadingContent] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'normal' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'sender' | 'subject'>('date');
  const [replyMode, setReplyMode] = useState<'reply' | 'replyAll' | 'forward' | null>(null);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [aiDraftContent, setAiDraftContent] = useState('');

  // Folder configuration with icons and colors
  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, color: 'text-blue-600' },
    { id: 'sent', label: 'Sent', icon: Send, color: 'text-green-600' },
    { id: 'starred', label: 'Starred', icon: Star, color: 'text-yellow-600' },
    { id: 'drafts', label: 'Drafts', icon: Edit3, color: 'text-gray-600' },
    { id: 'archive', label: 'Archive', icon: Archive, color: 'text-purple-600' },
    { id: 'trash', label: 'Trash', icon: Trash2, color: 'text-red-600' },
  ];

  // Fetch emails
  useEffect(() => {
    if (emailAccountId) {
      fetchEmails();
    }
  }, [emailAccountId, selectedFolder]);

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
        
        // Add preview text from plain_content if not present
        emailList = emailList.map((email: any) => ({
          ...email,
          preview: email.preview || email.plain_content?.substring(0, 100) || '',
        }));
        
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
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
          const content = data.html_content || data.plain_content || '';
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

  const filteredEmails = emails
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
                <DropdownMenuContent align="start" className="w-56">
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
        <div className="w-96 border-r border-gray-200 bg-white flex flex-col">
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
                    <DropdownMenuContent align="end" className="w-48">
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    className="h-7 w-7"
                  >
                    <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                  </Button>
                </div>
              </div>
              
              {/* Active Filters Display */}
              {(filterPriority !== 'all' || sortBy !== 'date') && (
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs text-gray-500">Active:</span>
                  {filterPriority !== 'all' && (
                    <Badge variant="secondary" className="text-xs">
                      Priority: {filterPriority}
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
            <span className="text-xs text-gray-500">
              {filteredEmails.length} messages
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Filter className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3 w-3" />
              </Button>
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
                        "p-3 hover:bg-gray-50 cursor-pointer transition-colors",
                        selectedEmail?.id === email.id && "bg-gradient-to-r from-purple-50 to-blue-50",
                        !email.is_read && "bg-blue-50/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
                            {getInitials(email.sender_name, email.sender_email)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-sm truncate",
                                  !email.is_read ? "font-semibold text-gray-900" : "text-gray-700"
                                )}>
                                  {email.sender_name || email.sender_email}
                                </span>
                                {email.priority === 'high' && (
                                  <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className={cn(
                                "text-sm truncate",
                                !email.is_read ? "font-medium text-gray-800" : "text-gray-600"
                              )}>
                                {email.subject || '(No subject)'}
                              </p>
                              {email.preview && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {email.preview}
                                </p>
                              )}
                              {/* Email Labels/Tags */}
                              {email.labels && email.labels.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {email.labels.slice(0, 3).map((label, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="text-xs px-1.5 py-0 h-4"
                                    >
                                      {label}
                                    </Badge>
                                  ))}
                                  {email.labels.length > 3 && (
                                    <span className="text-xs text-gray-400">+{email.labels.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {format(new Date(email.sent_at), 'MMM d')}
                              </span>
                              <div className="flex items-center gap-1">
                                {email.has_attachments && (
                                  <Paperclip className="h-3 w-3 text-gray-400" />
                                )}
                                <button
                                  onClick={(e) => toggleStar(email, e)}
                                  className="hover:scale-110 transition-transform"
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
                            </div>
                          </div>
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
                      <h2 className="font-semibold text-gray-900">
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
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Mark as unread</DropdownMenuItem>
                        <DropdownMenuItem>Add label</DropdownMenuItem>
                        <DropdownMenuItem>Print</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Report spam</DropdownMenuItem>
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
                          {format(new Date(selectedEmail.sent_at), 'PPpp')}
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
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: emailContent }}
                    />
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-600">
                        {selectedEmail.preview || 'No content available'}
                      </p>
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
            const response = await fetch('/api/email/draft', {
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
              throw new Error('Failed to save draft');
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
        defaultTo={replyMode === 'forward' ? '' : selectedEmail?.sender_email || ''}
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