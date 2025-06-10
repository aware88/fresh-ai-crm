import { NextRequest, NextResponse } from 'next/server';
import { initializeSupplierData } from '@/lib/suppliers/init';
import { writeFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SupplierDocument } from '@/types/supplier';

// Path to store documents data
const documentsPath = path.join(process.cwd(), 'src/data/supplier_documents.json');
const uploadsDir = path.join(process.cwd(), 'src/data/uploads/suppliers');
const dataDir = path.join(process.cwd(), 'src/data');

// Initialize documents file if it doesn't exist
const initDocumentsFile = async () => {
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(documentsPath)) {
    fs.writeFileSync(documentsPath, JSON.stringify([]));
  }
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

export async function POST(request: NextRequest) {
  // Ensure data files are initialized
  await initializeSupplierData();
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const supplierId = formData.get('supplierId') as string;
    const documentType = formData.get('documentType') as string;
    
    if (!file || !supplierId || !documentType) {
      return NextResponse.json(
        { error: 'File, supplier ID, and document type are required' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, Excel, and CSV files are allowed.' },
        { status: 400 }
      );
    }
    
    await initDocumentsFile();
    
    // Create supplier directory if it doesn't exist
    const supplierDir = path.join(uploadsDir, supplierId);
    if (!fs.existsSync(supplierDir)) {
      fs.mkdirSync(supplierDir, { recursive: true });
    }
    
    // Generate unique filename
    const fileId = uuidv4();
    const fileExtension = path.extname(file.name);
    const fileName = `${fileId}${fileExtension}`;
    const filePath = path.join(supplierDir, fileName);
    
    // Save file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);
    
    // Save document metadata
    const documentsData = fs.readFileSync(documentsPath, 'utf8');
    const documents: SupplierDocument[] = JSON.parse(documentsData);
    
    const newDocument: SupplierDocument = {
      id: fileId,
      supplierId,
      fileName: file.name,
      fileType: file.type,
      documentType,
      filePath: `uploads/suppliers/${supplierId}/${fileName}`,
      uploadDate: new Date(),
      metadata: {
        size: file.size,
      }
    };
    
    documents.push(newDocument);
    fs.writeFileSync(documentsPath, JSON.stringify(documents, null, 2));
    
    return NextResponse.json(newDocument);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// Get documents for a specific supplier
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    
    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }
    
    await initDocumentsFile();
    const documentsData = fs.readFileSync(documentsPath, 'utf8');
    const documents: SupplierDocument[] = JSON.parse(documentsData);
    
    // Filter documents by supplier ID
    const supplierDocuments = documents.filter(doc => doc.supplierId === supplierId);
    
    return NextResponse.json(supplierDocuments);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
