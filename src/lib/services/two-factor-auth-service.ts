import { createLazyServerClient } from '@/lib/supabase/lazy-client';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';

interface TwoFactorAuthConfig {
  id: string;
  user_id: string;
  secret_key: string;
  backup_codes: Array<{ code: string; used: boolean }>;
  is_enabled: boolean;
  is_verified: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TwoFactorAuthAttempt {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  is_successful: boolean;
  created_at: string;
}

/**
 * Service for managing two-factor authentication
 */
export class TwoFactorAuthService {
  /**
   * Generate a new TOTP secret for a user
   * 
   * @param userId - The user's ID
   * @returns The secret key and QR code URI
   */
  static async generateSecret(userId: string, email: string) {
    // Generate a random secret key
    const secretKey = authenticator.generateSecret();
    
    // Create a QR code URI for the user
    const serviceName = 'ARIS';
    const otpauth = authenticator.keyuri(email, serviceName, secretKey);
    
    // Store the secret key in the database
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .rpc('enable_two_factor_auth', {
        p_user_id: userId,
        p_secret_key: secretKey
      });
    
    if (error) {
      console.error('Error generating 2FA secret:', error);
      throw new Error(`Failed to generate 2FA secret: ${error.message}`);
    }
    
    return {
      secretKey,
      otpauth
    };
  }
  
  /**
   * Verify a TOTP token and enable 2FA if valid
   * 
   * @param userId - The user's ID
   * @param token - The TOTP token to verify
   * @param req - The request object for IP and user agent
   * @returns Whether the token is valid
   */
  static async verifyToken(userId: string, token: string, req?: Request) {
    const supabase = await createLazyServerClient();
    
    // Get the user's 2FA configuration
    const { data: config, error: configError } = await supabase
      .from('two_factor_auth')
      .select('secret_key')
      .eq('user_id', userId)
      .single();
    
    if (configError || !config) {
      console.error('Error getting 2FA config:', configError);
      return false;
    }
    
    // Verify the token
    const isValid = authenticator.verify({
      token,
      secret: config.secret_key
    });
    
    // Get IP and user agent from request if available
    const ipAddress = req?.headers.get('x-forwarded-for') || 
                      req?.headers.get('x-real-ip') || 
                      null;
    
    const userAgent = req?.headers.get('user-agent') || null;
    
    // Record the verification attempt and enable 2FA if valid
    const { data, error } = await supabase
      .rpc('verify_two_factor_auth', {
        p_user_id: userId,
        p_is_successful: isValid,
        p_ip_address: ipAddress?.toString() || null,
        p_user_agent: userAgent
      });
    
    if (error) {
      console.error('Error verifying 2FA token:', error);
      return false;
    }
    
    return isValid;
  }
  
  /**
   * Validate a backup code for a user
   * 
   * @param userId - The user's ID
   * @param backupCode - The backup code to validate
   * @param req - The request object for IP and user agent
   * @returns Whether the backup code is valid
   */
  static async validateBackupCode(userId: string, backupCode: string, req?: Request) {
    const supabase = await createLazyServerClient();
    
    // Get IP and user agent from request if available
    const ipAddress = req?.headers.get('x-forwarded-for') || 
                      req?.headers.get('x-real-ip') || 
                      null;
    
    const userAgent = req?.headers.get('user-agent') || null;
    
    // Validate the backup code
    const { data, error } = await supabase
      .rpc('validate_backup_code', {
        p_user_id: userId,
        p_backup_code: backupCode,
        p_ip_address: ipAddress?.toString() || null,
        p_user_agent: userAgent
      });
    
    if (error) {
      console.error('Error validating backup code:', error);
      return false;
    }
    
    return data;
  }
  
  /**
   * Check if a user has 2FA enabled
   * 
   * @param userId - The user's ID
   * @returns Whether 2FA is enabled for the user
   */
  static async isEnabled(userId: string) {
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('is_enabled')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) {
      return false;
    }
    
    return data.is_enabled;
  }
  
  /**
   * Disable 2FA for a user
   * 
   * @param userId - The user's ID
   * @returns Whether 2FA was successfully disabled
   */
  static async disable(userId: string) {
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .rpc('disable_two_factor_auth', {
        p_user_id: userId
      });
    
    if (error) {
      console.error('Error disabling 2FA:', error);
      return false;
    }
    
    return data;
  }
  
  /**
   * Regenerate backup codes for a user
   * 
   * @param userId - The user's ID
   * @returns The new backup codes
   */
  static async regenerateBackupCodes(userId: string) {
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .rpc('regenerate_backup_codes', {
        p_user_id: userId
      });
    
    if (error) {
      console.error('Error regenerating backup codes:', error);
      throw new Error(`Failed to regenerate backup codes: ${error.message}`);
    }
    
    return data;
  }
  
  /**
   * Get a user's 2FA configuration
   * 
   * @param userId - The user's ID
   * @returns The user's 2FA configuration
   */
  static async getConfig(userId: string) {
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .from('two_factor_auth')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Record not found
        return null;
      }
      console.error('Error getting 2FA config:', error);
      throw new Error(`Failed to get 2FA config: ${error.message}`);
    }
    
    return data as TwoFactorAuthConfig;
  }
  
  /**
   * Get a user's recent 2FA attempts
   * 
   * @param userId - The user's ID
   * @param limit - Maximum number of attempts to return
   * @returns The user's recent 2FA attempts
   */
  static async getRecentAttempts(userId: string, limit = 10) {
    const supabase = await createLazyServerClient();
    
    const { data, error } = await supabase
      .from('two_factor_auth_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error getting 2FA attempts:', error);
      throw new Error(`Failed to get 2FA attempts: ${error.message}`);
    }
    
    return data as TwoFactorAuthAttempt[];
  }
}
