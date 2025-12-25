# ✅ Ajout du Champ "Surface (m²)" aux Matériaux

**Date** : 5 Novembre 2025, 21:59  
**Modification** : Ajout du champ "Surface (m²)" dans les modals d'ajout et d'édition de matériau  
**Impact** : Permet de saisir la surface pour les matériaux (carrelage, peinture, etc.)

---

## 🎯 Modifications Effectuées

### 1. Interface TypeScript ✅
**Fichier** : `app/(dashboard)/dashboard/projects/[id]/page.tsx`

```typescript
interface Material {
  id: string;
  name: string;
  category: string | null;
  quantity: number | null;
  surface: number | null;  // ← NOUVEAU
  weight: number | null;
  volume: number | null;
  specs: any;
}
```

### 2. État Initial ✅
```typescript
const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
  name: '',
  category: null,
  quantity: null,
  surface: null,  // ← NOUVEAU
  weight: null,
  volume: null,
  specs: {},
});
```

### 3. Modal d'Édition ✅
**Lignes** : 1325-1370

```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="grid gap-2">
    <Label htmlFor="quantity">Quantité</Label>
    <Input
      id="quantity"
      type="number"
      value={editingMaterial.quantity || ''}
      onChange={(e) => setEditingMaterial({ 
        ...editingMaterial, 
        quantity: parseFloat(e.target.value) || null 
      })}
      placeholder="0"
    />
  </div>

  <div className="grid gap-2">
    <Label htmlFor="surface">Surface (m²)</Label>  {/* ← NOUVEAU */}
    <Input
      id="surface"
      type="number"
      value={editingMaterial.surface || ''}
      onChange={(e) => setEditingMaterial({ 
        ...editingMaterial, 
        surface: parseFloat(e.target.value) || null 
      })}
      placeholder="0"
    />
  </div>
</div>

<div className="grid grid-cols-2 gap-4">
  <div className="grid gap-2">
    <Label htmlFor="weight">Poids (kg)</Label>
    {/* ... */}
  </div>

  <div className="grid gap-2">
    <Label htmlFor="volume">Volume (m³)</Label>
    {/* ... */}
  </div>
</div>
```

### 4. Modal d'Ajout ✅
**Lignes** : 1425-1470

```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="grid gap-2">
    <Label htmlFor="new-quantity">Quantité</Label>
    {/* ... */}
  </div>

  <div className="grid gap-2">
    <Label htmlFor="new-surface">Surface (m²)</Label>  {/* ← NOUVEAU */}
    <Input
      id="new-surface"
      type="number"
      value={newMaterial.surface || ''}
      onChange={(e) => setNewMaterial({ 
        ...newMaterial, 
        surface: parseFloat(e.target.value) || null 
      })}
      placeholder="0"
    />
  </div>
</div>

<div className="grid grid-cols-2 gap-4">
  <div className="grid gap-2">
    <Label htmlFor="new-weight">Poids (kg)</Label>
    {/* ... */}
  </div>

  <div className="grid gap-2">
    <Label htmlFor="new-volume">Volume (m³)</Label>
    {/* ... */}
  </div>
</div>
```

### 5. Fonction de Sauvegarde (Édition) ✅
**Lignes** : 270-281

```typescript
const { error } = await supabase
  .from('materials')
  .update({
    name: editingMaterial.name,
    category: editingMaterial.category,
    quantity: editingMaterial.quantity,
    surface: editingMaterial.surface,  // ← NOUVEAU
    weight: editingMaterial.weight,
    volume: editingMaterial.volume,
    specs: editingMaterial.specs,
  })
  .eq('id', editingMaterial.id);
```

### 6. Fonction de Sauvegarde (Ajout) ✅
**Lignes** : 452-463

```typescript
const { error } = await supabase
  .from('materials')
  .insert({
    project_id: params.id,
    name: newMaterial.name,
    category: newMaterial.category,
    quantity: newMaterial.quantity,
    surface: newMaterial.surface,  // ← NOUVEAU
    weight: newMaterial.weight,
    volume: newMaterial.volume,
    specs: newMaterial.specs || {},
  });
```

### 7. Réinitialisation des États ✅
**3 endroits** : Lignes 432-439, 469-477, 1485-1493

```typescript
setNewMaterial({
  name: '',
  category: null,
  quantity: null,
  surface: null,  // ← NOUVEAU
  weight: null,
  volume: null,
  specs: {},
});
```

---

## 📊 Layout des Modals

### Avant (3 colonnes)
```
┌─────────────────────────────────────────┐
│  Quantité  │  Poids (kg)  │  Volume (m³) │
└─────────────────────────────────────────┘
```

### Après (2×2 grille)
```
┌─────────────────────────────────────────┐
│  Quantité       │  Surface (m²)         │
├─────────────────────────────────────────┤
│  Poids (kg)     │  Volume (m³)          │
└─────────────────────────────────────────┘
```

**Avantages** :
- ✅ Meilleure lisibilité (2 colonnes au lieu de 3)
- ✅ Plus d'espace pour chaque champ
- ✅ Responsive friendly
- ✅ Organisation logique (quantité/surface puis poids/volume)

---

## 🗄️ Migration Base de Données Requise

### ⚠️ IMPORTANT : Ajouter la Colonne dans Supabase

La colonne `surface` doit être ajoutée à la table `materials` dans Supabase :

```sql
-- Migration : Ajout colonne surface
ALTER TABLE materials 
ADD COLUMN surface NUMERIC;

-- Commentaire
COMMENT ON COLUMN materials.surface IS 'Surface en mètres carrés (m²)';
```

**Ou via l'interface Supabase** :
1. Aller dans Table Editor
2. Sélectionner la table `materials`
3. Cliquer sur "Add Column"
4. Nom : `surface`
5. Type : `numeric` ou `float8`
6. Nullable : ✅ Oui
7. Default : `null`

---

## 🎯 Cas d'Usage

### Matériaux avec Surface
- **Carrelage** : 150 m²
- **Peinture** : 200 m²
- **Revêtement de sol** : 80 m²
- **Plafond** : 120 m²
- **Murs** : 300 m²

### Matériaux sans Surface
- **Ciment** : Quantité en sacs
- **Fer à béton** : Poids en kg
- **Portes** : Quantité en unités
- **Fenêtres** : Quantité en unités

---

## 📝 Exemple d'Utilisation

### Ajout d'un Matériau
```
Nom : Carrelage 60×60
Catégorie : Revêtement
Quantité : 150
Surface : 150 m²  ← NOUVEAU CHAMP
Poids : 15 kg/m²
Volume : 0.0036 m³/unité
```

### Édition d'un Matériau
```
Nom : Peinture murale
Catégorie : Finition
Quantité : 20 (pots)
Surface : 200 m²  ← NOUVEAU CHAMP
Poids : 15 kg/pot
Volume : 0.015 m³/pot
```

---

## ✅ Checklist de Vérification

### Code Frontend
- [x] Interface `Material` mise à jour
- [x] État `newMaterial` mis à jour
- [x] Modal d'édition avec champ surface
- [x] Modal d'ajout avec champ surface
- [x] Fonction `handleSaveMaterial` mise à jour
- [x] Fonction `handleSaveNewMaterial` mise à jour
- [x] Fonction `handleAddMaterial` mise à jour
- [x] Boutons "Annuler" mis à jour
- [x] Layout 2×2 grille implémenté

### Base de Données
- [ ] Colonne `surface` ajoutée à la table `materials`
- [ ] Migration SQL exécutée
- [ ] Type de données : `numeric` ou `float8`
- [ ] Nullable : Oui
- [ ] Default : null

### Tests
- [ ] Ajouter un matériau avec surface
- [ ] Ajouter un matériau sans surface
- [ ] Éditer un matériau existant
- [ ] Vérifier que la surface est sauvegardée
- [ ] Vérifier l'affichage dans la liste

---

## 🚀 Prochaines Étapes

### 1. Migration Base de Données ⚠️
```bash
# Se connecter à Supabase
# Aller dans SQL Editor
# Exécuter la migration
ALTER TABLE materials ADD COLUMN surface NUMERIC;
```

### 2. Test de l'Interface
- Ouvrir un projet
- Cliquer sur "Ajouter un matériau"
- Vérifier que le champ "Surface (m²)" est présent
- Remplir et sauvegarder
- Vérifier que la valeur est enregistrée

### 3. Affichage dans la Liste (Optionnel)
Ajouter l'affichage de la surface dans la liste des matériaux :

```tsx
{material.surface && (
  <span className="text-sm text-gray-600">
    📐 {material.surface} m²
  </span>
)}
```

---

## 📊 Résumé des Changements

| Élément | Avant | Après |
|---------|-------|-------|
| **Champs** | 4 (quantité, poids, volume, specs) | 5 (+ surface) |
| **Layout** | 3 colonnes | 2×2 grille |
| **Interface** | Material sans surface | Material avec surface |
| **Fonctions** | 6 fonctions | 6 fonctions (toutes mises à jour) |
| **Lignes modifiées** | 0 | ~50 lignes |

---

## 🎨 Capture d'Écran du Résultat

### Modal d'Ajout
```
┌─────────────────────────────────────────────┐
│  Ajouter un matériau                        │
│  Ajoutez un nouveau matériau à votre projet │
├─────────────────────────────────────────────┤
│                                             │
│  Nom *                                      │
│  [Nom du matériau                        ]  │
│                                             │
│  Catégorie                                  │
│  [Ex: Matériaux de base, Ferraillage...  ]  │
│                                             │
│  ┌────────────────┬────────────────────┐   │
│  │ Quantité       │ Surface (m²)       │   │
│  │ [0          ]  │ [0              ]  │   │
│  └────────────────┴────────────────────┘   │
│                                             │
│  ┌────────────────┬────────────────────┐   │
│  │ Poids (kg)     │ Volume (m³)        │   │
│  │ [0          ]  │ [0              ]  │   │
│  └────────────────┴────────────────────┘   │
│                                             │
│                    [Annuler]  [Ajouter]    │
└─────────────────────────────────────────────┘
```

---

**Statut** : ✅ Code Frontend Complet

**Requis** : ⚠️ Migration SQL à exécuter dans Supabase

**Impact** : Permet de gérer les matériaux avec une dimension surface (carrelage, peinture, etc.)
