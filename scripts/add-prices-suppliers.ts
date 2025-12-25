import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement depuis .env.local
config({ path: path.join(process.cwd(), '.env.local') });

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Les variables d\'environnement Supabase ne sont pas définies');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PROJECT_ID = '38abdec1-f236-4e2b-b116-39c100fdfb6a';

async function addPricesAndSuppliers() {
  try {
    console.log('🚀 Début de l\'ajout des prix et fournisseurs...\n');
    
    // 1. Récupérer tous les matériaux du projet
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*')
      .eq('project_id', PROJECT_ID);
    
    if (materialsError) {
      throw new Error(`Erreur lors de la récupération des matériaux: ${materialsError.message}`);
    }
    
    console.log(`📦 ${materials.length} matériaux trouvés\n`);
    
    // 2. Extraire tous les fournisseurs uniques
    const suppliersSet = new Set<string>();
    materials.forEach(material => {
      const fournisseur = material.specs?.fournisseur;
      if (fournisseur && fournisseur.trim() !== '') {
        suppliersSet.add(fournisseur.trim());
      }
    });
    
    const supplierNames = Array.from(suppliersSet);
    console.log(`🏢 ${supplierNames.length} fournisseurs uniques trouvés:`);
    supplierNames.forEach(name => console.log(`   - ${name}`));
    console.log('');
    
    // 3. Créer ou récupérer les fournisseurs
    const supplierMap = new Map<string, string>(); // nom -> id
    
    for (const supplierName of supplierNames) {
      // Vérifier si le fournisseur existe déjà
      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('name', supplierName)
        .single();
      
      if (existingSupplier) {
        supplierMap.set(supplierName, existingSupplier.id);
        console.log(`✅ Fournisseur existant: ${supplierName}`);
      } else {
        // Créer le fournisseur
        const { data: newSupplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            name: supplierName,
            country: 'Gabon',
            contact_info: {
              type: 'local',
              source: 'CSV Import'
            }
          })
          .select()
          .single();
        
        if (supplierError) {
          console.error(`❌ Erreur création fournisseur ${supplierName}:`, supplierError.message);
        } else {
          supplierMap.set(supplierName, newSupplier.id);
          console.log(`✅ Fournisseur créé: ${supplierName}`);
        }
      }
    }
    
    console.log(`\n📊 ${supplierMap.size} fournisseurs prêts\n`);
    
    // 4. Créer les prix pour chaque matériau
    let pricesCreated = 0;
    let pricesSkipped = 0;
    
    for (const material of materials) {
      const specs = material.specs || {};
      const fournisseur = specs.fournisseur?.trim();
      const prixUnitaire = specs.prix_unitaire_ht;
      
      // Ignorer si pas de fournisseur ou pas de prix
      if (!fournisseur || !prixUnitaire) {
        pricesSkipped++;
        continue;
      }
      
      const supplierId = supplierMap.get(fournisseur);
      if (!supplierId) {
        console.warn(`⚠️  Fournisseur non trouvé pour ${material.name}: ${fournisseur}`);
        pricesSkipped++;
        continue;
      }
      
      // Vérifier si le prix existe déjà
      const { data: existingPrice } = await supabase
        .from('prices')
        .select('id')
        .eq('material_id', material.id)
        .eq('supplier_id', supplierId)
        .single();
      
      if (existingPrice) {
        pricesSkipped++;
        continue;
      }
      
      // Créer le prix
      const { error: priceError } = await supabase
        .from('prices')
        .insert({
          material_id: material.id,
          supplier_id: supplierId,
          country: 'Gabon',
          amount: prixUnitaire,
          currency: 'CFA',
          notes: specs.description || specs.unit || null
        });
      
      if (priceError) {
        console.error(`❌ Erreur création prix pour ${material.name}:`, priceError.message);
      } else {
        pricesCreated++;
        if (pricesCreated % 50 === 0) {
          console.log(`   ✅ ${pricesCreated} prix créés...`);
        }
      }
    }
    
    console.log(`\n🎉 Importation terminée avec succès!`);
    console.log(`   - Fournisseurs: ${supplierMap.size}`);
    console.log(`   - Prix créés: ${pricesCreated}`);
    console.log(`   - Prix ignorés: ${pricesSkipped}`);
    console.log(`   - Total matériaux: ${materials.length}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des prix et fournisseurs:', error);
    process.exit(1);
  }
}

// Exécuter le script
addPricesAndSuppliers();
