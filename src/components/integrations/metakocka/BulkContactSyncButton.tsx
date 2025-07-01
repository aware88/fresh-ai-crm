'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { syncContactsToMetakocka, syncContactsFromMetakocka } from '@/lib/integrations/metakocka/contact-sync-api';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface BulkContactSyncButtonProps {
  direction: 'to-metakocka' | 'from-metakocka';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSyncComplete?: (result: any) => void;
  contactIds?: string[];
  metakockaIds?: string[];
  children?: React.ReactNode;
}

export function BulkContactSyncButton({
  direction,
  variant = 'default',
  size = 'default',
  className = '',
  onSyncComplete,
  contactIds,
  metakockaIds,
  children
}: BulkContactSyncButtonProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (direction === 'to-metakocka') {
        result = await syncContactsToMetakocka(contactIds);
        toast({
          title: 'Contacts synchronized to Metakocka',
          description: `${result.created} created, ${result.updated} updated, ${result.failed} failed`,
          variant: result.failed > 0 ? 'destructive' : 'default',
        });
      } else {
        result = await syncContactsFromMetakocka(metakockaIds);
        toast({
          title: 'Contacts imported from Metakocka',
          description: `${result.created} created, ${result.updated} updated, ${result.failed} failed`,
          variant: result.failed > 0 ? 'destructive' : 'default',
        });
      }
      
      if (onSyncComplete) onSyncComplete(result);
    } catch (err) {
      console.error('Error syncing contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync contacts');
      toast({
        title: 'Sync error',
        description: err instanceof Error ? err.message : 'Failed to sync contacts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Determine tooltip text based on direction
  const tooltipText = direction === 'to-metakocka' 
    ? 'Sync contacts to Metakocka' 
    : 'Import contacts from Metakocka';

  // Determine button content
  const getButtonContent = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
    }
    
    if (error) {
      return <AlertCircle className="h-4 w-4 mr-2 text-destructive" />;
    }
    
    return <RefreshCw className="h-4 w-4 mr-2" />;
  };

  return (
    <Tooltip content={error || tooltipText}>
      <Button
        variant={error ? 'destructive' : variant}
        size={size}
        className={className}
        onClick={handleSync}
        disabled={isLoading}
      >
        {getButtonContent()}
        {children || (direction === 'to-metakocka' ? 'Sync to Metakocka' : 'Import from Metakocka')}
      </Button>
    </Tooltip>
  );
}
