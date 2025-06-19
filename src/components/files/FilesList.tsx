"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { FileMetadata } from '@/lib/files/types';
import FileUploader from './FileUploader';
import { FileIcon, Download, Trash2, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface FilesListProps {
  contactId?: string;
  showUploader?: boolean;
}

export function FilesList({ contactId, showUploader = true }: FilesListProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingFile, setEditingFile] = useState<FileMetadata | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  // Load files
  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = contactId 
        ? `/api/files?contactId=${encodeURIComponent(contactId)}` 
        : '/api/files';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to load files');
      }
      
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
      setError('Failed to load files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load files on component mount
  useEffect(() => {
    loadFiles();
  }, [contactId]);

  // Handle file upload completion
  const handleUploadComplete = (file: FileMetadata) => {
    setFiles(prev => [file, ...prev]);
    setShowUploadDialog(false);
  };

  // Handle file delete
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/files?id=${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      
      // Remove file from state
      setFiles(prev => prev.filter(file => file.id !== fileId));
      
      toast({
        title: 'File deleted',
        description: 'The file has been permanently deleted.',
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle file download
  const handleDownloadFile = async (fileId: string, filename: string) => {
    try {
      // Get the file URL from Supabase Storage
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('path')
        .eq('id', fileId)
        .single();
      
      if (fileError || !fileData) {
        throw new Error('File not found');
      }
      
      // Get the download URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(fileData.path);
      
      // Create a temporary link and trigger the download
      const a = document.createElement('a');
      a.href = publicUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      toast({
        title: 'Download started',
        description: 'Your file download has started.',
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle file metadata update
  const handleUpdateFile = async () => {
    if (!editingFile) return;
    
    try {
      const tagsArray = editTags
        ? editTags.split(',').map(tag => tag.trim())
        : null;
      
      const response = await fetch('/api/files', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingFile.id,
          description: editDescription,
          tags: tagsArray,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update file');
      }
      
      const data = await response.json();
      
      // Update file in state
      setFiles(prev => prev.map(file => 
        file.id === editingFile.id ? data.file : file
      ));
      
      toast({
        title: 'File updated',
        description: 'File details have been updated successfully.',
      });
      
      setEditingFile(null);
    } catch (error) {
      console.error('Error updating file:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (file: FileMetadata) => {
    setEditingFile(file);
    setEditDescription(file.description || '');
    setEditTags(file.tags ? file.tags.join(', ') : '');
  };

  // Filter files by tag
  const filteredFiles = activeTab === 'all' 
    ? files 
    : files.filter(file => file.tags?.includes(activeTab));

  // Get unique tags from all files
  const allTags = Array.from(
    new Set(
      files.flatMap(file => file.tags || [])
    )
  );

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Get file icon
  const getFileIcon = () => {
    return <FileIcon className="h-5 w-5" />;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl">Files</CardTitle>
          {showUploader && (
            <Button onClick={() => setShowUploadDialog(true)}>
              Upload File
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">Loading files...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : (
            <>
              {allTags.length > 0 && (
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="mb-4"
                >
                  <TabsList className="mb-2">
                    <TabsTrigger value="all">All</TabsTrigger>
                    {allTags.map(tag => (
                      <TabsTrigger key={tag} value={tag}>
                        {tag}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
              
              {filteredFiles.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  No files found. Upload a file to get started.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFiles.map(file => (
                    <div 
                      key={file.id}
                      className="border rounded-md p-3 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded">
                          {getFileIcon()}
                        </div>
                        <div>
                          <h4 className="font-medium">{file.original_name}</h4>
                          <div className="flex items-center text-sm text-gray-500 space-x-2">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {file.description && (
                            <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                          )}
                          {file.tags && file.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {file.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(file)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDownloadFile(file.id, file.original_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDeleteFile(file.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <FileUploader 
            contactId={contactId}
            onUploadComplete={handleUploadComplete}
            onUploadError={(error) => {
              toast({
                title: 'Upload failed',
                description: error,
                variant: 'destructive',
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit File Dialog */}
      <Dialog open={!!editingFile} onOpenChange={(open) => !open && setEditingFile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit File Details</DialogTitle>
          </DialogHeader>
          {editingFile && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded">
                  {getFileIcon()}
                </div>
                <div>
                  <h4 className="font-medium">{editingFile.original_name}</h4>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(editingFile.size)}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Enter a description for this file"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  placeholder="contract, legal, important"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingFile(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateFile}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
