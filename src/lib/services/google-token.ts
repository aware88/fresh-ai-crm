import { createServiceRoleClient } from '@/lib/supabase/service-role';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export async function getValidGoogleAccessToken(params: {
  userId: string;
  accountId?: string;
}): Promise<{ accessToken: string; accountId: string } | null> {
  const supabase = createServiceRoleClient();
  const query = supabase
    .from('email_accounts')
    .select('id, access_token, refresh_token, token_expires_at')
    .eq('user_id', params.userId)
    .eq('provider_type', 'google')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1);

  const { data: account, error } = params.accountId
    ? await supabase
        .from('email_accounts')
        .select('id, access_token, refresh_token, token_expires_at')
        .eq('id', params.accountId)
        .eq('user_id', params.userId)
        .eq('provider_type', 'google')
        .eq('is_active', true)
        .maybeSingle()
    : await query.maybeSingle();

  if (error || !account) return null;

  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at).getTime() : 0;
  const needsRefresh = !account.access_token || Date.now() > (expiresAt - 60_000);

  if (!needsRefresh) {
    return { accessToken: account.access_token as string, accountId: account.id };
  }

  if (!account.refresh_token) return null;

  // Refresh token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: account.refresh_token as string,
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok || !tokens.access_token) return null;

  const newExpiresAt = Math.floor(Date.now() / 1000 + (tokens.expires_in || 3600));
  await supabase
    .from('email_accounts')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || account.refresh_token,
      token_expires_at: new Date(newExpiresAt * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  return { accessToken: tokens.access_token, accountId: account.id };
}

