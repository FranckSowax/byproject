import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Replicate from 'replicate';

// Configuration pour Netlify - timeout étendu pour les gros fichiers
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

const getReplicateClient = () => {
  const auth = process.env.REPLICATE_API_TOKEN;
  if (!auth) return null;
  return new Replicate({ auth });
};

// Fonction pour découper le texte en chunks intelligents
function splitTextIntoChunks(text: string, maxChunkSize: number = 8000): string[] {
  const chunks: string[] = [];
  const lines = text.split('\n');
  let currentChunk = '';
  
  for (const line of lines) {
    // Si ajouter cette ligne dépasse la limite, sauvegarder le chunk actuel
    if (currentChunk.length + line.length + 1 > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += line + '\n';
  }
  
  // Ajouter le dernier chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Fonction pour parser le CSV
function parseCSV(content: string): { headers: string[], rows: string[][] } {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  // Détecter le séparateur (virgule, point-virgule, tabulation)
  const firstLine = lines[0];
  let separator = ',';
  if (firstLine.includes(';') && !firstLine.includes(',')) separator = ';';
  if (firstLine.includes('\t')) separator = '\t';
  
  const headers = lines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map(line => 
    line.split(separator).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  );
  
  return { headers, rows };
}

// Fonction pour détecter la devise dans un texte ou valeur
function detectCurrency(text: string): string | null {
  if (!text) return null;
  const textLower = text.toLowerCase();
  
  // Devises courantes
  if (textLower.includes('€') || textLower.includes('eur')) return 'EUR';
  if (textLower.includes('$') || textLower.includes('usd')) return 'USD';
  if (textLower.includes('fcfa') || textLower.includes('xaf') || textLower.includes('xof') || textLower.includes('cfa')) return 'XAF';
  if (textLower.includes('£') || textLower.includes('gbp')) return 'GBP';
  if (textLower.includes('¥') || textLower.includes('cny') || textLower.includes('rmb')) return 'CNY';
  if (textLower.includes('mad') || textLower.includes('dh')) return 'MAD';
  if (textLower.includes('dzd') || textLower.includes('da')) return 'DZD';
  if (textLower.includes('tnd')) return 'TND';
  
  return null;
}

// Fonction pour nettoyer et parser un prix
function parsePrice(value: string): { price: number | null, currency: string | null } {
  if (!value) return { price: null, currency: null };
  
  const currency = detectCurrency(value);
  
  // Nettoyer le prix: enlever symboles de devise, espaces, et convertir virgule en point
  let cleanPrice = value
    .replace(/[€$£¥]/g, '')
    .replace(/fcfa|xaf|xof|cfa|eur|usd|gbp|cny|mad|dzd|tnd|dh|da/gi, '')
    .replace(/\s/g, '')
    .replace(/,/g, '.')
    .trim();
  
  // Extraire le nombre
  const match = cleanPrice.match(/[\d.]+/);
  const price = match ? parseFloat(match[0]) : null;
  
  return { price: isNaN(price as number) ? null : price, currency };
}

// Extraction pour CSV - déterministe et rapide avec prix
async function extractFromCSV(content: string, sector: string): Promise<any> {
  const { headers, rows } = parseCSV(content);
  
  if (rows.length === 0) {
    return { items: [], categories: [], method: 'csv-empty' };
  }

  // Mapper les colonnes intelligemment
  const headerLower = headers.map(h => h.toLowerCase());
  
  const nameIdx = headerLower.findIndex(h => 
    h.includes('nom') || h.includes('désignation') || h.includes('designation') || 
    h.includes('article') || h.includes('produit') || h.includes('matériau') || 
    h.includes('materiau') || h.includes('libellé') || h.includes('libelle') ||
    h.includes('name') || h.includes('item')
  );
  
  const qtyIdx = headerLower.findIndex(h => 
    h.includes('quantité') || h.includes('quantite') || h.includes('qté') || 
    h.includes('qte') || h.includes('qty') || h.includes('nombre') || h.includes('quantity')
  );
  
  const unitIdx = headerLower.findIndex(h => 
    h.includes('unité') || h.includes('unite') || h.includes('unit') || h.includes('u.')
  );
  
  const catIdx = headerLower.findIndex(h => 
    h.includes('catégorie') || h.includes('categorie') || h.includes('category') || 
    h.includes('type') || h.includes('famille') || h.includes('groupe')
  );
  
  const descIdx = headerLower.findIndex(h => 
    h.includes('description') || h.includes('détail') || h.includes('detail') || 
    h.includes('commentaire') || h.includes('note') || h.includes('spec')
  );

  // Colonnes pour les prix
  const priceIdx = headerLower.findIndex(h => 
    h.includes('prix') || h.includes('price') || h.includes('tarif') || 
    h.includes('cout') || h.includes('coût') || h.includes('cost') ||
    h.includes('pu') || h.includes('p.u') || h.includes('montant') ||
    h.includes('valeur') || h.includes('value')
  );

  const unitPriceIdx = headerLower.findIndex(h => 
    (h.includes('prix') && h.includes('unit')) || h.includes('pu') || h.includes('p.u') ||
    h.includes('unit price') || h.includes('prix unitaire')
  );

  const totalPriceIdx = headerLower.findIndex(h => 
    (h.includes('prix') && h.includes('total')) || h.includes('montant') ||
    h.includes('total') || h.includes('amount')
  );

  // Colonne pour la devise
  const currencyIdx = headerLower.findIndex(h => 
    h.includes('devise') || h.includes('currency') || h.includes('monnaie')
  );

  // Colonne pour le fournisseur
  const supplierIdx = headerLower.findIndex(h => 
    h.includes('fournisseur') || h.includes('supplier') || h.includes('vendor') ||
    h.includes('fabricant') || h.includes('manufacturer') || h.includes('marque') ||
    h.includes('brand') || h.includes('source')
  );

  // Détecter la devise globale du document
  let globalCurrency: string | null = null;
  // Chercher dans les en-têtes
  for (const header of headers) {
    const detected = detectCurrency(header);
    if (detected) {
      globalCurrency = detected;
      break;
    }
  }
  // Chercher dans les premières lignes si pas trouvé
  if (!globalCurrency) {
    for (let i = 0; i < Math.min(5, rows.length); i++) {
      for (const cell of rows[i]) {
        const detected = detectCurrency(cell);
        if (detected) {
          globalCurrency = detected;
          break;
        }
      }
      if (globalCurrency) break;
    }
  }

  const items: any[] = [];
  const categories = new Set<string>();
  const suppliers = new Set<string>();

  for (const row of rows) {
    // Trouver le nom - si pas de colonne identifiée, prendre la première non-vide
    let name = nameIdx >= 0 ? row[nameIdx] : row.find(cell => cell && cell.length > 2);
    
    if (!name || name.trim().length < 2) continue;
    if (name.toLowerCase().includes('total')) continue;
    
    name = name.trim();
    
    let quantity = qtyIdx >= 0 ? parseFloat(row[qtyIdx]?.replace(/[^\d.,]/g, '').replace(',', '.')) : null;
    if (isNaN(quantity as number)) quantity = null;
    
    const unit = unitIdx >= 0 ? row[unitIdx]?.trim() : null;
    const category = catIdx >= 0 ? row[catIdx]?.trim() || 'Non catégorisé' : 'Non catégorisé';
    const description = descIdx >= 0 ? row[descIdx]?.trim() : null;

    // Extraction du prix
    let priceValue = null;
    let priceCurrency = globalCurrency;
    
    // Priorité: prix unitaire > prix général > prix total
    const priceColIdx = unitPriceIdx >= 0 ? unitPriceIdx : (priceIdx >= 0 ? priceIdx : totalPriceIdx);
    if (priceColIdx >= 0 && row[priceColIdx]) {
      const parsed = parsePrice(row[priceColIdx]);
      priceValue = parsed.price;
      if (parsed.currency) priceCurrency = parsed.currency;
    }

    // Devise explicite
    if (currencyIdx >= 0 && row[currencyIdx]) {
      const detected = detectCurrency(row[currencyIdx]);
      if (detected) priceCurrency = detected;
    }

    // Fournisseur
    const supplier = supplierIdx >= 0 ? row[supplierIdx]?.trim() : null;
    
    items.push({
      name,
      description,
      category,
      quantity,
      unit,
      price: priceValue,
      currency: priceCurrency,
      supplier
    });
    
    if (category && category !== 'Non catégorisé') {
      categories.add(category);
    }
    if (supplier) {
      suppliers.add(supplier);
    }
  }

  return {
    items,
    categories: Array.from(categories),
    suppliers: Array.from(suppliers),
    detectedCurrency: globalCurrency,
    method: 'csv-deterministic',
    stats: {
      totalRows: rows.length,
      extractedItems: items.length,
      itemsWithPrice: items.filter(i => i.price !== null).length,
      itemsWithSupplier: items.filter(i => i.supplier !== null).length,
      headers
    }
  };
}

// Extraction pour texte brut (TXT, DOC converti, PDF converti)
async function extractFromText(content: string, sector: string, fileType: string): Promise<any> {
  const chunks = splitTextIntoChunks(content, 6000);
  const allItems: any[] = [];
  const allCategories = new Set<string>();
  const allSuppliers = new Set<string>();
  
  // Détecter la devise globale du document
  let globalCurrency = detectCurrency(content.substring(0, 5000));
  
  console.log(`📄 Processing ${fileType}: ${chunks.length} chunks, ${content.length} chars total, currency: ${globalCurrency || 'unknown'}`);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Déterminer quel modèle utiliser
    const replicate = getReplicateClient();
    const useGemini = !!replicate;

    const prompt = `Tu es un expert en extraction de données BTP pour le secteur "${sector}".

CONTEXTE: Fichier ${fileType.toUpperCase()}, partie ${i + 1}/${chunks.length}
${globalCurrency ? `DEVISE DÉTECTÉE: ${globalCurrency}` : ''}

CONTENU À ANALYSER:
"""
${chunk}
"""

MISSION CHIRURGICALE - EXTRACTION COMPLÈTE:

FORMAT JSON ATTENDU:
{
  "items": [
    {
      "name": "Nom précis",
      "description": "Détails techniques",
      "category": "Catégorie",
      "quantity": 123.5,
      "unit": "m2",
      "price": 45.00,
      "currency": "EUR",
      "supplier": "Nom fournisseur"
    }
  ],
  "categories": ["Catégorie 1", "Catégorie 2"],
  "suppliers": ["Fournisseur A"]
}

RÉPONDS UNIQUEMENT EN JSON VALIDE.`;

    let responseText = '';
    
    if (useGemini && replicate) {
      try {
        const output = await replicate.run("google/gemini-3-pro", {
          input: {
            prompt: prompt,
            system_instruction: "Tu es un expert en extraction de données BTP. Tu réponds UNIQUEMENT en JSON valide.",
            temperature: 0.2,
            max_output_tokens: 4000
          }
        });
        responseText = Array.isArray(output) ? output.join("") : String(output);
      } catch (geminiError) {
        console.error('Gemini error:', geminiError);
      }
    }
    
    // Fallback OpenAI
    const openai = getOpenAIClient();
    if (!responseText && openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Tu es un expert en extraction de données BTP. Tu réponds UNIQUEMENT en JSON valide.' },
            { role: 'user', content: prompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.2
        });
        responseText = completion.choices[0]?.message?.content?.trim() || '{}';
      } catch (openaiError) {
        console.error('OpenAI error:', openaiError);
      }
    }

    if (!responseText) {
      console.warn(`⚠️ No AI response for chunk ${i + 1}`);
      continue;
    }
    
    // Parsing et agrégation...
    try {
      // Nettoyage JSON
      let cleanJson = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        cleanJson = jsonMatch[1];
      } else {
        const startIdx = responseText.indexOf('{');
        const endIdx = responseText.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          cleanJson = responseText.substring(startIdx, endIdx + 1);
        }
      }
      
      const result = JSON.parse(cleanJson);
      
      if (result.items && Array.isArray(result.items)) {
        allItems.push(...result.items);
        
        // Détecter la devise majoritaire
        result.items.forEach((item: any) => {
          if (item.currency && !globalCurrency) globalCurrency = item.currency;
        });
      }
      
      if (result.categories && Array.isArray(result.categories)) {
        result.categories.forEach((cat: string) => allCategories.add(cat));
      }
      if (result.suppliers && Array.isArray(result.suppliers)) {
        result.suppliers.forEach((sup: string) => allSuppliers.add(sup));
      }
    } catch (parseError) {
      console.error(`Parse error for chunk ${i + 1}:`, parseError);
    }
  }

  // Dédupliquer les items similaires
  const uniqueItems = deduplicateItems(allItems);

  // Collecter les fournisseurs depuis les items
  uniqueItems.forEach(item => {
    if (item.supplier) allSuppliers.add(item.supplier);
  });

  return {
    items: uniqueItems,
    categories: Array.from(allCategories),
    suppliers: Array.from(allSuppliers),
    detectedCurrency: globalCurrency,
    method: 'ai-extraction',
    stats: {
      chunks: chunks.length,
      totalChars: content.length,
      rawItems: allItems.length,
      uniqueItems: uniqueItems.length,
      itemsWithPrice: uniqueItems.filter(i => i.price !== null && i.price !== undefined).length,
      itemsWithSupplier: uniqueItems.filter(i => i.supplier !== null && i.supplier !== undefined).length
    }
  };
}

// Fonction de déduplication intelligente
function deduplicateItems(items: any[]): any[] {
  const seen = new Map<string, any>();
  
  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    
    if (seen.has(key)) {
      // Fusionner les données
      const existing = seen.get(key);
      
      // Fusionner les quantités si possible
      if (item.quantity && existing.quantity) {
        existing.quantity += item.quantity;
      } else if (item.quantity && !existing.quantity) {
        existing.quantity = item.quantity;
      }
      
      // Garder la description la plus longue
      if (item.description && (!existing.description || item.description.length > existing.description.length)) {
        existing.description = item.description;
      }
      
      // Garder le prix s'il n'existe pas encore
      if (item.price && !existing.price) {
        existing.price = item.price;
        existing.currency = item.currency || existing.currency;
      }
      
      // Garder le fournisseur s'il n'existe pas encore
      if (item.supplier && !existing.supplier) {
        existing.supplier = item.supplier;
      }
      
      // Garder la devise si pas encore définie
      if (item.currency && !existing.currency) {
        existing.currency = item.currency;
      }
    } else {
      seen.set(key, { ...item });
    }
  }
  
  return Array.from(seen.values());
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const textContent = formData.get('textContent') as string | null;
    const fileType = formData.get('fileType') as string || 'unknown';
    const sector = formData.get('sector') as string || 'Construction BTP';

    let content = textContent || '';
    let detectedType = fileType.toLowerCase();

    // Si un fichier est fourni, lire son contenu
    if (file) {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.csv')) {
        detectedType = 'csv';
        content = await file.text();
      } else if (fileName.endsWith('.txt')) {
        detectedType = 'txt';
        content = await file.text();
      } else if (fileName.endsWith('.pdf')) {
        detectedType = 'pdf';
        // Pour PDF, le contenu doit être extrait côté client avec pdf.js
        // ou on utilise le textContent fourni
        if (!textContent) {
          return NextResponse.json({
            error: 'Pour les PDF, veuillez extraire le texte côté client avec pdf.js',
            hint: 'Utilisez pdfjs-dist pour extraire le texte avant d\'appeler cette API'
          }, { status: 400 });
        }
      } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        detectedType = 'doc';
        // Pour DOC/DOCX, le contenu doit être extrait côté client
        if (!textContent) {
          return NextResponse.json({
            error: 'Pour les fichiers Word, veuillez extraire le texte côté client',
            hint: 'Utilisez mammoth.js pour les fichiers .docx'
          }, { status: 400 });
        }
      }
    }

    if (!content || content.trim().length < 10) {
      return NextResponse.json({
        error: 'Contenu insuffisant pour extraction',
        received: content?.length || 0
      }, { status: 400 });
    }

    console.log(`📁 Processing ${detectedType} file: ${content.length} chars`);

    let result;

    // Choisir la méthode d'extraction selon le type
    if (detectedType === 'csv') {
      result = await extractFromCSV(content, sector);
    } else {
      // TXT, PDF (texte extrait), DOC (texte extrait)
      result = await extractFromText(content, sector, detectedType);
    }

    console.log(`✅ Extracted ${result.items.length} items via ${result.method}`);

    return NextResponse.json({
      success: true,
      ...result,
      fileType: detectedType
    });

  } catch (error) {
    console.error('❌ Extraction error:', error);
    return NextResponse.json({
      error: 'Erreur lors de l\'extraction',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
