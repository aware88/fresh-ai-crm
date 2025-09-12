'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import CustomerInfoWidget from './CustomerInfoWidget';
import CustomerNotes from './CustomerNotes';
import TeamActivityFeed from '../collaboration/TeamActivityFeed';
import TeamPresence from '../collaboration/TeamPresence';
import { TeamCollaborationProvider } from '../collaboration/TeamCollaborationProvider';
import { 
  Users,
  Activity,
  User,
  MessageSquare,
  Bell,
  Settings,
  ChevronLeft,
  Info,
  Sparkles
} from 'lucide-react';

interface TeamCollaborationSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customerEmail?: string;
  emailId?: string;
}

export default function TeamCollaborationSheet({ 
  isOpen, 
  onOpenChange,
  customerEmail,
  emailId
}: TeamCollaborationSheetProps) {
  const [activeTab, setActiveTab] = useState<string>('customer');
  const [unreadActivities, setUnreadActivities] = useState(3); // Mock unread count

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[480px] p-0 flex flex-col" side="right">
        <TeamCollaborationProvider>
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <SheetTitle className="text-base">Collaboration Hub</SheetTitle>
                  <SheetDescription className="text-xs">
                    Customer info & team activity
                  </SheetDescription>
                </div>
              </div>
              {unreadActivities > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {unreadActivities} new
                </Badge>
              )}
            </div>
          </SheetHeader>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 px-6 py-1 bg-gray-50 border-b">
              <TabsTrigger value="customer" className="text-xs data-[state=active]:bg-white">
                <User className="h-3 w-3 mr-1" />
                Customer
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs data-[state=active]:bg-white relative">
                <Activity className="h-3 w-3 mr-1" />
                Activity
                {unreadActivities > 0 && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger value="team" className="text-xs data-[state=active]:bg-white">
                <Users className="h-3 w-3 mr-1" />
                Team
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              {/* Customer Tab */}
              <TabsContent value="customer" className="p-4 space-y-4 m-0">
                {customerEmail ? (
                  <>
                    <CustomerInfoWidget 
                      customerEmail={customerEmail}
                      className="w-full"
                    />
                    <Separator />
                    <CustomerNotes 
                      customerEmail={customerEmail}
                      className="w-full"
                    />
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No customer email available</p>
                    <p className="text-xs mt-2">Customer information will appear here when available</p>
                  </div>
                )}
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="p-4 m-0">
                <div className="space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <MessageSquare className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-blue-900">12 Notes</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <Bell className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-purple-900">5 Mentions</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <Activity className="h-4 w-4 text-green-600 mx-auto mb-1" />
                      <p className="text-xs font-medium text-green-900">8 Updates</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Activity Feed */}
                  <TeamActivityFeed 
                    customerEmail={customerEmail}
                    maxHeight="400px"
                  />
                </div>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="p-4 m-0">
                <div className="space-y-4">
                  {/* Team Stats */}
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-900">Team Status</h3>
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Live
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-600">Online Now</p>
                        <p className="text-lg font-semibold text-green-600">4 members</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Active Today</p>
                        <p className="text-lg font-semibold text-blue-600">7 members</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Team Presence */}
                  <TeamPresence />
                  
                  {/* Quick Actions */}
                  <div className="pt-4 space-y-2">
                    <Button variant="outline" className="w-full justify-start text-xs">
                      <MessageSquare className="h-3 w-3 mr-2" />
                      Start team discussion
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-xs">
                      <Bell className="h-3 w-3 mr-2" />
                      Notify team about this email
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          {/* Footer */}
          <div className="border-t bg-gray-50 px-6 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Real-time collaboration enabled
              </p>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Settings className="h-3 w-3 mr-1" />
                <span className="text-xs">Settings</span>
              </Button>
            </div>
          </div>
        </TeamCollaborationProvider>
      </SheetContent>
    </Sheet>
  );
}