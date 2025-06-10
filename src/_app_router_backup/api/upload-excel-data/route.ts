import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';
import { initializeExcelData } from '@/lib/excel/init';

// Function to validate Excel file
const validateExcel = (buffer: Buffer): { valid: boolean; error?: string; sheetCount?: number; sheets?: string[] } => {
  try {
    // Try to parse the Excel file
    let workbook;
    try {
      workbook = XLSX.read(buffer);
    } catch (parseError) {
      console.error('Excel parsing error:', parseError);
      return { valid: false, error: 'Could not parse Excel format' };
    }

    // Check if there are any sheets
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { valid: false, error: 'No sheets found in Excel file' };
    }

    // Check if there's data in at least one sheet
    let hasData = false;
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);
      if (data && data.length > 0) {
        hasData = true;
        break;
      }
    }

    if (!hasData) {
      return { valid: false, error: 'No data found in any sheet' };
    }

    return { 
      valid: true, 
      sheetCount: workbook.SheetNames.length,
      sheets: workbook.SheetNames
    };
  } catch (error) {
    console.error('Error validating Excel:', error);
    return { valid: false, error: 'Unexpected error validating Excel file' };
  }
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file extension
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      return NextResponse.json(
        { error: 'Only Excel files (.xlsx, .xls) are allowed' },
        { status: 400 }
      );
    }

    // Read file content as ArrayBuffer and convert to Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Validate Excel structure
    const validation = validateExcel(fileBuffer);
    if (!validation.valid) {
      console.error('Excel validation failed:', validation.error);
      return NextResponse.json(
        { error: `Invalid Excel format: ${validation.error}` },
        { status: 400 }
      );
    }

    // Initialize Excel data directory
    const { initialized, excelPath } = await initializeExcelData();
    
    if (!initialized || !excelPath) {
      return NextResponse.json(
        { error: 'Failed to initialize Excel data directory' },
        { status: 500 }
      );
    }

    // Write file to disk
    await writeFile(excelPath, fileBuffer);

    return NextResponse.json({
      success: true,
      message: 'Excel data uploaded successfully',
      sheetCount: validation.sheetCount,
      sheets: validation.sheets
    });
  } catch (error) {
    console.error('Error uploading Excel data:', error);
    return NextResponse.json(
      { error: 'Failed to upload Excel data' },
      { status: 500 }
    );
  }
}
