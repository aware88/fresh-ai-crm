import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabaseClient';
import { 
  getEmailTemplates, 
  getEmailTemplate, 
  createEmailTemplate, 
  updateEmailTemplate, 
  deleteEmailTemplate,
  applyTemplateWithMetakockaContext,
  getAvailableMetakockaPlaceholders
} from '@/lib/integrations/metakocka/email-templates';

// GET /api/emails/templates
// Get all email templates for the authenticated user
export async function GET(req: NextRequest) {
  try {
    // Get the session using getServerSession
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }

    // Get the user ID from the session
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Error fetching user data' }, 
        { status: 401 }
      );
    }
    const userId = userData.user.id;

    // Check if this is a request for a specific template
    const url = new URL(req.url);
    const templateId = url.searchParams.get('templateId');
    
    if (templateId) {
      // Get a specific template
      const template = await getEmailTemplate(templateId, userId);
      
      if (!template) {
        return NextResponse.json(
          { success: false, message: 'Template not found' }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: true, data: template }, 
        { status: 200 }
      );
    }
    
    // Check if this is a request for available placeholders
    const placeholders = url.searchParams.get('placeholders');
    
    if (placeholders === 'available') {
      const availablePlaceholders = getAvailableMetakockaPlaceholders();
      
      return NextResponse.json(
        { success: true, data: availablePlaceholders }, 
        { status: 200 }
      );
    }
    
    // Otherwise, get all templates
    const templates = await getEmailTemplates(userId);
    
    return NextResponse.json(
      { success: true, data: templates }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error' 
      }, 
      { status: 500 }
    );
  }
}

// POST /api/emails/templates
// Create a new email template
export async function POST(req: NextRequest) {
  try {
    // Get the session using getServerSession
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }

    // Get the user ID from the session
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Error fetching user data' }, 
        { status: 401 }
      );
    }
    const userId = userData.user.id;

    // Parse the request body
    const body = await req.json();
    
    // Check if this is a request to apply a template
    if (body.apply === true) {
      const { templateId, emailId } = body;
      
      if (!templateId || !emailId) {
        return NextResponse.json(
          { success: false, message: 'Template ID and Email ID are required' }, 
          { status: 400 }
        );
      }
      
      // Apply the template with Metakocka context
      const result = await applyTemplateWithMetakockaContext(templateId, emailId, userId);
      
      return NextResponse.json(
        { success: true, data: result }, 
        { status: 200 }
      );
    }
    
    // Otherwise, create a new template
    const { name, subject, body: templateBody } = body;
    
    if (!name || !subject || !templateBody) {
      return NextResponse.json(
        { success: false, message: 'Name, subject, and body are required' }, 
        { status: 400 }
      );
    }
    
    const template = await createEmailTemplate(
      { name, subject, body: templateBody },
      userId
    );
    
    return NextResponse.json(
      { success: true, data: template }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error' 
      }, 
      { status: 500 }
    );
  }
}

// PUT /api/emails/templates
// Update an existing email template
export async function PUT(req: NextRequest) {
  try {
    // Get the session using getServerSession
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }

    // Get the user ID from the session
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Error fetching user data' }, 
        { status: 401 }
      );
    }
    const userId = userData.user.id;

    // Parse the request body
    const body = await req.json();
    const { id, name, subject, body: templateBody } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Template ID is required' }, 
        { status: 400 }
      );
    }
    
    // Build the update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (templateBody !== undefined) updateData.body = templateBody;
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No fields to update' }, 
        { status: 400 }
      );
    }
    
    // Update the template
    const template = await updateEmailTemplate(id, updateData, userId);
    
    return NextResponse.json(
      { success: true, data: template }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error' 
      }, 
      { status: 500 }
    );
  }
}

// DELETE /api/emails/templates
// Delete an email template
export async function DELETE(req: NextRequest) {
  try {
    // Get the session using getServerSession
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }

    // Get the user ID from the session
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Error fetching user data' }, 
        { status: 401 }
      );
    }
    const userId = userData.user.id;

    // Get the template ID from the query parameters
    const url = new URL(req.url);
    const templateId = url.searchParams.get('id');
    
    if (!templateId) {
      return NextResponse.json(
        { success: false, message: 'Template ID is required' }, 
        { status: 400 }
      );
    }
    
    // Delete the template
    await deleteEmailTemplate(templateId, userId);
    
    return NextResponse.json(
      { success: true, message: 'Template deleted successfully' }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting email template:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error' 
      }, 
      { status: 500 }
    );
  }
}
