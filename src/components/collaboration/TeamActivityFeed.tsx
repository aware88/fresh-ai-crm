'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTeamCollaboration } from './TeamCollaborationProvider';
import { 
  Activity,
  StickyNote,
  AtSign,
  UserPlus,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Edit3,
  Trash2,
  Clock,
  Filter,
  Users,
  Eye
} from 'lucide-react';

interface TeamActivityFeedProps {
  customerEmail?: string;
  className?: string;
  maxHeight?: string;
}

export default function TeamActivityFeed({ 
  customerEmail, 
  className,
  maxHeight = "400px" 
}: TeamActivityFeedProps) {
  const { activities, teamMembers } = useTeamCollaboration();
  const [filter, setFilter] = useState<'all' | 'notes' | 'mentions' | 'assignments'>('all');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'note_added':
        return <StickyNote className="h-4 w-4 text-blue-600" />;
      case 'note_edited':
        return <Edit3 className="h-4 w-4 text-yellow-600" />;
      case 'note_deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'mention':
        return <AtSign className="h-4 w-4 text-purple-600" />;
      case 'assignment':
        return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'status_change':
        return <CheckCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'note_added':
        return 'bg-blue-50 border-blue-200';
      case 'note_edited':
        return 'bg-yellow-50 border-yellow-200';
      case 'note_deleted':
        return 'bg-red-50 border-red-200';
      case 'mention':
        return 'bg-purple-50 border-purple-200';
      case 'assignment':
        return 'bg-green-50 border-green-200';
      case 'status_change':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const filterActivities = () => {
    let filtered = activities;

    // Filter by customer if specified
    if (customerEmail) {
      filtered = filtered.filter(activity => activity.customerEmail === customerEmail);
    }

    // Filter by type
    if (filter !== 'all') {
      switch (filter) {
        case 'notes':
          filtered = filtered.filter(activity => 
            ['note_added', 'note_edited', 'note_deleted'].includes(activity.type)
          );
          break;
        case 'mentions':
          filtered = filtered.filter(activity => activity.type === 'mention');
          break;
        case 'assignments':
          filtered = filtered.filter(activity => activity.type === 'assignment');
          break;
      }
    }

    // Filter by time
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (timeFilter) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(activity => 
        new Date(activity.createdAt) >= cutoff
      );
    }

    return filtered;
  };

  const filteredActivities = filterActivities();

  const getUserAvatar = (userId: string) => {
    const user = teamMembers.find(member => member.id === userId);
    return user?.avatar;
  };

  const getUserInitials = (userName: string) => {
    return userName.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span>Team Activity</span>
            {customerEmail && (
              <Badge variant="outline" className="text-xs">
                {customerEmail}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {filteredActivities.length}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
            >
              <Filter className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="flex space-x-1">
            {(['all', 'notes', 'mentions', 'assignments'] as const).map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="h-6 px-2 text-xs capitalize"
              >
                {filterType}
              </Button>
            ))}
          </div>
          
          <div className="flex space-x-1">
            {(['all', 'today', 'week', 'month'] as const).map((timeFilterType) => (
              <Button
                key={timeFilterType}
                variant={timeFilter === timeFilterType ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter(timeFilterType)}
                className="h-6 px-2 text-xs capitalize"
              >
                {timeFilterType}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea style={{ height: maxHeight }}>
          <div className="space-y-3">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No activity found</p>
                <p className="text-xs">Team activities will appear here</p>
              </div>
            ) : (
              filteredActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className={`p-3 rounded-lg border ${getActivityColor(activity.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Activity Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    {/* Activity Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={getUserAvatar(activity.userId)} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(activity.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-900">
                          {activity.userName}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(activity.createdAt)}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        {activity.content}
                      </p>
                      
                      {!customerEmail && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <span>Customer:</span>
                          <code className="bg-gray-100 px-1 rounded text-xs">
                            {activity.customerEmail}
                          </code>
                        </div>
                      )}
                      
                      {/* Activity Metadata */}
                      {activity.metadata && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <Badge 
                              key={key} 
                              variant="outline" 
                              className="text-xs"
                            >
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}