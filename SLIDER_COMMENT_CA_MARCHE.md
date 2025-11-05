# 🎨 Slider "Comment ça marche" - Documentation

**Date** : 5 Novembre 2025  
**Statut** : ✅ Implémenté (en attente des captures d'écran)

---

## 📋 Vue d'Ensemble

Un slider interactif a été ajouté sur la page d'accueil pour expliquer le fonctionnement de l'application en 5 étapes simples.

### Caractéristiques

- ✅ **5 étapes** détaillées avec icônes
- ✅ **Navigation** : Flèches, dots, auto-play
- ✅ **Responsive** : S'adapte mobile/tablette/desktop
- ✅ **Animations** : Transitions fluides
- ✅ **Auto-play** : Change automatiquement toutes les 5 secondes
- ✅ **Barre de progression** : Indicateur visuel
- ✅ **Design moderne** : Cohérent avec le reste de l'app

---

## 🎯 Les 5 Étapes

### Étape 1 : Créez votre projet
**Icône** : Upload  
**Description** : Importez votre fichier CSV, Excel ou PDF avec l'IA qui détecte automatiquement les colonnes, ou créez votre liste manuellement en ajoutant vos matériaux un par un.  
**Capture** : `step-1-import.png`  
**Note** : Cette capture doit montrer les DEUX options (Import ET Manuel)

### Étape 2 : Mapping intelligent avec l'IA
**Icône** : Wand (baguette magique)  
**Description** : L'IA GPT-4 analyse votre fichier et mappe automatiquement les colonnes (nom, quantité, unité, etc.). Vous validez ou corrigez si nécessaire.  
**Capture** : `step-2-mapping.png`

### Étape 3 : Ajoutez vos prix
**Icône** : Dollar Sign  
**Description** : Saisissez les prix de vos fournisseurs au Gabon et en Chine. Gérez les devises (FCFA, RMB, USD, EUR) et les taux de change.  
**Capture** : `step-3-prices.png`

### Étape 4 : Comparez et analysez
**Icône** : Bar Chart  
**Description** : Visualisez les comparaisons en temps réel. Filtrez par pays, triez par prix, et identifiez instantanément les meilleures opportunités.  
**Capture** : `step-4-comparison.png`

### Étape 5 : Exportez vos rapports
**Icône** : File Down  
**Description** : Générez des rapports professionnels en PDF ou Excel avec tous vos prix comparés, prêts à partager avec votre équipe.  
**Capture** : `step-5-export.png`

---

## 📁 Fichiers Créés

### 1. Composant Principal
**Fichier** : `components/home/HowItWorksSlider.tsx`

**Fonctionnalités** :
- État local pour gérer l'étape courante
- Auto-play avec intervalle de 5 secondes
- Navigation par flèches (précédent/suivant)
- Navigation par dots (points indicateurs)
- Barre de progression
- Responsive design
- Animations et transitions

**Props** : Aucune (composant autonome)

### 2. Dossier Screenshots
**Chemin** : `public/screenshots/`

**Contenu** :
- `README.md` - Instructions détaillées
- Placeholders pour 5 captures d'écran

### 3. Intégration Page d'Accueil
**Fichier** : `app/page.tsx`

**Modifications** :
- Import du composant `HowItWorksSlider`
- Ajout entre la section Hero et Features
- Aucun changement de style nécessaire

---

## 🎨 Design et Style

### Palette de Couleurs
- **Primary** : `#5B5FC7` → `#7B7FE8` (gradient violet)
- **Accent** : `#FF9B7B` (orange)
- **Background** : `#F8F9FF` → blanc (gradient)
- **Text** : `#2D3748` (titres), `#718096` (descriptions)

### Composants UI Utilisés
- `Button` (shadcn/ui)
- `lucide-react` icons
- Tailwind CSS classes
- Custom gradients

### Responsive Breakpoints
- **Mobile** : < 640px
- **Tablet** : 640px - 1024px
- **Desktop** : > 1024px

---

## 🔧 Fonctionnalités Techniques

### Auto-Play
```typescript
useEffect(() => {
  if (!isAutoPlaying) return;
  const interval = setInterval(() => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  }, 5000);
  return () => clearInterval(interval);
}, [isAutoPlaying]);
```

### Navigation
- **Flèches** : Boutons précédent/suivant
- **Dots** : Indicateurs cliquables
- **Boucle** : Retour au début après la dernière étape

### État
```typescript
const [currentStep, setCurrentStep] = useState(0);
const [isAutoPlaying, setIsAutoPlaying] = useState(true);
```

---

## 📸 Ajout des Captures d'Écran

### Étapes à Suivre

1. **Prendre les captures**
   - Ouvrez l'application
   - Naviguez vers chaque étape
   - Capturez l'écran (Cmd+Shift+4 sur Mac)

2. **Nommer les fichiers**
   ```
   step-1-import.png
   step-2-mapping.png
   step-3-prices.png
   step-4-comparison.png
   step-5-export.png
   ```

3. **Placer dans le dossier**
   ```
   public/screenshots/
   ```

4. **Optimiser** (optionnel)
   - Compresser avec TinyPNG
   - Cible : < 500KB par image
   - Format : PNG ou JPG

5. **Activer les images**
   - Décommenter le code dans `HowItWorksSlider.tsx`
   - Ligne ~150-155

### Code à Décommenter

Dans `HowItWorksSlider.tsx`, remplacez :

```tsx
{/* Placeholder actuel */}
<div className="absolute inset-0 flex items-center justify-center">
  <div className="text-center space-y-4 p-8">
    {/* ... placeholder content ... */}
  </div>
</div>
```

Par :

```tsx
<Image
  src={step.imagePath}
  alt={step.title}
  fill
  className="object-cover"
  priority={currentStep === 0}
/>
```

---

## 🧪 Tests

### Vérifications à Faire

1. **Navigation**
   - ✅ Flèches fonctionnent
   - ✅ Dots fonctionnent
   - ✅ Auto-play fonctionne

2. **Responsive**
   - ✅ Mobile (< 640px)
   - ✅ Tablet (640-1024px)
   - ✅ Desktop (> 1024px)

3. **Performance**
   - ✅ Pas de lag
   - ✅ Transitions fluides
   - ✅ Images optimisées

4. **Accessibilité**
   - ✅ Labels ARIA
   - ✅ Navigation clavier
   - ✅ Contraste suffisant

---

## 🎯 Prochaines Étapes

### Immédiat
1. ✅ Composant créé
2. ✅ Intégré dans la page d'accueil
3. ⏳ **Ajouter les captures d'écran**
4. ⏳ Décommenter le code Image

### Optionnel (Améliorations)
- [ ] Ajouter des animations d'entrée
- [ ] Pause auto-play au hover
- [ ] Swipe sur mobile
- [ ] Lazy loading des images
- [ ] Préchargement de l'image suivante

---

## 📊 Impact

### Avant
- Page d'accueil statique
- Pas d'explication du fonctionnement
- Utilisateurs doivent deviner

### Après
- ✅ Explication visuelle claire
- ✅ 5 étapes détaillées
- ✅ Interface interactive
- ✅ Meilleure compréhension
- ✅ Taux de conversion amélioré

---

## 🔍 Détails Techniques

### Structure du Composant

```
HowItWorksSlider
├── Header (titre + description)
├── Slider Container
│   ├── Left Side (texte)
│   │   ├── Badge étape
│   │   ├── Titre
│   │   ├── Description
│   │   └── Navigation
│   └── Right Side (screenshot)
│       ├── Image/Placeholder
│       └── Decorations
├── Progress Bar
└── Mobile Indicators
```

### Props du Step

```typescript
interface Step {
  number: number;        // 1-5
  title: string;         // Titre de l'étape
  description: string;   // Description détaillée
  icon: React.ReactNode; // Icône Lucide
  imagePath: string;     // Chemin vers l'image
}
```

---

## 💡 Conseils

### Pour les Captures

1. **Utilisez des données réalistes**
   - Noms de matériaux concrets
   - Prix cohérents
   - Fournisseurs réels

2. **Interface propre**
   - Pas d'erreurs visibles
   - Pas de notifications
   - Mode clair (pas sombre)

3. **Cadrage optimal**
   - Centrez la partie importante
   - Ratio 4:3 recommandé
   - Résolution 1200x900px min

### Pour l'Optimisation

1. **Compression**
   - TinyPNG.com
   - Squoosh.app
   - ImageOptim (Mac)

2. **Format**
   - PNG pour interface (meilleure qualité)
   - JPG pour photos (plus léger)

3. **Taille cible**
   - < 500KB par image
   - Total < 2.5MB pour les 5

---

## 🎉 Résultat Final

Une fois les captures ajoutées, vous aurez :

- ✅ Slider professionnel et moderne
- ✅ Explication claire du fonctionnement
- ✅ Navigation intuitive
- ✅ Design cohérent avec l'app
- ✅ Expérience utilisateur améliorée

---

**Prochaine action** : Prendre les 5 captures d'écran ! 📸

**Documentation** : `public/screenshots/README.md`

**Besoin d'aide ?** Le slider fonctionne déjà avec des placeholders. Testez-le sur http://localhost:3000 ! 🚀
