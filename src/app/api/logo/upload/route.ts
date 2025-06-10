import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Bucket name for company assets
const BUCKET_NAME = 'company_assets';

export async function POST(request: NextRequest) {
  try {
    // Get form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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
    const fileName = `logo-${uuidv4()}.${fileExtension}`;
    const filePath = `logos/${fileName}`;
    
    // Try to use the bucket directly without checking if it exists
    // This is because in some Supabase configurations, the user may not have permission
    // to list or create buckets, but might still be able to upload to an existing bucket
    
    // If there's no bucket and we can't create one, we'll fall back to local storage
    // in the error handling below
    
    // Upload file to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading logo:', error);
      
      // Fall back to local storage for any Supabase storage error
      // This ensures the app works even without Supabase configuration
      console.log('Falling back to local storage for logo');
      
      return NextResponse.json({ 
        success: true,
        logoPath: `data:${file.type};base64,${buffer.toString('base64')}`,
        localOnly: true,
        message: 'Logo saved to local storage only'
      });
    }
    
    // Save logo path to local storage or database
    // For simplicity, we'll just return the path and handle storage on the client side
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
    
    return NextResponse.json({ 
      success: true, 
      logoPath: logoUrl 
    });
    
  } catch (error: any) {
    console.error('Error in logo upload:', error);
    
    // If there's an error with Supabase, provide a more detailed message
    const errorMessage = error?.message || 'Failed to upload logo';
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
