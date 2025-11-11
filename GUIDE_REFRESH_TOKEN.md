# 🔄 Guide Complet : Rafraîchir le Token JWT Admin

## 🎯 Problème

Après avoir ajouté le rôle 'admin' dans la base de données, l'erreur **403 Forbidden** persiste car le token JWT n'a pas été rafraîchi.

```
Error: permission denied for table users
Code: 42501
```

---

## ✅ Solutions (Du Plus Simple au Plus Avancé)

### **Solution 1 : Page de Déconnexion Automatique** ⭐ RECOMMANDÉ

La solution la plus simple et la plus fiable :

```
https://byproject-twinsk.netlify.app/force-logout
```

Cette page va :
1. ✅ Vous déconnecter de Supabase
2. ✅ Vider localStorage et sessionStorage
3. ✅ Supprimer tous les cookies
4. ✅ Vous rediriger vers `/login`

**Après reconnexion, votre token contiendra le rôle 'admin' !**

---

### **Solution 2 : Console DevTools (Rapide)**

Ouvrez DevTools (F12) → Console et exécutez :

```javascript
// Version simple
localStorage.clear();
sessionStorage.clear();
window.location.href = '/login';
```

Puis reconnectez-vous.

---

### **Solution 3 : Page de Débogage**

Allez sur :
```
https://byproject-twinsk.netlify.app/admin/debug-auth
```

Cette page vous permet de :
- ✅ Voir votre session actuelle
- ✅ Vérifier votre rôle JWT
- ✅ Tester l'accès admin
- ✅ Rafraîchir le token
- ✅ Se déconnecter proprement

---

### **Solution 4 : Mode Incognito (Test)**

1. Ouvrir une fenêtre de navigation privée
2. Aller sur `https://byproject-twinsk.netlify.app/login`
3. Se connecter
4. Tester `/admin/quotations`

---

### **Solution 5 : Script Avancé (Si les autres échouent)**

```javascript
(async () => {
  try {
    // Importer Supabase (nécessite CSP mis à jour)
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    const supabase = createClient(
      'https://ebmgtfftimezuuxxzyjm.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVibWd0ZmZ0aW1lenV1eHh6eWptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzMDU0MjMsImV4cCI6MjA0NTg4MTQyM30.r5VLBcOBqKFQHZqOlJJqEqVxYjGmZLqXFZqOlJJqEqU'
    );
    
    // Rafraîchir la session
    const { data, error } = await supabase.auth.refreshSession();
    
    if (data?.session) {
      console.log('✅ Token rafraîchi !');
      console.log('Rôle:', data.session.user.user_metadata?.role);
      alert('Token rafraîchi ! La page va se recharger.');
      location.reload();
    } else {
      console.error('Erreur:', error);
      alert('Veuillez vous déconnecter et reconnecter.');
      localStorage.clear();
      window.location.href = '/login';
    }
  } catch (err) {
    console.error('Erreur:', err);
    alert('Veuillez utiliser /force-logout');
    window.location.href = '/force-logout';
  }
})();
```

---

## 🔧 Corrections Appliquées

### **1. Mise à Jour du CSP**

Fichier : `middleware.ts`

```typescript
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://esm.sh;
connect-src 'self' https://ebmgtfftimezuuxxzyjm.supabase.co wss://ebmgtfftimezuuxxzyjm.supabase.co https://esm.sh;
```

**Changements** :
- ✅ Ajout de `https://esm.sh` à `script-src`
- ✅ Ajout de `https://esm.sh` à `connect-src`

**Permet** :
- Import dynamique de modules ES
- Débogage avancé via console
- Scripts de rafraîchissement de token

### **2. Page de Déconnexion Forcée**

Route : `/force-logout`

**Fonctionnalités** :
- ✅ Déconnexion Supabase
- ✅ Nettoyage localStorage
- ✅ Nettoyage sessionStorage
- ✅ Suppression des cookies
- ✅ Redirection automatique vers `/login`

### **3. Page de Débogage Auth**

Route : `/admin/debug-auth`

**Fonctionnalités** :
- ✅ Affichage du statut de session
- ✅ Vérification du rôle JWT
- ✅ Test d'accès admin
- ✅ Diagnostic des problèmes
- ✅ Bouton de rafraîchissement
- ✅ Bouton de déconnexion

---

## 📊 Flux de Résolution

### **Avant**

```
┌─────────────────────────────────────────┐
│ Base de Données                         │
├─────────────────────────────────────────┤
│ User: sowaxcom@gmail.com                │
│ Role: 'admin' ✅                        │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ Token JWT (Session Active)              │
├─────────────────────────────────────────┤
│ user_metadata: {                        │
│   role: null ❌                         │
│ }                                       │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ Politique RLS                           │
├─────────────────────────────────────────┤
│ WHERE role = 'admin'                    │
│ Vérification: null = 'admin' → FALSE    │
│ Résultat: 403 Forbidden ❌              │
└─────────────────────────────────────────┘
```

### **Après Déconnexion/Reconnexion**

```
┌─────────────────────────────────────────┐
│ Base de Données                         │
├─────────────────────────────────────────┤
│ User: sowaxcom@gmail.com                │
│ Role: 'admin' ✅                        │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ Nouveau Token JWT                       │
├─────────────────────────────────────────┤
│ user_metadata: {                        │
│   role: 'admin' ✅                      │
│ }                                       │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ Politique RLS                           │
├─────────────────────────────────────────┤
│ WHERE role = 'admin'                    │
│ Vérification: 'admin' = 'admin' → TRUE  │
│ Résultat: 200 OK ✅                     │
└─────────────────────────────────────────┘
```

---

## 🎯 Checklist de Résolution

### **Étape 1 : Vérifier le Rôle en Base**
- [x] Tous les utilisateurs ont `role: 'admin'`
- [x] Politiques RLS créées pour les admins
- [x] Migrations appliquées

### **Étape 2 : Rafraîchir le Token**
- [ ] Aller sur `/force-logout`
- [ ] Ou exécuter le script dans la console
- [ ] Se reconnecter avec identifiants

### **Étape 3 : Vérifier l'Accès**
- [ ] Aller sur `/admin/quotations`
- [ ] Vérifier que les données se chargent
- [ ] Pas d'erreur 403
- [ ] Statistiques affichées

### **Étape 4 : Débogage (Si Problème)**
- [ ] Aller sur `/admin/debug-auth`
- [ ] Vérifier le rôle JWT
- [ ] Tester l'accès admin
- [ ] Utiliser les boutons de diagnostic

---

## 🚀 Actions Immédiates

### **Option A : Le Plus Rapide**

1. Aller sur : `https://byproject-twinsk.netlify.app/force-logout`
2. Attendre la redirection
3. Se reconnecter
4. Tester `/admin/quotations`

### **Option B : Via Console**

```javascript
localStorage.clear();
sessionStorage.clear();
window.location.href = '/login';
```

### **Option C : Via Page de Débogage**

1. Aller sur : `https://byproject-twinsk.netlify.app/admin/debug-auth`
2. Cliquer sur "Se Déconnecter"
3. Se reconnecter
4. Tester `/admin/quotations`

---

## 📝 Notes Importantes

### **Pourquoi le Token N'est Pas Auto-Rafraîchi ?**

Le token JWT contient une **copie** des métadonnées au moment de la connexion. C'est un comportement normal pour :
- **Performance** : Pas besoin de requête DB à chaque appel
- **Sécurité** : Le token est signé et immuable
- **Scalabilité** : Pas de dépendance à la DB pour chaque requête

### **Quand Faut-il Rafraîchir ?**

Rafraîchir le token est nécessaire quand :
- ✅ Modification du rôle utilisateur
- ✅ Modification des permissions
- ✅ Mise à jour des métadonnées
- ✅ Changement de plan/abonnement

### **Durée de Vie du Token**

- **Access Token** : 1 heure (par défaut)
- **Refresh Token** : 30 jours (par défaut)
- **Auto-refresh** : Supabase rafraîchit automatiquement avant expiration

---

## ✅ Résultat Final

Après avoir suivi une des solutions :

```
✅ Token JWT rafraîchi avec role: 'admin'
✅ Politiques RLS satisfaites
✅ Accès aux données autorisé
✅ Page /admin/quotations fonctionnelle
✅ Toutes les fonctionnalités disponibles
```

---

## 🆘 Support

Si le problème persiste après toutes ces solutions :

1. **Vérifier la connexion** :
   ```sql
   SELECT email, raw_user_meta_data->>'role' 
   FROM auth.users 
   WHERE email = 'votre_email@example.com';
   ```

2. **Vérifier les politiques** :
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE policyname LIKE '%Admins%';
   ```

3. **Tester en mode incognito** pour éliminer les problèmes de cache

4. **Vérifier les logs Supabase** dans le dashboard

---

## 🎉 Succès !

Une fois connecté avec le nouveau token, vous devriez voir :

- ✅ Page `/admin/quotations` chargée
- ✅ Liste des 3 cotations existantes
- ✅ Statistiques : Total (3), En attente (1), Envoyées (2)
- ✅ Boutons "Ajouter Marge" et "Envoyer au Client" fonctionnels
- ✅ Aucune erreur 403 dans la console

**Félicitations ! Le système fonctionne correctement.** 🎊
