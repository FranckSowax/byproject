# BTP PDF Extractor

Système robuste d'extraction de données BTP depuis des PDF DQE (Devis Quantitatif Estimatif) gabonais/africains.

## Fonctionnalités

- **Extraction hybride**: pdfplumber (local) + Gemini API (production)
- **18 catégories BTP** pour classification automatique
- **Détection intelligente** des métadonnées (dosage, dimensions, niveaux)
- **Format monétaire FCFA** gabonais (espaces = milliers)
- **Export JSON + CSV**
- **API FastAPI** optionnelle pour intégration

## Installation

```bash
cd scripts/btp_pdf_extractor
pip install -r requirements.txt
```

## Configuration

Créez un fichier `.env` ou configurez les variables d'environnement:

```bash
# Pour le mode Gemini (recommandé)
export GOOGLE_AI_API_KEY="votre_clé_gemini"
# ou
export GEMINI_API_KEY="votre_clé_gemini"
```

## Utilisation

### En ligne de commande

```bash
# Mode automatique (Gemini si disponible, sinon pdfplumber)
python extractor.py mon_dqe.pdf

# Forcer le mode local (pdfplumber)
python extractor.py mon_dqe.pdf --mode local

# Forcer le mode Gemini
python extractor.py mon_dqe.pdf --mode gemini

# Choisir le format de sortie
python extractor.py mon_dqe.pdf --output json
python extractor.py mon_dqe.pdf --output csv
python extractor.py mon_dqe.pdf --output both  # défaut

# Spécifier le répertoire de sortie
python extractor.py mon_dqe.pdf --output-dir ./exports
```

### Via l'API FastAPI

```bash
# Démarrer le serveur
uvicorn api:app --host 0.0.0.0 --port 8000

# Ou directement
python api.py
```

Endpoints disponibles:
- `POST /extract` - Extrait les données d'un PDF
- `GET /health` - Vérification de santé
- `GET /categories` - Liste des catégories BTP
- `GET /docs` - Documentation Swagger

Exemple d'appel:
```bash
curl -X POST "http://localhost:8000/extract" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@mon_dqe.pdf" \
  -F "mode=auto"
```

### Via l'API Next.js (intégré à l'app)

```typescript
const formData = new FormData();
formData.append('file', pdfFile);

const response = await fetch('/api/ai/extract-btp-pdf', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.elements); // Liste des éléments extraits
```

## Structure des données

### Élément BTP extrait

```json
{
  "numero": "1.1.1",
  "designation": "Béton armé dosé à 350 kg/m³ pour semelles filantes",
  "categorie": "Béton & Gros œuvre",
  "sous_categorie": "Fondations",
  "unite": "m³",
  "quantite": 45.5,
  "prix_unitaire": 125000,
  "prix_total": 5687500,
  "lot_numero": "1",
  "lot_nom": "Gros œuvre",
  "niveau": "RDC",
  "dosage": "350 kg/m³",
  "dimensions": null,
  "epaisseur": null,
  "materiaux": ["ciment", "sable", "gravier", "acier HA"]
}
```

### Résultat complet

```json
{
  "success": true,
  "fichier": "dqe_projet.pdf",
  "hash_fichier": "a1b2c3d4e5f6",
  "mode_extraction": "gemini-2.0-flash",
  "nb_pages": 15,
  "nb_elements": 250,
  "total_general": 125000000,
  "devise": "FCFA",
  "elements": [...],
  "resume_categories": {
    "Béton & Gros œuvre": {"nombre": 45, "total": 55000000},
    "Maçonnerie": {"nombre": 20, "total": 15000000}
  },
  "resume_lots": {
    "1": {"nom": "Terrassement", "nombre": 15, "total": 8000000},
    "2": {"nom": "Gros œuvre", "nombre": 60, "total": 70000000}
  },
  "resume_niveaux": {
    "RDC": {"nombre": 80, "total": 50000000},
    "R+1": {"nombre": 70, "total": 45000000}
  },
  "erreurs": []
}
```

## Catégories BTP

1. Terrassement & VRD
2. Béton & Gros œuvre
3. Maçonnerie
4. Charpente & Structure métallique
5. Couverture & Étanchéité
6. Menuiserie bois
7. Menuiserie aluminium
8. Menuiserie métallique
9. Carrelage & Revêtements sols
10. Revêtements muraux
11. Plomberie & Sanitaire
12. Électricité & Câblage
13. Climatisation & Ventilation
14. Peinture & Finitions
15. Faux plafonds
16. Serrurerie & Ferronnerie
17. Vitrerie & Miroiterie
18. Divers & Imprévus

## Format monétaire FCFA

Le système gère le format gabonais/africain:
- **Espaces** comme séparateur de milliers: `1 234 567`
- **Virgule** comme séparateur décimal: `1 234,50`
- Symboles acceptés: `FCFA`, `F CFA`, `XAF`, `XOF`

## Détection automatique

### Niveaux de bâtiment
- Sous-sol (SS, Niveau -1)
- RDC (Rez-de-chaussée, Niveau 0)
- R+1, R+2, R+3 (Étages)
- Toiture/Terrasse

### Métadonnées techniques
- **Dosage béton**: `350 kg/m³`, `dosé à 350`
- **Dimensions**: `20x20x40`, `Ø12`
- **Épaisseur**: `15 cm`, `ép. 10 cm`

## Performance

| Mode | Vitesse | Précision | Coût |
|------|---------|-----------|------|
| pdfplumber | Rapide | Moyenne | Gratuit |
| Gemini | Modéré | Excellente | API |

Recommandation:
- **Documents structurés** (tableaux propres): pdfplumber
- **Documents complexes** (scans, mise en page variée): Gemini

## Logs

Les logs sont enregistrés dans `btp_extractor.log` avec horodatage.

```
2026-01-05 10:30:15 - INFO - 🚀 Démarrage extraction mode 'gemini' pour: dqe_projet.pdf
2026-01-05 10:30:16 - INFO - 📄 Fichier PDF reçu: dqe_projet.pdf (2.5 MB)
2026-01-05 10:30:45 - INFO - ✅ Réponse Gemini reçue: 45000 caractères
2026-01-05 10:30:45 - INFO - 📊 Extraction terminée: 250 éléments
2026-01-05 10:30:45 - INFO - 💰 Total: 125,000,000 FCFA
```

## Dépannage

### Erreur "Clé API Gemini requise"
Configurez `GOOGLE_AI_API_KEY` ou `GEMINI_API_KEY` dans vos variables d'environnement.

### Erreur "pdfplumber non installé"
```bash
pip install pdfplumber
```

### Extraction vide ou incomplète
1. Vérifiez que le PDF contient du texte extractible (pas un scan image)
2. Essayez le mode Gemini pour les PDF complexes
3. Vérifiez les logs pour les erreurs spécifiques

## Licence

MIT License - Libre d'utilisation et modification.
