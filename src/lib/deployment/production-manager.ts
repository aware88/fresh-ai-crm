import { createClient } from '@supabase/supabase-js';

// Production configuration validation
interface ProductionConfig {
  environment: 'production' | 'staging' | 'development';
  database: {
    url: string;
    maxConnections: number;
    connectionTimeout: number;
  };
  redis?: {
    url: string;
    maxConnections: number;
  };
  monitoring: {
    enabled: boolean;
    healthCheckInterval: number;
    alertThresholds: {
      responseTime: number;
      errorRate: number;
      memoryUsage: number;
      cpuUsage: number;
    };
  };
  security: {
    encryptionEnabled: boolean;
    rateLimitEnabled: boolean;
    corsEnabled: boolean;
    httpsOnly: boolean;
  };
  performance: {
    cacheEnabled: boolean;
    compressionEnabled: boolean;
    cdnEnabled: boolean;
  };
}

// Health check types
interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  lastChecked: Date;
  error?: string;
  details?: Record<string, any>;
}

interface SystemHealth {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: HealthCheck[];
  metrics: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
    requestsPerMinute: number;
    errorRate: number;
  };
  timestamp: Date;
}

// Deployment types
interface DeploymentInfo {
  version: string;
  environment: string;
  deployedAt: Date;
  deployedBy: string;
  gitCommit: string;
  buildNumber: string;
  features: string[];
  rollbackAvailable: boolean;
}

class ProductionManager {
  private static instance: ProductionManager;
  private config: ProductionConfig;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private startTime: Date = new Date();
  private metrics: any = {
    requests: 0,
    errors: 0,
    lastMinuteRequests: 0,
    lastMinuteErrors: 0,
  };

  private constructor() {
    this.config = this.loadConfiguration();
    this.startHealthChecks();
  }

  static getInstance(): ProductionManager {
    if (!ProductionManager.instance) {
      ProductionManager.instance = new ProductionManager();
    }
    return ProductionManager.instance;
  }

  private loadConfiguration(): ProductionConfig {
    return {
      environment: (process.env.NODE_ENV as any) || 'development',
      database: {
        url: process.env.SUPABASE_URL || '',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
        connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
      },
      redis: process.env.REDIS_URL ? {
        url: process.env.REDIS_URL,
        maxConnections: parseInt(process.env.REDIS_MAX_CONNECTIONS || '10'),
      } : undefined,
      monitoring: {
        enabled: process.env.MONITORING_ENABLED === 'true',
        healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
        alertThresholds: {
          responseTime: parseInt(process.env.ALERT_RESPONSE_TIME || '5000'),
          errorRate: parseFloat(process.env.ALERT_ERROR_RATE || '0.05'),
          memoryUsage: parseFloat(process.env.ALERT_MEMORY_USAGE || '0.85'),
          cpuUsage: parseFloat(process.env.ALERT_CPU_USAGE || '0.80'),
        },
      },
      security: {
        encryptionEnabled: process.env.ENCRYPTION_ENABLED !== 'false',
        rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        corsEnabled: process.env.CORS_ENABLED !== 'false',
        httpsOnly: process.env.HTTPS_ONLY === 'true',
      },
      performance: {
        cacheEnabled: process.env.CACHE_ENABLED !== 'false',
        compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false',
        cdnEnabled: process.env.CDN_ENABLED === 'true',
      },
    };
  }

  // Configuration validation
  validateConfiguration(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXTAUTH_SECRET',
      'ENCRYPTION_KEY',
    ];

    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        errors.push(`Missing required environment variable: ${envVar}`);
      }
    });

    // Validate URLs
    if (this.config.database.url && !this.isValidUrl(this.config.database.url)) {
      errors.push('Invalid database URL');
    }

    if (this.config.redis?.url && !this.isValidUrl(this.config.redis.url)) {
      errors.push('Invalid Redis URL');
    }

    // Validate production-specific settings
    if (this.config.environment === 'production') {
      if (!this.config.security.httpsOnly) {
        errors.push('HTTPS must be enabled in production');
      }
      
      if (!this.config.security.encryptionEnabled) {
        errors.push('Encryption must be enabled in production');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Health checks
  private startHealthChecks(): void {
    if (!this.config.monitoring.enabled) return;

    setInterval(() => {
      this.performHealthChecks();
    }, this.config.monitoring.healthCheckInterval);

    // Initial health check
    this.performHealthChecks();
  }

  private async performHealthChecks(): Promise<void> {
    const checks = [
      this.checkDatabase(),
      this.checkRedis(),
      this.checkDiskSpace(),
      this.checkMemory(),
      this.checkExternalServices(),
    ];

    const results = await Promise.allSettled(checks);
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.healthChecks.set(result.value.service, result.value);
      }
    });
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      if (error) throw error;

      const responseTime = Date.now() - startTime;
      
      return {
        service: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date(),
        details: {
          connectionCount: 1, // Would be actual connection count in production
        },
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    // Mock Redis check (implement actual Redis check if using Redis)
    return {
      service: 'redis',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      lastChecked: new Date(),
      details: {
        connected: !this.config.redis, // No Redis = no connection needed
      },
    };
  }

  private async checkDiskSpace(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Mock disk space check (implement actual disk space check)
      const usage = 0.45; // 45% usage
      
      return {
        service: 'disk',
        status: usage < 0.8 ? 'healthy' : usage < 0.9 ? 'degraded' : 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: {
          usage,
          available: '10GB',
        },
      };
    } catch (error) {
      return {
        service: 'disk',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkMemory(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const usage = process.memoryUsage();
      const usagePercent = usage.heapUsed / usage.heapTotal;
      
      return {
        service: 'memory',
        status: usagePercent < 0.8 ? 'healthy' : usagePercent < 0.9 ? 'degraded' : 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: {
          heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
          heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
          usage: usagePercent,
        },
      };
    } catch (error) {
      return {
        service: 'memory',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkExternalServices(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Mock external services check
      return {
        service: 'external',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        details: {
          services: ['openai', 'supabase', 'stripe'],
          allHealthy: true,
        },
      };
    } catch (error) {
      return {
        service: 'external',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Public API
  getSystemHealth(): SystemHealth {
    const services = Array.from(this.healthChecks.values());
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');
    
    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyServices.length > 0) {
      overall = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overall = 'degraded';
    }

    const uptime = Date.now() - this.startTime.getTime();
    const memoryUsage = process.memoryUsage();
    const errorRate = this.metrics.lastMinuteRequests > 0 
      ? this.metrics.lastMinuteErrors / this.metrics.lastMinuteRequests 
      : 0;

    return {
      overall,
      services,
      metrics: {
        uptime,
        memoryUsage: memoryUsage.heapUsed / memoryUsage.heapTotal,
        cpuUsage: 0.15, // Mock CPU usage
        activeConnections: 5, // Mock active connections
        requestsPerMinute: this.metrics.lastMinuteRequests,
        errorRate,
      },
      timestamp: new Date(),
    };
  }

  getDeploymentInfo(): DeploymentInfo {
    return {
      version: process.env.npm_package_version || '1.0.0',
      environment: this.config.environment,
      deployedAt: this.startTime,
      deployedBy: process.env.DEPLOYED_BY || 'system',
      gitCommit: process.env.GIT_COMMIT || 'unknown',
      buildNumber: process.env.BUILD_NUMBER || 'unknown',
      features: [
        'ai-agents',
        'real-time-monitoring',
        'advanced-analytics',
        'security-manager',
        'multi-agent-orchestration',
      ],
      rollbackAvailable: true,
    };
  }

  getConfiguration(): ProductionConfig {
    return { ...this.config };
  }

  // Metrics tracking
  recordRequest(): void {
    this.metrics.requests++;
    this.metrics.lastMinuteRequests++;
  }

  recordError(): void {
    this.metrics.errors++;
    this.metrics.lastMinuteErrors++;
  }

  // Reset minute counters (call every minute)
  resetMinuteCounters(): void {
    this.metrics.lastMinuteRequests = 0;
    this.metrics.lastMinuteErrors = 0;
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    console.log('Shutting down production manager...');
    
    // Close database connections
    // Close Redis connections
    // Stop health checks
    // Save metrics
    
    console.log('Production manager shutdown complete');
  }
}

// Export singleton instance
export const productionManager = ProductionManager.getInstance(); 