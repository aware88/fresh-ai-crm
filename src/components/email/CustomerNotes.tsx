'use client';

import React from 'react';
import CollaborativeNotes from '../collaboration/CollaborativeNotes';
import { TeamCollaborationProvider } from '../collaboration/TeamCollaborationProvider';

interface CustomerNotesProps {
  customerEmail: string;
  className?: string;
}

export default function CustomerNotes({ customerEmail, className }: CustomerNotesProps) {
  return (
    <TeamCollaborationProvider>
      <CollaborativeNotes 
        customerEmail={customerEmail}
        className={className}
      />
    </TeamCollaborationProvider>
  );
}