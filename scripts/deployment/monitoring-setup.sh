#!/bin/bash

# CRM Mind Monitoring Setup Script
# This script sets up monitoring for the CRM Mind application

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration
APP_NAME="crm-mind"
LOG_DIR="/var/log/$APP_NAME"
METRICS_PORT=9100

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${YELLOW}Setting up monitoring for CRM Mind...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed!${NC}"
  exit 1
fi

# Install monitoring dependencies
echo -e "${YELLOW}Installing monitoring dependencies...${NC}"
npm install --save prom-client winston winston-daily-rotate-file @sentry/node @sentry/tracing

# Create monitoring directory
mkdir -p monitoring

# Create Prometheus configuration
echo -e "${YELLOW}Creating Prometheus configuration...${NC}"
cat > monitoring/prometheus.yml << EOL
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'crm-mind'
    static_configs:
      - targets: ['localhost:${METRICS_PORT}']
EOL

# Create logging setup file
echo -e "${YELLOW}Creating logging configuration...${NC}"
cat > src/lib/monitoring/logger.ts << EOL
import winston from 'winston';
import 'winston-daily-rotate-file';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create file transport for error logs
const errorFileTransport = new winston.transports.DailyRotateFile({
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  dirname: process.env.LOG_DIR || 'logs',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
});

// Create file transport for combined logs
const combinedFileTransport = new winston.transports.DailyRotateFile({
  filename: 'combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  dirname: process.env.LOG_DIR || 'logs',
  maxSize: '20m',
  maxFiles: '14d',
});

// Create console transport
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
});

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'crm-mind' },
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport,
  ],
});

// Export a function to log errors
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

// Export a function to log API requests
export const logApiRequest = (req: any, res: any, responseTime: number) => {
  const { method, url, headers, body } = req;
  const { statusCode } = res;
  
  logger.info({
    type: 'api_request',
    method,
    url,
    statusCode,
    responseTime,
    userAgent: headers['user-agent'],
    // Don't log sensitive information
    body: method !== 'GET' ? '(redacted)' : undefined,
  });
};
EOL

# Create metrics setup file
echo -e "${YELLOW}Creating metrics configuration...${NC}"
cat > src/lib/monitoring/metrics.ts << EOL
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client';

// Create a Registry to register metrics
export const register = new Registry();

// Enable default metrics
collectDefaultMetrics({ register });

// Create custom metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  registers: [register],
});

export const databaseQueryDurationSeconds = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const metakockaApiCallsTotal = new Counter({
  name: 'metakocka_api_calls_total',
  help: 'Total number of Metakocka API calls',
  labelNames: ['endpoint', 'status'],
  registers: [register],
});

export const metakockaApiDurationSeconds = new Histogram({
  name: 'metakocka_api_duration_seconds',
  help: 'Duration of Metakocka API calls in seconds',
  labelNames: ['endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 20],
  registers: [register],
});

export const activeSubscriptionsGauge = new Counter({
  name: 'active_subscriptions',
  help: 'Number of active subscriptions by plan',
  labelNames: ['plan'],
  registers: [register],
});
EOL

# Create Sentry setup file
echo -e "${YELLOW}Creating Sentry configuration...${NC}"
cat > src/lib/monitoring/sentry.ts << EOL
import * as Sentry from '@sentry/node';
import { Integrations } from '@sentry/tracing';

export const initSentry = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: [new Integrations.Express()],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    });
    
    console.log('Sentry initialized');
  } else {
    console.log('Sentry DSN not provided, error tracking disabled');
  }
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
};
EOL

# Create metrics endpoint file
echo -e "${YELLOW}Creating metrics endpoint...${NC}"
mkdir -p src/app/api/monitoring/metrics
cat > src/app/api/monitoring/metrics/route.ts << EOL
import { NextRequest, NextResponse } from 'next/server';
import { register } from '@/lib/monitoring/metrics';

export async function GET(req: NextRequest) {
  // Only allow access from localhost or internal network
  const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
  if (!clientIp.startsWith('127.0.0.1') && !clientIp.startsWith('10.') && !clientIp.startsWith('172.16.') && !clientIp.startsWith('192.168.')) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  try {
    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      headers: {
        'Content-Type': register.contentType,
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return new NextResponse('Error generating metrics', { status: 500 });
  }
}
EOL

# Create health check endpoint
echo -e "${YELLOW}Creating health check endpoint...${NC}"
mkdir -p src/app/api/monitoring/health
cat > src/app/api/monitoring/health/route.ts << EOL
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Check database connection
    const supabase = createServerClient();
    const { data, error } = await supabase.from('health_check').select('*').limit(1);
    
    if (error) {
      throw error;
    }
    
    // Return health status
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
EOL

# Create monitoring index file
echo -e "${YELLOW}Creating monitoring index file...${NC}"
cat > src/lib/monitoring/index.ts << EOL
export * from './logger';
export * from './metrics';
export * from './sentry';

// Initialize monitoring
import { initSentry } from './sentry';

// Initialize Sentry in non-edge environments
if (typeof window === 'undefined' && !process.env.EDGE_RUNTIME) {
  initSentry();
}
EOL

# Update .env files with monitoring configuration
echo -e "${YELLOW}Updating environment files with monitoring configuration...${NC}"

# Add monitoring variables to .env.development if it exists
if [ -f ".env.development" ]; then
  echo -e "\n# Monitoring Configuration\nLOG_LEVEL=debug\nLOG_DIR=logs\nMETRICS_PORT=${METRICS_PORT}\n# SENTRY_DSN=https://your-sentry-dsn\n" >> .env.development
fi

# Add monitoring variables to .env.production if it exists
if [ -f ".env.production" ]; then
  echo -e "\n# Monitoring Configuration\nLOG_LEVEL=info\nLOG_DIR=${LOG_DIR}\nMETRICS_PORT=${METRICS_PORT}\n# SENTRY_DSN=https://your-sentry-dsn\n" >> .env.production
fi

echo -e "${GREEN}Monitoring setup for CRM Mind completed successfully!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Add SENTRY_DSN to your environment files if you want to use Sentry for error tracking"
echo -e "2. Set up Prometheus to scrape metrics from http://localhost:${METRICS_PORT}/api/monitoring/metrics"
echo -e "3. Set up a health check monitor to ping http://your-domain/api/monitoring/health"
