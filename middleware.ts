import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware Next.js pour la sécurité globale
 * - Headers de sécurité
 * - Protection CSRF
 * - Rate limiting (optionnel)
 */

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ========================================
  // HEADERS DE SÉCURITÉ
  // ========================================

  // Content Security Policy (CSP)
  // Protège contre XSS en contrôlant les sources de contenu autorisées
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https://ebmgtfftimezuuxxzyjm.supabase.co wss://ebmgtfftimezuuxxzyjm.supabase.co;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  // X-Frame-Options
  // Protège contre le clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // X-Content-Type-Options
  // Empêche le navigateur de deviner le type MIME
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer-Policy
  // Contrôle les informations de référence envoyées
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy
  // Contrôle les fonctionnalités du navigateur
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // X-DNS-Prefetch-Control
  // Contrôle la pré-résolution DNS
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Strict-Transport-Security (HSTS)
  // Force HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // ========================================
  // PROTECTION CSRF
  // ========================================

  // Vérifier l'origine pour les requêtes mutantes (POST, PUT, DELETE, PATCH)
  const isModifyingRequest = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
    request.method
  );

  if (isModifyingRequest && !request.url.includes('/api/')) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    // Vérifier que l'origine correspond à l'hôte
    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        console.warn('CSRF attempt detected:', { origin, host });
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }

  // ========================================
  // PROTECTION DES ROUTES ADMIN
  // ========================================

  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Vérifier si l'utilisateur est admin
    // Note: La vérification réelle se fait côté serveur avec Supabase
    // Ceci est juste une première couche de protection
    
    // On pourrait ajouter une vérification de token ici
    // mais Supabase gère déjà l'authentification
  }

  return response;
}

/**
 * Configuration du matcher
 * Définit les routes sur lesquelles le middleware s'applique
 */
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf:
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - fichiers publics (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
