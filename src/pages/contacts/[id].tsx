import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getContactById } from '../../lib/contacts/data';
import { Contact } from '../../lib/contacts/types';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

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
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner className="mr-4" />
        <p className="text-lg">Loading contact...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="p-4 bg-red-50 rounded-md border border-red-200">
          <h2 className="text-lg font-semibold text-red-500 mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Contact Not Found</h1>
        <p>The requested contact could not be found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="p-6 border border-gray-200 rounded-lg bg-white">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <h1 className="text-2xl font-bold">
              {contact.firstName} {contact.lastName}
            </h1>
            <div>
              <p className="text-gray-600">{contact.email}</p>
              {contact.company && (
                <p className="text-gray-600">{contact.company}</p>
              )}
              {contact.personalityType && (
                <Badge className="mt-2 bg-purple-100 text-purple-800">
                  {contact.personalityType}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-gray-50 rounded-md border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">
            Contact Information
          </h2>
          <p className="mb-4">
            Dispute resolution features are temporarily unavailable during this deployment.
          </p>
          <p className="text-sm text-gray-500">
            Full contact management features will be restored in the next update.
          </p>
        </div>
      </div>
    </div>
  );
}
