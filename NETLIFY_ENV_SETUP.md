# 🚀 Configuration des Variables d'Environnement sur Netlify

## ⚠️ Problème Actuel

```
GET /api/admin/supplier-requests → 500 Internal Server Error
Error: Missing Supabase service role credentials
```

**Cause** : Les variables d'environnement ne sont pas configurées sur Netlify.

---

## ✅ Solution : Configurer les Variables sur Netlify

### **Étape 1 : Accéder à Netlify**

1. Aller sur : https://app.netlify.com
2. Se connecter avec votre compte
3. Sélectionner le site : **byproject-twinsk**

---

### **Étape 2 : Accéder aux Variables d'Environnement**

```
Site Overview → Site configuration → Environment variables
```

Ou directement :
```
https://app.netlify.com/sites/byproject-twinsk/configuration/env
```

---

### **Étape 3 : Ajouter les 3 Variables Requises**

#### **Variable 1 : NEXT_PUBLIC_SUPABASE_URL**

```
Key:   NEXT_PUBLIC_SUPABASE_URL
Value: https://ebmgtfftimezuuxxzyjm.supabase.co
Scopes: ✅ All scopes (Production + Deploy previews + Branch deploys)
```

**Cliquer sur "Add variable"**

---

#### **Variable 2 : NEXT_PUBLIC_SUPABASE_ANON_KEY**

```
Key:   NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Votre clé anon depuis Supabase]
Scopes: ✅ All scopes
```

**Comment obtenir la clé** :
1. Aller sur : https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/settings/api
2. Copier la clé **"anon" "public"**
3. Coller dans Netlify

**Cliquer sur "Add variable"**

---

#### **Variable 3 : SUPABASE_SERVICE_ROLE_KEY** ⚠️ IMPORTANT

```
Key:   SUPABASE_SERVICE_ROLE_KEY
Value: [Votre clé service_role depuis Supabase]
Scopes: ✅ All scopes
```

**Comment obtenir la clé** :
1. Aller sur : https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/settings/api
2. Copier la clé **"service_role" "secret"** (cliquer sur "Reveal" si masquée)
3. Coller dans Netlify

⚠️ **ATTENTION** : Cette clé donne un accès complet à votre base de données. Ne la partagez JAMAIS publiquement.

**Cliquer sur "Add variable"**

---

### **Étape 4 : Vérifier la Configuration**

Après avoir ajouté les 3 variables, vous devriez voir :

```
┌─────────────────────────────────────────────────────────┐
│ Environment Variables (3)                               │
├─────────────────────────────────────────────────────────┤
│ NEXT_PUBLIC_SUPABASE_URL                                │
│ Value: https://ebmgtfftimezuuxxzyjm.supabase.co         │
│ Scopes: All                                             │
├─────────────────────────────────────────────────────────┤
│ NEXT_PUBLIC_SUPABASE_ANON_KEY                           │
│ Value: eyJhbGc... (hidden)                              │
│ Scopes: All                                             │
├─────────────────────────────────────────────────────────┤
│ SUPABASE_SERVICE_ROLE_KEY                               │
│ Value: eyJhbGc... (hidden)                              │
│ Scopes: All                                             │
└─────────────────────────────────────────────────────────┘
```

---

### **Étape 5 : Redéployer le Site**

**Option A : Déploiement Automatique** (Recommandé)
```
Le prochain push Git déclenchera automatiquement un déploiement
avec les nouvelles variables d'environnement.
```

**Option B : Déploiement Manuel** (Plus rapide)
```
1. Aller dans l'onglet "Deploys"
2. Cliquer sur "Trigger deploy"
3. Sélectionner "Clear cache and deploy site"
4. Attendre 2-3 minutes
```

---

### **Étape 6 : Vérifier que Ça Fonctionne**

Une fois le déploiement terminé :

1. **Ouvrir la page admin** :
   ```
   https://byproject-twinsk.netlify.app/admin/supplier-requests
   ```

2. **Vérifier la console du navigateur** :
   - Ouvrir DevTools (F12)
   - Aller dans l'onglet "Console"
   - Vous devriez voir :
     ```
     Environment check: {
       hasUrl: true,
       hasServiceKey: true,
       url: "https://ebmgtfftimez..."
     }
     ```

3. **Vérifier les logs Netlify** :
   ```
   Netlify Dashboard → Deploys → [Latest deploy] → Function logs
   ```

4. **Résultat attendu** :
   - ✅ Pas d'erreur 500
   - ✅ Liste des demandes affichée
   - ✅ Boutons "Envoyer" fonctionnels

---

## 🔍 Où Trouver les Clés Supabase

### **Dashboard Supabase**

```
URL: https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/settings/api
```

### **Clés Disponibles**

```
┌─────────────────────────────────────────────────────────┐
│ Project URL                                             │
│ https://ebmgtfftimezuuxxzyjm.supabase.co                │
│ → Copier pour NEXT_PUBLIC_SUPABASE_URL                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ API Keys                                                │
├─────────────────────────────────────────────────────────┤
│ anon public                                             │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...                 │
│ → Copier pour NEXT_PUBLIC_SUPABASE_ANON_KEY             │
├─────────────────────────────────────────────────────────┤
│ service_role secret ⚠️                                  │
│ [Reveal] → Cliquer pour afficher                        │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...                 │
│ → Copier pour SUPABASE_SERVICE_ROLE_KEY                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 Sécurité

### **Variables Publiques** (Préfixe `NEXT_PUBLIC_`)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

- ✅ Visibles côté client (navigateur)
- ✅ Incluses dans le bundle JavaScript
- ✅ Pas de risque de sécurité
- ✅ Protégées par RLS (Row Level Security)

### **Variables Secrètes** (Pas de préfixe)

```
SUPABASE_SERVICE_ROLE_KEY
```

- ⚠️ **NE JAMAIS** exposer côté client
- ⚠️ **NE JAMAIS** committer dans Git
- ✅ Utilisée uniquement dans les API routes (serveur)
- ✅ Bypass RLS (accès complet à la DB)
- ✅ Sécurisée sur Netlify (variables d'environnement)

---

## 📊 Diagnostic

### **Comment Savoir si les Variables Sont Configurées**

#### **Test 1 : Vérifier dans Netlify**
```
Netlify → Site configuration → Environment variables
Vous devriez voir 3 variables
```

#### **Test 2 : Vérifier les Logs de Build**
```
Netlify → Deploys → [Latest] → Deploy log
Chercher : "Environment variables"
```

#### **Test 3 : Tester l'API**
```bash
curl https://byproject-twinsk.netlify.app/api/admin/supplier-requests

# Si variables OK :
{"data": [...]}

# Si variables manquantes :
{"error": "Missing Supabase service role credentials"}
```

---

## 🐛 Dépannage

### **Erreur : 500 Internal Server Error**

**Cause** : Variables d'environnement manquantes

**Solution** :
1. Vérifier que les 3 variables sont configurées sur Netlify
2. Vérifier que les valeurs sont correctes
3. Redéployer le site (Clear cache and deploy)

---

### **Erreur : Invalid API key**

**Cause** : Clé Supabase incorrecte

**Solution** :
1. Aller sur Supabase Dashboard
2. Copier à nouveau les clés
3. Mettre à jour sur Netlify
4. Redéployer

---

### **Erreur : Cannot read property 'from' of undefined**

**Cause** : `createServiceClient()` retourne undefined

**Solution** :
1. Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est définie
2. Vérifier que la clé est valide
3. Redéployer

---

## ✅ Checklist Finale

- [ ] Aller sur Netlify Dashboard
- [ ] Accéder à "Environment variables"
- [ ] Ajouter `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Ajouter `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Ajouter `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Vérifier que les 3 variables sont présentes
- [ ] Cliquer sur "Trigger deploy" → "Clear cache and deploy site"
- [ ] Attendre 2-3 minutes
- [ ] Tester : https://byproject-twinsk.netlify.app/admin/supplier-requests
- [ ] Vérifier qu'il n'y a pas d'erreur 500
- [ ] Vérifier que les demandes s'affichent

---

## 📞 Support

Si le problème persiste après avoir suivi ces étapes :

1. **Vérifier les logs Netlify** :
   ```
   Netlify → Deploys → [Latest] → Function logs
   ```

2. **Vérifier les logs du navigateur** :
   ```
   F12 → Console
   Chercher : "Environment check"
   ```

3. **Tester l'API directement** :
   ```bash
   curl -v https://byproject-twinsk.netlify.app/api/admin/supplier-requests
   ```

---

## 🎯 Résultat Attendu

Après configuration :

```
✅ Variables d'environnement configurées
✅ Site redéployé
✅ API routes fonctionnelles
✅ Page admin accessible
✅ Liste des demandes affichée
✅ Pas d'erreur 500
```

**Status : Prêt pour la production !** 🚀
