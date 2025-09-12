'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import TeamActivityFeed from '../collaboration/TeamActivityFeed';
import TeamPresence from '../collaboration/TeamPresence';
import { TeamCollaborationProvider } from '../collaboration/TeamCollaborationProvider';
import TeamCollaborationSheet from './TeamCollaborationSheet';
import { 
  Users,
  Activity,
  MessageSquare,
  Bell,
  ChevronUp,
  ChevronDown,
  Maximize2,
  User
} from 'lucide-react';

interface TeamCollaborationFloatingBarProps {
  customerEmail?: string;
  emailId?: string;
}

export default function TeamCollaborationFloatingBar({ 
  customerEmail,
  emailId
}: TeamCollaborationFloatingBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullSheet, setShowFullSheet] = useState(false);
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [unreadCount] = useState(3); // Mock unread count

  return (
    <TeamCollaborationProvider>
      {/* Full Sheet for detailed view */}
      <TeamCollaborationSheet
        isOpen={showFullSheet}
        onOpenChange={setShowFullSheet}
        customerEmail={customerEmail}
        emailId={emailId}
      />

      {/* Floating Bar */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-6 right-6 z-40"
      >
        <AnimatePresence mode="wait">
          {isExpanded ? (
            /* Expanded Toolbar */
            <motion.div
              key="expanded"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 flex items-center space-x-1"
            >
              {/* Team Presence Popover */}
              <Popover
                open={activePopover === 'team'}
                onOpenChange={(open) => setActivePopover(open ? 'team' : null)}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-3 hover:bg-purple-50"
                  >
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="ml-2 text-xs">Team</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end" side="top">
                  <div className="p-4">
                    <h3 className="font-medium text-sm mb-3">Team Members</h3>
                    <TeamPresence compact />
                  </div>
                </PopoverContent>
              </Popover>

              {/* Activity Popover */}
              <Popover
                open={activePopover === 'activity'}
                onOpenChange={(open) => setActivePopover(open ? 'activity' : null)}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-3 hover:bg-blue-50 relative"
                  >
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="ml-2 text-xs">Activity</span>
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-0" align="end" side="top">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-sm">Recent Activity</h3>
                      <Badge variant="secondary" className="text-xs">
                        {unreadCount} new
                      </Badge>
                    </div>
                    <TeamActivityFeed 
                      customerEmail={customerEmail}
                      maxHeight="300px"
                    />
                  </div>
                </PopoverContent>
              </Popover>

              {/* Quick Actions */}
              <div className="border-l border-gray-200 pl-1 flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 hover:bg-green-50"
                  title="Add Note"
                >
                  <MessageSquare className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 hover:bg-yellow-50"
                  title="Notify Team"
                >
                  <Bell className="h-4 w-4 text-yellow-600" />
                </Button>
              </div>

              {/* Expand to Full View */}
              <div className="border-l border-gray-200 pl-1 flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 hover:bg-gray-50"
                  onClick={() => setShowFullSheet(true)}
                  title="Open Full View"
                >
                  <Maximize2 className="h-4 w-4 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-2 hover:bg-gray-50"
                  onClick={() => setIsExpanded(false)}
                  title="Collapse"
                >
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Collapsed FAB */
            <motion.div
              key="collapsed"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse z-10" />
              )}
              
              {/* Mini Toolbar */}
              <div className="bg-white rounded-full shadow-2xl border border-gray-200 p-1 flex items-center">
                <Button
                  onClick={() => setIsExpanded(true)}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-full p-0 hover:bg-purple-50"
                  title="Expand Team Collaboration"
                >
                  <Users className="h-5 w-5 text-purple-600" />
                </Button>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <Button
                  onClick={() => setShowFullSheet(true)}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-full p-0 hover:bg-blue-50"
                  title="Open Collaboration Panel"
                >
                  <Activity className="h-5 w-5 text-blue-600" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </TeamCollaborationProvider>
  );
}