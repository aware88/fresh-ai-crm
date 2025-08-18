'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import CollaborativeNotes from './CollaborativeNotes';
import TeamActivityFeed from './TeamActivityFeed';
import TeamPresence from './TeamPresence';
import { useTeamCollaboration } from './TeamCollaborationProvider';
import { 
  Users,
  Activity,
  StickyNote,
  MessageSquare,
  Bell,
  Settings,
  Search,
  Filter,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  CheckCircle2
} from 'lucide-react';

interface CollaborationDashboardProps {
  customerEmail?: string;
  className?: string;
}

export default function CollaborationDashboard({ 
  customerEmail, 
  className 
}: CollaborationDashboardProps) {
  const { teamMembers, activities, getOnlineMembers } = useTeamCollaboration();
  const [activeTab, setActiveTab] = useState('overview');

  const onlineMembers = getOnlineMembers();
  const todayActivities = activities.filter(activity => {
    const today = new Date();
    const activityDate = new Date(activity.createdAt);
    return activityDate.toDateString() === today.toDateString();
  });

  const customerActivities = customerEmail 
    ? activities.filter(activity => activity.customerEmail === customerEmail)
    : activities;

  const noteActivities = activities.filter(activity => 
    ['note_added', 'note_edited', 'note_deleted'].includes(activity.type)
  );

  const mentionActivities = activities.filter(activity => activity.type === 'mention');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Collaboration</h2>
          <p className="text-gray-600">
            {customerEmail 
              ? `Collaboration for ${customerEmail}` 
              : 'Real-time team collaboration and activity tracking'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{onlineMembers.length}</p>
                <p className="text-sm text-gray-600">Online now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{todayActivities.length}</p>
                <p className="text-sm text-gray-600">Today's activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <StickyNote className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{noteActivities.length}</p>
                <p className="text-sm text-gray-600">Notes created</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{mentionActivities.length}</p>
                <p className="text-sm text-gray-600">Team mentions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center space-x-2">
            <StickyNote className="h-4 w-4" />
            <span>Notes</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Activity</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Team</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity Summary */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Recent Activity</span>
                    <Badge variant="secondary">{customerActivities.slice(0, 5).length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TeamActivityFeed 
                    customerEmail={customerEmail}
                    maxHeight="300px"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Team Status */}
            <div>
              <TeamPresence />
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>Response Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">2.3h</p>
                  <p className="text-sm text-gray-600">Avg. first response</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-green-600">
                      ↓ 15% from last week
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span>Resolution Rate</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">94%</p>
                  <p className="text-sm text-gray-600">Issues resolved</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-green-600">
                      ↑ 3% from last week
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                  <span>Team Efficiency</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">87%</p>
                  <p className="text-sm text-gray-600">Collaboration score</p>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-green-600">
                      ↑ 8% from last week
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CollaborativeNotes 
                customerEmail={customerEmail || 'john.doe@example.com'}
              />
            </div>
            <div className="space-y-4">
              <TeamPresence compact />
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Notes Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Notes</span>
                    <Badge variant="secondary">{noteActivities.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Week</span>
                    <Badge variant="secondary">12</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mentions</span>
                    <Badge variant="secondary">{mentionActivities.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Resolved</span>
                    <Badge variant="secondary">8</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <TeamActivityFeed 
                customerEmail={customerEmail}
                maxHeight="600px"
              />
            </div>
            <div>
              <TeamPresence />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamPresence />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Team Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {Math.floor(Math.random() * 20) + 5} notes
                        </p>
                        <p className="text-xs text-gray-500">this week</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}