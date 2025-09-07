'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmailAccount {
  id: string;
  email: string;
  provider_type: string;
  is_active?: boolean;
}

interface EmailAccountSwitcherProps {
  selectedAccountId?: string;
  onAccountChange: (accountId: string) => void;
  showAddButton?: boolean;
}

export default function EmailAccountSwitcher({
  selectedAccountId,
  onAccountChange,
  showAddButton = false,
}: EmailAccountSwitcherProps) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch email accounts
  useEffect(() => {
    async function fetchAccounts() {
      try {
        setLoading(true);
        const response = await fetch('/api/email/accounts');
        const data = await response.json();

        if (data.success && data.accounts) {
          setAccounts(data.accounts);
          
          // Auto-select first account if none selected
          if (!selectedAccountId && data.accounts.length > 0) {
            onAccountChange(data.accounts[0].id);
          }
        } else {
          console.error('Failed to fetch email accounts:', data.error);
        }
      } catch (error) {
        console.error('Error fetching email accounts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAccounts();
  }, [selectedAccountId, onAccountChange]);

  // Handle account selection
  const handleAccountChange = (value: string) => {
    onAccountChange(value);
  };

  // Get provider icon based on provider type
  const getProviderIcon = (providerType: string) => {
    switch (providerType.toLowerCase()) {
      case 'google':
      case 'gmail':
        return '🔴'; // Red circle for Gmail
      case 'microsoft':
      case 'outlook':
        return '🔵'; // Blue circle for Outlook
      case 'imap':
        return '🟠'; // Orange circle for IMAP
      default:
        return '📧'; // Default email icon
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedAccountId}
        onValueChange={handleAccountChange}
        disabled={loading || accounts.length === 0}
      >
        <SelectTrigger className="w-[250px] h-9 text-sm">
          <SelectValue placeholder={loading ? 'Loading accounts...' : 'Select email account'} />
        </SelectTrigger>
        <SelectContent>
          {accounts.length === 0 ? (
            <SelectItem value="none" disabled>
              No email accounts connected
            </SelectItem>
          ) : (
            accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex items-center gap-2">
                  <span>{getProviderIcon(account.provider_type)}</span>
                  <span className="truncate">{account.email}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {showAddButton && (
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-2"
          onClick={() => router.push('/settings/email-accounts')}
          title="Add email account"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}