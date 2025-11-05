"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, FolderOpen, Calendar, Edit, Image as ImageIcon, X } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Project {
  id: string;
  name: string;
  created_at: string;
  image_url: string | null;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Si pas d'utilisateur Supabase, vérifier le mock user
        const mockUser = localStorage.getItem("mockUser");
        if (mockUser) {
          // Pour le mock user, on affiche un projet vide
          setProjects([]);
        }
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, created_at, image_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading projects:", error);
      } else {
        setProjects((data as unknown as Project[]) || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Type d'image non supporté. Utilisez JPG, PNG ou WebP.");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image est trop volumineuse (max 5MB)");
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateImage = async () => {
    if (!editingProjectId || !selectedImage) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vous devez être connecté");
        return;
      }

      const imageExt = selectedImage.name.split('.').pop();
      const imageStoragePath = `${user.id}/images/${Date.now()}.${imageExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(imageStoragePath, selectedImage);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Erreur lors de l'upload de l'image");
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(imageStoragePath);

      const { error: updateError } = await supabase
        .from('projects')
        .update({ image_url: publicUrl })
        .eq('id', editingProjectId);

      if (updateError) {
        console.error("Update error:", updateError);
        toast.error("Erreur lors de la mise à jour");
        return;
      }

      toast.success("Image mise à jour avec succès!");
      setEditingProjectId(null);
      setSelectedImage(null);
      setImagePreview(null);
      loadProjects();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FF] to-[#E8EEFF] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header avec style moderne */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] bg-clip-text text-transparent">
              Projets
            </h1>
            <p className="text-[#718096] mt-2">
              Gérez vos projets de comparaison de matériaux de construction
            </p>
          </div>
          <Link href="/dashboard/projects/new">
            <Button className="gap-2 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#6B6FD7] text-white shadow-lg shadow-[#5B5FC7]/30 rounded-xl px-6 py-6 transition-all hover:scale-105">
              <Plus className="h-5 w-5 text-white" />
              <span className="text-white font-semibold">Nouveau Projet</span>
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gradient-to-br from-[#5B5FC7]/10 to-[#FF9B7B]/10 rounded-2xl flex items-center justify-center mb-6">
                <FolderOpen className="h-10 w-10 text-[#5B5FC7]" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-[#4A5568]">
                Aucun projet pour le moment
              </h3>
              <p className="mb-8 text-center text-[#718096] max-w-md">
                Commencez par créer votre premier projet de comparaison
              </p>
              <Link href="/dashboard/projects/new">
                <Button className="gap-2 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#6B6FD7] text-white shadow-lg shadow-[#5B5FC7]/30 rounded-xl px-8 py-6 text-lg transition-all hover:scale-105">
                  <Plus className="h-5 w-5 text-white" />
                  <span className="text-white font-semibold">Créer un Projet</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="group border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden hover:scale-105"
              >
                {/* Image de présentation */}
                {project.image_url ? (
                  <div className="relative h-48 w-full overflow-hidden group/image">
                    <img 
                      src={project.image_url} 
                      alt={project.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2 opacity-0 group-hover/image:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingProjectId(project.id);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier l'image
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="h-2 bg-gradient-to-r from-[#5B5FC7] to-[#FF9B7B]" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-8 right-4 z-10"
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingProjectId(project.id);
                      }}
                    >
                      <ImageIcon className="h-4 w-4 mr-1" />
                      Ajouter une image
                    </Button>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold text-[#4A5568] group-hover:text-[#5B5FC7] transition-colors">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-[#718096]">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#5B5FC7]/10 to-[#FF9B7B]/10 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-[#5B5FC7]" />
                    </div>
                    {new Date(project.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <Button 
                      variant="outline" 
                      className="w-full border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#5B5FC7] hover:text-white text-[#5B5FC7] font-semibold rounded-xl py-6 transition-all"
                    >
                      Ouvrir le Projet
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog d'édition d'image */}
      <Dialog open={editingProjectId !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingProjectId(null);
          setSelectedImage(null);
          setImagePreview(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'image du projet</DialogTitle>
            <DialogDescription>
              Choisissez une nouvelle image de présentation pour votre projet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="editProjectImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleImageChange}
                  disabled={isUploading}
                  className="hidden"
                />
                <Label
                  htmlFor="editProjectImage"
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
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingProjectId(null);
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                disabled={isUploading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpdateImage}
                disabled={!selectedImage || isUploading}
              >
                {isUploading ? "Upload en cours..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
