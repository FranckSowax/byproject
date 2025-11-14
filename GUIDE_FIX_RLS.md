# 🔧 Guide de correction RLS pour le projet SNI

## 🎯 Problème

Vous rencontrez des erreurs 406 et 403 lors de l'accès au projet SNI :
- `Failed to load resource: the server responded with a status of 406`
- `Failed to load resource: the server responded with a status of 403`

Ces erreurs sont causées par les **Row Level Security (RLS) policies** de Supabase qui bloquent l'accès au projet.

## 💡 Solution

Vous avez **2 options** pour corriger ce problème :

### Option 1 : Policies permissives (RECOMMANDÉ) ✅

Cette option garde RLS activé mais permet l'accès complet aux utilisateurs authentifiés.

**Étapes :**

1. Ouvrez le **SQL Editor** dans votre dashboard Supabase
2. Copiez le contenu du fichier `FIX_RLS_SIMPLE.sql`
3. Exécutez le script SQL
4. Rafraîchissez la page du projet

**Avantages :**
- ✅ RLS reste activé (sécurité)
- ✅ Tous les utilisateurs authentifiés ont accès
- ✅ Facile à modifier plus tard pour restreindre l'accès

### Option 2 : Désactiver RLS temporairement (Développement uniquement) ⚠️

Cette option désactive complètement RLS. **À utiliser uniquement en développement !**

**Étapes :**

1. Ouvrez le **SQL Editor** dans votre dashboard Supabase
2. Exécutez ce script SQL :

```sql
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE prices DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE column_mappings DISABLE ROW LEVEL SECURITY;
```

3. Rafraîchissez la page du projet

**⚠️ ATTENTION :**
- ❌ Moins sécurisé
- ❌ Ne pas utiliser en production
- ❌ Tous les utilisateurs peuvent accéder à toutes les données

## 🔍 Vérification

Après avoir appliqué l'une des solutions, vérifiez que :

1. ✅ Vous pouvez accéder au projet SNI dans le dashboard
2. ✅ Les matériaux s'affichent correctement
3. ✅ Aucune erreur 406 ou 403 dans la console

## 📝 Accès au projet SNI

Une fois le correctif appliqué, vous pouvez accéder au projet via :

**URL du projet :**
```
http://localhost:3000/dashboard/projects/ecb65dd3-2d20-4b87-b65a-f44ed8b79549
```

**Informations du projet :**
- **Nom** : Projet SNI 1 maison
- **ID** : `ecb65dd3-2d20-4b87-b65a-f44ed8b79549`
- **Matériaux** : 233 matériaux importés
- **Catégories** : 
  - Électricité (56)
  - Plomberie (87)
  - Revêtement sol (9)
  - Charpente-Couverture (20)
  - Menuiserie ALU (4)
  - Menuiserie BOIS (40)
  - Peinture (17)

## 🆘 Besoin d'aide ?

Si vous rencontrez toujours des problèmes après avoir appliqué le correctif :

1. Vérifiez que vous êtes bien connecté à Supabase
2. Vérifiez que l'utilisateur existe dans la table `users`
3. Consultez les logs de Supabase pour plus de détails
4. Vérifiez que les variables d'environnement sont correctes dans `.env.local`

## 📚 Fichiers de correctif disponibles

- `FIX_RLS_SIMPLE.sql` - Policies permissives (RECOMMANDÉ)
- `FIX_RLS_SNI_PROJECT.sql` - Tentative avec auth_id (ne fonctionne pas car auth_id n'existe pas)
- `FIX_RLS_FINAL.sql` - Ancien correctif (ne fonctionne pas pour ce cas)
