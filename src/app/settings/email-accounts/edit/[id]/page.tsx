import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerClient } from '@/lib/supabase/server';
import EditImapAccountForm from './EditImapAccountForm';

export default async function EditEmailAccountPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }
  
  const supabase = await createServerClient();
  
  // Fetch the email account
  const { data: account, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();
  
  if (error || !account) {
    redirect('/settings/email-accounts');
  }
  
  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold mb-2">Edit Email Account</h1>
      <p className="text-muted-foreground mb-6">
        Update your IMAP email account settings.
      </p>
      
      <EditImapAccountForm userId={session.user.id} account={account} />
    </div>
  );
}
