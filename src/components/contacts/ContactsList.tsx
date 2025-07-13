'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Contact {
  id: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  emailAddresses: Array<{
    address: string;
    name: string;
  }>;
  businessPhones: string[];
  mobilePhone?: string;
  jobTitle?: string;
  companyName?: string;
}

export default function ContactsList() {
  const { data: session, status } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    async function fetchContacts() {
      if (!session?.accessToken) {
        setError('Not authenticated with Microsoft Graph');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        const response = await fetch('/api/contacts/microsoft?top=50');
        
        if (!response.ok) {
          throw new Error(`Error fetching contacts: ${response.statusText}`);
        }
        
        const data = await response.json();
        setContacts(data.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch contacts:', err);
        setError(err.message || 'Failed to load contacts. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, [session]);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.displayName?.toLowerCase().includes(searchLower) ||
      contact.emailAddresses?.some(email => email.address.toLowerCase().includes(searchLower)) ||
      contact.companyName?.toLowerCase().includes(searchLower) ||
      contact.jobTitle?.toLowerCase().includes(searchLower)
    );
  });

  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
  };

  // Handle contact creation
  const handleCreateContact = () => {
    // Placeholder for contact creation functionality
    console.log('Create new contact');
  };

  // Authentication handling
  if (status === 'loading') {
    return <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }
  
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="p-8 text-center">
        <Alert>
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>You need to sign in with Microsoft to access your contacts.</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => window.location.href = '/api/auth/signin/microsoft'}>
          Sign in with Microsoft
        </Button>
      </div>
    );
  }

  // Loading and error states
  if (loading) return <Spinner />;
  if (error) return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  return (
    <div className="contacts-list">
      <div className="flex justify-between items-center mb-4">
        <div className="w-1/2">
          <Input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={handleCreateContact} variant="default">
          New Contact
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contacts list */}
        <div className="col-span-1 border rounded-lg overflow-hidden">
          <div className="bg-gray-50 p-3 border-b">
            <h3 className="font-medium">Contacts ({filteredContacts.length})</h3>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {filteredContacts.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">
                {searchTerm ? 'No contacts match your search' : 'No contacts found'}
              </p>
            ) : (
              <ul className="divide-y">
                {filteredContacts.map(contact => (
                  <li 
                    key={contact.id} 
                    className={`p-3 hover:bg-gray-50 cursor-pointer ${selectedContact?.id === contact.id ? 'bg-blue-50' : ''}`}
                    onClick={() => handleContactSelect(contact)}
                  >
                    <div className="font-medium">{contact.displayName}</div>
                    {contact.emailAddresses && contact.emailAddresses.length > 0 && (
                      <div className="text-sm text-gray-600">{contact.emailAddresses[0].address}</div>
                    )}
                    {contact.companyName && (
                      <div className="text-xs text-gray-500">{contact.companyName}</div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Contact details */}
        <div className="col-span-2 border rounded-lg">
          {selectedContact ? (
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-4">{selectedContact.displayName}</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                  <div className="mt-2 space-y-2">
                    {selectedContact.emailAddresses && selectedContact.emailAddresses.map((email, index) => (
                      <div key={index} className="flex">
                        <span className="text-gray-500 w-20">Email:</span>
                        <span>{email.address}</span>
                      </div>
                    ))}
                    
                    {selectedContact.businessPhones && selectedContact.businessPhones.map((phone, index) => (
                      <div key={index} className="flex">
                        <span className="text-gray-500 w-20">Business:</span>
                        <span>{phone}</span>
                      </div>
                    ))}
                    
                    {selectedContact.mobilePhone && (
                      <div className="flex">
                        <span className="text-gray-500 w-20">Mobile:</span>
                        <span>{selectedContact.mobilePhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Work Information</h3>
                  <div className="mt-2 space-y-2">
                    {selectedContact.jobTitle && (
                      <div className="flex">
                        <span className="text-gray-500 w-20">Title:</span>
                        <span>{selectedContact.jobTitle}</span>
                      </div>
                    )}
                    
                    {selectedContact.companyName && (
                      <div className="flex">
                        <span className="text-gray-500 w-20">Company:</span>
                        <span>{selectedContact.companyName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex space-x-2">
                <Button variant="outline" size="sm">
                  Edit Contact
                </Button>
                <Button variant="outline" size="sm" color="danger">
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Select a contact to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
