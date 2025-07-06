/**
 * API endpoint for processing contact messages through the sales agent
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SalesAgentService } from '@/lib/ai/agent/sales-agent-service';
import { ContactMessage } from '@/lib/ai/agent/types';
import { Database } from '@/types/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Create authenticated Supabase client
  const supabase = createServerSupabaseClient<Database>({ req, res });

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Extract organization context
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('organization_id, active')
      .eq('user_id', session.user.id)
      .single();

    if (!userProfile || !userProfile.active) {
      return res.status(403).json({ error: 'Forbidden: User inactive or not found' });
    }

    const organizationId = userProfile.organization_id;

    // Validate request body
    const { message } = req.body;

    if (!message || !message.conversation_id || !message.content || !message.metadata?.agent_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create contact message object
    const contactMessage: ContactMessage = {
      id: message.id || crypto.randomUUID(),
      organization_id: organizationId,
      contact_id: message.contact_id,
      conversation_id: message.conversation_id,
      content: message.content,
      sentiment: message.sentiment,
      intent: message.intent,
      metadata: message.metadata || {},
      created_at: new Date().toISOString()
    };

    // Store contact message in database if it doesn't have an ID (new message)
    if (!message.id) {
      const { error: insertError } = await supabase
        .from('contact_messages')
        .insert(contactMessage);

      if (insertError) {
        console.error('Error storing contact message:', insertError);
        return res.status(500).json({ error: 'Failed to store contact message' });
      }
    }

    // Process message with sales agent service
    const salesAgentService = new SalesAgentService();
    const { response, result } = await salesAgentService.processContactMessage(
      contactMessage,
      organizationId
    );

    // Return agent response and result
    return res.status(200).json({
      success: true,
      response,
      result
    });
  } catch (error: any) {
    console.error('Error processing agent message:', error);
    return res.status(500).json({
      error: 'Failed to process message',
      message: error.message
    });
  }
}
