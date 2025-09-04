import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { FollowUpService } from '@/lib/email/follow-up-service';

/**
 * POST /api/email/followups/sync
 * Sync follow-ups from existing emails that were sent but don't have follow-up tracking
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const followUpService = new FollowUpService();

    // Get organization ID
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', session.user.id)
      .single();

    const organizationId = preferences?.current_organization_id;

    // Get the last follow-up sync time from user preferences or email accounts
    const { data: emailAccount } = await supabase
      .from('email_accounts')
      .select('last_sync_at, email_address, last_followup_sync_at')
      .eq('user_id', session.user.id)
      .single();

    // Determine sync start time - either from last follow-up sync or 6 months ago for first sync
    const lastFollowupSync = emailAccount?.last_followup_sync_at;
    const syncStartTime = lastFollowupSync 
      ? new Date(lastFollowupSync)
      : (() => {
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          return sixMonthsAgo;
        })();

    const userEmailAddress = emailAccount?.email_address || 'tim.mak@bulknutrition.eu';

    console.log(`[FollowUpSync] Syncing emails since: ${syncStartTime.toISOString()}`);
    console.log(`[FollowUpSync] User email address: ${userEmailAddress}`);

    // Get processed emails since last follow-up sync
    const { data: allEmails, error } = await supabase
      .from('emails')
      .select(`
        id,
        subject,
        from_address,
        to_address,
        sender,
        created_at,
        message_id,
        body_text,
        body_html
      `)
      .or(`user_id.eq.${session.user.id},organization_id.eq.${organizationId}`)
      .gte('created_at', syncStartTime.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching emails:', error);
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }

    let createdCount = 0;
    let skippedCount = 0;
    let responseCount = 0;

    for (const email of allEmails || []) {
      try {
        if (!email || !email.subject) continue;

        // Determine if this is an outbound email (sent by user) or inbound (received)
        const isOutbound = email.from_address === userEmailAddress || email.sender === userEmailAddress;
        
        if (isOutbound) {
          // This is an email YOU sent - create follow-up tracking
          
          // Skip if this is a reply (starts with Re:)
          if (email.subject.toLowerCase().startsWith('re:')) {
            skippedCount++;
            continue;
          }

          // Check if follow-up already exists
          const { data: existingFollowUp } = await supabase
            .from('email_followups')
            .select('id')
            .eq('email_id', email.id)
            .eq('user_id', session.user.id)
            .single();

          if (existingFollowUp) {
            skippedCount++;
            continue;
          }

          // Create follow-up for this sent email
          const recipients = email.to_address ? [email.to_address] : [];
          
          await followUpService.trackSentEmail({
            emailId: email.id,
            userId: session.user.id,
            organizationId: organizationId,
            subject: email.subject,
            recipients: recipients,
            sentAt: new Date(email.created_at),
            autoFollowup: true,
            followUpDays: 3,
            priority: 'medium'
          });

          createdCount++;
          console.log(`✅ Created follow-up for sent email: ${email.subject}`);

        } else {
          // This is an email you RECEIVED - check if it's a response to any follow-up
          
          if (email.subject.toLowerCase().startsWith('re:')) {
            // This might be a response to a follow-up
            const originalSubject = email.subject.replace(/^re:\s*/i, '');
            
            // Find any follow-ups that might match this response
            const { data: matchingFollowups } = await supabase
              .from('email_followups')
              .select('id, status')
              .eq('user_id', session.user.id)
              .ilike('original_subject', `%${originalSubject}%`)
              .in('status', ['pending', 'due', 'overdue']);

            if (matchingFollowups && matchingFollowups.length > 0) {
              // Mark the follow-up as completed (response received)
              for (const followup of matchingFollowups) {
                await supabase
                  .from('email_followups')
                  .update({
                    status: 'completed',
                    response_received_at: email.created_at,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', followup.id);
                
                responseCount++;
                console.log(`✅ Marked follow-up as completed (response received): ${originalSubject}`);
              }
            }
          }
        }

      } catch (emailError) {
        console.error('Error processing email:', emailError);
        skippedCount++;
      }
    }

    // Update the last follow-up sync timestamp
    const syncCompletedAt = new Date().toISOString();
    if (emailAccount) {
      try {
        await supabase
          .from('email_accounts')
          .update({ 
            last_followup_sync_at: syncCompletedAt,
            updated_at: syncCompletedAt
          })
          .eq('user_id', session.user.id);
      } catch (updateError) {
        console.warn('Could not update last_followup_sync_at (column may not exist yet):', updateError);
        // Continue without failing - the sync data is still valid
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sync completed: ${createdCount} follow-ups created, ${responseCount} responses matched, ${skippedCount} skipped`,
      created: createdCount,
      responses: responseCount,
      skipped: skippedCount,
      totalEmails: allEmails?.length || 0,
      syncedAt: syncCompletedAt,
      lastSyncWas: lastFollowupSync || 'Never',
      emailsProcessedSince: syncStartTime.toISOString()
    });

  } catch (error) {
    console.error('Error syncing follow-ups:', error);
    return NextResponse.json(
      { error: 'Failed to sync follow-ups' },
      { status: 500 }
    );
  }
}
