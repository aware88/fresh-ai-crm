import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

// Security configuration
const SECURITY_CONFIG = {
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
  },
  rateLimit: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDuration: 60 * 60 * 1000, // 1 hour
  },
  threats: {
    maxFailedLogins: 5,
    lockoutDuration: 30 * 60 * 1000, // 30 minutes
    suspiciousPatterns: [
      /script/i,
      /javascript/i,
      /onload/i,
      /onerror/i,
      /eval\(/i,
      /document\.cookie/i,
      /window\.location/i,
    ],
  },
  cors: {
    allowedOrigins: process.env.NODE_ENV === 'production' 
      ? ['https://helloaris.com', 'https://www.helloaris.com']
      : ['http://localhost:3000'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
};

// Types
interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'threat' | 'rate_limit' | 'data_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
}

interface ThreatAssessment {
  riskScore: number;
  threats: string[];
  blocked: boolean;
  reason?: string;
}

interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  blocked: boolean;
}

// In-memory stores (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: Date; blocked: boolean }>();
const securityEvents: SecurityEvent[] = [];
const blockedIPs = new Set<string>();
const failedLogins = new Map<string, { count: number; lastAttempt: Date }>();

export class SecurityManager {
  private static instance: SecurityManager;
  private encryptionKey: Buffer;

  private constructor() {
    this.encryptionKey = this.deriveKey(process.env.ENCRYPTION_KEY || 'default-key');
  }

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Encryption utilities
  private deriveKey(password: string): Buffer {
    return createHash('sha256').update(password).digest();
  }

  encrypt(text: string): string {
    const iv = randomBytes(SECURITY_CONFIG.encryption.ivLength);
    const cipher = createCipheriv(SECURITY_CONFIG.encryption.algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = (cipher as any).getAuthTag();
    
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const tag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = createDecipheriv(SECURITY_CONFIG.encryption.algorithm, this.encryptionKey, iv);
    (decipher as any).setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Rate limiting
  checkRateLimit(identifier: string): RateLimitStatus {
    const now = new Date();
    const key = `rate_limit:${identifier}`;
    const current = rateLimitStore.get(key);

    if (!current) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: new Date(now.getTime() + SECURITY_CONFIG.rateLimit.windowMs),
        blocked: false,
      });
      return {
        allowed: true,
        remaining: SECURITY_CONFIG.rateLimit.maxRequests - 1,
        resetTime: new Date(now.getTime() + SECURITY_CONFIG.rateLimit.windowMs),
        blocked: false,
      };
    }

    // Check if window has expired
    if (now > current.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: new Date(now.getTime() + SECURITY_CONFIG.rateLimit.windowMs),
        blocked: false,
      });
      return {
        allowed: true,
        remaining: SECURITY_CONFIG.rateLimit.maxRequests - 1,
        resetTime: new Date(now.getTime() + SECURITY_CONFIG.rateLimit.windowMs),
        blocked: false,
      };
    }

    // Check if blocked
    if (current.blocked) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        blocked: true,
      };
    }

    // Check if limit exceeded
    if (current.count >= SECURITY_CONFIG.rateLimit.maxRequests) {
      current.blocked = true;
      rateLimitStore.set(key, current);
      
      this.logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        ipAddress: identifier,
        userAgent: 'unknown',
        details: { limit: SECURITY_CONFIG.rateLimit.maxRequests, window: SECURITY_CONFIG.rateLimit.windowMs },
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime: current.resetTime,
        blocked: true,
      };
    }

    // Increment count
    current.count++;
    rateLimitStore.set(key, current);

    return {
      allowed: true,
      remaining: SECURITY_CONFIG.rateLimit.maxRequests - current.count,
      resetTime: current.resetTime,
      blocked: false,
    };
  }

  // Threat detection
  assessThreat(request: NextRequest): ThreatAssessment {
    const threats: string[] = [];
    let riskScore = 0;

    // Check IP reputation
    const clientIP = this.getClientIP(request);
    if (blockedIPs.has(clientIP)) {
      threats.push('blocked_ip');
      riskScore += 100;
    }

    // Check for suspicious patterns in headers and body
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    
    SECURITY_CONFIG.threats.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(userAgent) || pattern.test(referer)) {
        threats.push('suspicious_pattern');
        riskScore += 30;
      }
    });

    // Check for SQL injection patterns
    const url = request.url;
    const sqlPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+set/i,
      /exec\s*\(/i,
    ];

    sqlPatterns.forEach(pattern => {
      if (pattern.test(url)) {
        threats.push('sql_injection');
        riskScore += 50;
      }
    });

    // Check for XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
    ];

    xssPatterns.forEach(pattern => {
      if (pattern.test(url)) {
        threats.push('xss_attempt');
        riskScore += 40;
      }
    });

    // Check failed login attempts
    const failedAttempts = failedLogins.get(clientIP);
    if (failedAttempts && failedAttempts.count >= SECURITY_CONFIG.threats.maxFailedLogins) {
      threats.push('brute_force');
      riskScore += 60;
    }

    const blocked = riskScore >= 50;

    if (blocked) {
      blockedIPs.add(clientIP);
      this.logSecurityEvent({
        type: 'threat',
        severity: riskScore >= 80 ? 'critical' : 'high',
        ipAddress: clientIP,
        userAgent,
        details: { threats, riskScore, url },
      });
    }

    return {
      riskScore,
      threats,
      blocked,
      reason: blocked ? threats.join(', ') : undefined,
    };
  }

  // Authentication tracking
  recordFailedLogin(identifier: string): void {
    const current = failedLogins.get(identifier) || { count: 0, lastAttempt: new Date() };
    current.count++;
    current.lastAttempt = new Date();
    failedLogins.set(identifier, current);

    this.logSecurityEvent({
      type: 'authentication',
      severity: current.count >= SECURITY_CONFIG.threats.maxFailedLogins ? 'high' : 'medium',
      ipAddress: identifier,
      userAgent: 'unknown',
      details: { failedAttempts: current.count },
    });
  }

  recordSuccessfulLogin(identifier: string): void {
    failedLogins.delete(identifier);
    
    this.logSecurityEvent({
      type: 'authentication',
      severity: 'low',
      ipAddress: identifier,
      userAgent: 'unknown',
      details: { success: true },
    });
  }

  // CORS validation
  validateCORS(origin: string): boolean {
    if (!origin) return false;
    return SECURITY_CONFIG.cors.allowedOrigins.includes(origin);
  }

  // Security event logging
  private logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): void {
    const securityEvent: SecurityEvent = {
      id: randomBytes(16).toString('hex'),
      ...event,
      timestamp: new Date(),
      resolved: false,
    };

    securityEvents.push(securityEvent);

    // Keep only last 1000 events
    if (securityEvents.length > 1000) {
      securityEvents.splice(0, securityEvents.length - 1000);
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      console.warn('Security Event:', JSON.stringify(securityEvent, null, 2));
    }
  }

  // Utility methods
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }

  // Public API for monitoring
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return securityEvents.slice(-limit);
  }

  getSecurityStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    blockedIPs: number;
    activeRateLimits: number;
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    securityEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    return {
      totalEvents: securityEvents.length,
      eventsByType,
      eventsBySeverity,
      blockedIPs: blockedIPs.size,
      activeRateLimits: rateLimitStore.size,
    };
  }

  // Admin functions
  unblockIP(ip: string): void {
    blockedIPs.delete(ip);
    rateLimitStore.delete(`rate_limit:${ip}`);
    failedLogins.delete(ip);
  }

  clearSecurityEvents(): void {
    securityEvents.length = 0;
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance(); 