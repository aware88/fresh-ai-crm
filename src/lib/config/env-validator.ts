/**
 * Environment Variable Validator
 * Validates that required environment variables are set at runtime
 */

interface EnvConfig {
  // Public Supabase config (available on client and server)
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  
  // Server-only config
  SUPABASE_SERVICE_ROLE_KEY?: string;
  OPENAI_API_KEY?: string;
  NEXTAUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  PASSWORD_ENCRYPTION_KEY?: string;
}

class EnvironmentValidator {
  private static instance: EnvironmentValidator;
  private validated = false;
  private config: Partial<EnvConfig> = {};

  private constructor() {}

  public static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator();
    }
    return EnvironmentValidator.instance;
  }

  public validate(): EnvConfig {
    if (this.validated) {
      return this.config as EnvConfig;
    }

    const isServer = typeof window === 'undefined';
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

    // During build time, return mock values
    if (isBuildTime) {
      console.log('[EnvValidator] Build time detected, using placeholder values');
      return this.getMockConfig();
    }

    // Validate required public variables
    const requiredPublicVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];

    const missingPublicVars = requiredPublicVars.filter(
      varName => !process.env[varName]
    );

    if (missingPublicVars.length > 0) {
      console.error('[EnvValidator] Missing required public environment variables:', missingPublicVars);
      
      // In production, this is critical
      if (process.env.NODE_ENV === 'production') {
        console.error('[EnvValidator] Critical: Required environment variables are missing in production!');
        console.error('[EnvValidator] Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('OPENAI')));
      }
    }

    // Validate server-only variables (only on server)
    if (isServer) {
      const requiredServerVars = [
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY'
      ];

      const missingServerVars = requiredServerVars.filter(
        varName => !process.env[varName]
      );

      if (missingServerVars.length > 0) {
        console.warn('[EnvValidator] Missing server environment variables:', missingServerVars);
      }
    }

    // Build config
    this.config = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      PASSWORD_ENCRYPTION_KEY: process.env.PASSWORD_ENCRYPTION_KEY,
    };

    this.validated = true;
    return this.config as EnvConfig;
  }

  private getMockConfig(): EnvConfig {
    return {
      NEXT_PUBLIC_SUPABASE_URL: 'https://mock.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',
      OPENAI_API_KEY: 'mock-openai-key',
      NEXTAUTH_SECRET: 'mock-secret',
      GOOGLE_CLIENT_ID: 'mock-google-id',
      GOOGLE_CLIENT_SECRET: 'mock-google-secret',
      PASSWORD_ENCRYPTION_KEY: 'mock-encryption-key',
    };
  }

  public getConfig(): Partial<EnvConfig> {
    if (!this.validated) {
      this.validate();
    }
    return this.config;
  }

  public isConfigured(): boolean {
    const config = this.getConfig();
    return !!(config.NEXT_PUBLIC_SUPABASE_URL && config.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }

  public hasOpenAI(): boolean {
    const config = this.getConfig();
    return !!config.OPENAI_API_KEY;
  }
}

export const envValidator = EnvironmentValidator.getInstance();

// Export a function to get validated environment variables
export function getEnvConfig(): EnvConfig {
  return envValidator.validate();
}

// Export helper to check if we're in a properly configured environment
export function isEnvironmentConfigured(): boolean {
  return envValidator.isConfigured();
}
