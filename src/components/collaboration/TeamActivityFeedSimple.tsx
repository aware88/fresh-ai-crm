'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, User, Mail, UserCheck } from 'lucide-react';
import { useTeamCollaboration } from './TeamCollaborationProvider';

interface TeamActivityFeedSimpleProps {
  className?: string;
  maxHeight?: string;
  customerEmail?: string;
}

export default function TeamActivityFeedSimple({ 
  className, 
  maxHeight = "400px",
  customerEmail 
}: TeamActivityFeedSimpleProps) {
  const { activities, isLoading } = useTeamCollaboration();
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'note_added':
      case 'note':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'status_change':
      case 'status':
        return <Clock className="h-4 w-4 text-green-500" />;
      case 'assignment':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'email_activity':
        return <Mail className="h-4 w-4 text-orange-500" />;
      case 'contact_update':
        return <UserCheck className="h-4 w-4 text-indigo-500" />;
      case 'mention':
        return <MessageSquare className="h-4 w-4 text-pink-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'note_added':
      case 'note':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'status_change':
      case 'status':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'assignment':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'email_activity':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'contact_update':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'mention':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatTimestamp = (createdAt: string) => {
    const now = new Date();
    const activityTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter activities by customer email if provided
  const filteredActivities = customerEmail 
    ? activities.filter(activity => activity.customerEmail === customerEmail)
    : activities;

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Activity list */}
        <div 
          className="space-y-3 overflow-y-auto"
          style={{ maxHeight }}
        >
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs">
                    {activity.userName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {getActivityIcon(activity.type)}
                        <p className="text-sm font-medium text-gray-900">
                          {activity.userName}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs capitalize ${getActivityBadgeColor(activity.type)}`}
                        >
                          {activity.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {activity.content}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTimestamp(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs text-gray-400">Team activity will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




