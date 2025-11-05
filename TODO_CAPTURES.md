# 📸 TODO : Captures d'Écran pour le Slider

## ✅ Ce qui est fait
- ✅ Slider créé et fonctionnel
- ✅ Intégré sur la page d'accueil
- ✅ Documentation complète
- ✅ Étape 1 mise à jour (Import + Manuel)

## 📋 Ce qu'il reste à faire

### 1. Prendre 5 Captures d'Écran

#### Capture 1 : Création de Projet ⭐ IMPORTANT
**Fichier** : `step-1-import.png`  
**Où** : Dashboard → Nouveau Projet  
**Montrer** : Les DEUX options côte à côte
- Option gauche : "Importer un fichier" (CSV, Excel, PDF)
- Option droite : "Créer manuellement" (ajouter un par un)

#### Capture 2 : Mapping IA
**Fichier** : `step-2-mapping.png`  
**Où** : Après avoir importé un fichier  
**Montrer** : Page de mapping avec colonnes détectées

#### Capture 3 : Ajout de Prix
**Fichier** : `step-3-prices.png`  
**Où** : Projet → Matériau → "Ajouter un prix"  
**Montrer** : Dialogue d'ajout de prix ouvert

#### Capture 4 : Comparaison
**Fichier** : `step-4-comparison.png`  
**Où** : Projet → Onglet "Comparaison"  
**Montrer** : Tableau avec plusieurs matériaux et prix

#### Capture 5 : Export
**Fichier** : `step-5-export.png`  
**Où** : Projet → Bouton "Exporter"  
**Montrer** : Dialogue d'export ou bouton visible

---

## 📂 Où Placer les Fichiers

```bash
public/screenshots/
├── step-1-import.png      ← Votre capture
├── step-2-mapping.png     ← Votre capture
├── step-3-prices.png      ← Votre capture
├── step-4-comparison.png  ← Votre capture
└── step-5-export.png      ← Votre capture
```

---

## 🎯 Raccourcis Clavier

**Mac** : `Cmd + Shift + 4` puis sélectionner la zone  
**Windows** : `Windows + Shift + S` puis sélectionner la zone

---

## 📏 Spécifications

- **Format** : PNG (recommandé) ou JPG
- **Taille** : 1200x900px minimum
- **Poids** : < 500KB par image (compresser si nécessaire)

---

## 🔧 Après Avoir Ajouté les Images

### Étape Finale : Activer les Images

1. Ouvrir : `components/home/HowItWorksSlider.tsx`

2. Trouver (ligne ~150) :
```tsx
{/* Placeholder for screenshot */}
<div className="absolute inset-0 flex items-center justify-center">
  ...
</div>
```

3. Remplacer par :
```tsx
<Image
  src={step.imagePath}
  alt={step.title}
  fill
  className="object-cover"
  priority={currentStep === 0}
/>
```

4. Sauvegarder et rafraîchir le navigateur !

---

## 📚 Guides Disponibles

- **Guide détaillé** : `GUIDE_CAPTURES_ECRAN.md`
- **Instructions techniques** : `public/screenshots/README.md`
- **Documentation complète** : `SLIDER_COMMENT_CA_MARCHE.md`

---

## ⏱️ Temps Estimé

- **Captures** : 15-20 minutes
- **Optimisation** : 5 minutes
- **Activation** : 2 minutes
- **Total** : ~25 minutes

---

## ✅ Checklist Rapide

- [ ] Capture 1 prise et placée
- [ ] Capture 2 prise et placée
- [ ] Capture 3 prise et placée
- [ ] Capture 4 prise et placée
- [ ] Capture 5 prise et placée
- [ ] Images optimisées (< 500KB)
- [ ] Code Image décommenté
- [ ] Test sur localhost:3000
- [ ] ✨ Slider complet et fonctionnel !

---

**Prochaine action** : Prendre la première capture ! 📸

**Commencer par** : Capture 1 (la plus importante - montrer les 2 options)
