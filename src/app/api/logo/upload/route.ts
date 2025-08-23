import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Bucket name for company assets
const BUCKET_NAME = 'company_assets';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    
    // Save logo URL to database
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
    
    // Get user's current organization
    const supabaseClient = createServerComponentClient({ cookies });
    const { data: preferences } = await supabaseClient
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', session.user.id)
      .single();

    if (!preferences?.current_organization_id) {
      return NextResponse.json({ error: 'No organization selected' }, { status: 400 });
    }

    // Save logo to file-based branding system
    const brandingDir = path.join(process.cwd(), 'data', 'branding');
    const brandingFile = path.join(brandingDir, `${preferences.current_organization_id}.json`);
    
    try {
      // Ensure branding directory exists
      await fs.mkdir(brandingDir, { recursive: true });
      
      // Read existing branding or create new
      let existingBranding = {};
      try {
        const existingData = await fs.readFile(brandingFile, 'utf8');
        existingBranding = JSON.parse(existingData);
      } catch (readError) {
        // File doesn't exist, create new branding
        console.log('Creating new branding file for organization:', preferences.current_organization_id);
      }
      
      // Update with new logo URL
      const updatedBranding = {
        ...existingBranding,
        id: existingBranding.id || `branding_${preferences.current_organization_id}`,
        organization_id: preferences.current_organization_id,
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id,
        created_at: existingBranding.created_at || new Date().toISOString(),
        created_by: existingBranding.created_by || session.user.id
      };
      
      // Save updated branding
      await fs.writeFile(brandingFile, JSON.stringify(updatedBranding, null, 2), 'utf8');
      console.log('Successfully saved logo to branding file');
      
    } catch (brandingError) {
      console.error('Error saving logo to branding file:', brandingError);
      // Still return success since the upload worked
      return NextResponse.json({ 
        success: true, 
        logoPath: logoUrl,
        warning: 'Logo uploaded but not saved to branding file'
      });
    }
    
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
