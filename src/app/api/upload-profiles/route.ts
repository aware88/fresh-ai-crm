import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Function to validate CSV structure with more detailed error reporting
const validateCsv = (fileContent: string): { valid: boolean; error?: string } => {
  try {
    // First check if the content is empty
    if (!fileContent.trim()) {
      return { valid: false, error: 'CSV file is empty' };
    }

    // Try to parse the CSV
    let records;
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        relaxColumnCount: true, // More forgiving parsing
      });
    } catch (parseError) {
      console.error('CSV parsing error:', parseError);
      return { valid: false, error: 'Could not parse CSV format' };
    }
    
    // Check if we got any records
    if (!records || records.length === 0) {
      return { valid: false, error: 'No records found in CSV' };
    }
    
    // Required columns
    const requiredColumns = [
      'Personality Type', 'Tone', 'Message Do', 'Message Dont', 
      'Content Needs', 'Topic', 'Description', 'Tone-out', 
      'Personality', 'Direction', 'Stance', 'Expression Type-Do', 'Style'
    ];
    
    // Check first record for required columns
    const firstRecord = records[0];
    const missingColumns = requiredColumns.filter(column => !(column in firstRecord));
    
    if (missingColumns.length > 0) {
      return { 
        valid: false, 
        error: `Missing required columns: ${missingColumns.join(', ')}` 
      };
    }
    
    return { valid: true };
  } catch (error) {
    console.error('Error validating CSV:', error);
    return { valid: false, error: 'Unexpected error validating CSV' };
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('Received upload request');
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      console.error('No valid file provided in request');
      return NextResponse.json(
        { error: 'No valid file provided' },
        { status: 400 }
      );
    }
    
    console.log('File received:', file.name, file.type, file.size);
    
    // Read file content
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileContent = fileBuffer.toString();
    
    console.log('File content length:', fileContent.length);
    console.log('First 100 chars:', fileContent.substring(0, 100));
    
    // Validate CSV structure
    const validation = validateCsv(fileContent);
    if (!validation.valid) {
      console.error('CSV validation failed:', validation.error);
      return NextResponse.json(
        { error: `Invalid CSV format: ${validation.error}` },
        { status: 400 }
      );
    }
    
    // Save the file
    const filePath = path.join(process.cwd(), 'src/data/personality_profiles.csv');
    fs.writeFileSync(filePath, fileContent);
    console.log('File saved successfully to:', filePath);
    
    return NextResponse.json({ success: true, message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: 'Failed to process file upload: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
