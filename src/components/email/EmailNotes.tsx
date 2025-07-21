'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, 
  Plus, 
  Lock,
  AlertCircle,
  CheckSquare,
  StickyNote,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface EmailNote {
  id: string;
  user_id: string;
  email_id: string;
  note_content: string;
  note_type: 'note' | 'action' | 'important';
  is_private: boolean;
  created_at: string;
  created_by_name: string;
}

interface EmailNotesProps {
  emailId: string;
  emailSubject?: string;
  emailFrom?: string;
  className?: string;
}

const NOTE_TYPES = {
  note: { label: 'Note', icon: StickyNote, color: 'bg-blue-100 text-blue-800' },
  action: { label: 'Action Item', icon: CheckSquare, color: 'bg-green-100 text-green-800' },
  important: { label: 'Important', icon: AlertCircle, color: 'bg-red-100 text-red-800' }
};

export default function EmailNotes({ 
  emailId, 
  emailSubject, 
  emailFrom,
  className = '' 
}: EmailNotesProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [notes, setNotes] = useState<EmailNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<EmailNote['note_type']>('note');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch notes
  useEffect(() => {
    if (emailId) {
      fetchNotes();
    }
  }, [emailId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/email-notes?emailId=${emailId}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !session?.user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/email-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_id: emailId,
          email_subject: emailSubject,
          email_from: emailFrom,
          note_content: newNote.trim(),
          note_type: noteType,
          is_private: isPrivate,
        }),
      });

      if (response.ok) {
        const newNoteData = await response.json();
        setNotes([newNoteData, ...notes]);
        setNewNote('');
        setNoteType('note');
        setIsPrivate(false);
        setShowAddForm(false);
        toast({
          title: "Success",
          description: "Note added successfully"
        });
      } else {
        throw new Error('Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const response = await fetch(`/api/email-notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotes(notes.filter(note => note.id !== noteId));
        toast({
          title: "Success",
          description: "Note deleted"
        });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive"
      });
    }
  };

  return (
    <div className={`email-notes-container mt-6 ${className}`}>
      <Card className="border-0 shadow-sm">
        <CardHeader 
          className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Team Notes</span>
              {notes.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {notes.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddForm(true);
                  setIsExpanded(true);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Note
              </Button>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            {/* Add Note Form */}
            {showAddForm && (
              <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a note about this email..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Select value={noteType} onValueChange={setNoteType}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(NOTE_TYPES).map(([key, type]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center space-x-2">
                                <type.icon className="h-3 w-3" />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <label className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isPrivate}
                          onChange={(e) => setIsPrivate(e.target.checked)}
                          className="rounded"
                        />
                        <Lock className="h-3 w-3" />
                        <span>Private</span>
                      </label>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setShowAddForm(false);
                          setNewNote('');
                          setNoteType('note');
                          setIsPrivate(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleAddNote} 
                        disabled={!newNote.trim() || isSubmitting}
                      >
                        {isSubmitting ? 'Adding...' : 'Add Note'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading notes...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map(note => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    currentUserId={session?.user?.id}
                    onDelete={deleteNote}
                  />
                ))}

                {notes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No notes yet</p>
                    <p className="text-sm">Add a note to start collaborating on this email</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// Note Card Component
function NoteCard({ note, currentUserId, onDelete }: {
  note: EmailNote;
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  const noteTypeConfig = NOTE_TYPES[note.note_type];
  const IconComponent = noteTypeConfig.icon;
  const isOwner = note.user_id === currentUserId;

  return (
    <div className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <IconComponent className="h-3 w-3" />
            <Badge variant="secondary" className={`text-xs ${noteTypeConfig.color}`}>
              {noteTypeConfig.label}
            </Badge>
            {note.is_private && (
              <Badge variant="outline" className="text-xs">
                <Lock className="h-2 w-2 mr-1" />
                Private
              </Badge>
            )}
          </div>

          <p className="text-sm mb-2">{note.note_content}</p>

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              <span className="font-medium">{note.created_by_name}</span>
              {' • '}
              <span>{formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
            </div>

            {isOwner && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(note.id)}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
