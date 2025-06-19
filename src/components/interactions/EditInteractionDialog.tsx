'use client';

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Interaction, InteractionType, InteractionUpdateInput } from '@/lib/interactions/types';
import { Loader2, AlertCircle, Mail, Phone, Calendar, FileText, MessageSquare } from 'lucide-react';

interface EditInteractionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: Interaction;
  onInteractionUpdated: (updatedInteraction: Interaction) => void;
}

export default function EditInteractionDialog({
  isOpen,
  onClose,
  interaction,
  onInteractionUpdated
}: EditInteractionDialogProps) {
  const [type, setType] = useState<InteractionType>(interaction.type);
  const [title, setTitle] = useState(interaction.title || '');
  const [content, setContent] = useState(interaction.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Update form when interaction changes
  useEffect(() => {
    setType(interaction.type);
    setTitle(interaction.title || '');
    setContent(interaction.content || '');
  }, [interaction]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!title.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please provide a title for the interaction",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the interaction update data object
      const interactionData: InteractionUpdateInput = {
        id: interaction.id,
        type,
        title: title.trim(),
        content: (content || '').trim(),
      };
      
      const response = await fetch('/api/interactions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(interactionData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update interaction (${response.status})`);
      }
      
      const data = await response.json();
      onInteractionUpdated(data.interaction);
      toast({
        title: "Interaction Updated",
        description: "The interaction has been updated successfully",
      });
      onClose();
    } catch (err) {
      const error = err as Error;
      console.error('Failed to update interaction:', error);
      setError(error.message || "Failed to update interaction");
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update interaction",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Interaction</DialogTitle>
            <DialogDescription>
              Update the details of this interaction
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid gap-4 py-4">
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
                placeholder="Brief title"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="content" className="text-right mt-2">
                Content
              </Label>
              <div className="col-span-3 space-y-2">
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full"
                  placeholder="Details of the interaction"
                  rows={5}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Add detailed notes about this interaction
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
