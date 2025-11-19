# Système de Filtrage Dynamique des Matériaux

## Vue d'ensemble

Un système de filtrage et recherche avancé pour les matériaux dans les projets et templates, permettant de trouver rapidement un matériau pour éditer ou ajouter un prix.

## Fonctionnalités

### 🔍 Recherche en Temps Réel
- Recherche instantanée dans les noms, descriptions et catégories
- Affichage du nombre de résultats trouvés
- Effacement rapide de la recherche

### 🏷️ Filtres par Catégorie
- Détection automatique des catégories présentes
- Filtrage multiple (plusieurs catégories simultanément)
- Compteur de matériaux par catégorie
- Interface intuitive avec checkboxes

### 📊 Tri Multi-Critères
- **Par date**: Plus récent / Plus ancien
- **Par nom**: A-Z / Z-A
- **Par quantité**: Plus élevée / Plus faible
- **Par prix**: Plus cher / Moins cher (projets uniquement)

### 🎯 Affichage des Filtres Actifs
- Badges pour chaque filtre actif
- Suppression rapide d'un filtre spécifique
- Bouton "Tout effacer" global
- Compteur de filtres actifs

## Architecture

### Composant Principal

**`components/materials/MaterialsFilter.tsx`**

```typescript
interface MaterialsFilterProps {
  materials: any[];              // Liste complète des matériaux
  onFilteredChange: (filtered: any[]) => void;  // Callback avec matériaux filtrés
  showPriceSort?: boolean;       // Afficher tri par prix (défaut: false)
}
```

### Options de Tri

```typescript
type SortOption = 
  | 'name-asc'       // Nom A-Z
  | 'name-desc'      // Nom Z-A
  | 'date-newest'    // Plus récent (défaut)
  | 'date-oldest'    // Plus ancien
  | 'quantity-high'  // Quantité décroissante
  | 'quantity-low'   // Quantité croissante
  | 'price-high'     // Prix décroissant
  | 'price-low';     // Prix croissant
```

## Intégrations

### 1. Page Projet Principal

**Fichier**: `app/(dashboard)/dashboard/projects/[id]/page.tsx`

```tsx
// État
const [materials, setMaterials] = useState<Material[]>([]);
const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);

// Composant
<MaterialsFilter 
  materials={materials}
  onFilteredChange={setFilteredMaterials}
  showPriceSort={true}  // Tri par prix activé
/>

// Affichage
{filteredMaterials.map((material) => (
  // Rendu du matériau
))}
```

### 2. Page Création Template

**Fichier**: `app/(dashboard)/dashboard/templates/create/page.tsx`

```tsx
// État
const [materials, setMaterials] = useState<Material[]>([]);
const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);

// Composant
<MaterialsFilter 
  materials={materials}
  onFilteredChange={setFilteredMaterials}
  showPriceSort={false}  // Pas de prix dans templates
/>

// Affichage
{filteredMaterials.map((material, index) => (
  // Rendu du matériau
))}
```

## Algorithme de Filtrage

```
1. Recherche textuelle (si query)
   ↓
2. Filtre par catégories (si sélectionnées)
   ↓
3. Tri selon l'option choisie
   ↓
4. Retour des matériaux filtrés
```

### Détails du Tri par Prix

```typescript
// Prix le plus élevé
const prices = material.prices.map(p => parseFloat(p.amount));
const maxPrice = Math.max(...prices);
// Tri décroissant par maxPrice

// Prix le plus bas
const prices = material.prices.map(p => parseFloat(p.amount));
const minPrice = Math.min(...prices);
// Tri croissant par minPrice
```

## Interface Utilisateur

### Barre de Recherche
```
┌─────────────────────────────────────┐
│ 🔍 Rechercher un matériau...    ✕  │
└─────────────────────────────────────┘
```

### Sélecteur de Tri
```
┌─────────────────────┐
│ ⚙️  Plus récent    │
│                     │
│ • Plus récent       │
│ • Plus ancien       │
│ • Nom (A-Z)        │
│ • Nom (Z-A)        │
│ • Quantité ↓       │
│ • Quantité ↑       │
│ • Prix ↓           │
│ • Prix ↑           │
└─────────────────────┘
```

### Popover Filtres Catégories
```
┌─────────────────────────────────┐
│ Catégories      [Tout effacer]  │
│                                  │
│ ☑ Maçonnerie (45)              │
│ ☐ Électricité (23)             │
│ ☐ Plomberie (18)               │
│ ☑ Peinture (12)                │
│ ☐ Menuiserie (9)               │
└─────────────────────────────────┘
```

### Filtres Actifs
```
Filtres actifs:  [Recherche: "ciment" ✕]  [Maçonnerie ✕]  [Peinture ✕]  [Tout effacer]
```

### Compteur de Résultats
```
45 matériaux sur 120
```

## Cas d'Usage

### 1. Trouver un Matériau pour Ajouter un Prix

```
1. Rechercher "ciment"
2. Filtrer catégorie "Maçonnerie"
3. Trier par "Nom A-Z"
4. Cliquer sur le matériau
5. Ajouter prix
```

### 2. Voir les Matériaux Récents

```
1. Sélectionner tri "Plus récent"
2. Les derniers ajoutés en premier
```

### 3. Identifier les Matériaux Sans Prix

```
1. Trier par "Prix ↑"
2. Les matériaux sans prix (0€) apparaissent en premier
```

### 4. Analyser les Catégories

```
1. Ouvrir filtres catégories
2. Voir le nombre de matériaux par catégorie
3. Sélectionner une catégorie spécifique
```

## Détection Automatique des Catégories

```typescript
// Extraction des catégories uniques
const categories = useMemo(() => {
  const cats = new Set<string>();
  materials.forEach(material => {
    if (material.category) {
      cats.add(material.category);
    }
  });
  return Array.from(cats).sort();
}, [materials]);
```

## Performance

### Optimisations
- **useMemo**: Cache les résultats filtrés
- **useMemo**: Cache la liste des catégories
- **Tri en place**: Pas de copies multiples
- **Recherche lowercase**: Normalisation unique

### Complexité
- Recherche: O(n) où n = nombre de matériaux
- Tri: O(n log n)
- Filtres catégories: O(n)
- **Total**: O(n log n) dans le pire cas

## Dépendances

### NPM Packages
```json
{
  "@radix-ui/react-popover": "^1.x.x"
}
```

### Composants UI
- `Input`
- `Select`
- `Badge`
- `Button`
- `Popover`
- `Checkbox`

## Accessibilité

✅ **Clavier**: Navigation complète au clavier
✅ **Labels**: Tous les champs labellisés
✅ **ARIA**: Attributs pour lecteurs d'écran
✅ **Focus**: Indicateurs visuels clairs
✅ **Contraste**: Couleurs conformes WCAG

## Mobile-First

### Responsive Design
```css
/* Mobile */
flex-col      // Colonnes empilées
gap-3         // Espacement réduit

/* Desktop (sm:) */
flex-row      // Disposition horizontale
gap-4         // Espacement normal
```

### Touch-Friendly
- Zones de clic généreuses (min 44x44px)
- Boutons et checkboxes adaptés tactile
- Popover positionné intelligemment

## Personnalisation

### Désactiver le Tri par Prix

```tsx
<MaterialsFilter 
  materials={materials}
  onFilteredChange={setFilteredMaterials}
  showPriceSort={false}  // Masquer options prix
/>
```

### Ajouter des Options de Tri

```typescript
// Dans MaterialsFilter.tsx
case 'volume-high':
  return (b.volume || 0) - (a.volume || 0);
case 'weight-high':
  return (b.weight || 0) - (a.weight || 0);
```

## État Futur

### Améliorations Prévues

- [ ] Sauvegarde des filtres par utilisateur
- [ ] Filtres avancés (plages de prix, dates)
- [ ] Export des résultats filtrés
- [ ] Raccourcis clavier (Ctrl+F pour recherche)
- [ ] Vue liste / grille commutable
- [ ] Filtres par fournisseur
- [ ] Historique des recherches
- [ ] Suggestions auto-complétion

## Troubleshooting

### Aucun résultat affiché
→ Vérifier que `onFilteredChange` est bien appelé
→ S'assurer que `filteredMaterials` est utilisé pour le rendu

### Catégories manquantes
→ Vérifier que les matériaux ont le champ `category` rempli
→ Catégories détectées automatiquement si présentes

### Tri ne fonctionne pas
→ Vérifier que les champs nécessaires existent (created_at, quantity, prices)
→ Dates doivent être au format ISO

### Performance lente
→ Optimiser avec React.memo si >1000 matériaux
→ Pagination recommandée pour très grandes listes

---

**Version**: 1.0.0  
**Date**: 2025-11-19  
**Statut**: ✅ Production Ready
