'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ContactForm from '@/components/contacts/ContactForm';
import { Contact } from '@/lib/contacts/types';
import { useToast } from '@/components/ui/use-toast';

interface EditContactPageProps {
  params: {
    id: string;
  };
}

export default function EditContactPage({ params }: EditContactPageProps) {
  const { id } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch contact data
  useEffect(() => {
    const fetchContact = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/contacts/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Contact not found');
          }
          throw new Error(`Error: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Invalid contact data received');
        }
        
        setContact(result.data);
      } catch (error) {
        console.error('Failed to fetch contact:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load contact';
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error",
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchContact();
  }, [id, toast]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-gray-500">Loading contact details...</p>
        </div>
      </div>
    );
  }
  
  if (error || !contact) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/contacts')}
            className="flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Button>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Contact not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/dashboard/contacts/${id}`)}
          className="flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Contact Details
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Edit Contact: {contact.firstName} {contact.lastName}</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm contact={contact} />
        </CardContent>
      </Card>
    </div>
  );
}
