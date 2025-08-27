import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServiceRoleClient } from '../../../../lib/supabase/service-role';
import { cookies } from 'next/headers';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Extend NextAuth types for this file
declare module 'next-auth' {
  interface Session {
    id: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

// Bucket name for company assets
const BUCKET_NAME = 'company_assets';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin for their current organization
    let organizationId: string;
    try {
      // Get user's current organization
      const cookieStore = await cookies();
      const supabaseClient = createServerComponentClient({ cookies: () => Promise.resolve(cookieStore) });
      const { data: preferences } = await supabaseClient
        .from('user_preferences')
        .select('current_organization_id')
        .eq('user_id', session.user.id)
        .single();

      if (!preferences?.current_organization_id) {
        return NextResponse.json({ 
          error: 'No organization found for user' 
        }, { status: 400 });
      }

      organizationId = preferences.current_organization_id;

      // Check if user is admin of this organization
      const supabase = createServiceRoleClient();
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', session.user.id)
        .single();

      if (membershipError || !membership) {
        return NextResponse.json({ 
          error: 'User is not a member of any organization' 
        }, { status: 403 });
      }

      if (membership.role !== 'admin') {
        return NextResponse.json({ 
          error: 'Forbidden: Only organization administrators can upload logos' 
        }, { status: 403 });
      }

      console.log('✅ Admin permission verified for logo upload to organization:', organizationId);
    } catch (adminError) {
      console.error('Error checking admin permissions for logo upload:', adminError);
      return NextResponse.json({ 
        error: 'Unable to verify admin permissions' 
      }, { status: 500 });
    }

    // Get form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    console.log('📁 File upload attempt:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      hasFile: !!file
    });
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      return NextResponse.json({ error: 'File too large. Maximum size is 2MB' }, { status: 400 });
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
    
    // Check if Supabase Storage is disabled via environment variable
    const disableSupabaseStorage = process.env.DISABLE_SUPABASE_STORAGE === 'true';
    
    let logoUrl: string = '';
    let useSupabaseStorage = !disableSupabaseStorage;
    
    if (disableSupabaseStorage) {
      console.log('🔄 Supabase Storage disabled via environment variable, using local storage...');
      useSupabaseStorage = false;
    }
    
    // Try Supabase Storage first if enabled
    if (useSupabaseStorage) {
      try {
        console.log('Attempting Supabase Storage upload...');
        
        // Upload file to Supabase Storage
        const { data, error } = await supabase
          .storage
          .from(BUCKET_NAME)
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: true
          });
        
        if (error) {
          throw error;
        }
        
        // Supabase upload successful
        logoUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
        console.log('✅ Successfully uploaded to Supabase Storage:', logoUrl);
        
      } catch (supabaseError) {
        console.error('❌ Supabase Storage upload failed:', supabaseError);
        console.log('🔄 Falling back to local storage...');
        useSupabaseStorage = false;
      }
    }
    
    // Use local storage if Supabase is disabled or failed
    if (!useSupabaseStorage) {
      try {
        console.log('🔄 Attempting local storage upload...');
        const publicDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
        console.log('📁 Creating directory:', publicDir);
        await fs.mkdir(publicDir, { recursive: true });
        
        const localFileName = `logo-${uuidv4()}.${fileExtension}`;
        const localFilePath = path.join(publicDir, localFileName);
        
        console.log('💾 Writing file to:', localFilePath);
        await fs.writeFile(localFilePath, buffer);
        
        logoUrl = `/uploads/logos/${localFileName}`;
        console.log('✅ Successfully saved to local storage:', logoUrl);
      } catch (localError) {
        console.error('❌ Local storage also failed:', localError);
        throw new Error('Failed to save logo to both Supabase and local storage');
      }
    }
    
    // Get user's current organization
    const cookieStore = await cookies();
    const supabaseClient = createServerComponentClient({ cookies: () => Promise.resolve(cookieStore) });
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
      console.log('💾 Saving logo to branding file:', brandingFile);
      // Ensure branding directory exists
      await fs.mkdir(brandingDir, { recursive: true });
      
      // Read existing branding or create new
      let existingBranding: {
        id?: string;
        created_at?: string;
        created_by?: string;
        [key: string]: any;
      } = {};
      try {
        const existingData = await fs.readFile(brandingFile, 'utf8');
        existingBranding = JSON.parse(existingData);
        console.log('📖 Read existing branding:', existingBranding);
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
      
      console.log('📝 Updated branding data:', updatedBranding);
      
      // Save updated branding
      await fs.writeFile(brandingFile, JSON.stringify(updatedBranding, null, 2), 'utf8');
      console.log('✅ Successfully saved logo to branding file');
      
    } catch (brandingError) {
      console.error('❌ Error saving logo to branding file:', brandingError);
      // Still return success since the upload worked
      return NextResponse.json({ 
        success: true, 
        logoPath: logoUrl,
        warning: 'Logo uploaded but not saved to branding file'
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      logoPath: logoUrl,
      storageType: useSupabaseStorage ? 'supabase' : 'local',
      message: useSupabaseStorage 
        ? 'Logo uploaded to Supabase Storage successfully' 
        : 'Logo uploaded to local storage (Supabase Storage unavailable)'
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
