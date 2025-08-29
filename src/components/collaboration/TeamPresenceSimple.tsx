'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Circle } from 'lucide-react';
import { useTeamCollaboration } from './TeamCollaborationProvider';

interface TeamPresenceSimpleProps {
  className?: string;
  compact?: boolean;
}

export default function TeamPresenceSimple({ className, compact = false }: TeamPresenceSimpleProps) {
  const { teamMembers, isLoading } = useTeamCollaboration();
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

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const onlineMembers = teamMembers.filter(member => member.status === 'online');

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
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
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
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No team members found</p>
              </div>
            )}
          </div>

          {/* Team stats */}
          {teamMembers.length > 0 && (
            <div className="pt-2 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-green-600">{onlineMembers.length}</p>
                  <p className="text-xs text-gray-500">Online now</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-600">{teamMembers.length}</p>
                  <p className="text-xs text-gray-500">Total team</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}




