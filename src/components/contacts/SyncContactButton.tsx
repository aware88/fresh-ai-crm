/**
 * SyncContactButton Component
 * 
 * A reusable button component for syncing contacts with Metakocka
 * Supports both CRM → Metakocka and Metakocka → CRM sync directions
 */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';
import { Loader2, RefreshCw, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { syncContact, syncContactFromMetakocka } from '@/lib/integrations/metakocka/contact-sync-api';
import { toast } from '@/components/ui/use-toast';

interface SyncContactButtonProps {
  contactId?: string;
  metakockaId?: string;
  direction?: 'to-metakocka' | 'from-metakocka';
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  onSyncComplete?: (result: any) => void;
}

export function SyncContactButton({
  contactId,
  metakockaId,
  direction = 'to-metakocka',
  variant = 'outline',
  size = 'sm',
  className = '',
  onSyncComplete
}: SyncContactButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine which icon to use based on sync direction
  const SyncIcon = direction === 'to-metakocka' ? ArrowUpFromLine : ArrowDownToLine;
  
  // Determine tooltip text based on sync direction
  const tooltipText = direction === 'to-metakocka' 
    ? 'Sync contact to Metakocka' 
    : 'Sync contact from Metakocka';
  
  // Handle sync button click
  const handleSync = async () => {
    if (isLoading) return;
    
    // Validate required IDs based on sync direction
    if (direction === 'to-metakocka' && !contactId) {
      toast({
        title: 'Sync Error',
        description: 'Contact ID is required for syncing to Metakocka',
        variant: 'destructive',
      });
      return;
    }
    
    if (direction === 'from-metakocka' && !metakockaId) {
      toast({
        title: 'Sync Error',
        description: 'Metakocka ID is required for syncing from Metakocka',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let result;
      
      if (direction === 'to-metakocka') {
        result = await syncContact(contactId!);
        toast({
          title: 'Contact Synced',
          description: 'Contact was successfully synced to Metakocka',
          variant: 'default',
        });
      } else {
        result = await syncContactFromMetakocka(metakockaId!);
        toast({
          title: 'Contact Synced',
          description: 'Contact was successfully synced from Metakocka',
          variant: 'default',
        });
      }
      
      // Call the onSyncComplete callback if provided
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    } catch (error) {
      console.error('Error syncing contact:', error);
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Tooltip content={tooltipText}>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleSync}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <SyncIcon className="h-4 w-4" />
        )}
      </Button>
    </Tooltip>
  );
}
