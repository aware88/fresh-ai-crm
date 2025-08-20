'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Folder, 
  Mail,
  Sparkles,
  Settings,
  TrendingUp
} from 'lucide-react';
import { EmailFollowup } from '@/lib/email/follow-up-service';
import FollowUpDashboard from './FollowUpDashboard';
import SmartFolders from './SmartFolders';
import AIDraftGenerator from './AIDraftGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import FollowUpSettings from './FollowUpSettings';

interface EnhancedFollowUpDashboardProps {
  className?: string;
}

export default function EnhancedFollowUpDashboard({ className }: EnhancedFollowUpDashboardProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFollowup, setSelectedFollowup] = useState<EmailFollowup | null>(null);
  const [showAIDrafts, setShowAIDrafts] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'folders' | 'ai' | 'settings'>('list');

  const handleFollowupSelect = (followup: EmailFollowup) => {
    setSelectedFollowup(followup);
    setShowAIDrafts(true);
    setActiveView('ai');
  };

  const handleDraftGenerated = (result: any) => {
    console.log('Draft generated:', result);
    // You could show a success message or update the UI
  };

  const handleDraftSent = (draft: any) => {
    console.log('Draft sent:', draft);
    setShowAIDrafts(false);
    setSelectedFollowup(null);
    setActiveView('list');
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Phase 2 Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                Enhanced Follow-up System
                <Badge variant="secondary" className="text-xs">Phase 2</Badge>
              </h3>
              <p className="text-sm text-gray-600">
                AI-powered drafts, smart folders, and intelligent organization
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Interface */}
      <div className="flex-1 min-h-0 mt-6">
        <div className="grid grid-cols-12 gap-6 h-full">
        {/* Left Sidebar - Smart Folders */}
        <div className="col-span-3 overflow-y-auto">
          <SmartFolders
            selectedFolderId={selectedFolderId}
            onFolderSelect={setSelectedFolderId}
          />
        </div>

        {/* Main Content Area */}
        <div className="col-span-9 flex flex-col min-h-0">
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <TabsList className="grid w-auto grid-cols-4">
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Follow-ups
                </TabsTrigger>
                <TabsTrigger value="folders" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Smart Folders
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Drafts
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </div>

            <TabsContent value="list" className="mt-0 flex-1 min-h-0 overflow-hidden">
              <div className="h-full overflow-hidden">
                <FollowUpDashboard 
                  selectedFolderId={selectedFolderId}
                  onFollowupSelect={handleFollowupSelect}
                />
              </div>
            </TabsContent>

            <TabsContent value="folders" className="mt-0 flex-1 min-h-0 overflow-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SmartFolders
                  selectedFolderId={selectedFolderId}
                  onFolderSelect={setSelectedFolderId}
                />
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-500" />
                      Smart Folder Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center py-8 text-gray-500">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Analytics coming soon</p>
                        <p className="text-xs">Track folder performance and optimization</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="mt-0 flex-1 min-h-0 overflow-auto">
              <AnimatePresence>
                {selectedFollowup ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <AIDraftGenerator
                      followup={selectedFollowup}
                      onDraftGenerated={handleDraftGenerated}
                      onDraftSent={handleDraftSent}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Card className="max-w-md mx-auto">
                      <CardContent className="p-8">
                        <Brain className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          AI Draft Generator
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Select a follow-up from the list to generate AI-powered email drafts
                        </p>
                        <Button onClick={() => setActiveView('list')}>
                          <Mail className="h-4 w-4 mr-2" />
                          View Follow-ups
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="settings" className="mt-0 flex-1 min-h-0 overflow-auto">
              <FollowUpSettings />
            </TabsContent>
          </Tabs>
        </div>
        </div>
      </div>
    </div>
  );
}
