/**
 * React Hook: useOptimizedEmails
 * 
 * Provides a seamless interface for the optimized email system:
 * - Lightning-fast email list loading (metadata only)
 * - On-demand content loading with smart caching
 * - Zero impact on existing components
 * - Full search and filtering capabilities
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { optimizedEmailService } from '@/lib/email/optimized-email-service';
// Import types from the service
type EmailWithContent = any; // Will be properly typed from the service
type EmailLoadOptions = any; // Will be properly typed from the service

interface UseOptimizedEmailsOptions {
  emailAccountId?: string;
  folder?: string;
  autoLoad?: boolean;
  enableRealTimeSync?: boolean;
  loadContentOnInit?: boolean; // Whether to preload email content on initial load
}

interface UseOptimizedEmailsReturn {
  emails: EmailWithContent[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  
  // Actions
  loadEmails: (options?: EmailLoadOptions) => Promise<void>;
  loadMoreEmails: () => Promise<void>;
  refreshEmails: () => Promise<void>;
  getEmailContent: (messageId: string) => Promise<EmailWithContent | null>;
  searchEmails: (query: string) => Promise<void>;
  
  // Email actions
  markAsRead: (messageId: string) => Promise<void>;
  markAsUnread: (messageId: string) => Promise<void>;
  markAsReplied: (messageId: string) => Promise<void>;
  analyzeEmail: (messageId: string) => Promise<void>;
  
  // Statistics
  stats: {
    totalEmails: number;
    unreadEmails: number;
    analyzedEmails: number;
    cachedEmails: number;
    storageSavedMB: number;
  };
  
  // Loading states for individual emails
  contentLoading: Set<string>;
  analysisLoading: Set<string>;
}

export function useOptimizedEmails(
  options: UseOptimizedEmailsOptions = {}
): UseOptimizedEmailsReturn {
  const {
    emailAccountId,
    folder = 'INBOX',
    autoLoad = true,
    enableRealTimeSync = false,
    loadContentOnInit = false
  } = options;

  console.log(`🚀 [useOptimizedEmails] Hook initialized with accountId: ${emailAccountId}, folder: ${folder}, autoLoad: ${autoLoad}`);

  // State
  const [emails, setEmails] = useState<EmailWithContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [contentLoading, setContentLoading] = useState<Set<string>>(new Set());
  const [analysisLoading, setAnalysisLoading] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    totalEmails: 0,
    unreadEmails: 0,
    analyzedEmails: 0,
    cachedEmails: 0,
    storageSavedMB: 0
  });

  // Refs
  const offsetRef = useRef(0);
  const searchQueryRef = useRef<string>('');
  const organizationIdRef = useRef<string>('');

  // =====================================================
  // CORE EMAIL LOADING
  // =====================================================

  const loadEmails = useCallback(async (loadOptions: EmailLoadOptions = {}) => {
    if (!emailAccountId) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const options = {
        folder,
        limit: 100, // Increased from 50 to 100 to match database count
        offset: loadOptions.forceRefresh ? 0 : offsetRef.current,
        ...loadOptions
      };

      const newEmails = await optimizedEmailService.loadEmails(emailAccountId, options);
      console.log(`📧 [useOptimizedEmails] Loaded ${newEmails.length} emails for account ${emailAccountId}, folder ${folder}`);
      
      if (loadOptions.forceRefresh || offsetRef.current === 0) {
        console.log(`📧 [useOptimizedEmails] Setting ${newEmails.length} emails in state`);
        setEmails(newEmails);
        offsetRef.current = newEmails.length;
        
        // Preload content if loadContentOnInit is enabled
        if (loadContentOnInit && newEmails.length > 0) {
          console.log(`📧 Preloading content for ${newEmails.length} emails`);
          // Preload content for the first few emails
          const preloadCount = Math.min(newEmails.length, 10); // Limit to 10 emails to avoid overwhelming
          
          // Use setTimeout to allow the UI to render first
          setTimeout(() => {
            for (let i = 0; i < preloadCount; i++) {
              getEmailContent(newEmails[i].message_id);
            }
          }, 100);
        }
      } else {
        // Filter out any duplicate emails before adding new ones
        const existingIds = new Set(emails.map(email => email.message_id));
        const uniqueNewEmails = newEmails.filter(email => !existingIds.has(email.message_id));
        
        if (uniqueNewEmails.length > 0) {
          setEmails(prev => [...prev, ...uniqueNewEmails]);
          offsetRef.current += uniqueNewEmails.length;
        }
      }

      setHasMore(newEmails.length === (options.limit || 100));

    } catch (err) {
      console.error('Failed to load emails:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        error: err
      });
      setError(err instanceof Error ? err.message : 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  }, [emailAccountId, folder, loadContentOnInit]); // Remove getEmailContent from dependencies to prevent infinite loop

  const loadMoreEmails = useCallback(async () => {
    if (loading || !hasMore) return;
    await loadEmails({ offset: offsetRef.current });
  }, [loadEmails, loading, hasMore]);

  const refreshEmails = useCallback(async () => {
    offsetRef.current = 0;
    await loadEmails({ forceRefresh: true });
  }, [loadEmails]);

  // =====================================================
  // CONTENT LOADING
  // =====================================================

  const getEmailContent = useCallback(async (
    messageId: string,
    forceRefresh = false
  ): Promise<EmailWithContent | null> => {
    // Add to loading state
    setContentLoading(prev => new Set([...prev, messageId]));

    try {
      console.log(`📧 Loading content for ${messageId}`);
      
      const emailWithContent = await optimizedEmailService.getEmailWithContent(
        messageId,
        forceRefresh
      );

      if (emailWithContent) {
        // Update the email in the list
        setEmails(prev => prev.map(email => 
          email.message_id === messageId 
            ? { ...email, ...emailWithContent }
            : email
        ));

        console.log(`✅ Content loaded for ${messageId}`);
      } else {
        console.warn(`⚠️ No content found for email ${messageId}`);
      }

      return emailWithContent;

    } catch (err) {
      console.error('Failed to load email content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
      return null;
    } finally {
      // Remove from loading state
      setContentLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  }, []);

  // =====================================================
  // SEARCH & FILTERING
  // =====================================================

  const searchEmails = useCallback(async (query: string) => {
    if (!organizationIdRef.current) return;
    
    setLoading(true);
    setError(null);
    searchQueryRef.current = query;

    try {
      console.log(`🔍 Searching emails: "${query}"`);
      
      const searchResults = await optimizedEmailService.searchEmails(
        organizationIdRef.current,
        query,
        { limit: 100 }
      );

      setEmails(searchResults);
      setHasMore(false); // Search results are limited
      offsetRef.current = searchResults.length;

      console.log(`✅ Found ${searchResults.length} matching emails`);

    } catch (err) {
      console.error('Failed to search emails:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // EMAIL ACTIONS
  // =====================================================

  const markAsRead = useCallback(async (messageId: string) => {
    // Avoid duplicate network calls if already read
    const current = emails.find(e => e.message_id === messageId);
    if (current?.is_read) return;

    // Optimistic update
    setEmails(prev => prev.map(email => 
      email.message_id === messageId 
        ? { ...email, is_read: true }
        : email
    ));

    try {
      const res = await fetch(`/api/email/${encodeURIComponent(messageId)}/read-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });

      if (!res.ok) {
        throw new Error(`Failed to persist read status: ${res.status}`);
      }

      // Notify other views to refresh if they listen
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('emailReadStatusChanged'));
        }
      } catch {}

    } catch (err) {
      console.error('Failed to mark as read:', err);
      // Revert optimistic update on failure
      setEmails(prev => prev.map(email => 
        email.message_id === messageId 
          ? { ...email, is_read: false }
          : email
      ));
    }
  }, [emails]);

  const markAsUnread = useCallback(async (messageId: string) => {
    // Optimistic update
    setEmails(prev => prev.map(email => 
      email.message_id === messageId 
        ? { ...email, is_read: false }
        : email
    ));

    try {
      const res = await fetch(`/api/email/${encodeURIComponent(messageId)}/read-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: false })
      });

      if (!res.ok) {
        throw new Error(`Failed to persist unread status: ${res.status}`);
      }

      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('emailReadStatusChanged'));
        }
      } catch {}

    } catch (err) {
      console.error('Failed to mark as unread:', err);
      // Revert optimistic update on failure
      setEmails(prev => prev.map(email => 
        email.message_id === messageId 
          ? { ...email, is_read: true }
          : email
      ));
    }
  }, []);

  const markAsReplied = useCallback(async (messageId: string) => {
    try {
      const success = await optimizedEmailService.markEmailReplied(messageId);
      
      if (success) {
        setEmails(prev => prev.map(email => 
          email.message_id === messageId 
            ? { 
                ...email, 
                replied: true, 
                highlight_color: null,
                last_reply_at: new Date().toISOString()
              }
            : email
        ));

        console.log(`✅ Marked as replied: ${messageId}`);
      }

    } catch (err) {
      console.error('Failed to mark as replied:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark as replied');
    }
  }, []);

  const analyzeEmail = useCallback(async (messageId: string) => {
    setAnalysisLoading(prev => new Set([...prev, messageId]));

    try {
      console.log(`🤖 Analyzing email: ${messageId}`);
      
      const success = await optimizedEmailService.analyzeEmailForUpsell(messageId);
      
      if (success) {
        // Reload the email to get updated analysis
        const updatedEmail = await optimizedEmailService.getEmailWithContent(messageId);
        
        if (updatedEmail) {
          setEmails(prev => prev.map(email => 
            email.message_id === messageId 
              ? { ...email, ...updatedEmail }
              : email
          ));
        }

        console.log(`✅ Analysis completed for ${messageId}`);
      }

    } catch (err) {
      console.error('Failed to analyze email:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalysisLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });
    }
  }, []);

  // =====================================================
  // STATISTICS & MONITORING
  // =====================================================

  const updateStats = useCallback(async () => {
    if (!organizationIdRef.current) return;

    try {
      const emailStats = await optimizedEmailService.getEmailStats(organizationIdRef.current);
      
      if (emailStats) {
        setStats({
          totalEmails: emailStats.total_emails,
          unreadEmails: emailStats.unread_emails,
          analyzedEmails: emailStats.analyzed_emails,
          cachedEmails: emailStats.cached_emails,
          storageSavedMB: emailStats.storage_saved_mb
        });
      }
    } catch (err) {
      console.error('Failed to update stats:', err);
    }
  }, []);

  // =====================================================
  // EFFECTS
  // =====================================================

  // Auto-load emails when account changes
  useEffect(() => {
    if (autoLoad && emailAccountId) {
      offsetRef.current = 0;
      loadEmails();
    }
  }, [emailAccountId, autoLoad, folder]); // Don't include loadEmails to avoid loops

  // Update stats once
  useEffect(() => {
    updateStats();
  }, []);

  // Real-time sync (optional) - disabled to prevent duplicate emails
  useEffect(() => {
    if (!enableRealTimeSync || !emailAccountId) return;
    
    // Disabled automatic refresh to prevent duplicate emails
    // Users can manually refresh using the refresh button
    
    return () => {};
  }, [enableRealTimeSync, emailAccountId]);

  // =====================================================
  // RETURN HOOK INTERFACE
  // =====================================================

  return {
    emails,
    loading,
    error,
    hasMore,
    
    // Actions
    loadEmails,
    loadMoreEmails,
    refreshEmails,
    getEmailContent,
    searchEmails,
    
    // Email actions
    markAsRead,
    markAsUnread,
    markAsReplied,
    analyzeEmail,
    
    // Statistics
    stats,
    
    // Loading states
    contentLoading,
    analysisLoading
  };
}

// =====================================================
// UTILITY HOOKS
// =====================================================

/**
 * Hook for managing email content loading state
 */
export function useEmailContent(messageId: string) {
  const [content, setContent] = useState<EmailWithContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContent = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const emailContent = await optimizedEmailService.getEmailWithContent(
        messageId,
        forceRefresh
      );
      
      if (emailContent === null && forceRefresh) {
        // If force refresh returned null, it might be due to malformed message ID or server issues
        // Don't treat this as an error, just keep the existing content
        console.warn('Force refresh returned null for message:', messageId);
      } else {
        setContent(emailContent);
      }
    } catch (err) {
      console.error('Error loading email content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [messageId]);

  useEffect(() => {
    if (messageId) {
      loadContent();
    }
  }, [messageId, loadContent]);

  return {
    content,
    loading,
    error,
    reload: () => loadContent(true)
  };
}

/**
 * Hook for background email analysis
 */
export function useEmailAnalysis(organizationId: string) {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const analyzeUnprocessedEmails = useCallback(async () => {
    if (!organizationId || analyzing) return;

    setAnalyzing(true);
    setProgress({ current: 0, total: 0 });

    try {
      // Get unanalyzed emails
      const unanalyzedEmails = await optimizedEmailService.getUnanalyzedEmails(
        organizationId,
        50 // Process in batches of 50
      );

      setProgress({ current: 0, total: unanalyzedEmails.length });

      // Process each email
      for (let i = 0; i < unanalyzedEmails.length; i++) {
        const email = unanalyzedEmails[i];
        
        try {
          await optimizedEmailService.analyzeEmailForUpsell(email.message_id);
          setProgress(prev => ({ ...prev, current: i + 1 }));
          
          // Small delay to prevent overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.error(`Failed to analyze email ${email.message_id}:`, err);
        }
      }

      console.log(`✅ Analyzed ${unanalyzedEmails.length} emails`);

    } catch (err) {
      console.error('Failed to analyze emails:', err);
    } finally {
      setAnalyzing(false);
      setProgress({ current: 0, total: 0 });
    }
  }, [organizationId, analyzing]);

  return {
    analyzing,
    progress,
    analyzeUnprocessedEmails
  };
}
