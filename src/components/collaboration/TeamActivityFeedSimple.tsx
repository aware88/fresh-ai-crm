'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, User } from 'lucide-react';

interface TeamActivityFeedSimpleProps {
  className?: string;
  maxHeight?: string;
  customerEmail?: string;
}

// Simple mock data for demonstration
const mockActivities = [
  {
    id: '1',
    type: 'note',
    user: { name: 'John Doe', avatar: '' },
    message: 'Added a note about customer inquiry',
    timestamp: '2 minutes ago',
  },
  {
    id: '2',
    type: 'status',
    user: { name: 'Jane Smith', avatar: '' },
    message: 'Changed customer status to "In Progress"',
    timestamp: '5 minutes ago',
  },
  {
    id: '3',
    type: 'assignment',
    user: { name: 'Mike Johnson', avatar: '' },
    message: 'Assigned task to support team',
    timestamp: '10 minutes ago',
  },
];

export default function TeamActivityFeedSimple({ 
  className, 
  maxHeight = "400px",
  customerEmail 
}: TeamActivityFeedSimpleProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'status':
        return <Clock className="h-4 w-4 text-green-500" />;
      case 'assignment':
        return <User className="h-4 w-4 text-purple-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'note':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'status':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'assignment':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Activity list */}
        <div 
          className="space-y-3 overflow-y-auto"
          style={{ maxHeight }}
        >
          {mockActivities.map((activity) => (
            <div 
              key={activity.id}
              className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={activity.user.avatar} />
                <AvatarFallback className="text-xs">
                  {activity.user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {getActivityIcon(activity.type)}
                      <p className="text-sm font-medium text-gray-900">
                        {activity.user.name}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs capitalize ${getActivityBadgeColor(activity.type)}`}
                      >
                        {activity.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-400">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {mockActivities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs text-gray-400">Team activity will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}




