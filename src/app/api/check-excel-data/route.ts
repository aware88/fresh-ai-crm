import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { initializeExcelData } from '@/lib/excel/init';

export async function GET() {
  try {
    // Initialize Excel data and check if file exists
    const { initialized, excelExists, excelPath } = await initializeExcelData();
    
    if (!initialized) {
      return NextResponse.json(
        { error: 'Failed to initialize Excel data directory' },
        { status: 500 }
      );
    }
    
    // Check if file exists
    if (initialized && excelPath && fs.existsSync(excelPath)) {
      try {
        // Get sheet information
        const workbook = XLSX.readFile(excelPath);
        const sheetNames = workbook.SheetNames;
        
        return NextResponse.json({
          exists: true,
          lastModified: fs.statSync(excelPath).mtime,
          size: fs.statSync(excelPath).size,
          sheetNames
        });
      } catch (error) {
        console.error('Error reading Excel file:', error);
        return NextResponse.json({
          exists: false,
          error: 'Error reading Excel file'
        });
      }
    } else {
      return NextResponse.json({
        exists: false
      });
    }
  } catch (error) {
    console.error('Error checking Excel file:', error);
    return NextResponse.json(
      { error: 'Failed to check Excel file' },
      { status: 500 }
    );
  }
}
