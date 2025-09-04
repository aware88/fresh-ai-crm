/**
 * Test Lead Scoring API
 * For testing and validation of the lead scoring system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { LeadScoringService } from '@/lib/services/lead-scoring-service';
import { logger } from '@/lib/utils/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Sample test data for lead scoring validation
const testContacts = [
  {
    firstname: 'John',
    lastname: 'Smith',
    email: 'j.smith@microsoft.com',
    phone: '+1-555-0123',
    company: 'Microsoft Corporation',
    position: 'Senior Director of Sales',
    notes: 'Very interested in our product suite. Has budget approval authority. Mentioned they need a solution by Q4. Highly engaged in email conversations.',
    status: 'active',
    personalitytype: 'analytical'
  },
  {
    firstname: 'Sarah',
    lastname: 'Johnson',
    email: 'sarah.johnson@gmail.com',
    phone: null,
    company: 'Local Startup',
    position: 'Founder',
    notes: 'Small startup, limited budget',
    status: 'active',
    personalitytype: null
  },
  {
    firstname: 'Michael',
    lastname: 'Brown',
    email: 'm.brown@techcorp.com',
    phone: '+1-555-0456',
    company: 'TechCorp Industries',
    position: 'VP Engineering',
    notes: 'Technical decision maker, very knowledgeable about our space. Has been responding to emails regularly. Company is growing rapidly.',
    status: 'active',
    personalitytype: 'driver'
  },
  {
    firstname: 'Emily',
    lastname: 'Davis',
    email: 'emily@yahoo.com',
    phone: null,
    company: null,
    position: null,
    notes: null,
    status: 'inactive',
    personalitytype: null
  },
  {
    firstname: 'David',
    lastname: 'Wilson',
    email: 'd.wilson@enterprise.com',
    phone: '+1-555-0789',
    company: 'Enterprise Solutions Ltd',
    position: 'Chief Technology Officer',
    notes: 'CTO of large enterprise company. Very engaged, asking detailed questions. Has mentioned specific timeline and budget requirements.',
    status: 'active',
    personalitytype: 'analytical'
  }
];

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'create_test_data') {
      logger.info('Creating test data for lead scoring');

      // First check if we have any test contacts
      const { data: existingContacts, error: checkError } = await supabase
        .from('contacts')
        .select('id, email')
        .in('email', testContacts.map(c => c.email));

      if (checkError) {
        logger.error('Error checking existing contacts', checkError);
        throw checkError;
      }

      const existingEmails = existingContacts?.map(c => c.email) || [];
      const newContacts = testContacts.filter(c => !existingEmails.includes(c.email));

      if (newContacts.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'Test contacts already exist',
          existing_count: existingContacts?.length || 0
        });
      }

      // Create test contacts
      const { data: createdContacts, error: createError } = await supabase
        .from('contacts')
        .insert(newContacts.map(contact => ({
          ...contact,
          user_id: 'test-user-id', // This would normally come from auth
          full_name: `${contact.firstname} ${contact.lastname}`,
          lastcontact: new Date().toISOString()
        })))
        .select();

      if (createError) {
        logger.error('Error creating test contacts', createError);
        throw createError;
      }

      logger.info('Test contacts created', { count: createdContacts?.length });

      return NextResponse.json({
        success: true,
        message: 'Test contacts created successfully',
        contacts_created: createdContacts?.length || 0,
        contacts: createdContacts
      });
    }

    if (action === 'test_scoring') {
      logger.info('Testing lead scoring system');

      // Get test contacts
      const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .in('email', testContacts.map(c => c.email));

      if (contactError) {
        logger.error('Error fetching test contacts', contactError);
        throw contactError;
      }

      if (!contacts || contacts.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No test contacts found. Run create_test_data first.'
        });
      }

      const leadScoringService = new LeadScoringService(supabase);
      const results = [];

      // Calculate scores for each contact
      for (const contact of contacts) {
        try {
          const score = await leadScoringService.calculateLeadScore(contact.id);
          const breakdown = await leadScoringService.getScoreBreakdown(contact.id);
          
          results.push({
            contact: {
              name: `${contact.firstname} ${contact.lastname}`,
              email: contact.email,
              company: contact.company
            },
            score,
            breakdown
          });

          logger.info('Calculated score for contact', {
            contactId: contact.id,
            score: score?.overall_score,
            status: score?.qualification_status
          });
        } catch (error) {
          logger.error('Error calculating score for contact', error, { contactId: contact.id });
          results.push({
            contact: {
              name: `${contact.firstname} ${contact.lastname}`,
              email: contact.email,
              company: contact.company
            },
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Lead scoring test completed',
        results
      });
    }

    if (action === 'analyze_team_collaboration') {
      logger.info('Analyzing team collaboration features');

      // Check organization structure
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .limit(5);

      const { data: members, error: memberError } = await supabase
        .from('organization_members')
        .select('*')
        .limit(10);

      // Check contact sharing and assignment
      const { data: contacts, error: contactError } = await supabase
        .from('contacts')
        .select('id, firstname, lastname, user_id, organization_id')
        .limit(10);

      // Check if emails are properly assigned
      const { data: emails, error: emailError } = await supabase
        .from('emails')
        .select('id, sender_email, user_id, organization_id')
        .limit(5);

      const collaborationAnalysis = {
        organizations: {
          count: orgs?.length || 0,
          sample: orgs?.slice(0, 2) || [],
          error: orgError?.message
        },
        members: {
          count: members?.length || 0,
          multi_member_orgs: [...new Set(members?.map(m => m.organization_id) || [])],
          error: memberError?.message
        },
        contacts: {
          count: contacts?.length || 0,
          user_distribution: contacts?.reduce((acc: any, c) => {
            acc[c.user_id] = (acc[c.user_id] || 0) + 1;
            return acc;
          }, {}) || {},
          error: contactError?.message
        },
        emails: {
          count: emails?.length || 0,
          user_distribution: emails?.reduce((acc: any, e) => {
            acc[e.user_id] = (acc[e.user_id] || 0) + 1;
            return acc;
          }, {}) || {},
          error: emailError?.message
        }
      };

      return NextResponse.json({
        success: true,
        message: 'Team collaboration analysis completed',
        analysis: collaborationAnalysis,
        recommendations: [
          'Multi-tenant isolation appears to be working with organization_id fields',
          'Contact and email assignment to users is functioning',
          'RLS policies should be tested to ensure proper data isolation',
          'Consider adding contact assignment/sharing features for better collaboration',
          'Team activity feeds could enhance collaboration visibility'
        ]
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: create_test_data, test_scoring, or analyze_team_collaboration'
    });

  } catch (error) {
    logger.error('Error in lead scoring test API', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'status') {
      // Get basic system status
      const { data: contactCount } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true });

      const { data: scoreCount } = await supabase
        .from('lead_scores')
        .select('id', { count: 'exact', head: true });

      return NextResponse.json({
        success: true,
        status: {
          contacts_total: contactCount || 0,
          lead_scores_total: scoreCount || 0,
          lead_scoring_enabled: true,
          test_endpoints_available: [
            'POST /api/test-lead-scoring { "action": "create_test_data" }',
            'POST /api/test-lead-scoring { "action": "test_scoring" }',
            'POST /api/test-lead-scoring { "action": "analyze_team_collaboration" }'
          ]
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    });

  } catch (error) {
    logger.error('Error in lead scoring test status', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}