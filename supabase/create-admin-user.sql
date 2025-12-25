-- Créer un utilisateur admin de test dans Supabase Auth
-- Cet utilisateur permettra au mode démo de fonctionner complètement

-- 1. Insérer l'utilisateur dans auth.users
-- Note: Vous devez exécuter ceci dans le SQL Editor de Supabase
-- L'ID est fixe pour que le mode démo puisse toujours l'utiliser

-- Générer un UUID fixe pour l'admin de test
-- ID: 00000000-0000-0000-0000-000000000001

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@compachantier.com',
  -- Password: Admin123! (hashé avec bcrypt)
  -- Vous devrez le changer avec le vrai hash
  crypt('Admin123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin Test"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 2. Créer l'utilisateur dans la table users
INSERT INTO users (
  id,
  email,
  full_name,
  hashed_password,
  preferred_language,
  role_id
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@compachantier.com',
  'Admin Test',
  crypt('Admin123!', gen_salt('bf')),
  'fr',
  1  -- Administrator role
) ON CONFLICT (id) DO NOTHING;

-- 3. Créer la subscription pour l'admin
INSERT INTO subscriptions (
  user_id,
  plan,
  project_limit,
  export_limit,
  expires_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Premium',
  999,
  999,
  '2099-12-31'
) ON CONFLICT DO NOTHING;

-- Vérification
SELECT 
  u.id,
  u.email,
  u.full_name,
  r.name as role,
  s.plan
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE u.email = 'admin@compachantier.com';
