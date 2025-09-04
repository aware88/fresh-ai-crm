import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../../lib/supabase/server';
import { getSession } from '../../../../../lib/auth/session';
import { validateServiceToken } from '../../../../../lib/auth/serviceToken';
import { buildDocumentProcessingContext } from '../../../../../lib/ai/context-builder';
import crypto from 'crypto';

/**
 * Calculate the overall sentiment from a collection of interactions
 * @param interactions Array of interaction objects with sentiment data
 * @returns A string representing the overall sentiment (positive, negative, neutral, or mixed)
 */
function calculateOverallSentiment(interactions: any[]): string {
  if (!interactions || interactions.length === 0) return 'neutral';
  
  // Count sentiments
  const sentimentCounts = interactions.reduce((counts, interaction) => {
    const sentiment = interaction.sentiment?.toLowerCase() || 'neutral';
    counts[sentiment] = (counts[sentiment] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  // Calculate the dominant sentiment
  const totalInteractions = interactions.length;
  const positiveRatio = (sentimentCounts.positive || 0) / totalInteractions;
  const negativeRatio = (sentimentCounts.negative || 0) / totalInteractions;
  const neutralRatio = (sentimentCounts.neutral || 0) / totalInteractions;
  
  // Determine overall sentiment
  if (positiveRatio > 0.6) return 'positive';
  if (negativeRatio > 0.6) return 'negative';
  if (neutralRatio > 0.6) return 'neutral';
  if (positiveRatio > 0.4 && negativeRatio > 0.4) return 'mixed';
  if (positiveRatio > negativeRatio && positiveRatio > neutralRatio) return 'slightly positive';
  if (negativeRatio > positiveRatio && negativeRatio > neutralRatio) return 'slightly negative';
  return 'neutral';
}

/**
 * Extract common topics from a collection of interactions
 * @param interactions Array of interaction objects with topic data
 * @returns An array of the most common topics
 */
function extractCommonTopics(interactions: any[]): string[] {
  if (!interactions || interactions.length === 0) return [];
  
  // Collect all topics from all interactions
  const allTopics: string[] = [];
  interactions.forEach(interaction => {
    if (interaction.topics && Array.isArray(interaction.topics)) {
      allTopics.push(...interaction.topics);
    }
  });
  
  // Count topic occurrences
  const topicCounts = allTopics.reduce((counts, topic) => {
    counts[topic] = (counts[topic] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  // Sort topics by frequency and take the top 5
  return Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
}

// Define types for processing metadata
type ProcessingMetadata = {
  processingDate: string;
  processingContext: {
    supplierInfo: {
      name: string;
      reliabilityScore: number;
      documentCount: number;
    } | null;
    emailContextAvailable: boolean;
    emailCount: number;
    contactsAvailable: boolean;
    contactCount: number;
    interactionsAvailable: boolean;
    interactionCount: number;
    processingInstructions: any;
    interactionHistory?: {
      recentInteractions: Array<{
        type: string;
        date: string;
        summary: string | null;
        sentiment: string | null;
      }>;
      overallSentiment: string;
      commonTopics: string[];
    };
  };
};

// POST /api/suppliers/documents/process - Process a document with AI
export async function POST(request: NextRequest) {
  try {
    // Check for service token for automated processing
    const serviceToken = request.headers.get('X-Service-Token');
    // Get user ID from session or service token
    let uid: string | null = null;
    let isServiceRequest = false;
    
    // Check if this is a service-to-service call with a service token
    if (serviceToken) {
      if (validateServiceToken(serviceToken)) {
        // Service token is valid, allow the operation
        uid = 'service';
        isServiceRequest = true;
      } else {
        return NextResponse.json({ error: 'Invalid service token' }, { status: 401 });
      }
    } else {
      // Get user ID from session for manual processing
      const session = await getSession();
      uid = session?.user?.id || null;
      if (!uid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Get the document ID and status from the request body
    const { documentId, status, extractedData } = await request.json();

    // Validate required fields
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    // Get comprehensive context for AI processing
    const processingContext = await buildDocumentProcessingContext(documentId);
    
    // If we couldn't get the context, continue with basic processing
    // but log the issue for debugging
    if (!processingContext.document) {
      console.warn('Could not build comprehensive context for document:', documentId);
    }

    // Create Supabase client
    const supabase = await createServerClient();
    
    // Get the document to verify ownership (skip check for service requests)
    if (!isServiceRequest && uid) {
      const { data: document, error: fetchError } = await supabase
        .from('supplier_documents')
        .select('id, created_by')
        .eq('id', documentId)
        .single();
      
      if (fetchError || !document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      
      // Verify ownership
      if (document.created_by !== uid) {
        return NextResponse.json({ error: 'Unauthorized access to document' }, { status: 403 });
      }
    }
    
    // Use context to enhance processing metadata
    const processingMetadata = {
      processingDate: new Date().toISOString(),
      processingContext: {
        supplierInfo: processingContext.supplierContext ? {
          name: processingContext.supplierContext.name,
          reliabilityScore: processingContext.supplierContext.reliabilityScore,
          documentCount: processingContext.supplierContext.documentCount,
        } : null,
        emailContextAvailable: !!processingContext.emailContext,
        emailCount: processingContext.emailContext?.length || 0,
        contactsAvailable: !!processingContext.contactContext,
        contactCount: processingContext.contactContext?.length || 0,
        interactionsAvailable: !!processingContext.interactionContext,
        interactionCount: processingContext.interactionContext?.length || 0,
        processingInstructions: processingContext.processingInstructions
      }
    };
    
    // Add interaction history summary if available
    if (processingContext.interactionContext && processingContext.interactionContext.length > 0) {
      (processingMetadata.processingContext as any).interactionHistory = {
        recentInteractions: processingContext.interactionContext
          .slice(0, 3)
          .map(interaction => ({
            type: interaction.interactionType,
            date: interaction.interactionDate,
            summary: interaction.content,
            sentiment: interaction.sentiment
          })),
        overallSentiment: calculateOverallSentiment(processingContext.interactionContext),
        commonTopics: extractCommonTopics(processingContext.interactionContext)
      };
    }

    // Update the document with the new status and extracted data
    const updateData = {
      processing_status: status,
      extracted_data: extractedData || {},
      processing_metadata: processingMetadata as any,
      processed_at: new Date().toISOString(),
    };

    // Update the document in the database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('supplier_documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating document processing status:', updateError);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      document: updatedDocument
    });
  } catch (err) {
    console.error('Error in document processing API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/suppliers/documents/process - Review a processed document
export async function PUT(request: NextRequest) {
  try {
    // Get user ID from session
    const session = await getSession();
    const uid = session?.user?.id;
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { documentId, approved } = body;
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    if (approved === undefined) {
      return NextResponse.json({ error: 'Approval status is required' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = await createServerClient();
    
    // Get the document to verify it's in pending_review status
    const { data: document, error: fetchError } = await supabase
      .from('supplier_documents')
      .select('id, processing_status, created_by')
      .eq('id', documentId)
      .single();
    
    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (document.created_by !== uid) {
      return NextResponse.json({ error: 'Unauthorized access to document' }, { status: 403 });
    }
    
    // Verify document is in pending_review status
    if (document.processing_status !== 'pending_review') {
      return NextResponse.json({ 
        error: 'Document is not pending review',
        status: document.processing_status
      }, { status: 400 });
    }
    
    // Update the document with review results
    const updateData = {
      processing_status: approved ? 'approved' : 'rejected',
      reviewed_by: uid,
      reviewed_at: new Date().toISOString()
    };
    
    // Update the document in the database
    const { data: updatedDocument, error: updateError } = await supabase
      .from('supplier_documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating document review status:', updateError);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      document: updatedDocument
    });
  } catch (err) {
    console.error('Error in document review API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/suppliers/documents/process - Get documents pending review
export async function GET(request: NextRequest) {
  try {
    // Get user ID from session
    const session = await getSession();
    const uid = session?.user?.id;
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client
    const supabase = await createServerClient();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending_review';
    const supplierId = searchParams.get('supplierId');
    
    // Build query
    let query = supabase
      .from('supplier_documents')
      .select(`
        *,
        suppliers:supplier_id (*),
        reviewed_by_user:reviewed_by (email, id)
      `)
      .eq('processing_status', status);
    
    // Add supplier filter if provided
    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }
    
    // Execute query
    const { data: documents, error } = await query;
    
    if (error) {
      console.error('Error fetching documents for review:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
    
    return NextResponse.json(documents);
  } catch (err) {
    console.error('Error in document review API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
