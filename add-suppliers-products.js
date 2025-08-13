/**
 * Seed a couple of suppliers and products for tim.mak@bulknutrition.eu
 * Run with: node add-suppliers-products.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function resolveUserIdByEmail(supabaseAdmin, email) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    return user ? user.id : null;
  } catch (e) {
    console.error('Failed to resolve user by email via admin API:', e.message || e);
    return null;
  }
}

async function resolveOrganizationId(supabaseAdmin, userId) {
  // Try user_preferences first, then organization_members
  const { data: prefs } = await supabaseAdmin
    .from('user_preferences')
    .select('current_organization_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (prefs?.current_organization_id) return prefs.current_organization_id;

  const { data: member } = await supabaseAdmin
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .maybeSingle();
  return member?.organization_id || null;
}

async function tryInsertVariants(supabaseAdmin, table, variantRowsList) {
  for (const rows of variantRowsList) {
    try {
      const { error } = await supabaseAdmin.from(table).insert(rows);
      if (!error) {
        console.log(`✅ Inserted into ${table} using a compatible schema variant`);
        return true;
      }
      console.warn(`Variant failed for ${table}:`, error.message);
    } catch (e) {
      console.warn(`Variant threw for ${table}:`, e.message || e);
    }
  }
  console.error(`❌ All insert variants failed for ${table}`);
  return false;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabaseAdmin = createClient(url, key);

  const targetEmail = 'tim.mak@bulknutrition.eu';
  let userId = await resolveUserIdByEmail(supabaseAdmin, targetEmail);
  if (!userId) {
    // Fallback to known ID seen in logs
    userId = '5f7cf338-4ac1-4bd9-960a-d12dc6ffdb03';
    console.log('Using fallback userId:', userId);
  } else {
    console.log('Resolved userId:', userId);
  }

  const organizationId = await resolveOrganizationId(supabaseAdmin, userId);
  if (!organizationId) {
    console.error('Could not resolve organization for user. Aborting.');
    process.exit(1);
  }
  console.log('Using organizationId:', organizationId);

  const now = new Date().toISOString();

  // Prepare suppliers - multiple schema variants
  const supplierBase = [
    { name: 'Acme Components', email: 'sales@acme-components.test', phone: '+386 31 000 111' },
    { name: 'Nordic Plastics', email: 'contact@nordicplastics.test', phone: '+386 31 000 222' },
  ];

  const supplierVariants = [
    // Most likely schema: name/email/phone + organization_id + user_id
    supplierBase.map((s) => ({
      name: s.name,
      email: s.email,
      phone: s.phone,
      organization_id: organizationId,
      user_id: userId,
      created_by: userId,
      created_at: now,
    })),
    // Alternative with supplier_name
    supplierBase.map((s) => ({
      supplier_name: s.name,
      email: s.email,
      phone: s.phone,
      organization_id: organizationId,
      user_id: userId,
      created_by: userId,
      created_at: now,
    })),
    // Minimal but still satisfies NOT NULLs
    supplierBase.map((s) => ({
      name: s.name,
      email: s.email,
      organization_id: organizationId,
      user_id: userId,
    })),
  ];

  const productsBase = [
    { name: 'Seat Protector XL', sku: 'SP-XL-001', price: 29.9 },
    { name: 'Trunk Organizer Pro', sku: 'TO-PRO-002', price: 39.9 },
    { name: 'Phone Holder MagMount', sku: 'PH-MM-003', price: 19.9 },
  ];

  const productVariants = [
    productsBase.map((p) => ({
      name: p.name,
      sku: p.sku,
      price: p.price,
      organization_id: organizationId,
      created_by: userId,
      created_at: now,
    })),
    productsBase.map((p) => ({
      product_name: p.name,
      sku: p.sku,
      unit_price: p.price,
      organization_id: organizationId,
      created_by: userId,
      created_at: now,
    })),
    productsBase.map((p) => ({
      name: p.name,
      organization_id: organizationId,
    })),
  ];

  console.log('Inserting suppliers...');
  await tryInsertVariants(supabaseAdmin, 'suppliers', supplierVariants);

  console.log('Inserting products...');
  await tryInsertVariants(supabaseAdmin, 'products', productVariants);

  console.log('Done. Refresh dashboard/analytics to see counts.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
