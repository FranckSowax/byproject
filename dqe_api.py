"""
DQE Extractor - API FastAPI pour SaaS
=====================================
Endpoints REST pour l'extraction de DQE avec prévisualisation.

Endpoints:
- POST /dqe/upload      → Upload et analyse du fichier
- GET  /dqe/{id}/sheets → Liste des onglets avec aperçu
- POST /dqe/{id}/select → Sélectionner les onglets
- POST /dqe/{id}/extract → Extraire les données
- GET  /dqe/{id}/download → Télécharger le JSON

Installation:
    pip install fastapi uvicorn python-multipart pandas openpyxl

Lancement:
    uvicorn dqe_api:app --reload --port 8000
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import tempfile
import os
import json
import uuid
from datetime import datetime, timedelta
import asyncio

# Import du module d'extraction
from dqe_extractor_v2 import DQEExtractorV2


# =============================================================================
# CONFIGURATION
# =============================================================================

app = FastAPI(
    title="DQE Extractor API",
    description="API pour l'extraction de données DQE depuis des fichiers Excel",
    version="2.0.0"
)

# CORS pour le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stockage temporaire des sessions (en production: Redis/DB)
sessions: Dict[str, dict] = {}

# Configuration
SESSION_EXPIRY_HOURS = 2
UPLOAD_DIR = tempfile.gettempdir()


# =============================================================================
# MODÈLES PYDANTIC
# =============================================================================

class SelectSheetsRequest(BaseModel):
    """Requête de sélection des onglets"""
    sheet_names: Optional[List[str]] = None
    sheet_indices: Optional[List[int]] = None
    sheet_types: Optional[List[str]] = None
    exclude_names: Optional[List[str]] = None


class ExtractRequest(BaseModel):
    """Options d'extraction"""
    include_metadata: bool = True
    aggregate_materials: bool = False


class SheetToggleRequest(BaseModel):
    """Basculer un onglet"""
    sheet_name: str


# =============================================================================
# GESTION DES SESSIONS
# =============================================================================

def create_session(file_path: str, original_filename: str) -> str:
    """Crée une nouvelle session"""
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        "id": session_id,
        "file_path": file_path,
        "original_filename": original_filename,
        "created_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(hours=SESSION_EXPIRY_HOURS)).isoformat(),
        "extractor": None,
        "analysis": None,
        "extraction_result": None,
        "status": "uploaded"
    }
    return session_id


def get_session(session_id: str) -> dict:
    """Récupère une session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session non trouvée")
    
    session = sessions[session_id]
    
    # Vérifier expiration
    if datetime.fromisoformat(session["expires_at"]) < datetime.now():
        cleanup_session(session_id)
        raise HTTPException(status_code=410, detail="Session expirée")
    
    return session


def cleanup_session(session_id: str):
    """Nettoie une session"""
    if session_id in sessions:
        session = sessions[session_id]
        # Supprimer le fichier temporaire
        if os.path.exists(session.get("file_path", "")):
            os.remove(session["file_path"])
        del sessions[session_id]


async def cleanup_expired_sessions():
    """Tâche de nettoyage des sessions expirées"""
    while True:
        await asyncio.sleep(3600)  # Toutes les heures
        expired = [
            sid for sid, s in sessions.items()
            if datetime.fromisoformat(s["expires_at"]) < datetime.now()
        ]
        for sid in expired:
            cleanup_session(sid)


# =============================================================================
# ENDPOINTS
# =============================================================================

@app.post("/dqe/upload", summary="Upload et analyse d'un fichier DQE")
async def upload_dqe(file: UploadFile = File(...)):
    """
    Upload un fichier Excel DQE et retourne un aperçu des onglets.
    
    - **file**: Fichier Excel (.xlsx, .xls)
    
    Returns:
        - session_id: ID de session pour les opérations suivantes
        - analysis: Aperçu de tous les onglets
    """
    # Vérifier le type de fichier
    if not file.filename.endswith(('.xlsx', '.xls', '.xlsm')):
        raise HTTPException(
            status_code=400, 
            detail="Format de fichier non supporté. Utilisez .xlsx ou .xls"
        )
    
    # Sauvegarder le fichier
    file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
    
    try:
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Créer la session
        session_id = create_session(file_path, file.filename)
        session = sessions[session_id]
        
        # Analyser le fichier
        extractor = DQEExtractorV2(filepath=file_path)
        analysis = extractor.analyze()
        
        # Stocker dans la session
        session["extractor"] = extractor
        session["analysis"] = analysis
        session["status"] = "analyzed"
        
        return {
            "status": "success",
            "session_id": session_id,
            "message": f"Fichier '{file.filename}' analysé avec succès",
            "analysis": analysis
        }
        
    except Exception as e:
        # Nettoyer en cas d'erreur
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Erreur d'analyse: {str(e)}")


@app.get("/dqe/{session_id}/sheets", summary="Liste des onglets disponibles")
async def get_sheets(session_id: str):
    """
    Retourne la liste des onglets avec leur aperçu.
    """
    session = get_session(session_id)
    
    if not session.get("analysis"):
        raise HTTPException(status_code=400, detail="Fichier non encore analysé")
    
    extractor = session["extractor"]
    
    return {
        "session_id": session_id,
        "sheets": session["analysis"]["sheets"],
        "selection_status": extractor.get_selection_status()
    }


@app.post("/dqe/{session_id}/select", summary="Sélectionner les onglets à extraire")
async def select_sheets(session_id: str, request: SelectSheetsRequest):
    """
    Sélectionne les onglets à extraire.
    
    - **sheet_names**: Liste des noms d'onglets à inclure
    - **sheet_indices**: Liste des indices d'onglets à inclure
    - **sheet_types**: Types d'onglets ('detailed', 'summary', 'recap')
    - **exclude_names**: Noms d'onglets à exclure
    """
    session = get_session(session_id)
    extractor = session["extractor"]
    
    result = extractor.select_sheets(
        sheet_names=request.sheet_names,
        sheet_indices=request.sheet_indices,
        sheet_types=request.sheet_types,
        exclude_names=request.exclude_names
    )
    
    session["status"] = "selected"
    
    return {
        "session_id": session_id,
        "selection": result
    }


@app.post("/dqe/{session_id}/select/all", summary="Sélectionner tous les onglets")
async def select_all_sheets(session_id: str):
    """Sélectionne tous les onglets."""
    session = get_session(session_id)
    extractor = session["extractor"]
    
    result = extractor.select_all()
    session["status"] = "selected"
    
    return {"session_id": session_id, "selection": result}


@app.post("/dqe/{session_id}/select/none", summary="Désélectionner tous les onglets")
async def deselect_all_sheets(session_id: str):
    """Désélectionne tous les onglets."""
    session = get_session(session_id)
    extractor = session["extractor"]
    
    result = extractor.deselect_all()
    
    return {"session_id": session_id, "selection": result}


@app.post("/dqe/{session_id}/toggle", summary="Basculer la sélection d'un onglet")
async def toggle_sheet(session_id: str, request: SheetToggleRequest):
    """Bascule la sélection d'un onglet spécifique."""
    session = get_session(session_id)
    extractor = session["extractor"]
    
    result = extractor.toggle_sheet(request.sheet_name)
    
    return {"session_id": session_id, "selection": result}


@app.post("/dqe/{session_id}/extract", summary="Extraire les données")
async def extract_data(session_id: str, request: ExtractRequest = ExtractRequest()):
    """
    Extrait les données des onglets sélectionnés.
    
    - **include_metadata**: Inclure les métadonnées (date, référence, etc.)
    - **aggregate_materials**: Agréger les matériaux similaires
    """
    session = get_session(session_id)
    extractor = session["extractor"]
    
    # Vérifier qu'il y a des onglets sélectionnés
    if not extractor.selected_sheets:
        raise HTTPException(
            status_code=400, 
            detail="Aucun onglet sélectionné. Utilisez /select d'abord."
        )
    
    try:
        result = extractor.extract(include_metadata=request.include_metadata)
        
        # Ajouter l'agrégation si demandée
        if request.aggregate_materials:
            result["aggregated_materials"] = extractor.aggregate_by_material()
        
        session["extraction_result"] = result
        session["status"] = "extracted"
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur d'extraction: {str(e)}")


@app.get("/dqe/{session_id}/download", summary="Télécharger le JSON extrait")
async def download_json(session_id: str):
    """Télécharge le résultat de l'extraction au format JSON."""
    session = get_session(session_id)
    
    if not session.get("extraction_result"):
        raise HTTPException(
            status_code=400, 
            detail="Aucune extraction effectuée. Utilisez /extract d'abord."
        )
    
    # Créer le fichier JSON
    json_path = os.path.join(UPLOAD_DIR, f"dqe_extract_{session_id}.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(session["extraction_result"], f, ensure_ascii=False, indent=2)
    
    return FileResponse(
        path=json_path,
        filename=f"dqe_extract_{session['original_filename'].replace('.xlsx', '')}.json",
        media_type="application/json"
    )


@app.get("/dqe/{session_id}/materials", summary="Liste des matériaux extraits")
async def get_materials(session_id: str, aggregate: bool = False):
    """
    Retourne la liste des matériaux extraits.
    
    - **aggregate**: Agréger les matériaux similaires
    """
    session = get_session(session_id)
    extractor = session["extractor"]
    
    if not session.get("extraction_result"):
        raise HTTPException(
            status_code=400, 
            detail="Aucune extraction effectuée. Utilisez /extract d'abord."
        )
    
    if aggregate:
        return {"materials": extractor.aggregate_by_material()}
    else:
        return {"materials": extractor.get_all_materials()}


@app.delete("/dqe/{session_id}", summary="Supprimer une session")
async def delete_session(session_id: str):
    """Supprime une session et ses fichiers associés."""
    get_session(session_id)  # Vérifie que la session existe
    cleanup_session(session_id)
    
    return {"status": "deleted", "session_id": session_id}


@app.get("/dqe/{session_id}/status", summary="Statut de la session")
async def get_status(session_id: str):
    """Retourne le statut actuel de la session."""
    session = get_session(session_id)
    
    return {
        "session_id": session_id,
        "status": session["status"],
        "original_filename": session["original_filename"],
        "created_at": session["created_at"],
        "expires_at": session["expires_at"],
        "has_analysis": session.get("analysis") is not None,
        "has_extraction": session.get("extraction_result") is not None
    }


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/health", summary="Health check")
async def health_check():
    """Vérifie que l'API est opérationnelle."""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "active_sessions": len(sessions)
    }


# =============================================================================
# STARTUP
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Démarre les tâches de fond."""
    asyncio.create_task(cleanup_expired_sessions())


# =============================================================================
# EXEMPLE D'UTILISATION (pour tests)
# =============================================================================

"""
# Exemple de workflow complet avec curl:

# 1. Upload et analyse
curl -X POST "http://localhost:8000/dqe/upload" \
     -F "file=@DQE_ACHAT_CHINE.xlsx"

# Réponse: { "session_id": "abc-123", "analysis": {...} }

# 2. Voir les onglets disponibles
curl "http://localhost:8000/dqe/abc-123/sheets"

# 3. Sélectionner les onglets (ex: uniquement les détaillés)
curl -X POST "http://localhost:8000/dqe/abc-123/select" \
     -H "Content-Type: application/json" \
     -d '{"sheet_types": ["detailed"]}'

# 4. Extraire les données
curl -X POST "http://localhost:8000/dqe/abc-123/extract" \
     -H "Content-Type: application/json" \
     -d '{"include_metadata": true}'

# 5. Télécharger le JSON
curl "http://localhost:8000/dqe/abc-123/download" -o extraction.json
"""
