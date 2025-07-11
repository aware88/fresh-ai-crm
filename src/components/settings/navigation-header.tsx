'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface NavigationHeaderProps {
  title: string;
  backUrl?: string;
}

export function NavigationHeader({ title, backUrl = '/settings' }: NavigationHeaderProps) {
  const router = useRouter();
  
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          title="Go back"
        >
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        
        <Link href="/dashboard">
          <Button
            variant="outline"
            size="icon"
            title="Go to home"
          >
            <HomeIcon className="h-4 w-4" />
          </Button>
        </Link>
        
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
    </div>
  );
}
