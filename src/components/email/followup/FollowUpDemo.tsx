'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Send,
  Mail,
  TrendingUp,
  Calendar,
  Plus,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format, addDays } from 'date-fns';

// Mock data for demonstration
const mockFollowups = [
  {
    id: '1',
    original_subject: 'Product Demo Request - TechCorp',
    original_recipients: ['john@techcorp.com'],
    status: 'overdue' as const,
    priority: 'high' as const,
    follow_up_due_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    context_summary: 'Client requested product demo, no response received',
    follow_up_reason: 'No response received'
  },
  {
    id: '2',
    original_subject: 'Quote Follow-up - Manufacturing Solutions',
    original_recipients: ['sarah@manufacturing.com'],
    status: 'due' as const,
    priority: 'medium' as const,
    follow_up_due_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    context_summary: 'Sent pricing quote, awaiting client decision',
    follow_up_reason: 'No response received'
  },
  {
    id: '3',
    original_subject: 'Contract Terms Discussion',
    original_recipients: ['mike@startup.io'],
    status: 'pending' as const,
    priority: 'medium' as const,
    follow_up_due_at: addDays(new Date(), 1).toISOString(), // Tomorrow
    context_summary: 'Discussed contract terms, waiting for internal approval',
    follow_up_reason: 'Pending internal review'
  },
  {
    id: '4',
    original_subject: 'Meeting Confirmation - Q4 Review',
    original_recipients: ['team@company.com'],
    status: 'completed' as const,
    priority: 'low' as const,
    follow_up_due_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    context_summary: 'Meeting confirmation sent',
    follow_up_reason: 'Response received',
    response_received_at: new Date().toISOString()
  }
];

const mockStats = {
  total_followups: 4,
  pending_followups: 1,
  due_followups: 1,
  overdue_followups: 1,
  completed_followups: 1,
  response_rate: 75.0
};

export default function FollowUpDemo() {
  const [activeTab, setActiveTab] = useState('due');
  const [followups, setFollowups] = useState(mockFollowups);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'destructive';
      case 'due':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'completed':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleFollowupAction = (followupId: string, action: string) => {
    setFollowups(prev => prev.map(f => 
      f.id === followupId 
        ? { ...f, status: action === 'complete' ? 'completed' as const : f.status }
        : f
    ));
  };

  const filteredFollowups = followups.filter(f => {
    switch (activeTab) {
      case 'due':
        return f.status === 'due' || f.status === 'overdue';
      case 'pending':
        return f.status === 'pending';
      case 'overdue':
        return f.status === 'overdue';
      case 'completed':
        return f.status === 'completed';
      case 'all':
        return true;
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Demo Banner */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Email Follow-up System Demo</h3>
              <p className="text-sm text-gray-600">
                This is a preview of the intelligent follow-up system. Track email responses and never miss a follow-up again!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Follow-ups</p>
                <p className="text-2xl font-bold">{mockStats.total_followups}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due Today</p>
                <p className="text-2xl font-bold text-orange-600">{mockStats.due_followups}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{mockStats.overdue_followups}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-green-600">{mockStats.response_rate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-ups List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Follow-ups
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
              <TabsTrigger value="due" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600">
                Due ({mockStats.due_followups})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600">
                Overdue ({mockStats.overdue_followups})
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-600">
                Pending ({mockStats.pending_followups})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600">
                Completed
              </TabsTrigger>
              <TabsTrigger value="all" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600">
                All
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <div className="divide-y">
                <AnimatePresence>
                  {filteredFollowups.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No follow-ups found</p>
                      <p className="text-sm">
                        {activeTab === 'due' && 'No follow-ups are due right now.'}
                        {activeTab === 'overdue' && 'Great! No overdue follow-ups.'}
                        {activeTab === 'pending' && 'No pending follow-ups.'}
                        {activeTab === 'completed' && 'No completed follow-ups yet.'}
                        {activeTab === 'all' && 'Start tracking your email follow-ups.'}
                      </p>
                    </div>
                  ) : (
                    filteredFollowups.map((followup) => (
                      <motion.div
                        key={followup.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900 truncate">
                                {followup.original_subject}
                              </h3>
                              <Badge variant={getStatusColor(followup.status)}>
                                {followup.status}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getPriorityColor(followup.priority)}`}
                              >
                                {followup.priority}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>To: {followup.original_recipients.join(', ')}</span>
                              <span>•</span>
                              <span>
                                Due: {format(new Date(followup.follow_up_due_at), 'MMM dd, yyyy')}
                              </span>
                              <span>•</span>
                              <span>
                                {formatDistanceToNow(new Date(followup.follow_up_due_at), { addSuffix: true })}
                              </span>
                            </div>

                            <p className="text-sm text-gray-600">
                              {followup.context_summary}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            {followup.status !== 'completed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleFollowupAction(followup.id, 'complete')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Complete
                                </Button>
                                
                                <Button
                                  size="sm"
                                  onClick={() => handleFollowupAction(followup.id, 'sent')}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Mark Sent
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Feature Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Automatic Tracking</h4>
                <p className="text-sm text-gray-600">
                  Automatically track sent emails and create follow-up reminders
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Smart Detection</h4>
                <p className="text-sm text-gray-600">
                  AI-powered response detection to automatically complete follow-ups
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Flexible Scheduling</h4>
                <p className="text-sm text-gray-600">
                  Customizable follow-up intervals and priority levels
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Smart Reminders</h4>
                <p className="text-sm text-gray-600">
                  Visual indicators and notifications for overdue follow-ups
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
