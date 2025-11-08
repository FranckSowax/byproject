# Implémentation des Commentaires dans les Demandes de Cotation

## 📋 État Actuel

La page `/dashboard/quote-request` crée actuellement une demande de cotation **sans récupérer les matériaux ni les commentaires**. Elle insère seulement :
- Métadonnées du projet
- Numéro de demande
- Token public
- Pays et type d'expédition

```typescript
// Ligne 115-133 : Création actuelle
const { error: requestError } = await supabase
  .from('supplier_requests' as any)
  .insert({
    project_id: projectId,
    user_id: user.id,
    request_number: requestNumber,
    public_token: publicToken,
    status: 'pending_admin',
    materials_data: {},  // ❌ Vide !
    total_materials: 0,
    filled_materials: 0,
  });
```

## 🎯 Objectif

Modifier la création de cotation pour :
1. ✅ Récupérer tous les matériaux du projet
2. ✅ Récupérer les commentaires de chaque matériau
3. ✅ Traduire les matériaux et commentaires en EN et ZH
4. ✅ Stocker dans `materials_data`, `materials_translated_en`, `materials_translated_zh`

---

## 🔧 Implémentation Complète

### **Étape 1 : Récupérer les Matériaux et Commentaires**

```typescript
import { getBatchMaterialComments } from '@/lib/comments';

// Après avoir obtenu le projectId
const { data: materials, error: materialsError } = await supabase
  .from('materials')
  .select(`
    id,
    name,
    description,
    category,
    quantity,
    surface,
    weight,
    volume,
    specs,
    images:material_images(image_url)
  `)
  .eq('project_id', projectId);

if (materialsError) throw materialsError;

// Récupérer les commentaires pour tous les matériaux
const materialIds = materials.map(m => m.id);
const commentsByMaterial = await getBatchMaterialComments(materialIds);

// Ajouter les commentaires à chaque matériau
const materialsWithComments = materials.map(material => ({
  ...material,
  images: material.images?.map(img => img.image_url) || [],
  comments: commentsByMaterial[material.id] || []
}));
```

### **Étape 2 : Traduire les Matériaux et Commentaires**

```typescript
import { translateComments } from '@/lib/comments';

// Fonction pour traduire un matériau complet
async function translateMaterial(material: any, targetLang: 'en' | 'zh') {
  const [translatedName, translatedDescription, translatedComments] = await Promise.all([
    translateText(material.name, targetLang, 'fr'),
    material.description ? translateText(material.description, targetLang, 'fr') : null,
    translateComments(material.comments || [], targetLang)
  ]);

  return {
    ...material,
    translatedName,
    translatedDescription,
    comments: translatedComments.map(c => ({
      ...c,
      comment: c.translatedComment || c.comment
    }))
  };
}

// Traduire tous les matériaux
const [materialsEN, materialsZH] = await Promise.all([
  Promise.all(materialsWithComments.map(m => translateMaterial(m, 'en'))),
  Promise.all(materialsWithComments.map(m => translateMaterial(m, 'zh')))
]);
```

### **Étape 3 : Créer la Demande avec Toutes les Données**

```typescript
// Créer la demande de cotation avec matériaux et commentaires
const { error: requestError } = await supabase
  .from('supplier_requests' as any)
  .insert({
    project_id: projectId,
    user_id: user.id,
    request_number: requestNumber,
    public_token: publicToken,
    status: 'pending_admin',
    num_suppliers: parseInt(formData.numSuppliers),
    
    // ✅ Matériaux avec commentaires en français
    materials_data: materialsWithComments,
    
    // ✅ Matériaux traduits en anglais
    materials_translated_en: materialsEN,
    
    // ✅ Matériaux traduits en chinois
    materials_translated_zh: materialsZH,
    
    total_materials: materialsWithComments.length,
    filled_materials: 0,
    progress_percentage: 0,
    metadata: {
      country: formData.country,
      shipping_type: formData.shippingType,
      notes: formData.notes,
    }
  });
```

---

## 📊 Structure de Données Finale

### **materials_data (FR)**
```json
[
  {
    "id": "mat-123",
    "name": "Ciment Portland",
    "description": "Ciment de haute qualité",
    "category": "Ciment",
    "quantity": 100,
    "images": ["url1", "url2"],
    "comments": [
      {
        "id": "com-1",
        "user_name": "FRANCK SOWAX",
        "user_email": "sowax@gmail.com",
        "comment": "Doit résister à l'humidité",
        "created_at": "2025-11-08T15:00:00Z"
      }
    ]
  }
]
```

### **materials_translated_en (EN)**
```json
[
  {
    "id": "mat-123",
    "name": "Portland Cement",
    "translatedName": "Portland Cement",
    "description": "High quality cement",
    "translatedDescription": "High quality cement",
    "category": "Cement",
    "quantity": 100,
    "images": ["url1", "url2"],
    "comments": [
      {
        "id": "com-1",
        "user_name": "FRANCK SOWAX",
        "user_email": "sowax@gmail.com",
        "comment": "Must resist humidity",
        "translatedComment": "Must resist humidity",
        "created_at": "2025-11-08T15:00:00Z"
      }
    ]
  }
]
```

### **materials_translated_zh (ZH)**
```json
[
  {
    "id": "mat-123",
    "name": "波特兰水泥",
    "translatedName": "波特兰水泥",
    "description": "高质量水泥",
    "translatedDescription": "高质量水泥",
    "category": "水泥",
    "quantity": 100,
    "images": ["url1", "url2"],
    "comments": [
      {
        "id": "com-1",
        "user_name": "FRANCK SOWAX",
        "user_email": "sowax@gmail.com",
        "comment": "必须耐湿",
        "translatedComment": "必须耐湿",
        "created_at": "2025-11-08T15:00:00Z"
      }
    ]
  }
]
```

---

## 🚀 Code Complet à Ajouter

### **Fichier : `/app/(dashboard)/dashboard/quote-request/page.tsx`**

```typescript
import { getBatchMaterialComments, translateComments } from '@/lib/comments';
import { translateText } from '@/lib/translation';

// Dans la fonction handleSubmit, après avoir obtenu projectId:

try {
  setIsSubmitting(true);

  // 1. Récupérer les matériaux du projet
  const { data: materials, error: materialsError } = await supabase
    .from('materials')
    .select(`
      id,
      name,
      description,
      category,
      quantity,
      surface,
      weight,
      volume,
      specs
    `)
    .eq('project_id', projectId);

  if (materialsError) throw materialsError;

  // 2. Récupérer les images
  const { data: images } = await supabase
    .from('material_images')
    .select('material_id, image_url')
    .in('material_id', materials.map(m => m.id));

  // Grouper images par material_id
  const imagesByMaterial: Record<string, string[]> = {};
  images?.forEach(img => {
    if (!imagesByMaterial[img.material_id]) {
      imagesByMaterial[img.material_id] = [];
    }
    imagesByMaterial[img.material_id].push(img.image_url);
  });

  // 3. Récupérer les commentaires
  const materialIds = materials.map(m => m.id);
  const commentsByMaterial = await getBatchMaterialComments(materialIds);

  // 4. Combiner matériaux avec images et commentaires
  const materialsWithComments = materials.map(material => ({
    ...material,
    images: imagesByMaterial[material.id] || [],
    comments: commentsByMaterial[material.id] || []
  }));

  // 5. Fonction de traduction complète
  async function translateMaterial(material: any, targetLang: 'en' | 'zh') {
    const [translatedName, translatedDescription, translatedComments] = await Promise.all([
      translateText(material.name, targetLang, 'fr'),
      material.description ? translateText(material.description, targetLang, 'fr') : null,
      translateComments(material.comments || [], targetLang)
    ]);

    return {
      ...material,
      translatedName,
      translatedDescription,
      comments: translatedComments.map(c => ({
        id: c.id,
        user_name: c.user_name,
        user_email: c.user_email,
        comment: c.translatedComment || c.comment,
        translatedComment: c.translatedComment,
        created_at: c.created_at
      }))
    };
  }

  // 6. Traduire en parallèle
  toast.info('Traduction en cours...', {
    description: 'Traduction des matériaux et commentaires'
  });

  const [materialsEN, materialsZH] = await Promise.all([
    Promise.all(materialsWithComments.map(m => translateMaterial(m, 'en'))),
    Promise.all(materialsWithComments.map(m => translateMaterial(m, 'zh')))
  ]);

  // 7. Créer la demande avec toutes les données
  const { error: requestError } = await supabase
    .from('supplier_requests' as any)
    .insert({
      project_id: projectId,
      user_id: user.id,
      request_number: requestNumber,
      public_token: publicToken,
      status: 'pending_admin',
      num_suppliers: parseInt(formData.numSuppliers),
      materials_data: materialsWithComments,
      materials_translated_en: materialsEN,
      materials_translated_zh: materialsZH,
      total_materials: materialsWithComments.length,
      filled_materials: 0,
      progress_percentage: 0,
      metadata: {
        country: formData.country,
        shipping_type: formData.shippingType,
        notes: formData.notes,
      }
    });

  if (requestError) throw requestError;

  toast.success('Demande envoyée avec succès !', {
    description: `${materialsWithComments.length} matériaux avec commentaires traduits`
  });

} catch (error) {
  console.error('Error creating quote request:', error);
  toast.error('Erreur lors de la création de la demande');
} finally {
  setIsSubmitting(false);
}
```

---

## ⚡ Optimisations

### **1. Traduction par Batch**
Au lieu de traduire chaque commentaire individuellement, grouper les traductions :

```typescript
// Collecter tous les textes à traduire
const allTexts = materials.flatMap(m => [
  m.name,
  m.description,
  ...m.comments.map(c => c.comment)
]).filter(Boolean);

// Traduire en batch
const translatedEN = await translateBatch(allTexts, 'en');
const translatedZH = await translateBatch(allTexts, 'zh');

// Réassigner aux matériaux
let index = 0;
const materialsEN = materials.map(m => {
  const nameEN = translatedEN[index++];
  const descEN = m.description ? translatedEN[index++] : null;
  const commentsEN = m.comments.map(() => translatedEN[index++]);
  
  return {
    ...m,
    translatedName: nameEN,
    translatedDescription: descEN,
    comments: m.comments.map((c, i) => ({
      ...c,
      translatedComment: commentsEN[i]
    }))
  };
});
```

### **2. Cache de Traduction**
Stocker les traductions en cache pour éviter de retraduire :

```typescript
// Vérifier si déjà traduit
const cacheKey = `translation_${material.id}_${targetLang}`;
const cached = localStorage.getItem(cacheKey);
if (cached) {
  return JSON.parse(cached);
}

// Traduire et mettre en cache
const translated = await translateMaterial(material, targetLang);
localStorage.setItem(cacheKey, JSON.stringify(translated));
return translated;
```

### **3. Indicateur de Progression**
Afficher la progression de la traduction :

```typescript
let completed = 0;
const total = materials.length * 2; // EN + ZH

for (const material of materials) {
  await translateMaterial(material, 'en');
  completed++;
  toast.info(`Traduction: ${Math.round((completed / total) * 100)}%`);
}
```

---

## ✅ Résultat Final

Quand un fournisseur accède au lien `/supplier-quote/[token]` :

1. ✅ Il voit les matériaux dans sa langue
2. ✅ Il voit les commentaires traduits
3. ✅ Il peut voir le texte original
4. ✅ Il comprend mieux les besoins
5. ✅ Il peut faire une cotation précise

---

## 🎯 Bénéfices

| Avant | Après |
|-------|-------|
| ❌ Pas de commentaires | ✅ Commentaires inclus |
| ❌ Pas de traduction | ✅ Traduction automatique |
| ❌ Contexte manquant | ✅ Contexte complet |
| ❌ Cotations imprécises | ✅ Cotations précises |
| ❌ Communication difficile | ✅ Communication claire |

---

## 📝 Notes

- La traduction prend ~2-3 secondes par matériau
- Utiliser un indicateur de chargement
- Gérer les erreurs de traduction gracieusement
- Fallback sur le texte original si traduction échoue
- Considérer un système de queue pour les grandes listes

---

## 🚀 Prochaines Étapes

1. Implémenter le code dans `/dashboard/quote-request/page.tsx`
2. Tester avec un projet contenant des commentaires
3. Vérifier les traductions EN et ZH
4. Optimiser les performances si nécessaire
5. Ajouter des tests end-to-end
