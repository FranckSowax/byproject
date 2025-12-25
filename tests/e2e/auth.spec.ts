import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les flows d'authentification
 * 
 * Pour exécuter ces tests:
 * 1. Installer Playwright: npm install -D @playwright/test
 * 2. Lancer les tests: npx playwright test
 * 3. Voir le rapport: npx playwright show-report
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

test.describe('FLOW 1: Inscription avec Vérification Email', () => {
  const testEmail = `test+${Date.now()}@example.com`;
  const testPassword = 'TestPass123!@#';
  const testName = 'Test User E2E';

  test('1.1 - Page d\'inscription se charge correctement', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    
    // Vérifier que la page se charge
    await expect(page).toHaveTitle(/By Project|Créer un compte/);
    
    // Vérifier présence du logo
    await expect(page.locator('svg').first()).toBeVisible();
    
    // Vérifier présence du formulaire
    await expect(page.getByLabel(/nom complet/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /créer un compte/i })).toBeVisible();
  });

  test('1.2 - Validation du formulaire vide', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    
    // Essayer de soumettre sans remplir
    await page.getByRole('button', { name: /créer un compte/i }).click();
    
    // Vérifier que le formulaire n'est pas soumis (validation HTML5)
    await expect(page.getByLabel(/nom complet/i)).toBeFocused();
  });

  test('1.3 - Validation email invalide', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    
    await page.getByLabel(/nom complet/i).fill(testName);
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/mot de passe/i).first().fill(testPassword);
    await page.getByLabel(/confirmer/i).fill(testPassword);
    
    await page.getByRole('button', { name: /créer un compte/i }).click();
    
    // Vérifier validation HTML5 email
    const emailInput = page.getByLabel(/email/i);
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('1.4 - Validation mot de passe faible', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    
    await page.getByLabel(/nom complet/i).fill(testName);
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/mot de passe/i).first().fill('123');
    await page.getByLabel(/confirmer/i).fill('123');
    
    await page.getByRole('button', { name: /créer un compte/i }).click();
    
    // Attendre le toast d'erreur
    await expect(page.getByText(/au moins 8 caractères/i)).toBeVisible({ timeout: 3000 });
  });

  test('1.5 - Validation mots de passe non correspondants', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    
    await page.getByLabel(/nom complet/i).fill(testName);
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/mot de passe/i).first().fill(testPassword);
    await page.getByLabel(/confirmer/i).fill('DifferentPass123!');
    
    await page.getByRole('button', { name: /créer un compte/i }).click();
    
    // Attendre le toast d'erreur
    await expect(page.getByText(/ne correspondent pas/i)).toBeVisible({ timeout: 3000 });
  });

  test('1.6 - Inscription réussie', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    
    // Remplir le formulaire
    await page.getByLabel(/nom complet/i).fill(testName);
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/mot de passe/i).first().fill(testPassword);
    await page.getByLabel(/confirmer/i).fill(testPassword);
    
    // Soumettre
    await page.getByRole('button', { name: /créer un compte/i }).click();
    
    // Attendre le toast de succès
    await expect(page.getByText(/compte créé avec succès/i)).toBeVisible({ timeout: 5000 });
    
    // Vérifier redirection vers login
    await page.waitForURL(/.*\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });
});

test.describe('FLOW 2: Récupération de Mot de Passe', () => {
  const testEmail = 'sowaxcom@gmail.com'; // Email existant

  test('2.1 - Page forgot-password se charge', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);
    
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /envoyer/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /retour/i })).toBeVisible();
  });

  test('2.2 - Validation email invalide', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);
    
    await page.getByLabel(/email/i).fill('invalid');
    await page.getByRole('button', { name: /envoyer/i }).click();
    
    // Vérifier validation HTML5
    const emailInput = page.getByLabel(/email/i);
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test('2.3 - Envoi email de récupération', async ({ page }) => {
    await page.goto(`${BASE_URL}/forgot-password`);
    
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByRole('button', { name: /envoyer/i }).click();
    
    // Attendre le message de succès
    await expect(page.getByText(/email envoyé/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('FLOW 3: Connexion', () => {
  const testEmail = 'sowaxcom@gmail.com';
  const testPassword = 'votre_mot_de_passe'; // À remplacer

  test('3.1 - Page login se charge', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /connexion/i })).toBeVisible();
  });

  test('3.2 - Connexion avec identifiants invalides', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/mot de passe/i).fill('wrongpassword');
    await page.getByRole('button', { name: /connexion/i }).click();
    
    // Attendre message d'erreur
    await expect(page.getByText(/invalide|incorrect/i)).toBeVisible({ timeout: 5000 });
  });

  test.skip('3.3 - Connexion réussie', async ({ page }) => {
    // Skip car nécessite un vrai mot de passe
    await page.goto(`${BASE_URL}/login`);
    
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/mot de passe/i).fill(testPassword);
    await page.getByRole('button', { name: /connexion/i }).click();
    
    // Attendre redirection vers dashboard
    await page.waitForURL(/.*\/dashboard/, { timeout: 5000 });
    expect(page.url()).toContain('/dashboard');
  });
});

test.describe('FLOW 4: Profil Utilisateur (Authentifié)', () => {
  test.skip('4.1 - Accès au profil', async ({ page }) => {
    // Skip car nécessite authentification
    // TODO: Implémenter avec storageState pour réutiliser la session
  });
});

test.describe('FLOW 5: RLS Policies', () => {
  test('5.1 - Accès non autorisé aux projets', async ({ page, request }) => {
    // Tester qu'un utilisateur non connecté ne peut pas accéder aux données
    const response = await request.get(`${BASE_URL}/api/projects`);
    
    // Devrait retourner 401 ou rediriger vers login
    expect([401, 403, 302]).toContain(response.status());
  });
});

test.describe('FLOW 6: Performance', () => {
  test('6.1 - Page d\'accueil se charge rapidement', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(BASE_URL);
    const loadTime = Date.now() - startTime;
    
    // Devrait se charger en moins de 3 secondes
    expect(loadTime).toBeLessThan(3000);
  });

  test('6.2 - Pas d\'erreurs console', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto(BASE_URL);
    
    // Filtrer les erreurs connues (ex: extensions navigateur)
    const realErrors = consoleErrors.filter(error => 
      !error.includes('extension') && 
      !error.includes('chrome-extension')
    );
    
    expect(realErrors).toHaveLength(0);
  });
});
