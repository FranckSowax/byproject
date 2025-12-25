#!/usr/bin/env node

/**
 * Script pour vérifier les variables d'environnement sur Netlify
 * 
 * Usage:
 *   node scripts/check-netlify-env.js
 * 
 * Prérequis:
 *   - NETLIFY_AUTH_TOKEN dans .env.local
 *   - NETLIFY_SITE_ID dans .env.local
 */

require('dotenv').config({ path: '.env.local' });

const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID || 'byproject-twinsk';

if (!NETLIFY_AUTH_TOKEN) {
  console.error('❌ NETLIFY_AUTH_TOKEN manquant dans .env.local');
  console.log('\n📝 Pour obtenir un token:');
  console.log('1. Aller sur: https://app.netlify.com/user/applications');
  console.log('2. Cliquer sur "New access token"');
  console.log('3. Copier le token');
  console.log('4. Ajouter dans .env.local: NETLIFY_AUTH_TOKEN=votre_token');
  process.exit(1);
}

async function checkNetlifyEnv() {
  try {
    console.log('🔍 Vérification des variables d\'environnement Netlify...\n');

    // Récupérer les informations du site
    const siteResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
        },
      }
    );

    if (!siteResponse.ok) {
      throw new Error(`Erreur API Netlify: ${siteResponse.status} ${siteResponse.statusText}`);
    }

    const site = await siteResponse.json();
    console.log(`📦 Site: ${site.name}`);
    console.log(`🌐 URL: ${site.url}`);
    console.log(`🆔 ID: ${site.id}\n`);

    // Récupérer les variables d'environnement
    const envResponse = await fetch(
      `https://api.netlify.com/api/v1/accounts/${site.account_slug}/env`,
      {
        headers: {
          'Authorization': `Bearer ${NETLIFY_AUTH_TOKEN}`,
        },
      }
    );

    if (!envResponse.ok) {
      throw new Error(`Erreur récupération env: ${envResponse.status}`);
    }

    const envVars = await envResponse.json();

    // Variables requises pour l'application
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    console.log('📋 Variables d\'environnement:\n');

    let allPresent = true;

    for (const varName of requiredVars) {
      const envVar = envVars.find(v => v.key === varName);
      
      if (envVar) {
        const values = envVar.values || [];
        const hasValue = values.length > 0 && values[0].value;
        
        if (hasValue) {
          const value = values[0].value;
          const maskedValue = varName.includes('KEY') 
            ? value.substring(0, 10) + '...' + value.substring(value.length - 10)
            : value;
          
          console.log(`✅ ${varName}`);
          console.log(`   Valeur: ${maskedValue}`);
          console.log(`   Scopes: ${values[0].context || 'all'}\n`);
        } else {
          console.log(`⚠️  ${varName}`);
          console.log(`   Status: Définie mais sans valeur\n`);
          allPresent = false;
        }
      } else {
        console.log(`❌ ${varName}`);
        console.log(`   Status: NON DÉFINIE\n`);
        allPresent = false;
      }
    }

    // Résumé
    console.log('━'.repeat(60));
    if (allPresent) {
      console.log('✅ Toutes les variables requises sont configurées !');
      console.log('\n🚀 Prochaines étapes:');
      console.log('1. Redéployer le site si ce n\'est pas déjà fait');
      console.log('2. Tester: https://byproject-twinsk.netlify.app/admin/supplier-requests');
    } else {
      console.log('❌ Certaines variables sont manquantes');
      console.log('\n📝 Actions requises:');
      console.log('1. Aller sur: https://app.netlify.com/sites/byproject-twinsk/configuration/env');
      console.log('2. Ajouter les variables manquantes');
      console.log('3. Redéployer le site');
      console.log('\n📚 Voir le guide: NETLIFY_ENV_SETUP.md');
    }
    console.log('━'.repeat(60));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Le token d\'accès est invalide ou expiré.');
      console.log('Générer un nouveau token sur: https://app.netlify.com/user/applications');
    }
    
    process.exit(1);
  }
}

checkNetlifyEnv();
