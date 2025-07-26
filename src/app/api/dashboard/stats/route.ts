import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ImapFlow } from 'imapflow';
import * as crypto from 'crypto';

// Helper function to decrypt password
function decryptPassword(encryptedPassword: string): string {
  const key = process.env.PASSWORD_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('PASSWORD_ENCRYPTION_KEY not set in environment variables');
  }
  
  const keyBuffer = Buffer.from(key, 'hex').slice(0, 32);
  const parts = encryptedPassword.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted password format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Helper function to count unread emails from Gmail account
async function getUnreadEmailCountFromGmail(account: any): Promise<number> {
  try {
    let accessToken = account.access_token;

    // Check if token is expired and refresh if needed
    if (account.token_expires_at) {
      const now = new Date();
      const tokenExpiry = new Date(account.token_expires_at);
      
      if (tokenExpiry <= now && account.refresh_token) {
        // Refresh token
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: account.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshResponse.ok) {
          const tokenData = await refreshResponse.json();
          accessToken = tokenData.access_token;
        } else {
          console.warn(`Failed to refresh token for ${account.email}`);
          return 0;
        }
      }
    }

    // Get unread emails count from Gmail
    const gmailResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=1',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!gmailResponse.ok) {
      console.warn(`Gmail API error for ${account.email}:`, gmailResponse.status);
      return 0;
    }

    const gmailData = await gmailResponse.json();
    return gmailData.resultSizeEstimate || 0;

  } catch (error) {
    console.warn(`Error getting Gmail unread count for ${account.email}:`, error);
    return 0;
  }
}

// Helper function to count unread emails from IMAP account
async function getUnreadEmailCountFromIMAP(account: any): Promise<number> {
  try {
    const password = decryptPassword(account.password_encrypted);
    const secure = account.imap_security === 'SSL/TLS';
    
    const clientOptions: any = {
      host: account.imap_host,
      port: account.imap_port || 993,
      secure,
      auth: {
        user: account.username || account.email,
        pass: password,
      },
      logger: false,
      connectTimeout: 10000, // 10 second timeout for dashboard
      tls: {
        rejectUnauthorized: false
      }
    };
    
    if (account.imap_security === 'STARTTLS') {
      clientOptions.requireTLS = true;
    }

    const client = new ImapFlow(clientOptions);
    
    try {
      await client.connect();
      const mailbox = await client.mailboxOpen('INBOX');
      
      // Search for unseen messages to get count
      const unseenMessages = await client.search({ seen: false });
      const unseenCount = unseenMessages ? unseenMessages.length : 0;
      
      await client.logout();
      return unseenCount;
    } finally {
      try {
        await client.logout();
      } catch (error) {
        // Ignore logout errors
      }
    }
  } catch (error) {
    console.warn(`Error getting unread count for ${account.email}:`, error);
    return 0;
  }
}

export async function GET(request: Request) {
  try {
    // Check if user is authenticated using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('Dashboard stats: No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const organizationId = (session.user as any)?.organizationId || userId;
    
    console.log('Dashboard stats: Session found for user:', userId);
    


    // Create Supabase client for database queries (using newer SSR package)
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Initialize default values
    let unreadEmails = 0;
    let upcomingTasks = 0;
    let newMessages = 0;
    let completedOrders = 0;
    let prevUnreadEmails = 0;
    let prevUpcomingTasks = 0;
    let prevNewMessages = 0;
    let prevCompletedOrders = 0;

    try {
      // Get dashboard statistics in parallel with error handling for each query
      const [
        unreadEmailsResult,
        upcomingTasksResult,
        newMessagesResult,
        completedOrdersResult
      ] = await Promise.allSettled([
        // Count unread emails from emails table (received emails)
        supabase
          .from('emails')
          .select('id', { count: 'exact', head: true })
          .eq('read', false)
          .eq('user_id', userId),
        
        // Count upcoming tasks from interactions table
        supabase
          .from('interactions')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'task')
          .eq('created_by', userId)
          .is('completed_at', null),
        
        // Count new messages (recent emails received in last 24 hours)
        supabase
          .from('emails')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()), // Last 24 hours
        
        // Count completed orders/sales documents
        supabase
          .from('sales_documents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      ]);

      // Process results with error handling
      if (unreadEmailsResult.status === 'fulfilled' && unreadEmailsResult.value.data !== null) {
        unreadEmails = unreadEmailsResult.value.count || 0;

      }
      
      // If no unread emails found in database, try to get count from connected email accounts
      if (unreadEmails === 0) {
        try {
          // Get connected email accounts using service role client to bypass RLS
          console.log('Dashboard stats: Querying email accounts for user:', userId);
          
          // Import service role client
          const { createServiceRoleClient } = require('@/lib/supabase/service-role');
          const serviceSupabase = createServiceRoleClient();
          
          const { data: emailAccounts, error: accountsError } = await serviceSupabase
            .from('email_accounts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);
            
          console.log('Dashboard stats: Email accounts query result:', { 
            emailAccounts: emailAccounts?.length || 0, 
            error: accountsError?.message || 'none' 
          });
          
          if (emailAccounts && emailAccounts.length > 0) {
            console.log('Dashboard stats: Found accounts:', emailAccounts.map((acc: any) => `${acc.email} (${acc.provider_type})`));
          }
          
          if (!accountsError && emailAccounts && emailAccounts.length > 0) {
            console.log('Dashboard stats: Found email accounts:', emailAccounts.map((acc: any) => ({ email: acc.email, provider: acc.provider_type })));
            let totalUnreadFromAccounts = 0;
            
            for (const account of emailAccounts) {
              try {
                if (account.provider_type === 'imap') {
                  // Handle IMAP accounts
                  const count = await getUnreadEmailCountFromIMAP(account);
                  console.log(`Dashboard stats: IMAP ${account.email} unread count:`, count);
                  totalUnreadFromAccounts += count;
                } else if (account.provider_type === 'google') {
                  // Handle Gmail accounts
                  const count = await getUnreadEmailCountFromGmail(account);
                  console.log(`Dashboard stats: Gmail ${account.email} unread count:`, count);
                  totalUnreadFromAccounts += count;
                }
              } catch (accountError) {
                console.warn(`Error getting unread count for ${account.email}:`, accountError);
              }
            }
            
                        unreadEmails = totalUnreadFromAccounts;
            console.log('Dashboard stats: Final unread emails count:', unreadEmails);
            } else {
            console.log('Dashboard stats: No email accounts found or error occurred');
          }
          } catch (accountsError) {
          console.warn('Error fetching email accounts for unread count:', accountsError);
        }
      }
      if (upcomingTasksResult.status === 'fulfilled' && upcomingTasksResult.value.data !== null) {
        upcomingTasks = upcomingTasksResult.value.count || 0;

      }
      
      // If no tasks found in interactions, check for pending email analyses or follow-ups
      if (upcomingTasks === 0) {
        try {
          // Count unread emails as potential tasks that need attention
          const { count: emailTasksCount, error: emailTasksError } = await supabase
            .from('emails')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false)
            .is('analysis', null); // Emails that haven't been analyzed yet

          if (!emailTasksError && emailTasksCount) {
            upcomingTasks = Math.min(emailTasksCount, 5); // Cap at 5 to avoid overwhelming
          }
        } catch (error) {
          console.warn('Error counting email-based tasks:', error);
        }
      }
      if (newMessagesResult.status === 'fulfilled' && newMessagesResult.value.data !== null) {
        newMessages = newMessagesResult.value.count || 0;

      }
      
      // If no recent messages found in database, get recent emails from all connected accounts
      if (newMessages === 0) {
        try {
          const { data: emailAccounts, error: accountsError } = await supabase
            .from('email_accounts')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);
          
          if (!accountsError && emailAccounts && emailAccounts.length > 0) {
            let recentMessageCount = 0;
            
            for (const account of emailAccounts) {
              try {
                let unreadCount = 0;
                
                if (account.provider_type === 'imap') {
                  unreadCount = await getUnreadEmailCountFromIMAP(account);
                } else if (account.provider_type === 'google') {
                  unreadCount = await getUnreadEmailCountFromGmail(account);
                }
                
                // If there are unread emails, likely some are recent
                if (unreadCount > 0) {
                  recentMessageCount += Math.min(unreadCount, 5); // Cap at 5 per account
                }
              } catch (error) {
                console.warn(`Error checking recent messages for ${account.email}:`, error);
              }
            }
            
            newMessages = recentMessageCount;
          }
        } catch (error) {
          console.warn('Error fetching recent messages from accounts:', error);
        }
      }
      if (completedOrdersResult.status === 'fulfilled' && completedOrdersResult.value.data !== null) {
        completedOrders = completedOrdersResult.value.count || 0;

      }

      // Get previous period data for calculating changes with proper timezone handling
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(now.getDate() - 60);
      sixtyDaysAgo.setHours(0, 0, 0, 0);
      
      console.log('Dashboard stats date ranges:', {
        now: now.toISOString(),
        thirtyDaysAgo: thirtyDaysAgo.toISOString(),
        sixtyDaysAgo: sixtyDaysAgo.toISOString()
      });

      const [
        prevUnreadEmailsResult,
        prevUpcomingTasksResult,
        prevNewMessagesResult,
        prevCompletedOrdersResult
      ] = await Promise.allSettled([
        // Previous period unread emails (received more than 30 days ago)
        supabase
          .from('emails')
          .select('id', { count: 'exact', head: true })
          .eq('read', false)
          .eq('user_id', userId)
          .lt('created_at', thirtyDaysAgo.toISOString()),
        
        // Previous period tasks
        supabase
          .from('interactions')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'task')
          .eq('created_by', userId)
          .is('completed_at', null)
          .lt('createdat', thirtyDaysAgo.toISOString()),
        
        // Previous period messages (48 hours, 30-60 days ago)
        supabase
          .from('emails')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', new Date(sixtyDaysAgo.getTime()).toISOString())
          .lt('created_at', new Date(thirtyDaysAgo.getTime()).toISOString()),
        
        // Previous period completed orders
        supabase
          .from('sales_documents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
          .eq('user_id', userId)
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString())
      ]);

      // Process previous period results with error handling
      if (prevUnreadEmailsResult.status === 'fulfilled' && prevUnreadEmailsResult.value.data !== null) {
        prevUnreadEmails = prevUnreadEmailsResult.value.count || 0;
      }
      if (prevUpcomingTasksResult.status === 'fulfilled' && prevUpcomingTasksResult.value.data !== null) {
        prevUpcomingTasks = prevUpcomingTasksResult.value.count || 0;
      }
      if (prevNewMessagesResult.status === 'fulfilled' && prevNewMessagesResult.value.data !== null) {
        prevNewMessages = prevNewMessagesResult.value.count || 0;
      }
      if (prevCompletedOrdersResult.status === 'fulfilled' && prevCompletedOrdersResult.value.data !== null) {
        prevCompletedOrders = prevCompletedOrdersResult.value.count || 0;
      }

    } catch (dbError) {
      console.warn('Some database queries failed, using fallback data:', dbError);
      // Continue with default values (all zeros)
    }

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      const sign = change >= 0 ? '+' : '';
      return `${sign}${change.toFixed(1)}%`;
    };

    const calculateChangeType = (current: number, previous: number): 'positive' | 'negative' | 'neutral' => {
      if (current > previous) return 'positive';
      if (current < previous) return 'negative';
      return 'neutral';
    };

    // Return the dashboard statistics
    const stats = [
      {
        name: 'Unread Emails',
        value: unreadEmails.toString(),
        change: calculateChange(unreadEmails, prevUnreadEmails),
        changeType: calculateChangeType(unreadEmails, prevUnreadEmails)
      },
      {
        name: 'Upcoming Tasks',
        value: upcomingTasks.toString(),
        change: calculateChange(upcomingTasks, prevUpcomingTasks),
        changeType: calculateChangeType(upcomingTasks, prevUpcomingTasks)
      },
      {
        name: 'New Messages',
        value: newMessages.toString(),
        change: calculateChange(newMessages, prevNewMessages),
        changeType: calculateChangeType(newMessages, prevNewMessages)
      },
      {
        name: 'Completed Orders',
        value: completedOrders.toString(),
        change: calculateChange(completedOrders, prevCompletedOrders),
        changeType: calculateChangeType(completedOrders, prevCompletedOrders)
      }
    ];

    console.log('Dashboard stats: Returning stats:', JSON.stringify(stats, null, 2));
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    
    // Return fallback data instead of error
    const fallbackStats = [
      {
        name: 'Unread Emails',
        value: '0',
        change: '0%',
        changeType: 'neutral' as const
      },
      {
        name: 'Upcoming Tasks',
        value: '0',
        change: '0%',
        changeType: 'neutral' as const
      },
      {
        name: 'New Messages',
        value: '0',
        change: '0%',
        changeType: 'neutral' as const
      },
      {
        name: 'Completed Orders',
        value: '0',
        change: '0%',
        changeType: 'neutral' as const
      }
    ];

    console.log('Dashboard stats: ERROR - Returning fallback stats:', JSON.stringify(fallbackStats, null, 2));
    return NextResponse.json(fallbackStats);
  }
} 