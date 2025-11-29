"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  ArrowRight,
  Check,
  Upload, 
  FileUp, 
  List,
  Sparkles,
  Building2,
  Hotel,
  UtensilsCrossed,
  Store,
  Briefcase,
  HeartPulse,
  PartyPopper,
  Package,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Types
type Step = 1 | 2 | 3 | 4;
type ImportMethod = 'file' | 'manual' | 'template' | null;

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

// Mapping des icônes
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'building-2': Building2,
  'hotel': Hotel,
  'utensils': UtensilsCrossed,
  'store': Store,
  'briefcase': Briefcase,
  'heart-pulse': HeartPulse,
  'party-popper': PartyPopper,
  'package': Package,
};

// Couleurs par secteur
const colorMap: Record<string, { bg: string; border: string; text: string; light: string }> = {
  '#f59e0b': { bg: 'bg-amber-500', border: 'border-amber-300', text: 'text-amber-600', light: 'bg-amber-50' },
  '#8b5cf6': { bg: 'bg-violet-500', border: 'border-violet-300', text: 'text-violet-600', light: 'bg-violet-50' },
  '#ef4444': { bg: 'bg-red-500', border: 'border-red-300', text: 'text-red-600', light: 'bg-red-50' },
  '#10b981': { bg: 'bg-emerald-500', border: 'border-emerald-300', text: 'text-emerald-600', light: 'bg-emerald-50' },
  '#3b82f6': { bg: 'bg-blue-500', border: 'border-blue-300', text: 'text-blue-600', light: 'bg-blue-50' },
  '#06b6d4': { bg: 'bg-cyan-500', border: 'border-cyan-300', text: 'text-cyan-600', light: 'bg-cyan-50' },
  '#ec4899': { bg: 'bg-pink-500', border: 'border-pink-300', text: 'text-pink-600', light: 'bg-pink-50' },
  '#6b7280': { bg: 'bg-gray-500', border: 'border-gray-300', text: 'text-gray-600', light: 'bg-gray-50' },
};

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  // State
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(true);
  
  // Form data
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [projectName, setProjectName] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");
  const [importMethod, setImportMethod] = useState<ImportMethod>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Charger les secteurs depuis Supabase
  useEffect(() => {
    async function loadSectors() {
      // Note: cast as any car les types Supabase ne sont pas encore régénérés
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
        
        // Si un secteur est passé en paramètre URL, le sélectionner
        const sectorSlug = searchParams.get('sector');
        if (sectorSlug && data) {
          const sector = (data as Sector[]).find(s => s.slug === sectorSlug);
          if (sector) {
            setSelectedSector(sector);
            setCurrentStep(2);
          }
        }
      }
      setLoadingSectors(false);
    }
    loadSectors();
  }, [searchParams, supabase]);

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
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return selectedSector !== null;
      case 2: return projectName.trim().length > 0;
      case 3: return importMethod !== null && (importMethod !== 'file' || selectedFile !== null);
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4 && canProceed()) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSector || !projectName.trim()) {
      toast.error("Informations manquantes");
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
        sector_id: selectedSector.id,
        estimated_budget: estimatedBudget ? parseFloat(estimatedBudget) : null,
        budget_currency: 'EUR',
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

  // Render step indicator
  const steps = [
    { num: 1, label: 'Secteur' },
    { num: 2, label: 'Projet' },
    { num: 3, label: 'Import' },
    { num: 4, label: 'Confirmation' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-600">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-slate-900">Nouveau Projet</h1>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                    currentStep > step.num 
                      ? "bg-violet-600 text-white" 
                      : currentStep === step.num 
                        ? "bg-violet-600 text-white ring-4 ring-violet-100" 
                        : "bg-slate-100 text-slate-400"
                  )}>
                    {currentStep > step.num ? <Check className="h-5 w-5" /> : step.num}
                  </div>
                  <span className={cn(
                    "text-xs mt-1.5 font-medium",
                    currentStep >= step.num ? "text-slate-900" : "text-slate-400"
                  )}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-16 sm:w-24 h-0.5 mx-2",
                    currentStep > step.num ? "bg-violet-600" : "bg-slate-200"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step 1: Secteur */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">Quel est votre secteur ?</h2>
              <p className="text-slate-600 mt-2">Sélectionnez le domaine de votre projet</p>
            </div>

            {loadingSectors ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {sectors.map((sector) => {
                  const Icon = iconMap[sector.icon] || Package;
                  const colors = colorMap[sector.color] || colorMap['#6b7280'];
                  const isSelected = selectedSector?.id === sector.id;
                  
                  return (
                    <button
                      key={sector.id}
                      onClick={() => setSelectedSector(sector)}
                      className={cn(
                        "relative flex flex-col items-center p-4 rounded-xl border-2 transition-all",
                        isSelected 
                          ? `${colors.border} ${colors.light} ring-2 ring-offset-2` 
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                      )}
                      style={isSelected ? { '--tw-ring-color': sector.color } as React.CSSProperties : {}}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-2",
                        colors.bg
                      )}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-medium text-slate-800 text-center leading-tight">
                        {sector.name}
                      </span>
                      {isSelected && (
                        <div className={cn("absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center", colors.bg)}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Informations Projet */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">Informations du projet</h2>
              <p className="text-slate-600 mt-2">Donnez un nom à votre projet</p>
            </div>

            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 font-medium">
                    Nom du projet <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder={`Ex: ${selectedSector?.name || 'Projet'} - Sourcing Chine 2025`}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-slate-700 font-medium">
                    Budget estimé (optionnel)
                  </Label>
                  <div className="relative">
                    <Input
                      id="budget"
                      type="number"
                      placeholder="50000"
                      value={estimatedBudget}
                      onChange={(e) => setEstimatedBudget(e.target.value)}
                      className="h-12 pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">EUR</span>
                  </div>
                </div>

                {selectedSector && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                      <span className="font-medium">Secteur :</span> {selectedSector.name}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      <span className="font-medium">Catégories suggérées :</span>{' '}
                      {selectedSector.default_categories?.slice(0, 4).join(', ')}...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Méthode d'import */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">Comment ajouter vos {selectedSector?.item_label?.toLowerCase() || 'articles'}s ?</h2>
              <p className="text-slate-600 mt-2">Choisissez votre méthode préférée</p>
            </div>

            <div className="grid gap-4">
              {/* Option: Import fichier */}
              <button
                onClick={() => setImportMethod('file')}
                className={cn(
                  "flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all",
                  importMethod === 'file' 
                    ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200" 
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <FileUp className="w-6 h-6 text-violet-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">Importer un fichier</h3>
                    <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                      Recommandé
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Uploadez Excel, CSV ou PDF. L'IA structure automatiquement vos données.
                  </p>
                </div>
                {importMethod === 'file' && (
                  <Check className="w-5 h-5 text-violet-600 flex-shrink-0" />
                )}
              </button>

              {/* Option: Manuel */}
              <button
                onClick={() => setImportMethod('manual')}
                className={cn(
                  "flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all",
                  importMethod === 'manual' 
                    ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200" 
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <List className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Saisie manuelle</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Ajoutez vos {selectedSector?.item_label?.toLowerCase() || 'articles'}s un par un manuellement.
                  </p>
                </div>
                {importMethod === 'manual' && (
                  <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                )}
              </button>

              {/* Option: Template */}
              <button
                onClick={() => setImportMethod('template')}
                className={cn(
                  "flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all",
                  importMethod === 'template' 
                    ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200" 
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Partir d'un template</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Utilisez une liste type pré-remplie pour votre secteur.
                  </p>
                </div>
                {importMethod === 'template' && (
                  <Check className="w-5 h-5 text-amber-600 flex-shrink-0" />
                )}
              </button>
            </div>

            {/* Zone d'upload si fichier sélectionné */}
            {importMethod === 'file' && (
              <Card className="border-slate-200 border-dashed">
                <CardContent className="p-6">
                  {selectedFile ? (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Check className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{selectedFile.name}</p>
                        <p className="text-sm text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Retirer
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer py-4">
                      <Upload className="w-10 h-10 text-slate-400 mb-3" />
                      <span className="font-medium text-slate-700">Cliquez pour sélectionner</span>
                      <span className="text-sm text-slate-500 mt-1">PDF, Excel ou CSV (max 10MB)</span>
                      <input
                        type="file"
                        accept=".pdf,.csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">Récapitulatif</h2>
              <p className="text-slate-600 mt-2">Vérifiez les informations avant de créer</p>
            </div>

            <Card className="border-slate-200">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600">Secteur</span>
                  <span className="font-medium text-slate-900">{selectedSector?.name}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-600">Nom du projet</span>
                  <span className="font-medium text-slate-900">{projectName}</span>
                </div>
                {estimatedBudget && (
                  <div className="flex justify-between items-center py-3 border-b border-slate-100">
                    <span className="text-slate-600">Budget estimé</span>
                    <span className="font-medium text-slate-900">{parseInt(estimatedBudget).toLocaleString()} EUR</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-600">Méthode d'import</span>
                  <span className="font-medium text-slate-900">
                    {importMethod === 'file' && 'Import fichier'}
                    {importMethod === 'manual' && 'Saisie manuelle'}
                    {importMethod === 'template' && 'Template secteur'}
                  </span>
                </div>
                {importMethod === 'file' && selectedFile && (
                  <div className="flex justify-between items-center py-3 border-t border-slate-100">
                    <span className="text-slate-600">Fichier</span>
                    <span className="font-medium text-slate-900">{selectedFile.name}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-violet-900">Prochaine étape</p>
                  <p className="text-sm text-violet-700 mt-1">
                    {importMethod === 'file' 
                      ? "L'IA analysera votre fichier et proposera un mapping intelligent des colonnes."
                      : importMethod === 'template'
                        ? "Vous pourrez personnaliser le template selon vos besoins."
                        : `Vous pourrez ajouter vos ${selectedSector?.item_label?.toLowerCase() || 'articles'}s et collecter des prix.`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-8">
          {currentStep > 1 && (
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={isLoading}
              className="px-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          )}
          
          {currentStep < 4 ? (
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              Continuer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  Créer le projet
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
