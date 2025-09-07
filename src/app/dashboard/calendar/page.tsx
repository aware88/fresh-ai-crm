'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Video, 
  Phone, 
  Mail, 
  Users, 
  Target,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Spinner } from '@/components/ui/spinner';

// Event type definitions
interface CalendarEvent {
  id: string;
  title: string;
  type: string;
  category: string;
  date: Date;
  endDate: Date;
  description: string;
  attendees: string[];
  location?: string;
  color: string;
  source?: 'microsoft' | 'google' | 'local';
  isAllDay?: boolean;
}

// Mock events for demo - will be replaced with real data
const mockLocalEvents: CalendarEvent[] = [
  {
    id: 'local-1',
    title: 'Lead Follow-up: John Smith',
    type: 'meeting',
    category: 'lead',
    date: new Date(2025, 0, 8, 10, 0),
    endDate: new Date(2025, 0, 8, 11, 0),
    description: 'Discuss product demo and pricing',
    attendees: ['john.smith@company.com'],
    location: 'Video Call',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    source: 'local'
  },
  {
    id: 'local-2',
    title: 'Campaign Review',
    type: 'task',
    category: 'campaign',
    date: new Date(2025, 0, 8, 14, 0),
    endDate: new Date(2025, 0, 8, 15, 0),
    description: 'Review Q1 email campaign performance',
    attendees: ['marketing@team.com'],
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    source: 'local'
  }
];

const eventTypes = [
  { value: 'meeting', label: 'Meeting', icon: Video },
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'task', label: 'Task', icon: Target },
  { value: 'milestone', label: 'Milestone', icon: Target }
];

const eventCategories = [
  { value: 'lead', label: 'Lead Activity', color: 'bg-blue-100 text-blue-800' },
  { value: 'campaign', label: 'Campaign', color: 'bg-purple-100 text-purple-800' },
  { value: 'internal', label: 'Internal', color: 'bg-gray-100 text-gray-800' },
  { value: 'follow-up', label: 'Follow-up', color: 'bg-yellow-100 text-yellow-800' }
];

// Helper function to format date range
const formatDateRange = (start: Date, end: Date) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  if (start.toDateString() === end.toDateString()) {
    return `${formatTime(start)} - ${formatTime(end)}`;
  } else {
    return `${start.toLocaleDateString()} ${formatTime(start)} - ${end.toLocaleDateString()} ${formatTime(end)}`;
  }
};

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(mockLocalEvents);
  const [microsoftEvents, setMicrosoftEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarSource, setCalendarSource] = useState<'all' | 'microsoft' | 'google' | 'local'>('all');

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'meeting',
    category: 'lead',
    date: new Date(),
    time: '10:00',
    duration: '60',
    description: '',
    location: '',
    attendees: '',
    createInExternal: true // Create in Microsoft/Google calendar
  });

  // Fetch Microsoft calendar events if authenticated
  useEffect(() => {
    if (session?.accessToken && (session.provider === 'microsoft' || session.provider === 'azure-ad')) {
      fetchMicrosoftEvents();
    }
  }, [session, currentMonth]);

  const fetchMicrosoftEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Calculate date range for current month view
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const response = await fetch(
        `/api/calendar?startDateTime=${startDate.toISOString()}&endDateTime=${endDate.toISOString()}&top=100`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch Microsoft calendar events');
      }
      
      const data = await response.json();
      
      // Convert Microsoft events to our format
      const formattedEvents: CalendarEvent[] = (data.data || []).map((event: any) => ({
        id: event.id,
        title: event.subject,
        type: 'meeting',
        category: 'internal',
        date: new Date(event.start.dateTime),
        endDate: new Date(event.end.dateTime),
        description: event.bodyPreview || '',
        attendees: event.attendees?.map((a: any) => a.emailAddress.address) || [],
        location: event.location?.displayName,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        source: 'microsoft' as const,
        isAllDay: event.isAllDay
      }));
      
      setMicrosoftEvents(formattedEvents);
    } catch (err: any) {
      console.error('Error fetching Microsoft events:', err);
      setError('Unable to load Microsoft calendar events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    const [hours, minutes] = newEvent.time.split(':');
    const eventDate = new Date(newEvent.date);
    eventDate.setHours(parseInt(hours), parseInt(minutes));
    
    const endDate = new Date(eventDate);
    endDate.setMinutes(endDate.getMinutes() + parseInt(newEvent.duration));

    const categoryInfo = eventCategories.find(c => c.value === newEvent.category);
    
    const localEvent: CalendarEvent = {
      id: `local-${Date.now()}`,
      title: newEvent.title,
      type: newEvent.type,
      category: newEvent.category,
      date: eventDate,
      endDate: endDate,
      description: newEvent.description,
      location: newEvent.location,
      attendees: newEvent.attendees.split(',').map(a => a.trim()).filter(Boolean),
      color: categoryInfo?.color || 'bg-gray-100 text-gray-800 border-gray-200',
      source: 'local'
    };

    // If user is authenticated with Microsoft and wants to create in external calendar
    if (newEvent.createInExternal && session?.accessToken && (session.provider === 'microsoft' || session.provider === 'azure-ad')) {
      try {
        const response = await fetch('/api/calendar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subject: newEvent.title,
            content: newEvent.description,
            start: eventDate.toISOString(),
            end: endDate.toISOString(),
            location: newEvent.location,
            attendees: localEvent.attendees.map(email => ({
              email,
              name: email.split('@')[0],
              type: 'required'
            })),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create event in Microsoft calendar');
        }

        // Refresh Microsoft events
        await fetchMicrosoftEvents();
      } catch (err) {
        console.error('Error creating Microsoft event:', err);
        // Still add to local events even if Microsoft creation fails
        setEvents([...events, localEvent]);
      }
    } else {
      // Just add to local events
      setEvents([...events, localEvent]);
    }

    setIsCreateDialogOpen(false);
    
    // Reset form
    setNewEvent({
      title: '',
      type: 'meeting',
      category: 'lead',
      date: new Date(),
      time: '10:00',
      duration: '60',
      description: '',
      location: '',
      attendees: '',
      createInExternal: true
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
    setMicrosoftEvents(microsoftEvents.filter(e => e.id !== eventId));
    setSelectedEvent(null);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // Combine events based on source filter
  const getAllEvents = () => {
    let allEvents: CalendarEvent[] = [];
    
    if (calendarSource === 'all') {
      allEvents = [...events, ...microsoftEvents];
    } else if (calendarSource === 'microsoft') {
      allEvents = microsoftEvents;
    } else if (calendarSource === 'local') {
      allEvents = events;
    }
    
    return allEvents;
  };

  const getEventsForDate = (date: Date) => {
    return getAllEvents().filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const todayEvents = date ? getEventsForDate(date) : [];
  const upcomingEvents = getAllEvents()
    .filter(e => new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Check authentication status
  const isAuthenticated = status === 'authenticated' && session;
  const isMicrosoftAuth = isAuthenticated && (session.provider === 'microsoft' || session.provider === 'azure-ad');
  const isGoogleAuth = isAuthenticated && session.provider === 'google';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">
            {isMicrosoftAuth ? 'Synced with Microsoft Calendar' : 
             isGoogleAuth ? 'Google Calendar (coming soon)' : 
             'Local calendar - Sign in with Microsoft for sync'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isMicrosoftAuth && (
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMicrosoftEvents}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Schedule a meeting, call, or task
                  {isMicrosoftAuth && ' (will sync with Microsoft Calendar)'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="e.g., Follow-up with John Smith"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select 
                      value={newEvent.type} 
                      onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={newEvent.category} 
                      onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Select 
                      value={newEvent.duration} 
                      onValueChange={(value) => setNewEvent({ ...newEvent, duration: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="e.g., Conference Room, Video Call, Phone"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="attendees">Attendees (comma-separated emails)</Label>
                  <Input
                    id="attendees"
                    value={newEvent.attendees}
                    onChange={(e) => setNewEvent({ ...newEvent, attendees: e.target.value })}
                    placeholder="john@example.com, jane@example.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Add notes or agenda items..."
                    rows={3}
                  />
                </div>

                {isMicrosoftAuth && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="createInExternal"
                      checked={newEvent.createInExternal}
                      onChange={(e) => setNewEvent({ ...newEvent, createInExternal: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="createInExternal">
                      Also create in Microsoft Calendar
                    </Label>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEvent} disabled={!newEvent.title}>
                  Create Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Source Filter */}
      {(isMicrosoftAuth || isGoogleAuth) && (
        <div className="flex items-center gap-2">
          <Label>Show events from:</Label>
          <Select value={calendarSource} onValueChange={(value: any) => setCalendarSource(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Calendars</SelectItem>
              {isMicrosoftAuth && <SelectItem value="microsoft">Microsoft Only</SelectItem>}
              {isGoogleAuth && <SelectItem value="google">Google Only</SelectItem>}
              <SelectItem value="local">CRM Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar */}
        <div className="lg:col-span-2">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <CardDescription>
                  {loading ? 'Syncing...' : 'Click on a date to view events'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentMonth(new Date());
                    setDate(new Date());
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              )}
              
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border w-full"
              />

              {/* Calendar Legend */}
              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>CRM Events</span>
                </div>
                {isMicrosoftAuth && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Microsoft Calendar</span>
                  </div>
                )}
                {isGoogleAuth && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span>Google Calendar</span>
                  </div>
                )}
              </div>

              {/* Events for selected date */}
              {date && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Events on {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  {todayEvents.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No events scheduled</p>
                  ) : (
                    <div className="space-y-2">
                      {todayEvents.map(event => {
                        const EventIcon = eventTypes.find(t => t.value === event.type)?.icon || CalendarIcon;
                        return (
                          <div
                            key={event.id}
                            className={`p-3 rounded-lg border ${event.color} cursor-pointer hover:opacity-90 transition-opacity`}
                            onClick={() => setSelectedEvent(event)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <EventIcon className="h-4 w-4 mt-0.5" />
                                <div className="flex-1">
                                  <div className="font-medium">{event.title}</div>
                                  <div className="text-xs opacity-90 mt-1">
                                    {event.isAllDay ? 'All day' : formatDateRange(event.date, event.endDate)}
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1 text-xs mt-1">
                                      <MapPin className="h-3 w-3" />
                                      {event.location}
                                    </div>
                                  )}
                                  {event.source && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {event.source === 'microsoft' ? 'Outlook' : event.source}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {event.source === 'local' && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Edit functionality
                                    }}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEvent(event.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Authentication Status */}
          {!isAuthenticated && (
            <Card className="glass-card border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Sign in for Full Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Sign in with Microsoft to sync your Outlook calendar
                </p>
                <Button 
                  onClick={() => window.location.href = '/api/auth/signin'} 
                  className="w-full"
                >
                  Sign In
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Today's Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Meetings</span>
                </div>
                <span className="font-semibold">
                  {getAllEvents().filter(e => 
                    e.type === 'meeting' && 
                    new Date(e.date).toDateString() === new Date().toDateString()
                  ).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Calls</span>
                </div>
                <span className="font-semibold">
                  {getAllEvents().filter(e => 
                    e.type === 'call' && 
                    new Date(e.date).toDateString() === new Date().toDateString()
                  ).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Tasks</span>
                </div>
                <span className="font-semibold">
                  {getAllEvents().filter(e => 
                    e.type === 'task' && 
                    new Date(e.date).toDateString() === new Date().toDateString()
                  ).length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Upcoming Events</CardTitle>
              <CardDescription>Next 5 events</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map(event => {
                    const EventIcon = eventTypes.find(t => t.value === event.type)?.icon || CalendarIcon;
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="icon-primary mt-0.5">
                          <EventIcon className="h-3 w-3 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{event.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        {event.source && (
                          <Badge variant="outline" className="text-xs">
                            {event.source === 'microsoft' ? 'MS' : event.source === 'google' ? 'G' : 'CRM'}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setNewEvent({ ...newEvent, type: 'meeting' });
                  setIsCreateDialogOpen(true);
                }}
              >
                <Video className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setNewEvent({ ...newEvent, type: 'call' });
                  setIsCreateDialogOpen(true);
                }}
              >
                <Phone className="h-4 w-4 mr-2" />
                Schedule Call
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setNewEvent({ ...newEvent, type: 'task' });
                  setIsCreateDialogOpen(true);
                }}
              >
                <Target className="h-4 w-4 mr-2" />
                Create Task
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  setNewEvent({ ...newEvent, category: 'follow-up' });
                  setIsCreateDialogOpen(true);
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Set Follow-up
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2">
                <Badge className={selectedEvent?.color?.replace('border-', '')}>
                  {selectedEvent?.category}
                </Badge>
                {selectedEvent?.source && (
                  <Badge variant="outline">
                    {selectedEvent.source === 'microsoft' ? 'Microsoft Calendar' : 
                     selectedEvent.source === 'google' ? 'Google Calendar' : 
                     'CRM Event'}
                  </Badge>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {selectedEvent.isAllDay ? 'All day' : formatDateRange(selectedEvent.date, selectedEvent.endDate)}
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {selectedEvent.location}
                </div>
              )}
              {selectedEvent.attendees?.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    {selectedEvent.attendees.join(', ')}
                  </div>
                </div>
              )}
              {selectedEvent.description && (
                <div className="text-sm">
                  <p className="font-medium mb-1">Description</p>
                  <p className="text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
            {selectedEvent?.source === 'local' && (
              <Button variant="destructive" onClick={() => {
                handleDeleteEvent(selectedEvent.id);
                setSelectedEvent(null);
              }}>
                Delete Event
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}