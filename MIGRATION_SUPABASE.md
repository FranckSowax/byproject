# 🗄️ Migration Supabase - Guide Rapide

## ✅ Configuration Terminée!

Vos credentials Supabase ont été configurés dans `.env.local`:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
- ✅ SUPABASE_SERVICE_ROLE_KEY

## 📊 Prochaine Étape: Créer les Tables

### Méthode 1: Via l'Interface Supabase (Recommandé)

#### 1. Ouvrir le SQL Editor
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql
```

Ou:
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet "ebmgtfftimezuuxxzyjm"
3. Cliquez sur "SQL Editor" dans le menu de gauche

#### 2. Créer une Nouvelle Requête
- Cliquez sur "+ New query"

#### 3. Copier le SQL
Ouvrez le fichier:
```
supabase/migrations/001_initial_schema.sql
```

Copiez TOUT le contenu (261 lignes)

#### 4. Coller et Exécuter
- Collez le SQL dans l'éditeur
- Cliquez sur "Run" ou appuyez sur `Cmd + Enter` (Mac) / `Ctrl + Enter` (Windows)

#### 5. Vérifier le Succès
Vous devriez voir:
```
Success. No rows returned
```

### Méthode 2: Via la CLI Supabase

```bash
# 1. Installer la CLI Supabase
npm install -g supabase

# 2. Se connecter
supabase login

# 3. Lier le projet
supabase link --project-ref ebmgtfftimezuuxxzyjm

# 4. Exécuter la migration
supabase db push
```

## ✅ Vérification

### 1. Vérifier les Tables Créées

Allez sur:
```
https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/editor
```

Vous devriez voir ces tables:
- ✅ roles (3 lignes: Administrator, Editor, Reader)
- ✅ users
- ✅ subscriptions
- ✅ projects
- ✅ materials
- ✅ suppliers
- ✅ currencies (2 lignes: CFA, RMB)
- ✅ exchange_rates
- ✅ prices
- ✅ photos
- ✅ exports
- ✅ column_mappings

### 2. Vérifier les Données Initiales

#### Table `roles`:
| id | name |
|----|------|
| 1 | Administrator |
| 2 | Editor |
| 3 | Reader |

#### Table `currencies`:
| code | symbol |
|------|--------|
| CFA | FCFA |
| RMB | ¥ |

## 🔄 Redémarrer le Serveur

Après la migration, redémarrez le serveur Next.js:

```bash
# Arrêter le serveur (Ctrl + C)
# Puis redémarrer:
npm run dev
```

## 🧪 Tester l'Authentification

### 1. Créer un Compte
```
http://localhost:3000/signup
```

Remplissez le formulaire:
- Nom complet
- Email
- Langue (FR/EN/ZH)
- Mot de passe (min 8 caractères)

### 2. Vérifier l'Email

⚠️ **Important**: Supabase envoie un email de confirmation

**Option A**: Vérifier votre boîte mail
- Cherchez l'email de Supabase
- Cliquez sur le lien de confirmation

**Option B**: Désactiver la confirmation (développement uniquement)
1. Allez sur https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/auth/users
2. Cliquez sur "Configuration" > "Email Auth"
3. Décochez "Enable email confirmations"
4. Sauvegardez

### 3. Se Connecter
```
http://localhost:3000/login
```

Utilisez vos credentials pour vous connecter.

## 🎯 URLs Utiles

| Page | URL |
|------|-----|
| Dashboard Supabase | https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm |
| SQL Editor | https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/sql |
| Table Editor | https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/editor |
| Auth Users | https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/auth/users |
| Storage | https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/storage/buckets |

## 🐛 Problèmes Courants

### "relation already exists"
✅ **Normal** - La table existe déjà
👉 Continuez, les autres tables seront créées

### "permission denied"
❌ Vérifiez que vous utilisez le bon service_role_key
👉 Vérifiez `.env.local`

### "syntax error"
❌ Le SQL n'a pas été copié entièrement
👉 Copiez tout le fichier `001_initial_schema.sql`

### Email non reçu
1. Vérifiez les spams
2. Vérifiez l'adresse email
3. Désactivez la confirmation email (voir ci-dessus)

## 📝 Prochaines Étapes

Après la migration réussie:

1. ✅ Testez la création de compte
2. ✅ Testez la connexion
3. ✅ Vérifiez le dashboard
4. ⏳ Développez les features suivantes:
   - Upload de fichiers
   - Mapping AI
   - Gestion des projets
   - Comparaison de prix

## 💡 Conseils

### Développement
- Utilisez `/admin-login` pour tester rapidement l'UI
- Utilisez `/signup` et `/login` pour tester Supabase Auth

### Production
- Supprimez `/admin-login` avant le déploiement
- Activez la confirmation email
- Configurez les templates d'email
- Ajoutez un domaine personnalisé

## 🎉 Félicitations!

Une fois la migration terminée, vous aurez:
- ✅ Base de données complète
- ✅ Authentification fonctionnelle
- ✅ Tables avec RLS activé
- ✅ Indexes de performance
- ✅ Triggers automatiques

**Prêt à développer les features! 🚀**
