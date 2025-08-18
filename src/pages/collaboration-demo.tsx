import React from 'react';
import { TeamCollaborationProvider } from '../components/collaboration/TeamCollaborationProvider';
import CollaborationDashboard from '../components/collaboration/CollaborationDashboard';

export default function CollaborationDemo() {
  return (
    <TeamCollaborationProvider>
      <div className="min-h-screen bg-gray-50 p-6">
        <CollaborationDashboard />
      </div>
    </TeamCollaborationProvider>
  );
}