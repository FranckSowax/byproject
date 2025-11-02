# 🔐 Login Admin de Test

## Accès Rapide

Pour tester l'application sans configurer Supabase, utilisez le login admin de test.

### URL d'accès
```
http://localhost:3000/admin-login
```

### Credentials de test

```
Email: admin@compachantier.com
Password: Admin123!
```

## Comment utiliser

### Option 1: Depuis la page d'accueil
1. Allez sur http://localhost:3000
2. Cliquez sur le bouton "🔐 Admin Test" dans le header
3. Les credentials sont affichés sur la page
4. Cliquez sur "Remplir automatiquement" ou entrez manuellement
5. Cliquez sur "Se connecter"

### Option 2: Accès direct
1. Allez directement sur http://localhost:3000/admin-login
2. Utilisez les credentials ci-dessus
3. Vous serez redirigé vers le dashboard

## Fonctionnalités disponibles

Une fois connecté, vous pouvez:
- ✅ Accéder au dashboard
- ✅ Voir votre profil dans le menu utilisateur
- ✅ Naviguer entre les pages
- ✅ Tester l'interface
- ✅ Se déconnecter

## Informations de l'utilisateur test

```json
{
  "id": "test-admin-id",
  "email": "admin@compachantier.com",
  "name": "Admin Test",
  "role": "Administrator",
  "isTestUser": true
}
```

## Protection des routes

Le dashboard vérifie automatiquement si un utilisateur est connecté:
- ✅ Si connecté → Accès au dashboard
- ❌ Si non connecté → Redirection vers /admin-login

## Déconnexion

Pour vous déconnecter:
1. Cliquez sur votre avatar dans le header
2. Cliquez sur "Sign Out"
3. Vous serez redirigé vers la page de login

## Stockage

Les informations de session sont stockées dans `localStorage`:
- Clé: `mockUser`
- Valeur: Objet JSON avec les infos utilisateur

## ⚠️ Important

### Ce système est pour le TEST uniquement

- ❌ Ne PAS utiliser en production
- ❌ Pas de véritable sécurité
- ❌ Pas de chiffrement
- ❌ Credentials en clair dans le code

### Pour la production

Utilisez Supabase Auth:
1. Configurez `.env.local` avec vos credentials Supabase
2. Exécutez la migration SQL
3. Utilisez les vraies pages `/login` et `/signup`
4. Supprimez `/admin-login` avant le déploiement

## Différences avec Supabase Auth

| Feature | Test Login | Supabase Auth |
|---------|-----------|---------------|
| Sécurité | ❌ Aucune | ✅ Complète |
| Base de données | ❌ Non | ✅ Oui |
| Email verification | ❌ Non | ✅ Oui |
| Password reset | ❌ Non | ✅ Oui |
| Sessions | localStorage | JWT tokens |
| Multi-device | ❌ Non | ✅ Oui |
| Production ready | ❌ Non | ✅ Oui |

## Dépannage

### "Redirection vers /admin-login"
- Normal si vous n'êtes pas connecté
- Connectez-vous avec les credentials de test

### "Chargement infini"
- Effacez le localStorage: `localStorage.clear()`
- Rechargez la page
- Reconnectez-vous

### "Pas d'accès au dashboard"
- Vérifiez que vous êtes sur http://localhost:3000/admin-login
- Utilisez les bons credentials
- Vérifiez la console pour les erreurs

## Code source

Les fichiers concernés:
- `app/(auth)/admin-login/page.tsx` - Page de login
- `app/(dashboard)/layout.tsx` - Protection des routes
- `app/page.tsx` - Lien dans le header

## Prochaines étapes

Une fois Supabase configuré:
1. Testez avec de vrais comptes
2. Comparez les deux systèmes
3. Supprimez le login de test
4. Déployez en production

---

**Créé pour**: Tests et développement local
**À supprimer avant**: Déploiement en production
**Alternative**: Supabase Auth (recommandé)
