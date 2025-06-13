import React from 'react';
import Link from 'next/link';

export default function Custom500() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Server Error</h2>
        <p className="text-gray-600 mb-8">
          Sorry, something went wrong on our server. We're working to fix it.
        </p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  );
}
