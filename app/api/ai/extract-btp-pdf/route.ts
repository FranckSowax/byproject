import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuration pour Netlify
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Timeout pour les appels API
const API_TIMEOUT_MS = 50000; // 50 secondes pour les gros PDF

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

// Catégories BTP standards
const CATEGORIES_BTP = [
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
];

// Client Gemini
const getGeminiClient = () => {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

// Prompt optimisé pour l'extraction de DQE BTP
function buildExtractionPrompt(): string {
  const categoriesJson = JSON.stringify(CATEGORIES_BTP, null, 2);

  return `Tu es un expert en extraction de données de documents BTP (Devis Quantitatif Estimatif - DQE) gabonais/africains.

MISSION CRITIQUE: Extrais ABSOLUMENT TOUS les éléments/postes numérotés de ce document PDF.

CATÉGORIES BTP VALIDES (utilise EXACTEMENT ces noms):
${categoriesJson}

RÈGLES D'EXTRACTION STRICTES:
1. Extrais CHAQUE ligne numérotée (ex: "1.1", "2.3.1", "3.2.1.1")
2. Un numéro + description = un élément distinct
3. Identifie le lot/chapitre parent de chaque élément
4. Détecte les niveaux de bâtiment (Sous-sol, RDC, R+1, R+2...)
5. Extrait les métadonnées techniques:
   - Dosage béton (ex: "350 kg/m³")
   - Dimensions (ex: "20x20x40")
   - Épaisseur (ex: "15 cm")
   - Matériaux utilisés
6. Format monétaire FCFA gabonais:
   - Espaces = séparateur de milliers (1 234 567)
   - Virgule = décimales
7. IGNORE: totaux, sous-totaux, titres de section sans prix, lignes vides

STRUCTURE DES LOTS/CHAPITRES:
- Détecte les lots numérotés (LOT 1, LOT 2, Chapitre I, etc.)
- Associe chaque élément à son lot parent

FORMAT JSON STRICT À RETOURNER:
{
  "success": true,
  "nb_pages": <nombre de pages>,
  "total_general": <montant total du document en nombre>,
  "devise": "FCFA",
  "elements": [
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
  ],
  "lots": [
    {"numero": "1", "nom": "Terrassement", "total": 5000000},
    {"numero": "2", "nom": "Gros œuvre", "total": 25000000}
  ],
  "resume_categories": {
    "Béton & Gros œuvre": {"nombre": 15, "total": 45000000},
    "Maçonnerie": {"nombre": 8, "total": 12000000}
  },
  "resume_niveaux": {
    "RDC": {"nombre": 20, "total": 30000000},
    "R+1": {"nombre": 15, "total": 25000000}
  }
}

IMPORTANT:
- Extrais TOUS les éléments sans exception - même les petits postes
- Les montants sont des NOMBRES (pas de chaînes avec formatage)
- Utilise null (pas "null" en string) pour les valeurs absentes
- Le total de tous les prix_total doit être proche du total_general
- Pour les matériaux, liste les composants mentionnés (ciment, fer, etc.)

Analyse maintenant le document PDF et retourne le JSON complet:`;
}

// Parser les montants FCFA
function parseMontantFCFA(valeur: string | number | null | undefined): number | null {
  if (valeur === null || valeur === undefined) return null;
  if (typeof valeur === 'number') return valeur;

  let str = String(valeur).trim();

  // Supprimer les symboles de devise
  str = str.replace(/[FCFA€$\s]/gi, '');

  // Format gabonais: espaces = milliers, virgule = décimales
  // Convertir les espaces en rien
  str = str.replace(/\s/g, '');

  // Si points comme milliers (1.234.567)
  if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
    str = str.replace(/\./g, '');
  }

  // Virgule comme décimales
  str = str.replace(',', '.');

  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

// Catégoriser automatiquement un élément
function categoriserElement(designation: string): { categorie: string; sous_categorie: string | null } {
  const lower = designation.toLowerCase();

  const keywordsMap: Record<string, string[]> = {
    "Terrassement & VRD": ['terrassement', 'fouille', 'remblai', 'déblai', 'excavation', 'vrd', 'voirie', 'assainissement', 'tranchée'],
    "Béton & Gros œuvre": ['béton', 'beton', 'armé', 'coffrage', 'ferraillage', 'poteau', 'poutre', 'dalle', 'fondation', 'semelle', 'longrine', 'chaînage', 'linteau', 'acrotère'],
    "Maçonnerie": ['maçonnerie', 'parpaing', 'agglo', 'brique', 'mur', 'cloison', 'élévation', 'hourdis', 'bloc'],
    "Charpente & Structure métallique": ['charpente', 'structure métallique', 'acier', 'ipn', 'ipe', 'hea', 'ossature'],
    "Couverture & Étanchéité": ['couverture', 'toiture', 'étanchéité', 'tôle', 'bac', 'tuile', 'gouttière', 'chéneau'],
    "Menuiserie bois": ['menuiserie bois', 'porte bois', 'fenêtre bois', 'placard', 'parquet'],
    "Menuiserie aluminium": ['aluminium', 'alu', 'baie vitrée', 'coulissant'],
    "Menuiserie métallique": ['menuiserie métallique', 'porte métallique', 'grille', 'portail', 'garde-corps'],
    "Carrelage & Revêtements sols": ['carrelage', 'faïence', 'grès', 'céramique', 'sol', 'plinthe'],
    "Revêtements muraux": ['revêtement mural', 'enduit', 'crépi', 'stuc'],
    "Plomberie & Sanitaire": ['plomberie', 'sanitaire', 'tuyau', 'canalisation', 'wc', 'lavabo', 'douche', 'robinet'],
    "Électricité & Câblage": ['électricité', 'câble', 'fil', 'gaine', 'tableau', 'disjoncteur', 'prise', 'interrupteur', 'éclairage'],
    "Climatisation & Ventilation": ['climatisation', 'clim', 'ventilation', 'vmc', 'split'],
    "Peinture & Finitions": ['peinture', 'impression', 'finition', 'laque', 'vernis'],
    "Faux plafonds": ['faux plafond', 'plafond suspendu', 'ba13', 'placo', 'staff'],
    "Serrurerie & Ferronnerie": ['serrurerie', 'ferronnerie', 'serrure', 'poignée'],
    "Vitrerie & Miroiterie": ['vitrerie', 'verre', 'vitrage', 'miroir'],
  };

  let bestMatch = "Divers & Imprévus";
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(keywordsMap)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = cat;
    }
  }

  // Sous-catégorie pour béton
  let sousCategorie: string | null = null;
  if (bestMatch === "Béton & Gros œuvre") {
    if (lower.includes('fondation') || lower.includes('semelle')) sousCategorie = "Fondations";
    else if (lower.includes('dalle')) sousCategorie = "Dalles";
    else if (lower.includes('poteau')) sousCategorie = "Poteaux";
    else if (lower.includes('poutre')) sousCategorie = "Poutres";
  }

  return { categorie: bestMatch, sous_categorie: sousCategorie };
}

export async function POST(request: NextRequest) {
  console.log('📂 === EXTRACT-BTP-PDF API CALLED ===');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const textContent = formData.get('textContent') as string | null;

    // Vérifier qu'on a soit un fichier, soit du contenu texte
    if (!file && !textContent) {
      return NextResponse.json({
        success: false,
        error: 'Fichier PDF ou contenu texte requis'
      }, { status: 400 });
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      return NextResponse.json({
        success: false,
        error: 'Clé API Gemini non configurée (GOOGLE_AI_API_KEY ou GEMINI_API_KEY)'
      }, { status: 503 });
    }

    let pdfData: string | null = null;
    let fileName = 'document.pdf';

    if (file) {
      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      pdfData = Buffer.from(arrayBuffer).toString('base64');
      console.log(`📄 Fichier PDF reçu: ${fileName} (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`);
    }

    // Créer le modèle Gemini
    const model = gemini.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 32000,
        responseMimeType: 'application/json',
      },
    });

    const prompt = buildExtractionPrompt();

    console.log('🤖 Envoi à Gemini 2.0 Flash...');

    let result;

    if (pdfData) {
      // Mode avec fichier PDF direct
      result = await withTimeout(
        model.generateContent({
          contents: [{
            role: 'user',
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: pdfData,
                },
              },
            ],
          }],
        }),
        API_TIMEOUT_MS,
        `Gemini timeout après ${API_TIMEOUT_MS / 1000}s`
      );
    } else if (textContent) {
      // Mode avec texte extrait
      result = await withTimeout(
        model.generateContent({
          contents: [{
            role: 'user',
            parts: [{ text: `${prompt}\n\nCONTENU DU DOCUMENT:\n\`\`\`\n${textContent}\n\`\`\`` }],
          }],
        }),
        API_TIMEOUT_MS,
        `Gemini timeout après ${API_TIMEOUT_MS / 1000}s`
      );
    }

    if (!result) {
      throw new Error('Pas de résultat Gemini');
    }

    const responseText = result.response.text()?.trim() || '';
    console.log(`✅ Réponse Gemini reçue: ${responseText.length} caractères`);

    // Parser le JSON
    let data;
    try {
      // Nettoyer la réponse
      let cleanJson = responseText;
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      }

      const startIdx = cleanJson.indexOf('{');
      const endIdx = cleanJson.lastIndexOf('}') + 1;
      if (startIdx !== -1 && endIdx > startIdx) {
        cleanJson = cleanJson.substring(startIdx, endIdx);
      }

      data = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError);
      console.log('Réponse brute (500 premiers chars):', responseText.substring(0, 500));

      return NextResponse.json({
        success: false,
        error: 'Impossible de parser la réponse Gemini',
        rawResponse: responseText.substring(0, 1000)
      }, { status: 500 });
    }

    // Valider et enrichir les éléments
    const elements = data.elements || [];
    const elementsValides = elements.map((e: any) => {
      // Normaliser les montants
      e.quantite = parseMontantFCFA(e.quantite) || 0;
      e.prix_unitaire = parseMontantFCFA(e.prix_unitaire);
      e.prix_total = parseMontantFCFA(e.prix_total);

      // Recalculer le prix total si manquant
      if (!e.prix_total && e.prix_unitaire && e.quantite) {
        e.prix_total = e.prix_unitaire * e.quantite;
      }

      // Valider la catégorie
      if (!CATEGORIES_BTP.includes(e.categorie)) {
        const { categorie, sous_categorie } = categoriserElement(e.designation || '');
        e.categorie = categorie;
        if (!e.sous_categorie) e.sous_categorie = sous_categorie;
      }

      return e;
    }).filter((e: any) => e.designation && e.designation.length >= 3);

    // Calculer les totaux
    const totalCalcule = elementsValides.reduce((sum: number, e: any) => sum + (e.prix_total || 0), 0);

    // Résumés par catégorie
    const resumeCategories: Record<string, { nombre: number; total: number }> = {};
    for (const e of elementsValides) {
      const cat = e.categorie || 'Divers & Imprévus';
      if (!resumeCategories[cat]) {
        resumeCategories[cat] = { nombre: 0, total: 0 };
      }
      resumeCategories[cat].nombre++;
      resumeCategories[cat].total += e.prix_total || 0;
    }

    // Résumés par lot
    const resumeLots: Record<string, { nom: string | null; nombre: number; total: number }> = {};
    for (const e of elementsValides) {
      const lot = e.lot_numero || 'Non défini';
      if (!resumeLots[lot]) {
        resumeLots[lot] = { nom: e.lot_nom, nombre: 0, total: 0 };
      }
      resumeLots[lot].nombre++;
      resumeLots[lot].total += e.prix_total || 0;
    }

    // Résumés par niveau
    const resumeNiveaux: Record<string, { nombre: number; total: number }> = {};
    for (const e of elementsValides) {
      const niv = e.niveau || 'Non défini';
      if (!resumeNiveaux[niv]) {
        resumeNiveaux[niv] = { nombre: 0, total: 0 };
      }
      resumeNiveaux[niv].nombre++;
      resumeNiveaux[niv].total += e.prix_total || 0;
    }

    console.log(`📊 Extraction terminée: ${elementsValides.length} éléments, total: ${totalCalcule.toLocaleString('fr-FR')} FCFA`);

    return NextResponse.json({
      success: true,
      fichier: fileName,
      mode_extraction: 'gemini-2.0-flash',
      nb_pages: data.nb_pages || 0,
      nb_elements: elementsValides.length,
      total_general: totalCalcule,
      total_document: parseMontantFCFA(data.total_general),
      devise: 'FCFA',
      elements: elementsValides,
      lots: data.lots || [],
      resume_categories: resumeCategories,
      resume_lots: resumeLots,
      resume_niveaux: resumeNiveaux,
      erreurs: []
    });

  } catch (error: any) {
    console.error('❌ Erreur extraction BTP PDF:', error);

    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'extraction',
      details: error?.message || 'Erreur inconnue'
    }, { status: 500 });
  }
}
