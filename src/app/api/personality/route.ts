import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { getFallbackDataBySheet, getFallbackSheetNames } from '@/lib/excel/fallback-data';

/**
 * GET /api/personality - Get personality data
 * GET /api/personality?sheet=SheetName - Get data from a specific sheet
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sheetName = searchParams.get('sheet');
    
    // Path to Excel file
    const excelPath = path.join(process.cwd(), 'src', 'data', 'excel_personality_data.xlsx');
    
    // Check if file exists and is readable
    let useExcelFile = false;
    try {
      fs.accessSync(excelPath, fs.constants.R_OK);
      useExcelFile = true;
    } catch (error) {
      console.log('Excel file not accessible, using fallback data');
      useExcelFile = false;
    }
    
    if (useExcelFile) {
      try {
        // Read Excel file
        const buffer = fs.readFileSync(excelPath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        
        if (sheetName) {
          // Return data from specific sheet
          if (!workbook.SheetNames.includes(sheetName)) {
            return NextResponse.json(
              { error: `Sheet "${sheetName}" not found` },
              { status: 404 }
            );
          }
          
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          return NextResponse.json({
            sheet: sheetName,
            data,
            source: 'excel'
          });
        } else {
          // Return all sheet names
          return NextResponse.json({
            sheets: workbook.SheetNames,
            source: 'excel'
          });
        }
      } catch (error) {
        console.error('Error reading Excel file:', error);
        // Fall back to in-memory data
        useExcelFile = false;
      }
    }
    
    // Use fallback data if Excel file is not available or had an error
    if (!useExcelFile) {
      if (sheetName) {
        // Return data from specific fallback sheet
        const data = getFallbackDataBySheet(sheetName);
        
        return NextResponse.json({
          sheet: sheetName,
          data,
          source: 'fallback'
        });
      } else {
        // Return all fallback sheet names
        return NextResponse.json({
          sheets: getFallbackSheetNames(),
          source: 'fallback'
        });
      }
    }
  } catch (error) {
    console.error('Error in personality API:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve personality data' },
      { status: 500 }
    );
  }
}
