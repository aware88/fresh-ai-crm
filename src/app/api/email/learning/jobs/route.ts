import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmailLearningJobService } from '@/lib/jobs/email-learning-job';

/**
 * POST /api/email/learning/jobs
 * Start a new email learning job
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      maxEmails = 1000,
      daysBack = 90,
      organizationId,
      accountId
    } = body;

    const jobService = new EmailLearningJobService();
    const result = await jobService.startEmailLearningJob(session.user.id, {
      maxEmails,
      daysBack,
      organizationId,
      accountId
    });

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('[API] Error starting email learning job:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to start email learning job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/email/learning/jobs
 * Get active jobs for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const jobService = new EmailLearningJobService();
    const jobs = await jobService.getUserActiveJobs(session.user.id);

    return NextResponse.json({
      success: true,
      jobs
    });

  } catch (error) {
    console.error('[API] Error getting email learning jobs:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get email learning jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
