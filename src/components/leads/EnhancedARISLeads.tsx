'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  Clock,
  CheckCircle,
  Trophy,
  Sparkles
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { H1, Lead } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';

// Import MagicUI components
import { AnimatedList } from '@/components/magicui/animated-list';
import { BentoCard, BentoGrid } from '@/components/magicui/bento-grid';
import { BorderBeam } from '@/components/magicui/border-beam';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import confetti from 'canvas-confetti';

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
  company: string | null;
  phone: string | null;
  leadScore?: LeadScore;
}

interface LeadScoringAnalytics {
  total_contacts: number;
  scored_contacts: number;
  qualification_breakdown: {
    hot: number;
    warm: number;
    cold: number;
    unqualified: number;
  };
  average_score: number;
}

interface LeadActivity {
  id: string;
  type: 'score_update' | 'qualification_change' | 'new_lead' | 'conversion';
  title: string;
  description: string;
  timestamp: string;
  score?: number;
  status?: string;
  icon: React.ReactNode;
  color: string;
}

export function EnhancedARISLeads(): JSX.Element {
  const [activeTab, setActiveTab] = useState('leads');
  const [contacts, setContacts] = useState<ContactWithScore[]>([]);
  const [analytics, setAnalytics] = useState<LeadScoringAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [qualificationFilter, setQualificationFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [recentActivities, setRecentActivities] = useState<LeadActivity[]>([]);
  const router = useRouter();

  // Trigger confetti for conversions
  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  // Generate mock recent activities
  const generateRecentActivities = useCallback((contacts: ContactWithScore[]): LeadActivity[] => {
    const activities: LeadActivity[] = [];
    
    contacts.slice(0, 5).forEach((contact, index) => {
      const score = contact.leadScore?.overall_score || 0;
      const status = contact.leadScore?.qualification_status || 'cold';
      
      activities.push({
        id: `activity-${index}`,
        type: score > 80 ? 'conversion' : 'score_update',
        title: score > 80 ? `🎉 ${contact.firstName} ${contact.lastName} - High Priority Lead!` : `${contact.firstName} ${contact.lastName} scored ${score}`,
        description: score > 80 ? 'This lead is ready for immediate follow-up' : `Lead qualification: ${status}`,
        timestamp: new Date(Date.now() - index * 300000).toISOString(),
        score,
        status,
        icon: score > 80 ? <Trophy className="w-4 h-4" /> : <Target className="w-4 h-4" />,
        color: score > 80 ? '#10b981' : score > 60 ? '#f59e0b' : '#6b7280'
      });
    });

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

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
        
        // Generate activities based on loaded contacts
        const activities = generateRecentActivities(contactsArray);
        setRecentActivities(activities);
        
        // Check for high-scoring leads and trigger confetti
        const highScoreLeads = contactsArray.filter(contact => 
          contact.leadScore && contact.leadScore.overall_score > 80
        );
        if (highScoreLeads.length > 0) {
          setTimeout(triggerConfetti, 1000);
        }
        
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
  }, [generateRecentActivities, triggerConfetti]);

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

  // Bulk score calculation with enhanced feedback
  const handleBulkScoring = async () => {
    setIsScoring(true);
    try {
      const response = await fetch('/api/leads/score-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "✨ Scoring Complete!",
          description: `Successfully scored ${result.scored || 0} leads with AI intelligence`,
        });
        
        // Refresh data
        window.location.reload();
        
        // Trigger confetti for successful bulk scoring
        setTimeout(triggerConfetti, 500);
      } else {
        throw new Error('Failed to score leads');
      }
    } catch (error) {
      console.error('Bulk scoring error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to score leads. Please try again.",
      });
    } finally {
      setIsScoring(false);
    }
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm || 
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesQualification = qualificationFilter === 'all' || 
      contact.leadScore?.qualification_status === qualificationFilter;

    const matchesScore = scoreFilter === 'all' || 
      (scoreFilter === 'high' && contact.leadScore && contact.leadScore.overall_score >= 70) ||
      (scoreFilter === 'medium' && contact.leadScore && contact.leadScore.overall_score >= 40 && contact.leadScore.overall_score < 70) ||
      (scoreFilter === 'low' && contact.leadScore && contact.leadScore.overall_score < 40);

    return matchesSearch && matchesQualification && matchesScore;
  });

  const getQualificationColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-800 border-red-200';
      case 'warm': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cold': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <div className="space-y-2">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-6 w-64" />
        </div>
        
        <BentoGrid className="w-full auto-rows-[12rem] grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="col-span-1 rounded-xl">
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </BentoGrid>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <H1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ARIS Lead Intelligence
            </H1>
            <Lead className="text-lg">
              AI-powered lead qualification and scoring to prioritize your best prospects
            </Lead>
          </div>
          
          <div className="flex items-center gap-4">
            <EnhancedButton
              onClick={handleBulkScoring}
              disabled={isScoring}
              variant="premium"
              beam="prominent"
              className="relative"
            >
              {isScoring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI Scoring...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Score All Leads
                </>
              )}
            </EnhancedButton>
            
            <Button variant="outline" asChild>
              <Link href="/dashboard/leads/new">
                <User className="w-4 h-4 mr-2" />
                Add Lead
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Analytics Overview - Enhanced Bento Grid */}
      {analytics && (
        <BentoGrid className="w-full auto-rows-[12rem] grid-cols-4 gap-4">
          <BentoCard
            name="Total Leads"
            className="col-span-1 relative"
            background={
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{analytics.total_contacts}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Contacts in System</div>
                </div>
              </div>
            }
            Icon={Users}
            description="Total contacts in your database"
            href="#"
            cta="View All"
          />

          <BentoCard
            name="AI Scored"
            className="col-span-1 relative"
            background={
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 p-6 flex items-center justify-center">
                <BorderBeam size={60} duration={12} delay={2} />
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{analytics.scored_contacts}</div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">AI Analyzed</div>
                </div>
              </div>
            }
            Icon={Brain}
            description="Leads analyzed by AI"
            href="#"
            cta="View Scored"
          />

          <BentoCard
            name="Hot Leads"
            className="col-span-1 relative"
            background={
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 p-6 flex items-center justify-center">
                {analytics.qualification_breakdown.hot > 0 && <BorderBeam size={60} duration={8} delay={0} />}
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-900 dark:text-red-100">{analytics.qualification_breakdown.hot}</div>
                  <div className="text-sm text-red-600 dark:text-red-400">High Priority</div>
                </div>
              </div>
            }
            Icon={Target}
            description="Ready for immediate follow-up"
            href="#"
            cta="Contact Now"
          />

          <BentoCard
            name="Avg Score"
            className="col-span-1"
            background={
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 p-6 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">{Math.round(analytics.average_score)}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Average Quality</div>
                </div>
              </div>
            }
            Icon={BarChart3}
            description="Overall lead quality score"
            href="#"
            cta="View Details"
          />
        </BentoGrid>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Lead Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={qualificationFilter} onValueChange={setQualificationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Qualification Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="hot">🔥 Hot</SelectItem>
                    <SelectItem value="warm">🟡 Warm</SelectItem>
                    <SelectItem value="cold">🔵 Cold</SelectItem>
                    <SelectItem value="unqualified">⚪ Unqualified</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Score Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scores</SelectItem>
                    <SelectItem value="high">High (70+)</SelectItem>
                    <SelectItem value="medium">Medium (40-69)</SelectItem>
                    <SelectItem value="low">Low (<40)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Leads List */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Scored Leads
                </span>
                <Badge variant="secondary">{filteredContacts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {filteredContacts.map((contact, index) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border hover:border-primary/50 transition-all duration-200 bg-card hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {contact.firstName} {contact.lastName}
                            </h3>
                            {contact.leadScore && (
                              <Badge 
                                className={getQualificationColor(contact.leadScore.qualification_status)}
                                variant="outline"
                              >
                                {contact.leadScore.qualification_status.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {contact.email}
                            </div>
                            {contact.company && (
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4" />
                                {contact.company}
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                {contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {contact.leadScore && (
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${getScoreColor(contact.leadScore.overall_score)}`}>
                                {contact.leadScore.overall_score}
                              </div>
                              <div className="text-xs text-muted-foreground">Score</div>
                            </div>
                          )}
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/dashboard/contacts/${contact.id}`}>
                                <Edit className="w-4 h-4" />
                              </Link>
                            </Button>
                            {contact.leadScore?.overall_score && contact.leadScore.overall_score > 70 && (
                              <EnhancedButton
                                size="sm"
                                variant="success"
                                beam="subtle"
                                onClick={() => {
                                  toast({
                                    title: "🎯 Priority Lead!",
                                    description: "This lead is ready for immediate follow-up",
                                  });
                                  triggerConfetti();
                                }}
                              >
                                <Zap className="w-4 h-4" />
                              </EnhancedButton>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {contact.leadScore && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div>
                              <div className="text-muted-foreground">Engagement</div>
                              <Progress value={contact.leadScore.engagement_score} className="mt-1 h-2" />
                            </div>
                            <div>
                              <div className="text-muted-foreground">Behavioral</div>
                              <Progress value={contact.leadScore.behavioral_score} className="mt-1 h-2" />
                            </div>
                            <div>
                              <div className="text-muted-foreground">Company</div>
                              <Progress value={contact.leadScore.company_score} className="mt-1 h-2" />
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {filteredContacts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No leads match your current filters</p>
                    <p className="text-sm">Try adjusting your search criteria</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-green-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Live updates from your lead scoring system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatedList className="max-h-96 overflow-y-auto">
                {recentActivities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div 
                      className="p-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `${activity.color}20`, color: activity.color }}
                    >
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </AnimatedList>
              
              {recentActivities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
