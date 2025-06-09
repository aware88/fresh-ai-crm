import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { DisputeDetails } from '../../../lib/disputes/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const disputes = req.body as DisputeDetails[];
      
      // Save to data file
      const dataDir = path.join(process.cwd(), 'src/data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(dataDir, 'disputes.json'),
        JSON.stringify(disputes, null, 2),
        'utf8'
      );
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving disputes:', error);
      res.status(500).json({ error: 'Failed to save disputes' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
