import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { config } from 'dotenv';

// Charger les variables d'environnement depuis .env.local
config({ path: path.join(process.cwd(), '.env.local') });

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Les variables d\'environnement Supabase ne sont pas définies');
  console.error('   Assurez-vous que .env.local contient:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CSVRow {
  'NO ORDRE'?: string;
  'No ORDRE'?: string;
  DESIGNATION?: string;
  UNITE?: string;
  QUANTITE?: string;
  'PRIX UNITAIRE HT'?: string;
  'PRIX TOTAL HT'?: string;
  FOURNISSEUR?: string;
}

interface Material {
  name: string;
  category: string;
  quantity: number | null;
  specs: {
    unit?: string;
    prix_unitaire_ht?: number;
    prix_total_ht?: number;
    fournisseur?: string;
    description?: string;
  };
}

// Fonction pour nettoyer les nombres (enlever les espaces et convertir)
function cleanNumber(value: string | undefined): number | null {
  if (!value) return null;
  const cleaned = value.replace(/\s/g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Fonction pour extraire la catégorie du nom de fichier
function extractCategory(filename: string): string {
  const match = filename.match(/COMMANDE\s+(\d+[-\s]*[A-Z\s]+)/i);
  if (match) {
    return match[1].trim();
  }
  return 'Divers';
}

// Fonction pour parser un fichier CSV
async function parseCSVFile(filePath: string): Promise<Material[]> {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const category = extractCategory(path.basename(filePath));
  const materials: Material[] = [];
  
  // Parser sans header pour avoir accès aux lignes brutes
  const parsed = Papa.parse(fileContent, {
    header: false,
    skipEmptyLines: true,
  });
  
  const rows = parsed.data as string[][];
  
  // Trouver la ligne d'en-tête (celle qui contient "NO ORDRE" ou "No ORDRE")
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.some(cell => cell && (cell.includes('NO ORDRE') || cell.includes('No ORDRE')))) {
      headerIndex = i;
      break;
    }
  }
  
  if (headerIndex === -1) {
    console.warn(`   ⚠️  Aucune ligne d'en-tête trouvée dans ${path.basename(filePath)}`);
    return materials;
  }
  
  const headers = rows[headerIndex];
  
  // Trouver les indices des colonnes importantes
  const indices = {
    noOrdre: headers.findIndex(h => h && (h.includes('NO ORDRE') || h.includes('No ORDRE'))),
    designation: headers.findIndex(h => h && h.includes('DESIGNATION')),
    unite: headers.findIndex(h => h && h.includes('UNITE')),
    quantite: headers.findIndex(h => h && h.includes('QUANTITE')),
    prixUnitaire: headers.findIndex(h => h && h.includes('PRIX UNITAIRE')),
    prixTotal: headers.findIndex(h => h && h.includes('PRIX TOTAL')),
    fournisseur: headers.findIndex(h => h && h.includes('FOURNISSEUR')),
  };
  
  // Parser les lignes de données (après l'en-tête)
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    
    const noOrdre = row[indices.noOrdre]?.trim();
    const designation = row[indices.designation]?.trim();
    const unite = row[indices.unite]?.trim();
    const quantite = row[indices.quantite]?.trim();
    const prixUnitaire = row[indices.prixUnitaire]?.trim();
    const prixTotal = row[indices.prixTotal]?.trim();
    const fournisseur = row[indices.fournisseur]?.trim();
    
    // Ignorer les lignes vides, les en-têtes et les totaux
    if (!designation || 
        !noOrdre || 
        designation.includes('SERIE') || 
        designation.includes('TOTAL') ||
        designation.includes('COMMANDE') ||
        designation === '' ||
        noOrdre === '') {
      continue;
    }
    
    // Vérifier que noOrdre est un nombre
    const noOrdreNum = parseInt(noOrdre);
    if (isNaN(noOrdreNum)) {
      continue;
    }
    
    // Créer le matériau
    const material: Material = {
      name: designation,
      category: category,
      quantity: cleanNumber(quantite),
      specs: {
        unit: unite || undefined,
        prix_unitaire_ht: cleanNumber(prixUnitaire) || undefined,
        prix_total_ht: cleanNumber(prixTotal) || undefined,
        fournisseur: fournisseur || undefined,
        description: unite || undefined, // Utiliser l'unité comme description
      }
    };
    
    materials.push(material);
  }
  
  return materials;
}

// Fonction principale
async function importSNIProject() {
  try {
    console.log('🚀 Début de l\'importation du projet SNI...\n');
    
    // 1. Récupérer l'utilisateur (prendre le premier admin)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (userError || !users || users.length === 0) {
      throw new Error('Aucun utilisateur trouvé');
    }
    
    const userId = users[0].id;
    console.log(`✅ Utilisateur trouvé: ${userId}\n`);
    
    // 2. Créer le projet
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name: 'Projet SNI 1 maison',
        mapping_status: 'completed'
      })
      .select()
      .single();
    
    if (projectError || !project) {
      throw new Error(`Erreur lors de la création du projet: ${projectError?.message}`);
    }
    
    console.log(`✅ Projet créé: ${project.name} (ID: ${project.id})\n`);
    
    // 2.5. Ajouter l'utilisateur comme collaborateur du projet
    const { data: userDetails, error: userDetailsError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (!userDetailsError && userDetails) {
      const { error: collaboratorError } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: project.id,
          user_id: userId,
          email: userDetails.email,
          role: 'owner',
          status: 'accepted',
          accepted_at: new Date().toISOString()
        });
      
      if (collaboratorError) {
        console.warn(`⚠️  Erreur lors de l'ajout du collaborateur: ${collaboratorError.message}`);
      } else {
        console.log(`✅ Utilisateur ajouté comme propriétaire du projet\n`);
      }
    }
    
    // 3. Lire tous les fichiers CSV du dossier
    const csvDir = path.join(process.cwd(), 'csv');
    const files = fs.readdirSync(csvDir).filter(f => f.endsWith('.csv'));
    
    console.log(`📁 ${files.length} fichiers CSV trouvés:\n`);
    files.forEach(f => console.log(`   - ${f}`));
    console.log('');
    
    // 4. Parser tous les fichiers CSV
    let allMaterials: Material[] = [];
    
    for (const file of files) {
      const filePath = path.join(csvDir, file);
      console.log(`📄 Traitement de ${file}...`);
      
      try {
        const materials = await parseCSVFile(filePath);
        console.log(`   ✅ ${materials.length} matériaux extraits`);
        allMaterials = allMaterials.concat(materials);
      } catch (error) {
        console.error(`   ❌ Erreur lors du traitement de ${file}:`, error);
      }
    }
    
    console.log(`\n📊 Total: ${allMaterials.length} matériaux à insérer\n`);
    
    // 5. Insérer les matériaux dans la base de données
    if (allMaterials.length > 0) {
      const materialsToInsert = allMaterials.map(m => ({
        project_id: project.id,
        name: m.name,
        category: m.category,
        quantity: m.quantity,
        specs: m.specs
      }));
      
      // Insérer par lots de 100 pour éviter les timeouts
      const batchSize = 100;
      let inserted = 0;
      
      for (let i = 0; i < materialsToInsert.length; i += batchSize) {
        const batch = materialsToInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('materials')
          .insert(batch);
        
        if (insertError) {
          console.error(`❌ Erreur lors de l'insertion du lot ${i / batchSize + 1}:`, insertError);
        } else {
          inserted += batch.length;
          console.log(`✅ Lot ${i / batchSize + 1}: ${batch.length} matériaux insérés (Total: ${inserted}/${materialsToInsert.length})`);
        }
      }
      
      console.log(`\n🎉 Importation terminée avec succès!`);
      console.log(`   - Projet: ${project.name}`);
      console.log(`   - ID: ${project.id}`);
      console.log(`   - Matériaux insérés: ${inserted}/${allMaterials.length}`);
    } else {
      console.log('⚠️  Aucun matériau à insérer');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation:', error);
    process.exit(1);
  }
}

// Exécuter le script
importSNIProject();
