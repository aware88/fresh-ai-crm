/**
 * SyncAllContactsButton Component
 * 
 * A button component for bulk syncing contacts with Metakocka
 * Supports both CRM → Metakocka and Metakocka → CRM sync directions
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Loader2, RefreshCw, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { 
  syncAllContacts, 
  syncContactsToMetakocka,
  syncContactsFromMetakocka
} from '@/lib/integrations/metakocka/contact-sync-api';
import { toast } from '@/components/ui/use-toast';

interface SyncAllContactsButtonProps {
  contactIds?: string[];
  metakockaIds?: string[];
  direction?: 'to-metakocka' | 'from-metakocka';
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'success';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onSyncComplete?: (result: any) => void;
  children?: React.ReactNode;
}

export function SyncAllContactsButton({
  contactIds,
  metakockaIds,
  direction = 'to-metakocka',
  variant = 'default',
  size = 'default',
  className = '',
  onSyncComplete,
  children
}: SyncAllContactsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine which icon to use based on sync direction
  const SyncIcon = direction === 'to-metakocka' ? ArrowUpFromLine : ArrowDownToLine;
  
  // Handle sync button click
  const handleSync = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      let result;
      
      if (direction === 'to-metakocka') {
        // Sync contacts to Metakocka
        result = contactIds && contactIds.length > 0
          ? await syncContactsToMetakocka(contactIds)
          : await syncAllContacts();
        
        toast({
          title: 'Contacts Synced',
          description: `Successfully synced ${result.created + result.updated} contacts to Metakocka`,
          variant: 'default',
        });
      } else {
        // Sync contacts from Metakocka
        result = await syncContactsFromMetakocka(metakockaIds);
        
        toast({
          title: 'Contacts Synced',
          description: `Successfully synced ${result.created + result.updated} contacts from Metakocka`,
          variant: 'default',
        });
      }
      
      // Call the onSyncComplete callback if provided
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const buttonText = direction === 'to-metakocka'
    ? 'Sync to Metakocka'
    : 'Sync from Metakocka';
  
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSync}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <SyncIcon className="mr-2 h-4 w-4" />
      )}
      {children || buttonText}
    </Button>
  );
}
