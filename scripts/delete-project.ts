/**
 * Script pour supprimer un projet et toutes ses données
 * Usage: npx ts-node scripts/delete-project.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Configuration - Projet à supprimer
const PROJECT_NAME = 'Projet SNI 1 maison';

async function main() {
  console.log('🗑️  Script de suppression de projet');
  console.log('====================================');
  console.log(`📁 Projet à supprimer: ${PROJECT_NAME}`);
  console.log('');

  // Vérifier les credentials
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY.includes('placeholder')) {
    console.error('❌ ERREUR: SUPABASE_SERVICE_ROLE_KEY n\'est pas configuré!');
    console.log('');
    console.log('Alternative: Exécutez le SQL suivant dans Supabase Studio:');
    console.log('');
    console.log(`
-- 1. Trouver l'ID du projet
SELECT id, name, user_id FROM projects WHERE name ILIKE '%${PROJECT_NAME}%';

-- 2. Supprimer les données liées (remplacer PROJECT_ID par l'ID trouvé)
-- DELETE FROM project_history WHERE project_id = 'PROJECT_ID';
-- DELETE FROM project_collaborators WHERE project_id = 'PROJECT_ID';
-- DELETE FROM prices WHERE material_id IN (SELECT id FROM materials WHERE project_id = 'PROJECT_ID');
-- DELETE FROM material_comments WHERE material_id IN (SELECT id FROM materials WHERE project_id = 'PROJECT_ID');
-- DELETE FROM materials WHERE project_id = 'PROJECT_ID';
-- DELETE FROM projects WHERE id = 'PROJECT_ID';
`);
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Trouver le(s) projet(s) correspondant
    console.log('🔍 Recherche du projet...');
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .ilike('name', `%${PROJECT_NAME}%`);

    if (projectError) {
      throw new Error(`Erreur lors de la recherche: ${projectError.message}`);
    }

    if (!projects || projects.length === 0) {
      console.log(`❌ Aucun projet trouvé avec le nom "${PROJECT_NAME}"`);
      process.exit(0);
    }

    console.log(`✅ ${projects.length} projet(s) trouvé(s):`);
    projects.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (ID: ${p.id})`);
    });
    console.log('');

    // 2. Supprimer chaque projet
    for (const project of projects) {
      console.log(`🗑️  Suppression de "${project.name}"...`);

      // 2a. Supprimer l'historique du projet
      const { error: historyError } = await supabase
        .from('project_history')
        .delete()
        .eq('project_id', project.id);

      if (historyError) {
        console.log(`   ⚠️  project_history: ${historyError.message}`);
      } else {
        console.log('   ✓ project_history supprimé');
      }

      // 2b. Supprimer les collaborateurs
      const { error: collabError } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('project_id', project.id);

      if (collabError) {
        console.log(`   ⚠️  project_collaborators: ${collabError.message}`);
      } else {
        console.log('   ✓ project_collaborators supprimé');
      }

      // 2c. Récupérer les IDs des matériaux
      const { data: materials } = await supabase
        .from('materials')
        .select('id')
        .eq('project_id', project.id);

      const materialIds = materials?.map(m => m.id) || [];
      console.log(`   📦 ${materialIds.length} matériaux trouvés`);

      if (materialIds.length > 0) {
        // 2d. Supprimer les prix
        const { error: pricesError } = await supabase
          .from('prices')
          .delete()
          .in('material_id', materialIds);

        if (pricesError) {
          console.log(`   ⚠️  prices: ${pricesError.message}`);
        } else {
          console.log('   ✓ prices supprimés');
        }

        // 2e. Supprimer les commentaires
        const { error: commentsError } = await supabase
          .from('material_comments')
          .delete()
          .in('material_id', materialIds);

        if (commentsError) {
          console.log(`   ⚠️  material_comments: ${commentsError.message}`);
        } else {
          console.log('   ✓ material_comments supprimés');
        }

        // 2f. Supprimer les matériaux
        const { error: materialsError } = await supabase
          .from('materials')
          .delete()
          .eq('project_id', project.id);

        if (materialsError) {
          console.log(`   ⚠️  materials: ${materialsError.message}`);
        } else {
          console.log('   ✓ materials supprimés');
        }
      }

      // 2g. Supprimer le projet
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (deleteError) {
        console.error(`   ❌ Erreur suppression projet: ${deleteError.message}`);
      } else {
        console.log(`   ✅ Projet "${project.name}" supprimé avec succès!`);
      }

      console.log('');
    }

    console.log('🎉 Suppression terminée!');

  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
