import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../../lib/supabase/server';
import { getUID } from '../../../../../lib/auth/utils';

// POST /api/suppliers/documents/upload - Upload a document and save metadata to supplier_documents
export async function POST(request: NextRequest) {
  try {
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const supplierId = formData.get('supplierId') as string;
    const documentType = formData.get('documentType') as string;
    
    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }
    if (!documentType) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
    }

    // Create Supabase client
    const supabase = createServerClient();
    
    // Determine file type from file extension
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
    let fileType = '';
    
    if (['pdf'].includes(fileExtension)) {
      fileType = 'PDF';
    } else if (['xls', 'xlsx'].includes(fileExtension)) {
      fileType = 'Excel';
    } else if (['csv'].includes(fileExtension)) {
      fileType = 'CSV';
    } else if (['doc', 'docx'].includes(fileExtension)) {
      fileType = 'Word';
    } else if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
      fileType = 'Image';
    } else {
      fileType = 'Other';
    }
    
    // Upload file to Supabase Storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a unique file path
    const timestamp = Date.now();
    const filePath = `supplier-documents/${uid}/${supplierId}/${timestamp}-${fileName}`;
    
    // Upload to storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (storageError) {
      console.error('Error uploading file to storage:', storageError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
    
    // Get the public URL for the file
    const { data: publicUrlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(filePath);
    
    const publicUrl = publicUrlData.publicUrl;
    
    // Create metadata for additional document information
    const metadata = {
      original_name: fileName,
      content_type: file.type,
      size: file.size,
      upload_timestamp: timestamp
    };
    
    // Insert record into supplier_documents table
    const { data: documentData, error: documentError } = await supabase
      .from('supplier_documents')
      .insert({
        supplier_id: supplierId,
        file_name: fileName,
        file_type: fileType,
        document_type: documentType,
        file_path: filePath,
        metadata: metadata,
        created_by: uid,
        processing_status: 'pending' // Initial status for AI processing
      })
      .select()
      .single();
    
    if (documentError) {
      console.error('Error creating document record:', documentError);
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      document: documentData,
      url: publicUrl
    }, { status: 201 });
  } catch (err) {
    console.error('Error in document upload API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
