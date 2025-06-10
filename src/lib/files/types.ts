/**
 * Types for file management in the CRM
 */

/**
 * File metadata stored in Supabase database
 */
export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  contentType: string;
  size: number;
  path: string;
  contact_id?: string | null; // Optional association with a contact
  description?: string | null;
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a new file metadata record
 */
export interface FileMetadataCreateInput {
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
