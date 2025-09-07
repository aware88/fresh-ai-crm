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
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Brain, 
  Search, 
  Star, 
  TrendingUp,
  Users,
  Filter,
  BarChart3,
  Settings,
  Loader2,
  Mail,
  Building,
  Phone,
  Calendar,
  Target,
  Zap,
  Award,
  Activity,
  User,
  Edit,
  RefreshCw,
  Clock
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { H1, Lead } from '@/components/ui/typography';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ARISLeads } from '@/components/leads/ARISLeads';
import { EnhancedARISLeads } from '@/components/leads/EnhancedARISLeads';

interface LeadScore {
  id: string;
  contact_id: string;
  overall_score: number;
  demographic_score: number;
  behavioral_score: number;
  engagement_score: number;
  company_score: number;
  email_interaction_score: number;
  recency_score: number;
  qualification_status: 'hot' | 'warm' | 'cold' | 'unqualified';
  updated_at: string;
}

interface ContactWithScore {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  phone?: string;
  lastContact?: string;
  personalityType?: string;
  lead_score: LeadScore;
}

interface LeadScoringAnalytics {
  total_contacts: number;
  scored_contacts: number;
  qualification_distribution: {
    hot: number;
    warm: number;
    cold: number;
    unqualified: number;
  };
  average_score: number;
}

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState('leads');
  const [contacts, setContacts] = useState<ContactWithScore[]>([]);
  const [analytics, setAnalytics] = useState<LeadScoringAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [qualificationFilter, setQualificationFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [useARISView, setUseARISView] = useState(true); // Toggle between ARIS and legacy view
  const router = useRouter();

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
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load lead scoring data",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeads();
  }, []);

  // Load analytics
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/leads/analytics');
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };
    
    fetchAnalytics();
  }, []);

  // Bulk score calculation
  const handleBulkScoring = async () => {
    try {
      setIsScoring(true);
      const response = await fetch('/api/leads/bulk-score', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate scores');
      }
      
      const result = await response.json();
      toast({
        title: "Scoring Complete",
        description: `Successfully scored ${result.success} contacts`,
      });
      
      // Reload data
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to calculate lead scores",
      });
    } finally {
      setIsScoring(false);
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    
    const matchesSearch = !searchTerm || 
      fullName.includes(searchLower) ||
      contact.email.toLowerCase().includes(searchLower) ||
      contact.company?.toLowerCase().includes(searchLower);
    
    const matchesQualification = qualificationFilter === 'all' || 
      contact.lead_score?.qualification_status === qualificationFilter;
    
    let matchesScore = true;
    if (scoreFilter !== 'all') {
      const score = contact.lead_score?.overall_score || 0;
      switch (scoreFilter) {
        case 'high':
          matchesScore = score >= 75;
          break;
        case 'medium':
          matchesScore = score >= 50 && score < 75;
          break;
        case 'low':
          matchesScore = score < 50;
          break;
      }
    }
    
    return matchesSearch && matchesQualification && matchesScore;
  });

  // Get qualification badge color
  const getQualificationColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-500';
      case 'warm': return 'bg-orange-500';
      case 'cold': return 'bg-blue-500';
      case 'unqualified': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Show ARIS leads view by default, with option to toggle to legacy view
  if (useARISView) {
    return (
      <div className="space-y-6">
        {/* View Toggle */}
        <div className="flex justify-between items-center">
          <div>
            <H1 className="text-3xl">Leads</H1>
            <Lead>Manage and track your sales prospects</Lead>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setUseARISView(false)}
            className="hover-lift"
          >
            Switch to Lead Scoring View
          </Button>
        </div>

        {/* ARIS Leads View */}
        <ARISLeads contacts={contacts} loading={loading} />
      </div>
    );
  }

  // Legacy Lead Scoring View (preserved completely)
  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline" 
          onClick={() => setUseARISView(true)}
          className="hover-lift"
        >
          Switch to ARIS View
        </Button>
      </div>

      <div>
        <H1 className="text-3xl">Lead Scoring</H1>
        <Lead>
          AI-powered lead qualification and scoring to prioritize your best prospects
        </Lead>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6 p-1 rounded-xl shadow-inner border bg-slate-50 border-slate-200">
          <TabsTrigger 
            value="leads" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--accent-color)] data-[state=active]:to-[var(--accent-color)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-muted"
          >
            <Target className="h-4 w-4" /> Scored Leads
          </TabsTrigger>
          <TabsTrigger 
            value="breakdown" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--accent-color)] data-[state=active]:to-[var(--accent-color)] data-[state=active]:text-white rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:bg-muted"
          >
            <Brain className="h-4 w-4" /> Score Breakdown
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

        <TabsContent value="leads" className="mt-0">
          {/* Analytics Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.total_contacts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.scored_contacts || 0} scored
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
                <Award className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {analytics?.qualification_distribution.hot || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ready to convert
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warm Leads</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {analytics?.qualification_distribution.warm || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Need nurturing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics?.average_score || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Out of 100 points
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
            <CardHeader className="bg-[var(--accent-color)] pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Scored Leads</CardTitle>
                    <CardDescription className="text-white/80">
                      AI-powered lead qualification and priority scoring
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="bg-white/20 hover:bg-white/30 text-white border-white/20"
                    onClick={handleBulkScoring}
                    disabled={isScoring}
                  >
                    {isScoring ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {isScoring ? 'Scoring...' : 'Recalculate Scores'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Filters */}
              <div className="space-y-3 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search leads by name, email, or company..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="w-full sm:w-48">
                    <Select value={qualificationFilter} onValueChange={setQualificationFilter}>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Qualification" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="hot">🔥 Hot</SelectItem>
                        <SelectItem value="warm">🟡 Warm</SelectItem>
                        <SelectItem value="cold">🔵 Cold</SelectItem>
                        <SelectItem value="unqualified">⚪ Unqualified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full sm:w-48">
                    <Select value={scoreFilter} onValueChange={setScoreFilter}>
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Score Range" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Scores</SelectItem>
                        <SelectItem value="high">High (75-100)</SelectItem>
                        <SelectItem value="medium">Medium (50-74)</SelectItem>
                        <SelectItem value="low">Low (0-49)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4 p-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                      <Skeleton className="h-8 w-[100px]" />
                      <Skeleton className="h-8 w-[80px]" />
                    </div>
                  ))}
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 rounded-full bg-gray-50 mb-4">
                    <Target className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No scored leads found</p>
                  <p className="text-gray-500 mt-2 max-w-md">
                    Run lead scoring on your contacts to see qualification results here.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CONTACT</TableHead>
                      <TableHead>COMPANY</TableHead>
                      <TableHead>SCORE</TableHead>
                      <TableHead>QUALIFICATION</TableHead>
                      <TableHead>LAST CONTACT</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow 
                        key={contact.id} 
                        className="cursor-pointer"
                        onClick={() => router.push(`/contacts/${contact.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-medium text-blue-700">
                              {contact.firstName?.[0]}{contact.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {contact.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span>{contact.company || 'No company'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${contact.lead_score?.overall_score || 0}%` }}
                              />
                            </div>
                            <span className={`font-medium ${getScoreColor(contact.lead_score?.overall_score || 0)}`}>
                              {contact.lead_score?.overall_score || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={contact.lead_score?.qualification_status || 'unqualified'}>
                            {contact.lead_score?.qualification_status?.toUpperCase() || 'UNQUALIFIED'}
                          </StatusBadge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{formatDate(contact.lastContact)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/contacts/${contact.id}`);
                              }}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Show score breakdown
                              }}
                            >
                              <Brain className="h-4 w-4" />
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

        <TabsContent value="breakdown" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-purple-50 overflow-hidden">
            <CardHeader className="bg-[var(--accent-color)] pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Score Breakdown</CardTitle>
                  <CardDescription className="text-white/80">
                    Understand how lead scores are calculated across different factors
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Scoring Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-500" />
                      Demographics
                    </CardTitle>
                    <CardDescription>Contact profile completeness</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Max Score</span>
                        <span className="font-medium">25 points</span>
                      </div>
                      <Progress value={75} className="h-2" />
                      <p className="text-xs text-gray-600">
                        Based on profile completeness, contact information quality
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-500" />
                      Behavior
                    </CardTitle>
                    <CardDescription>Engagement patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Max Score</span>
                        <span className="font-medium">15 points</span>
                      </div>
                      <Progress value={60} className="h-2" />
                      <p className="text-xs text-gray-600">
                        Website visits, email opens, content engagement
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-purple-500" />
                      Company
                    </CardTitle>
                    <CardDescription>Organization fit</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Max Score</span>
                        <span className="font-medium">20 points</span>
                      </div>
                      <Progress value={45} className="h-2" />
                      <p className="text-xs text-gray-600">
                        Company size, industry, growth indicators
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-orange-500" />
                      Email Interaction
                    </CardTitle>
                    <CardDescription>Email engagement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Max Score</span>
                        <span className="font-medium">25 points</span>
                      </div>
                      <Progress value={30} className="h-2" />
                      <p className="text-xs text-gray-600">
                        Email opens, clicks, replies, frequency
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-red-500" />
                      Recency
                    </CardTitle>
                    <CardDescription>Recent activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Max Score</span>
                        <span className="font-medium">15 points</span>
                      </div>
                      <Progress value={80} className="h-2" />
                      <p className="text-xs text-gray-600">
                        How recently they've engaged with your business
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Total Score
                    </CardTitle>
                    <CardDescription>Combined qualification score</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Max Score</span>
                        <span className="font-medium">100 points</span>
                      </div>
                      <Progress value={58} className="h-2" />
                      <p className="text-xs text-gray-600">
                        Weighted combination of all scoring factors
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <Card className="border-0 shadow-lg bg-gradient-to-b from-white to-green-50 overflow-hidden">
            <CardHeader className="bg-[var(--accent-color)] pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Lead Scoring Analytics</CardTitle>
                  <CardDescription className="text-white/80">
                    Performance insights and optimization recommendations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Lead Scoring Analytics</h3>
                <p className="text-gray-600 mb-4">
                  Advanced analytics and trend analysis features coming soon
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
                  <CardTitle className="text-white">Scoring Settings</CardTitle>
                  <CardDescription className="text-white/80">
                    Configure scoring weights, criteria, and automation rules
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Scoring Configuration</h3>
                <p className="text-gray-600 mb-4">
                  Customizable scoring rules and automation settings coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}