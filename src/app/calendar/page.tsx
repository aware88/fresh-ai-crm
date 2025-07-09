import { Metadata } from 'next';
import CalendarView from '@/components/calendar/CalendarView';

export const metadata: Metadata = {
  title: 'Calendar - CRM Mind',
  description: 'Microsoft Graph Calendar integration for CRM Mind',
};

export default function CalendarPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Calendar</h1>
      <CalendarView />
    </div>
  );
}
