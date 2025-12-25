# ✅ Vérifier les Variables d'Environnement sur Netlify

## 🎯 Objectif

Vérifier que les 3 variables d'environnement requises sont bien configurées sur Netlify.

---

## 📋 Variables Requises

```
1. NEXT_PUBLIC_SUPABASE_URL
2. NEXT_PUBLIC_SUPABASE_ANON_KEY
3. SUPABASE_SERVICE_ROLE_KEY
```

---

## 🔍 Méthode 1 : Via le Dashboard Netlify (Recommandé)

### **Étape 1 : Accéder aux Variables**

```
https://app.netlify.com/sites/byproject-twinsk/configuration/env
```

Ou manuellement :
1. Aller sur https://app.netlify.com
2. Sélectionner le site **byproject-twinsk**
3. Cliquer sur **Site configuration**
4. Dans le menu latéral, cliquer sur **Environment variables**

### **Étape 2 : Vérifier la Présence**

Vous devriez voir **3 variables** :

```
┌─────────────────────────────────────────────────────────┐
│ Environment Variables (3)                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ✅ NEXT_PUBLIC_SUPABASE_URL                             │
│    Value: https://ebmgtfftimezuuxxzyjm.supabase.co      │
│    Scopes: All                                          │
│                                                         │
│ ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY                        │
│    Value: eyJhbGc... (hidden)                           │
│    Scopes: All                                          │
│                                                         │
│ ✅ SUPABASE_SERVICE_ROLE_KEY                            │
│    Value: eyJhbGc... (hidden)                           │
│    Scopes: All                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### **Étape 3 : Vérifier les Valeurs**

Pour chaque variable, cliquer sur **"Options"** → **"Edit"** pour voir :
- ✅ La valeur est bien remplie (pas vide)
- ✅ Les scopes incluent "Production"
- ✅ La valeur correspond à celle de Supabase

---

## 🔍 Méthode 2 : Via Netlify CLI

### **Prérequis**

```bash
# Installer Netlify CLI (si pas déjà fait)
npm install -g netlify-cli

# Ou utiliser npx
npx netlify-cli --version
```

### **Étape 1 : Se Connecter**

```bash
npx netlify-cli login
```

Cela ouvrira votre navigateur pour autoriser l'accès.

### **Étape 2 : Lier le Projet**

```bash
npx netlify-cli link --name byproject-twinsk
```

### **Étape 3 : Lister les Variables**

```bash
npx netlify-cli env:list
```

**Résultat attendu** :

```
┌─────────────────────────────────────────┐
│ Environment variables                   │
├─────────────────────────────────────────┤
│ NEXT_PUBLIC_SUPABASE_URL                │
│ NEXT_PUBLIC_SUPABASE_ANON_KEY           │
│ SUPABASE_SERVICE_ROLE_KEY               │
└─────────────────────────────────────────┘
```

---

## 🔍 Méthode 3 : Via l'API Netlify

### **Prérequis**

1. Créer un token d'accès :
   ```
   https://app.netlify.com/user/applications
   → New access token
   ```

2. Ajouter dans `.env.local` :
   ```bash
   NETLIFY_AUTH_TOKEN=votre_token_ici
   NETLIFY_SITE_ID=byproject-twinsk
   ```

### **Utiliser le Script**

```bash
node scripts/check-netlify-env.js
```

**Résultat attendu** :

```
🔍 Vérification des variables d'environnement Netlify...

📦 Site: byproject-twinsk
🌐 URL: https://byproject-twinsk.netlify.app
🆔 ID: ...

📋 Variables d'environnement:

✅ NEXT_PUBLIC_SUPABASE_URL
   Valeur: https://ebmgtfftimezuuxxzyjm.supabase.co
   Scopes: all

✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
   Valeur: eyJhbGciOi...XVCJ9.eyJpc3...
   Scopes: all

✅ SUPABASE_SERVICE_ROLE_KEY
   Valeur: eyJhbGciOi...XVCJ9.eyJpc3...
   Scopes: all

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Toutes les variables requises sont configurées !

🚀 Prochaines étapes:
1. Redéployer le site si ce n'est pas déjà fait
2. Tester: https://byproject-twinsk.netlify.app/admin/supplier-requests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔍 Méthode 4 : Tester l'API Directement

### **Test Simple**

```bash
curl -I https://byproject-twinsk.netlify.app/api/admin/supplier-requests
```

**Si variables OK** :
```
HTTP/2 200
```

**Si variables manquantes** :
```
HTTP/2 500
```

### **Test Détaillé**

```bash
curl https://byproject-twinsk.netlify.app/api/admin/supplier-requests
```

**Si variables OK** :
```json
{
  "data": [...]
}
```

**Si variables manquantes** :
```json
{
  "error": "Missing Supabase service role credentials"
}
```

---

## 🔍 Méthode 5 : Vérifier les Logs Netlify

### **Étape 1 : Accéder aux Logs**

```
https://app.netlify.com/sites/byproject-twinsk/deploys
```

1. Cliquer sur le dernier déploiement
2. Cliquer sur **"Function logs"**

### **Étape 2 : Chercher les Logs**

Chercher dans les logs :

```
Environment check: {
  hasUrl: true,
  hasServiceKey: true,
  url: "https://ebmgtfftimez..."
}
```

**Si variables OK** :
```javascript
{
  hasUrl: true,
  hasServiceKey: true,
  url: "https://ebmgtfftimez..."
}
```

**Si variables manquantes** :
```javascript
{
  hasUrl: false,  // ❌
  hasServiceKey: false,  // ❌
  url: undefined
}
```

---

## ✅ Checklist de Vérification

### **Variables Présentes**

- [ ] `NEXT_PUBLIC_SUPABASE_URL` existe
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` existe
- [ ] `SUPABASE_SERVICE_ROLE_KEY` existe

### **Valeurs Correctes**

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://ebmgtfftimezuuxxzyjm.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` commence par `eyJhbGc...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` commence par `eyJhbGc...`

### **Scopes Configurés**

- [ ] Toutes les variables ont le scope "Production"
- [ ] (Optionnel) Scopes "Deploy previews" et "Branch deploys"

### **Déploiement**

- [ ] Site redéployé après ajout des variables
- [ ] Dernier déploiement réussi (vert)
- [ ] Pas d'erreur dans les logs de build

### **Tests**

- [ ] API `/api/admin/supplier-requests` retourne 200
- [ ] Page admin accessible sans erreur 500
- [ ] Liste des demandes s'affiche

---

## 🐛 Si Variables Manquantes

### **Ajouter les Variables**

1. Aller sur : https://app.netlify.com/sites/byproject-twinsk/configuration/env
2. Cliquer sur **"Add a variable"**
3. Ajouter chaque variable manquante
4. Sauvegarder

### **Redéployer**

```
Netlify → Deploys → Trigger deploy → Clear cache and deploy site
```

Attendre 2-3 minutes.

### **Vérifier à Nouveau**

Répéter les tests ci-dessus.

---

## 📊 Résumé des Méthodes

| Méthode | Difficulté | Temps | Détails |
|---------|-----------|-------|---------|
| Dashboard Netlify | ⭐ Facile | 1 min | ✅ Recommandé |
| Netlify CLI | ⭐⭐ Moyen | 3 min | Nécessite login |
| API Netlify | ⭐⭐⭐ Avancé | 5 min | Nécessite token |
| Test API | ⭐ Facile | 30 sec | Test rapide |
| Logs Netlify | ⭐⭐ Moyen | 2 min | Bon pour debug |

---

## 🎯 Recommandation

**Méthode la plus simple** :
1. Ouvrir : https://app.netlify.com/sites/byproject-twinsk/configuration/env
2. Vérifier visuellement les 3 variables
3. Si manquantes, les ajouter
4. Redéployer

**Total : 2-3 minutes** ⏱️

---

## 📚 Ressources

- **Guide de configuration** : `NETLIFY_ENV_SETUP.md`
- **Script de vérification** : `scripts/check-netlify-env.js`
- **Script simple** : `scripts/check-env-simple.sh`
- **Documentation Netlify** : https://docs.netlify.com/environment-variables/overview/

---

## ✅ Résultat Attendu

Après vérification et configuration :

```
✅ 3 variables configurées
✅ Valeurs correctes
✅ Scopes appropriés
✅ Site redéployé
✅ API fonctionnelle
✅ Page admin accessible
```

**Status : Production Ready !** 🚀
