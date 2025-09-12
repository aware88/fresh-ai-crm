'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { createClient } from '@/lib/supabase/client'

interface EmailAccount {
  id: string
  user_id: string
  organization_id?: string
  email: string
  display_name?: string
  provider_type: 'google' | 'microsoft' | 'outlook' | 'imap'
  is_active: boolean
  is_primary?: boolean
  last_sync_at?: string
  sync_error?: string
  created_at: string
  updated_at: string
}

export function useEmailAccounts() {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<EmailAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchAccounts = async () => {
    if (!session?.user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      setAccounts(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch email accounts'
      setError(errorMessage)
      console.error('Error fetching email accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch accounts on mount and session change
  useEffect(() => {
    fetchAccounts()
  }, [session?.user?.id])

  // Get active accounts only
  const activeAccounts = accounts.filter(account => account.is_active)

  // Get primary account
  const primaryAccount = accounts.find(account => account.is_primary && account.is_active)

  // Get account by ID
  const getAccountById = (accountId: string) => {
    return accounts.find(account => account.id === accountId)
  }

  // Set primary account
  const setPrimaryAccount = async (accountId: string) => {
    if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

    try {
      // First, unset all other primary accounts
      const { error: unsetError } = await supabase
        .from('email_accounts')
        .update({ is_primary: false })
        .eq('user_id', session.user.id)

      if (unsetError) {
        throw new Error(unsetError.message)
      }

      // Then set the new primary account
      const { error: setError } = await supabase
        .from('email_accounts')
        .update({ is_primary: true })
        .eq('id', accountId)
        .eq('user_id', session.user.id)

      if (setError) {
        throw new Error(setError.message)
      }

      // Refresh accounts
      await fetchAccounts()
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set primary account'
      return { success: false, error: errorMessage }
    }
  }

  // Delete account
  const deleteAccount = async (accountId: string) => {
    if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

    try {
      const { error: deleteError } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', session.user.id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      // Refresh accounts
      await fetchAccounts()
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete account'
      return { success: false, error: errorMessage }
    }
  }

  // Toggle account active status
  const toggleAccountStatus = async (accountId: string) => {
    if (!session?.user?.id) return { success: false, error: 'Not authenticated' }

    const account = getAccountById(accountId)
    if (!account) return { success: false, error: 'Account not found' }

    try {
      const { error: updateError } = await supabase
        .from('email_accounts')
        .update({ is_active: !account.is_active })
        .eq('id', accountId)
        .eq('user_id', session.user.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Refresh accounts
      await fetchAccounts()
      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update account status'
      return { success: false, error: errorMessage }
    }
  }

  return {
    accounts,
    activeAccounts,
    primaryAccount,
    loading,
    error,
    refetch: fetchAccounts,
    getAccountById,
    setPrimaryAccount,
    deleteAccount,
    toggleAccountStatus
  }
}

export default useEmailAccounts