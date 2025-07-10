import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function SettingsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the dashboard settings page
    router.replace('/dashboard/settings');
  }, [router]);

  return (
    <>
      <Head>
        <title>Redirecting to Settings | ARIS</title>
      </Head>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]"></div>
          <p className="mt-4 text-gray-600">Redirecting to settings page...</p>
        </div>
      </div>
    </>
  );
}
