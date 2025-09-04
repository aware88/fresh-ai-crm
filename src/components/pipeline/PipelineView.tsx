/**
 * Pipeline View Component
 * Main pipeline visualization with drag-and-drop functionality
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DollarSign,
  Users,
  RefreshCw,
  Settings,
  Plus,
  Filter,
  Download
} from 'lucide-react';
import { PipelineStage } from './PipelineStage';
import type {
  PipelineWithStages,
  StageWithOpportunities,
  OpportunityWithDetails,
  PipelineSummary,
  OpportunityStatus,
  OpportunityPriority
} from '@/types/pipeline';

interface PipelineViewProps {
  organizationId?: string;
  onOpportunityEdit?: (opportunity: OpportunityWithDetails) => void;
  onOpportunityView?: (opportunity: OpportunityWithDetails) => void;
  onOpportunityCreate?: (stageId?: string, pipelineId?: string) => void;
  onPipelineCreate?: () => void;
  onEmailContact?: (contactEmail: string) => void;
  onCallContact?: (contactPhone: string) => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  organizationId,
  onOpportunityEdit,
  onOpportunityView,
  onOpportunityCreate,
  onPipelineCreate,
  onEmailContact,
  onCallContact
}) => {
  const [pipelines, setPipelines] = useState<PipelineWithStages[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineWithStages | null>(null);
  const [stagesWithOpportunities, setStagesWithOpportunities] = useState<StageWithOpportunities[]>([]);
  const [pipelineSummary, setPipelineSummary] = useState<PipelineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    status: OpportunityStatus[];
    priority: OpportunityPriority[];
    assigned_to: string;
  }>({
    status: ['active'],
    priority: [],
    assigned_to: ''
  });

  // Load pipelines
  const loadPipelines = async () => {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organization_id', organizationId);

      const response = await fetch(`/api/pipeline/pipelines?${params}`);
      const data = await response.json();

      if (data.success) {
        setPipelines(data.data);
        
        // Select first pipeline by default
        if (data.data.length > 0 && !selectedPipelineId) {
          setSelectedPipelineId(data.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load pipelines:', error);
    }
  };

  // Load pipeline details with opportunities
  const loadPipelineDetails = async (pipelineId: string) => {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organization_id', organizationId);
      if (filters.status.length > 0) params.append('status', filters.status.join(','));
      if (filters.priority.length > 0) params.append('priority', filters.priority.join(','));
      if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);

      const response = await fetch(`/api/pipeline/pipelines/${pipelineId}?${params}`);
      const data = await response.json();

      if (data.success) {
        setSelectedPipeline(data.data.pipeline);
        setStagesWithOpportunities(data.data.stages_with_opportunities || []);
      }
    } catch (error) {
      console.error('Failed to load pipeline details:', error);
    }
  };

  // Load pipeline summary/analytics
  const loadPipelineSummary = async (pipelineId: string) => {
    try {
      const response = await fetch(`/api/pipeline/pipelines/${pipelineId}/summary`);
      const data = await response.json();

      if (data.success) {
        setPipelineSummary(data.data);
      }
    } catch (error) {
      console.error('Failed to load pipeline summary:', error);
    }
  };

  // Handle opportunity move between stages
  const handleOpportunityMove = async (opportunityId: string, targetStageId: string) => {
    try {
      const response = await fetch('/api/pipeline/opportunities/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: opportunityId,
          new_stage_id: targetStageId,
          note: 'Moved via pipeline drag & drop'
        })
      });

      if (response.ok) {
        // Reload pipeline data to reflect changes
        if (selectedPipelineId) {
          await loadPipelineDetails(selectedPipelineId);
          await loadPipelineSummary(selectedPipelineId);
        }
      } else {
        console.error('Failed to move opportunity');
      }
    } catch (error) {
      console.error('Error moving opportunity:', error);
    }
  };

  // Handle opportunity deletion
  const handleOpportunityDelete = async (opportunityId: string) => {
    try {
      const response = await fetch(`/api/pipeline/opportunities/${opportunityId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Reload pipeline data
        if (selectedPipelineId) {
          await loadPipelineDetails(selectedPipelineId);
          await loadPipelineSummary(selectedPipelineId);
        }
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error);
    }
  };

  // Load data when component mounts or filters change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadPipelines();
      setLoading(false);
    };

    loadData();
  }, [organizationId]);

  // Load pipeline details when selected pipeline changes
  useEffect(() => {
    if (selectedPipelineId) {
      loadPipelineDetails(selectedPipelineId);
      loadPipelineSummary(selectedPipelineId);
    }
  }, [selectedPipelineId, filters]);

  // Update selected pipeline when pipelines load
  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      setSelectedPipelineId(pipelines[0].id);
    }
  }, [pipelines, selectedPipelineId]);

  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading pipeline data...</span>
      </div>
    );
  }

  if (pipelines.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle className="mb-2">No Pipelines Found</CardTitle>
          <CardDescription className="mb-4">
            Create your first sales pipeline to start managing opportunities
          </CardDescription>
          <Button onClick={onPipelineCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Pipeline
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground">
            Manage your sales opportunities and track progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
          <Button onClick={() => onOpportunityCreate?.(undefined, selectedPipelineId)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Opportunity
          </Button>
        </div>
      </div>

      {/* Pipeline Selector and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Pipeline</label>
                <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelines.map(pipeline => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: pipeline.color }}
                          />
                          {pipeline.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select 
                  value={filters.status.join(',')} 
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    status: value ? value.split(',') as OpportunityStatus[] : [] 
                  }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Summary */}
      {pipelineSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pipelineSummary.total_opportunities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(pipelineSummary.total_value)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weighted Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(pipelineSummary.weighted_value)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(pipelineSummary.average_deal_size)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pipeline Stages */}
      <div className="w-full overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max p-1">
          {stagesWithOpportunities.map((stage) => (
            <PipelineStage
              key={stage.id}
              stage={stage}
              onOpportunityMove={handleOpportunityMove}
              onOpportunityEdit={onOpportunityEdit}
              onOpportunityView={onOpportunityView}
              onOpportunityDelete={handleOpportunityDelete}
              onAddOpportunity={(stageId) => onOpportunityCreate?.(stageId, selectedPipelineId)}
              onEmailContact={onEmailContact}
              onCallContact={onCallContact}
            />
          ))}
        </div>
      </div>

      {/* Empty State */}
      {stagesWithOpportunities.length === 0 && selectedPipeline && (
        <Card className="text-center py-12">
          <CardContent>
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle className="mb-2">No Stages Found</CardTitle>
            <CardDescription className="mb-4">
              This pipeline doesn't have any stages configured yet
            </CardDescription>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Configure Pipeline Stages
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};