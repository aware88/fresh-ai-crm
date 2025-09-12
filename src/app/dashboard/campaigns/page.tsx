'use client';

import React, { useState, useEffect } from 'react';
import { ARISCampaigns } from '@/components/campaigns/ARISCampaigns';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load campaigns from database
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API endpoint when available
        // const response = await fetch('/api/campaigns');
        // const data = await response.json();
        // setCampaigns(data.campaigns || []);
        setCampaigns([]); // For now, show empty state
      } catch (error) {
        console.error('Failed to fetch campaigns:', error);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaigns();
  }, []);

  return <ARISCampaigns campaigns={campaigns} loading={loading} />;
}











