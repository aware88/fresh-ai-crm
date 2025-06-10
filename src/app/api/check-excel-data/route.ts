import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { initializeExcelData, createDefaultExcelFile } from '@/lib/excel/init';

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
    
    // Check if file exists, create it if it doesn't
    if (initialized && excelPath) {
      if (!fs.existsSync(excelPath)) {
        // Create the Excel file if it doesn't exist
        console.log('Excel file does not exist, creating it now...');
        const created = await createDefaultExcelFile(excelPath);
        if (!created) {
          console.error('Failed to create Excel file');
          return NextResponse.json({
            exists: false,
            error: 'Failed to create Excel file'
          }, { status: 500 });
        }
        
        // Verify the file was created
        if (!fs.existsSync(excelPath)) {
          console.error('Excel file was not created successfully');
          return NextResponse.json({
            exists: false,
            error: 'Excel file was not created successfully'
          }, { status: 500 });
        }
      }
      
      // Double check file exists and has proper permissions
      try {
        // Check file permissions
        fs.accessSync(excelPath, fs.constants.R_OK);
        console.log(`Excel file exists and is readable at: ${excelPath}`);
      } catch (err) {
        console.error(`Excel file permission error: ${err}`);
        return NextResponse.json({
          exists: false,
          error: `Excel file permission error: ${err}`
        }, { status: 500 });
      }
      
      // Now try to read the file (whether it existed before or we just created it)
      try {
        // Get sheet information
        console.log(`Reading Excel file from: ${excelPath}`);
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
