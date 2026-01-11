/**
 * Script pour lister tous les projets
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log('📋 Liste des projets');
  console.log('====================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, user_id, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }

  if (!projects || projects.length === 0) {
    console.log('Aucun projet trouvé dans la base de données.');
    return;
  }

  console.log(`Total: ${projects.length} projet(s)\n`);

  projects.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   ID: ${p.id}`);
    console.log(`   Créé le: ${new Date(p.created_at).toLocaleDateString('fr-FR')}`);
    console.log('');
  });
}

main();
