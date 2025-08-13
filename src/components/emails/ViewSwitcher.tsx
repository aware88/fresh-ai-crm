import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Inbox, Eye, MessageSquare, Database } from 'lucide-react';

export type EmailView = 'inbox' | 'analysis' | 'response' | 'metakocka';

interface ViewSwitcherProps {
  activeView: EmailView;
  onViewChange: (view: EmailView) => void;
}

export function ViewSwitcher({ activeView, onViewChange }: ViewSwitcherProps) {
  const [metakockaEnabled, setMetakockaEnabled] = useState<boolean>(false);

  // Check if Metakocka is enabled for this user's organization
  useEffect(() => {
    const checkMetakockaEnabled = async () => {
      try {
        // Skip feature flag check for now to avoid 400 errors
        // const response = await fetch('/api/feature-flags/METAKOCKA_INTEGRATION');
        // For now, default to disabled
        setMetakockaEnabled(false);
        return;
        if (response.ok) {
          const data = await response.json();
          setMetakockaEnabled(data.enabled);
        }
      } catch (err) {
        console.error('Error checking Metakocka feature flag:', err);
        setMetakockaEnabled(false);
      }
    };

    checkMetakockaEnabled();
  }, []);

  // If user tries to access Metakocka tab but it's not enabled, redirect to inbox
  useEffect(() => {
    if (activeView === 'metakocka' && !metakockaEnabled) {
      onViewChange('inbox');
    }
  }, [activeView, metakockaEnabled, onViewChange]);

  const tabCount = metakockaEnabled ? 4 : 3;
  const gridCols = metakockaEnabled ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <Tabs
      value={activeView}
      onValueChange={(value) => onViewChange(value as EmailView)}
      className="w-full mb-4"
    >
      <TabsList className={`grid w-full ${gridCols}`}>
        <TabsTrigger value="inbox">
          <Inbox className="h-4 w-4 mr-2" />
          Inbox
        </TabsTrigger>
        <TabsTrigger value="analysis">
          <Eye className="h-4 w-4 mr-2" />
          Analysis
        </TabsTrigger>
        <TabsTrigger value="response">
          <MessageSquare className="h-4 w-4 mr-2" />
          Response
        </TabsTrigger>
        {metakockaEnabled && (
        <TabsTrigger value="metakocka">
          <Database className="h-4 w-4 mr-2" />
          Metakocka
        </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  );
}
