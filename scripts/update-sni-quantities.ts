/**
 * Script pour multiplier par 15 les quantités du projet TOTAL SNI DQE
 * Usage: npx ts-node scripts/update-sni-quantities.ts
 *
 * IMPORTANT: Assurez-vous que SUPABASE_SERVICE_ROLE_KEY est défini dans .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Configuration
const USER_EMAIL = 'ompayijunior@gmail.com';
const PROJECT_NAME = 'TOTAL SNI DQE';
const MULTIPLIER = 15;

async function main() {
  console.log('🔧 Script de mise à jour des quantités');
  console.log('=====================================');
  console.log(`📧 Utilisateur: ${USER_EMAIL}`);
  console.log(`📁 Projet: ${PROJECT_NAME}`);
  console.log(`✖️  Multiplicateur: ${MULTIPLIER}`);
  console.log('');

  // Vérifier les credentials
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY.includes('placeholder')) {
    console.error('❌ ERREUR: SUPABASE_SERVICE_ROLE_KEY n\'est pas configuré!');
    console.log('');
    console.log('Pour obtenir la clé service role:');
    console.log('1. Allez sur https://supabase.com/dashboard');
    console.log('2. Sélectionnez votre projet');
    console.log('3. Settings > API > Service role key');
    console.log('4. Copiez-la dans .env.local');
    console.log('');
    console.log('Alternative: Exécutez le SQL suivant dans Supabase Studio:');
    console.log('');
    console.log(`UPDATE materials
SET quantity = quantity * ${MULTIPLIER}
WHERE project_id IN (
  SELECT p.id
  FROM projects p
  JOIN users u ON p.user_id = u.id
  WHERE p.name ILIKE '%${PROJECT_NAME}%'
    AND u.email = '${USER_EMAIL}'
);`);
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Trouver l'utilisateur
    console.log('🔍 Recherche de l\'utilisateur...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', USER_EMAIL)
      .single();

    if (userError || !user) {
      throw new Error(`Utilisateur non trouvé: ${USER_EMAIL}`);
    }
    console.log(`✅ Utilisateur trouvé: ${user.full_name || user.email} (${user.id})`);

    // 2. Trouver le projet
    console.log('🔍 Recherche du projet...');
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .eq('user_id', user.id)
      .ilike('name', `%${PROJECT_NAME}%`)
      .single();

    if (projectError || !project) {
      throw new Error(`Projet non trouvé: ${PROJECT_NAME}`);
    }
    console.log(`✅ Projet trouvé: ${project.name} (${project.id})`);

    // 3. Récupérer les matériaux AVANT
    console.log('📋 Récupération des matériaux...');
    const { data: materialsBefore, error: fetchError } = await supabase
      .from('materials')
      .select('id, name, category, quantity')
      .eq('project_id', project.id)
      .order('name');

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération: ${fetchError.message}`);
    }

    console.log(`📊 ${materialsBefore?.length || 0} matériaux trouvés`);
    console.log('');

    // Afficher les quantités avant
    console.log('📋 AVANT la mise à jour:');
    console.log('------------------------');
    materialsBefore?.forEach((m, i) => {
      console.log(`${i + 1}. ${m.name}: ${m.quantity} → ${(m.quantity || 0) * MULTIPLIER}`);
    });
    console.log('');

    // 4. Mettre à jour les quantités
    console.log('⏳ Mise à jour en cours...');
    let updatedCount = 0;

    for (const material of materialsBefore || []) {
      if (material.quantity !== null) {
        const { error: updateError } = await supabase
          .from('materials')
          .update({ quantity: material.quantity * MULTIPLIER })
          .eq('id', material.id);

        if (updateError) {
          console.error(`  ❌ Erreur pour ${material.name}: ${updateError.message}`);
        } else {
          updatedCount++;
        }
      }
    }

    console.log(`✅ ${updatedCount} matériaux mis à jour`);
    console.log('');

    // 5. Vérifier APRÈS
    const { data: materialsAfter } = await supabase
      .from('materials')
      .select('id, name, category, quantity')
      .eq('project_id', project.id)
      .order('name');

    console.log('📋 APRÈS la mise à jour:');
    console.log('------------------------');
    materialsAfter?.forEach((m, i) => {
      console.log(`${i + 1}. ${m.name}: ${m.quantity}`);
    });

    console.log('');
    console.log('🎉 Mise à jour terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
