'use client';

import React, { useState, useEffect } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { SettingsForm } from '@/components/settings/settings-form';
import Link from 'next/link';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Crown, 
  MoreHorizontal,
  Trash2,
  Settings,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TeamMember {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: string;
  status: 'active' | 'invited' | 'suspended';
  created_at: string;
  last_sign_in_at?: string;
}

interface OrganizationStats {
  totalMembers: number;
  activeMembers: number;
  invitedMembers: number;
  subscriptionLimit: number;
  plan: string;
  // Optional admin AI metrics for quick visibility in settings
  aiMonthlyMessages?: number;
  aiMonthlyCostUsd?: number;
  aiMonthlyAutoApproved?: number;
}

export default function TeamSettingsPage() {
  const { data: session } = useOptimizedAuth();
  const { organization, isLoading: orgLoading } = useOrganization();
  const { hasFeature } = useSubscriptionFeatures(organization?.id || '');
  const { toast } = useToast();
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Load team members and stats
  useEffect(() => {
    if (organization?.id) {
      loadTeamData();
    }
  }, [organization?.id]);

  const loadTeamData = async () => {
    if (!organization?.id) return;
    
    try {
      setIsLoading(true);
      
      // Load team members
      const membersResponse = await fetch(`/api/organization/members`);
      if (membersResponse.ok) {
        const membersData = await membersResponse.json();
        setMembers(membersData.members || []);
      }
      
      // Load organization stats
      const statsResponse = await fetch(`/api/organization/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const nextStats: OrganizationStats = statsData;
        // Try to enrich with quick AI metrics from admin org endpoint if permitted
        try {
          const adminOrgRes = await fetch(`/api/admin/organizations/${organization.id}`);
          if (adminOrgRes.ok) {
            const adminData = await adminOrgRes.json();
            const m = adminData?.organization?.metrics;
            if (m) {
              nextStats.aiMonthlyMessages = m.monthly_ai_messages;
              nextStats.aiMonthlyCostUsd = m.monthly_ai_cost_usd;
              nextStats.aiMonthlyAutoApproved = m.monthly_auto_approved;
            }
          }
        } catch {}
        setStats(nextStats);
      }
      
    } catch (error) {
      console.error('Error loading team data:', error);
      toast({
        title: "Error",
        description: "Failed to load team information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    try {
      const response = await fetch('/api/organization/invite-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (response.ok) {
        toast({
          title: "Invitation sent",
          description: `Invitation sent to ${inviteEmail}`,
        });
        setInviteEmail('');
        setInviteRole('member');
        setShowInviteDialog(false);
        loadTeamData(); // Refresh the list
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to send invitation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/organization/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast({
          title: "Role updated",
          description: "Member role has been updated successfully.",
        });
        loadTeamData(); // Refresh the list
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update role.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/organization/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Member removed",
          description: `${memberEmail} has been removed from the team.`,
        });
        loadTeamData(); // Refresh the list
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to remove member.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member.",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'invited':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (orgLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team information...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Organization</CardTitle>
          <CardDescription>
            You need to be part of an organization to manage team members.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // For now, allow team access for all organizations
  // TODO: Add proper subscription tier checking when subscription system is implemented
  const hasTeamAccess = true;

  return (
    <SettingsForm
      title="Team"
      description="Manage your organization's team members and their roles."
      onSave={async () => {}} // No form data to save
      initialData={{}}
    >
      <div className="space-y-6">
        {/* Organization Stats */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {organization.name} Team Overview
              </CardTitle>
              <CardDescription>
                You are signed in as <strong>{session?.user?.email}</strong> (Admin)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
                  <div className="text-sm text-muted-foreground">Total Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.activeMembers}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.invitedMembers}</div>
                  <div className="text-sm text-muted-foreground">Invited</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.subscriptionLimit}</div>
                  <div className="text-sm text-muted-foreground">User Limit</div>
                </div>
              </div>
              {typeof stats.aiMonthlyMessages === 'number' && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{stats.aiMonthlyMessages}</div>
                    <div className="text-sm text-muted-foreground">AI messages (30d)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">${(stats.aiMonthlyCostUsd || 0).toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">AI cost (30d)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{stats.aiMonthlyAutoApproved || 0}</div>
                    <div className="text-sm text-muted-foreground">Auto approvals (30d)</div>
                  </div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Plan:</span>
                  <Badge variant="outline" className="capitalize">{stats.plan}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Collaboration Features - only show for Pro+ users */}
        {hasFeature('TEAM_COLLABORATION') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Team Collaboration
            </CardTitle>
            <CardDescription>
              Access real-time collaboration features for your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">Collaboration Dashboard</h4>
                  <p className="text-sm text-muted-foreground">
                    Real-time notes, team presence, activity feeds, and assignment management
                  </p>
                </div>
                <Link href="/dashboard/team">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    Open Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Real-time collaborative notes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Team presence indicators</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Activity tracking & analytics</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage your team members and their access levels.
                </CardDescription>
              </div>
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to add a new member to your team.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input
                        id="invite-email"
                        type="email"
                        placeholder="Enter email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="invite-role">Role</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowInviteDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleInviteMember}
                        disabled={isInviting}
                      >
                        {isInviting ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No team members found.</p>
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>
                          {getInitials(member.name, member.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {member.name || member.email}
                        </div>
                        {member.name && (
                          <div className="text-sm text-muted-foreground">
                            {member.email}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className={getRoleBadgeColor(member.role)}
                          >
                            <div className="flex items-center gap-1">
                              {getRoleIcon(member.role)}
                              {member.role}
                            </div>
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getStatusBadgeColor(member.status)}
                          >
                            {member.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Joined {formatDate(member.created_at)}
                          {member.last_sign_in_at && (
                            <> • Last active {formatDate(member.last_sign_in_at)}</>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {member.role !== 'owner' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleUpdateRole(member.id, 'admin')}
                              disabled={member.role === 'admin'}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateRole(member.id, 'member')}
                              disabled={member.role === 'member'}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Make Member
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id, member.email)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          </>
                        )}
                        {member.role === 'owner' && (
                          <DropdownMenuItem disabled>
                            <Crown className="h-4 w-4 mr-2" />
                            Organization Owner
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsForm>
  );
}