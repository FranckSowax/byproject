#!/usr/bin/env python3
"""
Extracteur BTP - Système robuste d'extraction de données depuis des PDF DQE
Utilise pdfplumber (local) + Gemini API (production)

Usage:
    python extractor.py <fichier.pdf> [--mode local|gemini] [--output json|csv|both]
"""

import os
import sys
import json
import csv
import re
import hashlib
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

# Imports conditionnels
try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False
    print("⚠️ pdfplumber non installé. Installez avec: pip install pdfplumber")

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️ google-generativeai non installé. Installez avec: pip install google-generativeai")


# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('btp_extractor.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)


# ============================================================================
# CATÉGORIES BTP
# ============================================================================

class CategorieBTP(Enum):
    """Catégories standards BTP pour classification des éléments"""
    TERRASSEMENT = "Terrassement & VRD"
    BETON = "Béton & Gros œuvre"
    MACONNERIE = "Maçonnerie"
    CHARPENTE = "Charpente & Structure métallique"
    COUVERTURE = "Couverture & Étanchéité"
    MENUISERIE_BOIS = "Menuiserie bois"
    MENUISERIE_ALU = "Menuiserie aluminium"
    MENUISERIE_METAL = "Menuiserie métallique"
    CARRELAGE = "Carrelage & Revêtements sols"
    REVETEMENT_MUR = "Revêtements muraux"
    PLOMBERIE = "Plomberie & Sanitaire"
    ELECTRICITE = "Électricité & Câblage"
    CLIMATISATION = "Climatisation & Ventilation"
    PEINTURE = "Peinture & Finitions"
    FAUX_PLAFOND = "Faux plafonds"
    SERRURERIE = "Serrurerie & Ferronnerie"
    VITRERIE = "Vitrerie & Miroiterie"
    DIVERS = "Divers & Imprévus"


# Mots-clés pour la catégorisation automatique
KEYWORDS_CATEGORIES = {
    CategorieBTP.TERRASSEMENT: [
        'terrassement', 'fouille', 'remblai', 'déblai', 'excavation',
        'décapage', 'nivellement', 'vrd', 'voirie', 'assainissement',
        'tranchée', 'compactage', 'grave'
    ],
    CategorieBTP.BETON: [
        'béton', 'beton', 'armé', 'coffrage', 'ferraillage', 'armature',
        'poteau', 'poutre', 'dalle', 'radier', 'fondation', 'semelle',
        'longrine', 'chaînage', 'linteau', 'acrotère', 'voile',
        'dosage', 'ciment', 'gravier', 'sable', 'granulat'
    ],
    CategorieBTP.MACONNERIE: [
        'maçonnerie', 'maconnerie', 'parpaing', 'agglo', 'brique',
        'mur', 'cloison', 'élévation', 'hourdis', 'bloc', 'moellon'
    ],
    CategorieBTP.CHARPENTE: [
        'charpente', 'structure', 'métallique', 'acier', 'ipn', 'ipe',
        'hea', 'heb', 'tube', 'cornière', 'plat', 'profilé', 'ossature'
    ],
    CategorieBTP.COUVERTURE: [
        'couverture', 'toiture', 'étanchéité', 'tôle', 'bac', 'tuile',
        'zinc', 'gouttière', 'chéneau', 'descente', 'faîtage', 'rive',
        'noue', 'solin', 'membrane', 'bitume'
    ],
    CategorieBTP.MENUISERIE_BOIS: [
        'menuiserie bois', 'porte bois', 'fenêtre bois', 'placard',
        'parquet', 'lambris', 'escalier bois', 'main courante bois'
    ],
    CategorieBTP.MENUISERIE_ALU: [
        'aluminium', 'alu', 'baie vitrée', 'coulissant', 'fenêtre alu',
        'porte alu', 'mur rideau', 'façade alu'
    ],
    CategorieBTP.MENUISERIE_METAL: [
        'menuiserie métallique', 'porte métallique', 'grille', 'portail',
        'garde-corps', 'rampe', 'main courante métal'
    ],
    CategorieBTP.CARRELAGE: [
        'carrelage', 'faïence', 'grès', 'céramique', 'sol', 'plinthe',
        'mosaïque', 'granito', 'marbre sol', 'pierre sol'
    ],
    CategorieBTP.REVETEMENT_MUR: [
        'revêtement mural', 'enduit', 'crépi', 'stuc', 'papier peint',
        'lambris mural', 'bardage', 'habillage'
    ],
    CategorieBTP.PLOMBERIE: [
        'plomberie', 'sanitaire', 'tuyau', 'canalisation', 'pvc',
        'wc', 'lavabo', 'douche', 'baignoire', 'robinet', 'mitigeur',
        'évacuation', 'alimentation', 'eau chaude', 'eau froide',
        'chauffe-eau', 'cumulus', 'réservoir'
    ],
    CategorieBTP.ELECTRICITE: [
        'électricité', 'electricite', 'câble', 'fil', 'gaine',
        'tableau', 'disjoncteur', 'prise', 'interrupteur', 'spot',
        'luminaire', 'éclairage', 'chemin de câble', 'conduit'
    ],
    CategorieBTP.CLIMATISATION: [
        'climatisation', 'clim', 'ventilation', 'vmc', 'split',
        'gainable', 'gaine', 'diffuseur', 'extraction', 'soufflage'
    ],
    CategorieBTP.PEINTURE: [
        'peinture', 'impression', 'sous-couche', 'finition', 'laque',
        'acrylique', 'glycéro', 'vernis', 'lasure', 'badigeon'
    ],
    CategorieBTP.FAUX_PLAFOND: [
        'faux plafond', 'plafond suspendu', 'dalle plafond', 'ba13',
        'placo', 'gyproc', 'staff', 'ossature suspendue'
    ],
    CategorieBTP.SERRURERIE: [
        'serrurerie', 'ferronnerie', 'serrure', 'poignée', 'verrou',
        'ferme-porte', 'gond', 'paumelle', 'crémone'
    ],
    CategorieBTP.VITRERIE: [
        'vitrerie', 'verre', 'vitrage', 'miroir', 'double vitrage',
        'feuilleté', 'trempé', 'sécurit'
    ],
}


# ============================================================================
# STRUCTURES DE DONNÉES
# ============================================================================

@dataclass
class ElementBTP:
    """Structure d'un élément/poste BTP extrait"""
    numero: str                          # Numéro du poste (ex: "1.1", "2.3.1")
    designation: str                     # Description complète
    categorie: str                       # Catégorie BTP
    sous_categorie: Optional[str]        # Sous-catégorie si applicable
    unite: str                           # Unité de mesure (m², ml, u, kg, etc.)
    quantite: float                      # Quantité
    prix_unitaire: Optional[float]       # Prix unitaire en FCFA
    prix_total: Optional[float]          # Prix total en FCFA
    lot_numero: Optional[str]            # Numéro du lot
    lot_nom: Optional[str]               # Nom du lot
    niveau: Optional[str]                # Niveau du bâtiment (SS, RDC, R+1, etc.)
    # Métadonnées techniques
    dosage: Optional[str]                # Dosage béton (ex: "350 kg/m³")
    dimensions: Optional[str]            # Dimensions (ex: "20x20x40")
    materiaux: Optional[List[str]]       # Liste des matériaux
    epaisseur: Optional[str]             # Épaisseur (ex: "15 cm")

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ResultatExtraction:
    """Résultat complet de l'extraction"""
    fichier: str
    hash_fichier: str
    date_extraction: str
    mode_extraction: str                  # 'pdfplumber' ou 'gemini'
    nb_pages: int
    nb_elements: int
    elements: List[Dict]
    resume_categories: Dict[str, Dict]    # Agrégation par catégorie
    resume_lots: Dict[str, Dict]          # Agrégation par lot
    resume_niveaux: Dict[str, Dict]       # Agrégation par niveau
    total_general: float
    devise: str
    erreurs: List[str]

    def to_dict(self) -> Dict:
        return asdict(self)


# ============================================================================
# UTILITAIRES
# ============================================================================

def calculer_hash_fichier(filepath: str) -> str:
    """Calcule le hash SHA256 du fichier pour traçabilité"""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()[:16]


def parser_montant_fcfa(valeur: str) -> Optional[float]:
    """
    Parse un montant au format FCFA gabonais/africain
    Exemples: "1 234 567", "1.234.567", "1,234,567", "1234567"
    """
    if not valeur or not isinstance(valeur, str):
        return None

    # Nettoyer la chaîne
    valeur = valeur.strip()
    valeur = re.sub(r'[FCFA\s€$]', '', valeur, flags=re.IGNORECASE)

    # Détecter le format
    # Format avec espaces comme séparateur de milliers (ex: "1 234 567")
    if re.match(r'^\d{1,3}(\s\d{3})*([,\.]\d+)?$', valeur):
        valeur = valeur.replace(' ', '')

    # Format avec points comme séparateur de milliers (ex: "1.234.567")
    if re.match(r'^\d{1,3}(\.\d{3})+$', valeur):
        valeur = valeur.replace('.', '')

    # Format avec virgule comme séparateur décimal
    valeur = valeur.replace(',', '.')

    # Supprimer les points multiples (garder le dernier comme décimal)
    parts = valeur.split('.')
    if len(parts) > 2:
        valeur = ''.join(parts[:-1]) + '.' + parts[-1]

    try:
        return float(valeur)
    except ValueError:
        return None


def detecter_niveau(texte: str) -> Optional[str]:
    """Détecte le niveau du bâtiment dans un texte"""
    texte_lower = texte.lower()

    patterns = [
        (r'sous[- ]?sol|ss\b|niveau -1', 'Sous-sol'),
        (r'rdc|rez[- ]?de[- ]?chauss[ée]e|niveau 0', 'RDC'),
        (r'r\+1|1er étage|niveau 1|étage 1', 'R+1'),
        (r'r\+2|2[èe]me étage|niveau 2|étage 2', 'R+2'),
        (r'r\+3|3[èe]me étage|niveau 3|étage 3', 'R+3'),
        (r'toiture|terrasse|couverture', 'Toiture'),
    ]

    for pattern, niveau in patterns:
        if re.search(pattern, texte_lower):
            return niveau

    return None


def detecter_dosage(texte: str) -> Optional[str]:
    """Détecte le dosage béton dans un texte"""
    patterns = [
        r'(\d{3})\s*kg\s*/?\s*m[³3]',  # "350 kg/m³"
        r'dosage\s*:?\s*(\d{3})',       # "dosage: 350"
        r'dos[ée]\s*[àa]\s*(\d{3})',    # "dosé à 350"
    ]

    for pattern in patterns:
        match = re.search(pattern, texte, re.IGNORECASE)
        if match:
            return f"{match.group(1)} kg/m³"

    return None


def detecter_dimensions(texte: str) -> Optional[str]:
    """Détecte les dimensions dans un texte"""
    patterns = [
        r'(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)',  # "20x20x40"
        r'(\d+)\s*[xX×]\s*(\d+)',                    # "20x20"
        r'[ØøD]\s*(\d+)',                            # "Ø12" ou "D12"
        r'(\d+)\s*mm',                               # "12 mm"
    ]

    for pattern in patterns:
        match = re.search(pattern, texte)
        if match:
            return match.group(0)

    return None


def detecter_epaisseur(texte: str) -> Optional[str]:
    """Détecte l'épaisseur dans un texte"""
    patterns = [
        r'[ée]p(?:aisseur)?\.?\s*:?\s*(\d+)\s*(?:cm|mm)',
        r'(\d+)\s*cm\s*d[\'']?[ée]paisseur',
        r'e\s*=\s*(\d+)\s*(?:cm|mm)',
    ]

    for pattern in patterns:
        match = re.search(pattern, texte, re.IGNORECASE)
        if match:
            return match.group(0)

    return None


def categoriser_element(designation: str) -> Tuple[str, Optional[str]]:
    """
    Catégorise automatiquement un élément BTP selon sa désignation
    Retourne (catégorie, sous_catégorie)
    """
    designation_lower = designation.lower()

    # Chercher la meilleure correspondance
    meilleur_score = 0
    meilleure_categorie = CategorieBTP.DIVERS

    for categorie, keywords in KEYWORDS_CATEGORIES.items():
        score = sum(1 for kw in keywords if kw in designation_lower)
        if score > meilleur_score:
            meilleur_score = score
            meilleure_categorie = categorie

    # Sous-catégorie basée sur des mots-clés spécifiques
    sous_categorie = None
    if meilleure_categorie == CategorieBTP.BETON:
        if 'armé' in designation_lower or 'ferraillage' in designation_lower:
            sous_categorie = "Béton armé"
        elif 'propreté' in designation_lower:
            sous_categorie = "Béton de propreté"
        elif 'fondation' in designation_lower or 'semelle' in designation_lower:
            sous_categorie = "Fondations"
        elif 'dalle' in designation_lower:
            sous_categorie = "Dalles"
        elif 'poteau' in designation_lower:
            sous_categorie = "Poteaux"
        elif 'poutre' in designation_lower:
            sous_categorie = "Poutres"

    return meilleure_categorie.value, sous_categorie


# ============================================================================
# EXTRACTEUR PDFPLUMBER (LOCAL)
# ============================================================================

class ExtracteurPDFPlumber:
    """Extraction de données BTP avec pdfplumber (mode local)"""

    def __init__(self, filepath: str):
        self.filepath = filepath
        self.elements: List[ElementBTP] = []
        self.erreurs: List[str] = []
        self.lot_courant = None
        self.lot_nom_courant = None

    def extraire(self) -> ResultatExtraction:
        """Extrait toutes les données du PDF"""
        logger.info(f"🔄 Extraction pdfplumber: {self.filepath}")

        if not PDFPLUMBER_AVAILABLE:
            raise ImportError("pdfplumber n'est pas installé")

        hash_fichier = calculer_hash_fichier(self.filepath)

        with pdfplumber.open(self.filepath) as pdf:
            nb_pages = len(pdf.pages)
            logger.info(f"📄 {nb_pages} pages détectées")

            for i, page in enumerate(pdf.pages):
                logger.info(f"📖 Traitement page {i+1}/{nb_pages}")
                self._traiter_page(page, i+1)

        # Calculer les résumés
        resume_categories = self._calculer_resume_categories()
        resume_lots = self._calculer_resume_lots()
        resume_niveaux = self._calculer_resume_niveaux()
        total_general = sum(e.prix_total or 0 for e in self.elements)

        return ResultatExtraction(
            fichier=Path(self.filepath).name,
            hash_fichier=hash_fichier,
            date_extraction=datetime.now().isoformat(),
            mode_extraction='pdfplumber',
            nb_pages=nb_pages,
            nb_elements=len(self.elements),
            elements=[e.to_dict() for e in self.elements],
            resume_categories=resume_categories,
            resume_lots=resume_lots,
            resume_niveaux=resume_niveaux,
            total_general=total_general,
            devise='FCFA',
            erreurs=self.erreurs
        )

    def _traiter_page(self, page, num_page: int):
        """Traite une page du PDF"""
        # Extraire les tableaux
        tables = page.extract_tables()

        if tables:
            for table in tables:
                self._traiter_tableau(table)
        else:
            # Si pas de tableau, extraire le texte brut
            texte = page.extract_text()
            if texte:
                self._traiter_texte_brut(texte)

    def _traiter_tableau(self, table: List[List[str]]):
        """Traite un tableau extrait"""
        if not table or len(table) < 2:
            return

        # Détecter les colonnes
        headers = [str(h).lower() if h else '' for h in table[0]]

        col_numero = self._trouver_colonne(headers, ['n°', 'no', 'num', 'ref', 'poste'])
        col_designation = self._trouver_colonne(headers, ['désignation', 'designation', 'libellé', 'libelle', 'description'])
        col_unite = self._trouver_colonne(headers, ['u', 'unité', 'unite', 'unit'])
        col_quantite = self._trouver_colonne(headers, ['qté', 'qte', 'quantité', 'quantite', 'qty'])
        col_pu = self._trouver_colonne(headers, ['p.u', 'pu', 'prix unit', 'unitaire'])
        col_total = self._trouver_colonne(headers, ['total', 'montant', 'prix total', 'pt'])

        # Traiter chaque ligne
        for row in table[1:]:
            if not row or all(not cell for cell in row):
                continue

            # Détecter si c'est un titre de lot
            premiere_cellule = str(row[0]) if row[0] else ''
            if self._est_titre_lot(premiere_cellule):
                self.lot_courant, self.lot_nom_courant = self._extraire_lot(premiere_cellule)
                continue

            # Extraire les données
            try:
                numero = str(row[col_numero]) if col_numero is not None and row[col_numero] else ''
                designation = str(row[col_designation]) if col_designation is not None and row[col_designation] else ''

                if not designation or len(designation) < 3:
                    continue

                unite = str(row[col_unite]) if col_unite is not None and row[col_unite] else ''
                quantite = parser_montant_fcfa(str(row[col_quantite])) if col_quantite is not None and row[col_quantite] else 0
                prix_unitaire = parser_montant_fcfa(str(row[col_pu])) if col_pu is not None and row[col_pu] else None
                prix_total = parser_montant_fcfa(str(row[col_total])) if col_total is not None and row[col_total] else None

                # Catégorisation automatique
                categorie, sous_categorie = categoriser_element(designation)

                # Métadonnées
                niveau = detecter_niveau(designation)
                dosage = detecter_dosage(designation)
                dimensions = detecter_dimensions(designation)
                epaisseur = detecter_epaisseur(designation)

                element = ElementBTP(
                    numero=numero,
                    designation=designation,
                    categorie=categorie,
                    sous_categorie=sous_categorie,
                    unite=unite,
                    quantite=quantite or 0,
                    prix_unitaire=prix_unitaire,
                    prix_total=prix_total,
                    lot_numero=self.lot_courant,
                    lot_nom=self.lot_nom_courant,
                    niveau=niveau,
                    dosage=dosage,
                    dimensions=dimensions,
                    materiaux=None,
                    epaisseur=epaisseur
                )

                self.elements.append(element)

            except Exception as e:
                self.erreurs.append(f"Erreur ligne: {str(e)}")

    def _traiter_texte_brut(self, texte: str):
        """Traite du texte brut (fallback)"""
        # Patterns pour détecter les lignes de poste
        pattern_poste = r'^(\d+(?:\.\d+)*)\s+(.+?)\s+(m[²³l]?|u|kg|ml|l|ens|ft)\s+([\d\s,\.]+)\s+([\d\s,\.]+)\s+([\d\s,\.]+)'

        for ligne in texte.split('\n'):
            match = re.match(pattern_poste, ligne, re.IGNORECASE)
            if match:
                numero, designation, unite, qte, pu, total = match.groups()

                categorie, sous_categorie = categoriser_element(designation)

                element = ElementBTP(
                    numero=numero,
                    designation=designation.strip(),
                    categorie=categorie,
                    sous_categorie=sous_categorie,
                    unite=unite,
                    quantite=parser_montant_fcfa(qte) or 0,
                    prix_unitaire=parser_montant_fcfa(pu),
                    prix_total=parser_montant_fcfa(total),
                    lot_numero=self.lot_courant,
                    lot_nom=self.lot_nom_courant,
                    niveau=detecter_niveau(designation),
                    dosage=detecter_dosage(designation),
                    dimensions=detecter_dimensions(designation),
                    materiaux=None,
                    epaisseur=detecter_epaisseur(designation)
                )

                self.elements.append(element)

    def _trouver_colonne(self, headers: List[str], keywords: List[str]) -> Optional[int]:
        """Trouve l'index d'une colonne basé sur des mots-clés"""
        for i, header in enumerate(headers):
            for kw in keywords:
                if kw in header:
                    return i
        return None

    def _est_titre_lot(self, texte: str) -> bool:
        """Vérifie si le texte est un titre de lot"""
        patterns = [
            r'^lot\s*[n°]*\s*\d+',
            r'^[ivxlcdm]+[\.\s]+',  # Numérotation romaine
            r'^chapitre\s*\d+',
        ]
        texte_lower = texte.lower().strip()
        return any(re.match(p, texte_lower) for p in patterns)

    def _extraire_lot(self, texte: str) -> Tuple[Optional[str], Optional[str]]:
        """Extrait le numéro et nom du lot"""
        match = re.match(r'^lot\s*[n°]*\s*(\d+)\s*[:\-]?\s*(.*)$', texte, re.IGNORECASE)
        if match:
            return match.group(1), match.group(2).strip() or None
        return None, texte.strip()

    def _calculer_resume_categories(self) -> Dict[str, Dict]:
        """Agrège les éléments par catégorie"""
        resume = {}
        for e in self.elements:
            cat = e.categorie
            if cat not in resume:
                resume[cat] = {'nombre': 0, 'total': 0}
            resume[cat]['nombre'] += 1
            resume[cat]['total'] += e.prix_total or 0
        return resume

    def _calculer_resume_lots(self) -> Dict[str, Dict]:
        """Agrège les éléments par lot"""
        resume = {}
        for e in self.elements:
            lot = e.lot_numero or 'Non défini'
            if lot not in resume:
                resume[lot] = {'nom': e.lot_nom, 'nombre': 0, 'total': 0}
            resume[lot]['nombre'] += 1
            resume[lot]['total'] += e.prix_total or 0
        return resume

    def _calculer_resume_niveaux(self) -> Dict[str, Dict]:
        """Agrège les éléments par niveau"""
        resume = {}
        for e in self.elements:
            niv = e.niveau or 'Non défini'
            if niv not in resume:
                resume[niv] = {'nombre': 0, 'total': 0}
            resume[niv]['nombre'] += 1
            resume[niv]['total'] += e.prix_total or 0
        return resume


# ============================================================================
# EXTRACTEUR GEMINI API (PRODUCTION)
# ============================================================================

class ExtracteurGemini:
    """Extraction de données BTP avec l'API Gemini (mode production)"""

    CATEGORIES_BTP = [
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

    def __init__(self, filepath: str, api_key: Optional[str] = None):
        self.filepath = filepath
        self.api_key = api_key or os.getenv('GOOGLE_AI_API_KEY') or os.getenv('GEMINI_API_KEY')
        self.erreurs: List[str] = []

        if not self.api_key:
            raise ValueError("Clé API Gemini requise (GOOGLE_AI_API_KEY ou GEMINI_API_KEY)")

        if not GEMINI_AVAILABLE:
            raise ImportError("google-generativeai n'est pas installé")

        genai.configure(api_key=self.api_key)

    def extraire(self) -> ResultatExtraction:
        """Extrait toutes les données du PDF via Gemini"""
        logger.info(f"🤖 Extraction Gemini: {self.filepath}")

        hash_fichier = calculer_hash_fichier(self.filepath)

        # Lire le PDF en bytes
        with open(self.filepath, 'rb') as f:
            pdf_bytes = f.read()

        # Créer le modèle
        model = genai.GenerativeModel('gemini-2.0-flash-exp')

        # Prompt optimisé pour l'extraction BTP
        prompt = self._construire_prompt()

        try:
            # Envoyer le PDF à Gemini
            response = model.generate_content([
                prompt,
                {
                    'mime_type': 'application/pdf',
                    'data': pdf_bytes
                }
            ],
            generation_config={
                'temperature': 0.1,
                'max_output_tokens': 32000,
                'response_mime_type': 'application/json'
            })

            # Parser la réponse JSON
            result_text = response.text
            logger.info(f"📥 Réponse Gemini reçue: {len(result_text)} caractères")

            # Nettoyer et parser le JSON
            result = self._parser_reponse(result_text)

            if not result:
                raise ValueError("Impossible de parser la réponse Gemini")

            # Construire le résultat
            elements = result.get('elements', [])
            nb_pages = result.get('nb_pages', 0)

            # Valider et enrichir les éléments
            elements_valides = self._valider_elements(elements)

            # Calculer les résumés
            resume_categories = self._calculer_resume(elements_valides, 'categorie')
            resume_lots = self._calculer_resume_lots(elements_valides)
            resume_niveaux = self._calculer_resume(elements_valides, 'niveau')
            total_general = sum(e.get('prix_total', 0) or 0 for e in elements_valides)

            # Vérifier le total
            total_document = result.get('total_general', 0)
            if total_document and abs(total_general - total_document) > 1000:
                self.erreurs.append(
                    f"Différence de total: calculé={total_general:,.0f}, document={total_document:,.0f}"
                )

            return ResultatExtraction(
                fichier=Path(self.filepath).name,
                hash_fichier=hash_fichier,
                date_extraction=datetime.now().isoformat(),
                mode_extraction='gemini-2.0-flash',
                nb_pages=nb_pages,
                nb_elements=len(elements_valides),
                elements=elements_valides,
                resume_categories=resume_categories,
                resume_lots=resume_lots,
                resume_niveaux=resume_niveaux,
                total_general=total_general,
                devise='FCFA',
                erreurs=self.erreurs
            )

        except Exception as e:
            logger.error(f"❌ Erreur Gemini: {e}")
            self.erreurs.append(str(e))
            raise

    def _construire_prompt(self) -> str:
        """Construit le prompt optimisé pour l'extraction BTP"""
        categories_json = json.dumps(self.CATEGORIES_BTP, ensure_ascii=False)

        return f"""Tu es un expert en extraction de données de documents BTP (Devis Quantitatif Estimatif - DQE).

MISSION CRITIQUE: Extrais ABSOLUMENT TOUS les éléments/postes numérotés de ce document PDF.

CATÉGORIES BTP VALIDES (utilise EXACTEMENT ces noms):
{categories_json}

RÈGLES D'EXTRACTION STRICTES:
1. Extrais CHAQUE ligne numérotée (ex: "1.1", "2.3.1", "3.2.1.1")
2. Un numéro + description = un élément distinct
3. Identifie le lot/chapitre parent de chaque élément
4. Détecte les niveaux de bâtiment (Sous-sol, RDC, R+1, R+2...)
5. Extrait les métadonnées techniques:
   - Dosage béton (ex: "350 kg/m³")
   - Dimensions (ex: "20x20x40")
   - Épaisseur (ex: "15 cm")
6. Format monétaire FCFA: espaces = milliers, virgule = décimales
7. IGNORE: totaux, sous-totaux, titres de section sans prix

FORMAT JSON STRICT À RETOURNER:
{{
  "nb_pages": <nombre>,
  "total_general": <montant total du document>,
  "devise": "FCFA",
  "elements": [
    {{
      "numero": "1.1",
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
    }}
  ],
  "lots": [
    {{"numero": "1", "nom": "Gros œuvre", "total": 25000000}}
  ]
}}

IMPORTANT:
- Extrais TOUS les éléments sans exception
- Le total de tous les prix_total doit correspondre au total_general du document
- Utilise null (pas "null") pour les valeurs absentes
- Les montants sont des nombres, pas des chaînes

Analyse maintenant le document PDF et retourne le JSON complet:"""

    def _parser_reponse(self, texte: str) -> Optional[Dict]:
        """Parse la réponse JSON de Gemini"""
        try:
            # Nettoyer le texte
            texte = texte.strip()

            # Supprimer les blocs markdown si présents
            if texte.startswith('```'):
                texte = re.sub(r'^```(?:json)?\s*', '', texte)
                texte = re.sub(r'\s*```$', '', texte)

            # Trouver le JSON
            start = texte.find('{')
            end = texte.rfind('}') + 1
            if start != -1 and end > start:
                texte = texte[start:end]

            return json.loads(texte)

        except json.JSONDecodeError as e:
            logger.error(f"Erreur parsing JSON: {e}")
            logger.debug(f"Texte reçu: {texte[:500]}...")
            return None

    def _valider_elements(self, elements: List[Dict]) -> List[Dict]:
        """Valide et enrichit les éléments extraits"""
        elements_valides = []

        for e in elements:
            # Vérifier les champs obligatoires
            if not e.get('designation') or len(e.get('designation', '')) < 3:
                continue

            # Normaliser les valeurs numériques
            e['quantite'] = float(e.get('quantite') or 0)
            e['prix_unitaire'] = float(e['prix_unitaire']) if e.get('prix_unitaire') else None
            e['prix_total'] = float(e['prix_total']) if e.get('prix_total') else None

            # Recalculer le prix total si manquant
            if not e['prix_total'] and e['prix_unitaire'] and e['quantite']:
                e['prix_total'] = e['prix_unitaire'] * e['quantite']

            # Valider la catégorie
            if e.get('categorie') not in self.CATEGORIES_BTP:
                # Recatégoriser
                e['categorie'], e['sous_categorie'] = categoriser_element(e['designation'])

            elements_valides.append(e)

        return elements_valides

    def _calculer_resume(self, elements: List[Dict], champ: str) -> Dict[str, Dict]:
        """Calcule un résumé agrégé par un champ"""
        resume = {}
        for e in elements:
            valeur = e.get(champ) or 'Non défini'
            if valeur not in resume:
                resume[valeur] = {'nombre': 0, 'total': 0}
            resume[valeur]['nombre'] += 1
            resume[valeur]['total'] += e.get('prix_total', 0) or 0
        return resume

    def _calculer_resume_lots(self, elements: List[Dict]) -> Dict[str, Dict]:
        """Calcule un résumé agrégé par lot"""
        resume = {}
        for e in elements:
            lot = e.get('lot_numero') or 'Non défini'
            if lot not in resume:
                resume[lot] = {'nom': e.get('lot_nom'), 'nombre': 0, 'total': 0}
            resume[lot]['nombre'] += 1
            resume[lot]['total'] += e.get('prix_total', 0) or 0
        return resume


# ============================================================================
# EXPORTEURS
# ============================================================================

def exporter_json(resultat: ResultatExtraction, output_path: str):
    """Exporte le résultat en JSON"""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(resultat.to_dict(), f, ensure_ascii=False, indent=2)
    logger.info(f"✅ Export JSON: {output_path}")


def exporter_csv(resultat: ResultatExtraction, output_path: str):
    """Exporte les éléments en CSV"""
    if not resultat.elements:
        logger.warning("Aucun élément à exporter en CSV")
        return

    # Colonnes à exporter
    colonnes = [
        'numero', 'designation', 'categorie', 'sous_categorie',
        'unite', 'quantite', 'prix_unitaire', 'prix_total',
        'lot_numero', 'lot_nom', 'niveau', 'dosage', 'dimensions', 'epaisseur'
    ]

    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=colonnes, extrasaction='ignore')
        writer.writeheader()

        for element in resultat.elements:
            writer.writerow(element)

    logger.info(f"✅ Export CSV: {output_path}")


# ============================================================================
# POINT D'ENTRÉE
# ============================================================================

def main():
    """Point d'entrée principal"""
    import argparse

    parser = argparse.ArgumentParser(description='Extracteur BTP - Données PDF DQE')
    parser.add_argument('fichier', help='Chemin vers le fichier PDF')
    parser.add_argument('--mode', choices=['local', 'gemini', 'auto'], default='auto',
                        help='Mode d\'extraction (default: auto)')
    parser.add_argument('--output', choices=['json', 'csv', 'both'], default='both',
                        help='Format de sortie (default: both)')
    parser.add_argument('--output-dir', default='.', help='Répertoire de sortie')

    args = parser.parse_args()

    if not os.path.exists(args.fichier):
        print(f"❌ Fichier non trouvé: {args.fichier}")
        sys.exit(1)

    # Déterminer le mode
    mode = args.mode
    if mode == 'auto':
        # Préférer Gemini si disponible
        if GEMINI_AVAILABLE and (os.getenv('GOOGLE_AI_API_KEY') or os.getenv('GEMINI_API_KEY')):
            mode = 'gemini'
        elif PDFPLUMBER_AVAILABLE:
            mode = 'local'
        else:
            print("❌ Aucun extracteur disponible. Installez pdfplumber ou configurez GEMINI_API_KEY")
            sys.exit(1)

    logger.info(f"🚀 Démarrage extraction mode '{mode}' pour: {args.fichier}")

    try:
        # Extraction
        if mode == 'gemini':
            extracteur = ExtracteurGemini(args.fichier)
        else:
            extracteur = ExtracteurPDFPlumber(args.fichier)

        resultat = extracteur.extraire()

        # Logs résumé
        logger.info(f"📊 Résultat: {resultat.nb_elements} éléments extraits")
        logger.info(f"💰 Total: {resultat.total_general:,.0f} {resultat.devise}")

        if resultat.erreurs:
            for err in resultat.erreurs:
                logger.warning(f"⚠️ {err}")

        # Export
        base_name = Path(args.fichier).stem
        output_dir = Path(args.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        if args.output in ['json', 'both']:
            exporter_json(resultat, str(output_dir / f"{base_name}_extraction.json"))

        if args.output in ['csv', 'both']:
            exporter_csv(resultat, str(output_dir / f"{base_name}_extraction.csv"))

        print(f"\n✅ Extraction terminée: {resultat.nb_elements} éléments")
        print(f"   Total: {resultat.total_general:,.0f} FCFA")

    except Exception as e:
        logger.error(f"❌ Erreur fatale: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
