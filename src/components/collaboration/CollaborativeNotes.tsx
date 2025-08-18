'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTeamCollaboration } from './TeamCollaborationProvider';
import { 
  StickyNote, 
  Plus, 
  Save, 
  X,
  Clock,
  User,
  Edit3,
  Trash2,
  MessageCircle,
  AtSign,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  MoreHorizontal,
  Reply,
  Heart,
  ThumbsUp
} from 'lucide-react';

interface CollaborativeNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  createdByName: string;
  createdByAvatar?: string;
  type: 'general' | 'support' | 'sales' | 'billing' | 'internal';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isPrivate: boolean;
  isPinned: boolean;
  mentions: string[];
  reactions: { userId: string; type: 'like' | 'love' | 'thumbs_up'; userName: string }[];
  replies: CollaborativeNoteReply[];
  tags: string[];
  assignedTo?: string;
  assignedToName?: string;
  status: 'active' | 'resolved' | 'archived';
}

interface CollaborativeNoteReply {
  id: string;
  content: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  createdByAvatar?: string;
}

interface CollaborativeNotesProps {
  customerEmail: string;
  className?: string;
}

export default function CollaborativeNotes({ customerEmail, className }: CollaborativeNotesProps) {
  const { teamMembers, currentUser, addActivity } = useTeamCollaboration();
  const [notes, setNotes] = useState<CollaborativeNote[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<CollaborativeNote['type']>('general');
  const [notePriority, setNotePriority] = useState<CollaborativeNote['priority']>('medium');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'my' | 'assigned' | 'pinned'>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const availableTags = ['urgent', 'follow-up', 'vip-customer', 'technical', 'billing-issue', 'upsell-opportunity'];

  // Mock data for demo
  useEffect(() => {
    const mockNotes: CollaborativeNote[] = [
      {
        id: '1',
        content: 'Customer prefers email communication over phone calls. Very responsive to promotional offers. @Emma Davis please follow up on the upsell opportunity mentioned in their last email.',
        createdAt: '2024-01-15T10:30:00Z',
        createdBy: '1',
        createdByName: 'Sarah Johnson',
        createdByAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
        type: 'sales',
        priority: 'high',
        isPrivate: false,
        isPinned: true,
        mentions: ['3'],
        reactions: [
          { userId: '2', type: 'thumbs_up', userName: 'Mike Chen' },
          { userId: '3', type: 'like', userName: 'Emma Davis' }
        ],
        replies: [
          {
            id: 'r1',
            content: 'Thanks for the heads up! I\'ll reach out to them this afternoon.',
            createdAt: '2024-01-15T11:00:00Z',
            createdBy: '3',
            createdByName: 'Emma Davis',
            createdByAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face'
          }
        ],
        tags: ['upsell-opportunity', 'vip-customer'],
        assignedTo: '3',
        assignedToName: 'Emma Davis',
        status: 'active'
      },
      {
        id: '2',
        content: 'Had shipping issue with order #12344, resolved with expedited replacement. Customer was very understanding and appreciative of our quick response.',
        createdAt: '2024-01-10T14:20:00Z',
        createdBy: '2',
        createdByName: 'Mike Chen',
        createdByAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
        type: 'support',
        priority: 'medium',
        isPrivate: false,
        isPinned: false,
        mentions: [],
        reactions: [],
        replies: [],
        tags: ['follow-up'],
        status: 'resolved'
      }
    ];
    setNotes(mockNotes);
  }, [customerEmail]);

  const handleSaveNote = async () => {
    if (!newNote.trim() || !currentUser) return;

    setLoading(true);
    try {
      const mentions = extractMentions(newNote);
      const note: CollaborativeNote = {
        id: Date.now().toString(),
        content: newNote.trim(),
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        createdByAvatar: currentUser.avatar,
        type: noteType,
        priority: notePriority,
        isPrivate,
        isPinned: false,
        mentions,
        reactions: [],
        replies: [],
        tags: selectedTags,
        assignedTo: assignedTo || undefined,
        assignedToName: assignedTo ? teamMembers.find(m => m.id === assignedTo)?.name : undefined,
        status: 'active'
      };

      setNotes(prev => [note, ...prev]);
      
      // Add activity
      addActivity({
        type: 'note_added',
        userId: currentUser.id,
        userName: currentUser.name,
        customerEmail,
        content: `Added ${noteType} note${assignedTo ? ` and assigned to ${note.assignedToName}` : ''}`,
        metadata: { noteId: note.id, type: noteType, priority: notePriority }
      });

      // Reset form
      setNewNote('');
      setIsAddingNote(false);
      setSelectedTags([]);
      setAssignedTo('');
      setIsPrivate(false);
      setNotePriority('medium');
      setNoteType('general');
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractMentions = (content: string): string[] => {
    const mentionRegex = /@(\w+\s+\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedName = match[1];
      const member = teamMembers.find(m => m.name.toLowerCase() === mentionedName.toLowerCase());
      if (member) {
        mentions.push(member.id);
      }
    }
    
    return mentions;
  };

  const handleReaction = (noteId: string, reactionType: 'like' | 'love' | 'thumbs_up') => {
    if (!currentUser) return;

    setNotes(prev => prev.map(note => {
      if (note.id === noteId) {
        const existingReaction = note.reactions.find(r => r.userId === currentUser.id);
        let newReactions;
        
        if (existingReaction) {
          if (existingReaction.type === reactionType) {
            // Remove reaction
            newReactions = note.reactions.filter(r => r.userId !== currentUser.id);
          } else {
            // Change reaction type
            newReactions = note.reactions.map(r => 
              r.userId === currentUser.id 
                ? { ...r, type: reactionType }
                : r
            );
          }
        } else {
          // Add new reaction
          newReactions = [...note.reactions, {
            userId: currentUser.id,
            type: reactionType,
            userName: currentUser.name
          }];
        }
        
        return { ...note, reactions: newReactions };
      }
      return note;
    }));
  };

  const handleReply = (noteId: string) => {
    if (!replyContent.trim() || !currentUser) return;

    const reply: CollaborativeNoteReply = {
      id: Date.now().toString(),
      content: replyContent.trim(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdByAvatar: currentUser.avatar
    };

    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, replies: [...note.replies, reply] }
        : note
    ));

    setReplyContent('');
    setReplyingTo(null);
  };

  const togglePin = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, isPinned: !note.isPinned }
        : note
    ));
  };

  const filteredNotes = notes.filter(note => {
    if (!showResolved && note.status === 'resolved') return false;
    
    switch (filter) {
      case 'my':
        return note.createdBy === currentUser?.id;
      case 'assigned':
        return note.assignedTo === currentUser?.id;
      case 'pinned':
        return note.isPinned;
      default:
        return true;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: CollaborativeNote['type']) => {
    switch (type) {
      case 'support': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sales': return 'bg-green-100 text-green-800 border-green-200';
      case 'billing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'internal': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: CollaborativeNote['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <TooltipProvider>
      <Card className={`border-purple-200 bg-purple-50 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center space-x-2">
              <StickyNote className="h-4 w-4 text-purple-600" />
              <span className="text-purple-800">Team Notes</span>
              <Badge variant="secondary" className="text-xs">
                {filteredNotes.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              {/* Filter buttons */}
              <div className="flex space-x-1">
                {(['all', 'my', 'assigned', 'pinned'] as const).map((filterType) => (
                  <Button
                    key={filterType}
                    variant={filter === filterType ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter(filterType)}
                    className="h-6 px-2 text-xs capitalize"
                  >
                    {filterType}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResolved(!showResolved)}
                className="h-6 px-2"
                title={showResolved ? 'Hide resolved' : 'Show resolved'}
              >
                {showResolved ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingNote(!isAddingNote)}
                className="h-6 px-2 hover:bg-purple-100"
              >
                {isAddingNote ? (
                  <X className="h-3 w-3 text-purple-600" />
                ) : (
                  <Plus className="h-3 w-3 text-purple-600" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Add New Note */}
          {isAddingNote && (
            <div className="bg-white p-4 rounded-lg border border-purple-200 space-y-4">
              {/* Note type and priority */}
              <div className="flex space-x-2">
                <div className="flex space-x-1">
                  {(['general', 'support', 'sales', 'billing', 'internal'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={noteType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNoteType(type)}
                      className="text-xs capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <div className="flex space-x-1">
                  {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                    <Button
                      key={priority}
                      variant={notePriority === priority ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNotePriority(priority)}
                      className={`text-xs capitalize ${getPriorityColor(priority)}`}
                    >
                      {priority}
                    </Button>
                  ))}
                </div>
              </div>

              <Textarea
                ref={textareaRef}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this customer... Use @Name to mention team members"
                className="text-sm"
                rows={4}
              />

              {/* Tags and assignment */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {availableTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                      className="text-xs h-6"
                    >
                      #{tag}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="text-xs border rounded px-2 py-1"
                  >
                    <option value="">Assign to...</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                  
                  <label className="flex items-center space-x-1 text-xs">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-3 h-3"
                    />
                    <span>Private</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleSaveNote}
                  disabled={!newNote.trim() || loading}
                  size="sm"
                  className="flex-1"
                >
                  <Save className="h-3 w-3 mr-1" />
                  {loading ? 'Saving...' : 'Save Note'}
                </Button>
                <Button
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNote('');
                    setSelectedTags([]);
                    setAssignedTo('');
                    setIsPrivate(false);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Existing Notes */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-500">
                {filter === 'all' ? 'No notes yet. Add one to start collaborating.' : `No ${filter} notes found.`}
              </div>
            ) : (
              filteredNotes.map((note) => (
                <div key={note.id} className={`bg-white p-4 rounded-lg border ${note.isPinned ? 'border-yellow-300 bg-yellow-50' : 'border-purple-100'}`}>
                  {/* Note header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={note.createdByAvatar} />
                        <AvatarFallback className="text-xs">
                          {note.createdByName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{note.createdByName}</span>
                        <Badge className={getTypeColor(note.type)}>
                          {note.type}
                        </Badge>
                        <Badge className={getPriorityColor(note.priority)}>
                          {note.priority}
                        </Badge>
                        {note.isPrivate && (
                          <Badge variant="outline" className="text-xs">
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePin(note.id)}
                            className="h-6 w-6 p-0"
                          >
                            {note.isPinned ? (
                              <PinOff className="h-3 w-3 text-yellow-600" />
                            ) : (
                              <Pin className="h-3 w-3" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {note.isPinned ? 'Unpin note' : 'Pin note'}
                        </TooltipContent>
                      </Tooltip>
                      <div className="text-xs text-gray-500 flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Note content */}
                  <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{note.content}</p>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Assignment */}
                  {note.assignedTo && (
                    <div className="flex items-center space-x-1 text-xs text-gray-600 mb-3">
                      <User className="h-3 w-3" />
                      <span>Assigned to {note.assignedToName}</span>
                    </div>
                  )}

                  {/* Reactions */}
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReaction(note.id, 'thumbs_up')}
                        className="h-6 px-2 text-xs"
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        {note.reactions.filter(r => r.type === 'thumbs_up').length || ''}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReaction(note.id, 'like')}
                        className="h-6 px-2 text-xs"
                      >
                        👍 {note.reactions.filter(r => r.type === 'like').length || ''}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReaction(note.id, 'love')}
                        className="h-6 px-2 text-xs"
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        {note.reactions.filter(r => r.type === 'love').length || ''}
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === note.id ? null : note.id)}
                      className="h-6 px-2 text-xs"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply {note.replies.length > 0 && `(${note.replies.length})`}
                    </Button>
                  </div>

                  {/* Replies */}
                  {note.replies.length > 0 && (
                    <div className="space-y-2 ml-4 border-l-2 border-gray-200 pl-4">
                      {note.replies.map((reply) => (
                        <div key={reply.id} className="bg-gray-50 p-2 rounded text-xs">
                          <div className="flex items-center space-x-2 mb-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={reply.createdByAvatar} />
                              <AvatarFallback className="text-xs">
                                {reply.createdByName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{reply.createdByName}</span>
                            <span className="text-gray-500">{formatDate(reply.createdAt)}</span>
                          </div>
                          <p className="text-gray-700">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply input */}
                  {replyingTo === note.id && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write a reply..."
                        className="text-sm"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleReply(note.id)}
                          disabled={!replyContent.trim()}
                          size="sm"
                        >
                          Reply
                        </Button>
                        <Button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}