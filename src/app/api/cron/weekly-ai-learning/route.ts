import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { EmailLearningService } from '@/lib/email/email-learning-service';
import { aiNotificationService } from '@/lib/services/ai-notification-service';

/**
 * Weekly AI Learning Batch Job
 * 
 * Runs every Sunday at 2 AM to:
 * 1. Process new emails from the past week
 * 2. Update AI patterns with new learnings
 * 3. Send progress notifications to users
 * 
 * This is more efficient than learning after every email
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.CRON_SECRET_KEY;
    
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('🧠 Starting weekly AI learning batch job...');
    
    const supabase = createServiceRoleClient();
    const learningService = new EmailLearningService();
    
    // Get all active users with email accounts
    const { data: activeUsers, error: usersError } = await supabase
      .from('email_accounts')
      .select('user_id, id, email')
      .eq('is_active', true)
      .eq('real_time_sync_active', true);
    
    if (usersError || !activeUsers) {
      console.error('Failed to fetch active users:', usersError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch active users'
      }, { status: 500 });
    }
    
    // Group by user (a user might have multiple email accounts)
    const userMap = new Map<string, any[]>();
    activeUsers.forEach(account => {
      if (!userMap.has(account.user_id)) {
        userMap.set(account.user_id, []);
      }
      userMap.get(account.user_id)?.push(account);
    });
    
    console.log(`Found ${userMap.size} unique users with ${activeUsers.length} email accounts`);
    
    const results = {
      total_users: userMap.size,
      processed: 0,
      skipped: 0,
      failed: 0,
      patterns_created: 0,
      patterns_updated: 0,
      details: [] as any[]
    };
    
    // Process each user
    for (const [userId, accounts] of userMap) {
      try {
        console.log(`\n🔄 Processing user ${userId} with ${accounts.length} accounts...`);
        
        // Check when last learning was done
        const { data: lastLearning } = await supabase
          .from('email_learning_jobs')
          .select('completed_at')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();
        
        const lastLearningDate = lastLearning?.completed_at 
          ? new Date(lastLearning.completed_at)
          : new Date(0);
        
        const daysSinceLastLearning = Math.floor(
          (Date.now() - lastLearningDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Skip if learned recently (less than 5 days)
        if (daysSinceLastLearning < 5) {
          console.log(`⏭️ Skipping user ${userId} - last learning was ${daysSinceLastLearning} days ago`);
          results.skipped++;
          continue;
        }
        
        // Get new emails since last learning (or last 7 days)
        const sinceDate = new Date(Math.max(
          lastLearningDate.getTime(),
          Date.now() - 7 * 24 * 60 * 60 * 1000 // Max 7 days back
        ));
        
        let totalNewEmails = 0;
        let allNewEmails: any[] = [];
        
        for (const account of accounts) {
          const { data: newEmails, count } = await supabase
            .from('email_index')
            .select('*', { count: 'exact' })
            .eq('email_account_id', account.id)
            .gte('created_at', sinceDate.toISOString())
            .order('received_at', { ascending: false });
          
          if (newEmails && newEmails.length > 0) {
            totalNewEmails += newEmails.length;
            allNewEmails = allNewEmails.concat(newEmails);
          }
        }
        
        console.log(`Found ${totalNewEmails} new emails since ${sinceDate.toISOString()}`);
        
        // Skip if not enough new emails (need at least 10)
        if (totalNewEmails < 10) {
          console.log(`⏭️ Skipping user ${userId} - only ${totalNewEmails} new emails (need at least 10)`);
          results.skipped++;
          continue;
        }
        
        // Get existing patterns count before learning
        const { count: existingPatterns } = await supabase
          .from('email_patterns')
          .select('*', { count: 'exact' })
          .eq('user_id', userId);
        
        // Perform incremental learning
        console.log(`🤖 Running incremental learning for user ${userId}...`);
        
        const learningResult = await learningService.performIncrementalLearning(
          userId,
          undefined, // organizationId will be fetched internally
          accounts[0].id // Use first account ID
        );
        
        // Get new patterns count after learning
        const { count: newPatternsCount } = await supabase
          .from('email_patterns')
          .select('*', { count: 'exact' })
          .eq('user_id', userId);
        
        const patternsCreated = (newPatternsCount || 0) - (existingPatterns || 0);
        const patternsUpdated = learningResult.patterns_found - patternsCreated;
        
        console.log(`✅ Learning complete: ${patternsCreated} new patterns, ${patternsUpdated} updated`);
        
        // Get user's organization for notification
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', userId)
          .single();
        
        // Send weekly update notification if significant changes
        if ((patternsCreated > 0 || patternsUpdated > 5) && userData?.organization_id) {
          const weekNumber = Math.floor(daysSinceLastLearning / 7) + 1;
          
          await aiNotificationService.sendWeeklyLearningUpdate(
            userId,
            userData.organization_id,
            {
              newPatterns: patternsCreated,
              improvedPatterns: patternsUpdated,
              totalEmails: totalNewEmails,
              accuracyImprovement: Math.round(learningResult.quality_score * 10), // Approximate improvement
              weekNumber
            }
          );
        }
        
        results.processed++;
        results.patterns_created += patternsCreated;
        results.patterns_updated += patternsUpdated;
        
        results.details.push({
          user_id: userId,
          accounts: accounts.length,
          new_emails: totalNewEmails,
          patterns_created: patternsCreated,
          patterns_updated: patternsUpdated,
          quality_score: learningResult.quality_score
        });
        
      } catch (error) {
        console.error(`❌ Failed to process user ${userId}:`, error);
        results.failed++;
      }
    }
    
    // Check for milestone achievements
    for (const [userId, accounts] of userMap) {
      try {
        // Check total emails processed
        const { count: totalEmails } = await supabase
          .from('email_index')
          .select('*', { count: 'exact' })
          .in('email_account_id', accounts.map(a => a.id));
        
        // Check for milestones
        const milestones = [100, 1000, 5000, 10000];
        for (const milestone of milestones) {
          if (totalEmails && totalEmails >= milestone) {
            // Check if milestone was already sent
            const { data: existingNotification } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', userId)
              .eq('metadata->>milestone_type', 'emails_processed')
              .eq('metadata->>milestone_value', milestone)
              .single();
            
            if (!existingNotification) {
              const { data: userData } = await supabase
                .from('users')
                .select('organization_id')
                .eq('id', userId)
                .single();
              
              if (userData?.organization_id) {
                await aiNotificationService.sendMilestoneAchieved(
                  userId,
                  userData.organization_id,
                  {
                    type: 'emails_processed',
                    value: milestone
                  }
                );
              }
              break; // Only send one milestone at a time
            }
          }
        }
      } catch (error) {
        console.error(`Failed to check milestones for user ${userId}:`, error);
      }
    }
    
    console.log('\n📊 Weekly AI learning complete:', {
      users: results.total_users,
      processed: results.processed,
      skipped: results.skipped,
      failed: results.failed,
      patterns_created: results.patterns_created,
      patterns_updated: results.patterns_updated
    });
    
    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Weekly AI learning job failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST endpoint for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}