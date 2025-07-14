'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main settings page
    router.replace('/settings');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to settings...</p>
      </div>
    </div>
  );
}
