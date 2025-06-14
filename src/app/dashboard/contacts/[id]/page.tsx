import ContactDetailsClient from './ContactDetailsClient';

interface PageParams {
  id: string;
}

interface ContactDetailsPageProps {
  params: PageParams;
}

export default function ContactDetailsPage({ params }: ContactDetailsPageProps) {
  // Pass the id directly to the client component
  return <ContactDetailsClient id={params.id} />;
}
