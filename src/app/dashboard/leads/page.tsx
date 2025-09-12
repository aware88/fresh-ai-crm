'use client';

import React, { useState, useEffect } from 'react';
import { ARISLeads } from '@/components/leads/ARISLeads';

export default function LeadsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load contacts with lead scores
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/leads/scored');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        const contactsArray = Array.isArray(data.contacts) ? data.contacts : [];
        setContacts(contactsArray);
      } catch (error) {
        console.error('Failed to fetch leads:', error);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeads();
  }, []);

  return (
    <div className="space-y-4">
      <ARISLeads contacts={contacts} loading={loading} />
    </div>
  );
}