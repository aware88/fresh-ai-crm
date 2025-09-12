import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * GET /api/email/draft?emailId=xxx
 * 
 * Retrieve pre-generated draft for an email (instant retrieval)
 * This is called when user clicks "Draft" button for instant response
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');

    if (!emailId) {
      return NextResponse.json(
        { error: 'emailId parameter is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Retrieving draft for email ${emailId} for user ${userId}`);

    // Get Supabase client
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // First, try to get cached draft
    const { data: cachedDraft, error: cacheError } = await supabase
      .from('email_drafts_cache')
      .select('*')
      .eq('email_id', emailId)
      .eq('user_id', userId)
      .eq('status', 'ready')
      .gt('expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (cachedDraft && !cacheError) {
      console.log(`[API] Found cached draft with confidence ${cachedDraft.confidence_score}`);
      
      // Mark draft as used
      await supabase
        .from('email_drafts_cache')
        .update({ 
          status: 'used', 
          used_at: new Date().toISOString() 
        })
        .eq('id', cachedDraft.id);

      // Update pattern usage if patterns were matched
      if (cachedDraft.matched_patterns && cachedDraft.matched_patterns.length > 0) {
        await Promise.all(
          cachedDraft.matched_patterns.map(async (patternId: string) => {
            await supabase.rpc('update_pattern_usage', {
              p_pattern_id: patternId,
              p_was_successful: true
            });
          })
        );
      }

      return NextResponse.json({
        success: true,
        source: 'cache',
        draft: {
          id: cachedDraft.id,
          subject: cachedDraft.subject,
          body: cachedDraft.body,
          confidence: cachedDraft.confidence_score,
          tone: cachedDraft.tone,
          generation_model: cachedDraft.generation_model,
          matched_patterns: cachedDraft.matched_patterns || [],
          pattern_match_score: cachedDraft.pattern_match_score || 0,
          was_fallback: cachedDraft.fallback_generation || false,
          generated_at: cachedDraft.generated_at
        },
        metadata: {
          generation_cost_usd: cachedDraft.generation_cost_usd || 0,
          generation_tokens: cachedDraft.generation_tokens || 0,
          cache_hit: true,
          retrieval_time_ms: 0 // Instant retrieval
        }
      });
    }

    console.log(`[API] No cached draft found, generating new draft in real-time`);

    // If no cached draft, generate one in real-time using learning service
    const { default: EmailLearningService } = await import('@/lib/email/email-learning-service');
    const learningService = new EmailLearningService();
    
    const startTime = Date.now();
    const learningResult = await learningService.generateBackgroundDraft(
      emailId,
      userId,
      undefined // organizationId
    );

    const retrievalTime = Date.now() - startTime;

    if (learningResult.success && learningResult.draft) {
      console.log(`[API] Generated real-time draft with confidence ${learningResult.draft.confidence}`);
      
      return NextResponse.json({
        success: true,
        source: 'realtime',
        draft: {
          id: learningResult.draft.id,
          subject: learningResult.draft.subject,
          body: learningResult.draft.body,
          confidence: learningResult.draft.confidence,
          tone: 'professional',
          generation_model: 'learning-based',
          matched_patterns: learningResult.draft.matched_patterns || [],
          pattern_match_score: 0,
          was_fallback: learningResult.draft.matched_patterns.length === 0,
          generated_at: new Date().toISOString()
        },
        metadata: {
          generation_cost_usd: 0, // Will be tracked separately
          generation_tokens: 0,
          cache_hit: false,
          retrieval_time_ms: retrievalTime
        }
      });
    } else {
      // Final fallback to original email generation API
      console.log(`[API] Learning-based generation failed, using fallback API`);
      
      const { data: email } = await supabase
        .from('emails')
        .select('raw_content, plain_content, sender, from_address, subject')
        .eq('id', emailId)
        .eq('user_id', userId)
        .single();

      if (!email) {
        return NextResponse.json(
          { error: 'Email not found' },
          { status: 404 }
        );
      }

      // Call original generation API as final fallback
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resp = await fetch(`${appUrl}/api/email/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalEmail: email.raw_content || email.plain_content || '',
          senderEmail: email.sender || email.from_address || '',
          tone: 'professional',
          customInstructions: '',
          emailId: emailId,
          settings: { includeContext: true },
          includeDrafting: true
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        return NextResponse.json({
          success: true,
          source: 'fallback',
          draft: {
            id: 'fallback-' + Date.now(),
            subject: data.subject || `Re: ${email.subject || ''}`,
            body: data.response || data.body || '',
            confidence: typeof data.confidence === 'number' ? data.confidence : 0.6,
            tone: 'professional',
            generation_model: 'fallback-api',
            matched_patterns: [],
            pattern_match_score: 0,
            was_fallback: true,
            generated_at: new Date().toISOString()
          },
          metadata: {
            generation_cost_usd: 0,
            generation_tokens: 0,
            cache_hit: false,
            retrieval_time_ms: Date.now() - startTime
          }
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to generate draft' },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('[API] Error retrieving email draft:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve draft',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/draft
 * 
 * Update draft based on user feedback (for learning)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    
    // Check if this is a new draft save (has to, subject, body fields) or feedback update (has draftId)
    const isDraftSave = body.to || body.subject || body.body;
    const isFeedbackUpdate = body.draftId || body.userFeedback;

    if (isDraftSave) {
      // Handle new draft saving
      console.log('[API] Saving new draft for user', userId);
      
      const { 
        to = [], 
        cc = [], 
        bcc = [], 
        subject = '', 
        body = '', 
        accountId,
        priority = 'normal'
      } = body;

      // Get Supabase client
      const cookieStore = await cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

      // Save draft to database using email_drafts_cache table
      const draftId = `user-draft-${Date.now()}`;
      const { data: savedDraft, error: saveError } = await supabase
        .from('email_drafts_cache')
        .insert({
          id: draftId,
          user_id: userId,
          email_id: null, // This is a new draft, not a reply
          subject: subject,
          body: body,
          confidence_score: 1.0, // User created, so high confidence
          generation_model: 'user-created',
          status: 'draft',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          generated_at: new Date().toISOString(),
          metadata: JSON.stringify({
            to_addresses: to,
            cc_addresses: cc,
            bcc_addresses: bcc,
            priority: priority,
            account_id: accountId
          })
        })
        .select()
        .single();

      if (saveError) {
        console.error('[API] Error saving draft:', saveError);
        return NextResponse.json(
          { error: 'Failed to save draft', details: saveError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Draft saved successfully',
        draft: savedDraft
      });
    }

    // Handle feedback update (existing functionality)
    const { 
      draftId, 
      emailId,
      finalSubject, 
      finalBody, 
      userFeedback, // 'approved', 'edited', 'rejected', 'regenerated'
      userNotes 
    } = body;

    if (!draftId && !emailId) {
      return NextResponse.json(
        { error: 'Either draftId or emailId is required for feedback updates' },
        { status: 400 }
      );
    }

    console.log(`[API] Updating draft feedback: ${userFeedback} for draft ${draftId || 'unknown'}`);

    // Get Supabase client
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Update draft cache with user feedback
    if (draftId) {
      const { error: updateError } = await supabase
        .from('email_drafts_cache')
        .update({
          user_feedback: userFeedback,
          status: userFeedback === 'approved' ? 'used' : 
                  userFeedback === 'edited' ? 'edited' : 
                  userFeedback === 'rejected' ? 'rejected' : 'used'
        })
        .eq('id', draftId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('[API] Error updating draft feedback:', updateError);
      }

      // Enhanced feedback analysis for learning improvement
      if (userFeedback === 'edited' && finalSubject && finalBody) {
        // Get the original draft to compare changes
        const { data: originalDraft } = await supabase
          .from('email_drafts_cache')
          .select('subject, body, matched_patterns, confidence_score')
          .eq('id', draftId)
          .single();

        if (originalDraft) {
          // Analyze the differences for learning
          const subjectChanged = originalDraft.subject !== finalSubject;
          const bodyChanged = originalDraft.body !== finalBody;
          
          // Calculate edit similarity (how much was changed)
          const editSimilarity = calculateEditSimilarity(
            originalDraft.body,
            finalBody
          );
          
          // Update pattern success rates with nuanced feedback
          const wasSuccessful = editSimilarity > 0.8; // High similarity = successful pattern
          const partialSuccess = editSimilarity > 0.6 && editSimilarity <= 0.8;
          
          if (originalDraft.matched_patterns && originalDraft.matched_patterns.length > 0) {
            await Promise.all(
              originalDraft.matched_patterns.map(async (patternId: string) => {
                await supabase.rpc('update_pattern_usage', {
                  p_pattern_id: patternId,
                  p_was_successful: wasSuccessful
                });
                
                // Record detailed feedback for pattern improvement
                await supabase
                  .from('pattern_feedback_log')
                  .insert({
                    pattern_id: patternId,
                    draft_id: draftId,
                    user_id: userId,
                    original_content: originalDraft.body,
                    final_content: finalBody,
                    edit_similarity: editSimilarity,
                    subject_changed: subjectChanged,
                    body_changed: bodyChanged,
                    feedback_type: userFeedback,
                    confidence_score: originalDraft.confidence_score
                  })
                  .select()
                  .single();
              })
            );
          }

          console.log(`[API] Enhanced feedback recorded: ${editSimilarity.toFixed(2)} similarity, ${originalDraft.matched_patterns?.length || 0} patterns`);
        }
      } else if (userFeedback === 'approved' || userFeedback === 'rejected') {
        // Record simple feedback for approved/rejected drafts
        const { data: originalDraft } = await supabase
          .from('email_drafts_cache')
          .select('matched_patterns')
          .eq('id', draftId)
          .single();

        if (originalDraft?.matched_patterns) {
          const wasSuccessful = userFeedback === 'approved';
          await Promise.all(
            originalDraft.matched_patterns.map(async (patternId: string) => {
              await supabase.rpc('update_pattern_usage', {
                p_pattern_id: patternId,
                p_was_successful: wasSuccessful
              });
            })
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Draft feedback recorded successfully'
    });

  } catch (error) {
    console.error('[API] Error updating draft feedback:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update draft feedback',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate similarity between original and edited content
 * Returns a score between 0 (completely different) and 1 (identical)
 */
function calculateEditSimilarity(original: string, edited: string): number {
  if (!original || !edited) return 0;
  if (original === edited) return 1;

  // Normalize text for comparison
  const normalizeText = (text: string) => 
    text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

  const originalNorm = normalizeText(original);
  const editedNorm = normalizeText(edited);

  // Split into words
  const originalWords = originalNorm.split(' ');
  const editedWords = editedNorm.split(' ');

  // Calculate Jaccard similarity (intersection over union)
  const originalSet = new Set(originalWords);
  const editedSet = new Set(editedWords);
  
  const intersection = new Set([...originalSet].filter(word => editedSet.has(word)));
  const union = new Set([...originalSet, ...editedSet]);

  const jaccardSimilarity = intersection.size / union.size;

  // Calculate length similarity
  const lengthSimilarity = 1 - Math.abs(originalWords.length - editedWords.length) / Math.max(originalWords.length, editedWords.length);

  // Combined similarity score (weighted average)
  return (jaccardSimilarity * 0.7) + (lengthSimilarity * 0.3);
}
