import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';
import { getUID } from '../../../../lib/auth/utils';

// PUT /api/documents/status - Update document processing status
export async function PUT(request: NextRequest) {
  try {
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { documentId, status, extractedData } = body;
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'processed', 'failed', 'pending_review', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = await createServerClient();
    
    // Get document details to verify ownership
    const { data: document, error: docError } = await supabase
      .from('supplier_documents')
      .select('id, supplier_id, extracted_data')
      .eq('id', documentId)
      .eq('created_by', uid) // Ensure user owns this document
      .single();
    
    if (docError || !document) {
      console.error('Error fetching document:', docError);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Prepare update data
    const updateData: any = {
      processing_status: status,
      reviewed_by: uid,
      reviewed_at: new Date().toISOString()
    };
    
    // If new extracted data is provided, update it
    if (extractedData) {
      updateData.extracted_data = extractedData;
    }
    
    // Update document status
    const { data: updatedDoc, error: updateError } = await supabase
      .from('supplier_documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating document status:', updateError);
      return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
    }
    
    // If status is approved, process the extracted data into products and pricing tables
    if (status === 'approved') {
      try {
        await processApprovedData(supabase, document, uid);
      } catch (error) {
        console.error('Error processing approved data:', error);
        // Don't fail the request, just log the error
        // In a production app, you might want to queue this for retry
      }
    }
    
    return NextResponse.json(updatedDoc);
  } catch (err) {
    console.error('Error in document status update API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Process approved data into products and pricing tables
async function processApprovedData(supabase: any, document: any, userId: string) {
  const extractedData = document.extracted_data;
  
  if (!extractedData || !extractedData.products || !extractedData.pricing) {
    throw new Error('No valid extracted data found');
  }
  
  // Process products
  for (const product of extractedData.products) {
    // Check if product already exists by SKU or name
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id')
      .or(`sku.eq.${product.sku},name.ilike.${product.name}`)
      .eq('user_id', userId);
    
    let productId;
    
    if (existingProducts && existingProducts.length > 0) {
      // Use existing product
      productId = existingProducts[0].id;
      
      // Update product with any new information
      await supabase
        .from('products')
        .update({
          name: product.name,
          sku: product.sku || null,
          description: product.description || null,
          category: product.category || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);
    } else {
      // Create new product
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert({
          user_id: userId,
          name: product.name,
          sku: product.sku || null,
          description: product.description || null,
          category: product.category || null,
          unit: product.unit || 'each'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating product:', error);
        continue;
      }
      
      productId = newProduct.id;
    }
    
    // Process pricing for this product
    const pricing = extractedData.pricing.find((p: any) => p.product_name === product.name);
    
    if (pricing && productId) {
      await supabase
        .from('supplier_pricing')
        .insert({
          user_id: userId,
          supplier_id: document.supplier_id,
          product_id: productId,
          price: pricing.price,
          currency: pricing.currency || 'USD',
          unit_price: pricing.unit_price || true,
          quantity: pricing.quantity || 1,
          unit: pricing.unit || 'each',
          valid_from: pricing.valid_from || null,
          valid_to: pricing.valid_to || null,
          source_document_id: document.id,
          notes: pricing.notes || null,
          metadata: extractedData.metadata || {}
        });
    }
  }
}
