import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';
import { getUID } from '../../../../lib/auth/utils';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Define allowed file types
const allowedFileTypes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
const fileTypeExtensions = {
  'application/pdf': 'pdf',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/csv': 'csv'
};

// Get all documents for a supplier
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    
    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }
    
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client
    const supabase = await createServerClient();
    
    // Fetch documents from Supabase
    const { data: documents, error } = await supabase
      .from('supplier_documents')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('created_by', uid);
    
    if (error) {
      console.error('Error fetching supplier documents from Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to fetch supplier documents' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching supplier documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier documents' },
      { status: 500 }
    );
  }
}

// Upload a document for a supplier
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const supplierId = formData.get('supplierId') as string;
    const documentType = formData.get('documentType') as string;
    const file = formData.get('file') as File;
    
    if (!supplierId || !documentType || !file) {
      return NextResponse.json(
        { error: 'Supplier ID, document type, and file are required' },
        { status: 400 }
      );
    }
    
    // Check if file type is allowed
    if (!allowedFileTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Allowed types: PDF, Excel, CSV' },
        { status: 400 }
      );
    }
    
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client
    const supabase = await createServerClient();
    
    // Check if supplier exists and belongs to the user
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', supplierId)
      .eq('user_id', uid)
      .single();
    
    if (supplierError) {
      console.error('Error checking supplier existence:', supplierError);
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    // Create directory for supplier documents if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'src/data/uploads/suppliers', supplierId);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Generate a unique filename
    const fileExtension = fileTypeExtensions[file.type as keyof typeof fileTypeExtensions] || 'unknown';
    const fileName = `${documentType.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Save file to disk
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, fileBuffer);
    
    // Save document metadata to Supabase
    const { data: document, error: insertError } = await supabase
      .from('supplier_documents')
      .insert({
        supplier_id: supplierId,
        file_name: fileName,
        file_type: fileExtension,
        document_type: documentType,
        file_path: filePath,
        metadata: { original_name: file.name, size: file.size },
        created_by: uid
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating document in Supabase:', insertError);
      // Clean up file if database insert fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(document);
  } catch (error) {
    console.error('Error uploading supplier document:', error);
    return NextResponse.json(
      { error: 'Failed to upload supplier document' },
      { status: 500 }
    );
  }
}

// Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client
    const supabase = await createServerClient();
    
    // Get document details before deletion
    const { data: document, error: fetchError } = await supabase
      .from('supplier_documents')
      .select('*')
      .eq('id', documentId)
      .eq('created_by', uid)
      .single();
    
    if (fetchError) {
      console.error('Error fetching document:', fetchError);
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }
    
    // Delete document from Supabase
    const { error: deleteError } = await supabase
      .from('supplier_documents')
      .delete()
      .eq('id', documentId)
      .eq('created_by', uid);
    
    if (deleteError) {
      console.error('Error deleting document from Supabase:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }
    
    // Delete file from disk
    if (document && document.file_path && fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplier document:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier document' },
      { status: 500 }
    );
  }
}
