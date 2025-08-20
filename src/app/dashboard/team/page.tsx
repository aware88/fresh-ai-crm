'use client';

import React from 'react';
import { TeamCollaborationProvider } from '@/components/collaboration/TeamCollaborationProvider';
import CollaborationDashboard from '@/components/collaboration/CollaborationDashboard';
import TeamCollaborationGate from '@/components/subscription/TeamCollaborationGate';

export default function TeamCollaborationPage() {
  return (
    <TeamCollaborationGate feature="full">
      <TeamCollaborationProvider>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team Collaboration</h1>
            <p className="text-muted-foreground">
              Collaborate with your team in real-time, manage assignments, and track activity
            </p>
          </div>
          
          <CollaborationDashboard />
        </div>
      </TeamCollaborationProvider>
    </TeamCollaborationGate>
  );
}
