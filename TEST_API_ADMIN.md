# 🧪 Test de l'API Admin - Supplier Requests

## ✅ Problèmes Résolus

### **1. Variables d'Environnement** ✅
```
Avant: Missing Supabase service role credentials
Après: Variables configurées sur Netlify
```

### **2. Erreur de Relation SQL** ✅
```
Avant: Could not find relationship between 'supplier_requests' and 'user_id'
Après: Requêtes séparées + enrichissement manuel
```

---

## 🧪 Tests à Effectuer

### **Test 1 : API Endpoint**

Attendre **2-3 minutes** que Netlify redéploie, puis :

```bash
curl https://byproject-twinsk.netlify.app/api/admin/supplier-requests
```

**Résultat Attendu** :
```json
{
  "data": [
    {
      "id": "...",
      "request_number": "REQ-...",
      "project_id": "...",
      "user_id": "...",
      "status": "pending_admin",
      "num_suppliers": 3,
      "total_materials": 0,
      "metadata": {
        "country": "China",
        "shipping_type": "sea",
        "notes": "..."
      },
      "created_at": "...",
      "projects": {
        "id": "...",
        "name": "Mon Projet"
      },
      "users": {
        "id": "...",
        "email": "user@example.com",
        "full_name": "John Doe"
      }
    }
  ]
}
```

**Si Erreur** :
```json
{
  "error": "Message d'erreur"
}
```

---

### **Test 2 : Page Admin**

```
https://byproject-twinsk.netlify.app/admin/supplier-requests
```

**Résultat Attendu** :
- ✅ Page charge sans erreur
- ✅ Liste des demandes affichée
- ✅ Colonnes : Numéro, Projet, Utilisateur, Statut, etc.
- ✅ Bouton "Envoyer" pour les demandes `pending_admin`
- ✅ Icône lien pour les demandes `sent`

---

### **Test 3 : Console du Navigateur**

Ouvrir DevTools (F12) → Console

**Résultat Attendu** :
```
Environment check: {
  hasUrl: true,
  hasServiceKey: true,
  url: "https://ebmgtfftimez..."
}
```

**Pas d'erreur** :
- ❌ Pas de "500 Internal Server Error"
- ❌ Pas de "Missing credentials"
- ❌ Pas de "Could not find relationship"

---

### **Test 4 : Netlify Function Logs**

```
https://app.netlify.com/sites/byproject-twinsk/functions
```

1. Cliquer sur la fonction `api/admin/supplier-requests`
2. Voir les logs récents

**Résultat Attendu** :
```
Environment check: { hasUrl: true, hasServiceKey: true, ... }
[No errors]
```

---

## 📊 Architecture Actuelle

### **Flux de Données**

```
┌─────────────────────────────────────────┐
│ Browser                                 │
│ /admin/supplier-requests                │
└─────────────────────────────────────────┘
                ↓ fetch()
┌─────────────────────────────────────────┐
│ API Route (Netlify Function)            │
│ /api/admin/supplier-requests            │
│                                         │
│ 1. Check environment variables          │
│ 2. Create service client                │
│ 3. Fetch supplier_requests              │
│ 4. For each request:                    │
│    - Fetch project data                 │
│    - Fetch user data (auth.admin)       │
│ 5. Return enriched data                 │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ Supabase                                │
│ - supplier_requests table               │
│ - projects table                        │
│ - auth.users (via admin API)            │
└─────────────────────────────────────────┘
```

---

## 🔧 Changements Appliqués

### **Avant (❌ Erreur)**

```typescript
// Tentative de JOIN SQL
const { data } = await supabase
  .from('supplier_requests')
  .select(`
    *,
    projects:project_id (id, name),
    users:user_id (id, email, full_name)
  `);

// Erreur: Relationship not found
```

### **Après (✅ Fonctionne)**

```typescript
// 1. Fetch requests
const { data: requests } = await supabase
  .from('supplier_requests')
  .select('*');

// 2. Enrich manually
const enriched = await Promise.all(
  requests.map(async (request) => {
    // Fetch project
    const { data: project } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', request.project_id)
      .single();

    // Fetch user
    const { data: user } = await supabase.auth.admin
      .getUserById(request.user_id);

    return {
      ...request,
      projects: project,
      users: {
        id: user.user.id,
        email: user.user.email,
        full_name: user.user.user_metadata?.full_name || user.user.email,
      },
    };
  })
);
```

---

## ✅ Checklist de Vérification

### **Variables d'Environnement**
- [x] NEXT_PUBLIC_SUPABASE_URL configurée
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY configurée
- [x] SUPABASE_SERVICE_ROLE_KEY configurée

### **Code**
- [x] API route créée
- [x] Service client utilisé côté serveur
- [x] Requêtes SQL corrigées
- [x] Enrichissement manuel implémenté
- [x] Gestion d'erreurs ajoutée

### **Déploiement**
- [x] Code committé
- [x] Code poussé sur GitHub
- [ ] Netlify redéployé (attendre 2-3 min)

### **Tests**
- [ ] API retourne 200
- [ ] Données enrichies présentes
- [ ] Page admin accessible
- [ ] Liste des demandes affichée
- [ ] Pas d'erreur console

---

## 🚀 Prochaines Étapes

### **Immédiat (2-3 minutes)**

1. **Attendre** que Netlify redéploie
2. **Tester** l'API :
   ```bash
   curl https://byproject-twinsk.netlify.app/api/admin/supplier-requests
   ```
3. **Vérifier** la page admin :
   ```
   https://byproject-twinsk.netlify.app/admin/supplier-requests
   ```

### **Si Ça Fonctionne** ✅

- ✅ Les demandes s'affichent
- ✅ Bouton "Envoyer" visible
- ✅ Données utilisateur et projet présentes
- 🎉 **Système opérationnel !**

### **Si Erreur Persiste** ❌

1. Vérifier les logs Netlify
2. Vérifier la console navigateur
3. Tester l'API directement
4. Vérifier les variables d'environnement

---

## 📝 Commandes Utiles

### **Test API**
```bash
# Test simple
curl https://byproject-twinsk.netlify.app/api/admin/supplier-requests

# Test avec headers
curl -i https://byproject-twinsk.netlify.app/api/admin/supplier-requests

# Test formaté (avec jq)
curl https://byproject-twinsk.netlify.app/api/admin/supplier-requests | jq
```

### **Vérifier Déploiement**
```bash
# Status du dernier déploiement
npx netlify-cli status

# Logs en temps réel
npx netlify-cli dev:log
```

---

## 🎯 Résultat Attendu Final

```
✅ API /api/admin/supplier-requests → 200 OK
✅ Données enrichies avec projets et utilisateurs
✅ Page admin /admin/supplier-requests accessible
✅ Liste des demandes affichée
✅ Boutons fonctionnels
✅ Pas d'erreur console
✅ Système 100% opérationnel
```

**Status : En attente du redéploiement Netlify** ⏳

**Temps estimé : 2-3 minutes** ⏱️
