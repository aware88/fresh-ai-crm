import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to the mock data file
    const filePath = path.join(process.cwd(), 'src/data/mock_personality_data.csv');
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      // Get file stats
      const stats = fs.statSync(filePath);
      
      return NextResponse.json({
        exists: true,
        lastModified: stats.mtime.toLocaleString(),
        size: stats.size,
      });
    } else {
      return NextResponse.json({
        exists: false,
      });
    }
  } catch (error) {
    console.error('Error checking mock data file:', error);
    return NextResponse.json(
      { error: 'Failed to check mock data file' },
      { status: 500 }
    );
  }
}
