import { createServiceRoleClient } from '@/lib/supabase/service-role';

export type Provider = 'microsoft' | 'google';

export async function getSyncState(accountId: string, provider: Provider) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from('email_sync_state')
    .select('provider, account_id, state, updated_at')
    .eq('account_id', accountId)
    .eq('provider', provider)
    .maybeSingle();
  return data as { provider: Provider; account_id: string; state: any; updated_at: string } | null;
}

export async function setSyncState(accountId: string, provider: Provider, state: any) {
  const supabase = createServiceRoleClient();
  await supabase
    .from('email_sync_state')
    .upsert({ provider, account_id: accountId, state, updated_at: new Date().toISOString() }, { onConflict: 'account_id,provider' });
}

