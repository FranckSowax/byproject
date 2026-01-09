-- ============================================
-- MISE À JOUR DES QUANTITÉS - PROJET TOTAL SNI DQE
-- Date: 9 janvier 2026
-- Objectif: Multiplier par 15 toutes les quantités des 24 matériaux
-- Compte: ompayijunior@gmail.com
-- ============================================

-- Étape 1: Identifier l'utilisateur et le projet
-- ============================================

-- Vérifier l'utilisateur
SELECT id, email, full_name
FROM users
WHERE email = 'ompayijunior@gmail.com';

-- Vérifier le projet
SELECT p.id, p.name, p.user_id, u.email
FROM projects p
JOIN users u ON p.user_id = u.id
WHERE p.name ILIKE '%TOTAL SNI DQE%'
  AND u.email = 'ompayijunior@gmail.com';

-- Étape 2: Voir les matériaux AVANT la mise à jour
-- ============================================

SELECT
  m.id,
  m.name,
  m.category,
  m.quantity AS quantite_actuelle,
  m.quantity * 15 AS quantite_apres
FROM materials m
JOIN projects p ON m.project_id = p.id
JOIN users u ON p.user_id = u.id
WHERE p.name ILIKE '%TOTAL SNI DQE%'
  AND u.email = 'ompayijunior@gmail.com'
ORDER BY m.name;

-- Étape 3: Compter les matériaux
-- ============================================

SELECT COUNT(*) AS nombre_materiaux
FROM materials m
JOIN projects p ON m.project_id = p.id
JOIN users u ON p.user_id = u.id
WHERE p.name ILIKE '%TOTAL SNI DQE%'
  AND u.email = 'ompayijunior@gmail.com';

-- ============================================
-- EXÉCUTER LA MISE À JOUR (décommenter pour exécuter)
-- ============================================

-- Cette requête multiplie par 15 toutes les quantités
UPDATE materials
SET quantity = quantity * 15
WHERE project_id IN (
  SELECT p.id
  FROM projects p
  JOIN users u ON p.user_id = u.id
  WHERE p.name ILIKE '%TOTAL SNI DQE%'
    AND u.email = 'ompayijunior@gmail.com'
);

-- Étape 4: Vérifier les matériaux APRÈS la mise à jour
-- ============================================

SELECT
  m.id,
  m.name,
  m.category,
  m.quantity AS nouvelle_quantite
FROM materials m
JOIN projects p ON m.project_id = p.id
JOIN users u ON p.user_id = u.id
WHERE p.name ILIKE '%TOTAL SNI DQE%'
  AND u.email = 'ompayijunior@gmail.com'
ORDER BY m.name;

-- Message de confirmation
SELECT
  COUNT(*) AS materiaux_mis_a_jour,
  'Les quantités ont été multipliées par 15' AS message
FROM materials m
JOIN projects p ON m.project_id = p.id
JOIN users u ON p.user_id = u.id
WHERE p.name ILIKE '%TOTAL SNI DQE%'
  AND u.email = 'ompayijunior@gmail.com';
