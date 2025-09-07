'use client';

import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

export function SidebarToggle() {
  const { state, toggleSidebar } = useSidebar();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={toggleSidebar}
      aria-label="Toggle Sidebar"
    >
      {state === 'expanded' ? (
        <Menu className="h-4 w-4" />
      ) : (
        <Menu className="h-4 w-4" />
      )}
    </Button>
  );
}