import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Path to the Excel file
    const filePath = path.join(process.cwd(), 'src/data/excel_personality_data.xlsx');
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      // Get file stats
      const stats = fs.statSync(filePath);
      
      // Get sheet information
      const workbook = XLSX.readFile(filePath);
      const sheetNames = workbook.SheetNames;
      
      return NextResponse.json({
        exists: true,
        lastModified: stats.mtime.toLocaleString(),
        size: stats.size,
        sheetCount: sheetNames.length,
        sheets: sheetNames
      });
    } else {
      return NextResponse.json({
        exists: false,
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
