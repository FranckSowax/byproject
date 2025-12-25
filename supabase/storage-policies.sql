-- Policies RLS pour le bucket project-files

-- Policy 1: Permettre aux utilisateurs d'uploader leurs propres fichiers
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Permettre aux utilisateurs de télécharger leurs propres fichiers
CREATE POLICY "Users can download their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Permettre aux utilisateurs de supprimer leurs propres fichiers
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Permettre aux utilisateurs de mettre à jour leurs propres fichiers
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
