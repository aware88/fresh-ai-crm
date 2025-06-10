import { NextRequest, NextResponse } from 'next/server';
import { initializeSupplierData } from '@/lib/suppliers/init';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

/**
 * GET handler for downloading supplier documents
 * Requires document ID in query parameters
 */
export async function GET(request: NextRequest) {
  // Ensure data files are initialized
  await initializeSupplierData();
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Read supplier documents data
    const dataDir = path.join(process.cwd(), 'src', 'data');
    const documentsFilePath = path.join(dataDir, 'supplier_documents.json');

    // Check if documents file exists
    if (!fs.existsSync(documentsFilePath)) {
      return NextResponse.json({ error: 'No documents found' }, { status: 404 });
    }

    // Read and parse documents data
    const documentsData = await fsPromises.readFile(documentsFilePath, 'utf8');
    const documents = JSON.parse(documentsData);

    // Find the document by ID
    const document = documents.find((doc: any) => doc.id === id);
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if file exists
    const filePath = path.join(process.cwd(), document.filePath);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Read file content
    const fileContent = await fsPromises.readFile(filePath);

    // Determine content type based on file extension
    let contentType = 'application/octet-stream'; // Default
    if (document.fileType === 'pdf') {
      contentType = 'application/pdf';
    } else if (document.fileType === 'xlsx' || document.fileType === 'xls') {
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (document.fileType === 'csv') {
      contentType = 'text/csv';
    }

    // Create response with appropriate headers
    const response = new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Error downloading document:', error);
    return NextResponse.json({ error: 'Failed to download document' }, { status: 500 });
  }
}
