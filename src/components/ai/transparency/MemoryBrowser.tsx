/**
 * Memory Browser Component
 * 
 * Allows users to browse, search, and manage AI memories
 */

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { SearchIcon, TrashIcon, PencilIcon } from 'lucide-react';

interface Memory {
  id: string;
  title: string;
  content: string;
  memory_type: string;
  contact_id?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export default function MemoryBrowser() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [memoryTypeFilter, setMemoryTypeFilter] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  
  // Fetch memories on component mount
  useEffect(() => {
    fetchMemories();
  }, []);
  
  // Fetch memories from the API
  const fetchMemories = async (query = '') => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (memoryTypeFilter) params.append('memoryType', memoryTypeFilter);
      
      const response = await fetch(`/api/ai/transparency/memories?${params.toString()}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setMemories(data.memories || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error fetching memories',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search
  const handleSearch = () => {
    fetchMemories(searchQuery);
  };
  
  // Handle memory type filter change
  const handleMemoryTypeChange = (value: string) => {
    setMemoryTypeFilter(value);
    fetchMemories(searchQuery);
  };
  
  // Open edit dialog
  const handleEditClick = (memory: Memory) => {
    setSelectedMemory(memory);
    setEditedContent(memory.content);
    setEditedTitle(memory.title);
    setDialogOpen(true);
  };
  
  // Save edited memory
  const handleSaveEdit = async () => {
    if (!selectedMemory) return;
    
    try {
      const response = await fetch('/api/ai/transparency/memories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedMemory.id,
          content: editedContent,
          title: editedTitle,
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update the memory in the local state
      setMemories(memories.map(m => 
        m.id === selectedMemory.id ? 
          { ...m, content: editedContent, title: editedTitle } : 
          m
      ));
      
      toast({
        title: 'Memory updated',
        description: 'The memory was successfully updated',
        variant: 'default',
      });
      
      setDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error updating memory',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };
  
  // Delete memory
  const handleDeleteMemory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/ai/transparency/memories?id=${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Remove the memory from the local state
      setMemories(memories.filter(m => m.id !== id));
      
      toast({
        title: 'Memory deleted',
        description: 'The memory was successfully removed',
        variant: 'default',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Error deleting memory',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Memory Browser</h1>
      
      {/* Search and filter controls */}
      <div className="flex mb-4 gap-2">
        <Input
          placeholder="Search memories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <select
          value={memoryTypeFilter}
          onChange={(e) => handleMemoryTypeChange(e.target.value)}
          className="w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">All Types</option>
          <option value="conversation">Conversation</option>
          <option value="contact_info">Contact Info</option>
          <option value="sales_tactic">Sales Tactic</option>
          <option value="product_info">Product Info</option>
        </select>
        <Button
          onClick={handleSearch}
          className="flex items-center gap-1"
        >
          <SearchIcon className="h-4 w-4" />
          Search
        </Button>
      </div>
      
      {/* Memory list */}
      {loading ? (
        <div className="flex justify-center p-8">
          <Spinner className="h-8 w-8" />
        </div>
      ) : memories.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg">No memories found</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          {memories.map((memory) => (
            <Card key={memory.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">{memory.title}</h3>
                  <Badge variant="outline" className="bg-blue-100">{memory.memory_type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="py-2">
                <p>{memory.content}</p>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Created: {formatDate(memory.created_at)}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEditClick(memory)}
                    className="h-8 w-8 p-0"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteMemory(memory.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Memory Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Title</h4>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Content</h4>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
