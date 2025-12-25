# 🔧 Solution : Rafraîchir le Token JWT après Mise à Jour du Rôle

## 🐛 Problème

Après avoir ajouté le rôle 'admin' aux métadonnées utilisateur, l'erreur **403 Forbidden** persiste :

```
GET /rest/v1/supplier_quotes → 403 Forbidden
Error: permission denied for table users
Code: 42501
```

## 🔍 Cause

Le **token JWT** stocké dans le navigateur contient les **anciennes métadonnées** de l'utilisateur (sans le rôle 'admin'). 

Les politiques RLS vérifient :
```sql
auth.users.raw_user_meta_data->>'role' = 'admin'
```

Mais le JWT actuel ne contient pas cette information mise à jour.

## ✅ Solutions

### **Solution 1 : Se Déconnecter et Se Reconnecter** (Recommandé)

1. **Déconnexion**
   - Cliquer sur le bouton de déconnexion dans l'application
   - Ou ouvrir DevTools Console et exécuter :
   ```javascript
   const { createClient } = await import('@supabase/supabase-js');
   const supabase = createClient(
     'https://ebmgtfftimezuuxxzyjm.supabase.co',
     'votre_anon_key'
   );
   await supabase.auth.signOut();
   ```

2. **Vider le cache**
   - `Cmd + Shift + R` (Mac) ou `Ctrl + Shift + R` (Windows)

3. **Se reconnecter**
   - Utiliser vos identifiants
   - Le nouveau token JWT contiendra le rôle 'admin'

### **Solution 2 : Rafraîchir le Token Manuellement**

Ouvrir DevTools Console et exécuter :

```javascript
// Méthode 1 : Via Supabase Client
const { data: { session }, error } = await supabase.auth.refreshSession();
if (session) {
  console.log('Token rafraîchi !', session.user.user_metadata);
  location.reload();
}

// Méthode 2 : Forcer la reconnexion
await supabase.auth.signOut();
// Puis se reconnecter via l'interface
```

### **Solution 3 : Mode Incognito** (Pour Tester)

1. Ouvrir une fenêtre de navigation privée
2. Aller sur `https://byproject-twinsk.netlify.app/login`
3. Se connecter avec vos identifiants
4. Accéder à `/admin/quotations`

---

## 🧪 Vérification

### **1. Vérifier le Rôle dans la Base de Données**

```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'votre_email@example.com';
```

**Résultat Attendu** : `role = 'admin'`

### **2. Vérifier le Token JWT**

Ouvrir DevTools Console :

```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('User metadata:', session?.user?.user_metadata);
console.log('Role:', session?.user?.user_metadata?.role);
```

**Résultat Attendu** : `role: 'admin'`

### **3. Décoder le JWT**

Aller sur https://jwt.io et coller le token pour voir son contenu :

```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Access Token:', session?.access_token);
```

Dans le payload JWT, vous devriez voir :
```json
{
  "user_metadata": {
    "role": "admin",
    "full_name": "..."
  }
}
```

---

## 📊 Flux de Vérification RLS

### **Avant Rafraîchissement (❌ Erreur)**

```
1. Requête → Supabase
2. Supabase vérifie le JWT
3. JWT contient : { user_metadata: {} } ← PAS de rôle
4. Politique RLS : raw_user_meta_data->>'role' = 'admin'
5. Vérification : NULL = 'admin' → FALSE
6. Résultat : 403 Forbidden
```

### **Après Rafraîchissement (✅ Succès)**

```
1. Requête → Supabase
2. Supabase vérifie le JWT
3. JWT contient : { user_metadata: { role: "admin" } } ← Rôle présent
4. Politique RLS : raw_user_meta_data->>'role' = 'admin'
5. Vérification : 'admin' = 'admin' → TRUE
6. Résultat : 200 OK
```

---

## 🔐 Utilisateurs avec Rôle Admin

Les utilisateurs suivants ont maintenant le rôle 'admin' :

| Email | Rôle | Nom |
|-------|------|-----|
| sowaxcom@gmail.com | admin | FRANCK SOWAX |
| ompayijunior@gmail.com | admin | - |
| admin@compachantier.com | admin | Admin Test |

---

## 🚀 Actions Immédiates

### **Étape 1 : Se Déconnecter**
```
1. Cliquer sur le bouton de déconnexion
2. Ou ouvrir DevTools Console :
   await supabase.auth.signOut();
```

### **Étape 2 : Vider le Cache**
```
Cmd + Shift + R (Mac)
Ctrl + Shift + R (Windows)
```

### **Étape 3 : Se Reconnecter**
```
1. Aller sur /login
2. Entrer vos identifiants
3. Le nouveau JWT contiendra role: 'admin'
```

### **Étape 4 : Tester**
```
1. Aller sur /admin/quotations
2. Vérifier que les données se chargent
3. Pas d'erreur 403
```

---

## 🛠️ Script de Débogage

Créer un fichier `debug-auth.js` dans DevTools Console :

```javascript
// Script de débogage complet
async function debugAuth() {
  console.log('=== DEBUG AUTH ===');
  
  // 1. Session actuelle
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session:', session ? 'Active' : 'Inactive');
  
  if (session) {
    // 2. Informations utilisateur
    console.log('User ID:', session.user.id);
    console.log('Email:', session.user.email);
    console.log('Metadata:', session.user.user_metadata);
    console.log('Role:', session.user.user_metadata?.role);
    
    // 3. Vérifier le rôle dans la DB
    const { data: dbUser } = await supabase
      .from('auth.users')
      .select('raw_user_meta_data')
      .eq('id', session.user.id)
      .single();
    
    console.log('DB Role:', dbUser?.raw_user_meta_data?.role);
    
    // 4. Comparer
    const jwtRole = session.user.user_metadata?.role;
    const dbRole = dbUser?.raw_user_meta_data?.role;
    
    if (jwtRole !== dbRole) {
      console.error('⚠️ MISMATCH: JWT role !== DB role');
      console.log('JWT Role:', jwtRole);
      console.log('DB Role:', dbRole);
      console.log('👉 Solution: Se déconnecter et se reconnecter');
    } else {
      console.log('✅ Roles match:', jwtRole);
    }
  }
}

// Exécuter
await debugAuth();
```

---

## ✅ Checklist

### **Avant Reconnexion**
- [ ] Rôle 'admin' ajouté dans la base de données
- [ ] Politiques RLS créées pour les admins
- [ ] Migrations appliquées

### **Reconnexion**
- [ ] Déconnexion effectuée
- [ ] Cache vidé
- [ ] Reconnexion avec identifiants
- [ ] Nouveau JWT généré

### **Vérification**
- [ ] Token JWT contient role: 'admin'
- [ ] Page /admin/quotations accessible
- [ ] Données chargées sans erreur 403
- [ ] Statistiques affichées
- [ ] Boutons fonctionnels

---

## 🎯 Résultat Final

**Après reconnexion** :

```
✅ Token JWT rafraîchi
✅ Rôle 'admin' présent dans le token
✅ Politiques RLS satisfaites
✅ Requêtes autorisées
✅ Page /admin/quotations fonctionnelle
```

---

## 📝 Note Importante

**Les métadonnées utilisateur sont stockées dans le JWT au moment de la connexion.**

Toute modification des métadonnées (comme l'ajout d'un rôle) nécessite :
1. Une déconnexion
2. Une reconnexion
3. Ou un rafraîchissement manuel du token

C'est un comportement normal de Supabase Auth pour des raisons de sécurité et de performance.
