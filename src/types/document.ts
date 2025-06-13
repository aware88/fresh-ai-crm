/**
 * Document type definition
 * Represents a document associated with a supplier or other entity
 */
export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: Date;
  size?: number;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}
