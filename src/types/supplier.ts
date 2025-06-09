/**
 * Type definitions for supplier management system
 */

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  reliabilityScore?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierDocument {
  id: string;
  supplierId: string;
  fileName: string;
  fileType: string; // PDF, Excel, CSV
  documentType: string; // Offer, CoA, Specification, Invoice
  filePath: string;
  uploadDate: Date;
  metadata?: Record<string, any>;
}

export interface SupplierEmail {
  id: string;
  supplierId: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  body: string;
  receivedDate: Date;
  productTags: string[];
  metadata?: Record<string, any>;
}

export interface ProductTag {
  id: string;
  name: string;
  category?: string;
}

export interface SupplierQuery {
  id: string;
  query: string;
  timestamp: string;
  results: SupplierQueryResult[];
  aiResponse: string;
}

export interface SupplierQueryResult {
  id: string;
  supplierId: string;
  relevanceScore: number;
  productMatch?: string;
  supplier: Supplier;
  matchReason?: string;
  productMatches?: string[];
  price?: string;
  documentReferences: string[];
  emailReferences: string[];
  suggestedEmail?: string;
}
