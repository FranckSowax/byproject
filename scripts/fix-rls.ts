import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

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

async function fixRLS() {
  try {
    console.log('🔧 Début de la correction des RLS policies...\n');
    
    // Lire le fichier SQL
    const sqlPath = path.join(process.cwd(), 'FIX_RLS_SIMPLE.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('📄 Fichier SQL chargé: FIX_RLS_SIMPLE.sql\n');
    
    // Diviser le SQL en commandes individuelles
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📊 ${commands.length} commandes SQL à exécuter\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      // Ignorer les commentaires et les lignes vides
      if (command.startsWith('--') || command.trim() === '') {
        continue;
      }
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command + ';' });
        
        if (error) {
          console.error(`❌ Erreur commande ${i + 1}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Commande ${i + 1} exécutée avec succès`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Erreur commande ${i + 1}:`, err);
        errorCount++;
      }
    }
    
    console.log('\n📊 Résumé:');
    console.log(`   ✅ Succès: ${successCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Correction RLS terminée avec succès!');
      console.log('   Vous pouvez maintenant accéder au projet SNI');
    } else {
      console.log('\n⚠️  Certaines commandes ont échoué');
      console.log('   Veuillez exécuter le script SQL manuellement dans le SQL Editor de Supabase');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction RLS:', error);
    console.log('\n💡 Solution alternative:');
    console.log('   1. Ouvrez le SQL Editor dans votre dashboard Supabase');
    console.log('   2. Copiez le contenu de FIX_RLS_SIMPLE.sql');
    console.log('   3. Exécutez le script SQL');
    process.exit(1);
  }
}

// Exécuter le script
fixRLS();
