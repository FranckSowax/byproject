# Commentaires dans les Cotations Fournisseurs

## 📋 Objectif

Permettre aux fournisseurs de voir les commentaires et notes sur les matériaux lorsqu'ils reçoivent une demande de cotation, avec traduction automatique selon leur langue.

## 🎯 Fonctionnalités

### 1. Récupération des Commentaires
- Lors de la création d'une demande de cotation
- Récupérer tous les commentaires non supprimés pour chaque matériau
- Depuis la table `material_comments`

### 2. Traduction Automatique
- Traduire les commentaires en 3 langues :
  - **Français** (original)
  - **Anglais** (EN)
  - **Chinois** (ZH)
- Utiliser l'API de traduction (Google Translate ou DeepL)

### 3. Stockage
- Ajouter les commentaires dans `supplier_requests` table
- Structure JSON :
```json
{
  "materials_data": [
    {
      "id": "...",
      "name": "...",
      "comments": [
        {
          "user_name": "...",
          "user_email": "...",
          "comment": "...",
          "created_at": "..."
        }
      ]
    }
  ],
  "materials_translated_en": [...],
  "materials_translated_zh": [...]
}
```

### 4. Affichage Fournisseur
- Sur la page `/supplier-quote/[token]`
- Afficher les commentaires sous chaque matériau
- Dans la langue sélectionnée par le fournisseur
- Design : Card avec icône 💬

## 🔧 Implémentation

### Étape 1 : Modifier la création de cotation

**Fichier** : `/app/(dashboard)/dashboard/quote-request/page.tsx`

```typescript
// Fonction pour récupérer les commentaires
const getMateri alComments = async (materialId: string) => {
  const { data, error } = await supabase
    .from('material_comments')
    .select('*')
    .eq('material_id', materialId)
    .eq('is_deleted', false)
    .order('created_at', 'asc');
  
  return data || [];
};

// Lors de la création de la demande
const materials_with_comments = await Promise.all(
  materials.map(async (material) => {
    const comments = await getMaterialComments(material.id);
    return {
      ...material,
      comments: comments.map(c => ({
        user_name: c.user_name,
        user_email: c.user_email,
        comment: c.comment,
        created_at: c.created_at
      }))
    };
  })
);
```

### Étape 2 : Traduire les commentaires

```typescript
// Fonction de traduction
const translateComments = async (comments: Comment[], targetLang: 'en' | 'zh') => {
  return await Promise.all(
    comments.map(async (comment) => {
      const translated = await translateText(comment.comment, targetLang);
      return {
        ...comment,
        comment: translated
      };
    })
  );
};

// Appliquer aux matériaux
const materials_translated_en = await Promise.all(
  materials_with_comments.map(async (material) => ({
    ...material,
    comments: await translateComments(material.comments, 'en')
  }))
);
```

### Étape 3 : Afficher sur la page fournisseur

**Fichier** : `/app/supplier-quote/[token]/page.tsx`

```tsx
// Dans le composant MaterialCard
{material.comments && material.comments.length > 0 && (
  <Card className="mt-4 bg-blue-50 border-blue-200">
    <CardHeader>
      <CardTitle className="text-sm flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        {t.comments} ({material.comments.length})
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {material.comments.map((comment, idx) => (
        <div key={idx} className="bg-white p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.user_name}</span>
            <span className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-700">{comment.comment}</p>
        </div>
      ))}
    </CardContent>
  </Card>
)}
```

## 📊 Structure de Données

### Interface Material (étendue)
```typescript
interface Material {
  id: string;
  name: string;
  description: string | null;
  // ... autres champs
  comments?: MaterialComment[];
}

interface MaterialComment {
  user_name: string;
  user_email: string;
  comment: string;
  created_at: string;
}
```

### Table supplier_requests (colonnes JSON)
- `materials_data` : Matériaux avec commentaires en français
- `materials_translated_en` : Matériaux avec commentaires en anglais
- `materials_translated_zh` : Matériaux avec commentaires en chinois

## 🌐 API de Traduction

### Option 1 : Google Translate API
```typescript
const translateText = async (text: string, targetLang: string) => {
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
    {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        target: targetLang,
        source: 'fr'
      })
    }
  );
  const data = await response.json();
  return data.data.translations[0].translatedText;
};
```

### Option 2 : DeepL API
```typescript
const translateText = async (text: string, targetLang: string) => {
  const response = await fetch(
    'https://api-free.deepl.com/v2/translate',
    {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang.toUpperCase(),
        source_lang: 'FR'
      })
    }
  );
  const data = await response.json();
  return data.translations[0].text;
};
```

## ✅ Checklist d'Implémentation

- [ ] Créer fonction `getMaterialComments(materialId)`
- [ ] Créer fonction `translateComments(comments, targetLang)`
- [ ] Modifier création de cotation pour inclure commentaires
- [ ] Traduire commentaires en EN et ZH
- [ ] Stocker dans `supplier_requests` table
- [ ] Ajouter interface `MaterialComment`
- [ ] Créer composant `CommentsCard` pour affichage
- [ ] Intégrer dans page fournisseur
- [ ] Ajouter traductions UI (fr, en, zh)
- [ ] Tester avec commentaires réels
- [ ] Vérifier traductions
- [ ] Documenter dans README

## 🎨 Design

### Carte de Commentaires
```
┌────────────────────────────────────────┐
│ 💬 Commentaires (3)                    │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ 👤 FRANCK SOWAX    📅 08/11/2025  │ │
│ │ Ce matériau doit être de haute    │ │
│ │ qualité pour résister à l'humidité│ │
│ └────────────────────────────────────┘ │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │ 👤 Jean Dupont     📅 07/11/2025  │ │
│ │ Préférer une couleur claire       │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

## 📝 Notes

- Les commentaires sont en lecture seule pour les fournisseurs
- Seuls les commentaires non supprimés sont inclus
- La traduction est faite au moment de la création de la cotation
- Les commentaires ne peuvent pas être modifiés après envoi
- Le fournisseur voit les commentaires dans sa langue

## 🚀 Prochaines Étapes

1. Configurer API de traduction (Google ou DeepL)
2. Implémenter récupération des commentaires
3. Implémenter traduction automatique
4. Modifier création de cotation
5. Créer composant d'affichage
6. Tester end-to-end
7. Déployer en production
