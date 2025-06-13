import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getContactById } from '../../lib/contacts/data';
import { Contact } from '../../lib/contacts/types';

export default function ContactProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContact() {
      if (!id || typeof id !== 'string') return;
      
      try {
        setLoading(true);
        const contactData = await getContactById(id);
        if (contactData) {
          setContact(contactData);
          setError(null);
        } else {
          setError('Contact not found');
        }
      } catch (err) {
        console.error('Error loading contact:', err);
        setError('Failed to load contact information');
      } finally {
        setLoading(false);
      }
    }

    loadContact();
  }, [id]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        fontSize: '18px'
      }}>
        Loading contact...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#dc2626' }}>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Contact Not Found</h1>
        <p>The requested contact could not be found.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '24px',
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold',
            marginRight: '24px'
          }}>
            {contact.firstName} {contact.lastName}
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ color: '#6b7280' }}>{contact.email}</p>
            {contact.company && (
              <p style={{ color: '#6b7280' }}>{contact.company}</p>
            )}
            {contact.personalityType && (
              <span style={{ 
                display: 'inline-block',
                backgroundColor: '#a855f7',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500',
                marginTop: '8px'
              }}>
                {contact.personalityType}
              </span>
            )}
          </div>
        </div>
        
        <div style={{ 
          padding: '24px',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            Contact Information
          </h2>
          <p style={{ marginBottom: '16px' }}>
            Dispute resolution features are temporarily unavailable during this deployment.
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Full contact management features will be restored in the next update.
          </p>
        </div>
      </div>
    </div>
  );
}
