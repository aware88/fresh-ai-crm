'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { 
  User, 
  Mail, 
  Building, 
  Brain,
  Loader2,
  ChevronLeft,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import { Contact } from '@/lib/contacts/types';
import InteractionsList from '@/components/interactions/InteractionsList';
import { FilesList } from '@/components/files/FilesList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ContactDetailsPageProps {
  params: {
    id: string;
  };
}

export default function ContactDetailsPage({ params }: ContactDetailsPageProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Load contact details
  useEffect(() => {
    const fetchContact = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/contacts/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Contact not found');
          }
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setContact(data.contact);
      } catch (error) {
        console.error('Failed to fetch contact:', error);
        setError(error instanceof Error ? error.message : 'Failed to load contact');
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : 'Failed to load contact',
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) {
      fetchContact();
    }
  }, [params.id, toast]);

  // Delete a contact
  const handleDeleteContact = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/contacts?id=${params.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }
      
      toast({
        title: "Contact Deleted",
        description: "The contact has been removed from your CRM",
      });
      
      // Navigate back to contacts list
      router.push('/dashboard/contacts');
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to delete contact',
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Contact not found'}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard/contacts')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Contacts
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Details Card */}
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle>Contact Details</CardTitle>
            <CardDescription>
              View and manage contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold mb-3">
                {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
              </div>
              <h3 className="text-xl font-semibold">
                {contact.firstName} {contact.lastName}
              </h3>
              {contact.personalityType && (
                <Badge className="mt-2 bg-purple-100 text-purple-700 border-purple-200">
                  {contact.personalityType}
                </Badge>
              )}
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{contact.email}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Building className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium">{contact.company || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Brain className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Personality Notes</p>
                  <p className="text-sm">{contact.personalityNotes || 'No personality notes available'}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Contact History</p>
              <div className="text-sm">
                <p><span className="font-medium">Created:</span> {formatDate(contact.createdAt)}</p>
                <p><span className="font-medium">Last Updated:</span> {formatDate(contact.updatedAt)}</p>
                <p><span className="font-medium">Last Interaction:</span> {contact.lastInteraction ? formatDate(contact.lastInteraction) : 'Never'}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between p-4 border-t">
            <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={handleDeleteContact}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
              <Edit className="h-4 w-4 mr-2" /> Edit Contact
            </Button>
          </CardFooter>
        </Card>
        
        {/* Interactions and Files Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="interactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="interactions" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Interactions
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Files
              </TabsTrigger>
            </TabsList>
            <TabsContent value="interactions" className="mt-4">
              <InteractionsList 
                contactId={contact.id} 
                contactName={`${contact.firstName} ${contact.lastName}`} 
              />
            </TabsContent>
            <TabsContent value="files" className="mt-4">
              <FilesList contactId={contact.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
