import ContactDetailsClient from './ContactDetailsClient';

interface PageParams {
  id: string;
}

interface ContactDetailsPageProps {
  params: PageParams;
}

export default async function ContactDetailsPage({ params }: ContactDetailsPageProps) {
  // Await params to fix Next.js 15 requirement
  const resolvedParams = await params;
  
  // Pass the id directly to the client component
  return <ContactDetailsClient id={resolvedParams.id} />;
}
