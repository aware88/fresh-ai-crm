const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addSampleData() {
  try {
    console.log('Adding sample analytics data...');

    // Add sample suppliers
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .insert([
        {
          name: 'TechCorp Solutions',
          email: 'contact@techcorp.com',
          phone: '+1-555-0101',
          website: 'https://techcorp.com',
          reliabilityScore: 85,
          user_id: '00000000-0000-0000-0000-000000000000', // placeholder user ID
          notes: 'Reliable technology supplier'
        },
        {
          name: 'Global Supplies Inc',
          email: 'info@globalsupplies.com', 
          phone: '+1-555-0102',
          website: 'https://globalsupplies.com',
          reliabilityScore: 92,
          user_id: '00000000-0000-0000-0000-000000000000',
          notes: 'Premium supplier with excellent service'
        },
        {
          name: 'Local Materials Ltd',
          email: 'sales@localmaterials.com',
          phone: '+1-555-0103', 
          website: 'https://localmaterials.com',
          reliabilityScore: 78,
          user_id: '00000000-0000-0000-0000-000000000000',
          notes: 'Local supplier with competitive prices'
        }
      ])
      .select();

    console.log('✅ Added suppliers:', suppliers?.length || 0);

    // Add sample products  
    const { data: products, error: productsError } = await supabase
      .from('products')
      .insert([
        {
          name: 'Wireless Mouse',
          description: 'Ergonomic wireless mouse with long battery life',
          category: 'Electronics',
          user_id: '00000000-0000-0000-0000-000000000000'
        },
        {
          name: 'Office Chair',
          description: 'Comfortable ergonomic office chair with lumbar support',
          category: 'Furniture', 
          user_id: '00000000-0000-0000-0000-000000000000'
        },
        {
          name: 'USB Cable',
          description: 'High-quality USB-C cable 2 meters',
          category: 'Accessories',
          user_id: '00000000-0000-0000-0000-000000000000'
        }
      ])
      .select();

    console.log('✅ Added products:', products?.length || 0);

    // Add sample supplier emails
    if (suppliers && suppliers.length > 0) {
      const { data: emails, error: emailsError } = await supabase
        .from('supplier_emails')
        .insert([
          {
            supplier_id: suppliers[0].id,
            subject: 'New Product Catalog Available',
            body: 'Dear customer, we have updated our product catalog with new items. Please review the attached catalog for the latest offerings.',
            sent_at: new Date().toISOString(),
            user_id: '00000000-0000-0000-0000-000000000000',
            processed: false
          },
          {
            supplier_id: suppliers[1].id,
            subject: 'Price Update Notification', 
            body: 'We are writing to inform you about updated pricing on select items. Please find the updated price list attached.',
            sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            user_id: '00000000-0000-0000-0000-000000000000',
            processed: false
          },
          {
            supplier_id: suppliers[2].id,
            subject: 'Weekly Newsletter',
            body: 'Stay updated with our weekly newsletter featuring new products, industry news, and special offers.',
            sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            user_id: '00000000-0000-0000-0000-000000000000', 
            processed: true
          }
        ])
        .select();

      console.log('✅ Added supplier emails:', emails?.length || 0);
    }

    // Add sample pricing data
    if (suppliers && products && suppliers.length > 0 && products.length > 0) {
      const { data: pricing, error: pricingError } = await supabase
        .from('supplier_pricing')
        .insert([
          {
            supplier_id: suppliers[0].id,
            product_id: products[0].id,
            price: 29.99,
            currency: 'USD',
            unit: 'each',
            user_id: '00000000-0000-0000-0000-000000000000'
          },
          {
            supplier_id: suppliers[1].id,
            product_id: products[1].id,
            price: 199.99,
            currency: 'USD',
            unit: 'each',
            user_id: '00000000-0000-0000-0000-000000000000'
          },
          {
            supplier_id: suppliers[2].id,
            product_id: products[2].id, 
            price: 15.99,
            currency: 'USD',
            unit: 'each',
            user_id: '00000000-0000-0000-0000-000000000000'
          }
        ])
        .select();

      console.log('✅ Added pricing data:', pricing?.length || 0);
    }

    // Add sample documents
    const { data: documents, error: documentsError } = await supabase
      .from('supplier_documents')
      .insert([
        {
          supplier_id: suppliers?.[0]?.id || null,
          document_type: 'quote',
          document_date: new Date().toISOString().split('T')[0],
          document_number: 'Q-2024-001',
          file_name: 'quote_techcorp_2024001.pdf',
          file_size: 245760,
          file_type: 'application/pdf',
          status: 'processed',
          user_id: '00000000-0000-0000-0000-000000000000'
        },
        {
          supplier_id: suppliers?.[1]?.id || null,
          document_type: 'invoice', 
          document_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          document_number: 'INV-2024-001',
          file_name: 'invoice_global_supplies.pdf',
          file_size: 156890,
          file_type: 'application/pdf',
          status: 'processed',
          user_id: '00000000-0000-0000-0000-000000000000'
        }
      ])
      .select();

    console.log('✅ Added documents:', documents?.length || 0);

    console.log('\n🎉 Sample analytics data added successfully!');
    console.log('📊 You should now see data in your analytics dashboard');
    console.log('🔗 Visit: http://localhost:3001/dashboard/analytics');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
    
    if (error.message.includes('permission denied')) {
      console.log('\n💡 Note: This script uses a placeholder user_id. In a real scenario, you would:');
      console.log('   1. Sign in to your application');
      console.log('   2. The data would be associated with your actual user ID');
      console.log('   3. The RLS policies would ensure you only see your own data');
    }
  }
}

// Run the script
addSampleData(); 