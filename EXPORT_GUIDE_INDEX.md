# 📦 GUIDE D'EXPORT COMPLET - INDEX

## Fonctionnalités Exportées

Ce guide contient tout le code nécessaire pour reproduire les fonctionnalités suivantes dans une autre application Next.js :

1. **Gestion des Matériaux** - Ajout, édition, suppression
2. **Upload de Fichiers** - Import Excel/CSV avec extraction IA
3. **Upload d'Images** - Vers Supabase Storage avec preview
4. **Gestion des Prix** - Multi-pays, multi-devises, fournisseurs
5. **Comparaison des Prix** - Local vs Import avec calcul transport
6. **Export PDF** - Rapport de comparaison professionnel

---

## 📚 Structure du Guide

Le guide est divisé en 4 parties pour faciliter la lecture :

### [PART 1 - EXPORT_GUIDE_MATERIALS.md](./EXPORT_GUIDE_MATERIALS.md)
- Structure du projet
- Dépendances NPM
- Variables d'environnement
- Schéma base de données (SQL complet)
- Librairies utilitaires (`utils.ts`, `client.ts`, `comments.ts`)
- Composant `ImageUpload.tsx`

### [PART 2 - EXPORT_GUIDE_MATERIALS_PART2.md](./EXPORT_GUIDE_MATERIALS_PART2.md)
- API Route `upload-image`
- API Route `ai/extract-items` (extraction IA)
- Composant `ImagePreview.tsx` (lightbox)
- Composant `MaterialCard.tsx`

### [PART 3 - EXPORT_GUIDE_MATERIALS_PART3.md](./EXPORT_GUIDE_MATERIALS_PART3.md)
- Page de comparaison complète
- Calculs Local vs Chine
- Export PDF avec jsPDF
- Filtres par pays

### [PART 4 - EXPORT_GUIDE_MATERIALS_PART4.md](./EXPORT_GUIDE_MATERIALS_PART4.md)
- `MaterialDetailModal.tsx` complet (1000+ lignes)
- Gestion des onglets (Détails, Prix, Notes, Photos)
- Formulaire d'ajout de prix
- Lightbox intégrée
- Récapitulatif final

---

## 🚀 Guide Rapide d'Installation

### 1. Installer les dépendances

```bash
npm install @supabase/ssr @supabase/supabase-js lucide-react sonner jspdf jspdf-autotable clsx tailwind-merge class-variance-authority openai replicate

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input label textarea badge dialog accordion progress
```

### 2. Configurer les variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=sk-xxx
REPLICATE_API_TOKEN=r8_xxx
```

### 3. Exécuter les migrations SQL

Copier le SQL de la PART 1 dans Supabase SQL Editor.

### 4. Copier les fichiers

Suivre la structure indiquée dans chaque partie du guide.

---

## 📋 Checklist de Copie

- [ ] `lib/utils.ts`
- [ ] `lib/supabase/client.ts`
- [ ] `lib/comments.ts`
- [ ] `components/ui/*` (shadcn)
- [ ] `components/project/ImageUpload.tsx`
- [ ] `components/materials/ImagePreview.tsx`
- [ ] `components/materials/MaterialCard.tsx`
- [ ] `components/materials/MaterialDetailModal.tsx`
- [ ] `app/api/upload-image/route.ts`
- [ ] `app/api/ai/extract-items/route.ts`
- [ ] `app/dashboard/projects/[id]/page.tsx`
- [ ] `app/dashboard/projects/[id]/comparison/page.tsx`
- [ ] Migrations SQL exécutées
- [ ] Variables d'environnement configurées
- [ ] Bucket Storage créé

---

## 💡 Notes Importantes

1. **Types TypeScript** : Les types sont définis inline dans chaque composant. Vous pouvez les extraire dans un fichier `types/` si nécessaire.

2. **Supabase RLS** : Les politiques RLS sont incluses dans les migrations. Adaptez-les selon vos besoins.

3. **IA** : L'extraction utilise Gemini 3 Pro via Replicate avec fallback sur OpenAI GPT-4o.

4. **Devises** : La conversion est basée sur des taux fixes. Intégrez une API de taux de change pour plus de précision.

5. **Transport** : Les coûts de transport sont estimatifs (50 USD/CBM depuis la Chine). Ajustez selon vos tarifs réels.

---

**Bonne intégration ! 🎉**
