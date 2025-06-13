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
import { PlusCircle, Mail, Phone, Calendar, FileText, MessageSquare, Trash2, Edit } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import NewInteractionDialog from './NewInteractionDialog';

interface InteractionsListProps {
  contactId: string;
  contactName: string;
}

export default function InteractionsList({ contactId, contactName }: InteractionsListProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InteractionType | 'all'>('all');
  const { toast } = useToast();

  // Load interactions for this contact
  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/interactions?contactId=${contactId}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setInteractions(data.interactions || []);
      } catch (_error) {
        console.error('Failed to fetch interactions:', _error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load interaction history",
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (contactId) {
      fetchInteractions();
    }
  }, [contactId, toast]);

  // Handle adding a new interaction
  const handleAddInteraction = async (newInteraction: Interaction) => {
    setInteractions(prev => [newInteraction, ...prev]);
    setIsDialogOpen(false);
    toast({
      title: "Interaction added",
      description: "The interaction has been saved successfully",
    });
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Interaction History</CardTitle>
          <Button 
            onClick={() => setIsDialogOpen(true)} 
            size="sm" 
            className="flex items-center gap-1"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add</span>
          </Button>
        </div>
        <CardDescription>
          View and manage interactions with {contactName}
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
                          {formatDate(interaction.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    
                    <h4 className="font-medium mb-1">{interaction.subject}</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {interaction.content}
                    </p>
                    
                    {interaction.sentiment && (
                      <div className="mt-2">
                        <Badge variant={
                          interaction.sentiment === 'positive' ? 'default' :
                          interaction.sentiment === 'negative' ? 'destructive' : 'outline'
                        }>
                          Sentiment: {interaction.sentiment}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Dialog for adding new interactions */}
      <NewInteractionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        contactId={contactId}
        contactName={contactName}
        onInteractionAdded={handleAddInteraction}
      />
    </Card>
  );
}
