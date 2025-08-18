'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTeamCollaboration } from './TeamCollaborationProvider';
import { 
  Users,
  Circle,
  Clock,
  MessageCircle,
  Phone,
  Video,
  Mail,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface TeamPresenceProps {
  className?: string;
  compact?: boolean;
}

export default function TeamPresence({ className, compact = false }: TeamPresenceProps) {
  const { teamMembers, currentUser, updateMemberStatus } = useTeamCollaboration();
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showOffline, setShowOffline] = useState(false);

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

  const formatLastSeen = (lastSeen: string) => {
    const now = new Date();
    const date = new Date(lastSeen);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const onlineMembers = teamMembers.filter(member => member.status === 'online');
  const awayMembers = teamMembers.filter(member => member.status === 'away');
  const busyMembers = teamMembers.filter(member => member.status === 'busy');
  const offlineMembers = teamMembers.filter(member => member.status === 'offline');

  const visibleMembers = showOffline 
    ? teamMembers 
    : teamMembers.filter(member => member.status !== 'offline');

  const handleStatusChange = (newStatus: 'online' | 'away' | 'busy' | 'offline') => {
    updateMemberStatus(newStatus);
  };

  if (compact && !isExpanded) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex -space-x-2">
          {onlineMembers.slice(0, 3).map((member) => (
            <TooltipProvider key={member.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
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
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-center">
                    <p className="font-medium">{member.name}</p>
                    <p className="text-xs capitalize">{member.status}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {onlineMembers.length > 3 && (
            <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
              <span className="text-xs font-medium">+{onlineMembers.length - 3}</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="h-8 px-2"
        >
          <Users className="h-4 w-4" />
          <span className="ml-1 text-xs">{onlineMembers.length} online</span>
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>Team ({teamMembers.length})</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              {/* Status summary */}
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1">
                  {getStatusIcon('online')}
                  <span>{onlineMembers.length}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon('away')}
                  <span>{awayMembers.length}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon('busy')}
                  <span>{busyMembers.length}</span>
                </div>
                {offlineMembers.length > 0 && (
                  <div className="flex items-center space-x-1">
                    {getStatusIcon('offline')}
                    <span>{offlineMembers.length}</span>
                  </div>
                )}
              </div>
              
              {compact && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-6 w-6 p-0"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Current user status selector */}
          {currentUser && (
            <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <Avatar className="h-6 w-6">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback className="text-xs">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium flex-1">{currentUser.name}</span>
              <div className="flex space-x-1">
                {(['online', 'away', 'busy'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={currentUser.status === status ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                    className="h-6 px-2 text-xs capitalize"
                  >
                    {getStatusIcon(status)}
                    <span className="ml-1">{status}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {/* Show/hide offline toggle */}
            {offlineMembers.length > 0 && (
              <div className="flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOffline(!showOffline)}
                  className="h-6 px-2 text-xs"
                >
                  {showOffline ? 'Hide' : 'Show'} offline ({offlineMembers.length})
                  {showOffline ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
              </div>
            )}

            {/* Team members list */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {visibleMembers.map((member) => (
                <div 
                  key={member.id} 
                  className={`flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 ${
                    member.id === currentUser?.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
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
                        {member.id === currentUser?.id && (
                          <span className="text-xs text-gray-500 ml-1">(You)</span>
                        )}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs capitalize ${getStatusColor(member.status)}`}
                      >
                        {member.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                      {member.status !== 'online' && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatLastSeen(member.lastSeen)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Quick actions */}
                  {member.id !== currentUser?.id && member.status === 'online' && (
                    <div className="flex space-x-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send message</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Mail className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send email</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
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
                  <p className="text-lg font-semibold text-blue-600">{teamMembers.length}</p>
                  <p className="text-xs text-gray-500">Total members</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}