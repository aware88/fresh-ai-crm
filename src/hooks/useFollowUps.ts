'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { EmailFollowup, FollowupStats } from '@/lib/email/follow-up-service';

interface UseFollowUpsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  status?: string[];
  priority?: string[];
  limit?: number;
}

interface UseFollowUpsReturn {
  followups: EmailFollowup[];
  stats: FollowupStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createFollowup: (data: any) => Promise<EmailFollowup | null>;
  updateFollowup: (id: string, action: string, data?: any) => Promise<boolean>;
  deleteFollowup: (id: string) => Promise<boolean>;
}

export function useFollowUps(options: UseFollowUpsOptions = {}): UseFollowUpsReturn {
  const { data: session } = useSession();
  const [followups, setFollowups] = useState<EmailFollowup[]>([]);
  const [stats, setStats] = useState<FollowupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    status,
    priority,
    limit
  } = options;

  const loadFollowups = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setError(null);
      const params = new URLSearchParams();
      
      if (status?.length) {
        params.append('status', status.join(','));
      }
      if (priority?.length) {
        params.append('priority', priority.join(','));
      }
      if (limit) {
        params.append('limit', limit.toString());
      }

      const response = await fetch(`/api/email/followups?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch follow-ups');
      }

      const data = await response.json();
      setFollowups(data.followups);
    } catch (err) {
      console.error('Error loading follow-ups:', err);
      setError(err instanceof Error ? err.message : 'Failed to load follow-ups');
    }
  }, [session, status, priority, limit]);

  const loadStats = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/email/followups/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [session]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadFollowups(), loadStats()]);
    setLoading(false);
  }, [loadFollowups, loadStats]);

  const createFollowup = useCallback(async (data: any): Promise<EmailFollowup | null> => {
    try {
      const response = await fetch('/api/email/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create follow-up');
      }

      const result = await response.json();
      await refresh(); // Refresh the list
      return result.followup;
    } catch (err) {
      console.error('Error creating follow-up:', err);
      setError(err instanceof Error ? err.message : 'Failed to create follow-up');
      return null;
    }
  }, [refresh]);

  const updateFollowup = useCallback(async (
    id: string, 
    action: string, 
    additionalData?: any
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/email/followups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...additionalData })
      });

      if (!response.ok) {
        throw new Error('Failed to update follow-up');
      }

      await refresh(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Error updating follow-up:', err);
      setError(err instanceof Error ? err.message : 'Failed to update follow-up');
      return false;
    }
  }, [refresh]);

  const deleteFollowup = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/email/followups/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete follow-up');
      }

      await refresh(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Error deleting follow-up:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete follow-up');
      return false;
    }
  }, [refresh]);

  // Initial load
  useEffect(() => {
    if (session?.user?.id) {
      refresh();
    }
  }, [session, refresh]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !session?.user?.id) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, session, refresh]);

  return {
    followups,
    stats,
    loading,
    error,
    refresh,
    createFollowup,
    updateFollowup,
    deleteFollowup
  };
}

// Hook for getting due follow-ups specifically
export function useDueFollowUps() {
  return useFollowUps({
    status: ['due', 'overdue'],
    autoRefresh: true,
    refreshInterval: 60000 // 1 minute for due items
  });
}

// Hook for getting follow-up stats
export function useFollowUpStats() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<FollowupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setError(null);
      const response = await fetch('/api/email/followups/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [session]);

  const refresh = useCallback(() => {
    setLoading(true);
    return loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (session?.user?.id) {
      loadStats();
    }
  }, [session, loadStats]);

  // Auto-refresh stats every 5 minutes
  useEffect(() => {
    if (!session?.user?.id) return;

    const interval = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [session, loadStats]);

  return {
    stats,
    loading,
    error,
    refresh
  };
}
