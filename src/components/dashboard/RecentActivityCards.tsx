'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, MessageSquare } from 'lucide-react';

interface ActivityData {
  emailResponses: number;
  followUpsPending: number;
  upsellOpportunities: number;
  pendingFollowUps: number;
  draftReviews: number;
  highValueLeads: number;
}

export default function RecentActivityCards() {
  const [activity, setActivity] = useState<ActivityData>({
    emailResponses: 0,
    followUpsPending: 0,
    upsellOpportunities: 0,
    pendingFollowUps: 0,
    draftReviews: 0,
    highValueLeads: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        // Fetch real data from APIs
        const [usageRes, followUpRes, emailAccountsRes] = await Promise.all([
          fetch('/api/usage/dashboard-v2').then(r => r.ok ? r.json() : null),
          fetch('/api/email/followups/analytics?summary=true').then(r => r.ok ? r.json() : null),
          fetch('/api/dashboard/email-accounts').then(r => r.ok ? r.json() : null)
        ]);

        // Check if user has email accounts connected
        const hasEmailAccounts = emailAccountsRes?.count > 0;

        if (!hasEmailAccounts) {
          // No email accounts - all should be 0
          setActivity({
            emailResponses: 0,
            followUpsPending: 0,
            upsellOpportunities: 0,
            pendingFollowUps: 0,
            draftReviews: 0,
            highValueLeads: 0
          });
        } else {
          // Has email accounts - use real data
          setActivity({
            emailResponses: usageRes?.insights?.efficiency?.emailsProcessed || 0,
            followUpsPending: followUpRes?.analytics?.overview?.pending_followups || 0,
            upsellOpportunities: followUpRes?.analytics?.ml_insights?.optimization_suggestions?.length || 0,
            pendingFollowUps: followUpRes?.analytics?.overview?.pending_followups || 0,
            draftReviews: followUpRes?.analytics?.overview?.drafts_pending_review || 0,
            highValueLeads: followUpRes?.analytics?.ml_insights?.high_value_leads?.length || 0
          });
        }
      } catch (error) {
        console.error('Error fetching activity data:', error);
        // Default to 0s on error
        setActivity({
          emailResponses: 0,
          followUpsPending: 0,
          upsellOpportunities: 0,
          pendingFollowUps: 0,
          draftReviews: 0,
          highValueLeads: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="border-0 shadow-md animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base">
            <Activity className="mr-2 h-4 w-4 text-orange-600" />
            Recent AI Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email responses generated</span>
              <span className="font-medium">{activity.emailResponses} today</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Follow-ups scheduled</span>
              <span className="font-medium">{activity.followUpsPending} pending</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Upsell opportunities</span>
              <span className="font-medium">{activity.upsellOpportunities} identified</span>
            </div>
          </div>
          <Link href="/dashboard/email">
            <Button variant="outline" size="sm" className="w-full mt-4">
              Manage Email AI
            </Button>
          </Link>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base">
            <MessageSquare className="mr-2 h-4 w-4 text-blue-600" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pending follow-ups</span>
              <span className={`font-medium ${activity.pendingFollowUps > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                {activity.pendingFollowUps} due
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Draft reviews</span>
              <span className={`font-medium ${activity.draftReviews > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                {activity.draftReviews} waiting
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">High-value leads</span>
              <span className={`font-medium ${activity.highValueLeads > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                {activity.highValueLeads} to contact
              </span>
            </div>
          </div>
          <Link href="/dashboard/analytics?tab=email-analytics">
            <Button variant="outline" size="sm" className="w-full mt-4">
              View All Actions
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}






