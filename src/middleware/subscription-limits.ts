import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canAddMoreContacts, canAddMoreUsers, canAddMoreEmailAccounts } from '@/lib/subscription-feature-check';
import { createClient } from '@/lib/supabase/server';

// In-memory cache for count data (resets on server restart)
// In production, consider using Redis or similar for persistence
const countCache = new Map<string, { count: number; timestamp: number; organizationId: string }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper to get cached count or fetch fresh
async function getCachedCount(
  tableName: string,
  organizationId: string,
  filters: Record<string, string> = {}
): Promise<number> {
  const cacheKey = `${tableName}:${organizationId}:${JSON.stringify(filters)}`;
  const cached = countCache.get(cacheKey);
  
  // Return cached value if less than 5 minutes old
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.count;
  }
  
  // Fetch fresh count
  const supabase = await createClient();
  let query = supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);
    
  // Apply additional filters
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  
  const { count, error } = await query;
  
  if (error) {
    throw error;
  }
  
  const finalCount = count || 0;
  
  // Cache the result
  countCache.set(cacheKey, {
    count: finalCount,
    timestamp: Date.now(),
    organizationId
  });
  
  return finalCount;
}

// Helper to invalidate cache for an organization
function invalidateOrgCache(organizationId: string) {
  for (const [key, value] of countCache.entries()) {
    if (value.organizationId === organizationId) {
      countCache.delete(key);
    }
  }
}

/**
 * Middleware to check subscription limits before creating new contacts
 * Now uses caching for improved performance
 */
export async function checkContactLimit(
  req: NextRequest,
  organizationId: string
): Promise<NextResponse | null> {
  try {
    // Get the current contact count using cache
    const currentContactCount = await getCachedCount('contacts', organizationId);
    
    // Check if the organization can add more contacts
    const { canAdd, reason } = await canAddMoreContacts(organizationId, currentContactCount);
    
    if (!canAdd) {
      return NextResponse.json(
        { error: reason || 'Contact limit reached' },
        { status: 403 }
      );
    }
    
    // If the check passes, return null to continue with the request
    return null;
  } catch (error) {
    console.error('Error checking contact limit:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription limits' },
      { status: 500 }
    );
  }
}

/**
 * Middleware to check subscription limits before creating new users
 * Now uses caching for improved performance
 */
export async function checkUserLimit(
  req: NextRequest,
  organizationId: string
): Promise<NextResponse | null> {
  try {
    // Get the current user count using cache
    const currentUserCount = await getCachedCount('organization_users', organizationId);
    
    // Check if the organization can add more users
    const { canAdd, reason } = await canAddMoreUsers(organizationId, currentUserCount);
    
    if (!canAdd) {
      return NextResponse.json(
        { error: reason || 'User limit reached' },
        { status: 403 }
      );
    }
    
    // If the check passes, return null to continue with the request
    return null;
  } catch (error) {
    console.error('Error checking user limit:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription limits' },
      { status: 500 }
    );
  }
}

/**
 * Middleware to check subscription limits before creating new email accounts
 * Now uses caching for improved performance
 */
export async function checkEmailAccountLimit(
  req: NextRequest,
  organizationId: string
): Promise<NextResponse | null> {
  try {
    // Get the current email account count using cache
    const currentEmailAccountCount = await getCachedCount('email_accounts', organizationId);
    
    // Check if the organization can add more email accounts
    const { canAdd, reason, limit } = await canAddMoreEmailAccounts(organizationId, currentEmailAccountCount);
    
    if (!canAdd) {
      return NextResponse.json(
        { error: reason || 'Email account limit reached', limit },
        { status: 403 }
      );
    }
    
    // If the check passes, return null to continue with the request
    return null;
  } catch (error) {
    console.error('Error checking email account limit:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription limits' },
      { status: 500 }
    );
  }
}

/**
 * Invalidate cached counts for an organization
 * Call this after creating/deleting entities to ensure accurate counts
 */
export function invalidateOrganizationCache(organizationId: string): void {
  invalidateOrgCache(organizationId);
}

/**
 * Example of how to use these middleware functions in an API route:
 * 
 * ```typescript
 * // In your API route handler
 * export async function POST(request: NextRequest) {
 *   const organizationId = '...'; // Get from request
 *   
 *   // Check email account limit
 *   const limitCheck = await checkEmailAccountLimit(request, organizationId);
 *   if (limitCheck) return limitCheck; // Return error response if limit reached
 *   
 *   // Continue with email account creation
 *   // ... create the email account ...
 *   
 *   // Invalidate cache after creation
 *   invalidateOrganizationCache(organizationId);
 *   
 *   return NextResponse.json({ success: true });
 * }
 * ```
 */
