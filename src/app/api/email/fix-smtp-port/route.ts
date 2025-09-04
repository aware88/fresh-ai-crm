import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    // Fix the incorrect SMTP port 486 to 465 for SSL/TLS
    const { data, error } = await supabase
      .from('email_accounts')
      .update({ smtp_port: 465 })
      .eq('smtp_port', 486)
      .eq('smtp_security', 'SSL/TLS')
      .select();

    if (error) {
      console.error('Error updating SMTP port:', error);
      return NextResponse.json({ error: 'Failed to update SMTP port' }, { status: 500 });
    }

    console.log('✅ Updated SMTP port from 486 to 465 for', data?.length || 0, 'accounts');

    return NextResponse.json({ 
      success: true, 
      message: `Updated ${data?.length || 0} email accounts`,
      updated_accounts: data 
    });

  } catch (error) {
    console.error('Fix SMTP port error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}














