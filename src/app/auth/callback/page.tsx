'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createSupabaseClient();
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      // Try to get auth parameters from URL
      const { searchParams } = new URL(window.location.href);
      const code = searchParams.get('code');

      if (code) {
        try {
          await supabase.auth.exchangeCodeForSession(code);
          router.push('/dashboard');
        } catch (error) {
          console.error('Error exchanging code for session:', error);
          router.push('/signin?error=Unable to authenticate');
        }
      } else {
        // No code in URL, redirect to sign in
        router.push('/signin');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Authenticating...</h2>
        <p className="text-muted-foreground">Please wait while we complete your sign in.</p>
      </div>
    </div>
  );
}
