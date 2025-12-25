# Instructions de Migration - Support des Images pour Matériaux et Prix

## Problèmes Résolus

### 1. ✅ Problème de Scroll sur Desktop
- Les formulaires d'ajout de matériau (`EditMaterialModal`) et d'ajout de prix (`PriceModal`) ont été corrigés
- Utilisation d'un layout flexbox pour garantir que le contenu défile correctement avec un header et footer fixes

### 2. ✅ Support des Images pour Matériaux et Prix
- Les images peuvent maintenant être téléchargées lors de l'édition d'un matériau
- Les images peuvent être téléchargées lors de l'ajout d'un prix
- Les images sont stockées dans la table `photos` avec un type approprié

## Modifications Apportées

### Base de Données
- **Migration créée**: `supabase/migrations/20251118_add_price_photos_support.sql`
  - Ajout de la colonne `price_id` à la table `photos`
  - Ajout de la colonne `photo_type` ('material' ou 'price')
  - Mise à jour des politiques RLS pour supporter les deux types de photos

### Code
1. **EditMaterialModal** (`components/supplier/EditMaterialModal.tsx`)
   - Layout flexbox pour le scroll
   - Sauvegarde des images du matériau dans la table `photos`

2. **PriceModal** (`components/supplier/PriceModal.tsx`)
   - Layout flexbox pour le scroll
   - Sauvegarde des images de prix dans la table `photos`

3. **Page Supplier Quote** (`app/supplier-quote/[token]/page.tsx`)
   - Chargement des images des matériaux
   - Chargement des images des prix
   - Affichage des images dans l'interface

## Étapes à Suivre

### ✅ 1. Migration Exécutée
La migration a été appliquée avec succès via le MCP Supabase :
- Colonnes `price_id` et `photo_type` ajoutées à la table `photos`
- Contraintes et index créés
- Politiques RLS mises à jour

### ✅ 2. Types TypeScript Régénérés
Les types TypeScript ont été régénérés et mis à jour dans `lib/supabase/database.types.ts`
La table `photos` est maintenant incluse avec les nouvelles colonnes.

### 3. Améliorations Apportées
**Conservation des Photos** : Les anciennes photos sont maintenant conservées lors de l'édition d'un matériau. Seules les nouvelles photos sont ajoutées.

## Structure de la Table Photos

```sql
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  price_id INTEGER REFERENCES prices(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  photo_type TEXT CHECK (photo_type IN ('material', 'price')) DEFAULT 'material',
  uploaded_at TIMESTAMP DEFAULT now(),
  
  -- Une photo appartient soit à un matériau, soit à un prix
  CONSTRAINT photos_belongs_to_material_or_price
    CHECK (
      (material_id IS NOT NULL AND price_id IS NULL) OR
      (material_id IS NULL AND price_id IS NOT NULL)
    )
);
```

## Vérification

### Tester le Scroll
1. Ouvrir un formulaire d'ajout de matériau sur desktop
2. Vérifier que le contenu défile correctement
3. Le header et footer doivent rester fixes

### Tester les Images
1. **Images de Matériau**:
   - Éditer un matériau
   - Télécharger des images via le composant SupplierImageUpload
   - Sauvegarder
   - Vérifier que les images sont bien stockées dans la table `photos` avec `photo_type = 'material'`

2. **Images de Prix**:
   - Ajouter un prix à un matériau
   - Télécharger des images de produit
   - Sauvegarder
   - Vérifier que les images sont bien stockées dans la table `photos` avec `photo_type = 'price'`

3. **Affichage**:
   - Les images doivent s'afficher correctement dans l'interface
   - Les images des matériaux et des prix doivent être visibles à leurs emplacements respectifs

## Notes Importantes

- ⚠️ **Erreurs TypeScript actuelles** : Les erreurs de type sont normales avant l'exécution de la migration et la régénération des types
- 🔒 **RLS Policies** : Les politiques de sécurité Row Level Security ont été mises à jour pour supporter les deux types de photos
- 📦 **Bucket Supabase** : Assurez-vous que le bucket `project-materials` existe et est configuré correctement dans Supabase Storage

## Questions?

Si vous rencontrez des problèmes:
1. Vérifiez que la migration a bien été appliquée
2. Vérifiez que les types ont été régénérés
3. Vérifiez que le bucket Supabase Storage est correctement configuré
4. Vérifiez les logs de la console pour les erreurs
