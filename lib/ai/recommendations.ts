import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Material {
  id: string;
  name: string;
  category: string | null;
  quantity: number | null;
  specs: any;
  prices?: Array<{
    id: string;
    amount: number;
    currency: string;
    supplier_name: string;
    country: string;
  }>;
}

export interface Recommendation {
  type: 'alternative' | 'bulk_discount' | 'quantity_optimization' | 'grouping' | 'timing';
  priority: 'high' | 'medium' | 'low';
  materialId: string;
  materialName: string;
  title: string;
  description: string;
  potentialSavings: number;
  savingsPercentage: number;
  actionable: boolean;
  action?: string;
  details?: any;
}

export async function generateRecommendations(
  materials: Material[],
  projectBudget?: number
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // 1. Recommandations basées sur les prix
  recommendations.push(...analyzePriceOpportunities(materials));

  // 2. Recommandations de quantités
  recommendations.push(...analyzeQuantityOptimizations(materials));

  // 3. Recommandations de groupement
  recommendations.push(...analyzeGroupingOpportunities(materials));

  // 4. Recommandations IA avancées
  const aiRecommendations = await generateAIRecommendations(materials);
  recommendations.push(...aiRecommendations);

  // Trier par économies potentielles
  return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
}

// Analyser les opportunités de prix
function analyzePriceOpportunities(materials: Material[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  materials.forEach(material => {
    if (!material.prices || material.prices.length < 2) return;

    const prices = material.prices.map(p => p.amount).sort((a, b) => a - b);
    const lowestPrice = prices[0];
    const highestPrice = prices[prices.length - 1];
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Si l'écart est > 20%, recommander le fournisseur le moins cher
    const priceDifference = highestPrice - lowestPrice;
    const percentageDiff = (priceDifference / highestPrice) * 100;

    if (percentageDiff > 20) {
      const lowestPriceSupplier = material.prices.find(p => p.amount === lowestPrice);
      const potentialSavings = (averagePrice - lowestPrice) * (material.quantity || 1);

      recommendations.push({
        type: 'alternative',
        priority: percentageDiff > 40 ? 'high' : 'medium',
        materialId: material.id,
        materialName: material.name,
        title: `Économisez ${percentageDiff.toFixed(0)}% sur ${material.name}`,
        description: `Le fournisseur ${lowestPriceSupplier?.supplier_name} (${lowestPriceSupplier?.country}) propose ce matériau ${percentageDiff.toFixed(0)}% moins cher que la moyenne.`,
        potentialSavings,
        savingsPercentage: percentageDiff,
        actionable: true,
        action: `Choisir ${lowestPriceSupplier?.supplier_name}`,
        details: {
          lowestPrice,
          averagePrice,
          supplier: lowestPriceSupplier,
        }
      });
    }
  });

  return recommendations;
}

// Analyser les optimisations de quantités
function analyzeQuantityOptimizations(materials: Material[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  materials.forEach(material => {
    if (!material.quantity || !material.prices || material.prices.length === 0) return;

    const avgPrice = material.prices.reduce((sum, p) => sum + p.amount, 0) / material.prices.length;
    const totalCost = avgPrice * material.quantity;

    // Suggérer des quantités optimales (multiples de 10, 50, 100)
    const optimalQuantities = [10, 50, 100, 500, 1000];
    const nearestOptimal = optimalQuantities.find(q => q >= material.quantity);

    if (nearestOptimal && nearestOptimal > material.quantity) {
      const quantityIncrease = nearestOptimal - material.quantity;
      const percentageIncrease = (quantityIncrease / material.quantity) * 100;

      // Si l'augmentation est < 20%, suggérer pour bénéficier de tarifs de gros
      if (percentageIncrease < 20) {
        const potentialBulkDiscount = totalCost * 0.1; // Estimation 10% de remise

        recommendations.push({
          type: 'bulk_discount',
          priority: 'medium',
          materialId: material.id,
          materialName: material.name,
          title: `Remise en gros possible pour ${material.name}`,
          description: `Commander ${nearestOptimal} unités au lieu de ${material.quantity} pourrait vous faire bénéficier d'une remise de gros (estimée à 10%).`,
          potentialSavings: potentialBulkDiscount,
          savingsPercentage: 10,
          actionable: true,
          action: `Augmenter à ${nearestOptimal} unités`,
          details: {
            currentQuantity: material.quantity,
            suggestedQuantity: nearestOptimal,
            estimatedDiscount: 10,
          }
        });
      }
    }
  });

  return recommendations;
}

// Analyser les opportunités de groupement
function analyzeGroupingOpportunities(materials: Material[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Grouper par catégorie
  const categorizedMaterials = materials.reduce((acc, material) => {
    const category = material.category || 'Autre';
    if (!acc[category]) acc[category] = [];
    acc[category].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  // Analyser chaque catégorie
  Object.entries(categorizedMaterials).forEach(([category, categoryMaterials]) => {
    if (categoryMaterials.length < 2) return;

    // Trouver les fournisseurs communs
    const supplierCounts: Record<string, { count: number; materials: string[] }> = {};

    categoryMaterials.forEach(material => {
      material.prices?.forEach(price => {
        const key = `${price.supplier_name}-${price.country}`;
        if (!supplierCounts[key]) {
          supplierCounts[key] = { count: 0, materials: [] };
        }
        supplierCounts[key].count++;
        supplierCounts[key].materials.push(material.name);
      });
    });

    // Si un fournisseur a plusieurs matériaux, suggérer un groupement
    Object.entries(supplierCounts).forEach(([supplier, data]) => {
      if (data.count >= 2) {
        const [supplierName, country] = supplier.split('-');
        const estimatedSavings = data.count * 500; // Estimation

        recommendations.push({
          type: 'grouping',
          priority: data.count >= 3 ? 'high' : 'medium',
          materialId: categoryMaterials[0].id,
          materialName: category,
          title: `Groupez vos achats chez ${supplierName}`,
          description: `${supplierName} (${country}) propose ${data.count} matériaux de la catégorie "${category}". Grouper votre commande pourrait réduire les frais de port et obtenir une remise.`,
          potentialSavings: estimatedSavings,
          savingsPercentage: 15,
          actionable: true,
          action: `Contacter ${supplierName} pour une commande groupée`,
          details: {
            supplier: supplierName,
            country,
            materialsCount: data.count,
            materials: data.materials,
          }
        });
      }
    });
  });

  return recommendations;
}

// Générer des recommandations IA avancées
async function generateAIRecommendations(materials: Material[]): Promise<Recommendation[]> {
  try {
    // Préparer les données pour l'IA
    const materialsData = materials.map(m => ({
      name: m.name,
      category: m.category,
      quantity: m.quantity,
      priceRange: m.prices ? {
        min: Math.min(...m.prices.map(p => p.amount)),
        max: Math.max(...m.prices.map(p => p.amount)),
        avg: m.prices.reduce((sum, p) => sum + p.amount, 0) / m.prices.length,
      } : null,
      suppliers: m.prices?.map(p => ({ name: p.supplier_name, country: p.country })) || [],
    }));

    const prompt = `Tu es un expert en achats de matériaux de construction. Analyse ces matériaux et génère des recommandations d'optimisation:

${JSON.stringify(materialsData, null, 2)}

Génère 2-3 recommandations intelligentes pour:
1. Matériaux alternatifs équivalents mais moins chers
2. Optimisations de timing d'achat (saisonnalité)
3. Opportunités d'économies non évidentes

Format de réponse JSON:
{
  "recommendations": [
    {
      "materialName": "nom du matériau",
      "title": "Titre court",
      "description": "Description détaillée",
      "potentialSavings": nombre,
      "savingsPercentage": nombre,
      "action": "Action recommandée"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en optimisation des achats de construction. Tu fournis des recommandations concrètes et chiffrées.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0].message.content;
    if (!response) return [];

    const aiResponse = JSON.parse(response);
    
    return aiResponse.recommendations.map((rec: any) => ({
      type: 'alternative' as const,
      priority: rec.savingsPercentage > 25 ? 'high' as const : 'medium' as const,
      materialId: materials.find(m => m.name === rec.materialName)?.id || '',
      materialName: rec.materialName,
      title: rec.title,
      description: rec.description,
      potentialSavings: rec.potentialSavings,
      savingsPercentage: rec.savingsPercentage,
      actionable: true,
      action: rec.action,
    }));

  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    return [];
  }
}
