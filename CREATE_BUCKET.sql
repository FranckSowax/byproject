-- Créer le bucket project-images pour les images de présentation des projets
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer le bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true);

-- 2. Définir les politiques d'accès (RLS)

-- Politique : Tout le monde peut lire (GET)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'project-images' );

-- Politique : Les utilisateurs authentifiés peuvent uploader (INSERT)
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-images' 
  AND auth.role() = 'authenticated'
);

-- Politique : Les utilisateurs peuvent mettre à jour leurs propres fichiers (UPDATE)
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'project-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique : Les utilisateurs peuvent supprimer leurs propres fichiers (DELETE)
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
