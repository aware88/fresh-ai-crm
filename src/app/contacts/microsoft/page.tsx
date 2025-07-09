import { Metadata } from 'next';
import ContactsList from '@/components/contacts/ContactsList';

export const metadata: Metadata = {
  title: 'Microsoft Contacts - CRM Mind',
  description: 'Microsoft Graph Contacts integration for CRM Mind',
};

export default function ContactsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Microsoft Contacts</h1>
      <ContactsList />
    </div>
  );
}
