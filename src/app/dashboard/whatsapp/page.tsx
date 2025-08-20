'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useOrganization } from '@/hooks/useOrganization';
import { useSubscriptionFeatures } from '@/hooks/useSubscriptionFeatures';
import { Button, Input, Separator, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Alert } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MessageSquare } from 'lucide-react';
import { useEffect as useEffectReact } from 'react';
import toast from 'react-hot-toast';

type WhatsAppSettings = {
  provider: 'meta' | 'twilio' | 'other';
  phoneNumber?: string;
  accessToken?: string; // Meta or provider token (stored server-side)
  phoneNumberId?: string; // Meta Cloud API phone number ID
  verifyToken?: string; // Webhook verify token
  status?: 'disconnected' | 'connected' | 'error';
  updatedAt?: string;
};

export default function WhatsAppPage() {
  const { data: session, status } = useSession();
  const { organization } = useOrganization();
  const organizationId = organization?.id || '';
  const { hasFeature, isLoading: featuresLoading } = useSubscriptionFeatures(organizationId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<WhatsAppSettings>({ provider: 'meta' });
  const [connected, setConnected] = useState(false);

  const isAuthorized = useMemo(() => status === 'authenticated' && !!session?.user, [status, session]);
  const featureEnabled = useMemo(() => hasFeature('WHATSAPP_INTEGRATION', false), [hasFeature]);

  useEffect(() => {
    if (!organizationId) return;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/whatsapp/settings`);
        if (res.ok) {
          const data = await res.json();
          if (data?.settings) {
            setSettings(data.settings);
            setConnected(data.settings.status === 'connected');
          }
        }
      } catch (err) {
        console.error('Failed to load WhatsApp settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [organizationId]);

  const [conversations, setConversations] = useState<Array<{ contact_id: string; last_message: string; last_at: string }>>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<any>>([]);
  const [convOffset, setConvOffset] = useState(0);
  const [msgOffset, setMsgOffset] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    const loadConversations = async () => {
      const res = await fetch(`/api/whatsapp/conversations?limit=${pageSize}&offset=${convOffset}`);
      if (res.ok) {
        const data = await res.json();
        setConversations((prev) => (convOffset === 0 ? data.conversations : [...prev, ...data.conversations]));
      }
    };
    loadConversations();
  }, [convOffset]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedContactId) return;
      const res = await fetch(`/api/whatsapp/messages?contactId=${selectedContactId}&limit=${pageSize}&offset=${msgOffset}`);
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => (msgOffset === 0 ? data.messages : [...prev, ...data.messages]));
      }
    };
    loadMessages();
  }, [selectedContactId, msgOffset]);

  const saveSettings = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/whatsapp/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save settings');
      }
      setConnected(data.settings?.status === 'connected');
      toast.success('WhatsApp settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testSend = async () => {
    try {
      const to = prompt('Enter WhatsApp number in international format (e.g., +15551234567)');
      if (!to) return;
      const message = prompt('Message to send');
      if (!message) return;
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to send');
      toast.success('Test message queued');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send');
    }
  };

  if (!isAuthorized) return null;

  // For premium users, we'll show a "Coming Soon" message instead of the full interface
  // Comment out the original implementation until the feature is ready
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Integration</CardTitle>
          <CardDescription>Connect your WhatsApp Business to manage chats inside ARIS.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Coming Soon</AlertTitle>
            <AlertDescription>
              WhatsApp Business integration is currently in development and will be available soon. 
              Your Premium plan already includes access to this feature when it launches.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
  
  /* Original implementation - will be enabled when the feature is ready
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1">Connect your WhatsApp Business and manage conversations in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={connected ? 'default' : 'secondary'}>{connected ? 'Connected' : 'Not connected'}</Badge>
          <Button variant="outline" onClick={testSend} disabled={!connected}>Send test</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection</CardTitle>
            <CardDescription>Configure provider credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={settings.provider}
                onValueChange={(v) => setSettings((s) => ({ ...s, provider: v as WhatsAppSettings['provider'] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meta">Meta WhatsApp Cloud API</SelectItem>
                  <SelectItem value="twilio">Twilio WhatsApp</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {settings.provider === 'meta' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                  <Input
                    id="phoneNumberId"
                    placeholder="e.g., 123456789012345"
                    value={settings.phoneNumberId || ''}
                    onChange={(e) => setSettings((s) => ({ ...s, phoneNumberId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verifyToken">Webhook Verify Token</Label>
                  <Input
                    id="verifyToken"
                    placeholder="Your verify token"
                    value={settings.verifyToken || ''}
                    onChange={(e) => setSettings((s) => ({ ...s, verifyToken: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    placeholder="Paste long-lived access token"
                    value={settings.accessToken || ''}
                    onChange={(e) => setSettings((s) => ({ ...s, accessToken: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {settings.provider === 'twilio' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Sender Number (WhatsApp)</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="e.g., +15551234567"
                    value={settings.phoneNumber || ''}
                    onChange={(e) => setSettings((s) => ({ ...s, phoneNumber: e.target.value }))}
                  />
                </div>
                <Alert>
                  <AlertTitle>Credentials configured in environment</AlertTitle>
                  <AlertDescription>
                    Twilio Account SID and Auth Token should be provided via environment variables.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save' }
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook</CardTitle>
            <CardDescription>Configure webhook URL in your provider.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Verification URL</Label>
              <Input readOnly value={`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/webhooks/whatsapp/${organizationId || '{orgId}'}`} />
              <p className="text-xs text-muted-foreground">Use this as callback URL for verification and message delivery.</p>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <ul className="text-sm list-disc pl-5 space-y-1 text-muted-foreground">
                <li>For Meta Cloud API, set the verify token to match your configuration.</li>
                <li>Ensure your deployment has a public URL and HTTPS.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>Recent WhatsApp chats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {conversations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No conversations yet.</div>
            ) : (
              <div className="space-y-2">
                {conversations.map((c) => (
                  <button
                    key={c.contact_id}
                    className={`w-full text-left p-3 rounded-md border ${selectedContactId === c.contact_id ? 'bg-gray-50' : ''}`}
                    onClick={() => { setSelectedContactId(c.contact_id); setMsgOffset(0); }}
                  >
                    <div className="text-xs text-muted-foreground">{new Date(c.last_at).toLocaleString()}</div>
                    <div className="truncate">{c.last_message}</div>
                  </button>
                ))}
                <div className="pt-2">
                  <Button variant="outline" onClick={() => setConvOffset((v) => v + pageSize)}>Load more</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Thread</CardTitle>
            <CardDescription>{selectedContactId ? 'Messages' : 'Select a conversation'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedContactId ? (
              <div className="text-sm text-muted-foreground">Choose a conversation to view messages.</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">No messages yet.</div>
            ) : (
              <>
                {messages.map((m) => (
                  <div key={m.id} className="p-3 rounded-md border text-sm">
                    <div className="text-xs text-muted-foreground">{new Date(m.interaction_date).toLocaleString()}</div>
                    <div className="mt-1">{m.content || ''}</div>
                  </div>
                ))}
                <div>
                  <Button variant="outline" onClick={() => setMsgOffset((v) => v + pageSize)}>Load more</Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
  */
}

