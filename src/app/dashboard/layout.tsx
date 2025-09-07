'use client';

import { AppLayout } from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/toaster";
import { TeamCollaborationProvider } from "@/components/collaboration/TeamCollaborationProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TeamCollaborationProvider>
      <AppLayout>
        {children}
      </AppLayout>
      <Toaster />
    </TeamCollaborationProvider>
  );
}