'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, ChevronDown, Settings } from 'lucide-react';
import Link from 'next/link';

interface EmailAccount {
  id: string;
  email: string;
  display_name?: string;
  provider_type: string;
  is_active: boolean;
  is_primary?: boolean;
  last_sync_at?: string;
}

interface EmailAccountSwitcherProps {
  onAccountChange?: (accountId: string) => void;
  selectedAccountId?: string;
  showAddButton?: boolean;
}

export default function EmailAccountSwitcher({ 
  onAccountChange, 
  selectedAccountId,
  showAddButton = true 
}: EmailAccountSwitcherProps) {
  const { data: session } = useSession();
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(selectedAccountId);

  useEffect(() => {
    fetchEmailAccounts();
  }, [session]);

  useEffect(() => {
    // Auto-select primary account or first account if none selected
    if (emailAccounts.length > 0 && !selectedAccount) {
      const primaryAccount = emailAccounts.find(account => account.is_primary);
      const accountToSelect = primaryAccount || emailAccounts[0];
      setSelectedAccount(accountToSelect.id);
      onAccountChange?.(accountToSelect.id);
    }
  }, [emailAccounts, selectedAccount, onAccountChange]);

  const fetchEmailAccounts = async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/email/accounts');
      if (response.ok) {
        const data = await response.json();
        setEmailAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error fetching email accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
    onAccountChange?.(accountId);
  };

  const getProviderIcon = (providerType: string) => {
    switch (providerType) {
      case 'google':
        return '📧'; // Gmail
      case 'microsoft':
      case 'outlook':
        return '📮'; // Outlook
      case 'imap':
        return '📬'; // IMAP
      default:
        return '📭';
    }
  };

  const getProviderName = (providerType: string) => {
    switch (providerType) {
      case 'google':
        return 'Gmail';
      case 'microsoft':
      case 'outlook':
        return 'Outlook';
      case 'imap':
        return 'IMAP';
      default:
        return 'Email';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
        <Mail className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Loading accounts...</span>
      </div>
    );
  }

  if (emailAccounts.length === 0) {
    return (
      <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-200 px-3 py-2 rounded-lg">
        <Mail className="h-4 w-4 text-yellow-600" />
        <span className="text-sm text-yellow-700">No email accounts connected</span>
        {showAddButton && (
          <Link
            href="/settings/email-accounts"
            className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded"
          >
            Add Account
          </Link>
        )}
      </div>
    );
  }

  if (emailAccounts.length === 1) {
    const account = emailAccounts[0];
    return (
      <div className="flex items-center space-x-2 bg-gray-50 px-2 py-1 rounded text-sm">
        <span className="text-sm">{getProviderIcon(account.provider_type)}</span>
        <div className="flex items-center space-x-1">
          <span className="font-medium text-gray-900 truncate max-w-[100px] text-xs">
            {account.display_name || account.email.split('@')[0]}
          </span>
          <span className="text-gray-500 text-xs">
            {getProviderName(account.provider_type)}
          </span>
          {account.is_primary && (
            <span className="bg-blue-500 text-white text-xs px-1 rounded">
              Primary
            </span>
          )}
        </div>
        {showAddButton && (
          <Link
            href="/settings/email-accounts"
            className="text-gray-400 hover:text-gray-600"
            title="Manage email accounts"
          >
            <Settings className="h-3 w-3" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Select value={selectedAccount} onValueChange={handleAccountChange}>
        <SelectTrigger className="min-w-[160px] max-w-[200px] bg-white">
          <div className="flex items-center space-x-2">
            {selectedAccount && (
              <>
                <span className="text-lg">
                  {getProviderIcon(
                    emailAccounts.find(acc => acc.id === selectedAccount)?.provider_type || ''
                  )}
                </span>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium truncate max-w-[120px]">
                    {emailAccounts.find(acc => acc.id === selectedAccount)?.display_name ||
                     emailAccounts.find(acc => acc.id === selectedAccount)?.email}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">
                      {getProviderName(
                        emailAccounts.find(acc => acc.id === selectedAccount)?.provider_type || ''
                      )}
                    </span>
                    {emailAccounts.find(acc => acc.id === selectedAccount)?.is_primary && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        Primary
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 ml-2" />
        </SelectTrigger>
        <SelectContent>
          {emailAccounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center space-x-2 w-full">
                <span className="text-lg">{getProviderIcon(account.provider_type)}</span>
                <div className="flex flex-col items-start flex-1">
                  <span className="text-xs font-medium truncate max-w-[140px]">
                    {account.display_name || account.email}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">
                      {getProviderName(account.provider_type)}
                    </span>
                    {account.is_primary && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        Primary
                      </Badge>
                    )}
                    {account.last_sync_at && (
                      <span className="text-xs text-green-600">
                        • Synced
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showAddButton && (
        <Link
          href="/settings/email-accounts"
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          title="Manage email accounts"
        >
          <Settings className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}