/**
 * Lead Scoring Dashboard Page
 * Main page for lead scoring functionality
 */

'use client';

import React, { useState } from 'react';
import { LeadScoringDashboard } from '@/components/lead-scoring/LeadScoringDashboard';
import { LeadScoreCard } from '@/components/lead-scoring/LeadScoreCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Calculator, 
  TrendingUp, 
  Users, 
  Settings,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import type { ContactWithScore, LeadScore, ScoreBreakdown } from '@/types/lead-scoring';

export default function LeadScoringPage() {
  const [selectedContact, setSelectedContact] = useState<ContactWithScore | null>(null);
  const [selectedScore, setSelectedScore] = useState<LeadScore | null>(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState<ScoreBreakdown | null>(null);
  const [showContactDetail, setShowContactDetail] = useState(false);

  // Handle contact selection from dashboard
  const handleContactSelect = async (contact: ContactWithScore) => {
    setSelectedContact(contact);
    
    // Fetch detailed score information
    if (contact.lead_score) {
      try {
        const response = await fetch(
          `/api/lead-scoring/calculate?contact_id=${contact.id}`
        );
        const data = await response.json();
        
        if (data.success) {
          setSelectedScore(data.data.score);
          setSelectedBreakdown(data.data.breakdown);
          setShowContactDetail(true);
        }
      } catch (error) {
        console.error('Failed to fetch detailed score:', error);
        // Still show dialog with basic info
        setSelectedScore(contact.lead_score);
        setSelectedBreakdown(null);
        setShowContactDetail(true);
      }
    } else {
      setShowContactDetail(true);
    }
  };

  // Handle status changes
  const handleStatusChange = async (contactId: string, status: string) => {
    try {
      const response = await fetch('/api/lead-scoring/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId,
          qualification_status: status,
          reason: 'Manual update from contact detail'
        })
      });

      if (response.ok) {
        // Update local state
        if (selectedScore) {
          setSelectedScore({
            ...selectedScore,
            qualification_status: status as any
          });
        }
        
        // You might want to refresh the dashboard here
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Calculator className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Lead Scoring</h1>
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            Automatically qualify and prioritize your leads with intelligent scoring
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configure Scoring
          </Button>
          <Button variant="outline">
            <HelpCircle className="w-4 h-4 mr-2" />
            Help
          </Button>
        </div>
      </div>

      {/* Feature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Smart Qualification</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm leading-relaxed">
              AI analyzes contact data, email interactions, company profiles, and behavior 
              to automatically score and qualify leads on a 100-point scale.
            </CardDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">Demographics</Badge>
              <Badge variant="outline">Email Activity</Badge>
              <Badge variant="outline">Company Data</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Automatic Updates</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm leading-relaxed">
              Scores automatically update when new emails are received, contact 
              information changes, or new interactions occur. No manual work required.
            </CardDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">Real-time</Badge>
              <Badge variant="outline">Event-driven</Badge>
              <Badge variant="outline">Automated</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg">Detailed Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm leading-relaxed">
              See exactly how each score is calculated with detailed breakdowns 
              showing demographic, behavioral, and engagement factors.
            </CardDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">Transparent</Badge>
              <Badge variant="outline">Detailed</Badge>
              <Badge variant="outline">Actionable</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="settings">Scoring Criteria</TabsTrigger>
          <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <LeadScoringDashboard
            onContactSelect={handleContactSelect}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scoring Criteria Configuration</CardTitle>
              <CardDescription>
                Customize how leads are scored and qualified
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4" />
                <p>Scoring criteria configuration coming soon</p>
                <p className="text-sm mt-2">
                  This will allow you to customize scoring weights and add custom criteria
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Deep insights into lead scoring performance and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                <p>Advanced analytics coming soon</p>
                <p className="text-sm mt-2">
                  Score trends, conversion analysis, and performance metrics
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contact Detail Dialog */}
      <Dialog open={showContactDetail} onOpenChange={setShowContactDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {selectedContact?.firstname} {selectedContact?.lastname}
            </DialogTitle>
            <DialogDescription>
              Detailed lead score analysis and management
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{selectedContact?.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Company</p>
                <p className="text-sm text-muted-foreground">{selectedContact?.company || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Position</p>
                <p className="text-sm text-muted-foreground">{selectedContact?.position || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{selectedContact?.phone || 'N/A'}</p>
              </div>
            </div>

            {/* Lead Score Card */}
            {selectedScore && (
              <LeadScoreCard
                score={selectedScore}
                breakdown={selectedBreakdown || undefined}
                onStatusChange={handleStatusChange}
              />
            )}

            {/* No Score State */}
            {!selectedScore && (
              <Card>
                <CardContent className="text-center py-8">
                  <Calculator className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">No Score Available</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    This contact hasn't been scored yet
                  </p>
                  <Button 
                    onClick={async () => {
                      if (selectedContact) {
                        try {
                          const response = await fetch('/api/lead-scoring/calculate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ contact_id: selectedContact.id })
                          });
                          
                          if (response.ok) {
                            const data = await response.json();
                            setSelectedScore(data.data.score);
                            setSelectedBreakdown(data.data.breakdown);
                          }
                        } catch (error) {
                          console.error('Failed to calculate score:', error);
                        }
                      }
                    }}
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Score Now
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}