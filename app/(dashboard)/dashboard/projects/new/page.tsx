"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FolderPlus, Upload, Link as LinkIcon, List, FileUp, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type CreationMode = 'select' | 'file' | 'manual';

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [creationMode, setCreationMode] = useState<CreationMode>('select');
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sourceUrl: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Vérifier le type de fichier
      const allowedTypes = [
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error("Type de fichier non supporté. Utilisez PDF, CSV ou Excel.");
        return;
      }
      
      // Vérifier la taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Le fichier est trop volumineux (max 10MB)");
        return;
      }
      
      setSelectedFile(file);
      toast.success(`Fichier sélectionné: ${file.name}`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Vérifier le type de fichier
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error("Type d'image non supporté. Utilisez JPG, PNG ou WebP.");
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image est trop volumineuse (max 5MB)");
        return;
      }
      
      setSelectedImage(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      toast.success(`Image sélectionnée: ${file.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Le nom du projet est requis");
      return;
    }

    // Validation selon le mode
    if (creationMode === 'file' && !selectedFile) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    setIsLoading(true);

    try {
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Si pas d'utilisateur Supabase, utiliser le mock user
        const mockUser = localStorage.getItem("mockUser");
        if (!mockUser) {
          toast.error("Vous devez être connecté");
          router.push("/login");
          return;
        }
        
        // Pour le mock user, créer un projet simulé
        const mockProjectId = `mock-${Date.now()}`;
        
        // Si fichier uploadé, sauvegarder pour simulation
        if (creationMode === 'file' && selectedFile) {
          // Lire le fichier localement
          const reader = new FileReader();
          reader.onload = async (e) => {
            const content = e.target?.result as string;
            localStorage.setItem(`project_${mockProjectId}`, JSON.stringify({
              filePath: null,
              fileName: selectedFile.name,
              fileContent: content,
              isMock: true,
            }));
            
            toast.success("Projet créé avec succès!");
            router.push(`/dashboard/projects/${mockProjectId}/mapping`);
          };
          reader.readAsText(selectedFile);
        } else {
          // Mode manuel - créer le projet et rediriger
          toast.success("Projet créé avec succès!");
          router.push(`/dashboard/projects/${mockProjectId}`);
        }
        
        setIsLoading(false);
        return;
      }

      // Upload de l'image de présentation si présente
      let imageUrl = null;
      if (selectedImage) {
        const imageExt = selectedImage.name.split('.').pop();
        const imageStoragePath = `${user.id}/images/${Date.now()}.${imageExt}`;
        
        const { error: imageUploadError } = await supabase.storage
          .from('project-images')
          .upload(imageStoragePath, selectedImage);

        if (imageUploadError) {
          console.error("Image upload error:", imageUploadError);
          toast.error("Erreur lors de l'upload de l'image");
          setIsLoading(false);
          return;
        }
        
        // Obtenir l'URL publique de l'image
        const { data: { publicUrl } } = supabase.storage
          .from('project-images')
          .getPublicUrl(imageStoragePath);
        
        imageUrl = publicUrl;
      }

      // Upload du fichier si présent et mode fichier
      let filePath = null;
      let fileName = null;
      if (creationMode === 'file' && selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        fileName = selectedFile.name;
        const storagePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(storagePath, selectedFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Erreur lors de l'upload du fichier");
          setIsLoading(false);
          return;
        }
        
        filePath = storagePath;
      }

      // Créer le projet dans la base de données
      const projectData: any = {
        user_id: user.id,
        name: formData.name,
        source_url: formData.sourceUrl || null,
        image_url: imageUrl,
      };

      // Ajouter file_path et mapping_status uniquement si en mode fichier
      if (creationMode === 'file') {
        projectData.file_path = filePath;
        projectData.mapping_status = 'pending';
      }

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (projectError) {
        console.error("Project creation error:", projectError);
        toast.error(`Erreur lors de la création du projet: ${projectError.message}`);
        setIsLoading(false);
        return;
      }

      toast.success("Projet créé avec succès!");
      
      // Sauvegarder les infos du fichier pour l'analyse
      if (creationMode === 'file' && selectedFile && filePath) {
        localStorage.setItem(`project_${project.id}`, JSON.stringify({
          filePath,
          fileName,
        }));
      }
      
      // Rediriger selon le mode
      if (creationMode === 'file' && selectedFile) {
        // Si fichier uploadé, aller vers la page d'analyse IA
        router.push(`/dashboard/projects/${project.id}/mapping`);
      } else {
        // Mode manuel - aller directement au projet pour ajouter des matériaux
        router.push(`/dashboard/projects/${project.id}`);
      }

    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Une erreur est survenue: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FF] to-[#E8EEFF] p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="hover:bg-white/50 rounded-xl w-fit"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] bg-clip-text text-transparent">
              Nouveau Projet
            </h1>
            <p className="text-[#718096] mt-2">Créez un projet de comparaison de prix</p>
          </div>
        </div>

        {/* Mode Selection */}
        {creationMode === 'select' && (
          <div className="space-y-6">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8]" />
              <CardHeader>
                <CardTitle className="text-2xl text-[#2D3748]">Comment souhaitez-vous créer votre projet ?</CardTitle>
                <CardDescription className="text-[#718096]">
                  Choisissez la méthode qui vous convient le mieux
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Option 1: Avec fichier */}
                <Card 
                  className="group border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer"
                  onClick={() => setCreationMode('file')}
                >
                  <div className="h-2 bg-gradient-to-r from-[#38B2AC] to-[#319795]" />
                  <CardHeader className="text-center">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#38B2AC]/10 to-[#319795]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileUp className="h-10 w-10 text-[#38B2AC]" />
                    </div>
                    <CardTitle className="text-xl text-[#2D3748] group-hover:text-[#38B2AC] transition-colors">
                      Importer un fichier
                    </CardTitle>
                    <CardDescription className="text-[#718096] mt-2">
                      Uploadez une liste de matériaux (PDF, CSV, Excel) et laissez l'IA faire le mapping automatiquement
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-6">
                    <div className="inline-flex items-center gap-2 text-sm text-[#38B2AC] font-semibold">
                      <span className="text-2xl">🤖</span>
                      Mapping automatique par IA
                    </div>
                  </CardContent>
                </Card>

                {/* Option 2: Manuel */}
                <Card 
                  className="group border-2 border-[#E0E4FF] hover:border-[#48BB78] hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer"
                  onClick={() => setCreationMode('manual')}
                >
                  <div className="h-2 bg-gradient-to-r from-[#48BB78] to-[#38A169]" />
                  <CardHeader className="text-center">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#48BB78]/10 to-[#38A169]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <List className="h-10 w-10 text-[#48BB78]" />
                    </div>
                    <CardTitle className="text-xl text-[#2D3748] group-hover:text-[#48BB78] transition-colors">
                      Ajout manuel
                    </CardTitle>
                    <CardDescription className="text-[#718096] mt-2">
                      Créez votre projet et ajoutez vos matériaux manuellement un par un
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-6">
                    <div className="inline-flex items-center gap-2 text-sm text-[#48BB78] font-semibold">
                      <span className="text-2xl">✍️</span>
                      Contrôle total
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form - Single column layout */}
        {creationMode !== 'select' && (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations du projet */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8]" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#5B5FC7]/10 to-[#7B7FE8]/10 rounded-xl flex items-center justify-center">
                  <FolderPlus className="h-6 w-6 text-[#5B5FC7]" />
                </div>
                <div>
                  <CardTitle className="text-xl text-[#2D3748]">Informations du projet</CardTitle>
                  <CardDescription className="text-[#718096]">
                    Donnez un nom à votre projet
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[#4A5568] font-semibold">
                  Nom du projet <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Comparaison matériaux Gabon-Chine 2025"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  className="border-[#E0E4FF] focus:border-[#5B5FC7] rounded-xl py-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceUrl" className="text-[#4A5568] font-semibold">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    URL Google Sheets (optionnel)
                  </div>
                </Label>
                <Input
                  id="sourceUrl"
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  disabled={isLoading}
                  className="border-[#E0E4FF] focus:border-[#5B5FC7] rounded-xl py-6"
                />
                <p className="text-xs text-[#718096]">
                  Vous pouvez lier une Google Sheet existante
                </p>
              </div>

              {/* Upload d'image de présentation */}
              <div className="space-y-2">
                <Label htmlFor="projectImage" className="text-[#4A5568] font-semibold">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Image de présentation (optionnel)
                  </div>
                </Label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-[#E0E4FF]">
                      <img 
                        src={imagePreview} 
                        alt="Aperçu" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                      >
                        Supprimer
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        id="projectImage"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleImageChange}
                        disabled={isLoading}
                        className="hidden"
                      />
                      <Label
                        htmlFor="projectImage"
                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#E0E4FF] rounded-xl cursor-pointer hover:border-[#5B5FC7] hover:bg-[#F5F6FF] transition-all"
                      >
                        <ImageIcon className="h-12 w-12 text-[#5B5FC7] mb-3" />
                        <span className="text-sm font-semibold text-[#5B5FC7]">
                          Cliquez pour sélectionner une image
                        </span>
                        <span className="text-xs text-[#718096] mt-1">
                          JPG, PNG ou WebP (max 5MB)
                        </span>
                      </Label>
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#718096]">
                  Cette image sera affichée en haut de la carte du projet
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Upload de fichier - Only in file mode */}
          {creationMode === 'file' && (
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[#48BB78] to-[#38A169]" />
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#48BB78]/10 to-[#38A169]/10 rounded-xl flex items-center justify-center">
                    <Upload className="h-6 w-6 text-[#48BB78]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-[#2D3748]">Importer un fichier</CardTitle>
                    <CardDescription className="text-[#718096]">
                      Uploadez votre liste de matériaux <span className="text-red-500">*</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="file" className="text-[#4A5568] font-semibold">Fichier</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="border-[#E0E4FF] focus:border-[#5B5FC7] rounded-xl cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#5B5FC7] file:text-white hover:file:bg-[#4A4DA6]"
                />
                <p className="text-xs text-[#718096]">
                  Formats acceptés: PDF, CSV, Excel (max 10MB)
                </p>
              </div>

              {selectedFile && (
                <div className="rounded-xl bg-[#48BB78]/10 border-2 border-[#48BB78]/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#48BB78]/20">
                      <Upload className="h-6 w-6 text-[#48BB78]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#2D3748]">{selectedFile.name}</p>
                      <p className="text-sm text-[#718096]">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      disabled={isLoading}
                      className="hover:bg-red-50 hover:text-red-600 rounded-xl"
                    >
                      Retirer
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-gradient-to-r from-[#5B5FC7]/10 to-[#7B7FE8]/10 border border-[#5B5FC7]/20 p-4">
                <h4 className="mb-2 font-semibold text-[#5B5FC7] flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  Mapping automatique par IA
                </h4>
                <p className="text-sm text-[#4A5568]">
                  L'IA détectera automatiquement les colonnes (nom, quantité, prix, etc.) 
                  et vous proposera un mapping intelligent.
                </p>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Info for manual mode */}
          {creationMode === 'manual' && (
            <Card className="border-0 bg-gradient-to-r from-[#48BB78]/10 to-[#38A169]/10 border-[#48BB78]/20 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="text-3xl">✍️</div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-[#2D3748]">Mode manuel</h4>
                    <p className="text-sm text-[#4A5568]">
                      Après la création du projet, vous pourrez ajouter vos matériaux un par un 
                      et gérer les prix pour chaque matériau.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex gap-4">
            <Button 
              type="button"
              variant="outline"
              onClick={() => setCreationMode('select')}
              disabled={isLoading}
              className="border-2 border-[#E0E4FF] hover:border-[#5B5FC7] rounded-xl px-6 py-6 font-semibold"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retour
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#6B6FD7] text-white shadow-lg shadow-[#5B5FC7]/30 rounded-xl px-6 py-6 text-base sm:text-lg font-semibold transition-all hover:scale-105"
            >
              <FolderPlus className="mr-2 h-5 w-5" />
              {isLoading ? "Création en cours..." : "Créer le Projet"}
            </Button>
          </div>
        </form>
        )}

        {/* Info box for file mode */}
        {creationMode === 'file' && (
          <Card className="border-0 bg-gradient-to-r from-[#FF9B7B]/10 to-[#FFB599]/10 border-[#FF9B7B]/20 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="text-3xl">💡</div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-[#2D3748]">Conseil</h4>
                  <p className="text-sm text-[#4A5568]">
                    Pour de meilleurs résultats avec le mapping IA, assurez-vous que votre fichier 
                    contient des en-têtes de colonnes clairs (ex: "Nom du produit", "Quantité", "Prix unitaire").
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
