/**
 * Configuration Sentry pour le tracking des erreurs
 * Documentation: https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

// @ts-nocheck
import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

/**
 * Initialise Sentry
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    
    // Performance Monitoring
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0, // 10% en prod, 100% en dev
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% des sessions
    replaysOnErrorSampleRate: 1.0, // 100% des sessions avec erreur
    
    // Filtrer les erreurs non importantes
    beforeSend(event, hint) {
      // Ignorer les erreurs de réseau
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null;
      }
      
      // Ignorer les erreurs de timeout
      if (event.exception?.values?.[0]?.value?.includes('timeout')) {
        return null;
      }
      
      // Ignorer les erreurs de CORS
      if (event.exception?.values?.[0]?.value?.includes('CORS')) {
        return null;
      }
      
      return event;
    },
    
    // Intégrations
    integrations: [
      new Sentry.BrowserTracing({
        // Tracer les requêtes fetch/XHR
        traceFetch: true,
        traceXHR: true,
        
        // Tracer les navigations
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      }),
      new Sentry.Replay({
        // Masquer les données sensibles
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}

/**
 * Capture une erreur dans Sentry
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (!SENTRY_DSN) return;
  
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture un message dans Sentry
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!SENTRY_DSN) return;
  
  Sentry.captureMessage(message, level);
}

/**
 * Définit le contexte utilisateur
 */
export function setUserContext(user: { id: string; email?: string; username?: string }) {
  if (!SENTRY_DSN) return;
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Efface le contexte utilisateur (lors de la déconnexion)
 */
export function clearUserContext() {
  if (!SENTRY_DSN) return;
  
  Sentry.setUser(null);
}

/**
 * Ajoute un breadcrumb (fil d'Ariane)
 */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, any>) {
  if (!SENTRY_DSN) return;
  
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Démarre une transaction de performance
 */
export function startTransaction(name: string, op: string) {
  if (!SENTRY_DSN) return null;
  
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Hook React pour capturer les erreurs
 */
export function useSentry() {
  return {
    captureError,
    captureMessage,
    setUserContext,
    clearUserContext,
    addBreadcrumb,
    startTransaction,
  };
}

/**
 * Error Boundary pour React
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Wrapper pour les fonctions async avec capture d'erreur
 */
export function withSentry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Record<string, any>
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error as Error, {
        ...context,
        args,
      });
      throw error;
    }
  }) as T;
}
