import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerClient } from '../../../../lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { 
      emailId, 
      originalDraft, 
      finalDraft, 
      changes, 
      userNotes, 
      draftId 
    } = await req.json();

    if (!emailId || !originalDraft || !finalDraft) {
      return NextResponse.json(
        { success: false, message: 'Email ID, original draft, and final draft are required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = await createServerClient();

    // Check if user has learning enabled
    const { data: userSettings } = await supabase
      .from('user_ai_email_settings')
      .select('learning_enabled, track_changes, data_retention')
      .eq('user_id', userId)
      .single();

    if (!userSettings?.learning_enabled) {
      return NextResponse.json(
        { success: false, message: 'Learning is disabled for this user' },
        { status: 400 }
      );
    }

    // Calculate learning metrics
    const learningMetrics = calculateLearningMetrics(originalDraft, finalDraft, changes);

    // Save learning data
    const learningId = uuidv4();
    const { error: learningError } = await supabase
      .from('ai_learning_data')
      .insert({
        id: learningId,
        user_id: userId,
        email_id: emailId,
        draft_id: draftId,
        original_subject: originalDraft.subject,
        original_body: originalDraft.body,
        final_subject: finalDraft.subject,
        final_body: finalDraft.body,
        changes_made: changes,
        user_notes: userNotes,
        learning_metrics: learningMetrics,
        created_at: new Date().toISOString()
      });

    if (learningError) {
      console.error('Error saving learning data:', learningError);
      return NextResponse.json(
        { success: false, message: 'Failed to save learning data' },
        { status: 500 }
      );
    }

    // Save individual changes for detailed analysis
    if (changes && changes.length > 0) {
      const changeRecords = changes.map((change: any) => ({
        id: uuidv4(),
        learning_data_id: learningId,
        user_id: userId,
        change_type: change.type,
        section: change.section,
        original_text: change.original,
        modified_text: change.modified,
        change_timestamp: change.timestamp,
        created_at: new Date().toISOString()
      }));

      const { error: changesError } = await supabase
        .from('ai_learning_changes')
        .insert(changeRecords);

      if (changesError) {
        console.error('Error saving change records:', changesError);
        // Don't fail the request, just log the error
      }
    }

    // Generate learning insights
    const insights = await generateLearningInsights(userId, learningMetrics, userNotes);

    // Save insights if they provide value
    if (insights && insights.length > 0) {
      const insightRecords = insights.map(insight => ({
        id: uuidv4(),
        learning_data_id: learningId,
        user_id: userId,
        insight_type: insight.type,
        insight_data: insight.data,
        confidence: insight.confidence,
        created_at: new Date().toISOString()
      }));

      const { error: insightsError } = await supabase
        .from('ai_learning_insights')
        .insert(insightRecords);

      if (insightsError) {
        console.error('Error saving learning insights:', insightsError);
      }
    }

    // Update user's AI improvement score
    await updateUserAIScore(userId, learningMetrics, supabase);

    return NextResponse.json({
      success: true,
      learningId,
      metrics: learningMetrics,
      insights: insights?.length || 0,
      message: 'Learning data saved successfully'
    });

  } catch (error) {
    console.error('Error in AI learning endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error' 
      },
      { status: 500 }
    );
  }
}

function calculateLearningMetrics(originalDraft: any, finalDraft: any, changes: any[]) {
  const metrics = {
    totalChanges: changes?.length || 0,
    subjectChanged: originalDraft.subject !== finalDraft.subject,
    bodyChanged: originalDraft.body !== finalDraft.body,
    lengthChange: finalDraft.body.length - originalDraft.body.length,
    lengthChangePercentage: ((finalDraft.body.length - originalDraft.body.length) / originalDraft.body.length) * 100,
    wordsAdded: 0,
    wordsRemoved: 0,
    sentimentChange: 0, // Could be enhanced with sentiment analysis
    changeTypes: {}
  };

  // Calculate word changes
  const originalWords = originalDraft.body.split(/\s+/).length;
  const finalWords = finalDraft.body.split(/\s+/).length;
  
  metrics.wordsAdded = Math.max(0, finalWords - originalWords);
  metrics.wordsRemoved = Math.max(0, originalWords - finalWords);

  // Categorize change types
  if (changes) {
    const changeTypeCounts = changes.reduce((acc, change) => {
      acc[change.type] = (acc[change.type] || 0) + 1;
      return acc;
    }, {});
    
    metrics.changeTypes = changeTypeCounts;
  }

  return metrics;
}

async function generateLearningInsights(userId: string, metrics: any, userNotes?: string) {
  const insights = [];

  // Pattern insights
  if (metrics.lengthChangePercentage > 20) {
    insights.push({
      type: 'length_preference',
      data: {
        preference: 'longer',
        percentage: metrics.lengthChangePercentage
      },
      confidence: 0.7
    });
  } else if (metrics.lengthChangePercentage < -20) {
    insights.push({
      type: 'length_preference',
      data: {
        preference: 'shorter',
        percentage: Math.abs(metrics.lengthChangePercentage)
      },
      confidence: 0.7
    });
  }

  // Subject line insights
  if (metrics.subjectChanged) {
    insights.push({
      type: 'subject_modification',
      data: {
        frequency: 'modified',
        notes: userNotes || 'No notes provided'
      },
      confidence: 0.8
    });
  }

  // Change pattern insights
  if (metrics.changeTypes.modified > metrics.changeTypes.added) {
    insights.push({
      type: 'editing_pattern',
      data: {
        pattern: 'modifier',
        description: 'User prefers to modify existing content rather than add new content'
      },
      confidence: 0.6
    });
  }

  // User notes insights
  if (userNotes) {
    insights.push({
      type: 'user_feedback',
      data: {
        notes: userNotes,
        timestamp: new Date().toISOString()
      },
      confidence: 0.9
    });
  }

  return insights;
}

async function updateUserAIScore(userId: string, metrics: any, supabase: any) {
  try {
    // Get current user AI score
    const { data: currentScore } = await supabase
      .from('user_ai_scores')
      .select('*')
      .eq('user_id', userId)
      .single();

    const improvement = calculateImprovementScore(metrics);
    const newScore = currentScore 
      ? Math.min(100, currentScore.score + improvement)
      : 50 + improvement;

    // Update or insert score
    const { error } = await supabase
      .from('user_ai_scores')
      .upsert({
        user_id: userId,
        score: newScore,
        total_interactions: (currentScore?.total_interactions || 0) + 1,
        last_interaction: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating user AI score:', error);
    }
  } catch (error) {
    console.error('Error in updateUserAIScore:', error);
  }
}

function calculateImprovementScore(metrics: any): number {
  // Simple scoring algorithm - can be enhanced
  let score = 0;
  
  // Fewer changes = better AI performance
  if (metrics.totalChanges === 0) {
    score += 5;
  } else if (metrics.totalChanges < 3) {
    score += 2;
  } else if (metrics.totalChanges < 5) {
    score += 1;
  }

  // Moderate length changes are good
  if (Math.abs(metrics.lengthChangePercentage) < 10) {
    score += 3;
  } else if (Math.abs(metrics.lengthChangePercentage) < 25) {
    score += 1;
  }

  // Subject not changed is good
  if (!metrics.subjectChanged) {
    score += 2;
  }

  return Math.max(-2, Math.min(5, score)); // Cap between -2 and 5
} 