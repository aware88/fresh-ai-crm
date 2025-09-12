'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  GitBranch, 
  Search, 
  Plus, 
  Edit, 
  Trash2,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  Target,
  BarChart3,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useOrganization } from '@/hooks/useOrganization';

interface PipelineStage {
  id: string;
  name: string;
  probability: number;
  color: string;
  sort_order: number;
}

interface SalesOpportunity {
  id: string;
  title: string;
  value: number;
  probability: number;
  stage_id: string;
  contact_id: string;
  assigned_to?: string;
  status: 'active' | 'won' | 'lost';
  created_at: string;
  updated_at: string;
  contact?: {
    firstName: string;
    lastName: string;
    email: string;
    company?: string;
  };
}

interface SalesPipeline {
  id: string;
  name: string;
  description?: string;
  color: string;
  stages: PipelineStage[];
  opportunities_count: number;
  total_value: number;
  weighted_value: number;
  is_active: boolean;
}

export default function PipelinePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [pipelines, setPipelines] = useState<SalesPipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<SalesPipeline | null>(null);
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { organization } = useOrganization();

  // Load pipelines
  useEffect(() => {
    const fetchPipelines = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/pipeline');
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        const pipelinesArray = Array.isArray(data.pipelines) ? data.pipelines : [];
        setPipelines(pipelinesArray);
        
        // Auto-select first pipeline
        if (pipelinesArray.length > 0 && !selectedPipeline) {
          setSelectedPipeline(pipelinesArray[0]);
        }
      } catch (error) {
        console.error('Failed to fetch pipelines:', error);
        setError('Failed to load pipelines');
        setPipelines([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPipelines();
  }, [selectedPipeline]);

  // Load opportunities for selected pipeline
  useEffect(() => {
    if (selectedPipeline) {
      const fetchOpportunities = async () => {
        try {
          const response = await fetch(`/api/pipeline/${selectedPipeline.id}/opportunities`);
          if (response.ok) {
            const data = await response.json();
            setOpportunities(Array.isArray(data.opportunities) ? data.opportunities : []);
          }
        } catch (error) {
          console.error('Failed to fetch opportunities:', error);
        }
      };
      
      fetchOpportunities();
    }
  }, [selectedPipeline]);

  // Filter opportunities based on search
  const filteredOpportunities = opportunities.filter(opp => {
    const searchLower = searchTerm.toLowerCase();
    return !searchTerm || 
      opp.title.toLowerCase().includes(searchLower) ||
      opp.contact?.company?.toLowerCase().includes(searchLower) ||
      `${opp.contact?.firstName} ${opp.contact?.lastName}`.toLowerCase().includes(searchLower);
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get stage name by ID
  const getStageName = (stageId: string) => {
    const stage = selectedPipeline?.stages.find(s => s.id === stageId);
    return stage?.name || 'Unknown Stage';
  };

  // Get stage color by ID
  const getStageColor = (stageId: string) => {
    const stage = selectedPipeline?.stages.find(s => s.id === stageId);
    return stage?.color || '#6B7280';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Pipeline</h1>
        <p className="text-muted-foreground">
          Manage your sales opportunities and track progress through your pipeline stages
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 p-1 rounded-xl shadow-inner border bg-slate-50 border-slate-200">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--accent-color)] data-[state=active]:to-[var(--accent-color)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-muted"
          >
            <GitBranch className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger 
            value="opportunities" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--accent-color)] data-[state=active]:to-[var(--accent-color)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-muted"
          >
            <Target className="h-4 w-4" /> Opportunities
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--accent-color)] data-[state=active]:to-[var(--accent-color)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-muted"
          >
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--accent-color)] data-[state=active]:to-[var(--accent-color)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-muted"
          >
            <Settings className="h-4 w-4" /> Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Pipeline Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pipeline Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(pipelines.reduce((sum, p) => sum + p.total_value, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pipelines.reduce((sum, p) => sum + p.opportunities_count, 0)} opportunities
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weighted Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(pipelines.reduce((sum, p) => sum + p.weighted_value, 0))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on stage probability
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Pipelines</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pipelines.filter(p => p.is_active).length}</div>
                <p className="text-xs text-muted-foreground">
                  {pipelines.length} total pipelines
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pipelines.length === 0 ? '0%' : '-'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pipelines.length === 0 ? 'No data yet' : 'Calculating...'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
            <CardHeader className="bg-[var(--accent-color)] pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                    <GitBranch className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Pipeline Overview</CardTitle>
                    <CardDescription className="text-white/80">
                      Manage your sales pipelines and opportunities
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                  <Plus className="mr-2 h-4 w-4" />
                  New Pipeline
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-gray-500">Loading pipelines...</p>
                  </div>
                </div>
              ) : pipelines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 rounded-full bg-gray-50 mb-4">
                    <GitBranch className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No pipelines found</p>
                  <p className="text-gray-500 mt-2 max-w-md">
                    Create your first sales pipeline to start tracking opportunities.
                  </p>
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Pipeline
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pipelines.map((pipeline) => (
                    <Card 
                      key={pipeline.id} 
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedPipeline?.id === pipeline.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedPipeline(pipeline)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: pipeline.color }}
                          />
                        </div>
                        <CardDescription>{pipeline.description || 'No description'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Opportunities</span>
                            <span className="font-medium">{pipeline.opportunities_count}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Value</span>
                            <span className="font-medium">{formatCurrency(pipeline.total_value)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Weighted Value</span>
                            <span className="font-medium">{formatCurrency(pipeline.weighted_value)}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <Badge variant={pipeline.is_active ? "default" : "secondary"}>
                              {pipeline.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-green-50 overflow-hidden">
            <CardHeader className="bg-[var(--accent-color)] pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Sales Opportunities</CardTitle>
                    <CardDescription className="text-white/80">
                      Track and manage your sales opportunities
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" className="bg-white/20 hover:bg-white/30 text-white border-white/20">
                  <Plus className="mr-2 h-4 w-4" />
                  New Opportunity
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search opportunities by name, company, or contact..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {filteredOpportunities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 rounded-full bg-gray-50 mb-4">
                    <Target className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No opportunities found</p>
                  <p className="text-gray-500 mt-2 max-w-md">
                    Create your first opportunity to start tracking sales progress.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OPPORTUNITY</TableHead>
                      <TableHead>CONTACT</TableHead>
                      <TableHead>STAGE</TableHead>
                      <TableHead>VALUE</TableHead>
                      <TableHead>PROBABILITY</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOpportunities.map((opportunity) => (
                      <TableRow key={opportunity.id} className="cursor-pointer">
                        <TableCell>
                          <div>
                            <div className="font-medium">{opportunity.title}</div>
                            <div className="text-sm text-gray-500">
                              {opportunity.contact?.company || 'No company'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {opportunity.contact?.firstName} {opportunity.contact?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {opportunity.contact?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            style={{ 
                              borderColor: getStageColor(opportunity.stage_id),
                              color: getStageColor(opportunity.stage_id) 
                            }}
                          >
                            {getStageName(opportunity.stage_id)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(opportunity.value)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${opportunity.probability}%` }}
                              />
                            </div>
                            <span className="text-sm">{opportunity.probability}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              opportunity.status === 'won' ? 'default' : 
                              opportunity.status === 'lost' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {opportunity.status === 'won' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {opportunity.status === 'lost' && <AlertCircle className="w-3 h-3 mr-1" />}
                            {opportunity.status === 'active' && <Clock className="w-3 h-3 mr-1" />}
                            {opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-purple-50 overflow-hidden">
            <CardHeader className="bg-[var(--accent-color)] pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Pipeline Analytics</CardTitle>
                  <CardDescription className="text-white/80">
                    Insights and performance metrics for your sales pipeline
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Pipeline Analytics</h3>
                <p className="text-gray-600 mb-4">
                  Advanced analytics and reporting features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-gray-50 overflow-hidden">
            <CardHeader className="bg-[var(--accent-color)] pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Pipeline Settings</CardTitle>
                  <CardDescription className="text-white/80">
                    Configure your pipeline stages, fields, and automation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Pipeline Settings</h3>
                <p className="text-gray-600 mb-4">
                  Pipeline configuration and management features coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}