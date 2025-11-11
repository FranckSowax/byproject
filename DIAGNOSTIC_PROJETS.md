# 🔍 DIAGNOSTIC COMPLET - Projets "Disparus"

**Date**: 11 novembre 2025, 20:01 UTC+8  
**Statut**: ✅ **AUCUN PROJET N'A DISPARU**

---

## 📊 État Actuel de la Base de Données

### ✅ Projets Présents (2 projets)

| ID | Nom | Propriétaire | Email | Créé le | Matériaux |
|---|---|---|---|---|---|
| `4b905a42-8b8a-45f2-9aed-15b0737741b4` | **Mission SNI / Chine / NOV 2025** | `dd781b7f-d475-4f30-b501-0a96862c31b1` | ompayijunior@gmail.com | 3 nov 2025 | 18 |
| `43c29f87-d657-4991-8563-341372d5dcc4` | **TWINSK TEST** | `6cc5a262-0099-4f67-bae4-5233179239fd` | sowaxcom@gmail.com | 1 nov 2025 | 26 |

### 📈 Statistiques Globales

- **Total projets**: 2
- **Total matériaux**: 44
- **Total utilisateurs**: 3
  - admin@compachantier.com (admin)
  - sowaxcom@gmail.com (utilisateur)
  - ompayijunior@gmail.com (utilisateur)

### 📝 Historique des Actions

**Aucune suppression de projet détectée** dans l'historique.

Actions récentes sur les matériaux:
- 38 insertions
- 12 mises à jour
- 4 suppressions (matériaux uniquement, pas de projets)

---

## 🔐 Politiques RLS (Row Level Security)

La table `projects` a les politiques suivantes:

### Politiques Utilisateurs
1. ✅ **Users can view their own projects** - `auth.uid() = user_id`
2. ✅ **Users can create their own projects** - `auth.uid() = user_id`
3. ✅ **Users can update their own projects** - `auth.uid() = user_id`
4. ✅ **Users can delete their own projects** - `auth.uid() = user_id`

### Politiques Admin
5. ✅ **Admins can view all projects** - Vérifie `user_metadata.role = 'admin'`
6. ✅ **Admins can update all projects**
7. ✅ **Admins can delete all projects**

---

## 🐛 Cause Probable du Problème

### Hypothèse #1: Utilisateur Connecté Différent ⚠️

Le dashboard affiche uniquement les projets de l'utilisateur connecté:

```typescript
// app/(dashboard)/dashboard/page.tsx ligne 49-53
const { data, error } = await supabase
  .from('projects')
  .select('id, name, created_at, image_url')
  .eq('user_id', user.id)  // ← Filtre par user_id
  .order('created_at', { ascending: false });
```

**Si vous êtes connecté avec un compte différent**, vous ne verrez pas les projets des autres utilisateurs.

### Hypothèse #2: Problème de Session

Le code vérifie d'abord un "mockUser" dans localStorage:

```typescript
// app/(dashboard)/dashboard/page.tsx ligne 40-46
const mockUser = localStorage.getItem("mockUser");
if (mockUser) {
  // Pour le mock user, on affiche un projet vide
  setProjects([]);  // ← Retourne un tableau vide !
}
```

### Hypothèse #3: Erreur Silencieuse

Le code capture les erreurs mais ne les affiche pas à l'utilisateur:

```typescript
if (error) {
  console.error("Error loading projects:", error);  // ← Seulement dans la console
} else {
  setProjects((data as unknown as Project[]) || []);
}
```

---

## 🔧 Solutions Immédiates

### Solution 1: Vérifier l'Utilisateur Connecté

1. **Ouvrir la console du navigateur** (F12)
2. **Aller sur** `/dashboard`
3. **Taper dans la console**:
```javascript
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
console.log('Utilisateur connecté:', user.email, user.id);
```

4. **Comparer avec les propriétaires**:
   - `sowaxcom@gmail.com` → Voit "TWINSK TEST"
   - `ompayijunior@gmail.com` → Voit "Mission SNI / Chine / NOV 2025"
   - Autre compte → Ne voit rien

### Solution 2: Vérifier le localStorage

1. **Console du navigateur** (F12)
2. **Application** → **Local Storage**
3. **Chercher** `mockUser`
4. **Si présent**: Le supprimer et rafraîchir la page

### Solution 3: Vérifier les Erreurs Console

1. **Ouvrir la console** (F12)
2. **Rafraîchir** `/dashboard`
3. **Chercher** des erreurs rouges
4. **Copier** le message d'erreur complet

### Solution 4: Mode Admin (Voir TOUS les Projets)

Aller sur la page admin:
```
https://byproject-twinsk.netlify.app/admin/projects
```

Cette page affiche **tous** les projets, pas seulement ceux de l'utilisateur connecté.

---

## 🚨 Problèmes de Sécurité Détectés

### ⚠️ ERREUR CRITIQUE: RLS utilise `user_metadata`

Les politiques RLS utilisent `user_metadata.role` pour identifier les admins:

```sql
-- DANGEREUX: user_metadata est modifiable par l'utilisateur !
WHERE (users.raw_user_meta_data ->> 'role'::text) = 'admin'::text
```

**Impact**: Un utilisateur peut s'auto-promouvoir admin en modifiant ses métadonnées.

**Tables affectées**:
- `system_settings` (3 politiques)
- `exchange_rates` (3 politiques)
- `project_collaborators` (1 politique)

**Solution recommandée**: Utiliser une table `user_roles` séparée.

### ⚠️ AVERTISSEMENT: Functions sans search_path

23 fonctions n'ont pas de `search_path` défini, ce qui peut causer des problèmes de sécurité.

### ⚠️ Protection des mots de passe désactivée

La protection contre les mots de passe compromis (HaveIBeenPwned) est désactivée.

---

## 📋 Actions à Effectuer MAINTENANT

### Étape 1: Identifier le Problème (2 min)

```bash
# Dans la console du navigateur sur /dashboard
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
console.log('User:', user.email, user.id);
console.log('MockUser:', localStorage.getItem('mockUser'));
```

### Étape 2: Tester en Mode Admin (1 min)

Aller sur: `https://byproject-twinsk.netlify.app/admin/projects`

Si vous voyez les 2 projets → Le problème est lié à l'utilisateur connecté.

### Étape 3: Vérifier les Logs (1 min)

```bash
# Dans la console du navigateur
# Rafraîchir /dashboard et chercher des erreurs
```

---

## 🎯 Résultat Attendu

Après avoir identifié le problème:

### Si c'est un problème d'utilisateur:
- ✅ Se connecter avec le bon compte
- ✅ Ou utiliser la page admin pour voir tous les projets

### Si c'est un problème de mockUser:
- ✅ Supprimer `mockUser` du localStorage
- ✅ Rafraîchir la page

### Si c'est une erreur technique:
- ✅ Copier l'erreur de la console
- ✅ Partager pour investigation

---

## 📞 Prochaines Étapes

**Que faire maintenant?**

1. Exécutez les commandes de l'Étape 1
2. Partagez les résultats
3. Je vous guiderai vers la solution exacte

**Questions à répondre:**
- Quel utilisateur est connecté?
- Y a-t-il un `mockUser` dans localStorage?
- Y a-t-il des erreurs dans la console?
- Voyez-vous les projets sur `/admin/projects`?

---

## ✅ Conclusion

**VOS PROJETS SONT BIEN LÀ !** 🎉

Les 2 projets existent dans la base de données avec tous leurs matériaux.
Le problème est probablement lié à:
- L'utilisateur connecté
- Le localStorage (mockUser)
- Une erreur de chargement silencieuse

**Suivez les étapes ci-dessus pour identifier la cause exacte.**
