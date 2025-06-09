'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface FileStatus {
  exists: boolean;
  lastModified?: string;
  size?: number;
  message: string;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export function ProfileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileStatus, setFileStatus] = useState<FileStatus>({
    exists: false,
    status: 'loading',
    message: 'Checking for existing profile...'
  });
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Check if profile file exists on component mount
  useEffect(() => {
    const checkProfileFile = async () => {
      try {
        const response = await fetch('/api/check-profile');
        const data = await response.json();
        
        if (data.exists) {
          setFileStatus({
            exists: true,
            lastModified: data.lastModified,
            size: data.size,
            status: 'success',
            message: 'Profile file is loaded and ready to use'
          });
        } else {
          setFileStatus({
            exists: false,
            status: 'idle',
            message: 'No profile file found. Please upload a CSV file.'
          });
        }
      } catch (error) {
        console.error('Error checking profile file:', error);
        setFileStatus({
          exists: false,
          status: 'error',
          message: 'Error checking profile file'
        });
      }
    };

    checkProfileFile();
  }, []);

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

  // AI Model and Prompt Information
  const aiModelInfo = {
    model: 'gpt-4o',
    prompt: `You are an advanced AI sales assistant specializing in psychological profiling based on written communication, such as emails or LinkedIn messages.

Your job is to:

1. Analyze the message provided by the user.
2. Determine the sender's psychological profile: tone, values, personality traits, emotional vs. rational, cautious vs. decisive, open vs. reserved.
3. Based on this profile, suggest:
   - The optimal communication/sales approach
   - What to emphasize in future communication
   - What to avoid or be cautious about
4. Write a personalized draft response in the same language as the original message.

[PERSONALITY PROFILES LOADED FROM CSV]

Your output must follow this structure:

**🧠 Psychological Profile:**  
(Summary of the person's tone and mindset)

**🎯 Recommended Approach:**  
(Communication style, what to highlight/avoid)

**✉️ Suggested Response:**  
(Draft response)`
  };

  return (
    <div className="space-y-6">
      {/* Current Profile Status */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Current Profile Status</h3>
        <div className="p-4 border rounded-md bg-gray-50">
          {fileStatus.status === 'loading' && (
            <div className="flex items-center text-sm text-blue-700">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {fileStatus.message}
            </div>
          )}
          {fileStatus.status === 'success' && fileStatus.exists && (
            <div>
              <div className="flex items-center text-sm text-green-700 mb-2">
                <svg className="h-4 w-4 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {fileStatus.message}
              </div>
              <div className="text-xs text-gray-600 space-y-1 mt-2">
                <div>Last modified: {new Date(fileStatus.lastModified || '').toLocaleString()}</div>
                <div>File size: {(fileStatus.size ? fileStatus.size / 1024 : 0).toFixed(2)} KB</div>
              </div>
            </div>
          )}
          {(fileStatus.status === 'idle' || !fileStatus.exists) && fileStatus.status !== 'loading' && (
            <div className="flex items-center text-sm text-yellow-700">
              <svg className="h-4 w-4 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {fileStatus.message}
            </div>
          )}
          {fileStatus.status === 'error' && (
            <div className="flex items-center text-sm text-red-700">
              <svg className="h-4 w-4 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {fileStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* AI Model Information */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">AI Model Information</h3>
        <div className="p-4 border rounded-md bg-blue-50">
          <div className="mb-2">
            <span className="text-sm font-medium">Model: </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-mono rounded">{aiModelInfo.model}</span>
          </div>
          <details className="mt-2">
            <summary className="text-sm font-medium text-blue-700 cursor-pointer">View System Prompt</summary>
            <pre className="mt-2 p-3 bg-white border rounded text-xs overflow-auto max-h-60">
              {aiModelInfo.prompt}
            </pre>
          </details>
        </div>
      </div>

      {/* Upload New Profile */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Upload New Profile</h3>
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
                disabled={isUploading}
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
          Personality_Type,Traits,Sales_Strategy,Messaging_Do,Messaging_Dont,Common_Biases,Trigger,Description,Example,Personality,Objection,Reframe,Framework,Best_For,Style
        </pre>
        <p className="text-xs text-gray-500 mt-2">Your CSV file must include all these column headers exactly as shown above. The AI will use this data to better analyze emails and provide personalized responses.</p>
        <p className="text-xs text-gray-500 mt-2">The first row should be headers, and each subsequent row should contain data for one personality profile.</p>
      </div>
    </div>
  );
}
