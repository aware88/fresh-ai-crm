import type { NextApiRequest, NextApiResponse } from 'next';
import { loadDisputes } from '../../../lib/disputes/data';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const disputes = await loadDisputes();
      res.status(200).json(disputes);
    } catch (error) {
      console.error('Error loading disputes:', error);
      res.status(500).json({ error: 'Failed to load disputes' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
