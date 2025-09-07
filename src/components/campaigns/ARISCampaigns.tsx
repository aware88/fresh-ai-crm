'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Mail, 
  Users, 
  TrendingUp, 
  Calendar,
  Play,
  Pause,
  Edit,
  Eye,
  Copy,
  BarChart3
} from "lucide-react";

const campaigns = [
  {
    id: 1,
    name: "Q4 Enterprise Outreach",
    type: "Email Sequence",
    status: "Active",
    prospects: 156,
    sent: 1240,
    opened: 287,
    replied: 43,
    converted: 12,
    startDate: "Dec 1, 2024",
    openRate: 23.1,
    replyRate: 3.5,
    conversionRate: 7.7
  },
  {
    id: 2,
    name: "SaaS Startup Follow-up", 
    type: "Drip Campaign",
    status: "Scheduled",
    prospects: 89,
    sent: 0,
    opened: 0,
    replied: 0,
    converted: 0,
    startDate: "Dec 10, 2024",
    openRate: 0,
    replyRate: 0,
    conversionRate: 0
  },
  {
    id: 3,
    name: "Product Demo Series",
    type: "Nurture",
    status: "Active",
    prospects: 67,
    sent: 402,
    opened: 270,
    replied: 89,
    converted: 23,
    startDate: "Nov 15, 2024",
    openRate: 67.2,
    replyRate: 22.1,
    conversionRate: 25.8
  },
  {
    id: 4,
    name: "Cold Outreach - Tech",
    type: "Prospecting",
    status: "Paused",
    prospects: 234,
    sent: 468,
    opened: 93,
    replied: 12,
    converted: 2,
    startDate: "Nov 1, 2024",
    openRate: 19.9,
    replyRate: 2.6,
    conversionRate: 16.7
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "bg-green-100 text-green-800 hover:bg-green-200"
    case "Scheduled": return "bg-blue-100 text-blue-800 hover:bg-blue-200"
    case "Paused": return "bg-orange-100 text-orange-800 hover:bg-orange-200"
    case "Completed": return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    default: return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "Email Sequence": return "bg-blue-50 text-blue-700 border-blue-200"
    case "Drip Campaign": return "bg-purple-50 text-purple-700 border-purple-200"
    case "Nurture": return "bg-green-50 text-green-700 border-green-200"
    case "Prospecting": return "bg-orange-50 text-orange-700 border-orange-200"
    default: return "bg-gray-50 text-gray-700 border-gray-200"
  }
};

interface ARISCampaignsProps {
  loading?: boolean;
}

export function ARISCampaigns({ loading = false }: ARISCampaignsProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
          <p className="text-muted-foreground">Manage your email campaigns and sequences</p>
        </div>
        <Button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <div className="icon-primary">
              <Play className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Running now</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
            <div className="icon-primary">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">546</div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Open Rate</CardTitle>
            <div className="icon-primary">
              <Mail className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">37.5%</div>
            <p className="text-xs text-muted-foreground">Industry avg: 24%</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <div className="icon-primary">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">37</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.map((campaign, index) => (
          <Card key={campaign.id} className="card-feature animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="icon-primary">
                    <Mail className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className={getTypeColor(campaign.type)}>
                        {campaign.type}
                      </Badge>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {campaign.startDate}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="hover-lift">
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button variant="outline" size="sm" className="hover-lift">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="hover-lift">
                    <Copy className="h-4 w-4 mr-2" />
                    Clone
                  </Button>
                  {campaign.status === "Active" ? (
                    <Button variant="outline" size="sm" className="hover-lift">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : campaign.status === "Paused" ? (
                    <Button variant="outline" size="sm" className="hover-lift">
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {/* Prospects */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{campaign.prospects}</div>
                  <div className="text-sm text-muted-foreground">Prospects</div>
                </div>

                {/* Sent */}
                <div className="text-center">
                  <div className="text-2xl font-bold">{campaign.sent}</div>
                  <div className="text-sm text-muted-foreground">Emails Sent</div>
                </div>

                {/* Open Rate */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{campaign.openRate}%</div>
                  <div className="text-sm text-muted-foreground">Open Rate</div>
                  <div className="text-xs text-muted-foreground">{campaign.opened} opened</div>
                </div>

                {/* Reply Rate */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{campaign.replyRate}%</div>
                  <div className="text-sm text-muted-foreground">Reply Rate</div>
                  <div className="text-xs text-muted-foreground">{campaign.replied} replies</div>
                </div>

                {/* Conversion */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{campaign.conversionRate}%</div>
                  <div className="text-sm text-muted-foreground">Conversion</div>
                  <div className="text-xs text-muted-foreground">{campaign.converted} converted</div>
                </div>
              </div>

              {/* Progress Bar */}
              {campaign.status === "Active" && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Campaign Progress</span>
                    <span>{Math.round((campaign.sent / (campaign.prospects * 5)) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(campaign.sent / (campaign.prospects * 5)) * 100} 
                    className="h-3"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button className="h-16 btn-primary animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col items-center gap-2">
            <Plus className="h-5 w-5" />
            <span>New Campaign</span>
          </div>
        </Button>
        <Button variant="outline" className="h-16 hover-lift animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-col items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span>Campaign Analytics</span>
          </div>
        </Button>
        <Button variant="outline" className="h-16 hover-lift animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex flex-col items-center gap-2">
            <Mail className="h-5 w-5" />
            <span>Email Templates</span>
          </div>
        </Button>
      </div>
    </div>
  );
}










