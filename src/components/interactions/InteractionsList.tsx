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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Interaction, InteractionType } from '@/lib/interactions/types';
import { formatDistanceToNow } from 'date-fns';
import { 
  PlusCircle, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Trash2, 
  Edit, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Eye 
} from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import NewInteractionDialog from './NewInteractionDialog';
import EditInteractionDialog from './EditInteractionDialog';
import ViewInteractionDialog from './ViewInteractionDialog';
import { InteractionsSkeleton } from './InteractionsSkeleton';

interface InteractionsListProps {
  contactId: string;
  contactName: string;
}

export default function InteractionsList({ contactId, contactName }: InteractionsListProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<Interaction | null>(null);
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InteractionType | 'all'>('all');


  // Load interactions for this contact
  const fetchInteractions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/interactions?contactId=${contactId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch interactions (${response.status})`);
      }
      
      const data = await response.json();
      setInteractions(data.interactions || []);
      return data.interactions || [];
    } catch (err) {
      const error = err as Error;
      console.error('Failed to fetch interactions:', error);
      setError(error.message || 'Failed to load interaction history');
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (contactId) {
      fetchInteractions().catch(console.error);
    }
  }, [contactId]);
  
  // Function to retry loading interactions
  const handleRetryLoad = async () => {
    if (!contactId) return;
    
    try {
      setLoading(true);
      setError(null);
      await fetchInteractions();
      toast({
        title: "Interactions refreshed",
        description: "The interactions list has been updated.",
      });
    } catch (error) {
      // Error is already handled in fetchInteractions
    }
  };

  // Handle add interaction
  const handleAddInteraction = async (newInteraction: Interaction) => {
    try {
      setInteractions(prev => [newInteraction, ...prev]);
      toast({
        title: "Success",
        description: "Interaction added successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error adding interaction:', error);
      toast({
        title: "Error",
        description: "Failed to add interaction",
        variant: "destructive"
      });
    }
  };
  
  // Alias for backward compatibility
  const handleInteractionAdded = handleAddInteraction;

  // Handle editing an interaction
  const handleViewInteraction = (interaction: Interaction) => {
    setSelectedInteraction(interaction);
    setIsViewDialogOpen(true);
  };
  
  const handleEditInteraction = (interaction: Interaction) => {
    setSelectedInteraction(interaction);
    setIsEditDialogOpen(true);
    setIsViewDialogOpen(false);
  };
  
  // Handle update interaction
  const handleUpdateInteraction = async (updatedInteraction: Interaction) => {
    try {
      setInteractions(prev => 
        prev.map(i => i.id === updatedInteraction.id ? updatedInteraction : i)
      );
      toast({
        title: "Success",
        description: "Interaction updated successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating interaction:', error);
      toast({
        title: "Error",
        description: "Failed to update interaction",
        variant: "destructive"
      });
    }
  };
  
  // Alias for backward compatibility
  const handleInteractionUpdated = handleUpdateInteraction;

  // Handle deleting an interaction
  const handleDeleteInteraction = async (interaction: Interaction) => {
    if (!interaction.id) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const response = await fetch(`/api/interactions?id=${interaction.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete interaction (${response.status})`);
      }
      
      // Remove the interaction from the list
      setInteractions(prevInteractions => 
        prevInteractions.filter(item => item.id !== interaction.id)
      );
      
      toast({
        title: 'Interaction deleted',
        description: 'The interaction has been deleted successfully.',
        variant: 'default',
      });
      
      // Close the view dialog if it's open
      setIsViewDialogOpen(false);
    } catch (err) {
      const error = err as Error;
      console.error('Failed to delete interaction:', error);
      setDeleteError(error.message || "Failed to delete interaction");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete interaction",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter interactions based on active tab
  const filteredInteractions = activeTab === 'all' 
    ? interactions 
    : interactions.filter(interaction => interaction.type === activeTab);

  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, i) => (
      <div key={i} className="space-y-2 p-4 border rounded-lg">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-1/3" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    ));
  };

  const renderErrorState = () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error}
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={handleRetryLoad}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Retrying...' : 'Try again'}
        </Button>
      </AlertDescription>
    </Alert>
  );

  const renderEmptyState = () => (
    <div className="text-center py-8 space-y-2">
      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
      <h3 className="text-lg font-medium">No interactions found</h3>
      <p className="text-sm text-muted-foreground">
        {activeTab === 'all' 
          ? 'No interactions have been added yet.' 
          : `No ${activeTab}s found.`}
      </p>
      <Button 
        onClick={() => setIsDialogOpen(true)}
        className="mt-4"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Interaction
      </Button>
    </div>
  );

  const getInteractionIcon = (type: InteractionType) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Interaction History</CardTitle>
            <CardDescription>
              Track all interactions with {contactName}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryLoad}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Interaction
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          renderErrorState()
        ) : (
          <Tabs 
            defaultValue="all" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as InteractionType | 'all')}
            className="w-full"
          >
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="all" disabled={loading}>
                All
                {!loading && interactions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {interactions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="email" disabled={loading}>
                <Mail className="h-4 w-4 mr-1" />
                <span>Emails</span>
                {!loading && interactions.filter(i => i.type === 'email').length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {interactions.filter(i => i.type === 'email').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="call" disabled={loading}>
                <Phone className="h-4 w-4 mr-1" />
                <span>Calls</span>
                {!loading && interactions.filter(i => i.type === 'call').length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {interactions.filter(i => i.type === 'call').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="meeting" disabled={loading}>
                <Calendar className="h-4 w-4 mr-1" />
                <span>Meetings</span>
                {!loading && interactions.filter(i => i.type === 'meeting').length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {interactions.filter(i => i.type === 'meeting').length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="note" disabled={loading}>
                <FileText className="h-4 w-4 mr-1" />
                <span>Notes</span>
                {!loading && interactions.filter(i => i.type === 'note').length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {interactions.filter(i => i.type === 'note').length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          
            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="space-y-4">
                  {renderSkeletons()}
                </div>
              ) : filteredInteractions.length === 0 ? (
                renderEmptyState()
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
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold">{interaction.title}</h3>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewInteraction(interaction)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <h4 className="font-medium mb-1">{interaction.title}</h4>
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
        )}
      </CardContent>
      
      {/* Dialog for adding new interactions */}
      <NewInteractionDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        contactId={contactId}
        contactName={contactName}
        onInteractionAdded={handleAddInteraction}
      />
      
      {/* Dialog for editing interactions */}
      {isEditDialogOpen && selectedInteraction && (
        <EditInteractionDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          interaction={selectedInteraction}
          onInteractionUpdated={handleUpdateInteraction}
        />
      )}
      
      {/* Dialog for viewing interactions */}
      {isViewDialogOpen && selectedInteraction && (
        <ViewInteractionDialog
          isOpen={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
          interaction={selectedInteraction}
          onEdit={() => handleEditInteraction(selectedInteraction)}
          onDelete={() => handleDeleteInteraction(selectedInteraction)}
          isDeleting={isDeleting}
          deleteError={deleteError}
        />
      )}
    </Card>
  );
}
