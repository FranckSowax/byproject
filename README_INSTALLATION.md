# DQE Extractor - Guide d'Installation SaaS

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  (React/Next.js - DQEExtractor.tsx)                         │
│                                                              │
│  1. Upload fichier ──────────────────────────────────────┐  │
│  2. Afficher aperçu des onglets                          │  │
│  3. Sélection interactive                                │  │
│  4. Lancer extraction                                    │  │
│  5. Télécharger JSON                                     │  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API                                  │
│  (FastAPI - dqe_api.py)                                     │
│                                                              │
│  POST /dqe/upload      → Upload + Analyse                   │
│  GET  /dqe/{id}/sheets → Liste onglets                      │
│  POST /dqe/{id}/select → Sélection                          │
│  POST /dqe/{id}/extract → Extraction                        │
│  GET  /dqe/{id}/download → Télécharger JSON                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      MODULE CORE                             │
│  (Python - dqe_extractor_v2.py)                             │
│                                                              │
│  DQEExtractorV2.analyze()    → Prévisualisation             │
│  DQEExtractorV2.select_sheets() → Sélection                 │
│  DQEExtractorV2.extract()    → Extraction JSON              │
└─────────────────────────────────────────────────────────────┘
```

## Installation Backend

### 1. Dépendances Python

```bash
pip install fastapi uvicorn python-multipart pandas openpyxl
```

### 2. Structure des fichiers

```
backend/
├── dqe_extractor_v2.py    # Module core
├── dqe_api.py             # API FastAPI
└── requirements.txt
```

### 3. Lancer l'API

```bash
# Développement
uvicorn dqe_api:app --reload --port 8000

# Production
uvicorn dqe_api:app --host 0.0.0.0 --port 8000 --workers 4
```

## Installation Frontend (Next.js)

### 1. Copier le composant

```bash
cp DQEExtractor.tsx app/components/
```

### 2. Dépendances

```bash
npm install lucide-react
```

### 3. Variables d'environnement

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Utilisation

```tsx
import DQEExtractor from '@/components/DQEExtractor';

export default function Page() {
  return <DQEExtractor />;
}
```

## Workflow API (curl)

```bash
# 1. Upload
curl -X POST "http://localhost:8000/dqe/upload" \
     -F "file=@DQE_ACHAT_CHINE.xlsx"
# Réponse: { "session_id": "abc-123", "analysis": {...} }

# 2. Voir les onglets
curl "http://localhost:8000/dqe/abc-123/sheets"

# 3. Sélectionner (ex: uniquement les détaillés)
curl -X POST "http://localhost:8000/dqe/abc-123/select" \
     -H "Content-Type: application/json" \
     -d '{"sheet_types": ["detailed"]}'

# 4. Extraire
curl -X POST "http://localhost:8000/dqe/abc-123/extract"

# 5. Télécharger
curl "http://localhost:8000/dqe/abc-123/download" -o result.json
```

## Intégration Supabase (optionnel)

Pour persister les sessions et résultats:

```sql
CREATE TABLE dqe_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  original_filename TEXT,
  analysis JSONB,
  extraction_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 hours'
);
```

## Production Checklist

- [ ] Configurer CORS correctement dans `dqe_api.py`
- [ ] Ajouter authentification (JWT)
- [ ] Utiliser Redis pour les sessions
- [ ] Configurer Nginx en reverse proxy
- [ ] Ajouter rate limiting
- [ ] Logger les erreurs (Sentry)
