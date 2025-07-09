import { Metadata } from 'next';
import MicrosoftGraphNav from '@/components/navigation/MicrosoftGraphNav';

export const metadata: Metadata = {
  title: 'Microsoft 365 Integration - CRM Mind',
  description: 'Microsoft Graph API integration for CRM Mind',
};

export default function MicrosoftDashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Microsoft 365 Integration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1">
          <MicrosoftGraphNav />
        </div>
        
        <div className="col-span-3 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Microsoft 365 Integration Overview</h2>
          
          <p className="mb-4">
            The Microsoft 365 integration provides seamless access to your Outlook email, calendar, and contacts
            directly within CRM Mind. This integration leverages the Microsoft Graph API to provide a
            comprehensive experience without leaving the CRM environment.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Email</h3>
              <p className="text-sm text-gray-600">
                Access your Outlook emails, send new messages, and manage your inbox directly from the CRM.
              </p>
              <a href="/email/outlook" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
                Go to Email →
              </a>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Calendar</h3>
              <p className="text-sm text-gray-600">
                View and manage your calendar events, schedule meetings, and stay organized.
              </p>
              <a href="/calendar" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
                Go to Calendar →
              </a>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Contacts</h3>
              <p className="text-sm text-gray-600">
                Access your Microsoft contacts and manage them directly within the CRM.
              </p>
              <a href="/contacts/microsoft" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
                Go to Contacts →
              </a>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium mb-2">Integration with Metakocka</h3>
            <p className="text-sm text-gray-600">
              The Microsoft 365 integration works seamlessly with Metakocka features, providing enriched email
              content with relevant customer and product information from your Metakocka account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
