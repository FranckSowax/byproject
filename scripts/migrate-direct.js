const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Migration Supabase - Méthode Directe\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  process.exit(1);
}

async function executeMigration() {
  const sqlPath = path.join(__dirname, '../supabase/migrations/001_initial_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('📄 Fichier SQL chargé');
  console.log(`📊 Taille: ${sql.length} caractères\n`);

  try {
    console.log('⏳ Exécution via l\'API Management de Supabase...\n');

    // Utiliser l'API Management de Supabase
    const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)[1];
    
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Migration exécutée avec succès!');
      console.log('📊 Résultat:', result);
      
      console.log('\n🎉 Tables créées!\n');
      console.log('📋 Vérification:');
      console.log(`https://supabase.com/dashboard/project/${projectRef}/editor`);
      
      console.log('\n🧪 Testez maintenant:');
      console.log('node scripts/test-supabase.js');
      
    } else {
      const errorText = await response.text();
      console.error('❌ Erreur HTTP:', response.status);
      console.error('📄 Détails:', errorText);
      
      console.log('\n📝 Solution alternative:');
      console.log('Exécutez le SQL manuellement:');
      console.log(`1. Allez sur: https://supabase.com/dashboard/project/${projectRef}/sql`);
      console.log('2. Copiez le contenu de: supabase/migrations/001_initial_schema.sql');
      console.log('3. Collez et exécutez');
    }

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    
    console.log('\n📝 Méthode manuelle recommandée:');
    console.log('Voir: MIGRATION_SUPABASE.md ou ETAPE_FINALE.md');
  }
}

executeMigration();
