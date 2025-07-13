'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface CalendarEvent {
  id: string;
  subject: string;
  bodyPreview: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  organizer: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  attendees: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
    type: string;
  }>;
  isAllDay: boolean;
}

export default function CalendarView() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    async function fetchEvents() {
      if (!session?.accessToken) {
        setError('Not authenticated with Microsoft Graph');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Calculate start and end dates for the current week
        const startDate = new Date(selectedDate);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6); // End of week (Saturday)
        endDate.setHours(23, 59, 59, 999);
        
        // Format dates for API
        const startDateTime = startDate.toISOString();
        const endDateTime = endDate.toISOString();
        
        const response = await fetch(
          `/api/calendar?startDateTime=${encodeURIComponent(startDateTime)}&endDateTime=${encodeURIComponent(endDateTime)}&top=50`
        );
        
        if (!response.ok) {
          throw new Error(`Error fetching calendar events: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEvents(data.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch calendar events:', err);
        setError(err.message || 'Failed to load calendar events. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [session, selectedDate]);

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    setSelectedDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group events by day
  const groupEventsByDay = () => {
    const days: { [key: string]: CalendarEvent[] } = {};
    
    // Initialize days of the week
    const startDate = new Date(selectedDate);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(day.getDate() + i);
      const dateKey = day.toISOString().split('T')[0];
      days[dateKey] = [];
    }
    
    // Group events by day
    events.forEach(event => {
      const eventDate = new Date(event.start.dateTime);
      const dateKey = eventDate.toISOString().split('T')[0];
      
      if (days[dateKey]) {
        days[dateKey].push(event);
      }
    });
    
    return days;
  };

  // Authentication handling
  if (status === 'loading') {
    return <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }
  
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="p-8 text-center">
        <Alert>
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>You need to sign in with Microsoft to access your calendar.</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => window.location.href = '/api/auth/signin/microsoft'}>
          Sign in with Microsoft
        </Button>
      </div>
    );
  }

  // Loading and error states
  if (loading) return <Spinner />;
  if (error) return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );

  const eventsByDay = groupEventsByDay();
  const daysOfWeek = Object.keys(eventsByDay).sort();

  return (
    <div className="calendar-view">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {selectedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="space-x-2">
          <Button onClick={handlePreviousWeek} variant="outline" size="sm">
            Previous Week
          </Button>
          <Button onClick={handleToday} variant="outline" size="sm">
            Today
          </Button>
          <Button onClick={handleNextWeek} variant="outline" size="sm">
            Next Week
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {daysOfWeek.map(day => {
          const date = new Date(day);
          const isToday = new Date().toISOString().split('T')[0] === day;
          
          return (
            <div 
              key={day} 
              className={`p-2 text-center font-medium ${isToday ? 'bg-blue-100 rounded' : ''}`}
            >
              <div>{date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
              <div>{date.getDate()}</div>
            </div>
          );
        })}
        
        {/* Events for each day */}
        {daysOfWeek.map(day => (
          <div key={`events-${day}`} className="border rounded p-2 h-64 overflow-y-auto">
            {eventsByDay[day].length === 0 ? (
              <p className="text-gray-400 text-sm text-center">No events</p>
            ) : (
              <ul className="space-y-2">
                {eventsByDay[day].map(event => (
                  <li 
                    key={event.id} 
                    className="p-2 rounded bg-blue-50 border border-blue-100 text-sm"
                  >
                    <div className="font-medium">{event.subject}</div>
                    <div className="text-xs text-gray-600">
                      {event.isAllDay ? (
                        'All day'
                      ) : (
                        `${formatDate(event.start.dateTime)} - ${formatDate(event.end.dateTime)}`
                      )}
                    </div>
                    {event.location?.displayName && (
                      <div className="text-xs text-gray-600">
                        📍 {event.location.displayName}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
