# 🤖 Guide des Tests Automatisés - By Project

**Date**: 8 Novembre 2025  
**Version**: 1.0  
**Framework**: Playwright

---

## 📋 Vue d'Ensemble

J'ai créé une suite de tests automatisés E2E (End-to-End) avec Playwright pour tester tous les flows critiques de l'application.

**Avantages:**
- ✅ Tests automatiques et reproductibles
- ✅ Tests sur plusieurs navigateurs (Chrome, Firefox, Safari)
- ✅ Tests mobile (iOS et Android)
- ✅ Screenshots et vidéos en cas d'échec
- ✅ Rapports HTML détaillés
- ✅ Intégration CI/CD possible

---

## 🚀 Installation

### 1. Installer Playwright

```bash
# Installer Playwright et les navigateurs
npm install -D @playwright/test
npx playwright install
```

### 2. Vérifier l'installation

```bash
# Vérifier que Playwright est installé
npx playwright --version
```

---

## 🧪 Exécution des Tests

### Tests Complets

```bash
# Lancer tous les tests
npx playwright test

# Lancer avec l'interface UI
npx playwright test --ui

# Lancer en mode debug
npx playwright test --debug
```

### Tests Spécifiques

```bash
# Lancer uniquement les tests d'authentification
npx playwright test auth.spec.ts

# Lancer un test spécifique
npx playwright test -g "inscription réussie"

# Lancer sur un navigateur spécifique
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Tests avec Options

```bash
# Mode headed (voir le navigateur)
npx playwright test --headed

# Mode debug avec pause
npx playwright test --debug

# Avec trace
npx playwright test --trace on

# Avec screenshots
npx playwright test --screenshot on
```

---

## 📊 Rapports

### Voir le Rapport HTML

```bash
# Générer et ouvrir le rapport
npx playwright show-report
```

Le rapport contient:
- ✅ Résumé des tests (réussis/échoués)
- ✅ Durée de chaque test
- ✅ Screenshots des échecs
- ✅ Vidéos des échecs
- ✅ Traces détaillées

### Rapport JSON

Le rapport JSON est généré dans `test-results/results.json` et peut être utilisé pour:
- Intégration CI/CD
- Dashboards personnalisés
- Analyse de tendances

---

## 🧪 Tests Disponibles

### FLOW 1: Inscription (6 tests)

**1.1 - Page d'inscription se charge**
- Vérifie que la page `/signup` se charge
- Vérifie présence du logo
- Vérifie présence du formulaire complet

**1.2 - Validation formulaire vide**
- Essaie de soumettre sans remplir
- Vérifie que la validation HTML5 fonctionne

**1.3 - Validation email invalide**
- Entre un email invalide
- Vérifie le message d'erreur

**1.4 - Validation mot de passe faible**
- Entre un mot de passe < 8 caractères
- Vérifie le toast d'erreur

**1.5 - Validation mots de passe non correspondants**
- Entre deux mots de passe différents
- Vérifie le toast d'erreur

**1.6 - Inscription réussie** ✅
- Remplit le formulaire correctement
- Vérifie le toast de succès
- Vérifie la redirection vers `/login`

### FLOW 2: Récupération Mot de Passe (3 tests)

**2.1 - Page forgot-password se charge**
- Vérifie présence du formulaire
- Vérifie lien retour

**2.2 - Validation email invalide**
- Entre un email invalide
- Vérifie la validation

**2.3 - Envoi email de récupération**
- Entre un email valide
- Vérifie le message de succès

### FLOW 3: Connexion (3 tests)

**3.1 - Page login se charge**
- Vérifie présence du formulaire

**3.2 - Connexion avec identifiants invalides**
- Essaie de se connecter avec de mauvais identifiants
- Vérifie le message d'erreur

**3.3 - Connexion réussie** (skip)
- Test désactivé car nécessite un vrai mot de passe

### FLOW 5: RLS Policies (1 test)

**5.1 - Accès non autorisé**
- Essaie d'accéder à l'API sans authentification
- Vérifie le code 401/403

### FLOW 6: Performance (2 tests)

**6.1 - Page d'accueil rapide**
- Mesure le temps de chargement
- Vérifie < 3 secondes

**6.2 - Pas d'erreurs console**
- Vérifie qu'il n'y a pas d'erreurs JavaScript

---

## 📝 Résultats Attendus

### Tests qui DOIVENT Passer (100%)

- ✅ 1.1 - Page d'inscription se charge
- ✅ 1.2 - Validation formulaire vide
- ✅ 1.3 - Validation email invalide
- ✅ 1.4 - Validation mot de passe faible
- ✅ 1.5 - Validation mots de passe non correspondants
- ✅ 1.6 - Inscription réussie
- ✅ 2.1 - Page forgot-password se charge
- ✅ 2.2 - Validation email invalide
- ✅ 2.3 - Envoi email de récupération
- ✅ 3.1 - Page login se charge
- ✅ 3.2 - Connexion invalide
- ✅ 5.1 - Accès non autorisé
- ✅ 6.1 - Performance
- ✅ 6.2 - Pas d'erreurs console

**Total: 14 tests**

### Tests Skip (à implémenter plus tard)

- ⏸️ 3.3 - Connexion réussie (nécessite authentification)
- ⏸️ 4.1 - Accès au profil (nécessite authentification)

---

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env.test` :

```env
NEXT_PUBLIC_SITE_URL=https://byproject.netlify.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Playwright Config

Le fichier `playwright.config.ts` contient:

```typescript
{
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2, // En CI
  workers: 1, // En CI
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
    { name: 'Mobile Chrome' },
    { name: 'Mobile Safari' },
  ],
}
```

---

## 🎯 Utilisation Recommandée

### Développement Local

```bash
# Lancer les tests en mode UI (recommandé)
npx playwright test --ui

# Ou en mode headed pour voir le navigateur
npx playwright test --headed

# Ou en mode debug pour débugger
npx playwright test --debug
```

### Avant un Commit

```bash
# Lancer tous les tests rapidement
npx playwright test --project=chromium
```

### Avant un Déploiement

```bash
# Lancer tous les tests sur tous les navigateurs
npx playwright test

# Voir le rapport
npx playwright show-report
```

### En CI/CD

```bash
# Dans GitHub Actions / Netlify
npx playwright test --reporter=json
```

---

## 📸 Screenshots et Vidéos

### Localisation

Les artifacts sont sauvegardés dans:
- `test-results/` - Screenshots, vidéos, traces
- `playwright-report/` - Rapport HTML

### Voir les Traces

```bash
# Ouvrir une trace spécifique
npx playwright show-trace test-results/[test-name]/trace.zip
```

---

## 🐛 Debugging

### Mode Debug

```bash
# Lancer en mode debug
npx playwright test --debug

# Ou pour un test spécifique
npx playwright test auth.spec.ts:19 --debug
```

### Console Logs

Les tests capturent automatiquement:
- ✅ Erreurs console
- ✅ Requêtes réseau
- ✅ Événements page

### Pause dans le Test

Ajoutez `await page.pause()` dans le test:

```typescript
test('mon test', async ({ page }) => {
  await page.goto('/signup');
  await page.pause(); // Le test s'arrête ici
  // ...
});
```

---

## 🔄 Intégration CI/CD

### GitHub Actions

Créez `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run tests
        run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Netlify

Dans `netlify.toml`:

```toml
[build]
  command = "npm run build && npx playwright test"
```

---

## 📊 Métriques de Succès

### Objectifs

- ✅ **100%** des tests critiques passent
- ✅ **0** erreur console
- ✅ **< 3s** temps de chargement
- ✅ **> 90%** coverage des flows

### KPIs

- Nombre de tests: **14**
- Temps d'exécution: **< 2 min**
- Taux de réussite: **100%**
- Navigateurs testés: **5**

---

## 🚀 Prochaines Étapes

### Tests à Ajouter

1. **Tests authentifiés**
   - Profil utilisateur
   - Paramètres
   - Création de projet
   - Ajout de matériaux

2. **Tests admin**
   - Dashboard analytics
   - Gestion utilisateurs
   - Gestion taux de change

3. **Tests API**
   - Endpoints REST
   - Webhooks
   - Rate limiting

4. **Tests de charge**
   - k6 ou Artillery
   - Stress testing
   - Performance monitoring

---

## 📚 Ressources

### Documentation

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)

### Exemples

- [Playwright Examples](https://github.com/microsoft/playwright/tree/main/examples)
- [Test Patterns](https://playwright.dev/docs/test-patterns)

---

## ✅ Checklist d'Utilisation

**Avant de commencer:**
- [ ] Playwright installé
- [ ] Navigateurs installés
- [ ] Variables d'environnement configurées
- [ ] Application en cours d'exécution (localhost:3000)

**Exécution:**
- [ ] Tests lancés
- [ ] Rapport généré
- [ ] Screenshots vérifiés
- [ ] Bugs documentés

**Après les tests:**
- [ ] Rapport partagé avec l'équipe
- [ ] Bugs créés dans le tracker
- [ ] Tests mis à jour si nécessaire

---

## 🎉 Conclusion

Vous disposez maintenant d'une suite de tests automatisés complète pour valider tous les flows critiques de l'application !

**Commandes essentielles:**

```bash
# Installation
npm install -D @playwright/test
npx playwright install

# Exécution
npx playwright test --ui

# Rapport
npx playwright show-report
```

**Prêt à tester ! 🚀**
