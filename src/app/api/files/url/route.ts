import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl, getFileById, isUsingSupabase } from '@/lib/files/data';

/**
 * GET /api/files/url?id=123 - Get a signed URL for a file
 * GET /api/files/url?path=path/to/file.pdf - Get a signed URL for a file by path
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const path = searchParams.get('path');
    
    if (!id && !path) {
      return NextResponse.json(
        { error: 'Either file ID or path is required' },
        { status: 400 }
      );
    }
    
    let filePath = path;
    
    // If ID is provided, get the file path from the metadata
    if (id) {
      const file = await getFileById(id);
      if (!file) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }
      filePath = file.path;
    }
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }
    
    const url = await getFileUrl(filePath);
    
    if (!url) {
      return NextResponse.json(
        { error: 'Failed to generate file URL' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      url,
      usingSupabase: isUsingSupabase()
    });
  } catch (error) {
    console.error('Error in GET /api/files/url:', error);
    return NextResponse.json(
      { error: 'Failed to generate file URL' },
      { status: 500 }
    );
  }
}
