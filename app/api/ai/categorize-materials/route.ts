import { NextRequest, NextResponse } from 'next/server';
import { completeJSON } from '@/lib/ai/clients';

const BTP_CATEGORIES = [
  'Gros œuvre',
  'Électricité',
  'Plomberie',
  'Menuiserie',
  'Peinture et Décoration',
  'Carrelage et Revêtements',
  'Quincaillerie',
  'Sanitaire',
  'Éclairage',
  'Serrurerie',
  'Plâtrerie et Isolation',
  'Chauffage et Climatisation',
  'Outillage',
  'Sécurité et Protection',
  'Toiture et Couverture',
  'Jardin et Extérieurs',
  'Divers'
];

// Fonction simple de catégorisation par mots-clés
function preCategorizeByKeywords(itemName: string): string | null {
  const name = itemName.toLowerCase();
  
  if (name.includes('ciment') || name.includes('béton') || name.includes('brique') || name.includes('parpaing') || name.includes('sable') || name.includes('fer à béton')) return 'Gros œuvre';
  if (name.includes('câble') || name.includes('fil') || name.includes('disjoncteur') || name.includes('interrupteur') || name.includes('prise') || name.includes('tableau électrique')) return 'Électricité';
  if (name.includes('tuyau') || name.includes('raccord') || name.includes('vanne') || name.includes('robinet') || name.includes('siphon')) return 'Plomberie';
  if (name.includes('porte') || name.includes('fenêtre') || name.includes('bois') || name.includes('planche') || name.includes('tasseau')) return 'Menuiserie';
  if (name.includes('peinture') || name.includes('vernis') || name.includes('enduit') || name.includes('pinceau') || name.includes('rouleau')) return 'Peinture et Décoration';
  if (name.includes('carrelage') || name.includes('faience') || name.includes('sol') || name.includes('colle carrelage')) return 'Carrelage et Revêtements';
  if (name.includes('vis') || name.includes('clou') || name.includes('boulon') || name.includes('cheville') || name.includes('écrou')) return 'Quincaillerie';
  if (name.includes('wc') || name.includes('lavabo') || name.includes('douche') || name.includes('baignoire') || name.includes('évier')) return 'Sanitaire';
  if (name.includes('lampe') || name.includes('spot') || name.includes('ampoule') || name.includes('led') || name.includes('projecteur')) return 'Éclairage';
  if (name.includes('serrure') || name.includes('poignée') || name.includes('cylindre') || name.includes('verrou')) return 'Serrurerie';
  if (name.includes('placo') || name.includes('plâtre') || name.includes('ba13') || name.includes('rail') || name.includes('montant') || name.includes('isolation') || name.includes('laine')) return 'Plâtrerie et Isolation';
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { materials, projectType } = await request.json();

    if (!materials || !Array.isArray(materials) || materials.length === 0) {
      return NextResponse.json(
        { error: 'Liste de matériaux requise' },
        { status: 400 }
      );
    }

    console.log(`🏷️ Categorizing ${materials.length} materials...`);

    // Étape 1: Pré-catégorisation par mots-clés (rapide)
    const categoryMap: Record<number, string> = {};
    const uncategorizedIndices: number[] = [];
    
    materials.forEach((m: any, index: number) => {
      const preCategory = preCategorizeByKeywords(m.name);
      if (preCategory) {
        categoryMap[index] = preCategory;
      } else {
        uncategorizedIndices.push(index);
      }
    });

    console.log(`📊 Pre-categorized ${Object.keys(categoryMap).length} by keywords, ${uncategorizedIndices.length} need AI`);

    let modelUsed = 'keywords';

    // Étape 2: Catégorisation IA pour les éléments non catégorisés
    if (uncategorizedIndices.length > 0) {
      const uncategorizedMaterials = uncategorizedIndices.map((idx, i) => 
        `${i + 1}. [IDX:${idx}] ${materials[idx].name}${materials[idx].description ? ` - ${materials[idx].description}` : ''}`
      ).join('\n');

      const prompt = `Tu es un EXPERT en matériaux de construction BTP avec 30 ans d'expérience.

MISSION CRITIQUE: Catégorise CHAQUE matériau ci-dessous dans la catégorie la plus appropriée.

CATÉGORIES DISPONIBLES (utilise EXACTEMENT ces noms):
${BTP_CATEGORIES.map(c => `• ${c}`).join('\n')}

GUIDE DE CATÉGORISATION:
- Gros œuvre: ciment, béton, parpaings, ferraille, fondations
- Électricité: tout ce qui est câbles, fils, prises, interrupteurs, tableaux
- Plomberie: tuyaux, raccords, vannes, évacuations
- Menuiserie: bois, portes, fenêtres, parquet
- Peinture & Finitions: peintures, enduits, vernis
- Carrelage & Revêtements: carreaux, faïence, sols
- Quincaillerie: vis, clous, boulons, fixations
- Sanitaire: WC, lavabos, douches, baignoires
- Éclairage: lampes, spots, LED, luminaires
- Serrurerie: serrures, poignées, métal, acier
- Plâtrerie: placo, BA13, enduits plâtre

TYPE DE PROJET: ${projectType || 'Construction générale'}

MATÉRIAUX À CATÉGORISER:
${uncategorizedMaterials}

RÈGLES STRICTES:
1. CHAQUE matériau DOIT avoir une catégorie
2. Utilise "Divers" UNIQUEMENT si vraiment inclassable
3. Le champ originalIndex correspond au numéro entre [IDX:X]

RÉPONDS EN JSON VALIDE:
{
  "categorizations": [
    { "originalIndex": 0, "category": "Catégorie" },
    { "originalIndex": 5, "category": "Catégorie" }
  ]
}`;

      try {
        console.log('🧠 AI Categorizing with unified client (DeepSeek > Gemini > OpenAI)...');

        const systemPrompt = "Tu es un expert BTP. Tu catégorises les matériaux de construction. Tu réponds UNIQUEMENT en JSON valide.";

        const result = await completeJSON<{ categorizations: Array<{ originalIndex?: number; index?: number; category: string }> }>(
          prompt,
          systemPrompt,
          { temperature: 0.2, maxTokens: 4000 }
        );

        modelUsed = `${result.provider}/${result.model}`;
        console.log(`✅ AI categorization completed with ${modelUsed}`);

        // Ajouter les catégories IA au mapping
        if (result.data.categorizations && Array.isArray(result.data.categorizations)) {
          for (const cat of result.data.categorizations) {
            const idx = cat.originalIndex ?? (cat.index ? cat.index - 1 : null);
            if (idx !== null && idx !== undefined) {
              // Valider que la catégorie existe dans notre liste
              const validCategory = BTP_CATEGORIES.includes(cat.category)
                ? cat.category
                : 'Divers';
              categoryMap[idx] = validCategory;
            }
          }
        }
        console.log(`🤖 AI categorized ${result.data.categorizations?.length || 0} additional items`);
      } catch (parseError) {
        console.error('AI categorization error:', parseError);
        // En cas d'erreur, mettre les non-catégorisés en "Divers"
        uncategorizedIndices.forEach(idx => {
          if (!categoryMap[idx]) {
            categoryMap[idx] = 'Divers';
          }
        });
      }
    }

    // S'assurer que tous les matériaux ont une catégorie
    materials.forEach((_: any, index: number) => {
      if (!categoryMap[index]) {
        categoryMap[index] = 'Divers';
      }
    });

    console.log(`✅ Total categorized: ${Object.keys(categoryMap).length} materials with ${modelUsed}`);

    return NextResponse.json({
      success: true,
      categoryMap,
      categories: BTP_CATEGORIES,
      model: modelUsed,
      stats: {
        total: materials.length,
        byKeywords: materials.length - uncategorizedIndices.length,
        byAI: uncategorizedIndices.length
      }
    });

  } catch (error) {
    console.error('Categorization error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la catégorisation' },
      { status: 500 }
    );
  }
}
