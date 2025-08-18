'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, ArrowLeft } from 'lucide-react';

interface ContactDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  position?: string;
  notes?: string;
  personalityType?: string;
  lastInteraction?: string | null;
  lastContact?: string | null;
}

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const contactId = params?.id;
  const [contact, setContact] = useState<ContactDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!contactId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/contacts/${contactId}`);
        if (!res.ok) {
          throw new Error('Failed to load contact');
        }
        const data = await res.json();
        if (isMounted) {
          const c = data?.data;
          setContact(c || null);
          setError(null);
        }
      } catch (e: any) {
        if (isMounted) {
          setError(e?.message || 'Failed to load contact');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [contactId]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Button variant="ghost" onClick={() => router.back()} className="w-fit">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>
            {loading ? 'Loading…' : error ? 'Contact' : `${contact?.firstName || ''} ${contact?.lastName || ''}`.trim() || 'Contact'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && contact && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{contact.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Last contact: {formatDate(contact.lastInteraction || contact.lastContact)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}






