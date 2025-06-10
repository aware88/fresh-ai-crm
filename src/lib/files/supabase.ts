import { v4 as uuidv4 } from 'uuid';
import { createSupabaseClient } from '../supabase/client';
import { FileMetadata, FileMetadataCreateInput, FileMetadataUpdateInput } from './types';

// Constants
const FILES_TABLE = 'files';
const STORAGE_BUCKET = 'crm-files';

/**
 * Ensure the files table exists in Supabase
 */
export async function ensureFilesTable(): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    
    // Check if the table exists by querying it
    const { error } = await supabase
      .from(FILES_TABLE)
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.error('Files table does not exist. Please run the SQL script to create it.');
      return false;
    }
    
    // Ensure storage bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('Error checking storage buckets:', bucketsError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { error: createBucketError } = await supabase
        .storage
        .createBucket(STORAGE_BUCKET, {
          public: false, // Files are not publicly accessible by default
          fileSizeLimit: 10485760, // 10MB limit
        });
      
      if (createBucketError) {
        console.error('Error creating storage bucket:', createBucketError);
        return false;
      }
      
      console.log(`Created storage bucket: ${STORAGE_BUCKET}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring files table and storage bucket:', error);
    return false;
  }
}

/**
 * Fetch all file metadata from Supabase
 */
export async function fetchFiles(): Promise<FileMetadata[]> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from(FILES_TABLE)
      .select('*')
      .order('createdat', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data as FileMetadata[];
  } catch (error) {
    console.error('Error fetching files:', error);
    return [];
  }
}

/**
 * Fetch file metadata by ID from Supabase
 */
export async function fetchFileById(id: string): Promise<FileMetadata | null> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from(FILES_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as FileMetadata;
  } catch (error) {
    console.error(`Error fetching file with ID ${id}:`, error);
    return null;
  }
}

/**
 * Fetch files associated with a specific contact
 */
export async function fetchFilesByContactId(contactId: string): Promise<FileMetadata[]> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from(FILES_TABLE)
      .select('*')
      .eq('contact_id', contactId)
      .order('createdat', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data as FileMetadata[];
  } catch (error) {
    console.error(`Error fetching files for contact ${contactId}:`, error);
    return [];
  }
}

/**
 * Upload a file to Supabase Storage and create metadata record
 */
export async function uploadFile(
  file: File,
  contactId?: string,
  description?: string,
  tags?: string[]
): Promise<FileMetadata | null> {
  try {
    const supabase = createSupabaseClient();
    
    // Generate a unique filename to prevent collisions
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;
    const filePath = contactId 
      ? `contacts/${contactId}/${uniqueFilename}` 
      : `general/${uniqueFilename}`;
    
    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file);
    
    if (uploadError) {
      throw uploadError;
    }
    
    // Create metadata record in the database
    const fileMetadata: FileMetadataCreateInput = {
      filename: uniqueFilename,
      originalName: file.name,
      contentType: file.type,
      size: file.size,
      path: filePath,
      contact_id: contactId || null,
      description: description || null,
      tags: tags || null
    };
    
    const { data: metadataData, error: metadataError } = await supabase
      .from(FILES_TABLE)
      .insert([{
        ...fileMetadata,
        id: uuidv4(),
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (metadataError) {
      // If metadata creation fails, delete the uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
      throw metadataError;
    }
    
    return metadataData as FileMetadata;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

/**
 * Update file metadata in Supabase
 */
export async function updateFileMetadata(fileData: FileMetadataUpdateInput): Promise<FileMetadata | null> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .from(FILES_TABLE)
      .update({
        ...fileData,
        updatedat: new Date().toISOString()
      })
      .eq('id', fileData.id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data as FileMetadata;
  } catch (error) {
    console.error(`Error updating file metadata for ID ${fileData.id}:`, error);
    return null;
  }
}

/**
 * Delete file from Supabase Storage and remove metadata
 */
export async function deleteFile(id: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    
    // First, get the file path from metadata
    const { data: fileData, error: fetchError } = await supabase
      .from(FILES_TABLE)
      .select('path')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (!fileData) {
      throw new Error(`File with ID ${id} not found`);
    }
    
    // Delete the file from storage
    const { error: storageError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .remove([fileData.path]);
    
    if (storageError) {
      throw storageError;
    }
    
    // Delete the metadata record
    const { error: deleteError } = await supabase
      .from(FILES_TABLE)
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      throw deleteError;
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting file with ID ${id}:`, error);
    return false;
  }
}

/**
 * Get a temporary URL for a file
 */
export async function getFileUrl(path: string): Promise<string | null> {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, 60 * 60); // 1 hour expiry
    
    if (error) {
      throw error;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error(`Error getting signed URL for file at path ${path}:`, error);
    return null;
  }
}
