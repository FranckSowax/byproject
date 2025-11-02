"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FolderPlus, Upload, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sourceUrl: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Le nom du projet est requis");
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
        if (selectedFile) {
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
          toast.success("Projet créé avec succès!");
          router.push("/dashboard");
        }
        
        setIsLoading(false);
        return;
      }

      // Upload du fichier si présent
      let filePath = null;
      let fileName = null;
      if (selectedFile) {
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
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: formData.name,
          source_url: formData.sourceUrl || null,
          file_path: filePath,
          mapping_status: selectedFile ? 'pending' : null,
        })
        .select()
        .single();

      if (projectError) {
        console.error("Project creation error:", projectError);
        toast.error("Erreur lors de la création du projet");
        setIsLoading(false);
        return;
      }

      toast.success("Projet créé avec succès!");
      
      // Sauvegarder les infos du fichier pour l'analyse
      if (selectedFile && filePath) {
        localStorage.setItem(`project_${project.id}`, JSON.stringify({
          filePath,
          fileName,
        }));
      }
      
      // Rediriger vers la page du projet
      if (selectedFile) {
        // Si fichier uploadé, aller vers la page d'analyse IA
        router.push(`/dashboard/projects/${project.id}/mapping`);
      } else {
        // Sinon, aller directement au projet
        router.push(`/dashboard/projects/${project.id}`);
      }

    } catch (error) {
      console.error("Error:", error);
      toast.error("Une erreur est survenue");
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

        {/* Form - Single column layout */}
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
            </CardContent>
          </Card>

          {/* Upload de fichier */}
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
                    Uploadez votre liste de matériaux (optionnel)
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
                  Si vous uploadez un fichier, l'IA détectera automatiquement les colonnes 
                  (nom, quantité, prix, etc.) et vous proposera un mapping intelligent.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bouton de création - en dessous */}
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#6B6FD7] text-white shadow-lg shadow-[#5B5FC7]/30 rounded-xl px-6 py-6 text-base sm:text-lg font-semibold transition-all hover:scale-105"
          >
            <FolderPlus className="mr-2 h-5 w-5" />
            {isLoading ? "Création en cours..." : "Créer le Projet"}
          </Button>
        </form>

        {/* Info box */}
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
      </div>
    </div>
  );
}
