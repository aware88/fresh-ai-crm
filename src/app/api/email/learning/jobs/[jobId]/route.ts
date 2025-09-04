import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EmailLearningJobService } from '@/lib/jobs/email-learning-job';

/**
 * GET /api/email/learning/jobs/[jobId]
 * Get progress for a specific job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { jobId } = await params;
    const jobService = new EmailLearningJobService();
    const job = await jobService.getJobProgress(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify the job belongs to the current user
    if (job.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      job
    });

  } catch (error) {
    console.error('[API] Error getting job progress:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get job progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
