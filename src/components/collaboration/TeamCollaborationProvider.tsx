'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'agent' | 'viewer';
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
}

interface CollaborationActivity {
  id: string;
  type: 'note_added' | 'note_edited' | 'note_deleted' | 'mention' | 'assignment' | 'status_change';
  userId: string;
  userName: string;
  customerEmail: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

interface TeamCollaborationContextType {
  teamMembers: TeamMember[];
  activities: CollaborationActivity[];
  currentUser: TeamMember | null;
  isLoading: boolean;
  addActivity: (activity: Omit<CollaborationActivity, 'id' | 'createdAt'>) => void;
  updateMemberStatus: (status: TeamMember['status']) => void;
  getMembersByRole: (role: TeamMember['role']) => TeamMember[];
  getOnlineMembers: () => TeamMember[];
}

const TeamCollaborationContext = createContext<TeamCollaborationContextType | undefined>(undefined);

export function useTeamCollaboration() {
  const context = useContext(TeamCollaborationContext);
  if (!context) {
    throw new Error('useTeamCollaboration must be used within TeamCollaborationProvider');
  }
  return context;
}

interface TeamCollaborationProviderProps {
  children: ReactNode;
}

export function TeamCollaborationProvider({ children }: TeamCollaborationProviderProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<CollaborationActivity[]>([]);
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Mock data for demo - replace with real API calls
  useEffect(() => {
    const mockTeamMembers: TeamMember[] = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
        role: 'manager',
        status: 'online',
        lastSeen: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Mike Chen',
        email: 'mike@company.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
        role: 'agent',
        status: 'online',
        lastSeen: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Emma Davis',
        email: 'emma@company.com',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
        role: 'agent',
        status: 'away',
        lastSeen: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: '4',
        name: 'Alex Rodriguez',
        email: 'alex@company.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        role: 'admin',
        status: 'busy',
        lastSeen: new Date().toISOString()
      }
    ];

    const mockActivities: CollaborationActivity[] = [
      {
        id: '1',
        type: 'note_added',
        userId: '2',
        userName: 'Mike Chen',
        customerEmail: 'john.doe@example.com',
        content: 'Added support note about shipping issue resolution',
        createdAt: new Date(Date.now() - 600000).toISOString()
      },
      {
        id: '2',
        type: 'mention',
        userId: '1',
        userName: 'Sarah Johnson',
        customerEmail: 'sarah.smith@company.com',
        content: 'Mentioned @Emma Davis for follow-up on sales opportunity',
        metadata: { mentionedUserId: '3' },
        createdAt: new Date(Date.now() - 1200000).toISOString()
      }
    ];

    setTeamMembers(mockTeamMembers);
    setActivities(mockActivities);
    setCurrentUser(mockTeamMembers[0]); // Mock current user
    setIsLoading(false);
  }, []);

  const addActivity = (activity: Omit<CollaborationActivity, 'id' | 'createdAt'>) => {
    const newActivity: CollaborationActivity = {
      ...activity,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const updateMemberStatus = (status: TeamMember['status']) => {
    if (!currentUser) return;
    
    setTeamMembers(prev => 
      prev.map(member => 
        member.id === currentUser.id 
          ? { ...member, status, lastSeen: new Date().toISOString() }
          : member
      )
    );
    setCurrentUser(prev => prev ? { ...prev, status } : null);
  };

  const getMembersByRole = (role: TeamMember['role']) => {
    return teamMembers.filter(member => member.role === role);
  };

  const getOnlineMembers = () => {
    return teamMembers.filter(member => member.status === 'online');
  };

  const value: TeamCollaborationContextType = {
    teamMembers,
    activities,
    currentUser,
    isLoading,
    addActivity,
    updateMemberStatus,
    getMembersByRole,
    getOnlineMembers
  };

  return (
    <TeamCollaborationContext.Provider value={value}>
      {children}
    </TeamCollaborationContext.Provider>
  );
}