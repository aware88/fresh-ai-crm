import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Bucket name for avatars
const BUCKET_NAME = 'avatars';

export async function POST(request: NextRequest) {
  try {
    // Get form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (1MB limit)
    if (file.size > 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 1MB' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `avatar-${uuidv4()}.${fileExtension}`;
    const filePath = `avatars/${fileName}`;
    
    // Try to upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading avatar:', error);
      
      // Fall back to data URL for any Supabase storage error
      console.log('Falling back to data URL for avatar');
      
      return NextResponse.json({ 
        success: true,
        avatarUrl: `data:${file.type};base64,${buffer.toString('base64')}`,
        localOnly: true,
        message: 'Avatar saved as data URL only'
      });
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    return NextResponse.json({ 
      success: true, 
      avatarUrl: publicUrl 
    });
    
  } catch (error: any) {
    console.error('Error in avatar upload:', error);
    
    const errorMessage = error?.message || 'Failed to upload avatar';
    const statusCode = error?.statusCode || 500;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: typeof error === 'object' ? JSON.stringify(error) : String(error)
      },
      { status: statusCode }
    );
  }
} 