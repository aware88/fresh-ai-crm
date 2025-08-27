'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Circle } from 'lucide-react';

interface TeamPresenceSimpleProps {
  className?: string;
  compact?: boolean;
}

// Simple mock data for demonstration
const mockTeamMembers = [
  { id: '1', name: 'John Doe', status: 'online', avatar: '', role: 'Sales' },
  { id: '2', name: 'Jane Smith', status: 'away', avatar: '', role: 'Support' },
  { id: '3', name: 'Mike Johnson', status: 'busy', avatar: '', role: 'Manager' },
];

export default function TeamPresenceSimple({ className, compact = false }: TeamPresenceSimpleProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'away':
        return 'text-yellow-500';
      case 'busy':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    return <Circle className={`h-3 w-3 fill-current ${getStatusColor(status)}`} />;
  };

  const onlineMembers = mockTeamMembers.filter(member => member.status === 'online');

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex -space-x-2">
          {onlineMembers.slice(0, 3).map((member) => (
            <div key={member.id} className="relative">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="text-xs">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1">
                {getStatusIcon(member.status)}
              </div>
            </div>
          ))}
          {onlineMembers.length > 3 && (
            <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
              <span className="text-xs font-medium">+{onlineMembers.length - 3}</span>
            </div>
          )}
        </div>
        <span className="text-sm text-gray-600">{onlineMembers.length} online</span>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-sm">Team Presence</h3>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {/* Team members list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {mockTeamMembers.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    {getStatusIcon(member.status)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.name}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs capitalize ${getStatusColor(member.status)}`}
                    >
                      {member.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Team stats */}
          <div className="pt-2 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-green-600">{onlineMembers.length}</p>
                <p className="text-xs text-gray-500">Online now</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-600">{mockTeamMembers.length}</p>
                <p className="text-xs text-gray-500">Total team</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}




