const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Création des tables Supabase\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('📝 Note: Cette méthode a des limitations.');
  console.log('Pour une migration complète, utilisez le SQL Editor de Supabase.\n');
  
  console.log('🔗 Lien direct vers le SQL Editor:');
  console.log('https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql\n');
  
  console.log('📋 Instructions:');
  console.log('1. Cliquez sur le lien ci-dessus');
  console.log('2. Cliquez sur "+ New query"');
  console.log('3. Ouvrez: supabase/migrations/001_initial_schema.sql');
  console.log('4. Copiez TOUT le contenu (Cmd+A puis Cmd+C)');
  console.log('5. Collez dans l\'éditeur Supabase (Cmd+V)');
  console.log('6. Cliquez sur "Run" ou appuyez sur Cmd+Enter');
  console.log('7. Attendez "Success. No rows returned"\n');
  
  console.log('⏱️  Temps estimé: 2 minutes');
  console.log('📚 Guide détaillé: ETAPE_FINALE.md\n');
  
  // Test de connexion
  console.log('🧪 Test de connexion Supabase...');
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️  Les tables n\'existent pas encore (normal)');
        console.log('✅ Connexion Supabase OK\n');
        console.log('👉 Suivez les instructions ci-dessus pour créer les tables.');
      } else {
        console.log('❌ Erreur:', error.message);
      }
    } else {
      console.log('✅ Les tables existent déjà!');
      console.log('🎉 Migration déjà effectuée!\n');
      console.log('🧪 Testez l\'authentification:');
      console.log('http://localhost:3000/signup');
    }
  } catch (err) {
    console.log('❌ Erreur de connexion:', err.message);
  }
}

createTables();
