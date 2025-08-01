'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertCircle,
  Users,
  UserCheck,
  BarChart3,
  History,
  Phone,
  MapPin,
  Calendar,
  X,
  Filter
} from 'lucide-react';
import { Contact } from '@/lib/contacts/types';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [personalityFilter, setPersonalityFilter] = useState<string>('all');
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

  // Filter contacts based on search term and personality filter
  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = !searchTerm || 
      fullName.includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      (contact.company && contact.company.toLowerCase().includes(searchLower));
    
    const matchesPersonality = personalityFilter === 'all' || 
      (contact.personalityType && contact.personalityType.toLowerCase() === personalityFilter.toLowerCase());
    
    return matchesSearch && matchesPersonality;
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

  // Get unique personality types for filter
  const personalityTypes = Array.from(new Set(contacts.map(c => c.personalityType).filter(Boolean)));

  // Check if any filters are active
  const hasActiveFilters = searchTerm || personalityFilter !== 'all';
  
  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setPersonalityFilter('all');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground">
          Manage your contacts and their personality profiles with AI-powered insights
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 p-1 bg-blue-50 rounded-xl shadow-inner border border-blue-100">
          <TabsTrigger 
            value="contacts" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <Users className="h-4 w-4" /> Contacts
          </TabsTrigger>
          <TabsTrigger 
            value="segments" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <UserCheck className="h-4 w-4" /> Segments
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-blue-100 data-[state=active]:hover:bg-blue-500"
          >
            <History className="h-4 w-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Contact Management</CardTitle>
                    <CardDescription className="text-blue-100">
                      Manage your contacts and their personality profiles
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href="/dashboard/contacts/new">
                    <Button variant="outline" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white border-opacity-20">
                      <UserPlus className="mr-2 h-4 w-4" />
                      New Contact
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Search and Filters */}
              <div className="space-y-3 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search contacts by name, email, or company..."
                      className="pl-9 pr-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
                        onClick={() => setSearchTerm('')}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear search</span>
                      </Button>
                    )}
                  </div>

                  {/* Personality Filter */}
                  <div className="w-full sm:w-48">
                    <Select
                      value={personalityFilter}
                      onValueChange={setPersonalityFilter}
                    >
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Personality" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Personalities</SelectItem>
                        {personalityTypes.map((type) => (
                          <SelectItem key={type} value={type || ''}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Active Filters */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-sm text-muted-foreground">Filters:</span>
                    
                    {searchTerm && (
                      <Badge variant="secondary" className="px-2 py-1 text-xs font-normal">
                        Search: "{searchTerm}"
                        <button
                          onClick={() => setSearchTerm('')}
                          className="ml-1.5 rounded-full hover:bg-accent"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    
                    {personalityFilter !== 'all' && (
                      <Badge variant="secondary" className="px-2 py-1 text-xs font-normal">
                        Personality: {personalityFilter}
                        <button
                          onClick={() => setPersonalityFilter('all')}
                          className="ml-1.5 rounded-full hover:bg-accent"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      onClick={clearAllFilters}
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-gray-500">Loading contacts...</p>
                  </div>
                </div>
              ) : (contacts.length === 0 || error) ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 rounded-full bg-gray-50 mb-4">
                    <Users className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No contacts found</p>
                  <p className="text-gray-500 mt-2 max-w-md">
                    Your contacts will appear here as you add them to the system.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NAME</TableHead>
                      <TableHead>EMAIL</TableHead>
                      <TableHead>COMPANY</TableHead>
                      <TableHead>PERSONALITY</TableHead>
                      <TableHead>LAST CONTACT</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow 
                        key={contact.id} 
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                        onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium">
                              {contact.firstName?.[0]}{contact.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                              <div className="text-sm text-gray-500">{contact.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{contact.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span>{contact.company || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {contact.personalityType ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              <Brain className="h-3 w-3 mr-1" />
                              {contact.personalityType}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{contact.lastInteraction ? formatDate(contact.lastInteraction) : 'Never'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full hover:bg-blue-50 transition-all duration-200" 
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/contacts/${contact.id}`);
                              }}
                            >
                              <User className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full hover:bg-green-50 transition-all duration-200" 
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/contacts/${contact.id}/edit`);
                              }}
                            >
                              <Edit className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full hover:bg-red-50 transition-all duration-200" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteContact(contact.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Contact Segments</CardTitle>
                  <CardDescription className="text-blue-100">
                    Organize contacts into targeted segments for better engagement
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <UserCheck className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Contact Segmentation</h3>
                <p className="text-gray-600 mb-4">
                  Advanced contact segmentation and targeting features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Contact Analytics</CardTitle>
                  <CardDescription className="text-blue-100">
                    Insights and analytics about your contact relationships
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Contact Analytics</h3>
                <p className="text-gray-600 mb-4">
                  Advanced analytics and reporting features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <History className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Contact History</CardTitle>
                  <CardDescription className="text-blue-100">
                    View contact changes, interactions, and audit trail
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <History className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Contact History</h3>
                <p className="text-gray-600 mb-4">
                  Contact history and audit trail features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
