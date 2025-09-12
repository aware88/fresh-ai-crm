/**
 * OptimizedEmailList Component
 * 
 * Uses the new optimized email architecture for lightning-fast performance
 * and 95% storage reduction while maintaining full functionality.
 */

'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { useOptimizedEmails, useEmailContent } from '@/hooks/useOptimizedEmails';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { generateEmailPreview } from '@/lib/email/email-content-parser';
import { 
  Mail, 
  MailOpen, 
  Star, 
  Archive, 
  Trash2, 
  Reply, 
  Forward, 
  Search,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  User,
  CreditCard,
  Bot,
  Clock,
  Database,
  Zap,
  Paperclip,
  MoreHorizontal,
  ChevronDown,
  Filter,
  Tag,
  Check
} from 'lucide-react';

interface OptimizedEmailListProps {
  emailAccountId: string;
  folder?: string;
  selectedEmailId?: string;
  onEmailSelect?: (messageId: string) => void;
  onAnalyzeEmail?: (messageId: string) => void;
  onSalesAgent?: (messageId: string) => void;
}

export default function OptimizedEmailList({
  emailAccountId,
  folder = 'INBOX',
  selectedEmailId: parentSelectedEmailId,
  onEmailSelect,
  onAnalyzeEmail,
  onSalesAgent
}: OptimizedEmailListProps) {
  console.log(`🔥 [OptimizedEmailList] Component rendered with accountId: ${emailAccountId}, folder: ${folder}`);
  // Use parent's selectedEmailId if provided, otherwise maintain local state
  const [localSelectedEmailId, setLocalSelectedEmailId] = useState<string | null>(null);
  const selectedEmailId = parentSelectedEmailId || localSelectedEmailId;
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  
  const {
    emails,
    loading,
    error,
    hasMore,
    loadEmails,
    loadMoreEmails,
    refreshEmails,
    getEmailContent,
    searchEmails,
    markAsRead,
    markAsReplied,
    markAsUnread,
    analyzeEmail,
    stats,
    contentLoading,
    analysisLoading
  } = useOptimizedEmails({
    emailAccountId,
    folder,
    autoLoad: true,
    enableRealTimeSync: true,
    loadContentOnInit: true // Preload email content on initial load
  });

  // Virtualization setup (must be after filteredEmails is available)
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const itemSizeEstimate = 150; // approximate row height incl. padding/borders (optimized for content)
  const rowVirtualizer = useVirtualizer({
    count: filteredEmails.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => itemSizeEstimate,
    overscan: 5,
  });

  // Handle checkbox selection
  const handleCheckboxChange = useCallback((messageId: string, checked: boolean) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(messageId);
      } else {
        newSet.delete(messageId);
      }
      return newSet;
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedEmails(new Set(emails.map(e => e.message_id)));
    } else {
      setSelectedEmails(new Set());
    }
  }, [emails]);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action: string) => {
    const selectedArray = Array.from(selectedEmails);
    
    switch (action) {
      case 'mark-read':
        for (const id of selectedArray) {
          await markAsRead(id);
        }
        break;
      case 'mark-unread':
        for (const id of selectedArray) {
          await markAsUnread(id);
        }
        break;
      case 'analyze':
        for (const id of selectedArray) {
          await analyzeEmail(id);
        }
        break;
      // Add more bulk actions as needed
    }
    
    setSelectedEmails(new Set());
    await refreshEmails();
  }, [selectedEmails, markAsRead, markAsUnread, analyzeEmail, refreshEmails]);

  // Handle email selection
  const handleEmailClick = useCallback(async (messageId: string) => {
    console.log('🔥 [OptimizedEmailList] Email clicked:', messageId);
    
    // Update local state if no parent control
    if (!parentSelectedEmailId) {
      setLocalSelectedEmailId(messageId);
    }
    
    // Mark as read
    await markAsRead(messageId);
    
    // Content is now preloaded, so no need to load it on-demand
    
    // Notify parent (this should update parent's selectedEmailId)
    onEmailSelect?.(messageId);
    
    console.log('🔥 [OptimizedEmailList] Parent notified with messageId:', messageId);
  }, [markAsRead, onEmailSelect, parentSelectedEmailId]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchEmails(query);
    } else {
      await refreshEmails();
    }
  }, [searchEmails, refreshEmails]);

  // Handle email analysis
  const handleAnalyzeEmail = useCallback(async (messageId: string) => {
    await analyzeEmail(messageId);
    onAnalyzeEmail?.(messageId);
  }, [analyzeEmail, onAnalyzeEmail]);

  // Handle sales agent
  const handleSalesAgent = useCallback((messageId: string) => {
    onSalesAgent?.(messageId);
  }, [onSalesAgent]);

  // Listen for read status changes from other components
  useEffect(() => {
    const handleReadStatusChange = () => {
      refreshEmails(); // Refresh the email list when read status changes
    };

    window.addEventListener('emailReadStatusChanged', handleReadStatusChange);
    return () => {
      window.removeEventListener('emailReadStatusChanged', handleReadStatusChange);
    };
  }, [refreshEmails]);

  // Filter emails based on status and agent
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      if (filterStatus !== 'all') {
        if (filterStatus === 'unread' && email.is_read) return false;
        if (filterStatus === 'read' && !email.is_read) return false;
        if (filterStatus === 'replied' && !email.replied) return false;
      }
      
      if (filterAgent !== 'all' && email.assigned_agent !== filterAgent) {
        return false;
      }
      
      return true;
    });
  }, [emails, filterStatus, filterAgent]);

  // Get unique agents for filter
  const uniqueAgents = useMemo(() => {
    const agents = new Set(emails.map(e => e.assigned_agent).filter(Boolean));
    return Array.from(agents);
  }, [emails]);

  // Get agent icon
  const getAgentIcon = (agentType?: string) => {
    switch (agentType) {
      case 'customer': return <User className="h-3 w-3" />;
      case 'sales': return <DollarSign className="h-3 w-3" />;
      case 'dispute': return <AlertTriangle className="h-3 w-3" />;
      case 'billing': return <CreditCard className="h-3 w-3" />;
      case 'auto_reply': return <Bot className="h-3 w-3" />;
      default: return <Bot className="h-3 w-3" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500';
      case 'high': return 'border-orange-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-green-500';
      default: return 'border-gray-200';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    // Format the time part
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (diffHours < 24) {
      return timeStr;
    } else if (diffHours < 48) {
      return `Yesterday, ${timeStr}`;
    } else if (diffHours < 168) { // 7 days
      return `${date.toLocaleDateString([], { weekday: 'short' })}, ${timeStr}`;
    } else {
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    }
  };

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">Failed to load emails</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button onClick={refreshEmails} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with search and stats */}
      <Card className="mb-2 shadow-sm flex-shrink-0">
        <CardHeader className="pb-3 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              {folder} ({filteredEmails.length}/{emails.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshEmails}
                disabled={loading}
                className="h-8 px-2"
                aria-label="Refresh emails"
                title="Refresh emails"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 h-9"
              aria-label="Search emails"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Status: {filterStatus}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-32">
                <DropdownMenuCheckboxItem
                  checked={filterStatus === 'all'}
                  onCheckedChange={() => setFilterStatus('all')}
                >
                  All
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterStatus === 'unread'}
                  onCheckedChange={() => setFilterStatus('unread')}
                >
                  Unread
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterStatus === 'read'}
                  onCheckedChange={() => setFilterStatus('read')}
                >
                  Read
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterStatus === 'replied'}
                  onCheckedChange={() => setFilterStatus('replied')}
                >
                  Replied
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {uniqueAgents.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    Agent: {filterAgent}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-36">
                  <DropdownMenuCheckboxItem
                    checked={filterAgent === 'all'}
                    onCheckedChange={() => setFilterAgent('all')}
                  >
                    All
                  </DropdownMenuCheckboxItem>
                  {uniqueAgents.map((agent) => (
                    <DropdownMenuCheckboxItem
                      key={agent}
                      checked={filterAgent === agent}
                      onCheckedChange={() => setFilterAgent(agent)}
                    >
                      {getAgentIcon(agent)}
                      <span className="ml-1">{agent}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Active Filters Display */}
            {(filterStatus !== 'all' || filterAgent !== 'all') && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Active:</span>
                {filterStatus !== 'all' && (
                  <Badge variant="secondary" className="text-xs h-5">
                    {filterStatus}
                  </Badge>
                )}
                {filterAgent !== 'all' && (
                  <Badge variant="secondary" className="text-xs h-5">
                    {filterAgent}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterAgent('all');
                  }}
                  title="Clear filters"
                >
                  ✕
                </Button>
              </div>
            )}
          </div>

        </CardHeader>
      </Card>

      {/* Email List */}
      <Card className="flex-1 min-h-0 shadow-sm border-gray-200 overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          <AnimatePresence>
            {loading && emails.length === 0 ? (
              // Loading skeleton
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredEmails.length === 0 ? (
              // Empty state
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No emails found</p>
                  <p className="text-sm text-gray-400">
                    {searchQuery || filterStatus !== 'all' || filterAgent !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : 'Your emails will appear here'
                    }
                  </p>
                  {(filterStatus !== 'all' || filterAgent !== 'all') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterAgent('all');
                      }}
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              // Virtualized email list
              <div 
                className="overflow-auto flex-1 min-h-0" 
                ref={viewportRef}
              >
                <div
                  style={{ 
                    height: `${rowVirtualizer.getTotalSize()}px`, 
                    width: '100%', 
                    position: 'relative' 
                  }}
                >
                    {(() => {
                      const virtualItems = rowVirtualizer.getVirtualItems();
                      console.log(`🎯 [OptimizedEmailList] Virtual items to render: ${virtualItems.length}/${filteredEmails.length}, totalSize: ${rowVirtualizer.getTotalSize()}px`);
                      
                      // Debug: Check if filteredEmails array has unique items
                      if (filteredEmails.length > 0) {
                        const uniqueIds = new Set(filteredEmails.map(e => e.message_id));
                        if (uniqueIds.size !== filteredEmails.length) {
                          console.warn(`⚠️ Duplicate emails detected! ${filteredEmails.length} emails but only ${uniqueIds.size} unique IDs`);
                        }
                        // Log first 3 emails to verify they're different
                        console.log('First 3 filtered emails in list:', filteredEmails.slice(0, 3).map(e => ({ 
                          id: e.message_id?.substring(0, 20), 
                          subject: e.subject?.substring(0, 30) 
                        })));
                      }
                      
                      return virtualItems.map((virtualRow) => {
                      const index = virtualRow.index;
                      const email = filteredEmails[index];
                      
                      if (!email) {
                        console.error(`❌ No email at index ${index}`);
                        return null;
                      }
                      
                      return (
                        <motion.div
                          key={`email-${email.message_id}-${index}`}
                          data-index={virtualRow.index}
                          ref={(node) => rowVirtualizer.measureElement?.(node)}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`px-4 py-3 cursor-pointer transition-all duration-200 border-b border-gray-100 ${
                            selectedEmailId === email.message_id
                              ? 'selected bg-blue-50 border-blue-200 shadow-sm'
                              : email.is_read
                              ? 'bg-white hover:bg-gray-50'
                              : 'unread bg-blue-50/30 hover:bg-blue-50/50 border-blue-100'
                          } ${
                            virtualRow.index % 2 ? 'ListItemOdd' : 'ListItemEven'
                          }`}
                          onClick={() => handleEmailClick(email.message_id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleEmailClick(email.message_id);
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            minHeight: '150px',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                            borderLeft: selectedEmailId === email.message_id
                              ? '4px solid #3B82F6'
                              : !email.is_read
                              ? '4px solid #3B82F6'
                              : '4px solid transparent'
                          }}
                        >
                          <div className="w-full overflow-hidden">
                            <div className="flex items-center justify-between mb-1">
                              <p className={`text-sm font-semibold truncate flex-1 ${
                                email.is_read ? 'text-gray-800' : 'text-gray-900'
                              }`}
                               title={email.sender_name || email.sender_email}>
                                {email.sender_name || email.sender_email}
                              </p>
                              <div className="flex items-center space-x-2 flex-shrink-0 min-w-[80px] justify-end">
                                {!email.is_read && (
                                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                                )}
                                {email.has_attachments && (
                                  <div title={`${email.attachment_count || 1} attachment${email.attachment_count > 1 ? 's' : ''}`}>
                                    <Paperclip className="h-4 w-4 text-blue-600" />
                                  </div>
                                )}
                                <span className={`text-xs font-medium whitespace-nowrap ${!email.is_read ? 'text-blue-700' : 'text-gray-500'}`}>
                                  {formatDate(email.received_at)}
                                </span>
                              </div>
                            </div>

                            <p className={`text-sm mb-1.5 leading-snug ${
                              email.is_read ? 'font-semibold text-gray-800' : 'font-bold text-gray-900'
                            }`}
                               style={{
                                 display: '-webkit-box',
                                 WebkitLineClamp: 1,
                                 WebkitBoxOrient: 'vertical',
                                 overflow: 'hidden',
                                 textOverflow: 'ellipsis'
                               }}
                               title={email.subject}>
                              {email.subject || '(No Subject)'}
                            </p>

                            <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                              {email.assigned_agent && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs px-1.5 py-0 h-5 bg-white border-gray-200"
                                  style={{ 
                                    backgroundColor: email.highlight_color ? `${email.highlight_color}15` : undefined,
                                    borderColor: email.highlight_color || undefined 
                                  }}
                                >
                                  {getAgentIcon(email.assigned_agent)}
                                  <span className="ml-1">{email.assigned_agent}</span>
                                </Badge>
                              )}
                              {email.upsell_data?.hasUpsellOpportunity && (
                                <Badge variant="default" className="bg-green-100 text-green-800 text-xs px-1.5 py-0 h-5">
                                  ${email.opportunity_value}
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-gray-600 leading-relaxed mb-1.5" 
                               style={{
                                 display: '-webkit-box',
                                 WebkitLineClamp: 2,
                                 WebkitBoxOrient: 'vertical',
                                 overflow: 'hidden',
                                 textOverflow: 'ellipsis',
                                 wordBreak: 'break-word'
                               }}>
                              {email.preview_text || generateEmailPreview(email.html_content || email.plain_content || '', 150) || 'No preview available'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center space-x-1.5">
                              {email.replied && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 bg-gray-50 border-gray-200 text-gray-600">
                                  <Reply className="h-3 w-3 mr-0.5" /> Replied
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center space-x-1">
                              {email.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 rounded-full hover:bg-gray-50"
                                  aria-label="Mark as unread"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsUnread(email.message_id);
                                  }}
                                >
                                  <Mail className="h-3 w-3" />
                                </Button>
                              )}
                              {!email.ai_analyzed && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 rounded-full hover:bg-blue-50"
                                  aria-label="Analyze email with AI"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAnalyzeEmail(email.message_id);
                                  }}
                                  disabled={analysisLoading.has(email.message_id)}
                                >
                                  {analysisLoading.has(email.message_id) ? (
                                    <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-500 rounded-full" />
                                  ) : (
                                    <Bot className="h-3 w-3" />
                                  )}
                                </Button>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 rounded-full hover:bg-green-50"
                                aria-label="Open sales agent for email"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSalesAgent(email.message_id);
                                }}
                              >
                                <DollarSign className="h-3 w-3 text-green-600" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    });
                    })()}
                  </div>
                
                  {/* Load more button */}
                  {hasMore && (
                    <div className="p-4 text-center border-t">
                      <Button
                        variant="outline"
                        onClick={loadMoreEmails}
                        disabled={loading}
                        className="px-4 py-2 h-9"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin h-4 w-4 border border-gray-300 border-t-blue-500 rounded-full mr-2" />
                            Loading...
                          </>
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
