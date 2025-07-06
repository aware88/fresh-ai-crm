import { getServerSession } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

/**
 * Service for managing Microsoft Graph access and refresh tokens
 */
export class MicrosoftTokenService {
  /**
   * Store Microsoft Graph tokens in the database
   * @param userId - The user ID
   * @param accessToken - The Microsoft Graph access token
   * @param refreshToken - The Microsoft Graph refresh token
   * @param expiresAt - The expiration timestamp
   */
  static async storeTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: number
  ) {
    try {
      const supabase = createClient();
      
      // Check if tokens already exist for this user
      const { data: existingTokens } = await supabase
        .from('microsoft_tokens')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (existingTokens) {
        // Update existing tokens
        await supabase
          .from('microsoft_tokens')
          .update({
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: new Date(expiresAt).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } else {
        // Insert new tokens
        await supabase
          .from('microsoft_tokens')
          .insert({
            user_id: userId,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: new Date(expiresAt).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error storing Microsoft tokens:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Microsoft Graph tokens for a user
   * @param userId - The user ID
   */
  static async getTokens(userId: string) {
    try {
      const supabase = createClient();
      
      const { data: tokens, error } = await supabase
        .from('microsoft_tokens')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      
      return { success: true, tokens };
    } catch (error: any) {
      console.error('Error getting Microsoft tokens:', error);
      return { success: false, error: error.message, tokens: null };
    }
  }

  /**
   * Refresh Microsoft Graph access token using the refresh token
   * @param userId - The user ID
   */
  static async refreshAccessToken(userId: string) {
    try {
      // Get the current tokens
      const { tokens, success } = await this.getTokens(userId);
      
      if (!success || !tokens) {
        throw new Error('No tokens found for user');
      }
      
      // Check if token is still valid
      const expiresAt = new Date(tokens.expires_at).getTime();
      const now = Date.now();
      
      // If token is still valid (with 5-minute buffer), return it
      if (expiresAt > now + 5 * 60 * 1000) {
        return { success: true, accessToken: tokens.access_token };
      }
      
      // Token needs refresh
      const refreshToken = tokens.refresh_token;
      
      // Prepare the token refresh request
      const tokenEndpoint = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('Missing Microsoft client credentials');
      }
      
      const params = new URLSearchParams();
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);
      params.append('refresh_token', refreshToken);
      params.append('grant_type', 'refresh_token');
      
      // Make the token refresh request
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Token refresh failed: ${errorData.error_description || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Calculate new expiration time
      const expiresIn = data.expires_in || 3600; // Default to 1 hour if not provided
      const newExpiresAt = Date.now() + expiresIn * 1000;
      
      // Store the new tokens
      await this.storeTokens(
        userId,
        data.access_token,
        data.refresh_token || refreshToken, // Use new refresh token if provided, otherwise keep the old one
        newExpiresAt
      );
      
      return { success: true, accessToken: data.access_token };
    } catch (error: any) {
      console.error('Error refreshing Microsoft access token:', error);
      return { success: false, error: error.message, accessToken: null };
    }
  }

  /**
   * Get a valid Microsoft Graph access token for the current user
   * Automatically refreshes if needed
   */
  static async getCurrentUserAccessToken() {
    try {
      const session = await getServerSession();
      
      if (!session?.user?.id) {
        throw new Error('No authenticated user');
      }
      
      return await this.refreshAccessToken(session.user.id);
    } catch (error: any) {
      console.error('Error getting current user access token:', error);
      return { success: false, error: error.message, accessToken: null };
    }
  }
}
