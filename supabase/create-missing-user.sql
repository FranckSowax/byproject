-- Script pour créer un utilisateur manquant dans la table users
-- Utilisez ceci si votre utilisateur existe dans auth.users mais pas dans users

-- 1. D'abord, trouvez votre ID utilisateur
-- Allez sur: https://supabase.com/dashboard/project/ebmgtfftimezuuxxzyjm/auth/users
-- Copiez votre User ID

-- 2. Remplacez 'VOTRE-USER-ID' par votre vrai ID dans les commandes ci-dessous

-- Créer l'utilisateur dans la table users
INSERT INTO users (
  id,
  email,
  full_name,
  preferred_language,
  role_id
) VALUES (
  'VOTRE-USER-ID',      -- Remplacez par votre ID de auth.users
  'votre@email.com',     -- Remplacez par votre email
  'Votre Nom',           -- Remplacez par votre nom
  'fr',                  -- Langue: 'fr', 'en', ou 'zh'
  3                      -- Role: 1=Administrator, 2=Editor, 3=Reader
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name;

-- Créer la subscription Free
INSERT INTO subscriptions (
  user_id,
  plan,
  project_limit,
  export_limit
) VALUES (
  'VOTRE-USER-ID',      -- Même ID que ci-dessus
  'Free',                -- Plan: 'Free' ou 'Premium'
  5,                     -- Limite de projets
  2                      -- Limite d'exports
) ON CONFLICT DO NOTHING;

-- Vérifier que tout est créé
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.name as role,
  s.plan,
  s.project_limit
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.id = 'VOTRE-USER-ID';  -- Remplacez par votre ID
