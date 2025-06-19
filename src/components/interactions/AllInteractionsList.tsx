'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Interaction, InteractionType } from '@/lib/interactions/types';
import { formatDistanceToNow } from 'date-fns';
import { PlusCircle, Mail, Phone, Calendar, FileText, MessageSquare, Trash2, Edit, User } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import NewInteractionDialog from './NewInteractionDialog';
import EditInteractionDialog from './EditInteractionDialog';
import Link from 'next/link';

export default function AllInteractionsList() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InteractionType | 'all'>('all');
  const [contactsMap, setContactsMap] = useState<Record<string, { id: string, name: string }>>({});
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const { toast } = useToast();

  // Load all interactions
  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/interactions');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        // Explicitly type the interactions array
        const interactionsData: Interaction[] = data.interactions || [];
        setInteractions(interactionsData);
        
        // Fetch contact details for each unique contact_id
        const uniqueContactIds: string[] = [...new Set(interactionsData.map(i => i.contact_id))];
        await fetchContactDetails(uniqueContactIds);
      } catch (_error) {
        console.error('Failed to fetch interactions:', _error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load interactions",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInteractions();
  }, [toast]);

  // Fetch contact details for the interactions
  const fetchContactDetails = async (contactIds: string[]) => {
    try {
      const contactsData: Record<string, { id: string, name: string }> = {};
      
      // Fetch each contact's details
      await Promise.all(contactIds.map(async (contactId) => {
        try {
          const response = await fetch(`/api/contacts/${contactId}`);
          if (response.ok) {
            const data = await response.json();
            const contact = data.contact;
            if (contact) {
              contactsData[contactId] = {
                id: contactId,
                name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown Contact'
              };
            }
          }
        } catch (error) {
          console.error(`Failed to fetch contact ${contactId}:`, error);
        }
      }));
      
      setContactsMap(contactsData);
    } catch (error) {
      console.error('Failed to fetch contact details:', error);
    }
  };

  // Handle deleting an interaction
  const handleDeleteInteraction = async (id: string) => {
    try {
      const response = await fetch(`/api/interactions?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      setInteractions(prev => prev.filter(interaction => interaction.id !== id));
      toast({
        title: "Interaction deleted",
        description: "The interaction has been removed successfully",
      });
    } catch (_error) {
      console.error('Error deleting interaction:', _error);
      toast({
        title: "Error",
        description: "Failed to delete interaction",
        variant: "destructive",
      });
    }
  };
  
  // Handle editing an interaction
  const handleEditInteraction = (interaction: Interaction) => {
    setSelectedInteraction(interaction);
    setIsEditDialogOpen(true);
  };
  
  // Handle updating an interaction
  const handleUpdateInteraction = (updatedInteraction: Interaction) => {
    setInteractions(prev => 
      prev.map(item => item.id === updatedInteraction.id ? updatedInteraction : item)
    );
    setIsEditDialogOpen(false);
    setSelectedInteraction(null);
    toast({
      title: "Interaction updated",
      description: "The interaction has been updated successfully",
    });
  };

  // Filter interactions based on active tab
  const filteredInteractions = activeTab === 'all' 
    ? interactions 
    : interactions.filter(interaction => interaction.type === activeTab);

  // Get icon for interaction type
  const getInteractionIcon = (type: InteractionType) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Invalid date';
    }
  };

  // Get contact name from the map
  const getContactName = (contactId: string) => {
    return contactsMap[contactId]?.name || 'Unknown Contact';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>All Interactions</CardTitle>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Interaction</span>
          </Button>
        </div>
        <CardDescription>
          View and manage all interactions across contacts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="all" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as InteractionType | 'all')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="email">Emails</TabsTrigger>
            <TabsTrigger value="call">Calls</TabsTrigger>
            <TabsTrigger value="meeting">Meetings</TabsTrigger>
            <TabsTrigger value="note">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            {loading ? (
              <div className="text-center py-8">Loading interactions...</div>
            ) : filteredInteractions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {activeTab !== 'all' ? activeTab : ''} interactions found
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInteractions.map((interaction) => (
                  <div key={interaction.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          {getInteractionIcon(interaction.type)}
                          <span className="capitalize">{interaction.type}</span>
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(interaction.interaction_date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEditInteraction(interaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500"
                          onClick={() => handleDeleteInteraction(interaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <h4 className="font-medium mb-1">{interaction.title || interaction.subject}</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {interaction.content}
                    </p>
                    
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Link href={`/dashboard/contacts/${interaction.contact_id}`}>
                        <Badge variant="secondary" className="flex items-center gap-1 cursor-pointer">
                          <User className="h-3 w-3" />
                          <span>{getContactName(interaction.contact_id)}</span>
                        </Badge>
                      </Link>
                      
                      {interaction.sentiment && (
                        <Badge variant={
                          interaction.sentiment === 'positive' ? 'default' :
                          interaction.sentiment === 'negative' ? 'destructive' : 'outline'
                        }>
                          Sentiment: {interaction.sentiment}
                        </Badge>
                      )}
                    </div>
                    
                    {interaction.created_by && (
                      <div className="mt-2 text-xs text-gray-500">
                        Created by: {interaction.created_by.substring(0, 8)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Dialog for adding new interactions - we'll need to modify this to work without a pre-selected contact */}
      {isDialogOpen && (
        <NewInteractionDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          contactId=""
          contactName=""
          onInteractionAdded={(newInteraction) => {
            setInteractions(prev => [newInteraction, ...prev]);
            setIsDialogOpen(false);
            toast({
              title: "Interaction added",
              description: "The interaction has been saved successfully",
            });
          }}
        />
      )}
      
      {/* Dialog for editing interactions */}
      {selectedInteraction && (
        <EditInteractionDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedInteraction(null);
          }}
          interaction={selectedInteraction}
          onInteractionUpdated={handleUpdateInteraction}
        />
      )}
    </Card>
  );
}
