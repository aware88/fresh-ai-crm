/**
 * Sales Pipeline Dashboard Page
 * Main page for pipeline management with lead scoring integration
 */

'use client';

import React, { useState } from 'react';
import { PipelineView } from '@/components/pipeline/PipelineView';
import { LeadScoreCard } from '@/components/lead-scoring/LeadScoreCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3,
  TrendingUp, 
  Users, 
  Plus,
  Settings,
  HelpCircle,
  Sparkles,
  Target,
  Calculator,
  Mail,
  Phone
} from 'lucide-react';
import type { OpportunityWithDetails, CreateOpportunityForm } from '@/types/pipeline';
import type { LeadScore, ScoreBreakdown } from '@/types/lead-scoring';

export default function PipelinePage() {
  const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityWithDetails | null>(null);
  const [selectedScore, setSelectedScore] = useState<LeadScore | null>(null);
  const [selectedBreakdown, setSelectedBreakdown] = useState<ScoreBreakdown | null>(null);
  const [showOpportunityDetail, setShowOpportunityDetail] = useState(false);
  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false);
  const [showCreatePipeline, setShowCreatePipeline] = useState(false);
  
  // Form states
  const [createOpportunityData, setCreateOpportunityData] = useState<Partial<CreateOpportunityForm>>({
    priority: 'medium',
    currency: 'USD'
  });
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');

  // Handle opportunity selection with lead score integration
  const handleOpportunityView = async (opportunity: OpportunityWithDetails) => {
    setSelectedOpportunity(opportunity);
    
    // Fetch lead score if contact is associated
    if (opportunity.contact_id) {
      try {
        const response = await fetch(
          `/api/lead-scoring/calculate?contact_id=${opportunity.contact_id}`
        );
        const data = await response.json();
        
        if (data.success) {
          setSelectedScore(data.data.score);
          setSelectedBreakdown(data.data.breakdown);
        }
      } catch (error) {
        console.error('Failed to fetch lead score:', error);
      }
    }
    
    setShowOpportunityDetail(true);
  };

  // Handle opportunity creation
  const handleOpportunityCreate = (stageId?: string, pipelineId?: string) => {
    setSelectedStageId(stageId || '');
    setSelectedPipelineId(pipelineId || '');
    setCreateOpportunityData({
      ...createOpportunityData,
      stage_id: stageId,
      pipeline_id: pipelineId
    });
    setShowCreateOpportunity(true);
  };

  // Submit new opportunity
  const handleSubmitOpportunity = async () => {
    try {
      const response = await fetch('/api/pipeline/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createOpportunityData)
      });

      if (response.ok) {
        setShowCreateOpportunity(false);
        setCreateOpportunityData({ priority: 'medium', currency: 'USD' });
        // Refresh the pipeline view
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to create opportunity:', error);
    }
  };

  // Handle email contact
  const handleEmailContact = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  // Handle phone contact
  const handleCallContact = (phone: string) => {
    // In a real app, this could integrate with a calling system
    alert(`Call contact: ${phone}`);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Page Header with Integration Highlights */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">Sales Pipeline</h1>
            <Badge variant="secondary" className="ml-2">
              <Calculator className="w-3 h-3 mr-1" />
              Lead Score Integrated
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            Visual pipeline management with AI-powered lead scoring insights
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configure Pipeline
          </Button>
          <Button variant="outline">
            <HelpCircle className="w-4 h-4 mr-2" />
            Help
          </Button>
        </div>
      </div>

      {/* Feature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg">Visual Pipeline</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm leading-relaxed">
              Drag-and-drop interface for managing opportunities through your sales stages.
              Real-time updates and progress tracking.
            </CardDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">Drag & Drop</Badge>
              <Badge variant="outline">Real-time</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-600" />
              <CardTitle className="text-lg">Lead Score Integration</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm leading-relaxed">
              Each opportunity shows associated contact lead scores for better 
              prioritization and qualification.
            </CardDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">AI-Powered</Badge>
              <Badge variant="outline">Auto-Update</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg">Smart Analytics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm leading-relaxed">
              Pipeline metrics, conversion rates, and forecasting with 
              lead score correlation analysis.
            </CardDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">Forecasting</Badge>
              <Badge variant="outline">Metrics</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">Team Collaboration</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm leading-relaxed">
              Multi-user pipeline management with activity tracking, 
              assignments, and team performance analytics.
            </CardDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">Team-Ready</Badge>
              <Badge variant="outline">Activity Logs</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Pipeline View */}
      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6">
          <PipelineView
            onOpportunityEdit={setSelectedOpportunity}
            onOpportunityView={handleOpportunityView}
            onOpportunityCreate={handleOpportunityCreate}
            onPipelineCreate={() => setShowCreatePipeline(true)}
            onEmailContact={handleEmailContact}
            onCallContact={handleCallContact}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Analytics</CardTitle>
              <CardDescription>
                Advanced analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                <p>Advanced pipeline analytics coming soon</p>
                <p className="text-sm mt-2">
                  Conversion rates, forecasting, and lead score correlation analysis
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Configuration</CardTitle>
              <CardDescription>
                Manage pipeline stages, automation rules, and team settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4" />
                <p>Pipeline configuration panel coming soon</p>
                <p className="text-sm mt-2">
                  Stage management, automation rules, and team assignments
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Opportunity Detail Dialog with Lead Score Integration */}
      <Dialog open={showOpportunityDetail} onOpenChange={setShowOpportunityDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {selectedOpportunity?.title}
            </DialogTitle>
            <DialogDescription>
              Opportunity details with integrated lead scoring insights
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Opportunity Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Opportunity Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Value</Label>
                      <p className="text-lg font-semibold text-green-600">
                        {selectedOpportunity?.value 
                          ? new Intl.NumberFormat('en-US', { 
                              style: 'currency', 
                              currency: selectedOpportunity.currency 
                            }).format(selectedOpportunity.value)
                          : 'Not set'
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Probability</Label>
                      <p className="text-lg font-semibold text-blue-600">
                        {selectedOpportunity?.probability}%
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Expected Close</Label>
                      <p>
                        {selectedOpportunity?.expected_close_date 
                          ? new Date(selectedOpportunity.expected_close_date).toLocaleDateString()
                          : 'Not set'
                        }
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Priority</Label>
                      <Badge className={
                        selectedOpportunity?.priority === 'urgent' ? 'bg-red-500' :
                        selectedOpportunity?.priority === 'high' ? 'bg-orange-500' :
                        selectedOpportunity?.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                      }>
                        {selectedOpportunity?.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  {selectedOpportunity?.description && (
                    <div>
                      <Label className="text-sm font-medium">Description</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedOpportunity.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              {selectedOpportunity?.contact && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {selectedOpportunity.contact.firstname} {selectedOpportunity.contact.lastname}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedOpportunity.contact.email}
                        </p>
                        {selectedOpportunity.contact.company && (
                          <p className="text-sm text-muted-foreground">
                            {selectedOpportunity.contact.company}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEmailContact(selectedOpportunity.contact!.email)}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Email
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCallContact('phone')}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Lead Score Integration */}
            <div className="space-y-6">
              {selectedScore ? (
                <LeadScoreCard
                  score={selectedScore}
                  breakdown={selectedBreakdown}
                  onStatusChange={async (contactId, status) => {
                    // Update lead score status
                    try {
                      await fetch('/api/lead-scoring/contacts', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          contact_id: contactId,
                          qualification_status: status
                        })
                      });
                    } catch (error) {
                      console.error('Failed to update status:', error);
                    }
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calculator className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">No Lead Score Available</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedOpportunity?.contact 
                        ? 'Calculate lead score for better insights'
                        : 'No contact associated with this opportunity'
                      }
                    </p>
                    {selectedOpportunity?.contact && (
                      <Button 
                        size="sm"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/lead-scoring/calculate', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                contact_id: selectedOpportunity.contact_id 
                              })
                            });
                            
                            if (response.ok) {
                              const data = await response.json();
                              setSelectedScore(data.data.score);
                              setSelectedBreakdown(data.data.breakdown);
                            }
                          } catch (error) {
                            console.error('Failed to calculate score:', error);
                          }
                        }}
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Calculate Score
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Move to Next Stage
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Activity
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Assign Team Member
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Opportunity Dialog */}
      <Dialog open={showCreateOpportunity} onOpenChange={setShowCreateOpportunity}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Opportunity</DialogTitle>
            <DialogDescription>
              Add a new sales opportunity to your pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={createOpportunityData.title || ''}
                onChange={(e) => setCreateOpportunityData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter opportunity title"
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={createOpportunityData.description || ''}
                onChange={(e) => setCreateOpportunityData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the opportunity"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Value</Label>
                <Input
                  type="number"
                  value={createOpportunityData.value || ''}
                  onChange={(e) => setCreateOpportunityData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={createOpportunityData.currency || 'USD'}
                  onValueChange={(value) => setCreateOpportunityData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <Select
                  value={createOpportunityData.priority || 'medium'}
                  onValueChange={(value: any) => setCreateOpportunityData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expected Close Date</Label>
                <Input
                  type="date"
                  value={createOpportunityData.expected_close_date || ''}
                  onChange={(e) => setCreateOpportunityData(prev => ({ ...prev, expected_close_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateOpportunity(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitOpportunity}>
                Create Opportunity
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}