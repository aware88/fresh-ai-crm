import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { EmailService } from '@/lib/services/email-service';
import { RoleService } from '@/services/role-service';

// This endpoint processes pending emails in the queue
// It can be triggered by a cron job or manually by an admin
export async function POST() {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if user has admin permissions using RoleService
    const userId = session.user.id;
    const isSystemAdmin = await RoleService.isSystemAdmin(userId);
    
    if (!isSystemAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = await createClient();
    const emailService = new EmailService();
    
    // Get pending emails with limit
    const { data: pendingEmails, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (error) {
      console.error('Error fetching pending emails:', error);
      return NextResponse.json({ error: 'Failed to fetch pending emails' }, { status: 500 });
    }
    
    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({ message: 'No pending emails to process' });
    }
    
    // Process each email
    const results = await Promise.allSettled(
      pendingEmails.map(async (email: any) => {
        try {
          // Update status to processing
          await supabase
            .from('email_queue')
            .update({
              status: 'processing',
              processing_attempts: (email.processing_attempts || 0) + 1,
              last_processed_at: new Date().toISOString()
            })
            .eq('id', email.id);
          
          // In a real implementation, this would send the email via a service like SendGrid, AWS SES, etc.
          // For now, we'll simulate successful sending
          const success = Math.random() > 0.1; // 90% success rate for simulation
          
          if (success) {
            // Mark as sent
            await supabase
              .from('email_queue')
              .update({
                status: 'sent',
                updated_at: new Date().toISOString()
              })
              .eq('id', email.id);
            
            return { id: email.id, success: true };
          } else {
            // Mark as failed
            await supabase
              .from('email_queue')
              .update({
                status: 'failed',
                error_message: 'Simulated failure',
                updated_at: new Date().toISOString(),
                requires_manual_review: email.processing_attempts >= 2
              })
              .eq('id', email.id);
            
            return { id: email.id, success: false, error: 'Simulated failure' };
          }
        } catch (error) {
          console.error(`Error processing email ${email.id}:`, error);
          
          // Update with error
          await supabase
            .from('email_queue')
            .update({
              status: 'failed',
              error_message: String(error),
              updated_at: new Date().toISOString()
            })
            .eq('id', email.id);
          
          return { id: email.id, success: false, error };
        }
      })
    );
    
    // Count successes and failures
    const successes = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failures = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
    
    return NextResponse.json({
      message: `Processed ${results.length} emails`,
      details: {
        total: results.length,
        successes,
        failures
      }
    });
  } catch (error) {
    console.error('Error in email queue processing:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}