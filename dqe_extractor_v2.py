"""
DQE Excel Extractor v2 - Version SaaS
======================================
Module avec prévisualisation et sélection des onglets avant extraction.

Workflow:
1. analyze() → Retourne la liste des onglets avec aperçu
2. select_sheets() → Choisir les onglets à extraire
3. extract() → Extraire uniquement les onglets sélectionnés

Auteur: Claude pour Studia Lab / Franck
Version: 2.0
"""

import pandas as pd
import json
import re
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict, field
from enum import Enum
from datetime import datetime


# =============================================================================
# STRUCTURES DE DONNÉES
# =============================================================================

class SheetType(Enum):
    """Types d'onglets DQE"""
    DETAILED = "detailed"      # Devis détaillé par bâtiment
    SUMMARY = "summary"        # Récapitulatif des quantités
    RECAP = "recap"            # Totaux généraux
    UNKNOWN = "unknown"        # Non identifié


class LineType(Enum):
    """Types de lignes dans le DQE"""
    HEADER = "header"
    CATEGORY = "category"
    ITEM = "item"
    SUBTOTAL = "subtotal"
    TOTAL = "total"
    EMPTY = "empty"
    METADATA = "metadata"


@dataclass
class SheetPreview:
    """Aperçu d'un onglet pour la sélection"""
    index: int
    name: str
    sheet_type: str
    rows_count: int
    cols_count: int
    estimated_items: int
    date: Optional[str] = None
    building_ref: Optional[str] = None
    devis_ref: Optional[str] = None
    sample_categories: List[str] = field(default_factory=list)
    sample_items: List[str] = field(default_factory=list)
    is_selected: bool = True  # Par défaut, tous sélectionnés


@dataclass
class DQEItem:
    """Structure d'un élément/matériau du DQE"""
    code: Optional[str]
    designation: str
    unite: str
    quantite: float
    prix_unitaire: Optional[float] = None
    montant_total: Optional[float] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None


@dataclass
class DQECategory:
    """Structure d'une catégorie du DQE"""
    name: str
    items: List[DQEItem]
    subtotal: Optional[float] = None


@dataclass
class DQESheet:
    """Structure d'un onglet DQE extrait"""
    sheet_name: str
    sheet_type: str
    building_ref: Optional[str]
    date: Optional[str]
    categories: List[DQECategory]
    total_amount: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


# =============================================================================
# CLASSE PRINCIPALE - DQE EXTRACTOR V2
# =============================================================================

class DQEExtractorV2:
    """
    Extracteur DQE avec workflow en 2 étapes:
    1. Analyse et prévisualisation
    2. Extraction sélective
    """
    
    # Patterns de détection
    HEADER_PATTERNS = [
        r'DESIGANTION|DESIGNATION',
        r'QUANTITE|QTE|QTÉ',
        r'UNITE|U\b',
        r'MONTANT|TOTAL'
    ]
    
    SUBTOTAL_PATTERNS = [
        r'sous\s*total',
        r'total\s*\d',
        r's/total',
        r'sous-total'
    ]
    
    CATEGORY_KEYWORDS = [
        'NETTOYAGE', 'RESEAUX', 'TRAITEMENT', 'ELEVATION', 'MACONNERIES',
        'PLANCHER', 'ESCALIERS', 'ENDUITS', 'REVETEMENT', 'EQUIPEMENTS',
        'PEINTURE', 'MENUISERIE', 'ELECTRICITE', 'PLOMBERIE', 'ETANCHEITE',
        'CARRELAGE', 'FAIENCE', 'SANITAIRE', 'CHAUFFAGE', 'CLIMATISATION',
        'AERATION', 'FONDATION', 'TERRASSEMENT', 'COUVERTURE', 'CHARPENTE'
    ]
    
    VALID_UNITS = {
        'M2', 'M²', 'ML', 'M3', 'M³', 'U', 'KG', 'L', 'ENS', 'FF', 'PM',
        'M', 'T', 'HL', 'LITRE', 'UNITE', 'FORFAIT', 'ENSEMBLE'
    }
    
    def __init__(self, filepath: str = None, file_content: bytes = None):
        """
        Initialise l'extracteur avec un fichier ou des bytes.
        
        Args:
            filepath: Chemin vers le fichier Excel
            file_content: Contenu binaire du fichier (pour upload)
        """
        self.filepath = filepath
        self.file_content = file_content
        self.xlsx = None
        self.previews: List[SheetPreview] = []
        self.selected_sheets: List[str] = []
        self.results: List[DQESheet] = []
        self._is_analyzed = False
        
        # Charger le fichier
        self._load_file()
    
    def _load_file(self):
        """Charge le fichier Excel"""
        if self.filepath:
            self.xlsx = pd.ExcelFile(self.filepath)
        elif self.file_content:
            import io
            self.xlsx = pd.ExcelFile(io.BytesIO(self.file_content))
        else:
            raise ValueError("filepath ou file_content requis")
    
    # =========================================================================
    # ÉTAPE 1: ANALYSE ET PRÉVISUALISATION
    # =========================================================================
    
    def analyze(self) -> Dict:
        """
        Analyse le fichier et retourne un aperçu de tous les onglets.
        
        Returns:
            Dict avec la liste des onglets et leurs caractéristiques
        """
        self.previews = []
        
        for idx, sheet_name in enumerate(self.xlsx.sheet_names):
            preview = self._analyze_sheet(idx, sheet_name)
            self.previews.append(preview)
        
        self._is_analyzed = True
        self.selected_sheets = [p.name for p in self.previews]  # Tous sélectionnés par défaut
        
        return self._get_analysis_result()
    
    def _analyze_sheet(self, index: int, sheet_name: str) -> SheetPreview:
        """Analyse un onglet et génère son aperçu"""
        df = pd.read_excel(self.xlsx, sheet_name=sheet_name, header=None)
        
        # Détecter le type
        sheet_type = self._detect_sheet_type(sheet_name, df)
        
        # Extraire les métadonnées
        metadata = self._extract_metadata(df, 30)
        
        # Estimer le nombre d'items
        estimated_items = self._estimate_items_count(df)
        
        # Extraire des exemples de catégories et items
        sample_cats, sample_items = self._get_samples(df)
        
        return SheetPreview(
            index=index,
            name=sheet_name,
            sheet_type=sheet_type.value,
            rows_count=len(df),
            cols_count=len(df.columns),
            estimated_items=estimated_items,
            date=metadata.get('date'),
            building_ref=metadata.get('building_ref'),
            devis_ref=metadata.get('devis_ref'),
            sample_categories=sample_cats[:5],
            sample_items=sample_items[:5],
            is_selected=True
        )
    
    def _detect_sheet_type(self, sheet_name: str, df: pd.DataFrame) -> SheetType:
        """Détecte le type d'onglet"""
        name_lower = sheet_name.lower()
        
        if 'recap' in name_lower:
            return SheetType.RECAP
        elif name_lower.startswith('n°') or name_lower.startswith('n '):
            return SheetType.DETAILED
        elif any(x in name_lower for x in ['type', 'achat', 'pog', 'ages']):
            return SheetType.SUMMARY
        
        # Analyse du contenu
        content_str = df.head(50).to_string().lower()
        if 'prix unitaire' in content_str or ' pu ' in content_str:
            return SheetType.DETAILED
        elif 'quantite' in content_str:
            return SheetType.SUMMARY
        
        return SheetType.UNKNOWN
    
    def _estimate_items_count(self, df: pd.DataFrame) -> int:
        """Estime le nombre d'items dans l'onglet"""
        count = 0
        for idx, row in df.iterrows():
            # Vérifier si la ligne ressemble à un item
            for col_idx in range(min(5, len(row))):
                cell = str(row.iloc[col_idx]).upper().strip()
                if cell in self.VALID_UNITS:
                    count += 1
                    break
        return count
    
    def _get_samples(self, df: pd.DataFrame) -> Tuple[List[str], List[str]]:
        """Extrait des exemples de catégories et items"""
        categories = []
        items = []
        
        for idx, row in df.iterrows():
            if idx > 100:  # Limiter l'analyse
                break
                
            row_values = [str(v) for v in row.values if pd.notna(v) and str(v).strip()]
            if not row_values:
                continue
            
            first_val = row_values[0] if row_values else ''
            
            # Détecter les catégories
            if any(kw in first_val.upper() for kw in self.CATEGORY_KEYWORDS):
                if first_val not in categories:
                    categories.append(first_val[:50])
            
            # Détecter les items (ont une unité)
            for val in row_values:
                if val.upper().strip() in self.VALID_UNITS:
                    # C'est probablement un item
                    designation = row_values[0] if row_values else ''
                    if designation and len(designation) > 10 and designation not in items:
                        items.append(designation[:60] + '...' if len(designation) > 60 else designation)
                    break
        
        return categories, items
    
    def _get_analysis_result(self) -> Dict:
        """Formate le résultat de l'analyse"""
        return {
            "status": "analyzed",
            "file_info": {
                "path": self.filepath,
                "total_sheets": len(self.previews)
            },
            "sheets": [asdict(p) for p in self.previews],
            "summary": {
                "detailed_sheets": len([p for p in self.previews if p.sheet_type == "detailed"]),
                "summary_sheets": len([p for p in self.previews if p.sheet_type == "summary"]),
                "recap_sheets": len([p for p in self.previews if p.sheet_type == "recap"]),
                "total_estimated_items": sum(p.estimated_items for p in self.previews)
            }
        }
    
    # =========================================================================
    # ÉTAPE 2: SÉLECTION DES ONGLETS
    # =========================================================================
    
    def select_sheets(self, 
                      sheet_names: List[str] = None,
                      sheet_indices: List[int] = None,
                      sheet_types: List[str] = None,
                      exclude_names: List[str] = None) -> Dict:
        """
        Sélectionne les onglets à extraire.
        
        Args:
            sheet_names: Liste des noms d'onglets à inclure
            sheet_indices: Liste des indices d'onglets à inclure
            sheet_types: Types d'onglets à inclure ('detailed', 'summary', 'recap')
            exclude_names: Noms d'onglets à exclure
        
        Returns:
            Dict avec la liste des onglets sélectionnés
        """
        if not self._is_analyzed:
            self.analyze()
        
        # Réinitialiser la sélection
        for p in self.previews:
            p.is_selected = False
        
        # Sélectionner par nom
        if sheet_names:
            for p in self.previews:
                if p.name in sheet_names:
                    p.is_selected = True
        
        # Sélectionner par index
        if sheet_indices:
            for p in self.previews:
                if p.index in sheet_indices:
                    p.is_selected = True
        
        # Sélectionner par type
        if sheet_types:
            for p in self.previews:
                if p.sheet_type in sheet_types:
                    p.is_selected = True
        
        # Si aucun critère, tout sélectionner
        if not sheet_names and not sheet_indices and not sheet_types:
            for p in self.previews:
                p.is_selected = True
        
        # Exclure
        if exclude_names:
            for p in self.previews:
                if p.name in exclude_names:
                    p.is_selected = False
        
        # Mettre à jour la liste
        self.selected_sheets = [p.name for p in self.previews if p.is_selected]
        
        return {
            "status": "selected",
            "selected_count": len(self.selected_sheets),
            "selected_sheets": [
                {"index": p.index, "name": p.name, "type": p.sheet_type}
                for p in self.previews if p.is_selected
            ],
            "excluded_sheets": [
                {"index": p.index, "name": p.name, "type": p.sheet_type}
                for p in self.previews if not p.is_selected
            ]
        }
    
    def select_all(self) -> Dict:
        """Sélectionne tous les onglets"""
        for p in self.previews:
            p.is_selected = True
        self.selected_sheets = [p.name for p in self.previews]
        return self.get_selection_status()
    
    def deselect_all(self) -> Dict:
        """Désélectionne tous les onglets"""
        for p in self.previews:
            p.is_selected = False
        self.selected_sheets = []
        return self.get_selection_status()
    
    def toggle_sheet(self, sheet_name: str) -> Dict:
        """Bascule la sélection d'un onglet"""
        for p in self.previews:
            if p.name == sheet_name:
                p.is_selected = not p.is_selected
                break
        self.selected_sheets = [p.name for p in self.previews if p.is_selected]
        return self.get_selection_status()
    
    def get_selection_status(self) -> Dict:
        """Retourne l'état actuel de la sélection"""
        return {
            "selected_count": len(self.selected_sheets),
            "total_sheets": len(self.previews),
            "sheets": [
                {
                    "index": p.index,
                    "name": p.name,
                    "type": p.sheet_type,
                    "is_selected": p.is_selected,
                    "estimated_items": p.estimated_items
                }
                for p in self.previews
            ]
        }
    
    # =========================================================================
    # ÉTAPE 3: EXTRACTION
    # =========================================================================
    
    def extract(self, include_metadata: bool = True) -> Dict:
        """
        Extrait les données des onglets sélectionnés.
        
        Args:
            include_metadata: Inclure les métadonnées dans le résultat
        
        Returns:
            Dict avec les données extraites
        """
        if not self._is_analyzed:
            self.analyze()
        
        if not self.selected_sheets:
            return {
                "status": "error",
                "message": "Aucun onglet sélectionné. Utilisez select_sheets() d'abord."
            }
        
        self.results = []
        extraction_stats = {
            "processed": 0,
            "success": 0,
            "errors": []
        }
        
        for sheet_name in self.selected_sheets:
            try:
                preview = next(p for p in self.previews if p.name == sheet_name)
                sheet_data = self._extract_sheet(sheet_name, preview.sheet_type)
                
                if sheet_data:
                    self.results.append(sheet_data)
                    extraction_stats["success"] += 1
                
                extraction_stats["processed"] += 1
                
            except Exception as e:
                extraction_stats["errors"].append({
                    "sheet": sheet_name,
                    "error": str(e)
                })
        
        return self._format_extraction_result(include_metadata, extraction_stats)
    
    def _extract_sheet(self, sheet_name: str, sheet_type: str) -> Optional[DQESheet]:
        """Extrait les données d'un onglet spécifique"""
        df = pd.read_excel(self.xlsx, sheet_name=sheet_name, header=None)
        
        if sheet_type == "recap":
            return self._extract_recap_sheet(sheet_name, df)
        elif sheet_type == "detailed":
            return self._extract_detailed_sheet(sheet_name, df)
        elif sheet_type == "summary":
            return self._extract_summary_sheet(sheet_name, df)
        else:
            # Essayer detailed par défaut
            return self._extract_detailed_sheet(sheet_name, df)
    
    def _extract_detailed_sheet(self, sheet_name: str, df: pd.DataFrame) -> DQESheet:
        """Extrait un onglet détaillé"""
        header_row = self._find_header_row(df)
        
        col_mapping = {
            'code': 0,
            'designation': 1,
            'unite': 2,
            'quantite': 3,
            'pu': 4,
            'montant': 5
        }
        
        metadata = self._extract_metadata(df, header_row if header_row > 0 else 30)
        categories = []
        current_category = None
        current_items = []
        
        start_row = header_row + 1 if header_row >= 0 else 25
        
        for idx in range(start_row, len(df)):
            row = df.iloc[idx]
            line_type = self._classify_line(row, col_mapping)
            
            if line_type == LineType.CATEGORY:
                if current_category and current_items:
                    categories.append(DQECategory(
                        name=current_category,
                        items=current_items.copy()
                    ))
                current_category = str(row.iloc[col_mapping['designation']]).strip()
                current_items = []
                
            elif line_type == LineType.ITEM:
                item = self._create_item(row, col_mapping, current_category)
                if item:
                    current_items.append(item)
                    
            elif line_type == LineType.SUBTOTAL:
                if current_category and current_items:
                    subtotal = self._safe_float(row.iloc[col_mapping['montant']])
                    categories.append(DQECategory(
                        name=current_category,
                        items=current_items.copy(),
                        subtotal=subtotal
                    ))
                    current_category = None
                    current_items = []
        
        if current_category and current_items:
            categories.append(DQECategory(
                name=current_category,
                items=current_items.copy()
            ))
        
        return DQESheet(
            sheet_name=sheet_name,
            sheet_type="detailed",
            building_ref=metadata.get('building_ref'),
            date=metadata.get('date'),
            categories=categories,
            metadata=metadata
        )
    
    def _extract_summary_sheet(self, sheet_name: str, df: pd.DataFrame) -> DQESheet:
        """Extrait un onglet récapitulatif"""
        header_row = self._find_header_row(df)
        
        col_mapping = {
            'designation': 1,
            'unite': 2,
            'quantite': 3,
            'total': 4
        }
        
        metadata = self._extract_metadata(df, header_row if header_row > 0 else 30)
        categories = []
        current_category = None
        current_items = []
        
        start_row = header_row + 1 if header_row >= 0 else 10
        
        for idx in range(start_row, len(df)):
            row = df.iloc[idx]
            line_type = self._classify_line(row, col_mapping)
            
            if line_type == LineType.CATEGORY:
                if current_category and current_items:
                    categories.append(DQECategory(
                        name=current_category,
                        items=current_items.copy()
                    ))
                current_category = str(row.iloc[col_mapping['designation']]).strip()
                current_items = []
                
            elif line_type == LineType.ITEM:
                item = self._create_item_summary(row, col_mapping, current_category)
                if item:
                    current_items.append(item)
                    
            elif line_type == LineType.SUBTOTAL:
                if current_category and current_items:
                    categories.append(DQECategory(
                        name=current_category,
                        items=current_items.copy()
                    ))
                    current_category = None
                    current_items = []
        
        if current_category and current_items:
            categories.append(DQECategory(
                name=current_category,
                items=current_items.copy()
            ))
        
        return DQESheet(
            sheet_name=sheet_name,
            sheet_type="summary",
            building_ref=metadata.get('building_ref'),
            date=metadata.get('date'),
            categories=categories,
            metadata=metadata
        )
    
    def _extract_recap_sheet(self, sheet_name: str, df: pd.DataFrame) -> DQESheet:
        """Extrait l'onglet RECAP"""
        items = []
        
        for idx, row in df.iterrows():
            col0 = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ''
            col1 = row.iloc[1] if len(row) > 1 else None
            
            if re.match(r'^\d+[AB]?$', col0.strip()):
                montant = self._safe_float(col1)
                if montant:
                    items.append(DQEItem(
                        code=col0.strip(),
                        designation=f"Immeuble {col0.strip()}",
                        unite="FF",
                        quantite=1,
                        montant_total=montant
                    ))
        
        return DQESheet(
            sheet_name=sheet_name,
            sheet_type="recap",
            building_ref=None,
            date=None,
            categories=[DQECategory(name="RECAPITULATIF", items=items)],
            metadata={}
        )
    
    # =========================================================================
    # MÉTHODES UTILITAIRES
    # =========================================================================
    
    def _find_header_row(self, df: pd.DataFrame) -> int:
        """Trouve la ligne d'en-tête"""
        for idx, row in df.iterrows():
            if idx > 50:
                break
            row_str = ' '.join([str(v) for v in row.values if pd.notna(v)]).upper()
            matches = sum(1 for pattern in self.HEADER_PATTERNS 
                         if re.search(pattern, row_str, re.IGNORECASE))
            if matches >= 2:
                return idx
        return -1
    
    def _classify_line(self, row: pd.Series, col_mapping: Dict) -> LineType:
        """Classifie le type d'une ligne"""
        designation = str(row.get(col_mapping.get('designation', 1), '')).strip()
        unite = str(row.get(col_mapping.get('unite', 2), '')).strip().upper()
        quantite = row.get(col_mapping.get('quantite', 3), None)
        
        if not designation or designation == 'nan':
            return LineType.EMPTY
        
        designation_lower = designation.lower()
        
        for pattern in self.SUBTOTAL_PATTERNS:
            if re.search(pattern, designation_lower):
                return LineType.SUBTOTAL
        
        if re.search(r'^total\s*general', designation_lower):
            return LineType.TOTAL
        
        has_valid_unit = unite in self.VALID_UNITS or (len(unite) <= 3 and unite.isalpha())
        has_quantity = pd.notna(quantite) and self._is_numeric(quantite)
        
        if has_valid_unit and has_quantity and unite != '' and unite != 'NAN':
            return LineType.ITEM
        
        if designation.isupper() or any(kw in designation.upper() for kw in self.CATEGORY_KEYWORDS):
            return LineType.CATEGORY
        
        if 'libreville' in designation_lower or 'devis' in designation_lower:
            return LineType.METADATA
        
        return LineType.EMPTY
    
    def _extract_metadata(self, df: pd.DataFrame, max_row: int) -> Dict:
        """Extrait les métadonnées"""
        metadata = {}
        
        for idx in range(min(max_row, len(df))):
            row_str = ' '.join([str(v) for v in df.iloc[idx].values if pd.notna(v)])
            
            date_match = re.search(r'(\d{1,2}[/\s]?\w+[/\s]?\d{4})', row_str)
            if date_match and 'date' not in metadata:
                metadata['date'] = date_match.group(1)
            
            bat_match = re.search(r'BAT\s*:\s*(\d+[A-Z]?)', row_str, re.IGNORECASE)
            if bat_match:
                metadata['building_ref'] = bat_match.group(1)
            
            devis_match = re.search(r'Devis\s*N°?\s*([\d\-/]+)', row_str, re.IGNORECASE)
            if devis_match:
                metadata['devis_ref'] = devis_match.group(1)
            
            imm_match = re.search(r'IMMEUBLE\s+(\w+)', row_str, re.IGNORECASE)
            if imm_match and 'immeuble_type' not in metadata:
                metadata['immeuble_type'] = imm_match.group(1)
        
        return metadata
    
    def _create_item(self, row: pd.Series, col_mapping: Dict, category: str) -> Optional[DQEItem]:
        """Crée un item DQE"""
        try:
            designation = str(row.iloc[col_mapping['designation']]).strip()
            if designation == 'nan' or not designation:
                return None
                
            return DQEItem(
                code=self._safe_str(row.iloc[col_mapping['code']]),
                designation=designation,
                unite=self._normalize_unit(str(row.iloc[col_mapping['unite']])),
                quantite=self._safe_float(row.iloc[col_mapping['quantite']]) or 0,
                prix_unitaire=self._safe_float(row.iloc[col_mapping['pu']]),
                montant_total=self._safe_float(row.iloc[col_mapping['montant']]),
                category=category
            )
        except Exception:
            return None
    
    def _create_item_summary(self, row: pd.Series, col_mapping: Dict, category: str) -> Optional[DQEItem]:
        """Crée un item depuis un onglet récapitulatif"""
        try:
            designation = str(row.iloc[col_mapping['designation']]).strip()
            if designation == 'nan' or not designation:
                return None
                
            return DQEItem(
                code=None,
                designation=designation,
                unite=self._normalize_unit(str(row.iloc[col_mapping['unite']])),
                quantite=self._safe_float(row.iloc[col_mapping['quantite']]) or 0,
                montant_total=self._safe_float(row.iloc[col_mapping.get('total', 4)]),
                category=category
            )
        except Exception:
            return None
    
    def _normalize_unit(self, unit: str) -> str:
        """Normalise les unités"""
        unit = unit.upper().strip()
        normalization_map = {
            'M²': 'M2', 'M³': 'M3', 'METRE': 'M',
            'KILOGRAMME': 'KG', 'LITRE': 'L', 'ENSEMBLE': 'ENS',
            'FORFAIT': 'FF', 'UNITE': 'U'
        }
        return normalization_map.get(unit, unit if unit != 'NAN' else '')
    
    def _is_numeric(self, value) -> bool:
        """Vérifie si une valeur est numérique"""
        if pd.isna(value):
            return False
        try:
            float(value)
            return True
        except (ValueError, TypeError):
            return False
    
    def _safe_float(self, value) -> Optional[float]:
        """Conversion sécurisée en float"""
        if pd.isna(value):
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    
    def _safe_str(self, value) -> Optional[str]:
        """Conversion sécurisée en string"""
        if pd.isna(value):
            return None
        s = str(value).strip()
        return s if s and s != 'nan' else None
    
    def _format_extraction_result(self, include_metadata: bool, stats: Dict) -> Dict:
        """Formate le résultat de l'extraction"""
        def convert_item(item: DQEItem) -> Dict:
            return {k: v for k, v in asdict(item).items() if v is not None}
        
        def convert_category(cat: DQECategory) -> Dict:
            result = {
                'name': cat.name,
                'items': [convert_item(item) for item in cat.items],
                'items_count': len(cat.items)
            }
            if cat.subtotal:
                result['subtotal'] = cat.subtotal
            return result
        
        def convert_sheet(sheet: DQESheet) -> Dict:
            result = {
                'sheet_name': sheet.sheet_name,
                'sheet_type': sheet.sheet_type,
                'categories': [convert_category(cat) for cat in sheet.categories],
                'total_items': sum(len(cat.items) for cat in sheet.categories)
            }
            if sheet.building_ref:
                result['building_ref'] = sheet.building_ref
            if sheet.date:
                result['date'] = sheet.date
            if include_metadata and sheet.metadata:
                result['metadata'] = sheet.metadata
            return result
        
        total_items = sum(
            len(cat.items) 
            for sheet in self.results 
            for cat in sheet.categories
        )
        
        return {
            "status": "success",
            "extraction_info": {
                "timestamp": datetime.now().isoformat(),
                "sheets_extracted": len(self.results),
                "total_items": total_items,
                "stats": stats
            },
            "data": {
                "source_file": self.filepath,
                "sheets": [convert_sheet(sheet) for sheet in self.results]
            }
        }
    
    # =========================================================================
    # MÉTHODES D'AGRÉGATION
    # =========================================================================
    
    def get_all_materials(self) -> List[Dict]:
        """Retourne la liste plate de tous les matériaux"""
        materials = []
        
        for sheet in self.results:
            for category in sheet.categories:
                for item in category.items:
                    materials.append({
                        'sheet': sheet.sheet_name,
                        'category': item.category or category.name,
                        'designation': item.designation,
                        'unite': item.unite,
                        'quantite': item.quantite,
                        'prix_unitaire': item.prix_unitaire,
                        'montant_total': item.montant_total
                    })
        
        return materials
    
    def aggregate_by_material(self) -> List[Dict]:
        """Agrège les quantités par type de matériau"""
        from collections import defaultdict
        
        aggregated = defaultdict(lambda: {
            'designation': '',
            'unite': '',
            'total_quantite': 0,
            'occurrences': 0,
            'sheets': []
        })
        
        for sheet in self.results:
            for category in sheet.categories:
                for item in category.items:
                    key = self._normalize_designation(item.designation)
                    
                    aggregated[key]['designation'] = item.designation
                    aggregated[key]['unite'] = item.unite
                    aggregated[key]['total_quantite'] += item.quantite
                    aggregated[key]['occurrences'] += 1
                    if sheet.sheet_name not in aggregated[key]['sheets']:
                        aggregated[key]['sheets'].append(sheet.sheet_name)
        
        return sorted(
            [{'key': k, **v} for k, v in aggregated.items()],
            key=lambda x: x['total_quantite'],
            reverse=True
        )
    
    def _normalize_designation(self, designation: str) -> str:
        """Normalise une désignation pour le regroupement"""
        normalized = designation.lower()
        normalized = re.sub(r'\s+', ' ', normalized)
        normalized = re.sub(r'[^\w\s]', '', normalized)
        return normalized[:100]


# =============================================================================
# FONCTIONS UTILITAIRES POUR API
# =============================================================================

def quick_analyze(filepath: str) -> Dict:
    """Analyse rapide d'un fichier DQE"""
    extractor = DQEExtractorV2(filepath=filepath)
    return extractor.analyze()


def quick_extract(filepath: str, sheet_names: List[str] = None) -> Dict:
    """Extraction rapide avec sélection optionnelle"""
    extractor = DQEExtractorV2(filepath=filepath)
    extractor.analyze()
    
    if sheet_names:
        extractor.select_sheets(sheet_names=sheet_names)
    
    return extractor.extract()


# =============================================================================
# EXEMPLE D'UTILISATION
# =============================================================================

if __name__ == "__main__":
    import sys
    
    filepath = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/uploads/DQE_ACHAT_CHINE.xlsx'
    
    print("=" * 80)
    print("DQE EXTRACTOR V2 - Workflow Interactif")
    print("=" * 80)
    
    # Étape 1: Analyse
    print("\n📊 ÉTAPE 1: Analyse du fichier...")
    extractor = DQEExtractorV2(filepath=filepath)
    analysis = extractor.analyze()
    
    print(f"\n✅ Fichier analysé: {analysis['file_info']['total_sheets']} onglets trouvés")
    print("\nAperçu des onglets:")
    for sheet in analysis['sheets'][:5]:
        print(f"  [{sheet['index']}] {sheet['name']}")
        print(f"      Type: {sheet['sheet_type']} | Items estimés: {sheet['estimated_items']}")
    
    # Étape 2: Sélection
    print("\n📋 ÉTAPE 2: Sélection des onglets...")
    
    # Exemple: sélectionner uniquement les onglets détaillés
    selection = extractor.select_sheets(sheet_types=['detailed'])
    print(f"\n✅ {selection['selected_count']} onglets sélectionnés (type: detailed)")
    
    # Étape 3: Extraction
    print("\n🔄 ÉTAPE 3: Extraction des données...")
    result = extractor.extract()
    
    print(f"\n✅ Extraction terminée!")
    print(f"   Onglets traités: {result['extraction_info']['sheets_extracted']}")
    print(f"   Items extraits: {result['extraction_info']['total_items']}")
    
    # Sauvegarder
    output_path = '/home/claude/dqe_v2_extracted.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    
    print(f"\n📁 JSON sauvegardé: {output_path}")
