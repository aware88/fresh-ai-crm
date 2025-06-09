'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ProfileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Accept any file type but check extension
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'csv') {
        setFile(selectedFile);
        setMessage({ text: `File selected: ${selectedFile.name}`, type: 'info' });
      } else {
        setFile(null);
        setMessage({ text: 'Please select a CSV file (.csv extension)', type: 'error' });
      }
    } else {
      setFile(null);
      setMessage(null);
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

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setMessage({ text: 'Profile data uploaded successfully! The AI will now use these personality profiles for analysis.', type: 'success' });
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file. Please try again.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <div className="flex flex-col space-y-4">
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
              className="whitespace-nowrap"
            >
              {isUploading ? 'Uploading...' : 'Upload CSV'}
            </Button>
          </div>
          
          {file && (
            <div className="text-sm text-gray-600 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <div className="flex">
            {message.type === 'success' && (
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {message.type === 'error' && (
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {message.type === 'info' && (
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-white border rounded-lg">
        <h3 className="text-sm font-medium mb-2">CSV Format Requirements:</h3>
        <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto">
          Personality Type,Tone,Message Do,Message Dont,Content Needs,Topic,Description,Tone-out,Personality,Direction,Stance,Expression Type-Do,Style
        </pre>
        <p className="text-xs text-gray-500 mt-2">Your CSV file must include all these column headers exactly as shown above. The AI will use this data to better analyze emails and provide personalized responses.</p>
      </div>
    </div>
  );
}
