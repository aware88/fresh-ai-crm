import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

// Extremely simplified settings page with no external dependencies
export default function Settings() {
  return (
    <>
      <Head>
        <title>Settings | AI CRM</title>
      </Head>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Settings</h1>
          <p style={{ color: '#666' }}>
            Customize your AI CRM system settings
          </p>
        </div>

        <div style={{ display: 'grid', gap: '32px' }}>
          {/* Simplified Settings Page for Deployment */}
          <div style={{ 
            padding: '24px', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            backgroundColor: 'white' 
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px' }}>
              Company Settings
            </h2>
            <p style={{ marginBottom: '16px' }}>
              Company settings are temporarily unavailable during this deployment.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Logo upload and company website scanning features will be restored in the next update.
            </p>
          </div>
          
          <div style={{ 
            padding: '24px', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            backgroundColor: 'white' 
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px' }}>
              User Preferences
            </h2>
            <p style={{ marginBottom: '16px' }}>
              User preference settings are temporarily unavailable during this deployment.
            </p>
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              User preferences will be restored in the next update.
            </p>
          </div>
        </div>
        
        <div style={{ marginTop: '32px' }}>
          <Link 
            href="/"
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 16px',
              backgroundColor: '#3B82F6',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
}
