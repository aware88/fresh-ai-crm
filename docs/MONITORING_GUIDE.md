# CRM Mind Monitoring Guide

## Overview

This guide outlines the monitoring setup for CRM Mind, covering logging, metrics collection, error tracking, and health checks. Proper monitoring ensures system reliability, performance, and helps with troubleshooting issues.

## Monitoring Components

CRM Mind's monitoring system consists of four main components:

1. **Logging**: Structured logging with Winston
2. **Metrics**: Prometheus metrics for system performance
3. **Error Tracking**: Sentry integration for error reporting
4. **Health Checks**: API endpoint for system health monitoring

## Setup Instructions

### Automated Setup

The easiest way to set up monitoring is to use the provided script:

```bash
./scripts/deployment/monitoring-setup.sh
```

This script will:
- Install necessary dependencies
- Create monitoring configuration files
- Set up logging, metrics, and health check endpoints
- Update environment files with monitoring variables

### Manual Setup

If you prefer to set up monitoring manually, follow these steps:

#### 1. Install Dependencies

```bash
npm install --save prom-client winston winston-daily-rotate-file @sentry/node @sentry/tracing
```

#### 2. Configure Logging

Create a logger module at `src/lib/monitoring/logger.ts`:

```typescript
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
```

#### 3. Configure Metrics

Create a metrics module at `src/lib/monitoring/metrics.ts`:

```typescript
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
```

#### 4. Configure Error Tracking

Create a Sentry module at `src/lib/monitoring/sentry.ts`:

```typescript
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
```

#### 5. Create Metrics Endpoint

Create a metrics endpoint at `src/app/api/monitoring/metrics/route.ts`:

```typescript
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
```

#### 6. Create Health Check Endpoint

Create a health check endpoint at `src/app/api/monitoring/health/route.ts`:

```typescript
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
```

## Prometheus Configuration

To configure Prometheus to scrape metrics from CRM Mind, create a `prometheus.yml` file:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'crm-mind'
    static_configs:
      - targets: ['localhost:9100']
```

## Grafana Dashboard

For visualization, you can set up a Grafana dashboard with the following panels:

1. **System Metrics**:
   - CPU Usage
   - Memory Usage
   - Disk I/O

2. **Application Metrics**:
   - HTTP Request Rate
   - HTTP Response Time
   - Error Rate

3. **Business Metrics**:
   - Active Users
   - Active Subscriptions
   - API Calls to Metakocka

## Log Analysis

Logs are stored in the directory specified by the `LOG_DIR` environment variable. You can analyze logs using tools like:

- **ELK Stack**: Elasticsearch, Logstash, and Kibana
- **Loki**: Lightweight log aggregation system
- **Graylog**: Log management platform

## Alerting

Set up alerts for critical conditions:

1. **High Error Rate**: Alert when error rate exceeds a threshold
2. **API Latency**: Alert when API response time is too high
3. **Database Connectivity**: Alert when database connection fails
4. **Disk Space**: Alert when disk space is running low

## Best Practices

1. **Log Rotation**: Ensure logs are rotated to prevent disk space issues
2. **Metric Cardinality**: Limit the cardinality of labels in metrics
3. **Sampling**: Use sampling for high-volume error tracking
4. **Context**: Include relevant context in logs and error reports

## Troubleshooting

### Common Issues

1. **Missing Metrics**:
   - Check if the metrics endpoint is accessible
   - Verify Prometheus configuration

2. **Log File Permissions**:
   - Ensure the application has write permissions to the log directory

3. **Sentry Not Capturing Errors**:
   - Verify the Sentry DSN is correct
   - Check if the Sentry SDK is properly initialized

## Conclusion

Proper monitoring is essential for maintaining a reliable and performant CRM Mind deployment. By following this guide, you can set up comprehensive monitoring that provides visibility into system health and performance.
