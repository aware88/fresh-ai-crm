'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  User, 
  Search, 
  UserPlus, 
  Trash2, 
  Edit, 
  Mail, 
  Building, 
  Brain,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Contact } from '@/lib/contacts/types';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Load contacts
  useEffect(() => {
    // Fetch contacts from API
    const fetchContacts = async () => {
      try {
        const response = await fetch('/api/contacts');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        const contactsArray = Array.isArray(data.contacts) ? data.contacts : [];
        setContacts(contactsArray);
        
        // Display whether we're using Supabase or not
        if (data.usingSupabase) {
          console.log('Using Supabase for contacts data persistence');
        } else {
          console.log('Using in-memory storage for contacts data');
        }
        
        // Check if we need to select a specific contact from URL
        const contactId = searchParams?.get('id');
        if (contactId && contactsArray.length > 0) {
          const contact = contactsArray.find((c: Contact) => c.id === contactId);
          if (contact) {
            setSelectedContact(contact);
          }
        }
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        // Set empty array to prevent filter errors
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContacts();
  }, [searchParams]);

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return (
      fullName.includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      (contact.company && contact.company.toLowerCase().includes(searchLower)) ||
      (contact.personalityType && contact.personalityType.toLowerCase().includes(searchLower))
    );
  });

  // Delete a contact
  const handleDeleteContact = async (id: string) => {
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
      
      // Remove from state
      setContacts(contacts.filter(c => c.id !== id));
      
      // If the deleted contact was selected, clear selection
      if (selectedContact && selectedContact.id === id) {
        setSelectedContact(null);
      }
      
      toast({
        title: "Contact Deleted",
        description: "The contact has been removed from your CRM",
      });
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contacts and their interaction history
          </p>
        </div>
        <Link href="/dashboard/contacts/new">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contacts List */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-full mr-3">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-blue-800">Contact List</CardTitle>
                    <CardDescription className="text-blue-600">
                      {filteredContacts.length} contacts found
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  onClick={() => router.push('/dashboard/contacts/new')}
                >
                  <UserPlus className="h-4 w-4 mr-2" /> Add Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search contacts..." 
                    className="pl-10 border-gray-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                  <p className="text-red-500 font-medium">{error}</p>
                  <p className="text-gray-500 mt-1 max-w-md">
                    There was a problem loading your contacts. Please try again later.
                  </p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <User className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-gray-500 font-medium">No contacts found</p>
                  <p className="text-gray-400 mt-1 max-w-md">
                    {searchTerm ? 'Try a different search term' : 'Extract contacts from emails to populate your CRM'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Personality</TableHead>
                        <TableHead>Last Contact</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => (
                        <TableRow 
                          key={contact.id} 
                          className={`cursor-pointer hover:bg-gray-50 ${selectedContact?.id === contact.id ? 'bg-blue-50' : ''}`}
                          onClick={() => {
                            setSelectedContact(contact);
                            window.history.pushState({}, '', `/dashboard/contacts/${contact.id}`);
                          }}
                        >
                          <TableCell className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>{contact.company || 'N/A'}</TableCell>
                          <TableCell>
                            {contact.personalityType ? (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                {contact.personalityType}
                              </Badge>
                            ) : 'Unknown'}
                          </TableCell>
                          <TableCell>{contact.lastInteraction ? formatDate(contact.lastInteraction) : 'Never'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/contacts/${contact.id}/edit`);
                            }}>
                              <Edit className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteContact(contact.id);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between p-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {filteredContacts.length} of {contacts.length} contacts
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" disabled>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Contact Details */}
        <div>
          {selectedContact ? (
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg border-b pb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-full mr-3">
                    <User className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-purple-800">Contact Details</CardTitle>
                    <CardDescription className="text-purple-600">
                      View and manage contact information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold mb-3">
                    {selectedContact.firstName.charAt(0)}{selectedContact.lastName.charAt(0)}
                  </div>
                  <h3 className="text-xl font-semibold">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h3>
                  {selectedContact.personalityType && (
                    <Badge className="mt-2 bg-purple-100 text-purple-700 border-purple-200">
                      {selectedContact.personalityType}
                    </Badge>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedContact.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Building className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="font-medium">{selectedContact.company || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Brain className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Personality Notes</p>
                      <p className="text-sm">{selectedContact.personalityNotes || 'No personality notes available'}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Contact History</p>
                  <div className="text-sm">
                    <p><span className="font-medium">Created:</span> {formatDate(selectedContact.createdAt)}</p>
                    <p><span className="font-medium">Last Updated:</span> {formatDate(selectedContact.updatedAt)}</p>
                    <p><span className="font-medium">Last Interaction:</span> {selectedContact.lastInteraction ? formatDate(selectedContact.lastInteraction) : 'Never'}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between p-4 border-t">
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleDeleteContact(selectedContact.id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/dashboard/contacts/${selectedContact.id}`)}
                  >
                    View Details
                  </Button>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                    <Edit className="h-4 w-4 mr-2" /> Edit Contact
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg h-full flex flex-col justify-center items-center p-8 text-center bg-gradient-to-b from-white to-gray-50">
              <User className="h-16 w-16 text-gray-200 mb-4" />
              <h3 className="text-xl font-medium text-gray-700">No Contact Selected</h3>
              <p className="text-gray-500 mt-2 max-w-xs">
                Select a contact from the list to view their details and personality profile
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
