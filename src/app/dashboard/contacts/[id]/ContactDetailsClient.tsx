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
  UserX,
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

interface ContactDetailsClientProps {
  id: string;
}

export default function ContactDetailsClient({ id }: ContactDetailsClientProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Load contact details
  useEffect(() => {
    // Skip if no ID is available
    if (!id) {
      setError('No contact ID provided');
      setLoading(false);
      return;
    }

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

  // Delete a contact
  const handleDeleteContact = async () => {
    if (!id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No contact ID available for deletion",
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this contact?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/contacts/${id}`, {
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
      router.refresh(); // Refresh the router to update the contacts list
    } catch (err) {
      console.error('Failed to delete contact:', err);
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
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-gray-500">Loading contact details...</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <UserX className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="mt-4 text-xl font-semibold text-gray-900">
              Contact Not Found
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-gray-500">
              {error || 'The contact you are looking for does not exist or may have been deleted.'}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center border-t px-6 py-4">
            <Button 
              onClick={() => router.push('/dashboard/contacts')}
              className="inline-flex items-center px-4 py-2"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
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
                  <p className="font-medium">{contact.company || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="font-medium">{contact.position || 'N/A'}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Brain className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Personality Type</p>
                  <p className="font-medium">{contact.personalityType || 'Not specified'}</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Last Contact</p>
              <p className="text-sm">
                {contact.lastContact ? formatDate(contact.lastContact) : 'Never'}
              </p>
              
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-sm">
                {contact.createdAt ? formatDate(contact.createdAt) : 'N/A'}
              </p>
              
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-sm">
                {contact.updatedAt ? formatDate(contact.updatedAt) : 'N/A'}
              </p>
            </div>
            
            <Separator />
            
            <div className="flex space-x-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => router.push(`/dashboard/contacts/${id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handleDeleteContact}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="interactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
            </TabsList>
            
            <TabsContent value="interactions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interactions</CardTitle>
                  <CardDescription>
                    Recent interactions with {contact.firstName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InteractionsList 
                    contactId={id} 
                    contactName={`${contact.firstName} ${contact.lastName}`} 
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="files" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Files</CardTitle>
                  <CardDescription>
                    Files shared with {contact.firstName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FilesList contactId={id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>
                    Private notes about {contact.firstName}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contact.notes ? (
                <div className="prose max-w-none">
                  {contact.notes.split('\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No notes available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
