import { v4 as uuidv4 } from 'uuid';
import { FileMetadata, FileMetadataUpdateInput } from './types';
import { isSupabaseConfigured } from '../supabase/client';
import {
  fetchFiles as fetchFilesFromDb,
  fetchFileById as fetchFileByIdFromDb,
  fetchFilesByContactId as fetchFilesByContactIdFromDb,
  uploadFile as uploadFileToDb,
  updateFileMetadata as updateFileMetadataInDb,
  deleteFile as deleteFileFromDb,
  getFileUrl as getFileUrlFromDb,
  ensureFilesTable
} from './supabase';

// Cache files metadata in memory to reduce API calls
let filesCache: FileMetadata[] | null = null;

// Mock data for fallback when Supabase is not configured
const mockFiles: FileMetadata[] = [
  {
    id: '1',
    filename: 'contract-2023.pdf',
    originalName: 'Contract 2023.pdf',
    contentType: 'application/pdf',
    size: 1024000,
    path: 'contacts/1/contract-2023.pdf',
    contact_id: '1',
    description: 'Annual contract renewal',
    tags: ['contract', 'legal'],
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString()
  },
  {
    id: '2',
    filename: 'meeting-notes.docx',
    originalName: 'Meeting Notes.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 256000,
    path: 'contacts/2/meeting-notes.docx',
    contact_id: '2',
    description: 'Notes from quarterly review',
    tags: ['meeting', 'notes'],
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString()
  }
];

// Initialize the files table when the module is loaded
if (typeof window !== 'undefined' && isSupabaseConfigured()) {
  ensureFilesTable().catch(error => {
    console.error('Failed to initialize files table:', error);
  });
}

/**
 * Load all files metadata from Supabase or fallback to mock data
 */
export async function loadFiles(): Promise<FileMetadata[]> {
  // Return cached files if available
  if (filesCache) {
    return filesCache;
  }
  
  // Check if Supabase is configured
  if (isSupabaseConfigured()) {
    try {
      // Fetch files from Supabase
      const files = await fetchFilesFromDb();
      
      // Update cache
      filesCache = files;
      return files;
    } catch (error) {
      console.error('Error loading files from Supabase:', error);
      // Fall back to mock data on error
      filesCache = [...mockFiles];
      return [...mockFiles];
    }
  } else {
    console.warn('Supabase not configured, using mock data for files');
    // Use mock data if Supabase is not configured
    filesCache = [...mockFiles];
    return [...mockFiles];
  }
}

/**
 * Get a file by ID from Supabase or cache
 */
export async function getFileById(id: string): Promise<FileMetadata | null> {
  // Check cache first
  if (filesCache) {
    const cachedFile = filesCache.find(file => file.id === id);
    if (cachedFile) return cachedFile;
  }
  
  // If Supabase is configured, fetch from database
  if (isSupabaseConfigured()) {
    try {
      return await fetchFileByIdFromDb(id);
    } catch (error) {
      console.error(`Error getting file with ID ${id}:`, error);
      return null;
    }
  } else {
    // Fall back to mock data
    return mockFiles.find(file => file.id === id) || null;
  }
}

/**
 * Load files for a specific contact
 */
export async function loadFilesByContactId(contactId: string): Promise<FileMetadata[]> {
  // Check if we have a cache first
  if (filesCache) {
    return filesCache.filter(file => file.contact_id === contactId);
  }
  
  // If Supabase is configured, fetch from database
  if (isSupabaseConfigured()) {
    try {
      const files = await fetchFilesByContactIdFromDb(contactId);
      return files;
    } catch (error) {
      console.error(`Error loading files for contact ${contactId}:`, error);
      // Fall back to mock data
      return mockFiles.filter(file => file.contact_id === contactId);
    }
  } else {
    // Use mock data if Supabase is not configured
    return mockFiles.filter(file => file.contact_id === contactId);
  }
}

/**
 * Upload a file and create metadata
 */
export async function uploadFile(
  file: File,
  contactId?: string,
  description?: string,
  tags?: string[]
): Promise<FileMetadata | null> {
  // If Supabase is configured, upload to storage and database
  if (isSupabaseConfigured()) {
    try {
      const newFile = await uploadFileToDb(file, contactId, description, tags);
      
      // Update cache if file was uploaded successfully
      if (newFile && filesCache) {
        filesCache = [...filesCache, newFile];
      } else if (newFile) {
        filesCache = [newFile];
      }
      
      return newFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  } else {
    // Create mock file metadata for local testing
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const filePath = contactId 
      ? `contacts/${contactId}/${uniqueFilename}` 
      : `general/${uniqueFilename}`;
    
    const newFile: FileMetadata = {
      id: uuidv4(),
      filename: uniqueFilename,
      originalName: file.name,
      contentType: file.type,
      size: file.size,
      path: filePath,
      contact_id: contactId || null,
      description: description || null,
      tags: tags || null,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString()
    };
    
    // Update mock data
    const updatedFiles = filesCache ? [...filesCache, newFile] : [...mockFiles, newFile];
    filesCache = updatedFiles;
    
    return newFile;
  }
}

/**
 * Update file metadata
 */
export async function updateFileMetadata(fileData: FileMetadataUpdateInput): Promise<FileMetadata | null> {
  // If Supabase is configured, update in database
  if (isSupabaseConfigured()) {
    try {
      const updatedFile = await updateFileMetadataInDb(fileData);
      
      // Update cache if file was updated successfully
      if (updatedFile && filesCache) {
        const fileIndex = filesCache.findIndex(f => f.id === fileData.id);
        if (fileIndex !== -1) {
          const updatedFiles = [...filesCache];
          updatedFiles[fileIndex] = updatedFile;
          filesCache = updatedFiles;
        }
      }
      
      return updatedFile;
    } catch (error) {
      console.error(`Error updating file metadata for ID ${fileData.id}:`, error);
      return null;
    }
  } else {
    // Fall back to in-memory storage
    const files = await loadFiles();
    
    // Find file index
    const fileIndex = files.findIndex(f => f.id === fileData.id);
    if (fileIndex === -1) {
      return null;
    }
    
    // Update file
    const updatedFile: FileMetadata = {
      ...files[fileIndex],
      ...fileData,
      updatedat: new Date().toISOString(),
    };
    
    // Replace in files list
    const updatedFiles = [...files];
    updatedFiles[fileIndex] = updatedFile;
    
    // Update cache
    filesCache = updatedFiles;
    
    return updatedFile;
  }
}

/**
 * Delete a file
 */
export async function deleteFile(id: string): Promise<boolean> {
  // If Supabase is configured, delete from storage and database
  if (isSupabaseConfigured()) {
    try {
      const success = await deleteFileFromDb(id);
      
      // Update cache if file was deleted successfully
      if (success && filesCache) {
        const fileIndex = filesCache.findIndex(f => f.id === id);
        if (fileIndex !== -1) {
          const updatedFiles = [...filesCache];
          updatedFiles.splice(fileIndex, 1);
          filesCache = updatedFiles;
        }
      }
      
      return success;
    } catch (error) {
      console.error(`Error deleting file with ID ${id}:`, error);
      return false;
    }
  } else {
    // Fall back to in-memory storage
    const files = await loadFiles();
    
    // Find file index
    const fileIndex = files.findIndex(f => f.id === id);
    if (fileIndex === -1) {
      return false;
    }
    
    // Remove from files list
    const updatedFiles = [...files];
    updatedFiles.splice(fileIndex, 1);
    
    // Update cache
    filesCache = updatedFiles;
    
    return true;
  }
}

/**
 * Get a URL to access a file
 */
export async function getFileUrl(path: string): Promise<string | null> {
  // If Supabase is configured, get a signed URL
  if (isSupabaseConfigured()) {
    try {
      return await getFileUrlFromDb(path);
    } catch (error) {
      console.error(`Error getting URL for file at path ${path}:`, error);
      return null;
    }
  } else {
    // For mock data, return a fake URL
    return `https://mock-storage.example.com/${path}`;
  }
}

/**
 * Check if the files module is using Supabase
 */
export function isUsingSupabase(): boolean {
  return isSupabaseConfigured();
}

/**
 * Clear files cache
 */
export function clearFilesCache(): void {
  filesCache = null;
}
