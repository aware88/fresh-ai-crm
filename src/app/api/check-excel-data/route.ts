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
      
      // Try reading the file with a different approach using fs.readFileSync first
      try {
        console.log(`Reading Excel file from: ${excelPath} using buffer approach`);
        // Read the file into a buffer first
        const buffer = fs.readFileSync(excelPath);
        // Then parse the buffer with XLSX
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetNames = workbook.SheetNames;
        
        return NextResponse.json({
          exists: true,
          lastModified: fs.statSync(excelPath).mtime,
          size: fs.statSync(excelPath).size,
          sheetNames
        });
      } catch (error) {
        console.error('Error reading Excel file with buffer approach:', error);
        
        // Fall back to creating a new Excel file
        try {
          console.log('Attempting to recreate the Excel file...');
          // Delete the existing file if it exists but can't be read
          if (fs.existsSync(excelPath)) {
            try {
              fs.unlinkSync(excelPath);
              console.log(`Deleted problematic Excel file at: ${excelPath}`);
            } catch (unlinkError) {
              console.error('Failed to delete problematic Excel file:', unlinkError);
              // Continue anyway - we'll try to create a new file
            }
          }
          
          // Create a new Excel file
          await createDefaultExcelFile(excelPath);
          
          // Try reading again
          const buffer = fs.readFileSync(excelPath);
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          const sheetNames = workbook.SheetNames;
          
          return NextResponse.json({
            exists: true,
            recreated: true,
            lastModified: fs.statSync(excelPath).mtime,
            size: fs.statSync(excelPath).size,
            sheetNames
          });
        } catch (recreateError) {
          console.error('Failed to recreate Excel file:', recreateError);
          // Return a successful response with default data even if file creation fails
          // This allows the app to work without requiring Excel file
          return NextResponse.json({
            exists: false,
            fallback: true,
            message: 'Using in-memory fallback data',
            sheetNames: ['Personality Types', 'Communication Tips']
          });
        }
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
