import type { NextApiRequest, NextApiResponse } from 'next';
import { scanCompanyWebsite, saveCompanyInfo } from '../../../lib/company/websiteScanner';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Scan the website
    const companyInfo = await scanCompanyWebsite(url);

    if (!companyInfo) {
      return res.status(500).json({ error: 'Failed to scan website' });
    }

    // Save the company info
    const saved = await saveCompanyInfo(companyInfo);

    if (!saved) {
      return res.status(500).json({ error: 'Failed to save company information' });
    }

    return res.status(200).json({ success: true, companyInfo });
  } catch (error) {
    console.error('Error in scan-website handler:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
