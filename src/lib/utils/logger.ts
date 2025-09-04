/**
 * Production-ready logging service
 * Replaces console.log statements with proper structured logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
  userId?: string;
  organizationId?: string;
  action?: string;
  module?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (!this.isProduction) {
      console.log(this.formatMessage('info', message, context));
    }
    // In production, you might want to send this to a logging service
  }

  warn(message: string, context?: LogContext) {
    const formatted = this.formatMessage('warn', message, context);
    console.warn(formatted);
    // In production, send to logging service
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    };
    
    const formatted = this.formatMessage('error', message, errorContext);
    console.error(formatted);
    
    // In production, send to error monitoring service (Sentry, etc.)
  }

  // Structured logging for specific use cases
  apiRequest(method: string, url: string, context?: LogContext) {
    this.info(`API Request: ${method} ${url}`, { 
      ...context, 
      type: 'api_request',
      method,
      url 
    });
  }

  apiResponse(method: string, url: string, status: number, duration: number, context?: LogContext) {
    this.info(`API Response: ${method} ${url} ${status}`, {
      ...context,
      type: 'api_response',
      method,
      url,
      status,
      duration
    });
  }

  database(operation: string, table: string, context?: LogContext) {
    this.debug(`Database: ${operation} on ${table}`, {
      ...context,
      type: 'database',
      operation,
      table
    });
  }

  emailProcessing(action: string, emailId: string, context?: LogContext) {
    this.info(`Email Processing: ${action}`, {
      ...context,
      type: 'email_processing',
      action,
      emailId
    });
  }

  aiOperation(operation: string, model: string, tokens?: number, context?: LogContext) {
    this.info(`AI Operation: ${operation} using ${model}`, {
      ...context,
      type: 'ai_operation',
      operation,
      model,
      tokens
    });
  }
}

export const logger = new Logger();