import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Read the config file to get the logo path
    const configPath = path.join(process.cwd(), 'src', 'data', 'config.json');
    
    if (!fs.existsSync(configPath)) {
      return res.status(404).json({ error: 'No logo configuration found' });
    }
    
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      if (!config.logoPath) {
        return res.status(404).json({ error: 'No logo path configured' });
      }
      
      return res.status(200).json({ logoPath: config.logoPath });
    } catch (e) {
      console.error('Error reading config file:', e);
      return res.status(500).json({ error: 'Error reading logo configuration' });
    }
  } catch (error) {
    console.error('Error in get logo handler:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
