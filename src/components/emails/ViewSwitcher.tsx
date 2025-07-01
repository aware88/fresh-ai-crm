import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Inbox, Eye, MessageSquare, Database } from 'lucide-react';

export type EmailView = 'inbox' | 'analysis' | 'response' | 'metakocka';

interface ViewSwitcherProps {
  activeView: EmailView;
  onViewChange: (view: EmailView) => void;
}

export function ViewSwitcher({ activeView, onViewChange }: ViewSwitcherProps) {
  return (
    <Tabs
      value={activeView}
      onValueChange={(value) => onViewChange(value as EmailView)}
      className="w-full mb-4"
    >
      <TabsList className="grid w-full grid-cols-4">
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
        <TabsTrigger value="metakocka">
          <Database className="h-4 w-4 mr-2" />
          Metakocka
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
