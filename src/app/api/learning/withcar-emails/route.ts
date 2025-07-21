import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { 
  analyzeWithcarEmail, 
  batchAnalyzeWithcarEmails,
  storeEmailPatterns,
  getUserEmailStyleSummary
} from '@/lib/learning/email-pattern-analyzer';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * POST /api/learning/withcar-emails
 * Upload and analyze Withcar emails for learning
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emails, mode } = await request.json();
    
    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ 
        error: 'Invalid request. Expected "emails" array.' 
      }, { status: 400 });
    }

    if (emails.length === 0) {
      return NextResponse.json({ 
        error: 'No emails provided for analysis.' 
      }, { status: 400 });
    }

    // Validate email format
    const invalidEmails = emails.filter(email => 
      !email.content || typeof email.content !== 'string' || email.content.trim().length < 10
    );

    if (invalidEmails.length > 0) {
      return NextResponse.json({ 
        error: `${invalidEmails.length} emails have invalid or too short content.` 
      }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    if (mode === 'single' && emails.length === 1) {
      // Analyze single email
      const email = emails[0];
      
      try {
        // Store the email sample
        const { data: sampleData, error: sampleError } = await supabase
          .from('withcar_email_samples')
          .insert({
            user_id: session.user.id,
            original_subject: email.subject || 'Untitled',
            email_body: email.content,
            email_type: email.type || 'customer_response',
            processing_status: 'processing'
          })
          .select('id')
          .single();

        if (sampleError || !sampleData) {
          throw new Error('Failed to store email sample');
        }

        // Analyze the email
        const analysis = await analyzeWithcarEmail(
          email.content, 
          email.type || 'customer_response'
        );

        // Update with analysis results
        const { error: updateError } = await supabase
          .from('withcar_email_samples')
          .update({
            extracted_patterns: analysis.patterns,
            tone_analysis: analysis.toneAnalysis,
            key_phrases: analysis.keyPhrases,
            structure_analysis: analysis.structureAnalysis,
            processing_status: 'completed',
            analysis_completed_at: new Date().toISOString()
          })
          .eq('id', sampleData.id);

        if (updateError) {
          console.error('Error updating analysis:', updateError);
        }

        // Store patterns
        await storeEmailPatterns(session.user.id, sampleData.id, analysis);

        return NextResponse.json({
          success: true,
          message: 'Email analyzed successfully',
          analysis: {
            patterns: analysis.patterns,
            toneAnalysis: analysis.toneAnalysis,
            structureAnalysis: analysis.structureAnalysis,
            keyPhrases: analysis.keyPhrases.slice(0, 10), // Limit for response size
            language: analysis.language
          },
          sampleId: sampleData.id
        });

      } catch (error) {
        console.error('Error analyzing single email:', error);
        return NextResponse.json({
          error: 'Failed to analyze email',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }

    } else {
      // Batch analysis
      if (emails.length > 50) {
        return NextResponse.json({ 
          error: 'Maximum 50 emails per batch. Please split into smaller batches.' 
        }, { status: 400 });
      }

      try {
        const result = await batchAnalyzeWithcarEmails(
          session.user.id, 
          emails.map((email, index) => ({
            id: email.id || `batch-${index}`,
            content: email.content,
            type: email.type || 'customer_response',
            subject: email.subject,
            date: email.date
          }))
        );

        return NextResponse.json({
          success: true,
          message: `Batch analysis completed. ${result.processed} emails processed successfully.`,
          processed: result.processed,
          errors: result.errors,
          totalEmails: emails.length
        });

      } catch (error) {
        console.error('Error in batch analysis:', error);
        return NextResponse.json({
          error: 'Batch analysis failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error in Withcar email learning:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/learning/withcar-emails
 * Get user's learned patterns and email style summary
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    const supabase = createServiceRoleClient();

    if (action === 'summary') {
      // Get user's email style summary
      const styleSummary = await getUserEmailStyleSummary(session.user.id);
      
      return NextResponse.json({
        success: true,
        styleSummary
      });

    } else if (action === 'samples') {
      // Get user's uploaded email samples
      const { data: samples, error } = await supabase
        .from('withcar_email_samples')
        .select('id, original_subject, email_type, processing_status, created_at, analysis_completed_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw new Error('Failed to fetch email samples');
      }

      return NextResponse.json({
        success: true,
        samples: samples || []
      });

    } else if (action === 'patterns') {
      // Get user's learned patterns
      const category = searchParams.get('category'); // No default, allow all categories
      const patternType = searchParams.get('type');

      const { getLearnedPatterns } = await import('@/lib/learning/email-pattern-analyzer');
      const patterns = await getLearnedPatterns(
        session.user.id, 
        category || undefined, // Pass undefined to get all categories
        patternType || undefined
      );

      return NextResponse.json({
        success: true,
        patterns
      });

    } else {
      // Default: Get overview
      const styleSummary = await getUserEmailStyleSummary(session.user.id);
      
      const { data: recentSamples, error } = await supabase
        .from('withcar_email_samples')
        .select('id, original_subject, processing_status, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      return NextResponse.json({
        success: true,
        overview: {
          styleSummary,
          recentSamples: recentSamples || [],
          learningEnabled: true
        }
      });
    }

  } catch (error) {
    console.error('Error fetching learning data:', error);
    return NextResponse.json({
      error: 'Failed to fetch learning data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/learning/withcar-emails
 * Delete specific email samples or patterns
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sampleId = searchParams.get('sampleId');
    const action = searchParams.get('action');

    const supabase = createServiceRoleClient();

    if (action === 'reset_all') {
      // Reset all learned patterns for user
      const { error: patternsError } = await supabase
        .from('email_patterns')
        .delete()
        .eq('user_id', session.user.id);

      const { error: samplesError } = await supabase
        .from('withcar_email_samples')
        .delete()
        .eq('user_id', session.user.id);

      if (patternsError || samplesError) {
        throw new Error('Failed to reset learning data');
      }

      return NextResponse.json({
        success: true,
        message: 'All learning data has been reset'
      });

    } else if (sampleId) {
      // Delete specific sample and its patterns
      const { error: sampleError } = await supabase
        .from('withcar_email_samples')
        .delete()
        .eq('id', sampleId)
        .eq('user_id', session.user.id);

      // Delete associated patterns
      const { error: patternsError } = await supabase
        .from('email_patterns')
        .delete()
        .eq('user_id', session.user.id)
        .contains('extracted_from_email_ids', [sampleId]);

      if (sampleError || patternsError) {
        throw new Error('Failed to delete email sample');
      }

      return NextResponse.json({
        success: true,
        message: 'Email sample and associated patterns deleted'
      });

    } else {
      return NextResponse.json({
        error: 'Invalid delete request'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error deleting learning data:', error);
    return NextResponse.json({
      error: 'Failed to delete learning data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 