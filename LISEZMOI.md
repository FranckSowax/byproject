# 🏗️ CompaChantier

## Plateforme de Comparaison de Prix d'Équipements de Construction

Comparez les prix d'équipements de construction entre le Gabon (CFA) et la Chine (RMB) avec l'aide de l'IA.

---

## 🚀 DÉMARRAGE IMMÉDIAT

### Testez l'application maintenant (sans configuration)

```
URL: http://localhost:3000/admin-login

Email: admin@compachantier.com
Password: Admin123!
```

**👉 Voir [ACCES_RAPIDE.md](./ACCES_RAPIDE.md) pour les instructions détaillées**

---

## ✨ Fonctionnalités

### ✅ Disponibles Maintenant
- 🔐 Login admin de test
- 📊 Dashboard interactif
- 👤 Gestion de profil
- ⚙️ Page de paramètres
- 🎨 Interface moderne et responsive
- 🌍 Support multi-langues (FR/EN/ZH)

### 🔄 En Développement
- 📁 Upload de fichiers (PDF, CSV, Excel, Google Sheets)
- 🤖 Mapping automatique par IA (GPT-4o)
- 💰 Comparaison de prix multi-pays
- 📈 Tableaux de comparaison en temps réel
- 📄 Export PDF/Excel professionnel
- 👥 Gestion d'équipe (Admin/Editor/Reader)

---

## 📁 Structure du Projet

```
windsurf-project/
├── app/
│   ├── (auth)/
│   │   ├── admin-login/      ✅ Login de test
│   │   ├── login/             ⏳ Login Supabase
│   │   └── signup/            ⏳ Inscription Supabase
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── page.tsx       ✅ Liste projets
│   │       ├── profile/       ✅ Profil utilisateur
│   │       └── settings/      ✅ Paramètres
│   └── page.tsx               ✅ Page d'accueil
│
├── components/
│   └── ui/                    ✅ 14 composants shadcn/ui
│
├── lib/
│   ├── auth/                  ✅ Contexte d'authentification
│   └── supabase/              ✅ Clients Supabase
│
├── documentation/             ✅ Docs techniques complètes
│
└── [Guides]
    ├── ACCES_RAPIDE.md       👈 COMMENCEZ ICI
    ├── GUIDE_FR.md            📚 Guide complet
    ├── TEST_LOGIN.md          🔐 Doc login test
    ├── README.md              🇬🇧 English version
    └── LISEZMOI.md            🇫🇷 Ce fichier
```

---

## 🎯 Cas d'Usage

### Pour qui ?
- 🏗️ Entreprises de construction
- 📦 Équipes logistiques
- 💼 Acheteurs professionnels
- 🌍 Commerce international

### Problème résolu
Comparer manuellement les prix d'équipements entre pays est:
- ⏰ Chronophage
- ❌ Sujet aux erreurs
- 📊 Difficile à visualiser
- 💱 Complexe avec les devises

### Solution CompaChantier
- ⚡ Upload instantané de listes
- 🤖 Mapping automatique par IA
- 💰 Conversion de devises en temps réel
- 📊 Tableaux de comparaison clairs
- 📄 Exports professionnels

---

## 🛠️ Technologies

- **Framework**: Next.js 14 (App Router)
- **Langage**: TypeScript
- **Styles**: Tailwind CSS v4
- **Composants**: shadcn/ui
- **Base de données**: PostgreSQL (Supabase)
- **Authentification**: Supabase Auth
- **IA**: OpenAI GPT-4o
- **Icônes**: Lucide React

---

## 📖 Documentation

### Guides Rapides
- **[ACCES_RAPIDE.md](./ACCES_RAPIDE.md)** - Testez en 30 secondes
- **[GUIDE_FR.md](./GUIDE_FR.md)** - Guide complet en français
- **[TEST_LOGIN.md](./TEST_LOGIN.md)** - Documentation du login de test

### Documentation Technique
- **[README.md](./README.md)** - Vue d'ensemble (English)
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Configuration Supabase
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** - État d'avancement
- **[documentation/](./documentation/)** - Spécifications complètes

---

## 🎨 Design

### Palette de Couleurs
- **Primaire**: Bleu `#1E40AF`
- **Secondaire**: Ambre `#F59E0B`
- **Accent**: Émeraude `#10B981`
- **Fond**: Gris clair `#F3F4F6`

### Typographie
- **Police**: Inter (Google Fonts)
- **Titres**: Bold (600-700)
- **Corps**: Regular (400)

### Responsive
- 📱 Mobile first
- 💻 Desktop optimisé
- 📊 Tableaux adaptatifs

---

## 🔐 Sécurité

### En Test (Actuel)
- ⚠️ Login admin basique
- ⚠️ Pas de vraie sécurité
- ⚠️ À usage de développement uniquement

### En Production (Avec Supabase)
- ✅ Authentification sécurisée
- ✅ JWT tokens
- ✅ Row Level Security (RLS)
- ✅ Chiffrement des données
- ✅ Conformité RGPD

---

## 📊 Progression

| Phase | Statut | Progression |
|-------|--------|-------------|
| 1. Fondation | ✅ Terminé | 100% |
| 2. Intégration | 🔄 En cours | 50% |
| 3. Features | ⏳ À venir | 0% |
| 4. Production | ⏳ À venir | 0% |

**Total**: ~40% complété

---

## 🚦 Démarrage

### Option 1: Test Immédiat (Recommandé)
```bash
# Le serveur tourne déjà
# Allez sur:
http://localhost:3000/admin-login

# Credentials:
admin@compachantier.com / Admin123!
```

### Option 2: Configuration Complète
```bash
# 1. Créer compte Supabase
https://supabase.com

# 2. Configurer environnement
cp env.example .env.local
# Ajouter vos credentials

# 3. Exécuter migration SQL
# Voir SETUP_GUIDE.md

# 4. Tester avec vrais comptes
http://localhost:3000/signup
```

---

## 🎓 Ressources d'Apprentissage

- **Next.js**: https://nextjs.org/docs
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **TypeScript**: https://www.typescriptlang.org/docs

---

## 🤝 Contribution

### Structure des Commits
```
feat: Ajout de la fonctionnalité X
fix: Correction du bug Y
docs: Mise à jour de la documentation
style: Amélioration du design
refactor: Refactorisation du code
test: Ajout de tests
```

### Workflow
1. Créer une branche feature
2. Développer et tester
3. Commiter avec messages clairs
4. Créer une pull request

---

## 📞 Support

### Questions ?
1. Consultez [GUIDE_FR.md](./GUIDE_FR.md)
2. Vérifiez [documentation/](./documentation/)
3. Lisez [tasks.json](./documentation/tasks.json)

### Problèmes ?
1. Vérifiez [ACCES_RAPIDE.md](./ACCES_RAPIDE.md)
2. Consultez la section Dépannage
3. Vérifiez la console du navigateur

---

## 📝 Licence

Propriétaire - Tous droits réservés

---

## 🎉 Prêt à Commencer ?

### 1️⃣ Testez maintenant
👉 **http://localhost:3000/admin-login**

### 2️⃣ Lisez le guide
📚 **[ACCES_RAPIDE.md](./ACCES_RAPIDE.md)**

### 3️⃣ Explorez le code
💻 **Ouvrez les fichiers dans votre éditeur**

---

**Bon développement ! 🚀**

---

## 📅 Dernière Mise à Jour

**Date**: 1er Novembre 2025
**Version**: 0.4.0 (Phase 1 complète + Login test)
**Statut**: Prêt pour les tests
