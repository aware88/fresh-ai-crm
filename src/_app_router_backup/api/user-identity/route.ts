import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const userIdentityPath = path.join(process.cwd(), 'src/data/user_identity.json');

// Ensure the data directory exists
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), 'src/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// GET endpoint to retrieve user identity
export async function GET() {
  try {
    ensureDataDir();
    
    // Check if file exists
    if (!fs.existsSync(userIdentityPath)) {
      return NextResponse.json({ 
        identity: null,
        message: 'No user identity found' 
      });
    }

    // Read the file
    const fileContent = fs.readFileSync(userIdentityPath, 'utf8');
    const identity = JSON.parse(fileContent);
    
    return NextResponse.json({
      identity,
      message: 'User identity retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error retrieving user identity:', error);
    return NextResponse.json(
      { 
        identity: null,
        message: 'Error retrieving user identity',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint to save user identity
export async function POST(request: Request) {
  try {
    ensureDataDir();
    
    const body = await request.json();
    const { identity } = body;
    
    if (!identity) {
      return NextResponse.json(
        { message: 'No identity data provided' },
        { status: 400 }
      );
    }
    
    // Save to file
    fs.writeFileSync(userIdentityPath, JSON.stringify(identity, null, 2));
    
    return NextResponse.json({
      message: 'User identity saved successfully',
      identity
    });
    
  } catch (error) {
    console.error('Error saving user identity:', error);
    return NextResponse.json(
      { 
        message: 'Error saving user identity',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
