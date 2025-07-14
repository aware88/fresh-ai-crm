import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { parseExcelFile, parseCsvFile, parseWordDocument } from '@/lib/fileParser';
import { getServerSession } from '@/lib/auth';

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
      if (!row.name) {
        errors.push({ row, error: 'Name is required' });
        continue;
      }

      // Insert into suppliers table
      const { error } = await supabase
        .from('suppliers')
        .insert({
          name: row.name,
          email: row.email || null,
          phone: row.phone || null,
          website: row.website || null,
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
        errors.push({ row, error: 'Name is required' });
        continue;
      }

      // Insert into products table
      const { error } = await supabase
        .from('products')
        .insert({
          name: row.name,
          sku: row.sku || null,
          description: row.description || null,
          price: parseFloat(row.price) || 0,
          category: row.category || null,
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
      if (!row.product_id && !row.product_sku) {
        errors.push({ row, error: 'Product ID or SKU is required' });
        continue;
      }

      if (!row.price) {
        errors.push({ row, error: 'Price is required' });
        continue;
      }

      // Find product by ID or SKU
      let productId = row.product_id;
      
      if (!productId && row.product_sku) {
        const { data: product } = await supabase
          .from('products')
          .select('id')
          .eq('sku', row.product_sku)
          .eq('organization_id', orgId)
          .single();
        
        if (product) {
          productId = product.id;
        } else {
          errors.push({ row, error: `Product with SKU ${row.product_sku} not found` });
          continue;
        }
      }

      // Insert into prices table
      const { error } = await supabase
        .from('prices')
        .insert({
          product_id: productId,
          price: parseFloat(row.price),
          currency: row.currency || 'USD',
          effective_date: row.effective_date || new Date().toISOString(),
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
    const { entityType } = params;
    
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
    console.error('Error processing bulk import:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
