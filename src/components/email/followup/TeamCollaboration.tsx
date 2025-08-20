'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  UserPlus, 
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Bell,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'agent';
  status: 'online' | 'offline' | 'busy';
  workload: number; // 0-100
  response_rate: number;
  avg_response_time: number;
}

interface FollowUpAssignment {
  id: string;
  followup_id: string;
  assigned_to: string;
  assigned_by: string;
  assigned_at: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  notes?: string;
  completion_notes?: string;
  completed_at?: string;
}

interface TeamComment {
  id: string;
  followup_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
  is_internal: boolean;
}

interface TeamCollaborationProps {
  followupId?: string;
  className?: string;
}

export default function TeamCollaboration({ followupId, className }: TeamCollaborationProps) {
  const [activeTab, setActiveTab] = useState<'assignments' | 'team' | 'comments'>('assignments');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [newComment, setNewComment] = useState('');

  // Mock data - in production, this would come from your API
  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      avatar: '/avatars/sarah.jpg',
      role: 'manager',
      status: 'online',
      workload: 75,
      response_rate: 89.5,
      avg_response_time: 4.2
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike@company.com',
      avatar: '/avatars/mike.jpg',
      role: 'agent',
      status: 'online',
      workload: 60,
      response_rate: 92.1,
      avg_response_time: 3.8
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily@company.com',
      avatar: '/avatars/emily.jpg',
      role: 'agent',
      status: 'busy',
      workload: 85,
      response_rate: 87.3,
      avg_response_time: 5.1
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david@company.com',
      avatar: '/avatars/david.jpg',
      role: 'agent',
      status: 'offline',
      workload: 45,
      response_rate: 94.2,
      avg_response_time: 3.2
    }
  ];

  const assignments: FollowUpAssignment[] = [
    {
      id: '1',
      followup_id: 'f1',
      assigned_to: '2',
      assigned_by: '1',
      assigned_at: '2024-01-15T10:00:00Z',
      due_date: '2024-01-16T17:00:00Z',
      priority: 'high',
      status: 'in_progress',
      notes: 'High-value client, needs personal attention'
    },
    {
      id: '2',
      followup_id: 'f2',
      assigned_to: '3',
      assigned_by: '1',
      assigned_at: '2024-01-15T09:30:00Z',
      due_date: '2024-01-15T18:00:00Z',
      priority: 'urgent',
      status: 'overdue',
      notes: 'Urgent response needed for contract renewal'
    },
    {
      id: '3',
      followup_id: 'f3',
      assigned_to: '4',
      assigned_by: '2',
      assigned_at: '2024-01-14T14:00:00Z',
      due_date: '2024-01-15T12:00:00Z',
      priority: 'medium',
      status: 'completed',
      notes: 'Standard follow-up for demo request',
      completion_notes: 'Successfully contacted and scheduled demo',
      completed_at: '2024-01-15T11:30:00Z'
    }
  ];

  const comments: TeamComment[] = [
    {
      id: '1',
      followup_id: followupId || 'f1',
      user_id: '1',
      user_name: 'Sarah Johnson',
      user_avatar: '/avatars/sarah.jpg',
      content: 'This client has been unresponsive for 2 weeks. Consider escalating to phone call.',
      created_at: '2024-01-15T10:30:00Z',
      is_internal: true
    },
    {
      id: '2',
      followup_id: followupId || 'f1',
      user_id: '2',
      user_name: 'Mike Chen',
      content: 'I tried calling yesterday but got voicemail. Will try again this afternoon.',
      created_at: '2024-01-15T11:15:00Z',
      is_internal: true
    }
  ];

  const handleAssignFollowup = () => {
    if (!selectedMember) return;
    
    // In production, this would call your API
    console.log('Assigning followup to:', selectedMember, 'with notes:', assignmentNotes);
    
    setShowAssignDialog(false);
    setSelectedMember('');
    setAssignmentNotes('');
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    // In production, this would call your API
    console.log('Adding comment:', newComment);
    
    setNewComment('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Team Collaboration
          </h3>
          <p className="text-sm text-gray-600">Assign, track, and collaborate on follow-ups</p>
        </div>
        
        <Button onClick={() => setShowAssignDialog(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Follow-up
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'assignments'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Target className="h-4 w-4 inline mr-2" />
          Assignments
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'team'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Team
        </button>
        <button
          onClick={() => setActiveTab('comments')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'comments'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="h-4 w-4 inline mr-2" />
          Comments
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'assignments' && (
          <motion.div
            key="assignments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {assignments.map((assignment) => {
              const assignedMember = teamMembers.find(m => m.id === assignment.assigned_to);
              const assignedBy = teamMembers.find(m => m.id === assignment.assigned_by);
              
              return (
                <Card key={assignment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={assignedMember?.avatar} />
                              <AvatarFallback>{assignedMember?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{assignedMember?.name}</p>
                              <p className="text-xs text-gray-500">
                                Assigned by {assignedBy?.name}
                              </p>
                            </div>
                          </div>
                          
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          
                          <div className="flex items-center gap-2">
                            {getStatusIcon(assignment.status)}
                            <Badge className={getStatusColor(assignment.status)}>
                              {assignment.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(assignment.priority)}>
                              {assignment.priority}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due: {new Date(assignment.due_date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {assignment.notes && (
                          <p className="text-sm text-gray-700 bg-gray-50 rounded p-2 mb-2">
                            {assignment.notes}
                          </p>
                        )}
                        
                        {assignment.completion_notes && (
                          <p className="text-sm text-green-700 bg-green-50 rounded p-2">
                            <strong>Completed:</strong> {assignment.completion_notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        {assignment.status !== 'completed' && (
                          <Button size="sm">
                            Update
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'team' && (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {teamMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={member.status === 'online' ? 'default' : 'secondary'}>
                            {member.status}
                          </Badge>
                          <Badge variant="outline">{member.role}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <Button size="sm" variant="outline">
                      <Bell className="h-4 w-4 mr-1" />
                      Notify
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Workload</span>
                        <span>{member.workload}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            member.workload > 80 ? 'bg-red-500' : 
                            member.workload > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${member.workload}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Response Rate</p>
                        <p className="font-medium">{member.response_rate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg Response</p>
                        <p className="font-medium">{member.avg_response_time}h</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {activeTab === 'comments' && (
          <motion.div
            key="comments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Add Comment */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add an internal comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Internal comments are only visible to team members
                    </p>
                    <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                      Add Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="space-y-3">
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.user_avatar} />
                        <AvatarFallback>{comment.user_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{comment.user_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </p>
                          {comment.is_internal && (
                            <Badge variant="outline" className="text-xs">
                              Internal
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignment Dialog */}
      {showAssignDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Assign Follow-up</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Assign to
                </label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {member.workload}% load
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Assignment Notes
                </label>
                <Textarea
                  placeholder="Add any special instructions or context..."
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignFollowup} disabled={!selectedMember}>
                  Assign
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}