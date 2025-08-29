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
    enableRealTimeSync = false
  } = options;

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
    if (!emailAccountId) return;
    
    setLoading(true);
    setError(null);

    try {
      const options = {
        folder,
        limit: 50,
        offset: loadOptions.forceRefresh ? 0 : offsetRef.current,
        ...loadOptions
      };

      console.log('📧 Loading emails with options:', options);

      const newEmails = await optimizedEmailService.loadEmails(emailAccountId, options);
      
      if (loadOptions.forceRefresh || offsetRef.current === 0) {
        setEmails(newEmails);
        offsetRef.current = newEmails.length;
      } else {
        setEmails(prev => [...prev, ...newEmails]);
        offsetRef.current += newEmails.length;
      }

      setHasMore(newEmails.length === (options.limit || 50));
      
      console.log(`✅ Loaded ${newEmails.length} emails (total: ${offsetRef.current})`);

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
  }, [emailAccountId, folder]);

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
    try {
      // Optimistically update UI
      setEmails(prev => prev.map(email => 
        email.message_id === messageId 
          ? { ...email, is_read: true }
          : email
      ));

      // TODO: Implement mark as read API call
      console.log(`📧 Marked as read: ${messageId}`);

    } catch (err) {
      console.error('Failed to mark as read:', err);
      // Revert optimistic update
      setEmails(prev => prev.map(email => 
        email.message_id === messageId 
          ? { ...email, is_read: false }
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
  }, [emailAccountId, autoLoad, loadEmails]);

  // Update stats periodically
  useEffect(() => {
    updateStats();
    
    const interval = setInterval(updateStats, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  // Real-time sync (optional)
  useEffect(() => {
    if (!enableRealTimeSync || !emailAccountId) return;

    const interval = setInterval(() => {
      // Check for new emails without refreshing the entire list
      loadEmails({ limit: 10, offset: 0 });
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [enableRealTimeSync, emailAccountId, loadEmails]);

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
      
      setContent(emailContent);
    } catch (err) {
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
