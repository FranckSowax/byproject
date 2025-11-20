# Template Presentation & Supplier Management

## Vue d'ensemble

Système complet pour créer des templates professionnels avec informations de présentation et gestion des fournisseurs pour chaque matériau.

## Fonctionnalités Principales

### 📸 Section Présentation

**Visible lors du clic sur "Voir" le template**

#### 1. Description de Présentation
- Zone de texte enrichie pour description détaillée
- Affichée dans la vue détaillée du template
- Permet d'expliquer le contexte, cas d'usage, spécificités

#### 2. Galerie d'Images
- Upload jusqu'à 10 images par template
- Sélection de l'image principale (cover)
- Interface visuelle pour choisir la cover
- Support images et vidéos

**Interface de Sélection:**
```
┌────┬────┬────┬────┬────┐
│ ✓  │    │    │    │    │  ← Image principale (bordure bleue)
│ 📷 │ 📷 │ 📷 │ 📷 │ 📷 │
└────┴────┴────┴────┴────┘
Cliquez pour définir comme image principale
```

### 🏢 Gestion des Fournisseurs

**Pour chaque matériau du template**

#### Informations Fournisseur
- ✅ Nom de l'entreprise (requis)
- ✅ Contact (nom de la personne)
- ✅ Téléphone
- ✅ WhatsApp
- ✅ Email
- ✅ Adresse complète

#### Interface
- Bouton toggle "Ajouter un fournisseur"
- Formulaire dépliable avec fond bleu
- Grille organisée 2 colonnes
- Tous les champs facilement accessibles

---

## Architecture Base de Données

### Table `templates` (modifiée)

**Nouveaux champs :**
```sql
presentation_description TEXT        -- Description pour la présentation
images TEXT[]                        -- Array d'URLs d'images
main_image_index INTEGER DEFAULT 0   -- Index de l'image principale
```

### Table `template_materials` (modifiée)

**Nouveaux champs fournisseur :**
```sql
supplier_name TEXT           -- Nom du fournisseur
supplier_contact TEXT        -- Contact principal
supplier_phone TEXT          -- Téléphone
supplier_email TEXT          -- Email
supplier_whatsapp TEXT       -- WhatsApp
supplier_address TEXT        -- Adresse complète
category TEXT                -- Catégorie du matériau
```

---

## Structure de Données

### Interface Material (étendue)

```typescript
interface Material {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  category?: string;          // Nouveau
  supplier?: {                // Nouveau
    name: string;
    contact: string;
    phone: string;
    email: string;
    whatsapp?: string;
    address?: string;
  };
}
```

### État du Composant

```typescript
// Présentation
const [presentationDescription, setPresentationDescription] = useState('');
const [templateImages, setTemplateImages] = useState<string[]>([]);
const [mainImageIndex, setMainImageIndex] = useState(0);

// Fournisseur
const [showSupplierForm, setShowSupplierForm] = useState(false);
const [supplierData, setSupplierData] = useState({
  name: '',
  contact: '',
  phone: '',
  email: '',
  whatsapp: '',
  address: ''
});
```

---

## Interface Utilisateur

### 1. Section Présentation

**Localisation:** Entre "Informations du Template" et "Matériaux"

```jsx
<Card>
  <CardHeader>
    <CardTitle>
      <ImageIcon /> Présentation du Template
    </CardTitle>
    <CardDescription>
      Ces informations seront visibles quand on clique sur "Voir"
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Description */}
    <Textarea 
      placeholder="Décrivez ce template en détail..."
      rows={4}
    />
    
    {/* Images Upload */}
    <ImageUpload 
      maxImages={10}
      bucket="templates"
      path="presentation"
    />
    
    {/* Main Image Selector */}
    <div className="grid grid-cols-5 gap-2">
      {images.map((img, index) => (
        <div 
          onClick={() => setMainImageIndex(index)}
          className={mainImageIndex === index ? 'border-blue-500' : ''}
        >
          <img src={img} />
          {mainImageIndex === index && <CheckIcon />}
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

### 2. Formulaire Fournisseur

**Localisation:** Dans le formulaire d'ajout de matériau

```jsx
{/* Après champs nom, quantité, catégorie, description */}

<div className="border-t pt-4">
  <Button 
    variant="outline"
    onClick={() => setShowSupplierForm(!showSupplierForm)}
  >
    <Building2 /> Ajouter un fournisseur
  </Button>
  
  {showSupplierForm && (
    <div className="mt-4 p-4 bg-blue-50 border rounded-lg">
      <h4>
        <Building2 /> Informations Fournisseur
      </h4>
      
      {/* Grid 2 colonnes */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nom du fournisseur *" />
        <Input label="Contact" />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <Input label="Téléphone" />
        <Input label="WhatsApp" />
      </div>
      
      <Input label="Email" type="email" />
      <Textarea label="Adresse" rows={2} />
    </div>
  )}
</div>
```

### 3. Affichage des Matériaux Amélioré

**Avec catégorie et fournisseur :**

```jsx
<div className="border rounded-lg p-3">
  {/* En-tête avec catégorie */}
  <div className="flex items-center gap-2">
    <p className="font-medium">{material.name}</p>
    {material.category && (
      <Badge variant="secondary">{material.category}</Badge>
    )}
  </div>
  
  {/* Quantité et description */}
  <p className="text-sm text-gray-600">
    {material.quantity} {material.unit}
    {material.description && ` - ${material.description}`}
  </p>
  
  {/* Fournisseur si présent */}
  {material.supplier && (
    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
      <div className="text-xs font-semibold text-blue-700">
        <Building2 /> Fournisseur
      </div>
      <p className="text-xs">
        <strong>{material.supplier.name}</strong>
        {material.supplier.contact && ` - ${material.supplier.contact}`}
      </p>
      <div className="flex gap-2 text-xs text-gray-600">
        {material.supplier.phone && <span>📞 {material.supplier.phone}</span>}
        {material.supplier.email && <span>✉️ {material.supplier.email}</span>}
      </div>
    </div>
  )}
</div>
```

---

## Workflow Utilisateur

### Création d'un Template Complet

```
1. Informations de base
   ↓
   - Nom du template
   - Description courte
   - Catégorie (Résidentiel/Commercial/Rénovation)

2. Présentation
   ↓
   - Description détaillée
   - Upload images (max 10)
   - Sélection image principale
   
3. Ajout de matériaux
   ↓
   Pour chaque matériau:
   - Nom, quantité, unité
   - Catégorie
   - Description
   
   Option: Ajouter fournisseur
   ↓
   - Nom entreprise
   - Contact
   - Téléphone, WhatsApp
   - Email
   - Adresse
   
4. Sauvegarde
   ↓
   - Template créé
   - Matériaux enregistrés
   - Fournisseurs liés
   - Redirection vers liste templates
```

---

## Sauvegarde des Données

### handleSaveTemplate (modifié)

```typescript
const handleSaveTemplate = async () => {
  // Create template with presentation
  const { data: template } = await supabase
    .from('templates')
    .insert({
      name: templateName,
      description: templateDescription,
      category,
      materials_count: materials.length,
      user_id: user.id,
      // NOUVEAU
      presentation_description: presentationDescription,
      images: templateImages,
      main_image_index: mainImageIndex
    })
    .select()
    .single();
  
  // Save materials with supplier info
  const materialsData = materials.map(m => ({
    template_id: template.id,
    name: m.name,
    description: m.description,
    quantity: m.quantity,
    unit: m.unit,
    // NOUVEAU
    category: m.category || null,
    supplier_name: m.supplier?.name || null,
    supplier_contact: m.supplier?.contact || null,
    supplier_phone: m.supplier?.phone || null,
    supplier_email: m.supplier?.email || null,
    supplier_whatsapp: m.supplier?.whatsapp || null,
    supplier_address: m.supplier?.address || null
  }));
  
  await supabase
    .from('template_materials')
    .insert(materialsData);
};
```

---

## Migration SQL

```sql
-- Add presentation fields to templates
ALTER TABLE public.templates 
ADD COLUMN IF NOT EXISTS presentation_description TEXT,
ADD COLUMN IF NOT EXISTS images TEXT[],
ADD COLUMN IF NOT EXISTS main_image_index INTEGER DEFAULT 0;

-- Add supplier fields to template_materials
ALTER TABLE public.template_materials
ADD COLUMN IF NOT EXISTS supplier_name TEXT,
ADD COLUMN IF NOT EXISTS supplier_contact TEXT,
ADD COLUMN IF NOT EXISTS supplier_phone TEXT,
ADD COLUMN IF NOT EXISTS supplier_email TEXT,
ADD COLUMN IF NOT EXISTS supplier_whatsapp TEXT,
ADD COLUMN IF NOT EXISTS supplier_address TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;
```

**Applied via:** `mcp5_apply_migration` (Success ✅)

---

## Cas d'Usage

### 1. Template "Villa Moderne 150m²"

**Présentation:**
- Description: "Template complet pour villa moderne avec tous les matériaux et finitions haut de gamme"
- Images: 8 photos (façade, intérieur, plans)
- Image principale: Façade principale

**Matériaux avec Fournisseurs:**
```
Ciment Portland
  ├─ Catégorie: Maçonnerie
  ├─ 50 sacs
  └─ Fournisseur: CEMEX France
      ├─ Contact: Jean Dupont
      ├─ 📞 +33 6 12 34 56 78
      └─ ✉️ contact@cemex.fr

Carrelage Premium
  ├─ Catégorie: Finitions
  ├─ 120 m²
  └─ Fournisseur: Porcelanosa
      ├─ Contact: Marie Martin
      ├─ 📞 +33 6 23 45 67 89
      └─ ✉️ showroom@porcelanosa.fr
```

### 2. Template "Rénovation Appartement"

**Présentation:**
- Description: "Template pour rénovation complète appartement 80m²"
- Images: Avant/Après + plans
- Image principale: Photo après rénovation

**Avantages:**
- Professionnels peuvent partager leurs templates
- Fournisseurs pré-identifiés pour chaque matériau
- Présentation visuelle professionnelle
- Facilite la réutilisation

---

## Components Utilisés

### ImageUpload
```typescript
<ImageUpload
  images={templateImages}
  onImagesChange={setTemplateImages}
  maxImages={10}
  bucket="templates"
  path="presentation"
/>
```

**Features:**
- Zone de drop drag & drop
- Upload multiple
- Aperçu des images
- Suppression individuelle
- Progress indicator

### Badge Component
```typescript
<Badge variant="secondary">
  {material.category}
</Badge>
```

**Usage:**
- Afficher catégories
- Visuellement distinctif
- Variantes: default, secondary, destructive, outline

---

## Styling & UX

### Couleurs Thématiques

**Section Fournisseur:**
```css
bg-blue-50          /* Fond léger */
border-blue-200     /* Bordure */
text-blue-700       /* Texte titre */
```

**Image Principale:**
```css
border-blue-500     /* Bordure sélection */
ring-2 ring-blue-200 /* Ring effet */
bg-blue-500/20      /* Overlay */
```

### Icons Utilisés

- `<ImageIcon />` - Section présentation
- `<Building2 />` - Fournisseurs
- `<CheckCircle2 />` - Image principale sélectionnée
- `<Trash2 />` - Suppression matériau
- `📞` `✉️` - Contact info (emoji)

### Transitions

```css
transition-all      /* Smooth animations */
hover:border-blue-500
hover:border-blue-300
```

---

## Validation & Erreurs

### Champs Requis

**Template:**
- ✅ Nom du template (obligatoire)
- ✅ Catégorie (obligatoire)
- ⚪ Description présentation (optionnel)
- ⚪ Images (optionnel)

**Matériau:**
- ✅ Nom (obligatoire)
- ✅ Quantité (obligatoire)
- ⚪ Catégorie (optionnel)
- ⚪ Description (optionnel)

**Fournisseur:**
- ✅ Nom entreprise (si fournisseur ajouté)
- ⚪ Autres champs (optionnels)

### Messages Toast

```typescript
toast.success('✅ Template créé avec succès !');
toast.error('Nom du template requis');
toast.success('Matériau ajouté');
toast.success('Matériau supprimé');
```

---

## Performance

### Optimisations

1. **État Local:**
   - Données présentation stockées localement
   - Pas de requête avant sauvegarde finale

2. **Images:**
   - Upload différé (au save)
   - Bucket dédié `templates/presentation`
   - Limite 10 images

3. **Fournisseur:**
   - Formulaire conditionnel (showSupplierForm)
   - Pas de composant monté si non utilisé

---

## Accessibilité

### Labels Explicites
```jsx
<Label htmlFor="presentation-desc">
  Description de présentation
</Label>
```

### Indications Visuelles
- ✅ Checkmark sur image principale
- 🏢 Icon fournisseur
- 📞 ✉️ Icons contact

### Navigation Clavier
- Tab navigation complète
- Enter pour sélectionner image
- Escape pour fermer formulaire

---

## Améliorations Futures

### Templates
- [ ] Support vidéos (actuellement images seulement)
- [ ] Réorganisation drag & drop images
- [ ] Crop/resize images avant upload
- [ ] Preview mode avant sauvegarde

### Fournisseurs
- [ ] Base de fournisseurs réutilisables
- [ ] Auto-complétion depuis fournisseurs existants
- [ ] Ratings fournisseurs
- [ ] Lien vers catalogue fournisseur

### UI/UX
- [ ] Mode édition template existant
- [ ] Dupliquer template
- [ ] Export template (PDF/Excel)
- [ ] Partage template entre utilisateurs

---

## Troubleshooting

### Images ne s'affichent pas
→ Vérifier bucket `templates` existe  
→ Vérifier permissions RLS  
→ Vérifier URL publique activée

### Fournisseur ne se sauvegarde pas
→ Vérifier supplierData.name rempli  
→ Vérifier showSupplierForm = true  
→ Vérifier migration appliquée

### Migration échoue
→ Vérifier connexion Supabase  
→ Re-run migration avec MCP  
→ Vérifier tables existent

---

**Version:** 1.0.0  
**Date:** 2025-11-19  
**Status:** ✅ Production Ready  
**Migration:** Applied via Supabase MCP  
**Commits:** `a940bc9`, `3c959fc`
