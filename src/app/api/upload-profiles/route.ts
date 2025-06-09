import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Function to validate CSV structure
const validateCsv = (fileContent: string): boolean => {
  try {
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });
    
    // Check if the CSV has the required columns
    const requiredColumns = ['trait', 'description', 'communicationApproach', 'doEmphasis', 'dontEmphasis'];
    
    if (records.length === 0) {
      return false;
    }
    
    const firstRecord = records[0];
    return requiredColumns.every(column => column in firstRecord);
  } catch (error) {
    console.error('Error validating CSV:', error);
    return false;
  }
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Read file content
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileContent = fileBuffer.toString();
    
    // Validate CSV structure
    if (!validateCsv(fileContent)) {
      return NextResponse.json(
        { error: 'Invalid CSV format. Please ensure it has the required columns.' },
        { status: 400 }
      );
    }
    
    // Save the file
    const filePath = path.join(process.cwd(), 'src/data/personality_profiles.csv');
    fs.writeFileSync(filePath, fileContent);
    
    return NextResponse.json({ success: true, message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
