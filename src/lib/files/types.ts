/**
 * Types for file management in the CRM
 */

/**
 * File metadata stored in Supabase database
 */
export interface FileMetadata {
  id: string;
  filename: string;
  original_name: string;
  content_type: string;
  size: number;
  path: string;
  contact_id?: string | null; // Optional association with a contact
  description?: string | null;
  tags?: string[] | null;
  created_by?: string; // UUID of the user who created the file
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating a new file metadata record
 */
export interface FileMetadataCreateInput {
  filename: string;
  original_name: string; // Changed from originalName to match database schema
  content_type: string; // Changed from contentType to match database schema
  size: number;
  path: string;
  contact_id?: string | null;
  description?: string | null;
  tags?: string[] | null;
}

/**
 * Legacy interface for backward compatibility
 */
export interface FileMetadataCreateInputLegacy {
  filename: string;
  originalName: string;
  contentType: string;
  size: number;
  path: string;
  contact_id?: string | null;
  description?: string | null;
  tags?: string[] | null;
}

/**
 * Input for updating an existing file metadata record
 */
export interface FileMetadataUpdateInput {
  id: string;
  filename?: string;
  original_name?: string; // Changed from originalName to match database schema
  content_type?: string; // Changed from contentType to match database schema
  size?: number;
  path?: string;
  contact_id?: string | null;
  description?: string | null;
  tags?: string[] | null;
}

/**
 * Legacy interface for backward compatibility
 */
export interface FileMetadataUpdateInputLegacy {
  id: string;
  filename?: string;
  originalName?: string;
  contentType?: string;
  size?: number;
  path?: string;
  contact_id?: string | null;
  description?: string | null;
  tags?: string[] | null;
}

/**
 * Response from file upload
 */
export interface FileUploadResponse {
  success: boolean;
  file?: FileMetadata;
  error?: string;
}

/**
 * File upload progress event
 */
export interface FileUploadProgress {
  filename: string;
  progress: number; // 0-100
}
