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

  // Fetch real data from API
  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        // Fetch team members
        const membersResponse = await fetch('/api/team/members');
        if (membersResponse.ok) {
          const { members } = await membersResponse.json();
          const formattedMembers: TeamMember[] = members.map((member: any) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            avatar: member.avatar,
            role: member.role as TeamMember['role'],
            status: member.status as TeamMember['status'],
            lastSeen: member.lastSeen
          }));
          setTeamMembers(formattedMembers);
          
          // Set current user (first member for now - in real app, match by session user ID)
          if (formattedMembers.length > 0) {
            setCurrentUser(formattedMembers[0]);
          }
        }

        // Fetch team activities
        const activitiesResponse = await fetch('/api/team/activities?limit=20');
        if (activitiesResponse.ok) {
          const { activities } = await activitiesResponse.json();
          setActivities(activities);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching team data:', error);
        // Fall back to empty state
        setTeamMembers([]);
        setActivities([]);
        setCurrentUser(null);
        setIsLoading(false);
      }
    };

    fetchTeamData();
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