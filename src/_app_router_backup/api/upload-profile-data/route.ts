import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { initializeProfileData } from '@/lib/profiles/init';

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
        { error: 'Only CSV files (.csv) are allowed' },
        { status: 400 }
      );
    }

    // Read file content as ArrayBuffer and convert to Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Basic validation - check if the file is not empty
    if (fileBuffer.length === 0) {
      return NextResponse.json(
        { error: 'The CSV file is empty' },
        { status: 400 }
      );
    }

    // Initialize profile data directory
    const { initialized, profilePath } = await initializeProfileData();
    
    if (!initialized || !profilePath) {
      return NextResponse.json(
        { error: 'Failed to initialize profile data directory' },
        { status: 500 }
      );
    }

    // Write file to disk
    await writeFile(profilePath, fileBuffer);

    return NextResponse.json({
      success: true,
      message: 'Personality profile data uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading profile data:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile data' },
      { status: 500 }
    );
  }
}
