import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const UnauthorizedPage: React.FC = () => {
  const router = useRouter();
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-red-600 text-4xl font-bold mb-4">Access Denied</h1>
          <div className="text-red-500 text-6xl mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V9m0 0V7m0 2h2m-2 0H9" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5a2 2 0 00-2 2v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-2-2z" />
            </svg>
          </div>
          
          <p className="text-gray-700 mb-6">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => router.back()}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
            >
              Go Back
            </button>
            
            <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
