#!/bin/bash

echo "🧹 Nettoyage du cache Next.js..."

# Arrêter le serveur s'il tourne
echo "Arrêt du serveur sur le port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Supprimer le cache Next.js
echo "Suppression de .next..."
rm -rf .next

# Supprimer le cache node_modules
echo "Suppression du cache node_modules..."
rm -rf node_modules/.cache

# Supprimer les fichiers de build
echo "Suppression des fichiers de build..."
rm -rf out

echo ""
echo "✅ Nettoyage terminé !"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Exécutez: npm run dev"
echo "2. Dans le navigateur, faites: Ctrl+Shift+R (ou Cmd+Shift+R sur Mac)"
echo "3. Vérifiez que la requête ne contient plus 'user_id=eq.xxx'"
echo ""
