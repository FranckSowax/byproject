-- Policies RLS pour permettre l'inscription des utilisateurs

-- ============================================
-- TABLE: users
-- ============================================

-- Policy: Permettre aux utilisateurs de créer leur propre profil lors de l'inscription
CREATE POLICY "Users can insert their own profile during signup"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Permettre aux utilisateurs de voir leur propre profil
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Permettre aux utilisateurs de mettre à jour leur propre profil
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- TABLE: subscriptions
-- ============================================

-- Policy: Permettre aux utilisateurs de créer leur propre subscription lors de l'inscription
CREATE POLICY "Users can insert their own subscription during signup"
ON subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Permettre aux utilisateurs de voir leur propre subscription
CREATE POLICY "Users can view their own subscription"
ON subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Permettre aux utilisateurs de mettre à jour leur propre subscription
CREATE POLICY "Users can update their own subscription"
ON subscriptions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Vérification
-- ============================================

-- Vérifier que les policies sont créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'subscriptions')
ORDER BY tablename, policyname;
