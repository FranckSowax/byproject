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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau Projet</h1>
          <p className="text-gray-600">Créez un projet de comparaison de prix</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations du projet */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-blue-600" />
              <CardTitle>Informations du projet</CardTitle>
            </div>
            <CardDescription>
              Donnez un nom et une description à votre projet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom du projet <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Comparaison équipements Gabon-Chine 2025"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre projet..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isLoading}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceUrl">
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
                />
                <p className="text-xs text-gray-500">
                  Vous pouvez lier une Google Sheet existante
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Création..." : "Créer le projet"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Upload de fichier */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-emerald-600" />
              <CardTitle>Importer un fichier</CardTitle>
            </div>
            <CardDescription>
              Uploadez votre liste de matériaux (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Fichier</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Formats acceptés: PDF, CSV, Excel (max 10MB)
              </p>
            </div>

            {selectedFile && (
              <div className="rounded-lg bg-emerald-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <Upload className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-emerald-900">{selectedFile.name}</p>
                    <p className="text-sm text-emerald-700">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={isLoading}
                  >
                    Retirer
                  </Button>
                </div>
              </div>
            )}

            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="mb-2 font-semibold text-blue-900">
                🤖 Mapping automatique par IA
              </h4>
              <p className="text-sm text-blue-800">
                Si vous uploadez un fichier, GPT-4o détectera automatiquement les colonnes 
                (nom, quantité, prix, etc.) et vous proposera un mapping intelligent.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Ou créez manuellement</h4>
              <p className="text-sm text-gray-600">
                Vous pouvez aussi créer un projet vide et ajouter les matériaux manuellement 
                depuis le dashboard du projet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info box */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="text-2xl">💡</div>
            <div className="space-y-2">
              <h4 className="font-semibold text-amber-900">Conseil</h4>
              <p className="text-sm text-amber-800">
                Pour de meilleurs résultats avec le mapping IA, assurez-vous que votre fichier 
                contient des en-têtes de colonnes clairs (ex: "Nom du produit", "Quantité", "Prix unitaire").
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
