# 📷 Upload Photos - Spécification Complète

## 🎯 Où Ajouter des Photos?

### Option 1: Dans le Modal "Ajouter un Prix" ⭐ (Recommandé)
**Moment**: Lors de l'ajout d'un nouveau prix
**Avantage**: Photos liées directement au prix et fournisseur

```
┌──────────────────────────────────────────────┐
│ Ajouter un Prix                          [X] │
├──────────────────────────────────────────────┤
│                                              │
│ Pays: [Chine ▼]                             │
│ Fournisseur: Alibaba Supplier               │
│ Montant: 500 CNY                             │
│                                              │
│ 📷 Photos du Produit                         │
│ ┌────────────────────────────────────────┐  │
│ │ [📷 Ajouter des photos]                │  │
│ │                                        │  │
│ │ [img1] [img2] [img3]                   │  │
│ │  ✕      ✕      ✕                       │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ Notes: MOQ: 500 sacs...                      │
│                                              │
│                      [Annuler] [Ajouter]    │
└──────────────────────────────────────────────┘
```

---

### Option 2: Dans le Modal "Gérer les Prix"
**Moment**: Après avoir ajouté un prix
**Avantage**: Peut ajouter/modifier photos à tout moment

```
┌──────────────────────────────────────────────┐
│ 💰 Prix - Ciment Portland              [X] │
├──────────────────────────────────────────────┤
│                                              │
│ 🇨🇳 Chine                                    │
│ ┌────────────────────────────────────────┐  │
│ │ Alibaba Supplier                       │  │
│ │ 500 CNY (≈ 42,000 FCFA)               │  │
│ │                                        │  │
│ │ 📷 Photos (3):                         │  │
│ │ [img1] [img2] [img3]                   │  │
│ │                                        │  │
│ │ [+ Ajouter des photos]                 │  │
│ │                              [✏️] [🗑️] │  │
│ └────────────────────────────────────────┘  │
│                                              │
│              [+ Ajouter un Prix]  [Fermer]  │
└──────────────────────────────────────────────┘
```

---

### Option 3: Modal Dédié "Galerie Photos"
**Moment**: Clic sur les photos d'un prix
**Avantage**: Vue complète avec zoom et détails

```
┌──────────────────────────────────────────────┐
│ 📷 Photos - Alibaba Supplier            [X] │
├──────────────────────────────────────────────┤
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │                                        │  │
│ │         [PHOTO PRINCIPALE]             │  │
│ │                                        │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ Miniatures:                                  │
│ [img1] [img2] [img3] [img4] [+ Ajouter]     │
│                                              │
│ Légende: Vue du produit en usine            │
│ [Éditer légende]                             │
│                                              │
│                                   [Fermer]   │
└──────────────────────────────────────────────┘
```

---

## 📊 Structure des Données

### Table `photos` (Existe déjà!)
```sql
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  material_id UUID REFERENCES materials(id),
  price_id INTEGER REFERENCES prices(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

### Stockage Supabase Storage
```
Bucket: project-files
Structure:
  /prices/{price_id}/
    - photo1.jpg
    - photo2.jpg
    - photo3.jpg
```

---

## 🎨 Interface Recommandée

### 1. Composant Upload dans "Ajouter un Prix"

```tsx
{/* Photos du Produit */}
<div className="grid gap-2">
  <Label>Photos du Produit</Label>
  <div className="border-2 border-dashed rounded-lg p-4">
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={handlePhotoUpload}
      className="hidden"
      id="photo-upload"
    />
    <label
      htmlFor="photo-upload"
      className="flex flex-col items-center cursor-pointer"
    >
      <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
      <span className="text-sm text-gray-600">
        Cliquez pour ajouter des photos
      </span>
      <span className="text-xs text-gray-500">
        PNG, JPG jusqu'à 5MB
      </span>
    </label>
  </div>

  {/* Aperçu des photos */}
  {uploadedPhotos.length > 0 && (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {uploadedPhotos.map((photo, index) => (
        <div key={index} className="relative">
          <img
            src={photo.preview}
            alt={`Photo ${index + 1}`}
            className="w-full h-24 object-cover rounded"
          />
          <button
            onClick={() => removePhoto(index)}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )}
</div>
```

---

## 🔧 Fonctions à Implémenter

### 1. Upload Photo vers Supabase Storage

```typescript
const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;

  try {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `prices/${Date.now()}/${fileName}`;

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (error) throw error;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    setUploadedPhotos(prev => [...prev, ...uploadedUrls]);
    toast.success(`${files.length} photo(s) ajoutée(s)`);
  } catch (error) {
    console.error('Error uploading photos:', error);
    toast.error('Erreur lors de l\'upload');
  }
};
```

### 2. Sauvegarder les Photos en Base

```typescript
const savePhotosToDatabase = async (priceId: number, photoUrls: string[]) => {
  try {
    const photosData = photoUrls.map(url => ({
      price_id: priceId,
      url: url,
      caption: null,
    }));

    const { error } = await supabase
      .from('photos')
      .insert(photosData);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving photos:', error);
  }
};
```

### 3. Charger les Photos d'un Prix

```typescript
const loadPhotos = async (priceId: number) => {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('price_id', priceId)
      .order('uploaded_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading photos:', error);
    return [];
  }
};
```

### 4. Supprimer une Photo

```typescript
const deletePhoto = async (photoId: number, photoUrl: string) => {
  try {
    // Supprimer de la base
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', photoId);

    if (dbError) throw dbError;

    // Supprimer du storage
    const filePath = photoUrl.split('/').slice(-3).join('/');
    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([filePath]);

    if (storageError) throw storageError;

    toast.success('Photo supprimée');
  } catch (error) {
    console.error('Error deleting photo:', error);
    toast.error('Erreur lors de la suppression');
  }
};
```

---

## 🎯 Workflow Complet

### Scénario 1: Ajout de Prix avec Photos

```
1. Utilisateur clique "Ajouter un Prix"
   ↓
2. Remplit le formulaire
   ↓
3. Clique "Ajouter des photos"
   ↓
4. Sélectionne 3 photos (produit, emballage, étiquette)
   ↓
5. Photos uploadées vers Supabase Storage
   ↓
6. Aperçu des photos affiché
   ↓
7. Clique "Ajouter"
   ↓
8. Prix créé en base
   ↓
9. Photos liées au prix en base
   ↓
10. ✅ Prix avec photos enregistré!
```

### Scénario 2: Ajout de Photos Après Création

```
1. Prix déjà créé sans photos
   ↓
2. Utilisateur clique sur le prix
   ↓
3. Clique "Ajouter des photos"
   ↓
4. Upload et sauvegarde
   ↓
5. ✅ Photos ajoutées au prix existant
```

---

## 📱 Types de Photos Recommandées

### Pour un Fournisseur Chinois
1. **Photo du produit** - Vue principale
2. **Emballage** - Comment c'est livré
3. **Étiquette** - Spécifications techniques
4. **Usine** - Vue de l'installation
5. **Certificats** - Qualité, normes

### Pour un Fournisseur Local
1. **Photo du produit** - En stock
2. **Showroom** - Emplacement
3. **Livraison** - Camion, transport
4. **Facture** - Exemple de prix
5. **Contact** - Carte de visite

---

## 🎨 Galerie Photos - Affichage

### Dans le Modal Prix

```tsx
{price.photos && price.photos.length > 0 && (
  <div className="mt-3">
    <p className="text-sm font-medium mb-2">
      📷 Photos ({price.photos.length})
    </p>
    <div className="grid grid-cols-4 gap-2">
      {price.photos.map((photo: any) => (
        <div
          key={photo.id}
          className="relative cursor-pointer hover:opacity-80"
          onClick={() => openPhotoGallery(photo)}
        >
          <img
            src={photo.url}
            alt={photo.caption || 'Photo'}
            className="w-full h-20 object-cover rounded"
          />
        </div>
      ))}
    </div>
  </div>
)}
```

---

## 🔐 Sécurité

### Policies RLS pour Photos

```sql
-- Voir les photos des prix de ses projets
CREATE POLICY "Users can view photos for their prices"
ON photos FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prices p
    JOIN materials m ON p.material_id = m.id
    JOIN projects pr ON m.project_id = pr.id
    WHERE photos.price_id = p.id
    AND pr.user_id = auth.uid()
  )
);

-- Ajouter des photos aux prix de ses projets
CREATE POLICY "Users can insert photos for their prices"
ON photos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prices p
    JOIN materials m ON p.material_id = m.id
    JOIN projects pr ON m.project_id = pr.id
    WHERE photos.price_id = p.id
    AND pr.user_id = auth.uid()
  )
);

-- Supprimer les photos de ses prix
CREATE POLICY "Users can delete photos for their prices"
ON photos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM prices p
    JOIN materials m ON p.material_id = m.id
    JOIN projects pr ON m.project_id = pr.id
    WHERE photos.price_id = p.id
    AND pr.user_id = auth.uid()
  )
);
```

---

## ✅ Résumé

### Où Ajouter des Photos?

**1. Dans "Ajouter un Prix"** ⭐ (Recommandé)
- Lors de la création du prix
- Photos liées directement

**2. Dans "Gérer les Prix"**
- Après création
- Modification possible

**3. Galerie Dédiée**
- Vue complète
- Zoom et détails

### Stockage
- **Supabase Storage**: Bucket `project-files`
- **Base de données**: Table `photos` avec `price_id`

### Fonctionnalités
- ✅ Upload multiple
- ✅ Aperçu avant sauvegarde
- ✅ Suppression
- ✅ Légendes
- ✅ Galerie avec zoom

---

## 🚀 Prochaines Étapes

1. Ajouter le composant upload dans le modal "Ajouter un Prix"
2. Implémenter les fonctions d'upload
3. Créer les policies RLS pour photos
4. Afficher les photos dans le modal "Gérer les Prix"
5. Créer la galerie photos avec zoom

**Voulez-vous que j'implémente l'upload de photos maintenant?** 📷
