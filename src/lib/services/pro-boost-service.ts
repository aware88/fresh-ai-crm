import { createClient } from '@/lib/supabase/server';

export interface ProBoostStatus {
  active: boolean;
  used: boolean;
  startAt?: string;
  endAt?: string;
}

// Features temporarily unlocked during Pro Boost
export const PRO_BOOST_FEATURES: readonly string[] = [
  'PSYCHOLOGICAL_PROFILING',
  'ADVANCED_PSYCHOLOGICAL_PROFILING',
  'CRM_ASSISTANT',
  'SALES_TACTICS',
  'PERSONALITY_INSIGHTS',
  'AI_DRAFTING_ASSISTANCE',
  'AI_FUTURE_ACCESS'
] as const;

class ProBoostService {
  private supabasePromise = createClient();

  /** Get latest subscription row for organization */
  private async getLatestSubscription(organizationId: string) {
    const supabase = await this.supabasePromise;
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .in('status', ['active', 'trialing'])
      .order('current_period_end', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('ProBoost:getLatestSubscription error', error);
      return null;
    }
    return data;
  }

  /** Read Pro Boost status from subscription metadata */
  async getStatus(organizationId: string): Promise<ProBoostStatus> {
    const subscription = await this.getLatestSubscription(organizationId);
    if (!subscription) return { active: false, used: false };

    const meta = (subscription.metadata || {}) as any;
    const pb = (meta.pro_boost || {}) as any;

    const now = new Date();
    const active = !!pb.active && pb.end_at && new Date(pb.end_at) > now;
    const used = !!pb.used;

    // Auto-deactivate if expired but still marked active
    if (pb.active && pb.end_at && new Date(pb.end_at) <= now) {
      await this.updateMetadata(subscription.id, {
        ...meta,
        pro_boost: { ...pb, active: false }
      });
    }

    return {
      active,
      used,
      startAt: pb.start_at || undefined,
      endAt: pb.end_at || undefined
    };
  }

  /** Activate Pro Boost for a limited time (default 7 days) */
  async activate(organizationId: string, durationDays: number = 7): Promise<ProBoostStatus | null> {
    const subscription = await this.getLatestSubscription(organizationId);
    if (!subscription) return null;

    const meta = (subscription.metadata || {}) as any;
    const pb = (meta.pro_boost || {}) as any;

    // Only allow once
    if (pb.used) {
      return this.getStatus(organizationId);
    }

    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + durationDays);

    const newMeta = {
      ...meta,
      pro_boost: {
        active: true,
        used: true,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        duration_days: durationDays
      }
    };

    const ok = await this.updateMetadata(subscription.id, newMeta);
    if (!ok) return null;

    return {
      active: true,
      used: true,
      startAt: newMeta.pro_boost.start_at,
      endAt: newMeta.pro_boost.end_at
    };
  }

  /** Update subscription metadata */
  private async updateMetadata(subscriptionId: string, metadata: any): Promise<boolean> {
    const { error } = await this.supabase
      .from('organization_subscriptions')
      .update({ metadata })
      .eq('id', subscriptionId);
    if (error) {
      console.error('ProBoost:updateMetadata error', error);
      return false;
    }
    return true;
  }
}

export const proBoostService = new ProBoostService();



