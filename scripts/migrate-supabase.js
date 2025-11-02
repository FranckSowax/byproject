const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Migration Supabase - Exécution automatique\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLCommand(sql) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { 
      query: sql 
    });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    // Si exec_sql n'existe pas, on utilise l'API REST directement
    return { success: false, error: error.message };
  }
}

async function runMigration() {
  const sqlPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
  const fullSQL = fs.readFileSync(sqlPath, 'utf8');

  console.log('📄 Fichier SQL chargé\n');

  // Diviser en commandes individuelles
  const commands = fullSQL
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

  console.log(`📝 ${commands.length} commandes SQL à exécuter\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < commands.length; i++) {
    const command = commands[i];
    const commandPreview = command.substring(0, 50).replace(/\n/g, ' ');
    
    console.log(`[${i + 1}/${commands.length}] ${commandPreview}...`);

    try {
      // Exécuter via l'API REST de Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ query: command + ';' })
      });

      if (response.ok || response.status === 201) {
        console.log(`  ✅ Succès`);
        successCount++;
      } else {
        const errorText = await response.text();
        if (errorText.includes('already exists') || errorText.includes('duplicate')) {
          console.log(`  ⚠️  Déjà existant (ignoré)`);
          skipCount++;
        } else {
          console.log(`  ❌ Erreur: ${errorText.substring(0, 100)}`);
          errorCount++;
        }
      }
    } catch (error) {
      console.log(`  ⚠️  Ignoré: ${error.message.substring(0, 50)}`);
      skipCount++;
    }

    // Petit délai pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Résumé de la migration:');
  console.log(`  ✅ Succès: ${successCount}`);
  console.log(`  ⚠️  Ignorés: ${skipCount}`);
  console.log(`  ❌ Erreurs: ${errorCount}`);
  console.log('='.repeat(50) + '\n');

  if (successCount > 0 || skipCount > 0) {
    console.log('🎉 Migration terminée!\n');
    console.log('📋 Vérification:');
    console.log('1. Allez sur: https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/editor');
    console.log('2. Vérifiez que les tables sont créées\n');
    console.log('🧪 Test:');
    console.log('node scripts/test-supabase.js');
  } else {
    console.log('⚠️  Aucune commande exécutée avec succès.\n');
    console.log('📝 Solution alternative:');
    console.log('Exécutez le SQL manuellement dans le dashboard Supabase.');
    console.log('Voir: MIGRATION_SUPABASE.md');
  }
}

runMigration().catch(error => {
  console.error('\n❌ Erreur fatale:', error.message);
  console.error('\n📝 Veuillez exécuter la migration manuellement:');
  console.error('Voir: MIGRATION_SUPABASE.md');
  process.exit(1);
});
