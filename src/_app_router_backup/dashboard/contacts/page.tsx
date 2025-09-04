'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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

  // Load contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/contacts');
        
        if (!response.ok) {
          throw new Error('Failed to load contacts');
        }
        
        const data = await response.json();
        setContacts(data.contacts || []);
        
        // Check if we need to select a specific contact from URL
        const contactId = searchParams?.get('id');
        if (contactId && data.contacts) {
          const contact = data.contacts.find((c: Contact) => c.id === contactId);
          if (contact) {
            setSelectedContact(contact);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load contacts",
        });
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
      const response = await fetch(`/api/contacts?id=${id}`, {
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
      {/* Hero Section */}
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Contacts</h1>
        <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">
          Manage your contacts and their personality profiles
        </p>
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
                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
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
                          onClick={() => setSelectedContact(contact)}
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
                              // Handle edit
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
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                  <Edit className="h-4 w-4 mr-2" /> Edit Contact
                </Button>
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
