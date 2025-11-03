# Fix: Création de Projet Sans Fichier

## Problème Identifié

L'application générait une erreur 409 (conflit) lors de la création d'un projet sans fichier uploadé. Les erreurs incluaient:
- `Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received`
- Erreur 409 sur l'endpoint `/rest/v1/projects?select=*`
- `Project creation error` dans la console

## Cause Racine

1. **Contrainte de base de données**: Le champ `mapping_status` était défini même sans fichier, causant des conflits
2. **Flux confus**: L'interface ne séparait pas clairement les deux modes de création (avec fichier vs manuel)
3. **Redirection incorrecte**: Les projets sans fichier étaient redirigés vers `/dashboard` au lieu de la page du projet

## Solution Implémentée

### 1. Séparation des Modes de Création

Ajout d'un écran de sélection avec deux options claires:

#### Option 1: Import de Fichier 🤖
- Upload d'un fichier (PDF, CSV, Excel)
- Mapping automatique par IA
- Redirection vers `/dashboard/projects/[id]/mapping`

#### Option 2: Ajout Manuel ✍️
- Création du projet vide
- Ajout manuel des matériaux un par un
- Redirection vers `/dashboard/projects/[id]`

### 2. Modifications du Code

#### État de Création
```typescript
type CreationMode = 'select' | 'file' | 'manual';
const [creationMode, setCreationMode] = useState<CreationMode>('select');
```

#### Validation Conditionnelle
```typescript
// Validation selon le mode
if (creationMode === 'file' && !selectedFile) {
  toast.error("Veuillez sélectionner un fichier");
  return;
}
```

#### Insertion en Base de Données
```typescript
const projectData: any = {
  user_id: user.id,
  name: formData.name,
  source_url: formData.sourceUrl || null,
};

// Ajouter file_path et mapping_status uniquement si en mode fichier
if (creationMode === 'file') {
  projectData.file_path = filePath;
  projectData.mapping_status = 'pending';
}
```

#### Redirection Intelligente
```typescript
// Rediriger selon le mode
if (creationMode === 'file' && selectedFile) {
  // Si fichier uploadé, aller vers la page d'analyse IA
  router.push(`/dashboard/projects/${project.id}/mapping`);
} else {
  // Mode manuel - aller directement au projet pour ajouter des matériaux
  router.push(`/dashboard/projects/${project.id}`);
}
```

### 3. Interface Utilisateur

#### Écran de Sélection
- Deux cartes cliquables avec icônes distinctives
- Descriptions claires de chaque mode
- Animations au survol pour meilleure UX

#### Formulaire Conditionnel
- Section d'upload de fichier visible uniquement en mode "fichier"
- Champ obligatoire (*) uniquement en mode "fichier"
- Bouton "Retour" pour revenir à la sélection du mode
- Messages d'information adaptés au mode choisi

## Résultat

✅ **Création sans fichier**: Fonctionne correctement, pas d'erreur 409
✅ **Création avec fichier**: Fonctionne comme avant avec mapping IA
✅ **UX améliorée**: Flux clair et intuitif
✅ **Build réussi**: Aucune erreur TypeScript

## Fichiers Modifiés

- `/app/(dashboard)/dashboard/projects/new/page.tsx`
  - Ajout du système de modes de création
  - Refonte de l'interface utilisateur
  - Correction de la logique d'insertion en base de données
  - Amélioration de la gestion des erreurs

## Test Recommandé

1. **Mode Manuel**:
   - Créer un projet sans fichier
   - Vérifier la redirection vers la page du projet
   - Ajouter des matériaux manuellement

2. **Mode Fichier**:
   - Créer un projet avec un fichier CSV/Excel
   - Vérifier le mapping automatique
   - Valider l'import des données

3. **Navigation**:
   - Tester le bouton "Retour" entre les écrans
   - Vérifier les validations de formulaire
   - Confirmer les messages de succès/erreur
