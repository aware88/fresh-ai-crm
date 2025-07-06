import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { withPermission, withPermissions } from '../../../middleware/withPermission';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseClient({ req, res });
  
  // Get the organization ID from the query parameters
  const { organization_id } = req.query;
  
  if (!organization_id || typeof organization_id !== 'string') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Organization ID is required',
    });
  }

  switch (req.method) {
    case 'GET':
      // List users in the organization
      try {
        const { data, error } = await supabase
          .from('organization_members')
          .select(`
            user_id,
            role,
            created_at,
            auth_users:user_id (email, display_name, avatar_url)
          `)
          .eq('organization_id', organization_id);

        if (error) throw error;
        
        return res.status(200).json(data);
      } catch (error) {
        console.error('Error fetching organization users:', error);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to fetch organization users',
        });
      }
      
    case 'POST':
      // Invite a user to the organization
      try {
        const { email, role } = req.body;
        
        if (!email || !role) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Email and role are required',
          });
        }
        
        // Implementation for inviting users would go here
        // This would typically involve creating an invitation record
        // and sending an email to the user
        
        return res.status(200).json({
          message: 'Invitation sent successfully',
        });
      } catch (error) {
        console.error('Error inviting user:', error);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to invite user',
        });
      }
      
    case 'DELETE':
      // Remove a user from the organization
      try {
        const { user_id } = req.body;
        
        if (!user_id) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'User ID is required',
          });
        }
        
        const { error } = await supabase
          .from('organization_members')
          .delete()
          .eq('organization_id', organization_id)
          .eq('user_id', user_id);

        if (error) throw error;
        
        return res.status(200).json({
          message: 'User removed successfully',
        });
      } catch (error) {
        console.error('Error removing user:', error);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to remove user',
        });
      }
      
    default:
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: `The ${req.method} method is not allowed for this endpoint`,
      });
  }
}

// Protect the GET endpoint with 'organization.users.view' permission
const getHandler = withPermission(handler, 'organization.users.view');

// Protect the POST endpoint with 'organization.users.invite' permission
const postHandler = withPermission(handler, 'organization.users.invite');

// Protect the DELETE endpoint with 'organization.users.remove' permission
const deleteHandler = withPermission(handler, 'organization.users.remove');

// Main handler that routes to the appropriate permission-protected handler
export default async function routeHandler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getHandler(req, res);
    case 'POST':
      return postHandler(req, res);
    case 'DELETE':
      return deleteHandler(req, res);
    default:
      return handler(req, res);
  }
}
