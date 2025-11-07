# 🏗️ Architecture Complète - Système de Cotation Fournisseurs

## 🎯 Objectif

Permettre aux utilisateurs de demander des cotations à des fournisseurs étrangers (Chine, etc.) avec traduction automatique et interface dédiée.

---

## 📊 Flux Complet

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UTILISATEUR - Création Projet                           │
├─────────────────────────────────────────────────────────────┤
│ • Crée un projet (FR)                                       │
│ • Ajoute des matériaux avec:                                │
│   - Nom (FR)                                                │
│   - Description (FR)                                        │
│   - Catégorie                                               │
│   - Quantité                                                │
│   - Unité                                                   │
│   - Images (upload)                                         │
│ • Demande cotation fournisseur chinois                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ADMIN - Réception & Traduction                          │
├─────────────────────────────────────────────────────────────┤
│ • Reçoit la demande (status: pending_admin)                 │
│ • Voit les matériaux en FR                                  │
│ • Clique "Envoyer aux fournisseurs"                         │
│ • Système traduit automatiquement via DeepSeek:             │
│   - Nom → EN + ZH                                           │
│   - Description → EN + ZH                                   │
│   - Catégorie → EN + ZH                                     │
│ • Génère token public                                       │
│ • Status → sent                                             │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. FOURNISSEUR - Cotation                                  │
├─────────────────────────────────────────────────────────────┤
│ • Accède via lien public                                    │
│ • Choisit langue (FR/EN/ZH)                                 │
│ • Voit liste matériaux traduits (lecture seule):           │
│   - Nom traduit                                             │
│   - Description traduite                                    │
│   - Quantité                                                │
│   - Unité                                                   │
│   - Images du client                                        │
│ • Remplit pour chaque matériau:                             │
│   - Prix unitaire *                                         │
│   - Prix total (auto-calculé)                               │
│   - Images produit (upload)                                 │
│   - Description détaillée                                   │
│   - Commentaires                                            │
│ • Sauvegarde brouillon ou soumet                            │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. UTILISATEUR - Réception Cotations                       │
├─────────────────────────────────────────────────────────────┤
│ • Reçoit notification                                       │
│ • Compare les cotations                                     │
│ • Sélectionne fournisseur                                   │
│ • Valide commande                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Structure Base de Données

### **Table: materials**
```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,                    -- Nom FR
  description TEXT,                      -- Description FR
  category TEXT,
  quantity DECIMAL,
  unit TEXT,
  images TEXT[],                         -- URLs images Supabase Storage
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### **Table: supplier_requests**
```sql
CREATE TABLE supplier_requests (
  id UUID PRIMARY KEY,
  request_number TEXT UNIQUE,
  project_id UUID REFERENCES projects(id),
  user_id UUID,
  status TEXT,                           -- pending_admin, sent, in_progress, completed
  num_suppliers INTEGER,
  metadata JSONB,                        -- country, shipping_type, notes
  
  -- Matériaux originaux (FR)
  materials_data JSONB,
  
  -- Matériaux traduits EN
  materials_translated_en JSONB,
  
  -- Matériaux traduits ZH
  materials_translated_zh JSONB,
  
  total_materials INTEGER,
  public_token TEXT UNIQUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  sent_at TIMESTAMP
);
```

### **Table: supplier_quotes**
```sql
CREATE TABLE supplier_quotes (
  id UUID PRIMARY KEY,
  supplier_request_id UUID REFERENCES supplier_requests(id),
  supplier_name TEXT,
  supplier_email TEXT,
  supplier_company TEXT,
  supplier_country TEXT,
  
  -- Matériaux cotés avec prix et détails
  quoted_materials JSONB,                -- Avec prix, images, descriptions
  
  total_quote_amount DECIMAL,
  currency TEXT,
  notes TEXT,
  status TEXT,                           -- draft, submitted
  created_at TIMESTAMP,
  submitted_at TIMESTAMP
);
```

---

## 📁 Structure Fichiers

```
app/
├── (dashboard)/dashboard/projects/[id]/
│   └── page.tsx                        ← Ajout upload images matériaux
│
├── (admin)/admin/supplier-requests/
│   ├── page.tsx                        ← Liste demandes
│   └── [id]/page.tsx                   ← Édition demande
│
├── supplier-quote/[token]/
│   └── page.tsx                        ← Page cotation fournisseur
│                                         (MÊME STRUCTURE que projet)
│
└── api/
    ├── translate/route.ts              ← DeepSeek traduction
    ├── admin/supplier-requests/
    │   ├── route.ts                    ← GET liste
    │   ├── send/route.ts               ← POST envoyer (traduction)
    │   └── [id]/route.ts               ← PATCH/DELETE
    └── supplier-quote/[token]/
        └── route.ts                    ← GET/POST cotation
```

---

## 🎨 Interface Fournisseur

### **Structure Identique à la Page Projet**

```tsx
<SupplierQuotePage>
  {/* Header avec sélecteur langue */}
  <Header language={language} />
  
  {/* Info demande */}
  <RequestInfo 
    requestNumber={request.request_number}
    projectName={request.project_name}
  />
  
  {/* Info fournisseur */}
  <SupplierInfoForm 
    companyName={...}
    contactName={...}
    email={...}
  />
  
  {/* Liste matériaux - MÊME STRUCTURE que projet */}
  <MaterialsList>
    {materials.map(material => (
      <MaterialCard>
        {/* Lecture seule (du client) */}
        <ReadOnly>
          <Name>{material.translatedName}</Name>
          <Description>{material.translatedDescription}</Description>
          <Quantity>{material.quantity}</Quantity>
          <Unit>{material.unit}</Unit>
          <ClientImages images={material.images} />
        </ReadOnly>
        
        {/* À remplir (fournisseur) */}
        <SupplierInputs>
          <UnitPrice />
          <TotalPrice />                 {/* Auto-calculé */}
          <SupplierImages />             {/* Upload */}
          <DetailedDescription />
          <Comments />
        </SupplierInputs>
      </MaterialCard>
    ))}
  </MaterialsList>
  
  {/* Actions */}
  <Actions>
    <SaveDraft />
    <Submit />
  </Actions>
</SupplierQuotePage>
```

---

## 🔄 Traduction DeepSeek

### **API: PUT /api/translate**

```typescript
// Input
{
  materials: Material[],
  targetLanguage: 'en' | 'zh'
}

// Output
{
  translations: Material[] // Avec translatedName, translatedDescription
}
```

### **Prompt DeepSeek**

```
System: You are a professional translator specializing in construction materials.
Translate the following material information from French to [English/Chinese].
Keep technical terms accurate.

User: 
Material: Béton armé
Description: Béton renforcé avec armatures métalliques pour structures porteuses
Category: Structure
Unit: m³

→ EN:
Material: Reinforced Concrete
Description: Concrete reinforced with metal reinforcements for load-bearing structures
Category: Structure
Unit: m³

→ ZH:
Material: 钢筋混凝土
Description: 用金属钢筋加固的混凝土，用于承重结构
Category: 结构
Unit: m³
```

---

## 📤 Upload Images

### **Supabase Storage**

```
Buckets:
├── project-materials/          ← Images matériaux projet (client)
│   └── {project_id}/{material_id}/{filename}
│
└── supplier-quotes/            ← Images cotations (fournisseur)
    └── {quote_id}/{material_id}/{filename}
```

### **Composant Upload**

```tsx
<ImageUpload
  onUpload={(url) => handleMaterialChange(index, 'images', [...images, url])}
  bucket="project-materials"
  path={`${projectId}/${materialId}`}
/>
```

---

## 🔧 Modifications à Faire

### **1. Page Projet - Ajout Upload Images**

**Fichier**: `app/(dashboard)/dashboard/projects/[id]/page.tsx`

```tsx
// Ajouter dans le formulaire matériau
<div>
  <Label>Images</Label>
  <ImageUpload
    images={material.images || []}
    onUpload={(url) => {
      const updated = [...materials];
      updated[index].images = [...(updated[index].images || []), url];
      setMaterials(updated);
    }}
    onRemove={(url) => {
      const updated = [...materials];
      updated[index].images = updated[index].images.filter(img => img !== url);
      setMaterials(updated);
    }}
  />
</div>
```

### **2. API Send - Traduction Complète**

**Fichier**: `app/api/admin/supplier-requests/send/route.ts`

```typescript
// Traduire EN
const { translations: materialsEn } = await fetch('/api/translate', {
  method: 'PUT',
  body: JSON.stringify({ materials, targetLanguage: 'en' })
}).then(r => r.json());

// Traduire ZH
const { translations: materialsZh } = await fetch('/api/translate', {
  method: 'PUT',
  body: JSON.stringify({ materials, targetLanguage: 'zh' })
}).then(r => r.json());

// Sauvegarder
await supabase
  .from('supplier_requests')
  .update({
    materials_data: materials,              // FR original
    materials_translated_en: materialsEn,   // EN traduit
    materials_translated_zh: materialsZh,   // ZH traduit
    status: 'sent'
  });
```

### **3. Page Fournisseur - Structure Projet**

**Fichier**: `app/supplier-quote/[token]/page.tsx`

```tsx
// Réutiliser composants projet
import { MaterialCard } from '@/components/project/MaterialCard';

<MaterialsList>
  {materials.map((material, index) => (
    <MaterialCard
      key={material.id}
      material={material}
      language={language}
      readOnly={{
        name: true,
        description: true,
        quantity: true,
        unit: true,
        clientImages: true
      }}
      editable={{
        unitPrice: true,
        supplierImages: true,
        detailedDescription: true,
        comments: true
      }}
      onChange={(field, value) => handleMaterialChange(index, field, value)}
    />
  ))}
</MaterialsList>
```

---

## 🎯 Résultat Final

### **Pour l'Utilisateur**
✅ Crée projet avec matériaux + images
✅ Demande cotation fournisseur
✅ Reçoit cotations traduites
✅ Compare et sélectionne

### **Pour l'Admin**
✅ Voit demandes
✅ Traduit automatiquement (DeepSeek)
✅ Envoie aux fournisseurs
✅ Suit progression

### **Pour le Fournisseur**
✅ Accède via lien public
✅ Voit matériaux traduits
✅ Remplit prix + détails
✅ Upload images produits
✅ Soumet cotation

---

## 📝 Checklist Implémentation

- [ ] Ajouter colonne `images TEXT[]` à table `materials`
- [ ] Créer composant `ImageUpload`
- [ ] Ajouter upload images dans page projet
- [ ] Corriger API traduction (2 appels: EN + ZH)
- [ ] Mettre à jour structure `Material` interface
- [ ] Créer composant `MaterialCard` réutilisable
- [ ] Adapter page fournisseur avec même structure
- [ ] Ajouter upload images fournisseur
- [ ] Tester flux complet
- [ ] Documentation utilisateur

---

## 🚀 Prochaines Étapes

1. **Immédiat**: Corriger API traduction (EN + ZH)
2. **Court terme**: Ajouter upload images matériaux
3. **Moyen terme**: Refactoriser page fournisseur
4. **Long terme**: Notifications email, comparaison cotations

**Status**: Architecture définie, implémentation en cours 🏗️
