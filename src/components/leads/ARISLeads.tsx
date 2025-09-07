'use client';

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Calendar,
  Eye,
  Edit,
  Trash2,
  Target,
  TrendingUp,
  Users,
  Brain
} from "lucide-react";

// Sample data matching ARIS design
const leads = [
  {
    id: 1,
    name: "Sarah Chen",
    company: "TechCorp",
    email: "sarah@techcorp.com",
    phone: "+1 (555) 123-4567",
    status: "Hot",
    score: 92,
    lastContact: "2 hours ago",
    nextAction: "Demo scheduled"
  },
  {
    id: 2,
    name: "Mike Johnson",
    company: "StartupXYZ",
    email: "mike@startupxyz.com",
    phone: "+1 (555) 234-5678",
    status: "Warm",
    score: 76,
    lastContact: "1 day ago",
    nextAction: "Follow-up email"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    company: "Enterprise Inc",
    email: "emily@enterprise.com",
    phone: "+1 (555) 345-6789",
    status: "Cold",
    score: 45,
    lastContact: "1 week ago",
    nextAction: "Re-engagement"
  },
  {
    id: 4,
    name: "David Kim",
    company: "Innovation Labs",
    email: "david@innovation.com",
    phone: "+1 (555) 456-7890",
    status: "Hot",
    score: 88,
    lastContact: "30 minutes ago",
    nextAction: "Contract review"
  },
  {
    id: 5,
    name: "Lisa Wang",
    company: "Growth Solutions",
    email: "lisa@growth.com",
    phone: "+1 (555) 567-8901",
    status: "Warm",
    score: 67,
    lastContact: "3 days ago",
    nextAction: "Product demo"
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Hot": return "bg-red-100 text-red-800 hover:bg-red-200"
    case "Warm": return "bg-orange-100 text-orange-800 hover:bg-orange-200"
    case "Cold": return "bg-blue-100 text-blue-800 hover:bg-blue-200"
    default: return "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-green-600"
  if (score >= 60) return "text-orange-600"
  return "text-red-600"
};

interface ARISLeadsProps {
  contacts?: any[];
  loading?: boolean;
}

export function ARISLeads({ contacts = [], loading = false }: ARISLeadsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<typeof leads[0] | null>(null);

  // Use sample data if no contacts provided
  const displayLeads = contacts.length > 0 ? contacts.map((contact, index) => ({
    id: contact.id || index,
    name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.name || `Lead ${index + 1}`,
    company: contact.company || contact.companyName || 'Unknown Company',
    email: contact.email || `lead${index + 1}@example.com`,
    phone: contact.phone || '+1 (555) 000-0000',
    status: contact.leadScore?.qualification_status || contact.status || 'Cold',
    score: contact.leadScore?.overall_score || Math.floor(Math.random() * 100),
    lastContact: contact.lastContact || '1 day ago',
    nextAction: contact.nextAction || 'Follow-up required'
  })) : leads;

  const filteredLeads = displayLeads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Manage and track your sales prospects</p>
        </div>
        <Button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <div className="icon-primary">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredLeads.length}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              Active prospects
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hot Leads</CardTitle>
            <div className="icon-primary">
              <Target className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredLeads.filter(lead => lead.status === 'Hot').length}
            </div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <div className="icon-primary">
              <Brain className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(filteredLeads.reduce((sum, lead) => sum + lead.score, 0) / filteredLeads.length)}
            </div>
            <p className="text-xs text-muted-foreground">AI scoring</p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <div className="icon-primary">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24.5%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="card-base">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search leads..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="hover-lift">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads Table */}
        <Card className="lg:col-span-2 card-feature">
          <CardHeader>
            <CardTitle>All Leads ({filteredLeads.length})</CardTitle>
            <CardDescription>Track and manage your sales prospects</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Last Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow 
                    key={lead.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="" alt={lead.name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {lead.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.company}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getScoreColor(lead.score)}`}>
                        {lead.score}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.lastContact}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover-lift">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Meeting
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Lead Details */}
        <Card className="card-feature">
          <CardHeader>
            <CardTitle>Lead Details</CardTitle>
            <CardDescription>
              {selectedLead ? "Detailed information" : "Select a lead to view details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedLead ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" alt={selectedLead.name} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {selectedLead.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedLead.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedLead.company}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">{selectedLead.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-sm">{selectedLead.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedLead.status)}>
                        {selectedLead.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Lead Score</label>
                    <p className={`text-sm font-medium ${getScoreColor(selectedLead.score)}`}>
                      {selectedLead.score}/100
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Next Action</label>
                    <p className="text-sm">{selectedLead.nextAction}</p>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button className="w-full btn-primary" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" className="w-full hover-lift" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Call Lead
                  </Button>
                  <Button variant="outline" className="w-full hover-lift" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a lead from the list to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}










