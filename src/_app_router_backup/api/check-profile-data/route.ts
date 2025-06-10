import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { initializeProfileData } from '@/lib/profiles/init';

export async function GET() {
  try {
    // Initialize profile data and check if file exists
    const { initialized, profileExists, profilePath } = await initializeProfileData();
    
    if (!initialized) {
      return NextResponse.json(
        { error: 'Failed to initialize profile data directory' },
        { status: 500 }
      );
    }
    
    // Check if file exists
    if (profileExists && profilePath) {
      // Get file stats
      const stats = fs.statSync(profilePath);
      
      return NextResponse.json({
        exists: true,
        lastModified: stats.mtime.toLocaleString(),
        size: stats.size
      });
    } else {
      return NextResponse.json({
        exists: false,
      });
    }
  } catch (error) {
    console.error('Error checking profile file:', error);
    return NextResponse.json(
      { error: 'Failed to check profile file' },
      { status: 500 }
    );
  }
}
