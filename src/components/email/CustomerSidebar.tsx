'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import CustomerInfoWidget from './CustomerInfoWidget';
import CustomerNotes from './CustomerNotes';
import TeamActivityFeed from '../collaboration/TeamActivityFeed';
import TeamPresence from '../collaboration/TeamPresence';
import { TeamCollaborationProvider } from '../collaboration/TeamCollaborationProvider';
import { 
  X,
  Pin,
  PinOff,
  ChevronLeft,
  ChevronRight,
  Activity,
  Users
} from 'lucide-react';

interface CustomerSidebarProps {
  customerEmail: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export default function CustomerSidebar({ 
  customerEmail, 
  isOpen, 
  onClose, 
  className 
}: CustomerSidebarProps) {
  const [isPinned, setIsPinned] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'activity' | 'team'>('info');

  if (!isOpen) return null;

  return (
    <TeamCollaborationProvider>
      <div className={`
        fixed right-0 top-0 h-full bg-white shadow-2xl border-l border-gray-200 z-50
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-12' : 'w-96'}
        ${className}
      `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        {!isCollapsed && (
          <>
            <h3 className="font-semibold text-gray-900">Customer Info</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPinned(!isPinned)}
                className="h-8 w-8 p-0"
                title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              >
                {isPinned ? (
                  <PinOff className="h-4 w-4" />
                ) : (
                  <Pin className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(true)}
                className="h-8 w-8 p-0"
                title="Collapse sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!isPinned && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                  title="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}
        
        {isCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="h-8 w-8 p-0 mx-auto"
            title="Expand sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b bg-gray-50 px-4 py-2">
            <div className="flex space-x-1">
              <Button
                variant={activeTab === 'info' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('info')}
                className="flex-1 text-xs"
              >
                Info
              </Button>
              <Button
                variant={activeTab === 'activity' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('activity')}
                className="flex-1 text-xs"
              >
                <Activity className="h-3 w-3 mr-1" />
                Activity
              </Button>
              <Button
                variant={activeTab === 'team' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('team')}
                className="flex-1 text-xs"
              >
                <Users className="h-3 w-3 mr-1" />
                Team
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'info' && (
              <>
                {/* Customer Info Widget */}
                <CustomerInfoWidget 
                  customerEmail={customerEmail}
                  className="w-full"
                />
                
                <Separator />
                
                {/* Customer Notes */}
                <CustomerNotes 
                  customerEmail={customerEmail}
                  className="w-full"
                />
              </>
            )}

            {activeTab === 'activity' && (
              <TeamActivityFeed 
                customerEmail={customerEmail}
                maxHeight="500px"
              />
            )}

            {activeTab === 'team' && (
              <TeamPresence />
            )}
          </div>
          
          {/* Footer Actions */}
          <div className="border-t bg-gray-50 p-4">
            <div className="text-xs text-gray-500 text-center">
              Customer data from Metakocka • Team collaboration enabled
            </div>
          </div>
        </div>
      )}
      </div>
    </TeamCollaborationProvider>
  );
}