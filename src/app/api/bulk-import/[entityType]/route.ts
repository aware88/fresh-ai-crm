import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { parseExcelFile, parseCsvFile, parseWordDocument } from '@/lib/fileParser';
import { getServerSession } from '@/lib/auth';
import { EnhancedSubscriptionService } from '@/lib/services/subscription-service-extension';

// Process contacts data
async function processContacts(data: any[], supabase: any, userId: string, orgId: string) {
  let recordCount = 0;
  const errors = [];

  for (const row of data) {
    try {
      // Basic validation
      if (!row.name && !row.email) {
        errors.push({ row, error: 'Name or email is required' });
        continue;
      }

      // Insert into contacts table
      const { error } = await supabase
        .from('contacts')
        .insert({
          name: row.name || 'Unknown',
          email: row.email,
          phone: row.phone || null,
          company: row.company || null,
          title: row.title || null,
          address: row.address || null,
          notes: row.notes || null,
          user_id: userId,
          organization_id: orgId
        });

      if (error) {
        errors.push({ row, error: error.message });
      } else {
        recordCount++;
      }
    } catch (error) {
      errors.push({ row, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { recordCount, errors };
}

// Process suppliers data
async function processSuppliers(data: any[], supabase: any, userId: string, orgId: string) {
  let recordCount = 0;
  const errors = [];

  for (const row of data) {
    try {
      // Basic validation
      if (!row.name && !row.email) {
        errors.push({ row, error: 'Name or email is required' });
        continue;
      }

      // Insert into suppliers table
      const { error } = await supabase
        .from('suppliers')
        .insert({
          name: row.name || 'Unknown',
          email: row.email,
          phone: row.phone || null,
          company: row.company || null,
          address: row.address || null,
          notes: row.notes || null,
          user_id: userId,
          organization_id: orgId
        });

      if (error) {
        errors.push({ row, error: error.message });
      } else {
        recordCount++;
      }
    } catch (error) {
      errors.push({ row, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { recordCount, errors };
}

// Process products data
async function processProducts(data: any[], supabase: any, userId: string, orgId: string) {
  let recordCount = 0;
  const errors = [];

  for (const row of data) {
    try {
      // Basic validation
      if (!row.name) {
        errors.push({ row, error: 'Product name is required' });
        continue;
      }

      // Insert into products table
      const { error } = await supabase
        .from('products')
        .insert({
          name: row.name,
          sku: row.sku || null,
          description: row.description || null,
          category: row.category || null,
          unit: row.unit || 'pcs',
          selling_price: row.selling_price ? parseFloat(row.selling_price) : null,
          cost_price: row.cost_price ? parseFloat(row.cost_price) : null,
          min_stock_level: row.min_stock_level ? parseInt(row.min_stock_level) : 0,
          quantity_on_hand: row.quantity_on_hand ? parseFloat(row.quantity_on_hand) : 0,
          user_id: userId,
          organization_id: orgId
        });

      if (error) {
        errors.push({ row, error: error.message });
      } else {
        recordCount++;
      }
    } catch (error) {
      errors.push({ row, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { recordCount, errors };
}

// Process prices data
async function processPrices(data: any[], supabase: any, userId: string, orgId: string) {
  let recordCount = 0;
  const errors = [];

  for (const row of data) {
    try {
      // Basic validation
      if (!row.product_id || !row.price) {
        errors.push({ row, error: 'Product ID and price are required' });
        continue;
      }

      // Insert into prices table
      const { error } = await supabase
        .from('prices')
        .insert({
          product_id: row.product_id,
          price: parseFloat(row.price),
          price_type: row.price_type || 'selling',
          currency: row.currency || 'USD',
          valid_from: row.valid_from ? new Date(row.valid_from).toISOString() : new Date().toISOString(),
          valid_to: row.valid_to ? new Date(row.valid_to).toISOString() : null,
          user_id: userId,
          organization_id: orgId
        });

      if (error) {
        errors.push({ row, error: error.message });
      } else {
        recordCount++;
      }
    } catch (error) {
      errors.push({ row, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  return { recordCount, errors };
}

export async function POST(
  request: NextRequest,
  { params }: { params: { entityType: string } }
) {
  try {
    // Get entity type from URL
    const { entityType } = await params;
    
    // Validate entity type
    const validEntityTypes = ['contacts', 'suppliers', 'products', 'prices'];
    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json(
        { error: `Invalid entity type: ${entityType}` },
        { status: 400 }
      );
    }

    // Get user session
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization ID
    const userId = session.user.id;
    const supabase = await createServerClient();
    
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();
    
    if (!userData || !userData.organization_id) {
      return NextResponse.json(
        { error: 'User not associated with an organization' },
        { status: 400 }
      );
    }
    
    const orgId = userData.organization_id;

    // Get form data with file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Parse file based on extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let data: any[] = [];
    
    if (fileExtension === 'csv') {
      const fileContent = await file.text();
      data = await parseCsvFile(fileContent);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const fileBuffer = await file.arrayBuffer();
      data = await parseExcelFile(fileBuffer);
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      const fileBuffer = await file.arrayBuffer();
      data = await parseWordDocument(fileBuffer);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload a CSV, Excel, or Word file.' },
        { status: 400 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No data found in the file' },
        { status: 400 }
      );
    }

    // Check subscription limits for contacts
    if (entityType === 'contacts' && orgId) {
      const enhancedSubscriptionService = new EnhancedSubscriptionService();
      
      // Get current contact count
      const { count: currentContactCount, error: countError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);
      
      if (countError) {
        console.error('Error counting contacts:', countError);
        return NextResponse.json({ 
          error: 'Failed to check contact limits' 
        }, { status: 500 });
      }
      
      // Check if organization can add the number of contacts being imported
      const { canAdd, reason } = await enhancedSubscriptionService.canAddMoreContacts(
        orgId,
        (currentContactCount || 0) + data.length
      );
      
      if (!canAdd) {
        return NextResponse.json({
          error: `Cannot import ${data.length} contacts. ${reason}`,
          limitReached: true,
          currentCount: currentContactCount || 0,
          attemptedImport: data.length,
          canImport: false
        }, { status: 403 });
      }
    }

    // Process data based on entity type
    let result;
    switch (entityType) {
      case 'contacts':
        result = await processContacts(data, supabase, userId, orgId);
        break;
      case 'suppliers':
        result = await processSuppliers(data, supabase, userId, orgId);
        break;
      case 'products':
        result = await processProducts(data, supabase, userId, orgId);
        break;
      case 'prices':
        result = await processPrices(data, supabase, userId, orgId);
        break;
      default:
        return NextResponse.json(
          { error: `Entity type ${entityType} not supported` },
          { status: 400 }
        );
    }

    // Return results
    return NextResponse.json({
      success: true,
      entityType,
      recordCount: result.recordCount,
      errorCount: result.errors.length,
      errors: result.errors.slice(0, 10), // Return only first 10 errors to avoid response size issues
      totalErrors: result.errors.length
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
