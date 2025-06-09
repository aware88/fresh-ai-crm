import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Function to validate CSV structure with more detailed error reporting
const validateCsv = (fileContent: string): { valid: boolean; error?: string } => {
  try {
    // Check if file is empty
    if (!fileContent || fileContent.trim() === '') {
      return { valid: false, error: 'CSV file is empty' };
    }

    // Try to parse the CSV
    let records;
    try {
      records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
      });
    } catch (parseError) {
      console.error('CSV parsing error:', parseError);
      return { valid: false, error: 'Could not parse CSV format' };
    }

    // Check if there are any records
    if (!records || records.length === 0) {
      return { valid: false, error: 'No records found in CSV' };
    }

    // Required columns - using underscores as in the user's CSV
    const requiredColumns = [
      'Personality_Type',
      'Traits',
      'Sales_Strategy',
      'Messaging_Do',
      'Messaging_Dont',
      'Common_Biases',
      'Trigger',
      'Description',
      'Example',
      'Personality',
      'Objection',
      'Reframe',
      'Framework',
      'Best_For',
      'Style'
    ];

    // Check if all required columns exist
    const firstRecord = records[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRecord));

    if (missingColumns.length > 0) {
      return { valid: false, error: `Missing required columns: ${missingColumns.join(', ')}` };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating CSV:', error);
    return { valid: false, error: 'Unexpected error validating CSV' };
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

    if (fileExtension !== 'csv') {
      return NextResponse.json(
        { error: 'Only CSV files are allowed' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Validate CSV structure
    const validation = validateCsv(fileContent);
    if (!validation.valid) {
      console.error('CSV validation failed:', validation.error);
      return NextResponse.json(
        { error: `Invalid CSV format: ${validation.error}` },
        { status: 400 }
      );
    }

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'src/data');
    if (!existsSync(dataDir)) {
      await mkdir(dataDir, { recursive: true });
    }

    // Path to save the file
    const filePath = path.join(process.cwd(), 'src/data/mock_personality_data.csv');

    // Write file to disk
    await writeFile(filePath, fileContent);

    return NextResponse.json({
      success: true,
      message: 'Mock data uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading mock data:', error);
    return NextResponse.json(
      { error: 'Failed to upload mock data' },
      { status: 500 }
    );
  }
}
