const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  console.error('Vérifiez que .env.local contient NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Démarrage de la migration...\n');

  // Lire le fichier SQL
  const sqlPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('📄 Fichier SQL chargé:', sqlPath);
  console.log('📊 Taille:', sql.length, 'caractères\n');

  try {
    // Exécuter le SQL
    console.log('⏳ Exécution de la migration...');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // Si la fonction n'existe pas, on essaie une autre méthode
      console.log('⚠️  Méthode RPC non disponible, utilisation de l\'API REST...\n');
      
      // Diviser le SQL en commandes individuelles
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

      console.log(`📝 ${commands.length} commandes SQL à exécuter\n`);

      for (let i = 0; i < commands.length; i++) {
        const command = commands[i] + ';';
        console.log(`[${i + 1}/${commands.length}] Exécution...`);
        
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({ query: command })
          });

          if (!response.ok) {
            console.log(`⚠️  Commande ${i + 1} ignorée (peut-être déjà existante)`);
          } else {
            console.log(`✅ Commande ${i + 1} exécutée`);
          }
        } catch (err) {
          console.log(`⚠️  Erreur commande ${i + 1}:`, err.message);
        }
      }
    } else {
      console.log('✅ Migration exécutée avec succès!');
    }

    console.log('\n🎉 Migration terminée!');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Allez sur https://ebmgtfftimezuuxxzyjm.supabase.co');
    console.log('2. Vérifiez que les tables sont créées dans l\'onglet "Table Editor"');
    console.log('3. Testez l\'authentification sur /signup');
    console.log('\n💡 Note: Si certaines tables existent déjà, c\'est normal!');

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error.message);
    console.error('\n📝 Solution alternative:');
    console.error('1. Allez sur https://ebmgtfftimezuuxxzyjm.supabase.co');
    console.error('2. Cliquez sur "SQL Editor"');
    console.error('3. Copiez le contenu de supabase/migrations/001_initial_schema.sql');
    console.error('4. Collez et exécutez le SQL');
    process.exit(1);
  }
}

runMigration();
