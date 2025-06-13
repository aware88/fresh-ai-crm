import React from 'react';
import { NextPage } from 'next';
import Link from 'next/link';

interface ErrorProps {
  statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  const title = statusCode === 404 
    ? 'Page Not Found' 
    : 'Server Error';
  
  const message = statusCode === 404
    ? 'The page you are looking for doesn\'t exist or has been moved.'
    : 'Sorry, something went wrong on our server. We\'re working to fix it.';

  return (
    <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{statusCode || 'Error'}</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{title}</h2>
      <p style={{ marginBottom: '2rem' }}>
        {message}
      </p>
      <Link href="/">
        <span style={{ padding: '0.5rem 1rem', background: '#3B82F6', color: 'white', borderRadius: '0.25rem', textDecoration: 'none', cursor: 'pointer', display: 'inline-block' }}>
          Return Home
        </span>
      </Link>
    </div>
  );
};

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
