import type { NextApiRequest, NextApiResponse } from 'next';
import { DisputeResolutionRequest } from '../../../lib/disputes/types';
import { generateResolutionStrategy } from '../../../lib/disputes/resolution';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const disputeRequest = req.body as DisputeResolutionRequest;
      const result = await generateResolutionStrategy(disputeRequest);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Error resolving dispute:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to resolve dispute' 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
