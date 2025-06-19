'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Interaction } from '@/lib/interactions/types';
import { formatDate } from '@/lib/utils';
import { Mail, Phone, Calendar, FileText, MessageSquare, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ViewInteractionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: Interaction;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  deleteError?: string | null;
}

export default function ViewInteractionDialog({
  isOpen,
  onClose,
  interaction,
  onEdit,
  onDelete,
  isDeleting = false,
  deleteError = null
}: ViewInteractionDialogProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Get icon for interaction type
  const getInteractionIcon = () => {
    switch (interaction.type) {
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'call':
        return <Phone className="h-5 w-5" />;
      case 'meeting':
        return <Calendar className="h-5 w-5" />;
      case 'note':
        return <FileText className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };
  
  // Get color for interaction type badge
  const getInteractionColor = () => {
    switch (interaction.type) {
      case 'email':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case 'call':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case 'meeting':
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case 'note':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };
  
  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    
    onDelete();
  };
  
  const handleCancelDelete = () => {
    setConfirmDelete(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {getInteractionIcon()}
            <DialogTitle>{interaction.title}</DialogTitle>
          </div>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getInteractionColor()}>
                {interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDate(interaction.interaction_date)}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        {deleteError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}
        
        <div className="py-4">
          {interaction.subject && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Subject</h3>
              <p>{interaction.subject}</p>
            </div>
          )}
          
          <div className="mb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Content</h3>
            <Card>
              <CardContent className="p-4 whitespace-pre-wrap">
                {interaction.content || <span className="text-muted-foreground italic">No content</span>}
              </CardContent>
            </Card>
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>Created: {formatDate(interaction.created_at)}</p>
            {interaction.updated_at !== interaction.created_at && (
              <p>Last updated: {formatDate(interaction.updated_at)}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          {confirmDelete ? (
            <>
              <span className="text-sm text-red-500 mr-auto">Are you sure?</span>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span className="mr-2">Deleting...</span>
                    <span className="animate-spin">⏳</span>
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </Button>
            </>
          ) : (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isDeleting}
              >
                Close
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onEdit}
                disabled={isDeleting}
                className="gap-1"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
                className="gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
