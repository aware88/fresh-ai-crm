'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, User, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface EmailAccount {
  id: string
  email: string
  display_name?: string
  provider_type: 'google' | 'microsoft' | 'outlook' | 'imap'
  is_primary?: boolean
  is_active?: boolean
}

interface AccountSelectorProps {
  accounts: EmailAccount[]
  selectedAccountId?: string
  onAccountSelect: (accountId: string) => void
  placeholder?: string
  label?: string
  showAllAccountsOption?: boolean
}

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case 'google':
      return '🌐'
    case 'microsoft':
    case 'outlook':
      return '📧'
    case 'imap':
      return '⚙️'
    default:
      return '📬'
  }
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  selectedAccountId,
  onAccountSelect,
  placeholder = 'Select an email account',
  label = 'Email Account',
  showAllAccountsOption = false
}) => {
  const activeAccounts = accounts.filter(account => account.is_active !== false)

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {label}
        </label>
      )}
      <Select value={selectedAccountId || ''} onValueChange={onAccountSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {showAllAccountsOption && (
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>All Accounts</span>
              </div>
            </SelectItem>
          )}
          {activeAccounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getProviderIcon(account.provider_type)}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{account.email}</span>
                    {account.display_name && (
                      <span className="text-xs text-muted-foreground">
                        {account.display_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {account.is_primary && (
                    <Badge variant="secondary" className="text-xs">
                      Primary
                    </Badge>
                  )}
                  <Badge 
                    variant="outline" 
                    className="text-xs capitalize"
                  >
                    {account.provider_type}
                  </Badge>
                </div>
              </div>
            </SelectItem>
          ))}
          {activeAccounts.length === 0 && (
            <SelectItem value="none" disabled>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>No email accounts configured</span>
              </div>
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

export default AccountSelector