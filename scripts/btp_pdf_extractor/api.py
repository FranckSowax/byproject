#!/usr/bin/env python3
"""
API FastAPI pour l'extraction de données BTP depuis des PDF DQE

Usage:
    uvicorn api:app --host 0.0.0.0 --port 8000 --reload

Endpoints:
    POST /extract - Extrait les données d'un PDF
    GET /health - Vérification de santé
"""

import os
import tempfile
import logging
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from extractor import (
    ExtracteurGemini,
    ExtracteurPDFPlumber,
    ResultatExtraction,
    GEMINI_AVAILABLE,
    PDFPLUMBER_AVAILABLE
)

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Application FastAPI
app = FastAPI(
    title="BTP PDF Extractor API",
    description="API d'extraction de données BTP depuis des PDF DQE (Devis Quantitatif Estimatif)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS pour permettre les appels depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# MODÈLES DE DONNÉES
# ============================================================================

class ExtractionResponse(BaseModel):
    """Réponse de l'endpoint d'extraction"""
    success: bool
    fichier: str
    hash_fichier: str
    mode_extraction: str
    nb_pages: int
    nb_elements: int
    total_general: float
    devise: str
    elements: list
    resume_categories: dict
    resume_lots: dict
    resume_niveaux: dict
    erreurs: list


class HealthResponse(BaseModel):
    """Réponse du health check"""
    status: str
    pdfplumber_available: bool
    gemini_available: bool
    gemini_configured: bool


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Vérifie l'état de l'API et des dépendances"""
    gemini_configured = bool(
        os.getenv('GOOGLE_AI_API_KEY') or os.getenv('GEMINI_API_KEY')
    )

    return HealthResponse(
        status="healthy",
        pdfplumber_available=PDFPLUMBER_AVAILABLE,
        gemini_available=GEMINI_AVAILABLE,
        gemini_configured=gemini_configured
    )


@app.post("/extract", response_model=ExtractionResponse)
async def extract_pdf(
    file: UploadFile = File(..., description="Fichier PDF DQE à analyser"),
    mode: str = Query(
        default="auto",
        enum=["auto", "local", "gemini"],
        description="Mode d'extraction: auto (défaut), local (pdfplumber), gemini (API)"
    ),
    sector: str = Query(
        default="btp",
        description="Secteur d'activité (btp, import, commerce, etc.)"
    )
):
    """
    Extrait les données BTP d'un fichier PDF DQE.

    - **file**: Le fichier PDF à analyser (max 10MB recommandé)
    - **mode**: Le mode d'extraction à utiliser
      - `auto`: Utilise Gemini si disponible, sinon pdfplumber
      - `local`: Force l'utilisation de pdfplumber
      - `gemini`: Force l'utilisation de l'API Gemini
    - **sector**: Le secteur d'activité pour la catégorisation
    """
    # Vérifier le type de fichier
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Seuls les fichiers PDF sont acceptés"
        )

    # Vérifier la taille (limite à 20MB)
    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Fichier trop volumineux (max 20MB)"
        )

    # Déterminer le mode d'extraction
    actual_mode = mode
    if mode == "auto":
        if GEMINI_AVAILABLE and (os.getenv('GOOGLE_AI_API_KEY') or os.getenv('GEMINI_API_KEY')):
            actual_mode = "gemini"
        elif PDFPLUMBER_AVAILABLE:
            actual_mode = "local"
        else:
            raise HTTPException(
                status_code=503,
                detail="Aucun extracteur disponible. Configurez GEMINI_API_KEY ou installez pdfplumber."
            )

    if actual_mode == "gemini" and not GEMINI_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Mode gemini demandé mais google-generativeai n'est pas installé"
        )

    if actual_mode == "local" and not PDFPLUMBER_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Mode local demandé mais pdfplumber n'est pas installé"
        )

    # Sauvegarder temporairement le fichier
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp_file:
        tmp_file.write(contents)
        tmp_path = tmp_file.name

    try:
        logger.info(f"🚀 Extraction mode '{actual_mode}' pour: {file.filename}")

        # Extraction selon le mode
        if actual_mode == "gemini":
            extracteur = ExtracteurGemini(tmp_path)
        else:
            extracteur = ExtracteurPDFPlumber(tmp_path)

        resultat: ResultatExtraction = extracteur.extraire()

        logger.info(f"✅ Extraction terminée: {resultat.nb_elements} éléments")

        return ExtractionResponse(
            success=True,
            fichier=file.filename,
            hash_fichier=resultat.hash_fichier,
            mode_extraction=resultat.mode_extraction,
            nb_pages=resultat.nb_pages,
            nb_elements=resultat.nb_elements,
            total_general=resultat.total_general,
            devise=resultat.devise,
            elements=resultat.elements,
            resume_categories=resultat.resume_categories,
            resume_lots=resultat.resume_lots,
            resume_niveaux=resultat.resume_niveaux,
            erreurs=resultat.erreurs
        )

    except Exception as e:
        logger.error(f"❌ Erreur extraction: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'extraction: {str(e)}"
        )

    finally:
        # Nettoyer le fichier temporaire
        try:
            os.unlink(tmp_path)
        except:
            pass


@app.get("/categories")
async def get_categories():
    """Retourne la liste des catégories BTP disponibles"""
    return {
        "categories": [
            "Terrassement & VRD",
            "Béton & Gros œuvre",
            "Maçonnerie",
            "Charpente & Structure métallique",
            "Couverture & Étanchéité",
            "Menuiserie bois",
            "Menuiserie aluminium",
            "Menuiserie métallique",
            "Carrelage & Revêtements sols",
            "Revêtements muraux",
            "Plomberie & Sanitaire",
            "Électricité & Câblage",
            "Climatisation & Ventilation",
            "Peinture & Finitions",
            "Faux plafonds",
            "Serrurerie & Ferronnerie",
            "Vitrerie & Miroiterie",
            "Divers & Imprévus"
        ]
    }


# ============================================================================
# POINT D'ENTRÉE
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
