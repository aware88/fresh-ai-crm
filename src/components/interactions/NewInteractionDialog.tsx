import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Interaction, InteractionType, InteractionCreateInput } from '@/lib/interactions/types';
import { Contact } from '@/lib/contacts/types';
import { Loader2, AlertCircle, RefreshCw, Mail, Phone, Calendar, FileText, MessageSquare } from 'lucide-react';

interface NewInteractionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contactId?: string; // Optional - if not provided, show contact selector
  contactName?: string; // Optional - if not provided, show contact selector
  onInteractionAdded: (interaction: Interaction) => void;
}

export default function NewInteractionDialog({
  isOpen,
  onClose,
  contactId,
  contactName,
  onInteractionAdded
}: NewInteractionDialogProps) {
  const [type, setType] = useState<InteractionType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(contactId || '');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Fetch contacts if no contactId is provided
  useEffect(() => {
    if (!contactId) {
      fetchContacts();
    }
  }, [contactId]);
  
  // Fetch all contacts for the dropdown
  const fetchContacts = async () => {
    try {
      setIsLoadingContacts(true);
      setContactsError(null);
      const response = await fetch('/api/contacts');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch contacts (${response.status})`);
      }
      
      const data = await response.json();
      setContacts(data.contacts || []);
      
      // Auto-select the first contact if none is selected
      if (!selectedContactId && data.contacts && data.contacts.length > 0) {
        setSelectedContactId(data.contacts[0].id);
      }
    } catch (err) {
      const error = err as Error;
      console.error('Failed to fetch contacts:', error);
      setContactsError(error.message || 'Failed to load contacts');
    } finally {
      setIsLoadingContacts(false);
    }
  };
  
  // Retry loading contacts
  const handleRetryLoadContacts = () => {
    fetchContacts();
  };
  
  // Get the name of the selected contact
  const getSelectedContactName = () => {
    if (contactName) return contactName;
    
    const selectedContact = contacts.find(c => c.id === selectedContactId);
    return selectedContact 
      ? `${selectedContact.firstName || ''} ${selectedContact.lastName || ''}`.trim() 
      : 'Select a contact';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please provide a title for the interaction",
      });
      return;
    }
    
    // Validate contact selection
    const finalContactId = contactId || selectedContactId;
    if (!finalContactId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a contact",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the interaction data object
      const interactionData: InteractionCreateInput = {
        contact_id: finalContactId,
        type,
        title: title.trim(),
        content: (content || '').trim(),
        interaction_date: new Date().toISOString(),
      };
      
      const response = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interactionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create interaction (${response.status})`);
      }
      
      const data = await response.json();
      onInteractionAdded(data.interaction);
      resetForm();
      onClose();
      toast({
        title: "Interaction Added",
        description: "The interaction has been recorded successfully",
      });
    } catch (err) {
      const error = err as Error;
      console.error('Failed to create interaction:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create interaction",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
  
  const resetForm = () => {
    setType('note');
    setTitle('');
    setContent('');
    if (!contactId) {
      setSelectedContactId(contacts.length > 0 ? contacts[0].id : '');
    }
  };
  
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Interaction</DialogTitle>
            <DialogDescription>
              Record a new interaction {contactName ? `with ${contactName}` : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Contact selector - only show if no contactId was provided */}
            {!contactId && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="contact" className="text-right">
                  Contact
                </Label>
                {contactsError ? (
                  <div className="col-span-3">
                    <Alert variant="destructive" className="mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error loading contacts</AlertTitle>
                      <AlertDescription className="flex flex-col gap-2">
                        <span>{contactsError}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-fit"
                          onClick={handleRetryLoadContacts}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Try again
                        </Button>
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <Select
                    value={selectedContactId}
                    onValueChange={setSelectedContactId}
                    disabled={isLoadingContacts}
                  >
                    <SelectTrigger className="col-span-3">
                      {isLoadingContacts ? (
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading contacts...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder="Select a contact" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingContacts ? (
                        <div className="p-2">
                          <Skeleton className="h-8 w-full mb-2" />
                          <Skeleton className="h-8 w-full mb-2" />
                          <Skeleton className="h-8 w-full" />
                        </div>
                      ) : contacts.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No contacts found
                        </SelectItem>
                      ) : (
                        contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact'}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as InteractionType)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="col-span-3">
                  <div className="flex items-center gap-2">
                    {getInteractionIcon(type)}
                    <SelectValue placeholder="Select type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </SelectItem>
                  <SelectItem value="call" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>Call</span>
                  </SelectItem>
                  <SelectItem value="meeting" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Meeting</span>
                  </SelectItem>
                  <SelectItem value="note" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Note</span>
                  </SelectItem>
                  <SelectItem value="other" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Other</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter a title for this interaction"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="content" className="text-right">
                Content
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="col-span-3"
                placeholder="Details of the interaction"
                rows={5}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Interaction'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
