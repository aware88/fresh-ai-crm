import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    // Fix the SMTP host to match Gmail screenshot: bulknutrition.eu (not mail.bulknutrition.eu)
    const { data, error } = await supabase
      .from('email_accounts')
      .update({ 
        smtp_host: 'bulknutrition.eu',  // Changed from mail.bulknutrition.eu
        smtp_port: 465,                 // Back to 465 as shown in Gmail
        smtp_security: 'SSL/TLS'        // SSL/TLS for port 465
      })
      .eq('email', 'tim.mak@bulknutrition.eu')
      .select();

    if (error) {
      console.error('Error updating SMTP host:', error);
      return NextResponse.json({ error: 'Failed to update SMTP host' }, { status: 500 });
    }

    console.log('✅ Updated SMTP host to bulknutrition.eu:465');

    return NextResponse.json({ 
      success: true, 
      message: 'Updated SMTP host to bulknutrition.eu:465',
      updated_accounts: data 
    });

  } catch (error) {
    console.error('Fix SMTP host error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}














