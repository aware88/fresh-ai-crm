'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ProfileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setMessage(null);
    } else {
      setFile(null);
      setMessage({ text: 'Please select a valid CSV file', type: 'error' });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ text: 'Please select a file first', type: 'error' });
      return;
    }

    setIsUploading(true);
    setMessage({ text: 'Uploading...', type: 'info' });

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Send the file to the server
      const response = await fetch('/api/upload-profiles', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setMessage({ text: 'Profile data uploaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({ text: 'Failed to upload file. Please try again.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700' :
          message.type === 'error' ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">CSV Format Example:</h3>
        <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto">
          Personality Type,Tone,Message Do,Message Dont,Content Needs,Topic,Description,Tone-out,Personality,Direction,Stance,Expression Type-Do,Style
        </pre>
        <p className="text-xs text-gray-500 mt-2">Paste your complete CSV file with this header structure. The AI will use this data to better analyze emails and provide personalized responses.</p>
      </div>
    </div>
  );
}
