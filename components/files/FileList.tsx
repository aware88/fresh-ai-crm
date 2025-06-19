'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Loader2, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

interface File {
  id: string;
  name: string;
  path: string;
  size: number;
  mime_type: string;
  created_at: string;
}

interface FileListProps {
  contactId: string;
}

export function FileList({ contactId }: FileListProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load files',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contactId) {
      fetchFiles();
    }
  }, [contactId]);

  const handleDownload = async (file: File) => {
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(file.path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      setDeletingId(fileId);
      
      // Get file path first
      const { data: fileData, error: fetchError } = await supabase
        .from('files')
        .select('path')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('files')
        .remove([fileData.path]);

      if (deleteError) throw deleteError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      // Update UI
      setFiles(files.filter(file => file.id !== fileId));
      
      toast({
        title: 'Success',
        description: 'File deleted successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No files uploaded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(file)}
              disabled={deletingId === file.id}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(file.id)}
              disabled={deletingId === file.id}
            >
              {deletingId === file.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
