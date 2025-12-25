# Refonte Page Fournisseur - Design Liste Matériaux

## 🎯 Objectif
Faire ressembler la page fournisseur à la liste des matériaux du projet dashboard.

## 📋 Spécifications

### Design de Carte Matériau
```
┌────────────────────────────────────────────────────────────┐
│ [IMG]  Nom du Matériau                    [💬] [$] [✏️]   │
│        Description courte                                   │
│        [Badge Catégorie]  [Badge Quantité]                 │
└────────────────────────────────────────────────────────────┘
```

### Icônes d'Action
- **💬 Description** : Ouvrir modal description (read-only images client + texte)
- **$ Prix** : Ouvrir modal ajout prix (fournisseur, pays, contact, montant, devise, notes, shipping, images fournisseur)
- **✏️ Éditer** : Ouvrir modal édition complète (nom, description, catégorie, quantité, surface, poids, volume, images fournisseur)
- **❌ PAS de suppression**

### Modals

#### 1. Modal Description
- Titre matériau (traduit)
- Description (traduite)
- Images client (galerie read-only)
- Quantité, surface, poids, volume
- Bouton "Fermer"

#### 2. Modal Prix
- Pays *
- Fournisseur (nouveau/existant)
  - Nom fournisseur
  - Nom contact
  - Téléphone / WhatsApp
  - Email / WeChat
- Montant *
- Devise
- Notes (MOQ, délais, conditions)
- Colisage & Logistique
  - Longueur, Largeur, Hauteur (cm)
  - Poids unitaire (kg)
  - Unités par colis
- Photos du Produit (upload fournisseur)
- Boutons "Annuler" / "Ajouter"

#### 3. Modal Édition
- Nom *
- Description
- Catégorie
- Quantité / Surface
- Poids / Volume
- Images (upload fournisseur)
- Boutons "Annuler" / "Enregistrer"

### Traductions
Tous les labels, placeholders et messages doivent être traduits en :
- 🇫🇷 Français
- 🇬🇧 English
- 🇨🇳 中文

### Synchronisation Supabase
- Créer/mettre à jour les prix dans `prices` table
- Créer/mettre à jour les fournisseurs dans `suppliers` table
- Mettre à jour les matériaux si édités
- Uploader les images dans `project-materials` bucket
- Tout via MCP Supabase

## 🏗️ Structure de Données

### Material (étendu)
```typescript
interface Material {
  id: string;
  name: string;
  translatedName?: string;
  description: string | null;
  category: string | null;
  quantity: number | null;
  surface: number | null;
  weight: number | null;
  volume: number | null;
  images: string[]; // Images client
  supplierImages?: string[]; // Images fournisseur
  prices?: Price[];
}
```

### Price
```typescript
interface Price {
  id: string;
  material_id: string;
  supplier_id: string;
  country: string;
  unit_price: number;
  currency: string;
  notes: string | null;
  shipping_length: number | null;
  shipping_width: number | null;
  shipping_height: number | null;
  shipping_weight: number | null;
  units_per_package: number | null;
  product_images: string[];
}
```

### Supplier
```typescript
interface Supplier {
  id: string;
  name: string;
  contact_name: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  wechat: string | null;
  country: string;
}
```

## 🎨 Composants à Créer
1. ✅ `SupplierImageUpload` - Upload images fournisseur
2. ⏳ `MaterialCard` - Carte matériau avec icônes
3. ⏳ `DescriptionModal` - Modal description
4. ⏳ `PriceModal` - Modal ajout prix
5. ⏳ `EditMaterialModal` - Modal édition

## 📝 Fichiers à Modifier
1. `/app/supplier-quote/[token]/page.tsx` - Page principale
2. `/components/supplier/SupplierImageUpload.tsx` - ✅ Créé
3. Créer nouveaux composants dans `/components/supplier/`

## 🔄 Workflow
1. User ouvre page fournisseur
2. Voit liste matériaux (design projet)
3. Click 💬 → Voir description + images client
4. Click $ → Ajouter prix + infos fournisseur + images produit
5. Click ✏️ → Éditer matériau + ajouter images fournisseur
6. Tout sauvegardé en temps réel dans Supabase
7. Traductions automatiques EN/ZH
