'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SyncAllContactsButton } from '@/components/contacts/SyncAllContactsButton';
import { SyncContactButton } from '@/components/contacts/SyncContactButton';
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
        setError('Failed to load contacts');
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
    <div className="flex flex-col space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold aris-text-gradient">Contacts</h1>
          <p className="text-gray-500">Manage your contacts and their personality profiles</p>
        </div>
        <div className="flex gap-3">
          <SyncAllContactsButton 
            variant="outline"
            size="sm"
            className="mr-2 rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            onSyncComplete={(result) => {
              if (result.success) {
                toast({
                  title: 'Contacts synced',
                  description: `Successfully synced ${result.created + result.updated} contacts with Metakocka`,
                });
                // Refresh the page to show updated sync status
                router.refresh();
              }
            }}
          >
            Sync All to Metakocka
          </SyncAllContactsButton>
          <Button asChild className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
            <Link href="/dashboard/contacts/new">
              <UserPlus className="h-4 w-4 mr-2" />
              New Contact
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contacts List */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-100/50 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 border-b pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl shadow-md mr-3">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-800">Contact List</CardTitle>
                    <CardDescription className="text-gray-500">
                      {filteredContacts.length} contacts found
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-xl transition-all duration-200"
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
                    className="pl-10 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="p-3 rounded-full bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10">
                    <Loader2 className="h-8 w-8 text-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-spin" />
                  </div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 rounded-full bg-red-50 mb-2">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                  </div>
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
                      <TableRow className="bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 border-b border-gray-200">
                        <TableHead className="font-medium">Name</TableHead>
                        <TableHead className="font-medium">Email</TableHead>
                        <TableHead className="font-medium">Company</TableHead>
                        <TableHead className="font-medium">Personality</TableHead>
                        <TableHead className="font-medium">Last Contact</TableHead>
                        <TableHead className="text-right font-medium">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => (
                        <TableRow 
                          key={contact.id} 
                          className={`cursor-pointer transition-all duration-200 ${selectedContact?.id === contact.id 
                            ? 'bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 border-l-4 border-blue-600' 
                            : 'hover:bg-gray-50'}`}
                          onClick={() => {
                            setSelectedContact(contact);
                            window.history.pushState({}, '', `/dashboard/contacts?id=${contact.id}`);
                          }}
                        >
                          <TableCell className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </TableCell>
                          <TableCell>{contact.email}</TableCell>
                          <TableCell>{contact.company || 'N/A'}</TableCell>
                          <TableCell>
                            {contact.personalityType ? (
                              <Badge className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 text-gray-700 border-gray-200 rounded-full px-3 py-1">
                                {contact.personalityType}
                              </Badge>
                            ) : 'Unknown'}
                          </TableCell>
                          <TableCell>{contact.lastInteraction ? formatDate(contact.lastInteraction) : 'Never'}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full hover:bg-blue-600/10 transition-all duration-200" 
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/contacts/${contact.id}/edit`);
                              }}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full hover:bg-red-600/10 transition-all duration-200" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteContact(contact.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
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
              <div className="text-sm text-gray-500 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 px-4 py-2 rounded-xl">
                Showing {filteredContacts.length} of {contacts.length} contacts
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled 
                  className="rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled
                  className="rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Contact Details */}
        <div className="lg:col-span-1">
          {selectedContact ? (
            <Card className="border border-gray-100/50 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden h-full">
              <CardHeader className="bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 border-b pb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-lg font-medium mr-3 shadow-md">
                    {selectedContact.firstName?.[0]}{selectedContact.lastName?.[0]}
                  </div>
                  <div>
                    <CardTitle className="text-gray-800">Contact Details</CardTitle>
                    <CardDescription className="text-gray-500">
                      View and manage contact information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h3>
                  {selectedContact.personalityType && (
                    <Badge className="mt-2 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 text-gray-700 border-gray-200 rounded-full px-3 py-1">
                      {selectedContact.personalityType}
                    </Badge>
                  )}
                  <div className="mt-3">
                    <SyncContactButton
                      contactId={selectedContact.id}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                      onSyncComplete={(result) => {
                        if (result.success) {
                          toast({
                            title: 'Contact synced',
                            description: 'Contact was successfully synced with Metakocka',
                          });
                        }
                      }}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-5">
                  <div className="flex items-start">
                    <div className="p-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl shadow-sm mr-3">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Email</p>
                      <p className="font-medium">{selectedContact.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="p-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl shadow-sm mr-3">
                      <Building className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Company</p>
                      <p className="font-medium">{selectedContact.company || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="p-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl shadow-sm mr-3">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Personality Notes</p>
                      <p className="text-sm">{selectedContact.personalityNotes || 'No personality notes available'}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 p-4 rounded-xl">
                  <p className="text-sm font-medium aris-text-gradient mb-2">Contact History</p>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Created:</span> {formatDate(selectedContact.createdAt)}</p>
                    <p><span className="font-medium">Last Updated:</span> {formatDate(selectedContact.updatedAt)}</p>
                    <p><span className="font-medium">Last Interaction:</span> {selectedContact.lastInteraction ? formatDate(selectedContact.lastInteraction) : 'Never'}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between p-4 border-t">
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200" 
                  onClick={() => handleDeleteContact(selectedContact.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                    onClick={() => router.push(`/dashboard/contacts/${selectedContact.id}`)}
                  >
                    View Details
                  </Button>
                  <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                    <Edit className="h-4 w-4 mr-2" /> Edit Contact
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card className="border border-gray-100/50 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl h-full flex flex-col justify-center items-center p-8 text-center bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5">
              <div className="p-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-md mb-5">
                <User className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-medium aris-text-gradient">No Contact Selected</h3>
              <p className="text-gray-500 mt-3 max-w-xs">
                Select a contact from the list to view their details and personality profile
              </p>
              <Button 
                variant="outline" 
                className="mt-5 rounded-xl border-gray-200 hover:border-gray-300 hover:bg-white/50 transition-all duration-200"
                onClick={() => router.push('/dashboard/contacts/new')}
              >
                <UserPlus className="h-4 w-4 mr-2" /> Add New Contact
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
