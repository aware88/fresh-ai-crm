import type { NextApiRequest, NextApiResponse } from 'next';
import { getCompanyInfo } from '../../../lib/company/websiteScanner';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const companyInfo = getCompanyInfo();

    if (!companyInfo) {
      return res.status(404).json({ error: 'No company information found' });
    }

    return res.status(200).json({ success: true, companyInfo });
  } catch (error) {
    console.error('Error in company info handler:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
