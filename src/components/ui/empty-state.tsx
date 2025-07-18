import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) {
  return (
    <Card className={`text-center ${className}`}>
      <CardHeader className="pb-4">
        {Icon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      {action && (
        <CardContent className="pt-0">
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// Preset empty states for common scenarios
export const EmptyStates = {
  NoOrders: ({ onCreateOrder }: { onCreateOrder?: () => void }) => (
    <EmptyState
      title="No orders yet"
      description="Start by creating your first order or importing existing ones from your system."
      action={onCreateOrder ? {
        label: "Create Order",
        onClick: onCreateOrder
      } : undefined}
    />
  ),
  
  NoContacts: ({ onAddContact }: { onAddContact?: () => void }) => (
    <EmptyState
      title="No contacts found"
      description="Add contacts to start building your customer relationships and track interactions."
      action={onAddContact ? {
        label: "Add Contact",
        onClick: onAddContact
      } : undefined}
    />
  ),
  
  NoEmails: ({ onConnectEmail }: { onConnectEmail?: () => void }) => (
    <EmptyState
      title="No emails to display"
      description="Connect your email account to start managing and analyzing your communications."
      action={onConnectEmail ? {
        label: "Connect Email",
        onClick: onConnectEmail
      } : undefined}
    />
  ),
  
  NoData: () => (
    <EmptyState
      title="No data available"
      description="There's nothing to show here yet. Data will appear once you start using the system."
    />
  ),
  
  SearchNoResults: ({ searchTerm }: { searchTerm: string }) => (
    <EmptyState
      title="No results found"
      description={`We couldn't find anything matching "${searchTerm}". Try adjusting your search terms.`}
    />
  ),
  
  LoadingError: ({ onRetry }: { onRetry?: () => void }) => (
    <EmptyState
      title="Unable to load data"
      description="There was an error loading the data. Please try again."
      action={onRetry ? {
        label: "Retry",
        onClick: onRetry
      } : undefined}
    />
  )
}; 