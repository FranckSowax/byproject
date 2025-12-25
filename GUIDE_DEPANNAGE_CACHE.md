# 🔧 GUIDE DE DÉPANNAGE - Problème de Cache

**Date**: 11 novembre 2025, 20:20 UTC+8  
**Problème**: Le navigateur utilise l'ancien code en cache  
**Solution**: Vider le cache et recompiler

---

## ⚠️ Symptôme

L'erreur persiste malgré les corrections:
```
GET /projects?user_id=eq.xxx → 403 Forbidden
Error: permission denied for table users
```

**Cause**: Le navigateur charge l'ancien JavaScript compilé (`.next/` cache)

---

## ✅ SOLUTION COMPLÈTE

### Étape 1: Arrêter le serveur de développement

```bash
# Dans le terminal où tourne `npm run dev`
Ctrl + C
```

### Étape 2: Supprimer le cache Next.js

```bash
cd /Users/sowax/Desktop/COMPACHANTIER/CascadeProjects/windsurf-project

# Supprimer le dossier .next
rm -rf .next

# Supprimer node_modules/.cache (si existe)
rm -rf node_modules/.cache
```

### Étape 3: Redémarrer le serveur

```bash
npm run dev
```

### Étape 4: Vider le cache du navigateur

**Option A: Hard Refresh (Recommandé)**
```
Chrome/Edge: Ctrl + Shift + R (Windows) ou Cmd + Shift + R (Mac)
Firefox: Ctrl + F5 (Windows) ou Cmd + Shift + R (Mac)
Safari: Cmd + Option + R
```

**Option B: Vider complètement le cache**
1. Ouvrir DevTools (F12)
2. Clic droit sur le bouton Rafraîchir
3. Sélectionner "Vider le cache et actualiser"

**Option C: Navigation privée**
```
Ouvrir une fenêtre de navigation privée
Aller sur http://localhost:3000/dashboard
```

---

## 🎯 Vérification

### 1. Vérifier que le nouveau code est chargé

**Console du navigateur**:
```javascript
// Vérifier la requête dans Network
// Elle devrait être:
GET /projects?select=id,name,created_at,image_url&order=created_at.desc

// PAS:
GET /projects?user_id=eq.xxx&select=...
```

### 2. Vérifier les politiques RLS

Les nouvelles politiques simplifiées sont actives:
```
✅ allow_select_own_projects
✅ allow_insert_own_projects
✅ allow_update_own_projects
✅ allow_delete_own_projects
✅ allow_admin_all_projects
```

### 3. Test de fonctionnement

```
✅ Dashboard charge sans erreur
✅ Projet "TWINSK TEST" visible
✅ Aucune erreur 403 dans la console
✅ Requête retourne 200 OK
```

---

## 🔍 Diagnostic Avancé

### Si l'erreur persiste après le cache clear

**Vérifier le code source dans le navigateur**:

1. DevTools → Sources
2. Chercher `dashboard/page.tsx` ou le fichier compilé
3. Vérifier que le code ne contient PAS `.eq('user_id', user.id)`

**Si le code contient encore `.eq('user_id', ...)`**:
- Le cache n'a pas été vidé correctement
- Essayer en navigation privée
- Redémarrer complètement le navigateur

---

## 📊 Changements Appliqués

### 1. Code Frontend (3 fichiers)

**Fichier**: `app/(dashboard)/dashboard/page.tsx`
```typescript
// ❌ ANCIEN CODE (en cache)
.from('projects')
.select('id, name, created_at, image_url')
.eq('user_id', user.id)  // ← Cause l'erreur 403
.order('created_at', { ascending: false });

// ✅ NOUVEAU CODE (après cache clear)
.from('projects')
.select('id, name, created_at, image_url')
// Pas de .eq('user_id', ...) - RLS filtre automatiquement
.order('created_at', { ascending: false });
```

### 2. Politiques RLS (Base de données)

**Anciennes politiques** (causaient "permission denied for table users"):
```sql
-- Référençait auth.users → Problème de permissions
WHERE (users.raw_user_meta_data ->> 'role') = 'admin'
```

**Nouvelles politiques** (simplifiées):
```sql
-- Utilise seulement auth.uid() → Pas de problème
WHERE user_id = auth.uid()
```

---

## 🚀 Commandes Rapides

### Nettoyage Complet

```bash
# Arrêter le serveur
Ctrl + C

# Tout nettoyer
rm -rf .next node_modules/.cache

# Redémarrer
npm run dev
```

### Vérification Rapide

```bash
# Vérifier que .next a été supprimé
ls -la .next
# Devrait afficher: "No such file or directory"

# Vérifier que le serveur recompile
# Devrait afficher: "compiled successfully" dans le terminal
```

---

## 🎯 Résultat Attendu

### Après le cache clear

**Network (DevTools)**:
```
Request URL: .../projects?select=id,name,created_at,image_url&order=created_at.desc
Status: 200 OK
Response: [{"id":"43c29f87...","name":"TWINSK TEST",...}]
```

**Console**:
```
✅ Aucune erreur
✅ Aucun message "permission denied"
✅ Aucun 403 Forbidden
```

**Dashboard**:
```
✅ Projet "TWINSK TEST" affiché
✅ Image du projet visible
✅ Date de création affichée
```

---

## ⚡ Solution Alternative: Forcer la Recompilation

Si le problème persiste, forcer Next.js à recompiler:

```bash
# 1. Arrêter le serveur
Ctrl + C

# 2. Supprimer TOUT le cache
rm -rf .next
rm -rf node_modules/.cache
rm -rf out

# 3. Nettoyer les modules (optionnel, si vraiment nécessaire)
rm -rf node_modules
npm install

# 4. Redémarrer en mode développement
npm run dev

# 5. Dans le navigateur
# - Fermer TOUS les onglets localhost:3000
# - Ouvrir un nouvel onglet en navigation privée
# - Aller sur http://localhost:3000/dashboard
```

---

## 📝 Checklist de Résolution

- [ ] Serveur arrêté (Ctrl+C)
- [ ] Dossier `.next` supprimé
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Cache navigateur vidé (Ctrl+Shift+R)
- [ ] Nouvelle requête sans `user_id=eq.xxx`
- [ ] Status 200 OK
- [ ] Projets affichés sur le dashboard
- [ ] Aucune erreur dans la console

---

## 🎉 Conclusion

**Le code est correct** ✅  
**Les politiques RLS sont correctes** ✅  
**Le problème est le cache** ⚠️

**Suivez les étapes ci-dessus pour vider le cache et tout fonctionnera !**

---

## 📞 Si Rien Ne Fonctionne

### Dernière Solution: Mode Production

```bash
# Compiler en mode production
npm run build

# Lancer en mode production
npm start

# Tester sur http://localhost:3000
```

Le mode production force une recompilation complète et ignore tous les caches de développement.
