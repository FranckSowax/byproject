#!/bin/bash

# Script simple pour vérifier les variables d'environnement Netlify
# Usage: ./scripts/check-env-simple.sh

echo "🔍 Vérification des variables d'environnement Netlify..."
echo ""

# Vérifier si netlify CLI est disponible
if ! command -v netlify &> /dev/null && ! command -v npx &> /dev/null; then
    echo "❌ Netlify CLI non disponible"
    echo "Installer avec: npm install -g netlify-cli"
    exit 1
fi

# Utiliser npx si netlify n'est pas installé globalement
NETLIFY_CMD="netlify"
if ! command -v netlify &> /dev/null; then
    NETLIFY_CMD="npx netlify-cli"
fi

# Vérifier le statut de connexion
echo "📡 Vérification de la connexion Netlify..."
$NETLIFY_CMD status

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Variables d'environnement requises:"
echo ""
echo "✓ NEXT_PUBLIC_SUPABASE_URL"
echo "✓ NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "✓ SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔧 Pour vérifier les variables:"
echo "1. Aller sur: https://app.netlify.com/sites/byproject-twinsk/configuration/env"
echo "2. Ou utiliser: $NETLIFY_CMD env:list"
echo ""
echo "📚 Guide complet: NETLIFY_ENV_SETUP.md"
echo ""
