# Configuration Netlify pour ByProject

## Variables d'environnement requises

Pour que l'application fonctionne correctement sur Netlify, vous devez configurer les variables d'environnement suivantes dans les paramètres de votre site Netlify.

### Accéder aux variables d'environnement sur Netlify

1. Allez sur [Netlify Dashboard](https://app.netlify.com)
2. Sélectionnez votre site `byproject-twinsk`
3. Allez dans **Site settings** > **Environment variables**
4. Cliquez sur **Add a variable** pour chaque variable ci-dessous

### Variables obligatoires

#### Supabase (Base de données)
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_publique
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role_secrète
```

**Où trouver ces valeurs:**
- Connectez-vous à [Supabase Dashboard](https://supabase.com/dashboard)
- Sélectionnez votre projet
- Allez dans **Settings** > **API**
- Copiez l'URL du projet et les clés

#### OpenAI (Intelligence Artificielle)
```
OPENAI_API_KEY=sk-votre_clé_openai
```

**Où trouver cette valeur:**
- Connectez-vous à [OpenAI Platform](https://platform.openai.com)
- Allez dans **API keys**
- Créez une nouvelle clé si nécessaire

#### Google Gemini (Intelligence Artificielle)
```
GEMINI_API_KEY=votre_clé_gemini
```

**Où trouver cette valeur:**
- Connectez-vous à [Google AI Studio](https://makersuite.google.com/app/apikey)
- Créez une clé API

### Variables optionnelles

#### Configuration de l'application
```
NEXT_PUBLIC_SITE_URL=https://byproject-twinsk.netlify.app
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### Replicate (pour certaines fonctionnalités IA)
```
REPLICATE_API_TOKEN=votre_token_replicate
```

#### Sentry (monitoring des erreurs)
```
NEXT_PUBLIC_SENTRY_DSN=votre_sentry_dsn
```

## Après avoir configuré les variables

1. **Redéployez votre site** : Netlify redéploiera automatiquement après l'ajout des variables
2. **Vérifiez le déploiement** : Allez dans **Deploys** pour voir le statut
3. **Testez l'application** : Visitez votre site pour vérifier qu'il fonctionne

## Résolution des problèmes

### Erreur: "Application error: a client-side exception has occurred"

Cette erreur indique généralement que les variables d'environnement ne sont pas configurées. Vérifiez que:

1. ✅ Toutes les variables **obligatoires** sont configurées
2. ✅ Les valeurs sont correctes (pas d'espaces, pas de guillemets)
3. ✅ Le site a été redéployé après l'ajout des variables

### Vérifier les variables configurées

Vous pouvez vérifier quelles variables sont configurées en allant dans:
**Site settings** > **Environment variables**

### Logs de déploiement

Pour voir les erreurs détaillées:
1. Allez dans **Deploys**
2. Cliquez sur le dernier déploiement
3. Consultez les logs de build

## Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs de déploiement Netlify
2. Vérifiez la console du navigateur (F12) pour les erreurs client
3. Assurez-vous que toutes les clés API sont valides et actives
