/**
 * Organization and membership types
 * 
 * This module provides TypeScript types for organizations and organization members.
 */

import { Database } from './supabase';

/**
 * Organization roles available to members
 */
export type OrganizationRole = 'admin' | 'member' | 'viewer';

/**
 * Organization subscription tiers
 */
export type SubscriptionTier = 'free' | 'basic' | 'professional' | 'enterprise';

/**
 * Organization subscription statuses
 */
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';

/**
 * Organization database row type
 */
export type Organization = Database['public']['Tables']['organizations']['Row'];

/**
 * Organization member database row type
 */
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row'];

/**
 * Organization with members
 */
export interface OrganizationWithMembers extends Organization {
  members: OrganizationMember[];
}

/**
 * Organization creation payload
 */
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert'];

/**
 * Organization update payload
 */
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update'];

/**
 * Organization member creation payload
 */
export type OrganizationMemberInsert = Database['public']['Tables']['organization_members']['Insert'];

/**
 * Organization member update payload
 */
export type OrganizationMemberUpdate = Database['public']['Tables']['organization_members']['Update'];
