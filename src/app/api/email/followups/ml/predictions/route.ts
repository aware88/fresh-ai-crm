import { NextRequest, NextResponse } from 'next/server';
import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import { FollowUpMLService } from '@/lib/email/followup-ml-service';
import { FollowUpService } from '@/lib/email/follow-up-service';

const supabase = createLazyServerClient();

export async function POST(request: NextRequest) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { followupId, predictionType, contactContext } = body;

    if (!followupId || !predictionType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the follow-up
    const followUpService = new FollowUpService();
    const followups = await followUpService.getFollowups(session.user.id);
    const followup = followups.find(f => f.id === followupId);

    if (!followup) {
      return NextResponse.json(
        { error: 'Follow-up not found' },
        { status: 404 }
      );
    }

    const mlService = new FollowUpMLService();
    let prediction;

    switch (predictionType) {
      case 'response_likelihood':
        prediction = await mlService.predictResponseLikelihood(followup, contactContext);
        break;
      case 'optimal_timing':
        prediction = await mlService.predictOptimalTiming(followup, contactContext);
        break;
      case 'content_optimization':
        prediction = await mlService.getContentOptimization(followup, body.draftContent);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid prediction type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ prediction });
  } catch (error) {
    console.error('Error generating ML prediction:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}



