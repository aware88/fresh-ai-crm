import { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import AllInteractionsList from '@/components/interactions/AllInteractionsList';

export const metadata: Metadata = {
  title: 'Interactions | CRM Mind',
  description: 'View and manage all interactions with contacts',
};

export default function InteractionsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="Interactions"
        subheading="View and manage all interactions with your contacts"
      />
      
      <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
        <AllInteractionsList />
      </Suspense>
    </div>
  );
}
