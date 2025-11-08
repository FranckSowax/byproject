/**
 * Service de logging centralisé
 * Enregistre tous les événements système dans Supabase
 */

// @ts-nocheck
import { createClient } from '@/lib/supabase/client';

export type LogLevel = 'info' | 'warning' | 'error' | 'success' | 'debug';
export type LogCategory = 
  | 'auth' 
  | 'database' 
  | 'api' 
  | 'system' 
  | 'security' 
  | 'user' 
  | 'export' 
  | 'backup' 
  | 'storage'
  | 'performance';

interface LogOptions {
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  error?: Error;
  requestId?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit?: string;
  endpoint?: string;
  tags?: Record<string, any>;
}

/**
 * Classe principale pour le logging
 */
class Logger {
  private supabase = createClient();
  private environment: string;
  private version: string;
  private requestId?: string;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.version = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  }

  /**
   * Définit l'ID de requête pour tracer les logs
   */
  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  /**
   * Enregistre un log dans la base de données
   */
  private async log(options: LogOptions): Promise<void> {
    try {
      // Obtenir les informations du navigateur
      const userAgent = typeof window !== 'undefined' 
        ? window.navigator.userAgent 
        : undefined;

      // Préparer les données du log
      const logData = {
        level: options.level,
        category: options.category,
        message: options.message,
        user_id: options.userId,
        user_email: options.userEmail,
        user_agent: userAgent,
        details: options.details || null,
        stack_trace: options.error?.stack || null,
        request_id: options.requestId || this.requestId,
        environment: this.environment,
        version: this.version,
      };

      // Insérer dans Supabase
      const { error } = await this.supabase
        .from('system_logs')
        .insert(logData);

      if (error) {
        // En cas d'erreur, logger dans la console
        console.error('Failed to log to database:', error);
        console.log('Log data:', logData);
      }

      // Logger aussi dans la console en développement
      if (this.environment === 'development') {
        const consoleMethod = options.level === 'error' ? 'error' : 
                             options.level === 'warning' ? 'warn' : 'log';
        console[consoleMethod](`[${options.category}] ${options.message}`, options.details);
      }
    } catch (error) {
      // Fallback sur console.error si tout échoue
      console.error('Logger error:', error);
      console.log('Original log:', options);
    }
  }

  /**
   * Log de niveau INFO
   */
  async info(category: LogCategory, message: string, details?: Record<string, any>): Promise<void> {
    return this.log({ level: 'info', category, message, details });
  }

  /**
   * Log de niveau WARNING
   */
  async warning(category: LogCategory, message: string, details?: Record<string, any>): Promise<void> {
    return this.log({ level: 'warning', category, message, details });
  }

  /**
   * Log de niveau ERROR
   */
  async error(category: LogCategory, message: string, error?: Error, details?: Record<string, any>): Promise<void> {
    return this.log({ 
      level: 'error', 
      category, 
      message, 
      error,
      details: {
        ...details,
        errorName: error?.name,
        errorMessage: error?.message,
      }
    });
  }

  /**
   * Log de niveau SUCCESS
   */
  async success(category: LogCategory, message: string, details?: Record<string, any>): Promise<void> {
    return this.log({ level: 'success', category, message, details });
  }

  /**
   * Log de niveau DEBUG (seulement en développement)
   */
  async debug(category: LogCategory, message: string, details?: Record<string, any>): Promise<void> {
    if (this.environment === 'development') {
      return this.log({ level: 'debug', category, message, details });
    }
  }

  /**
   * Enregistre une métrique de performance
   */
  async metric(metric: PerformanceMetric): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('performance_metrics')
        .insert({
          metric_name: metric.name,
          metric_value: metric.value,
          metric_unit: metric.unit || 'ms',
          endpoint: metric.endpoint,
          tags: metric.tags || null,
          environment: this.environment,
        });

      if (error) {
        console.error('Failed to log metric:', error);
      }
    } catch (error) {
      console.error('Metric logging error:', error);
    }
  }

  /**
   * Mesure le temps d'exécution d'une fonction
   */
  async measureTime<T>(
    name: string,
    fn: () => Promise<T>,
    options?: { endpoint?: string; tags?: Record<string, any> }
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      
      await this.metric({
        name,
        value: duration,
        unit: 'ms',
        endpoint: options?.endpoint,
        tags: options?.tags,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      await this.metric({
        name: `${name}_error`,
        value: duration,
        unit: 'ms',
        endpoint: options?.endpoint,
        tags: { ...options?.tags, error: true },
      });
      
      throw error;
    }
  }

  /**
   * Enregistre un événement utilisateur
   */
  async userEvent(
    userId: string,
    userEmail: string,
    action: string,
    details?: Record<string, any>
  ): Promise<void> {
    return this.log({
      level: 'info',
      category: 'user',
      message: action,
      userId,
      userEmail,
      details,
    });
  }

  /**
   * Enregistre un événement de sécurité
   */
  async securityEvent(
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, any>
  ): Promise<void> {
    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warning';
    
    return this.log({
      level,
      category: 'security',
      message,
      details: {
        ...details,
        severity,
      },
    });
  }

  /**
   * Enregistre une erreur API
   */
  async apiError(
    endpoint: string,
    statusCode: number,
    error: Error,
    details?: Record<string, any>
  ): Promise<void> {
    return this.log({
      level: 'error',
      category: 'api',
      message: `API Error: ${endpoint} (${statusCode})`,
      error,
      details: {
        ...details,
        endpoint,
        statusCode,
      },
    });
  }

  /**
   * Enregistre une erreur de base de données
   */
  async databaseError(
    operation: string,
    error: Error,
    details?: Record<string, any>
  ): Promise<void> {
    return this.log({
      level: 'error',
      category: 'database',
      message: `Database Error: ${operation}`,
      error,
      details,
    });
  }
}

// Instance singleton
const logger = new Logger();

export default logger;

/**
 * Hook React pour utiliser le logger avec le contexte utilisateur
 */
export function useLogger() {
  const supabase = createClient();

  const logWithUser = async (options: Omit<LogOptions, 'userId' | 'userEmail'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      return logger.log({
        ...options,
        userId: user?.id,
        userEmail: user?.email,
      });
    } catch (error) {
      return logger.log(options);
    }
  };

  return {
    info: (category: LogCategory, message: string, details?: Record<string, any>) =>
      logWithUser({ level: 'info', category, message, details }),
    
    warning: (category: LogCategory, message: string, details?: Record<string, any>) =>
      logWithUser({ level: 'warning', category, message, details }),
    
    error: (category: LogCategory, message: string, error?: Error, details?: Record<string, any>) =>
      logWithUser({ level: 'error', category, message, error, details }),
    
    success: (category: LogCategory, message: string, details?: Record<string, any>) =>
      logWithUser({ level: 'success', category, message, details }),
    
    metric: logger.metric.bind(logger),
    measureTime: logger.measureTime.bind(logger),
  };
}

/**
 * Utilitaires pour les logs
 */
export const LogUtils = {
  /**
   * Formate une erreur pour le logging
   */
  formatError(error: any): Record<string, any> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    return { error: String(error) };
  },

  /**
   * Nettoie les données sensibles avant le logging
   */
  sanitize(data: any): any {
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
    
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const cleaned = { ...data };
    
    for (const key in cleaned) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        cleaned[key] = '***REDACTED***';
      } else if (typeof cleaned[key] === 'object') {
        cleaned[key] = LogUtils.sanitize(cleaned[key]);
      }
    }
    
    return cleaned;
  },
};
