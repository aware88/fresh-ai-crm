import { NextRequest, NextResponse } from 'next/server';
import { 
  loadFiles, 
  loadFilesByContactId,
  getFileById,
  deleteFile,
  updateFileMetadata,
  isUsingSupabase
} from '@/lib/files/data';
import { FileMetadataUpdateInput } from '@/lib/files/types';

/**
 * GET /api/files - Get all files
 * GET /api/files?contactId=123 - Get files for a specific contact
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    const fileId = searchParams.get('id');
    
    let files;
    
    if (fileId) {
      // Get a single file by ID
      const file = await getFileById(fileId);
      
      if (!file) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        file, 
        usingSupabase: isUsingSupabase() 
      });
    } else if (contactId) {
      // Get files for a specific contact
      files = await loadFilesByContactId(contactId);
    } else {
      // Get all files
      files = await loadFiles();
    }
    
    return NextResponse.json({ 
      files, 
      usingSupabase: isUsingSupabase() 
    });
  } catch (error) {
    console.error('Error in GET /api/files:', error);
    return NextResponse.json(
      { error: 'Failed to load files' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/files - Update file metadata
 */
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.id) {
      return NextResponse.json(
        { error: 'Missing file ID' },
        { status: 400 }
      );
    }
    
    const fileData: FileMetadataUpdateInput = {
      id: data.id,
      filename: data.filename,
      originalName: data.originalName,
      description: data.description,
      tags: data.tags,
      contact_id: data.contact_id
    };
    
    const updatedFile = await updateFileMetadata(fileData);
    
    if (!updatedFile) {
      return NextResponse.json(
        { error: 'Failed to update file metadata' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      file: updatedFile,
      usingSupabase: isUsingSupabase()
    });
  } catch (error) {
    console.error('Error in PUT /api/files:', error);
    return NextResponse.json(
      { error: 'Failed to update file metadata' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/files?id=123 - Delete a file
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing file ID' },
        { status: 400 }
      );
    }
    
    const success = await deleteFile(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      usingSupabase: isUsingSupabase()
    });
  } catch (error) {
    console.error('Error in DELETE /api/files:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
