-- Fix: Rendre la colonne hashed_password nullable
-- Car Supabase Auth gère déjà les mots de passe dans auth.users

-- Modifier la colonne pour permettre NULL
ALTER TABLE users 
ALTER COLUMN hashed_password DROP NOT NULL;

-- Vérification
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'hashed_password';
