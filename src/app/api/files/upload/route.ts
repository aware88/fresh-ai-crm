import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, isUsingSupabase } from '@/lib/files/data';

/**
 * POST /api/files/upload - Upload a file
 * 
 * This endpoint handles multipart form data with the following fields:
 * - file: The file to upload
 * - contactId: (Optional) ID of the contact to associate with the file
 * - description: (Optional) Description of the file
 * - tags: (Optional) Comma-separated list of tags
 */
export async function POST(request: NextRequest) {
  try {
    // Check if the request is multipart form data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' },
        { status: 400 }
      );
    }
    
    // Parse the form data
    const formData = await request.formData();
    
    // Get the file from the form data
    const fileData = formData.get('file');
    if (!fileData || !(fileData instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Get optional fields
    const contactId = formData.get('contactId')?.toString() || undefined;
    const description = formData.get('description')?.toString() || undefined;
    
    // Parse tags if provided
    let tags: string[] | undefined = undefined;
    const tagsString = formData.get('tags')?.toString();
    if (tagsString) {
      tags = tagsString.split(',').map(tag => tag.trim());
    }
    
    // Upload the file
    const file = await uploadFile(fileData, contactId, description, tags);
    
    if (!file) {
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      file,
      usingSupabase: isUsingSupabase()
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/files/upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
