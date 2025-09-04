/**
 * Lead Scoring Dashboard Component
 * Overview dashboard for lead scoring analytics and management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  RefreshCw,
  Filter,
  Download,
  Search
} from 'lucide-react';
import type { 
  LeadScoringAnalytics,
  ContactWithScore,
  QualificationStatus
} from '@/types/lead-scoring';

interface LeadScoringDashboardProps {
  organizationId?: string;
  onContactSelect?: (contact: ContactWithScore) => void;
}

export const LeadScoringDashboard: React.FC<LeadScoringDashboardProps> = ({
  organizationId,
  onContactSelect
}) => {
  const [analytics, setAnalytics] = useState<LeadScoringAnalytics | null>(null);
  const [contacts, setContacts] = useState<ContactWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    qualification_status: [] as QualificationStatus[],
    min_score: '',
    max_score: '',
    search: ''
  });

  // Load analytics data
  const loadAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organization_id', organizationId);

      const response = await fetch(`/api/lead-scoring/analytics?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  // Load contacts data
  const loadContacts = async () => {
    try {
      const params = new URLSearchParams();
      if (organizationId) params.append('organization_id', organizationId);
      if (filters.qualification_status.length > 0) {
        params.append('qualification_status', filters.qualification_status.join(','));
      }
      if (filters.min_score) params.append('min_score', filters.min_score);
      if (filters.max_score) params.append('max_score', filters.max_score);
      params.append('limit', '50');

      const response = await fetch(`/api/lead-scoring/contacts?${params}`);
      const data = await response.json();

      if (data.success) {
        let filteredContacts = data.data.contacts;

        // Apply search filter client-side
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredContacts = filteredContacts.filter((contact: ContactWithScore) =>
            contact.firstname?.toLowerCase().includes(searchLower) ||
            contact.lastname?.toLowerCase().includes(searchLower) ||
            contact.email?.toLowerCase().includes(searchLower) ||
            contact.company?.toLowerCase().includes(searchLower)
          );
        }

        setContacts(filteredContacts);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  // Load data on mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadAnalytics(), loadContacts()]);
      setLoading(false);
    };

    loadData();
  }, [organizationId, filters]);

  // Handle filter changes
  const handleStatusFilterChange = (status: QualificationStatus) => {
    setFilters(prev => ({
      ...prev,
      qualification_status: prev.qualification_status.includes(status)
        ? prev.qualification_status.filter(s => s !== status)
        : [...prev.qualification_status, status]
    }));
  };

  // Handle contact status update
  const handleStatusUpdate = async (contactId: string, status: QualificationStatus) => {
    try {
      const response = await fetch('/api/lead-scoring/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contactId,
          qualification_status: status,
          reason: 'Manual update from dashboard'
        })
      });

      if (response.ok) {
        // Reload data to reflect changes
        loadContacts();
        loadAnalytics();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading lead scoring data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Scoring</h1>
          <p className="text-muted-foreground">
            Analyze and qualify your leads with AI-powered scoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_contacts}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.scored_contacts} scored
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(analytics.average_score)}
              </div>
              <p className="text-xs text-muted-foreground">
                Out of 100 points
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {analytics.qualification_distribution.hot}
              </div>
              <p className="text-xs text-muted-foreground">
                High-priority contacts
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
                {analytics.total_contacts > 0 
                  ? Math.round(((analytics.qualification_distribution.hot + analytics.qualification_distribution.warm) / analytics.total_contacts) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Hot + Warm leads
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Qualification Distribution */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Lead Quality Distribution</CardTitle>
            <CardDescription>
              Breakdown of leads by qualification status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Object.entries(analytics.qualification_distribution).map(([status, count]) => (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={status === 'hot' ? 'destructive' : 
                              status === 'warm' ? 'default' : 
                              status === 'cold' ? 'secondary' : 'outline'}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                  <Progress 
                    value={analytics.total_contacts > 0 ? (count / analytics.total_contacts) * 100 : 0}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts Table */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Contacts</TabsTrigger>
            <TabsTrigger value="hot">Hot Leads</TabsTrigger>
            <TabsTrigger value="warm">Warm Leads</TabsTrigger>
            <TabsTrigger value="cold">Cold Leads</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-8 w-64"
              />
            </div>
            <Select
              value={filters.min_score}
              onValueChange={(value) => setFilters(prev => ({ ...prev, min_score: value }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Min Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any</SelectItem>
                <SelectItem value="80">80+</SelectItem>
                <SelectItem value="60">60+</SelectItem>
                <SelectItem value="40">40+</SelectItem>
                <SelectItem value="20">20+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <ContactsTable 
            contacts={contacts}
            onContactSelect={onContactSelect}
            onStatusUpdate={handleStatusUpdate}
          />
        </TabsContent>

        <TabsContent value="hot" className="space-y-4">
          <ContactsTable 
            contacts={contacts.filter(c => c.lead_score?.qualification_status === 'hot')}
            onContactSelect={onContactSelect}
            onStatusUpdate={handleStatusUpdate}
          />
        </TabsContent>

        <TabsContent value="warm" className="space-y-4">
          <ContactsTable 
            contacts={contacts.filter(c => c.lead_score?.qualification_status === 'warm')}
            onContactSelect={onContactSelect}
            onStatusUpdate={handleStatusUpdate}
          />
        </TabsContent>

        <TabsContent value="cold" className="space-y-4">
          <ContactsTable 
            contacts={contacts.filter(c => c.lead_score?.qualification_status === 'cold')}
            onContactSelect={onContactSelect}
            onStatusUpdate={handleStatusUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Contacts Table Component
const ContactsTable: React.FC<{
  contacts: ContactWithScore[];
  onContactSelect?: (contact: ContactWithScore) => void;
  onStatusUpdate?: (contactId: string, status: QualificationStatus) => void;
}> = ({ contacts, onContactSelect, onStatusUpdate }) => {
  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No contacts found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Contact</th>
                <th className="text-left p-4 font-medium">Company</th>
                <th className="text-left p-4 font-medium">Score</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Last Contact</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <div 
                      className="cursor-pointer"
                      onClick={() => onContactSelect?.(contact)}
                    >
                      <div className="font-medium">
                        {contact.firstname} {contact.lastname}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {contact.email}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>{contact.company || '-'}</div>
                    {contact.position && (
                      <div className="text-sm text-muted-foreground">
                        {contact.position}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`font-bold ${getScoreColor(contact.lead_score?.overall_score)}`}>
                      {contact.lead_score?.overall_score || 0}
                    </span>
                  </td>
                  <td className="p-4">
                    <Badge 
                      variant={
                        contact.lead_score?.qualification_status === 'hot' ? 'destructive' :
                        contact.lead_score?.qualification_status === 'warm' ? 'default' :
                        contact.lead_score?.qualification_status === 'cold' ? 'secondary' : 'outline'
                      }
                    >
                      {contact.lead_score?.qualification_status || 'unqualified'}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {contact.lastcontact 
                      ? new Date(contact.lastcontact).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="p-4">
                    <Select
                      value={contact.lead_score?.qualification_status || 'unqualified'}
                      onValueChange={(value: QualificationStatus) => 
                        onStatusUpdate?.(contact.id, value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">Hot</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="cold">Cold</SelectItem>
                        <SelectItem value="unqualified">Unqualified</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};