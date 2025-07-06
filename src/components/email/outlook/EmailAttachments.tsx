'use client';

import { useState } from 'react';
import { Paperclip, X, Download, File, Image, FileText, FileArchive } from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentId?: string;
  isInline?: boolean;
  url?: string;
}

interface EmailAttachmentsProps {
  attachments: Attachment[];
  messageId: string;
  readOnly?: boolean;
  onAttachmentAdd?: (files: File[]) => void;
  onAttachmentRemove?: (attachmentId: string) => void;
}

export default function EmailAttachments({
  attachments = [],
  messageId,
  readOnly = false,
  onAttachmentAdd,
  onAttachmentRemove,
}: EmailAttachmentsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get icon based on file type
  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (contentType.startsWith('text/')) {
      return <FileText className="h-5 w-5 text-green-500" />;
    } else if (
      contentType === 'application/zip' ||
      contentType === 'application/x-rar-compressed' ||
      contentType === 'application/x-7z-compressed'
    ) {
      return <FileArchive className="h-5 w-5 text-amber-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (readOnly || !onAttachmentAdd) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onAttachmentAdd(files);
      simulateUpload(files);
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || !onAttachmentAdd || !e.target.files?.length) return;
    
    const files = Array.from(e.target.files);
    onAttachmentAdd(files);
    simulateUpload(files);
    
    // Reset the input
    e.target.value = '';
  };

  // Simulate file upload progress
  const simulateUpload = (files: File[]) => {
    const newProgress: Record<string, number> = {};
    
    files.forEach(file => {
      const fileId = `upload-${Date.now()}-${file.name}`;
      newProgress[fileId] = 0;
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[fileId] || 0;
          const next = Math.min(current + 10, 100);
          
          if (next === 100) {
            clearInterval(interval);
          }
          
          return { ...prev, [fileId]: next };
        });
      }, 200);
    });
    
    setUploadProgress(newProgress);
  };

  // Handle download
  const handleDownload = (attachment: Attachment) => {
    // In a real implementation, this would download the file
    // For now, we'll just log it
    console.log(`Downloading attachment: ${attachment.name}`);
    
    // If we have a URL, we can simulate a download
    if (attachment.url) {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="email-attachments">
      {attachments.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Attachments ({attachments.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attachments.map(attachment => (
              <div 
                key={attachment.id}
                className="flex items-center p-2 border rounded-lg bg-gray-50 group"
              >
                <div className="mr-2">
                  {getFileIcon(attachment.contentType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleDownload(attachment)}
                    className="p-1 text-gray-500 hover:text-blue-500 rounded-full hover:bg-blue-50"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  {!readOnly && onAttachmentRemove && (
                    <button
                      onClick={() => onAttachmentRemove(attachment.id)}
                      className="p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50"
                      title="Remove"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Upload progress indicators */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mb-4 space-y-2">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="text-sm">
              <div className="flex justify-between mb-1">
                <span>{fileId.split('-').slice(2).join('-')}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* File drop zone (only show in edit mode) */}
      {!readOnly && onAttachmentAdd && (
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <Paperclip className="h-6 w-6 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            Drag and drop files here, or
            <label className="ml-1 text-blue-500 cursor-pointer hover:text-blue-700">
              browse
              <input
                type="file"
                className="hidden"
                multiple
                onChange={handleFileSelect}
              />
            </label>
          </p>
          <p className="text-xs text-gray-400 mt-1">Max file size: 25MB</p>
        </div>
      )}
    </div>
  );
}
