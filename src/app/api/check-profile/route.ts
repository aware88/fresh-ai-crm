import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/data/personality_profiles.csv');
    
    // Check if file exists
    const fileExists = fs.existsSync(filePath);
    
    if (!fileExists) {
      return NextResponse.json({ 
        exists: false,
        message: 'No profile file found' 
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    
    return NextResponse.json({
      exists: true,
      lastModified: stats.mtime.toISOString(),
      size: stats.size,
      message: 'Profile file found'
    });
    
  } catch (error) {
    console.error('Error checking profile file:', error);
    return NextResponse.json(
      { 
        exists: false,
        message: 'Error checking profile file',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
