import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    // Get the current email account
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('email', 'tim.mak@bulknutrition.eu')
      .single();

    if (error || !accounts) {
      return NextResponse.json({ error: 'Email account not found' }, { status: 404 });
    }

    // Try port 587 first (STARTTLS - most common)
    console.log('🔄 Trying SMTP port 587 (STARTTLS)...');
    
    const { data: updated587, error: error587 } = await supabase
      .from('email_accounts')
      .update({ 
        smtp_port: 587,
        smtp_security: 'STARTTLS'
      })
      .eq('id', accounts.id)
      .select()
      .single();

    if (error587) {
      console.error('Error updating to port 587:', error587);
      return NextResponse.json({ error: 'Failed to update SMTP settings' }, { status: 500 });
    }

    console.log('✅ Updated SMTP to port 587 with STARTTLS');

    return NextResponse.json({ 
      success: true, 
      message: 'Updated SMTP to port 587 (STARTTLS)',
      account: {
        email: updated587.email,
        smtp_host: updated587.smtp_host,
        smtp_port: updated587.smtp_port,
        smtp_security: updated587.smtp_security
      }
    });

  } catch (error) {
    console.error('Test SMTP ports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}














