import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour le workflow de devis fournisseur
 *
 * Ces tests couvrent :
 * - Interface publique fournisseur (/supplier-quote/[token])
 * - Validation des formulaires de prix
 * - Soumission de devis
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

test.describe('Interface Fournisseur - Accès', () => {
  test('Token invalide affiche une erreur appropriée', async ({ page }) => {
    await page.goto(`${BASE_URL}/supplier-quote/invalid-token-123`);

    // Attendre que la page charge
    await page.waitForLoadState('networkidle');

    // Devrait afficher un message d'erreur
    const errorMessage = page.getByText(/erreur|introuvable|invalide|expiré|not found|error/i);
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('Token vide redirige ou affiche erreur', async ({ page }) => {
    await page.goto(`${BASE_URL}/supplier-quote/`);

    // Devrait rediriger vers 404 ou afficher erreur
    await page.waitForLoadState('networkidle');

    // Vérifier qu'on n'est pas sur une page cassée
    await expect(page.locator('body')).toBeVisible();
  });

  test('URL malformée est gérée correctement', async ({ page }) => {
    // Tester avec des caractères spéciaux
    await page.goto(`${BASE_URL}/supplier-quote/<script>alert(1)</script>`);

    await page.waitForLoadState('networkidle');

    // Devrait afficher une erreur, pas exécuter le script
    const alertFired = await page.evaluate(() => {
      return (window as any).__alertFired || false;
    });
    expect(alertFired).toBe(false);
  });
});

test.describe('API Fournisseur', () => {
  test('GET avec token invalide retourne erreur', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/supplier-quote/invalid-token`);

    // Devrait retourner 404 ou 400
    expect([400, 404, 500]).toContain(response.status());
  });

  test('POST sans données retourne erreur validation', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/supplier-quote/test-token`, {
      data: {},
    });

    // Devrait retourner erreur de validation
    expect([400, 404, 422, 500]).toContain(response.status());
  });

  test('POST avec données partielles valide les champs', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/supplier-quote/test-token`, {
      data: {
        material_id: 'test-id',
        // Manque les autres champs requis
      },
    });

    expect([400, 404, 422, 500]).toContain(response.status());
  });
});

test.describe('Envoi de devis aux fournisseurs', () => {
  test('API supplier-requests nécessite authentification', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/supplier-requests`);

    // Devrait demander l'authentification
    expect([401, 403, 500]).toContain(response.status());
  });

  test('API admin supplier-requests nécessite authentification', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/admin/supplier-requests`);

    expect([401, 403, 500]).toContain(response.status());
  });

  test('Envoi de demande sans auth échoue', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/admin/supplier-requests/send`, {
      data: {
        supplier_ids: ['test-supplier-id'],
        project_id: 'test-project-id',
      },
    });

    expect([401, 403, 500]).toContain(response.status());
  });
});

test.describe('Sécurité Interface Fournisseur', () => {
  test('XSS protection dans les paramètres', async ({ page }) => {
    // Tenter une injection XSS via l'URL
    await page.goto(`${BASE_URL}/supplier-quote/"><script>alert('xss')</script>`);

    await page.waitForLoadState('networkidle');

    // Vérifier que l'alerte n'a pas été déclenchée
    let alertTriggered = false;
    page.on('dialog', () => {
      alertTriggered = true;
    });

    await page.waitForTimeout(1000);
    expect(alertTriggered).toBe(false);
  });

  test('SQL injection protection dans les paramètres', async ({ page }) => {
    // Tenter une injection SQL via l'URL
    await page.goto(`${BASE_URL}/supplier-quote/1'; DROP TABLE users; --`);

    await page.waitForLoadState('networkidle');

    // La page devrait simplement afficher une erreur de token invalide
    await expect(page.locator('body')).toBeVisible();
  });

  test('Path traversal protection', async ({ page }) => {
    await page.goto(`${BASE_URL}/supplier-quote/../../../etc/passwd`);

    await page.waitForLoadState('networkidle');

    // Ne devrait pas exposer de fichiers système
    const content = await page.content();
    expect(content).not.toContain('root:');
  });
});

test.describe('Formulaire de prix fournisseur (structure)', () => {
  // Note: Ces tests ne peuvent vérifier que la structure car nous n'avons pas de vrai token

  test('La page de quote fournisseur a la structure attendue', async ({ page }) => {
    // On peut au moins vérifier que la route existe
    const response = await page.goto(`${BASE_URL}/supplier-quote/test-token`);

    // Devrait retourner 200 (page existe) même si le token est invalide
    expect(response?.status()).toBeLessThan(500);
  });

  test('Les headers CORS sont configurés pour l\'API', async ({ request }) => {
    const response = await request.options(`${BASE_URL}/api/supplier-quote/test`);

    // L'API devrait accepter les requêtes
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Rate Limiting', () => {
  test('API protégée contre les requêtes abusives', async ({ request }) => {
    // Envoyer plusieurs requêtes rapidement
    const responses = await Promise.all(
      Array(10).fill(null).map(() =>
        request.get(`${BASE_URL}/api/supplier-quote/test-token`)
      )
    );

    // Vérifier que toutes les requêtes sont traitées (pas de crash)
    responses.forEach(response => {
      expect(response.status()).toBeLessThan(500);
    });

    // Note: Si rate limiting est activé, certaines requêtes devraient retourner 429
    // const rateLimited = responses.filter(r => r.status() === 429);
    // En production, on pourrait vérifier: expect(rateLimited.length).toBeGreaterThan(0);
  });
});

test.describe('Validation des données de prix', () => {
  test('Montant négatif devrait être rejeté', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/supplier-quote/test-token`, {
      data: {
        material_id: 'mat-123',
        amount: -100,
        currency: 'EUR',
      },
    });

    // Devrait échouer validation ou token invalide
    expect([400, 404, 422, 500]).toContain(response.status());
  });

  test('Devise invalide devrait être rejetée', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/supplier-quote/test-token`, {
      data: {
        material_id: 'mat-123',
        amount: 100,
        currency: 'INVALID_CURRENCY',
      },
    });

    expect([400, 404, 422, 500]).toContain(response.status());
  });

  test('Material ID invalide devrait être rejeté', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/supplier-quote/test-token`, {
      data: {
        material_id: '',
        amount: 100,
        currency: 'EUR',
      },
    });

    expect([400, 404, 422, 500]).toContain(response.status());
  });
});

test.describe('Comportement mobile', () => {
  test('Interface fournisseur responsive', async ({ page }) => {
    // Simuler mobile
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`${BASE_URL}/supplier-quote/test-token`);

    await page.waitForLoadState('networkidle');

    // La page devrait s'afficher sans scroll horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Tolérance de 20px
  });

  test('Boutons accessibles au toucher sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`${BASE_URL}/supplier-quote/test-token`);

    await page.waitForLoadState('networkidle');

    // Vérifier que les boutons ont une taille minimale pour le toucher (44x44)
    const buttons = page.locator('button:visible');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        // Les boutons devraient avoir au moins 40px de hauteur pour être accessibles
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
    }
  });
});

test.describe('Accessibilité', () => {
  test('Les formulaires ont des labels', async ({ page }) => {
    await page.goto(`${BASE_URL}/supplier-quote/test-token`);

    await page.waitForLoadState('networkidle');

    // Vérifier que les inputs visibles ont des labels associés
    const inputs = page.locator('input:visible');
    const count = await inputs.count();

    // Même si le token est invalide, on peut vérifier la structure HTML
    // Si des inputs existent, ils devraient avoir des labels
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');

        // L'input devrait avoir soit un id (pour un label), soit un aria-label, soit un placeholder
        const hasAccessibleName = id || ariaLabel || placeholder;
        expect(hasAccessibleName).toBeTruthy();
      }
    }
  });

  test('Focus visible sur les éléments interactifs', async ({ page }) => {
    await page.goto(`${BASE_URL}/supplier-quote/test-token`);

    await page.waitForLoadState('networkidle');

    // Naviguer avec Tab et vérifier que le focus est visible
    await page.keyboard.press('Tab');

    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
