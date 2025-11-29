"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Upload, 
  FileUp, 
  List,
  Sparkles,
  FolderPlus,
  Check,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Types
type ImportMethod = 'file' | 'manual' | null;

interface Sector {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  item_label: string;
  default_categories: string[];
}

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(true);
  
  // Form data
  const [selectedSectorId, setSelectedSectorId] = useState<string>("");
  const [customSectorName, setCustomSectorName] = useState<string>("");
  const [projectName, setProjectName] = useState("");
  const [importMethod, setImportMethod] = useState<ImportMethod>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Charger les secteurs depuis Supabase
  useEffect(() => {
    async function loadSectors() {
      const { data, error } = await (supabase as any)
        .from('sectors')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) {
        console.error('Error loading sectors:', error);
        toast.error('Erreur lors du chargement des secteurs');
      } else {
        setSectors((data as Sector[]) || []);
      }
      setLoadingSectors(false);
    }
    loadSectors();
  }, [supabase]);

  // Get selected sector object
  const selectedSector = sectors.find(s => s.id === selectedSectorId);
  const isOtherSector = selectedSector?.slug === 'autre';

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = [
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error("Format non supporté. Utilisez PDF, CSV ou Excel.");
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Fichier trop volumineux (max 10MB)");
        return;
      }
      
      setSelectedFile(file);
      toast.success(`Fichier sélectionné: ${file.name}`);
    }
  };

  const canSubmit = (): boolean => {
    const sectorValid = selectedSectorId !== "" && 
      (!isOtherSector || customSectorName.trim().length > 0);
    
    return (
      projectName.trim().length > 0 &&
      sectorValid &&
      importMethod !== null &&
      (importMethod !== 'file' || selectedFile !== null)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit()) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Vous devez être connecté");
        router.push("/login");
        return;
      }

      // Upload du fichier si présent
      let filePath = null;
      if (importMethod === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('userId', user.id);
        formData.append('bucket', 'project-files');

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Erreur upload fichier');
        }

        const data = await response.json();
        filePath = data.path;
      }

      // Créer le projet
      const projectData = {
        user_id: user.id,
        name: projectName,
        sector_id: selectedSectorId,
        custom_sector_name: isOtherSector ? customSectorName.trim() : null,
        project_type: 'sourcing',
        file_path: filePath,
        mapping_status: importMethod === 'file' ? 'pending' : null,
      };

      const { data: project, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (error) throw error;

      toast.success("Projet créé avec succès!");

      // Redirection selon la méthode
      if (importMethod === 'file' && filePath) {
        localStorage.setItem(`project_${project.id}`, JSON.stringify({
          filePath,
          fileName: selectedFile?.name,
        }));
        router.push(`/dashboard/projects/${project.id}/mapping`);
      } else {
        router.push(`/dashboard/projects/${project.id}`);
      }

    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-slate-600">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Nouveau Projet
          </h1>
          <p className="text-slate-600 mt-1">Créez un projet de sourcing</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations du projet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FolderPlus className="h-5 w-5 text-violet-600" />
                Informations du projet
              </CardTitle>
              <CardDescription>
                Définissez les informations de base de votre projet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nom du projet */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom du projet <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Ex: Équipement Hôtel Libreville 2025"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              {/* Secteur d'activité */}
              <div className="space-y-2">
                <Label htmlFor="sector">
                  Secteur d'activité <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedSectorId}
                  onValueChange={(value) => {
                    setSelectedSectorId(value);
                    // Reset custom sector name when changing sector
                    if (sectors.find(s => s.id === value)?.slug !== 'autre') {
                      setCustomSectorName("");
                    }
                  }}
                  disabled={isLoading || loadingSectors}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={loadingSectors ? "Chargement..." : "Sélectionnez un secteur"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        <span className="flex items-center gap-2">
                          {sector.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedSector && !isOtherSector && (
                  <p className="text-xs text-slate-500">
                    {selectedSector.description}
                  </p>
                )}
              </div>

              {/* Champ personnalisé pour secteur "Autre" */}
              {isOtherSector && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="customSector">
                    Précisez votre secteur <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customSector"
                    placeholder="Ex: Cosmétique, Textile, Électronique grand public..."
                    value={customSectorName}
                    onChange={(e) => setCustomSectorName(e.target.value)}
                    disabled={isLoading}
                    className="h-11"
                  />
                  <p className="text-xs text-slate-500">
                    Cette information sera utilisée par l'IA pour adapter l'analyse de vos fichiers et les suggestions.
                  </p>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Méthode d'import */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-violet-600" />
                Comment ajouter vos {selectedSector?.item_label?.toLowerCase() || 'articles'} ?
              </CardTitle>
              <CardDescription>
                Choisissez votre méthode préférée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {/* Option: Import fichier */}
                <button
                  type="button"
                  onClick={() => setImportMethod('file')}
                  className={cn(
                    "flex flex-col items-center p-5 rounded-xl border-2 text-center transition-all",
                    importMethod === 'file' 
                      ? "border-violet-500 bg-violet-50" 
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                    importMethod === 'file' ? "bg-violet-600" : "bg-slate-100"
                  )}>
                    <FileUp className={cn("w-6 h-6", importMethod === 'file' ? "text-white" : "text-slate-600")} />
                  </div>
                  <h3 className="font-semibold text-slate-900">Importer un fichier</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Excel, CSV ou PDF analysé par IA
                  </p>
                </button>

                {/* Option: Manuel */}
                <button
                  type="button"
                  onClick={() => setImportMethod('manual')}
                  className={cn(
                    "flex flex-col items-center p-5 rounded-xl border-2 text-center transition-all",
                    importMethod === 'manual' 
                      ? "border-emerald-500 bg-emerald-50" 
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                    importMethod === 'manual' ? "bg-emerald-600" : "bg-slate-100"
                  )}>
                    <List className={cn("w-6 h-6", importMethod === 'manual' ? "text-white" : "text-slate-600")} />
                  </div>
                  <h3 className="font-semibold text-slate-900">Saisie manuelle</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Ajoutez vos articles un par un
                  </p>
                </button>
              </div>

              {/* Zone d'upload si fichier sélectionné */}
              {importMethod === 'file' && (
                <div className="mt-4">
                  {selectedFile ? (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{selectedFile.name}</p>
                        <p className="text-sm text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Retirer
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-violet-400 hover:bg-violet-50/50 transition-all">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="font-medium text-slate-700">Cliquez pour sélectionner</span>
                      <span className="text-sm text-slate-500 mt-1">PDF, Excel ou CSV (max 10MB)</span>
                      <input
                        type="file"
                        accept=".pdf,.csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bouton de soumission */}
          <Button 
            type="submit" 
            disabled={!canSubmit() || isLoading}
            className="w-full h-12 bg-violet-600 hover:bg-violet-700 text-white text-base font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <FolderPlus className="mr-2 h-5 w-5" />
                Créer le projet
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
