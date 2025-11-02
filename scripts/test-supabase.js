const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🧪 Test de connexion Supabase\n');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Key:', supabaseKey ? '✅ Configurée' : '❌ Manquante');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  console.error('Vérifiez que .env.local existe et contient les bonnes valeurs.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('⏳ Test de connexion...');
    
    // Test simple: récupérer les rôles
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\n⚠️  Les tables n\'existent pas encore!');
        console.log('');
        console.log('📋 Action requise:');
        console.log('1. Allez sur: https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql');
        console.log('2. Copiez le contenu de: supabase/migrations/001_initial_schema.sql');
        console.log('3. Collez et exécutez le SQL');
        console.log('');
        console.log('📚 Guide détaillé: MIGRATION_SUPABASE.md');
        process.exit(0);
      }
      
      throw error;
    }

    console.log('✅ Connexion réussie!');
    console.log('✅ Tables accessibles!');
    
    if (data && data.length > 0) {
      console.log('\n📊 Données trouvées:');
      console.log(data);
    }

    console.log('\n🎉 Supabase est correctement configuré!');
    console.log('');
    console.log('🚀 Prochaines étapes:');
    console.log('1. Créez un compte sur: http://localhost:3000/signup');
    console.log('2. Vérifiez votre email');
    console.log('3. Connectez-vous sur: http://localhost:3000/login');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error('');
    console.error('💡 Solutions possibles:');
    console.error('1. Vérifiez que les credentials dans .env.local sont corrects');
    console.error('2. Vérifiez que votre projet Supabase est actif');
    console.error('3. Exécutez la migration SQL (voir MIGRATION_SUPABASE.md)');
    process.exit(1);
  }
}

testConnection();
