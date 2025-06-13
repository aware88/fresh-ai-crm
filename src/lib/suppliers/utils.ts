/**
 * Utility functions for supplier management
 */
import { Supplier } from '@/types/supplier';

// Define local interfaces to avoid external dependencies
interface Document {
  id: string;
  name: string;
  type: string;
  documentType?: string; // For backward compatibility
  url: string;
  uploadedAt: Date;
  uploadDate?: Date; // Alias for uploadedAt
  size?: number;
  mimeType?: string;
  metadata?: Record<string, unknown>;
  // Add any other document properties used in the codebase
}

interface Email {
  id: string;
  subject: string;
  from: string;
  to: string[];
  date: Date;
  receivedDate?: Date; // Alias for date
  body: string;
  html?: string;
  metadata?: Record<string, unknown>;
  // Add any other email properties used in the codebase
}

/**
 * Format a date for display
 */
export const formatDate = (date: Date | string): string => {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get document type label with emoji
 */
export const getDocumentTypeLabel = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'offer':
      return '💰 Offer';
    case 'coa':
      return '📊 Certificate of Analysis';
    case 'specification':
      return '📋 Specification';
    case 'invoice':
      return '📝 Invoice';
    case 'pricelist':
      return '💲 Price List';
    default:
      return '📄 ' + type;
  }
};

/**
 * Extract product names from text
 * This is a simple implementation that looks for common patterns
 * A more sophisticated version would use NER or other ML techniques
 */
export const extractProductNames = (text: string): string[] => {
  const products: string[] = [];
  
  // Look for patterns like:
  // - Product name: XYZ
  // - XYZ extract 10:1
  // - Organic XYZ
  
  // Pattern 1: "Product name: XYZ" or "Product: XYZ"
  const productLabels = ['product name:', 'product:', 'item:', 'material:'];
  productLabels.forEach(label => {
    const regex = new RegExp(`${label}\\s*([^\\n.,]+)`, 'gi');
    const matches = text.matchAll(regex);
    for (const match of matches) {
      if (match[1] && match[1].trim().length > 2) {
        products.push(match[1].trim());
      }
    }
  });
  
  // Pattern 2: Common supplement ingredients with percentages
  const ingredientPattern = /(organic\s+)?([a-z\s]+)\s+(?:extract|powder|root|leaf|fruit|seed|bark)\s+(\d+(?::\d+)?(?:%)?)/gi;
  const matches = text.matchAll(ingredientPattern);
  for (const match of matches) {
    const organic = match[1] ? match[1].trim() + ' ' : '';
    const name = match[2].trim();
    // Extract strength but don't use it - prefix with underscore to indicate it's intentionally unused
    if (name.length > 2) {
      products.push(`${organic}${name} ${match[3]}`);
    }
  }
  
  // Remove duplicates
  return [...new Set(products)];
};

/**
 * Calculate reliability score based on document history and email responsiveness
 * @param supplier The supplier object
 * @param documents Array of documents from this supplier
 * @param emails Array of emails from this supplier
 * @returns A reliability score between 0-100
 */
export const calculateReliabilityScore = (
  supplier: Supplier,
  documents: Document[],
  emails: Email[]
): number => {
  let score = 50; // Start with neutral score
  
  // Factor 1: Number of documents (more documents = more established relationship)
  const documentCount = documents.length;
  if (documentCount > 10) score += 15;
  else if (documentCount > 5) score += 10;
  else if (documentCount > 0) score += 5;
  
  // Factor 2: Document types (more diverse document types = more comprehensive relationship)
  const documentTypes = new Set(
    documents
      .map(doc => {
        // Handle both documentType and type properties with null checks
        if (doc.documentType) return doc.documentType;
        if (doc.type) return doc.type;
        return null;
      })
      .filter((type): type is string => type !== null) // Filter out null/undefined values
  );
  
  if (documentTypes.size > 3) score += 15;
  else if (documentTypes.size > 1) score += 10;
  else if (documentTypes.size > 0) score += 5;
  
  // Factor 3: Email responsiveness
  const emailCount = emails.length;
  if (emailCount > 10) score += 15;
  else if (emailCount > 5) score += 10;
  else if (emailCount > 0) score += 5;
  
  // Factor 4: Recent activity (documents or emails in the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentDocuments = documents.filter(doc => {
    const uploadDate = doc.uploadDate || doc.uploadedAt;
    return uploadDate && new Date(uploadDate) > thirtyDaysAgo;
  });
  
  const recentEmails = emails.filter(email => {
    const receivedDate = email.receivedDate || email.date;
    return receivedDate && new Date(receivedDate) > thirtyDaysAgo;
  });
  
  if (recentDocuments.length > 0 || recentEmails.length > 0) {
    score += 10;
  }
  
  // Ensure score is between 0-100
  return Math.min(100, Math.max(0, score));
};

/**
 * Format a reliability score with label and color
 */
export const formatReliabilityScore = (score: number): { 
  label: string; 
  color: string;
} => {
  if (score >= 90) {
    return { label: 'Excellent', color: 'green' };
  } else if (score >= 75) {
    return { label: 'Good', color: 'teal' };
  } else if (score >= 60) {
    return { label: 'Satisfactory', color: 'blue' };
  } else if (score >= 40) {
    return { label: 'Neutral', color: 'gray' };
  } else if (score >= 25) {
    return { label: 'Needs Improvement', color: 'orange' };
  } else {
    return { label: 'Poor', color: 'red' };
  }
};

/**
 * Extract email sender information
 */
export const extractEmailSender = (emailContent: string): { 
  email: string; 
  name: string;
} => {
  // Try to extract from common email headers
  const fromRegex = /^From:\s*"?([^"<]+)"?\s*<?([^>]+)>?/im;
  const match = emailContent.match(fromRegex);
  
  if (match) {
    return {
      name: match[1].trim(),
      email: match[2].trim()
    };
  }
  
  try {
    // Try to extract from the first line
    const firstLine = emailContent.split('\n')[0];
    const emailMatch = firstLine.match(/<([^>]+)>/);
    if (emailMatch && emailMatch[1]) {
      return {
        email: emailMatch[1],
        name: firstLine.split('<')[0].trim() || 'Unknown Sender'
      };
    }
  } catch (error) {
    console.error('Error extracting email sender from first line:', error);
  }
  
  // Fallback: just look for any email address
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i;
  const emailMatch = emailContent.match(emailRegex);
  
  if (emailMatch) {
    return {
      email: emailMatch[1],
      name: 'Unknown Sender'
    };
  }
  
  return {
    email: '',
    name: 'Unknown Sender'
  };
};

/**
 * Extract email subject
 */
export const extractEmailSubject = (emailContent: string): string => {
  const subjectRegex = /^Subject:\s*(.+?)$/im;
  const match = emailContent.match(subjectRegex);
  
  return match ? match[1].trim() : 'No Subject';
};

/**
 * Extract email date
 */
export const extractEmailDate = (emailContent: string): Date => {
  const dateRegex = /^Date:\s*(.+?)$/im;
  const match = emailContent.match(dateRegex);
  
  if (match) {
    try {
      return new Date(match[1].trim());
    } catch (error) {
    console.error('Error calculating reliability score:', error);
      return new Date();
    }
  }
  
  return new Date();
};

/**
 * Extract email body (removing headers)
 */
export const extractEmailBody = (emailContent: string): string => {
  // Simple approach: find the first blank line after headers
  const lines = emailContent.split('\n');
  let headerSection = true;
  let body = '';
  
  for (const line of lines) {
    if (headerSection) {
      // Common email headers
      if (line.match(/^(From|To|Subject|Date|Cc|Bcc|Reply-To):/i)) {
        continue;
      }
      
      // If we hit an empty line, we're entering the body
      if (line.trim() === '') {
        headerSection = false;
      }
    } else {
      body += line + '\n';
    }
  }
  
  // If we couldn't extract a body, return the original content
  return body.trim() || emailContent;
};
