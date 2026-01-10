"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Settings, Users, History, Send, Clock, Trash2, Edit, Plus, Upload, BarChart3, FileText, Shield, CheckCircle2, Package, Merge, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { createQuotationRequest } from "@/lib/quotation";
import { ShareProjectDialog } from "@/components/collaboration/ShareProjectDialog";
import { MaterialComments } from "@/components/collaboration/MaterialComments";
import { ProjectHistory } from "@/components/collaboration/ProjectHistory";
import { ImageUpload } from "@/components/project/ImageUpload";
import { MaterialsView } from "@/components/materials/MaterialsView";
import { Material } from "@/components/materials/types";
import { MaterialEditDialog } from "@/components/materials/MaterialEditDialog";
import DQEImportInline from "@/components/dqe/DQEImportInline";
import DuplicatesHandler from "@/components/dqe/DuplicatesHandler";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Project {
  id: string;
  name: string;
  source_url: string | null;
  file_path: string | null;
  mapping_status: string | null;
  created_at: string;
  sector?: string;
}

export default function ProjectPage() {
  const params = useParams();
  const rawId = params?.id;
  const projectId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const router = useRouter();
  const supabase = createClient();
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  
  // États pour l'édition de matériau
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // États pour l'ajout de matériau
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    name: '',
    description: null,
    category: null,
    quantity: null,
    surface: null,
    weight: null,
    volume: null,
    specs: {},
    images: [],
  });
  
  // États pour la gestion des prix (Données seulement)
  const [pricesByMaterial, setPricesByMaterial] = useState<Record<string, any[]>>({});
  const [prices, setPrices] = useState<any[]>([]); // Pour le calcul des stats globales si besoin
  
  // États pour l'import de fichier
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<string>('');
  const [importedCount, setImportedCount] = useState(0);
  const [importMode, setImportMode] = useState<'standard' | 'dqe' | null>(null);

  // État pour le traitement des doublons
  const [isDuplicatesDialogOpen, setIsDuplicatesDialogOpen] = useState(false);

  // États pour la collaboration
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsMaterialId, setCommentsMaterialId] = useState<string | null>(null);
  const [commentsMaterialName, setCommentsMaterialName] = useState<string>('');

  // États pour les suggestions IA (matériaux manquants)
  const [materialSuggestions, setMaterialSuggestions] = useState<Array<{
    name: string;
    category: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // États pour l'édition du projet
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);
  const [editProjectData, setEditProjectData] = useState({
    name: '',
    sourceUrl: ''
  });

  // États pour les permissions
  const [permissions, setPermissions] = useState({
    canView: false,
    canEdit: false,
    canDelete: false,
    canManage: false,
    role: null as 'owner' | 'editor' | 'viewer' | null,
  });
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  // États pour la suppression en masse
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // État pour la création de cotation
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false);

  // État pour les demandes de cotation existantes
  const [existingRequest, setExistingRequest] = useState<{
    id: string;
    request_number: string;
    status: string;
    updated_at: string;
  } | null>(null);
  const [isUpdatingRequest, setIsUpdatingRequest] = useState(false);
  const [hasModifiedMaterials, setHasModifiedMaterials] = useState(false);
  const [hasPendingClarifications, setHasPendingClarifications] = useState(false);
  const [updateSentForCurrentClarification, setUpdateSentForCurrentClarification] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadMaterials();
      loadAllPrices();
      checkPermissions();
      loadExistingRequest();
    }
  }, [projectId]);

  // Check for modified materials and pending clarifications when materials change
  useEffect(() => {
    // Matériaux avec demande de précision résolue (prêts pour mise à jour)
    const modified = materials.some(m => m.clarification_request?.resolved_at);
    setHasModifiedMaterials(modified);

    // Matériaux avec demande de précision en attente (non résolue)
    const pending = materials.some(m =>
      m.clarification_request &&
      m.clarification_request.requested_at &&
      !m.clarification_request.resolved_at
    );
    setHasPendingClarifications(pending);

    // Réinitialiser l'état "mise à jour envoyée" si l'admin fait une nouvelle demande
    if (pending) {
      setUpdateSentForCurrentClarification(false);
    }
  }, [materials]);

  // Vérifier les permissions de l'utilisateur
  const checkPermissions = async () => {
    try {
      setIsLoadingPermissions(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Check for mock user in localStorage for dev environment
        const mockUserStr = typeof window !== 'undefined' ? localStorage.getItem('mockUser') : null;
        if (mockUserStr) {
          const mockUser = JSON.parse(mockUserStr);
          if (mockUser.isTestUser) {
            setPermissions({
              canView: true,
              canEdit: true,
              canDelete: true,
              canManage: true,
              role: 'owner',
            });
            return;
          }
        }

        setPermissions({
          canView: false,
          canEdit: false,
          canDelete: false,
          canManage: false,
          role: null,
        });
        return;
      }

      // Vérifier si propriétaire du projet
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

      if (project?.user_id === user.id) {
        setPermissions({
          canView: true,
          canEdit: true,
          canDelete: true,
          canManage: true,
          role: 'owner',
        });
        return;
      }

      // Vérifier le rôle de collaborateur
      try {
        const { data: collab, error: collabError } = await supabase
          .from('project_collaborators' as any)
          .select('role, status')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .maybeSingle();

        if (collabError) {
          console.debug('Collaboration check skipped:', collabError.message);
        }

        if (collab) {
          const role = (collab as any).role as 'owner' | 'editor' | 'viewer';
          setPermissions({
            canView: true,
            canEdit: role === 'editor' || role === 'owner',
            canDelete: role === 'owner',
            canManage: role === 'owner',
            role: role,
          });
          return;
        }
      } catch (collabCheckError) {
        console.debug('Collaboration table not available');
      }

      // Si pas propriétaire et pas collaborateur, permissions par défaut
      setPermissions({
        canView: true,
        canEdit: false,
        canDelete: false,
        canManage: false,
        role: null,
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissions({
        canView: true,
        canEdit: false,
        canDelete: false,
        canManage: false,
        role: null,
      });
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  // Load existing supplier request for this project
  const loadExistingRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('supplier_requests')
        .select('id, request_number, status, updated_at')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setExistingRequest(data);
      }
    } catch (error) {
      // No existing request, that's fine
    }
  };

  // Update existing supplier request with modified materials
  const handleUpdateRequest = async () => {
    if (!existingRequest) return;

    // Vérifier que au moins un matériau a été complété (description OU image)
    const materialsWithPendingClarification = materials.filter(m =>
      m.clarification_request &&
      m.clarification_request.requested_at &&
      !m.clarification_request.resolved_at
    );

    const hasCompletedAtLeastOne = materialsWithPendingClarification.some(m => {
      const hasDescription = m.description && m.description.trim().length > 0;
      const hasImages = m.images && m.images.length > 0;
      return hasDescription || hasImages;
    });

    if (materialsWithPendingClarification.length > 0 && !hasCompletedAtLeastOne) {
      toast.error("Informations requises", {
        description: "Veuillez compléter la description ou ajouter une image à au moins un matériau avant d'envoyer la mise à jour."
      });
      return;
    }

    try {
      setIsUpdatingRequest(true);

      const response = await fetch(`/api/supplier-requests/${existingRequest.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update request');
      }

      const result = await response.json();
      toast.success("Demande mise à jour !", {
        description: result.message,
      });

      // Marquer que la mise à jour a été envoyée pour cette demande de clarification
      setUpdateSentForCurrentClarification(true);

      // Reload materials to clear modification flags visually
      loadMaterials();
      loadExistingRequest();
    } catch (error: any) {
      console.error("Error updating request:", error);
      toast.error("Erreur lors de la mise à jour", {
        description: error.message || "Veuillez réessayer"
      });
    } finally {
      setIsUpdatingRequest(false);
    }
  };

  const loadProject = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Handle specific mock demo project
        if (projectId === 'mock-demo') {
          setProject({
            id: 'mock-demo',
            name: 'Projet de Démonstration',
            source_url: null,
            file_path: null,
            mapping_status: 'completed',
            created_at: new Date().toISOString(),
            sector: 'Construction BTP'
          });
          setIsLoading(false);
          return;
        }

        const projectData = localStorage.getItem(`project_${projectId}`);
        let projectName = "Projet de test";
        let mappingStatus = null;
        
        if (projectData) {
          const { fileName, isMock } = JSON.parse(projectData);
          if (isMock) {
            projectName = fileName ? `Analyse de ${fileName}` : "Projet de test";
            mappingStatus = "completed";
          }
        }
        
        setProject({
          id: projectId,
          name: projectName,
          source_url: null,
          file_path: null,
          mapping_status: mappingStatus,
          created_at: new Date().toISOString(),
        });
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          sector:sectors(id, name, slug)
        `)
        .eq('id', projectId)
        .single();

      if (error) {
        console.error("Error loading project:", error);
        toast.error("Erreur lors du chargement du projet");
        router.push('/dashboard');
        return;
      }

      // Transformer les données pour inclure le nom du secteur
      const projectWithSector = {
        ...data,
        sector: data.sector?.slug || data.sector?.name || 'btp'
      };
      setProject(projectWithSector as any);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMaterials = async () => {
    try {
      setIsLoadingMaterials(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Mock materials for testing/preview
        const mockMaterials: Material[] = [
          {
            id: 'mock-m1',
            name: 'Ciment CPJ 35',
            description: 'Sac de 50kg - Pour béton armé et maçonnerie courante',
            category: 'Gros Oeuvre',
            quantity: 50,
            surface: 0,
            weight: 2500,
            volume: 0,
            specs: { unit: 'Sac' },
            project_id: projectId,
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-m2',
            name: 'Sable de rivière',
            description: 'Sable lavé 0/4mm en vrac',
            category: 'Gros Oeuvre',
            quantity: 12,
            surface: 0,
            weight: 0,
            volume: 12,
            specs: { unit: 'm3' },
            project_id: projectId,
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-m3',
            name: 'Peinture Acrylique Blanc',
            description: 'Seau de 20L - Finition Mat',
            category: 'Finitions',
            quantity: 15,
            surface: 150,
            weight: 300,
            volume: 0,
            specs: { unit: 'Seau' },
            project_id: projectId,
            created_at: new Date().toISOString()
          }
        ];
        setMaterials(mockMaterials);
        setIsLoadingMaterials(false);
        return;
      }

      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true });

      if (error) {
        console.error("Error loading materials:", error);
        return;
      }

      setMaterials((data as any) || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  const loadAllPrices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Mock prices for preview
        const mockPrices = [
          {
            id: 'mp-1',
            material_id: 'mock-m1',
            amount: 4500,
            currency: 'XAF',
            supplier: { name: 'Quincaillerie du Centre' },
            created_at: new Date().toISOString()
          },
          {
            id: 'mp-2',
            material_id: 'mock-m1',
            amount: 4700,
            currency: 'XAF',
            supplier: { name: 'Bati-Express' },
            created_at: new Date().toISOString()
          },
          {
            id: 'mp-3',
            material_id: 'mock-m2',
            amount: 12000,
            currency: 'XAF',
            supplier: { name: 'Sable Carrière' },
            created_at: new Date().toISOString()
          }
        ];
        
        setPrices(mockPrices);
        
        const grouped: Record<string, any[]> = {};
        mockPrices.forEach(price => {
          if (!grouped[price.material_id]) {
            grouped[price.material_id] = [];
          }
          grouped[price.material_id].push(price);
        });
        setPricesByMaterial(grouped);
        return;
      }

      const { data: materialsData } = await supabase
        .from('materials')
        .select('id')
        .eq('project_id', projectId);

      if (!materialsData || materialsData.length === 0) return;

      const typedMaterials = materialsData as any[];
      const materialIds = typedMaterials.map(m => m.id);

      const { data: pricesData } = await supabase
        .from('prices')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .in('material_id', materialIds);

      setPrices(pricesData || []);

      const grouped: Record<string, any[]> = {};
      const typedPrices = (pricesData as any[]) || [];
      typedPrices.forEach(price => {
        if (!grouped[price.material_id]) {
          grouped[price.material_id] = [];
        }
        grouped[price.material_id].push(price);
      });

      setPricesByMaterial(grouped);
    } catch (error) {
      console.error("Error loading all prices:", error);
    }
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setIsEditDialogOpen(true);
  };

  const handleSaveMaterial = async (materialToSave?: Material) => {
    const material = materialToSave || editingMaterial;
    if (!material) return;

    try {
      setIsSaving(true);

      // Check if we need to resolve a clarification request
      let updatedClarificationRequest = material.clarification_request;

      if (material.clarification_request && !material.clarification_request.resolved_at) {
        const needsImages = material.clarification_request.needs_images;
        const needsDescription = material.clarification_request.needs_description;
        const hasImages = material.images && material.images.length > 0;
        const hasDescription = material.description && material.description.trim().length > 0;

        // Check if all required info has been provided
        const imagesOk = !needsImages || hasImages;
        const descriptionOk = !needsDescription || hasDescription;

        if (imagesOk && descriptionOk) {
          // Mark clarification as resolved
          updatedClarificationRequest = {
            ...material.clarification_request,
            resolved_at: new Date().toISOString(),
          };
        }
      }

      const { error } = await supabase
        .from('materials')
        .update({
          name: material.name,
          description: material.description,
          category: material.category,
          quantity: material.quantity,
          surface: material.surface,
          weight: material.weight,
          volume: material.volume,
          specs: material.specs,
          images: material.images || [],
          clarification_request: updatedClarificationRequest,
        })
        .eq('id', material.id);

      if (error) throw error;

      // Show appropriate message based on whether clarification was resolved
      if (updatedClarificationRequest?.resolved_at &&
          material.clarification_request &&
          !material.clarification_request.resolved_at) {
        toast.success("Matériau mis à jour - Demande de précision résolue ✓");
      } else {
        toast.success("Matériau mis à jour");
      }

      setIsEditDialogOpen(false);
      setEditingMaterial(null);
      loadMaterials();
    } catch (error) {
      console.error("Error updating material:", error);
      toast.error("Erreur lors de la mise à jour");
      throw error; // Re-throw pour que le composant appelant puisse gérer l'erreur
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateMaterial = async (material: Material) => {
    try {
      const { id, ...rest } = material;
      const { error } = await supabase
        .from('materials')
        .insert({
          ...rest,
          name: `${material.name} (Copie)`,
          project_id: projectId
        });

      if (error) throw error;
      toast.success("Matériau dupliqué");
      loadMaterials();
    } catch (error) {
      console.error("Error duplicating material:", error);
      toast.error("Erreur lors de la duplication");
    }
  };

  const handleQuickUpdate = async (id: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;
      
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
      toast.success("Mis à jour");
    } catch (error) {
      console.error("Error quick updating:", error);
      toast.error("Erreur de mise à jour");
      loadMaterials();
    }
  };

  const handleExportMaterials = () => {
    toast.info("Exportation à venir");
  };

  const handleMaterialUpdate = (updatedMaterial: Material) => {
    setMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
  };

  const handleDeleteMaterial = async (materialId: string, materialName?: string) => {
    const name = materialName || materials.find(m => m.id === materialId)?.name || 'cet élément';
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      toast.success("Matériau supprimé");
      loadMaterials();
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleCategoryRename = async (oldName: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({ category: newName })
        .eq('project_id', projectId)
        .eq('category', oldName);

      if (error) throw error;
      
      toast.success(`Catégorie renommée en "${newName}"`);
      loadMaterials();
    } catch (error) {
      console.error('Error renaming category:', error);
      toast.error('Erreur lors du renommage');
    }
  };

  const handleImportFile = async () => {
    if (!importFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    const fileName = importFile.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isPDF = fileName.endsWith('.pdf');
    const isCSV = fileName.endsWith('.csv');
    const isTXT = fileName.endsWith('.txt');
    const isDOC = fileName.endsWith('.doc') || fileName.endsWith('.docx');

    try {
      setIsImporting(true);
      setImportProgress(10);

      // ============================================
      // TRAITEMENT PDF, CSV, TXT, DOC
      // ============================================
      if (isPDF || isCSV || isTXT || isDOC) {
        setImportStatus(`📂 Lecture du fichier ${isPDF ? 'PDF' : isCSV ? 'CSV' : isTXT ? 'TXT' : 'Word'}...`);
        
        let textContent = '';
        
        if (isCSV || isTXT) {
          // Lecture directe du texte
          textContent = await importFile.text();
        } else if (isPDF) {
          // Extraction PDF avec pdf.js
          setImportStatus('📄 Extraction du texte PDF...');
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
          
          const arrayBuffer = await importFile.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          const textParts: string[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items
              .map((item: any) => item.str)
              .join(' ');
            textParts.push(pageText);
            
            // Mise à jour progression
            setImportProgress(10 + Math.round((i / pdf.numPages) * 20));
          }
          textContent = textParts.join('\\n\\n');
          console.log(`📄 PDF extracted: ${pdf.numPages} pages, ${textContent.length} chars`);
        } else if (isDOC) {
          // Extraction DOCX avec mammoth
          setImportStatus('📝 Extraction du texte Word...');
          const mammoth = await import('mammoth');
          const arrayBuffer = await importFile.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          textContent = result.value;
          console.log(`📝 DOCX extracted: ${textContent.length} chars`);
        }

        if (!textContent || textContent.trim().length < 10) {
          throw new Error('Impossible d\'extraire le contenu du fichier');
        }

        setImportProgress(35);
        setImportStatus('🧠 Extraction IA des matériaux...');

        // Appel à l'API d'extraction
        const sectorForExtraction = project?.sector || 'btp';
        console.log(`📂 Sector for extraction: "${sectorForExtraction}"`);
        console.log(`📄 Text content length: ${textContent.length} chars`);

        const formData = new FormData();
        formData.append('textContent', textContent);
        formData.append('fileType', isPDF ? 'pdf' : isCSV ? 'csv' : isTXT ? 'txt' : 'doc');
        formData.append('sector', sectorForExtraction);

        const extractResponse = await fetch('/api/ai/extract-from-file', {
          method: 'POST',
          body: formData,
        });

        if (!extractResponse.ok) {
          const errorData = await extractResponse.json();
          throw new Error(errorData.error || 'Erreur lors de l\'extraction');
        }

        const extractResult = await extractResponse.json();
        const items = extractResult.items || [];

        if (items.length === 0) {
          throw new Error('Aucun matériau trouvé dans le fichier');
        }

        console.log(`✅ Extracted ${items.length} items via ${extractResult.method}`);

        // Stats d'extraction
        const itemsWithPrice = items.filter((i: any) => i.price !== null && i.price !== undefined).length;
        const itemsWithSupplier = items.filter((i: any) => i.supplier).length;
        const detectedCurrency = extractResult.detectedCurrency;

        setImportProgress(60);
        setImportStatus(`💾 Sauvegarde de ${items.length} articles (${itemsWithPrice} avec prix)...`);

        // Sauvegarde dans Supabase avec prix et fournisseur
        const materialsToInsert = items.map((item: any) => ({
          project_id: projectId,
          name: item.name,
          description: item.description,
          category: item.category || 'Non catégorisé',
          quantity: item.quantity,
          specs: {
            unit: item.unit,
            extracted_by: extractResult.method,
            file_type: extractResult.fileType,
            // Stocker le prix extrait dans specs pour référence
            extracted_price: item.price || null,
            extracted_currency: item.currency || detectedCurrency || null,
            extracted_supplier: item.supplier || null,
          },
        }));

        // Insérer les matériaux par lots de 50
        const INSERT_BATCH_SIZE = 50;
        const insertedMaterialIds: string[] = [];
        
        for (let i = 0; i < materialsToInsert.length; i += INSERT_BATCH_SIZE) {
          const batch = materialsToInsert.slice(i, i + INSERT_BATCH_SIZE);
          const { data: insertedData, error } = await supabase
            .from('materials')
            .insert(batch)
            .select('id');
          
          if (error) {
            console.error('Error inserting batch:', error);
          } else if (insertedData) {
            insertedMaterialIds.push(...insertedData.map(m => m.id));
          }
          
          const progress = 60 + Math.round((i / materialsToInsert.length) * 25);
          setImportProgress(progress);
        }

        // Créer les entrées de prix pour les matériaux qui ont un prix extrait
        setImportStatus(`💰 Enregistrement des ${itemsWithPrice} prix extraits...`);
        
        const pricesToInsert: any[] = [];
        items.forEach((item: any, index: number) => {
          if (item.price && insertedMaterialIds[index]) {
            pricesToInsert.push({
              material_id: insertedMaterialIds[index],
              amount: item.price, // Map price to amount for prices table
              currency: item.currency || detectedCurrency || 'XAF',
              country: 'local', // Par défaut local
              notes: `Source: ${item.supplier || 'Importé depuis fichier'}. Extrait de ${isPDF ? 'PDF' : isCSV ? 'CSV' : isTXT ? 'TXT' : 'Word'}`,
            });
          }
        });

        // Insérer les prix par lots
        if (pricesToInsert.length > 0) {
          for (let i = 0; i < pricesToInsert.length; i += INSERT_BATCH_SIZE) {
            const batch = pricesToInsert.slice(i, i + INSERT_BATCH_SIZE);
            const { error } = await supabase.from('prices').insert(batch);
            if (error) console.error('Error inserting prices:', error);
          }
          console.log(`💰 Inserted ${pricesToInsert.length} prices`);
        }

        // Mettre à jour le statut du projet
        await supabase
          .from('projects')
          .update({ mapping_status: 'completed' } as any)
          .eq('id', projectId);

        setImportProgress(100);
        setImportStatus('✅ Import terminé avec succès !');

        // Message de succès détaillé
        let successMsg = `${items.length} éléments importés depuis ${isPDF ? 'PDF' : isCSV ? 'CSV' : isTXT ? 'TXT' : 'Word'}`;
        if (itemsWithPrice > 0) {
          successMsg += ` (${itemsWithPrice} prix, ${itemsWithSupplier} fournisseurs)`;
        }

        setTimeout(() => {
          toast.success(successMsg);
          setIsImportDialogOpen(false);
          setIsImporting(false);
          setImportFile(null);
          setImportProgress(0);
          setImportStatus('');
          loadMaterials();
        }, 1500);

        return;
      }

      // ============================================
      // TRAITEMENT EXCEL (existant)
      // ============================================
      setImportStatus('📂 Lecture du fichier Excel...');

      // 1. Lire le fichier Excel localement avec SheetJS (import dynamique)
      const XLSX = await import('xlsx');
      const arrayBuffer = await importFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir en tableau de tableaux (raw data)
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (!rawData || rawData.length === 0) {
        throw new Error('Fichier vide ou illisible');
      }

      console.log(`📊 Excel loaded: ${rawData.length} rows`);
      setImportProgress(20);
      setImportStatus('🧠 Analyse de la structure du fichier...');

      // 2. Envoyer un échantillon à l'IA pour analyse de structure
      // On prend les 25 premières lignes qui contiennent généralement l'en-tête
      const sampleRows = rawData.slice(0, 25); 
      
      const analyzeResponse = await fetch('/api/ai/analyze-file-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileSample: sampleRows,
          fileName: importFile.name
        }),
      });

      if (!analyzeResponse.ok) {
        const errorText = await analyzeResponse.text();
        console.error('Analysis error:', errorText);
        throw new Error('Erreur lors de l\'analyse de structure');
      }

      const analysisResult = await analyzeResponse.json();
      const config = analysisResult.config;
      const modelUsed = analysisResult.model;

      console.log('🧠 Structure analysis result:', config);
      
      if (!config || typeof config.headerRowIndex !== 'number') {
        throw new Error('Impossible de détecter la structure du fichier');
      }

      setImportProgress(40);
      setImportStatus(`🚀 Extraction déterministe (${modelUsed})...`);

      // 3. Extraction déterministe basée sur la config
      const items: any[] = [];
      const categories = new Set<string>();
      const headerRow = config.headerRowIndex;
      const cols = config.columns;

      // Boucler sur les lignes APRÈS l'en-tête
      for (let i = headerRow + 1; i < rawData.length; i++) {
        const row = rawData[i];
        
        // Ignorer les lignes vides ou trop courtes
        if (!row || row.length === 0) continue;

        // Récupérer le nom (critique)
        const name = cols.name !== null && row[cols.name] !== undefined ? row[cols.name] : null;
        
        // Filtre basique: il faut au moins un nom valide
        if (!name || typeof name !== 'string' || name.trim().length < 2) continue;
        
        // Ignorer les lignes qui ressemblent à des totaux
        if (name.toLowerCase().includes('total') || name.toLowerCase().includes('montant')) continue;

        // Extraction des autres champs
        let description = cols.description !== null && row[cols.description] !== undefined ? row[cols.description] : null;
        // Si description == name, on met null pour ne pas dupliquer
        if (description === name) description = null;

        let category = cols.category !== null && row[cols.category] !== undefined ? row[cols.category] : 'Non catégorisé';
        
        // Nettoyage Quantité
        let quantity = cols.quantity !== null && row[cols.quantity] !== undefined ? row[cols.quantity] : null;
        if (typeof quantity === 'string') {
          // Nettoyer "1 200,50" -> 1200.50
          const cleanQty = quantity.replace(/\s/g, '').replace(/,/g, '.');
          quantity = parseFloat(cleanQty.replace(/[^\d.-]/g, ''));
        }
        
        // Nettoyage Unité
        const unit = cols.unit !== null && row[cols.unit] !== undefined ? row[cols.unit] : null;

        // Nettoyage Prix (informatif pour l'instant)
        let price = cols.price !== null && row[cols.price] !== undefined ? row[cols.price] : null;
        
        items.push({
          name: name.trim(),
          description: description ? description.toString().trim() : null,
          category: category ? category.toString().trim() : 'Non catégorisé',
          quantity: isNaN(quantity) ? null : quantity,
          unit: unit ? unit.toString().trim() : null,
          specs: {
            extracted_from_row: i,
            original_price: price
          }
        });

        if (category && category !== 'Non catégorisé') categories.add(category.toString().trim());
      }

      console.log(`✅ Extracted ${items.length} items deterministically`);
      
      if (items.length === 0) {
        throw new Error('Aucun article trouvé avec la structure détectée');
      }

      setImportProgress(50);
      setImportStatus(`🏷️ Catégorisation IA de ${items.length} articles...`);

      // 4. Catégorisation IA des matériaux
      try {
        const categorizeResponse = await fetch('/api/ai/categorize-materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materials: items,
            projectType: project?.sector || 'Construction'
          }),
        });

        if (categorizeResponse.ok) {
          const catResult = await categorizeResponse.json();
          const categoryMap = catResult.categoryMap || {};
          
          // Appliquer les catégories IA aux items
          items.forEach((item, index) => {
            if (categoryMap[index]) {
              item.category = categoryMap[index];
            }
          });
          
          console.log(`🏷️ AI categorized ${Object.keys(categoryMap).length} items with ${catResult.model}`);
        }
      } catch (catError) {
        console.warn('AI categorization failed, keeping original categories:', catError);
      }

      setImportProgress(70);
      setImportStatus(`💾 Sauvegarde de ${items.length} articles...`);

      // 5. Sauvegarde dans Supabase
      const materialsToInsert = items.map(item => ({
        project_id: projectId,
        name: item.name,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
        specs: {
          ...item.specs,
          unit: item.unit,
          extracted_by: `smart-etl-${modelUsed}`,
          sector: 'construction',
        },
      }));

      // Insérer par lots de 50
      const INSERT_BATCH_SIZE = 50;
      for (let i = 0; i < materialsToInsert.length; i += INSERT_BATCH_SIZE) {
        const batch = materialsToInsert.slice(i, i + INSERT_BATCH_SIZE);
        const { error } = await supabase.from('materials').insert(batch);
        if (error) console.error('Error inserting batch:', error);
        
        // Mise à jour progression
        const progress = 70 + Math.round((i / materialsToInsert.length) * 30);
        setImportProgress(progress);
      }

      // Mettre à jour le statut du projet
      await supabase
        .from('projects')
        .update({ mapping_status: 'completed' } as any)
        .eq('id', projectId);

      setImportProgress(100);
      setImportStatus('✅ Import terminé avec succès !');

      setTimeout(() => {
        toast.success(`${items.length} éléments importés via Smart ETL`);
        setIsImportDialogOpen(false);
        setIsImporting(false);
        setImportFile(null);
        setImportProgress(0);
        setImportStatus('');
        setImportedCount(0);
        loadMaterials();
      }, 1500);

    } catch (error) {
      console.error('Error importing file:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'import');
      setIsImporting(false);
      setImportProgress(0);
      setImportStatus('');
    }
  };

  const handleAddMaterial = () => {
    setNewMaterial({
      name: '',
      description: null,
      category: null,
      quantity: null,
      surface: null,
      weight: null,
      volume: null,
      specs: {},
      images: [],
    });
    setIsAddDialogOpen(true);
  };

  const handleSaveNewMaterial = async () => {
    if (!newMaterial.name || !newMaterial.name.trim()) {
      toast.error("Le nom du matériau est requis");
      return;
    }

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('materials')
        .insert({
          project_id: projectId,
          name: newMaterial.name,
          description: newMaterial.description,
          category: newMaterial.category,
          quantity: newMaterial.quantity,
          surface: newMaterial.surface,
          weight: newMaterial.weight,
          volume: newMaterial.volume,
          specs: newMaterial.specs || {},
          images: newMaterial.images || [],
        });

      if (error) throw error;

      toast.success("Matériau ajouté");
      setIsAddDialogOpen(false);
      setNewMaterial({
        name: '',
        description: null,
        category: null,
        quantity: null,
        surface: null,
        weight: null,
        volume: null,
        specs: {},
        images: [],
      });
      loadMaterials();
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMaterials = async () => {
    try {
      setIsDeleting(true);
      
      const materialsToDelete = materials;
      const materialIds = materialsToDelete.map(m => m.id);
      
      if (materialIds.length === 0) {
        toast.error('Aucun matériau à supprimer');
        return;
      }

      const { error } = await supabase
        .from('materials')
        .delete()
        .in('id', materialIds);

      if (error) throw error;

      toast.success(`${materialIds.length} matériau(x) supprimé(s)`);
      setIsDeleteDialogOpen(false);
      loadMaterials();
      loadAllPrices();
    } catch (error) {
      console.error('Error deleting materials:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion: { name: string; category: string; reason: string; priority: string }) => {
    try {
      const { error } = await supabase
        .from('materials')
        .insert({
          project_id: projectId,
          name: suggestion.name,
          category: suggestion.category,
          description: `Suggestion IA: ${suggestion.reason}`,
          quantity: null,
          specs: { 
            suggested_by_ai: true,
            suggestion_reason: suggestion.reason,
            suggestion_priority: suggestion.priority
          },
        });

      if (error) throw error;

      setMaterialSuggestions(prev => prev.filter(s => s.name !== suggestion.name));
      toast.success(`"${suggestion.name}" ajouté à la liste`);
      loadMaterials();
    } catch (error) {
      console.error('Error accepting suggestion:', error);
      toast.error("Erreur lors de l'ajout du matériau");
    }
  };

  const handleRejectSuggestion = (suggestionName: string) => {
    setMaterialSuggestions(prev => prev.filter(s => s.name !== suggestionName));
    toast.info('Suggestion ignorée');
  };

  const handleDismissAllSuggestions = () => {
    setMaterialSuggestions([]);
    toast.info('Toutes les suggestions ont été ignorées');
  };

  const handleRegenerateSuggestions = async () => {
    if (materials.length === 0) {
      toast.error('Aucun matériau dans le projet');
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      const response = await fetch('/api/ai/suggest-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materials: materials,
          projectType: project?.sector || 'Construction',
          projectName: project?.name || 'Projet'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.suggestions && result.suggestions.length > 0) {
          setMaterialSuggestions(result.suggestions);
          toast.success(`${result.suggestions.length} suggestions générées`);
        } else {
          toast.info('Aucune suggestion trouvée');
        }
      } else {
        throw new Error('Erreur API');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Erreur lors de la génération des suggestions');
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleOpenEditProject = () => {
    if (project) {
      setEditProjectData({
        name: project.name,
        sourceUrl: project.source_url || ''
      });
      setIsEditProjectDialogOpen(true);
    }
  };

  const handleSaveProject = async () => {
    if (!editProjectData.name.trim()) {
      toast.error("Le nom du projet est requis");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: editProjectData.name,
          source_url: editProjectData.sourceUrl || null
        })
        .eq('id', projectId);

      if (error) throw error;

      toast.success("Projet mis à jour");
      setIsEditProjectDialogOpen(false);
      loadProject();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet et toutes ses données ?")) {
      return;
    }

    try {
      // Use server-side API to delete project (bypasses RLS and handles triggers properly)
      const response = await fetch(`/api/projects/${projectId}/delete`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      toast.success("Projet supprimé");
      router.push('/dashboard');
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la suppression");
    }
  };

  const handleCreateQuotation = async () => {
    if (!project) return;

    if (materials.length === 0) {
      toast.error("Aucun matériau dans ce projet", {
        description: "Ajoutez des matériaux avant de demander une cotation"
      });
      return;
    }

    setIsCreatingQuotation(true);
    
    try {
      toast.info("Préparation de la demande...", {
        description: "Récupération des matériaux et commentaires"
      });

      const result = await createQuotationRequest({
        projectId: project.id,
        country: 'China',
        numSuppliers: 3,
        shippingType: 'sea',
        notes: ''
      });

      if (result.success) {
        toast.success("Demande de cotation envoyée !", {
          description: "Vous recevrez une notification quand elle sera traitée"
        });
      } else {
        throw new Error(result.error || "Erreur inconnue");
      }
    } catch (error: any) {
      console.error("Error creating quotation:", error);
      toast.error("Erreur lors de la création", {
        description: error.message || "Veuillez réessayer"
      });
    } finally {
      setIsCreatingQuotation(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#5B5FC7] border-t-transparent shadow-lg"></div>
          <p className="text-lg font-medium text-[#4A5568] animate-pulse">Chargement de votre projet...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#F7FAFC]">
        <h1 className="text-2xl font-bold text-red-600">Projet introuvable</h1>
        <Button onClick={() => router.push('/dashboard')}>Retour au tableau de bord</Button>
      </div>
    );
  }

  // Vérifier les permissions après le chargement
  if (!isLoadingPermissions && !permissions.canView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F8F9FF] to-[#E8EEFF] p-4 md:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-orange-500/10">
                <Shield className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-[#4A5568]">Accès refusé</h3>
              <p className="mb-8 text-[#718096] max-w-md mx-auto">
                Vous n'avez pas les permissions nécessaires pour accéder à ce projet.
              </p>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#5B5FC7]">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour au dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FF] to-[#E8EEFF] p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 w-full">
        {/* Header moderne - Mobile first */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Ligne 1: Retour + Titre */}
          <div className="flex items-start gap-3 w-full min-w-0">
            <Link href="/dashboard" className="flex-shrink-0">
              <Button 
                variant="ghost" 
                size="icon"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all border-0"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-[#5B5FC7]" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] bg-clip-text text-transparent truncate">
                {project.name}
              </h1>
              <p className="text-sm sm:text-base text-[#718096] mt-1 truncate">
                Créé le {new Date(project.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          
          {/* Ligne 2: Actions - Scrollable horizontalement sur mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:overflow-visible sm:flex-wrap">
            {/* Badge de rôle */}
            {permissions.role && (
              <Badge 
                variant="outline"
                className={`flex-shrink-0 ${
                  permissions.role === 'owner'
                    ? 'border-purple-300 text-purple-700 bg-purple-50'
                    : permissions.role === 'editor'
                    ? 'border-green-300 text-green-700 bg-green-50'
                    : 'border-blue-300 text-blue-700 bg-blue-50'
                }`}
              >
                {permissions.role === 'owner' ? '👑 Propriétaire' :
                 permissions.role === 'editor' ? '✏️ Éditeur' : '👁️ Lecteur'}
              </Badge>
            )}
            
            {/* Bouton Mettre à jour la demande (si demande existante et demande de clarification en cours) */}
            {permissions.canManage && existingRequest && (hasPendingClarifications || hasModifiedMaterials) && (
              <div className="flex flex-col items-start gap-1 flex-shrink-0">
                <Button
                  onClick={handleUpdateRequest}
                  disabled={isUpdatingRequest || updateSentForCurrentClarification}
                  className={`gap-2 text-white shadow-lg hover:shadow-xl transition-all rounded-xl text-sm px-3 py-2 ${
                    updateSentForCurrentClarification
                      ? 'bg-gradient-to-r from-green-500 to-green-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 animate-pulse'
                  }`}
                >
                  {isUpdatingRequest ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="hidden sm:inline">Mise à jour...</span>
                    </>
                  ) : updateSentForCurrentClarification ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Mise à jour envoyée</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span className="hidden sm:inline">Mettre à jour la demande</span>
                    </>
                  )}
                </Button>
                {/* Date de dernière mise à jour */}
                {existingRequest.updated_at && (
                  <span className="text-xs text-[#718096] pl-1">
                    Dernière màj: {new Date(existingRequest.updated_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                )}
              </div>
            )}

            {/* Bouton Demander une cotation */}
            {permissions.canManage && materials.length > 0 && !existingRequest && (
              <Button
                onClick={handleCreateQuotation}
                disabled={isCreatingQuotation}
                className="flex-shrink-0 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl text-sm px-3 py-2"
              >
                {isCreatingQuotation ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Création...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Demander une cotation</span>
                  </>
                )}
              </Button>
            )}
            
            {permissions.canManage && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsShareDialogOpen(true)}
                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#5B5FC7] hover:text-white transition-all"
                title="Partager le projet"
              >
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
              className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#5B5FC7] hover:text-white transition-all"
              title="Historique du projet"
            >
              <History className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            {permissions.canManage && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleOpenEditProject}
                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#5B5FC7] hover:text-white transition-all"
                title="Éditer le projet"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
            {permissions.canDelete && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleDelete}
                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 border-[#E0E4FF] hover:border-red-500 hover:bg-red-500 hover:text-white transition-all"
                title="Supprimer le projet"
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            )}
          </div>
        </div>


      {/* Actions rapides - Style moderne */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card className="group border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden hover:scale-105 cursor-pointer">
          <div className="h-2 bg-gradient-to-r from-[#48BB78] to-[#38A169]" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#48BB78]/10 to-[#38A169]/10 rounded-xl flex items-center justify-center">
                <Plus className="h-6 w-6 text-[#48BB78]" />
              </div>
              <CardTitle className="text-lg font-bold text-[#4A5568] group-hover:text-[#48BB78] transition-colors">
                Ajouter des matériaux
              </CardTitle>
            </div>
            <CardDescription className="text-[#718096] mt-2">
              Ajoutez manuellement des équipements à comparer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full border-2 border-[#E0E4FF] hover:border-[#48BB78] hover:bg-[#48BB78] hover:text-white text-[#48BB78] font-semibold rounded-xl py-6 transition-all" 
              variant="outline" 
              onClick={handleAddMaterial}
            >
              Ajouter
            </Button>
          </CardContent>
        </Card>

        <Card className="group border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden hover:scale-105 cursor-pointer">
          <div className="h-2 bg-gradient-to-r from-[#38B2AC] to-[#319795]" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#38B2AC]/10 to-[#319795]/10 rounded-xl flex items-center justify-center">
                <Upload className="h-6 w-6 text-[#38B2AC]" />
              </div>
              <CardTitle className="text-lg font-bold text-[#4A5568] group-hover:text-[#38B2AC] transition-colors">
                Importer un fichier
              </CardTitle>
            </div>
            <CardDescription className="text-[#718096] mt-2">
              Uploadez une liste de matériaux (PDF, CSV, Excel)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full border-2 border-[#E0E4FF] hover:border-[#38B2AC] hover:bg-[#38B2AC] hover:text-white text-[#38B2AC] font-semibold rounded-xl py-6 transition-all"
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importer
            </Button>
          </CardContent>
        </Card>

        <Card className="group border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden hover:scale-105">
          <div className="h-2 bg-gradient-to-r from-[#5B5FC7] to-[#FF9B7B]" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#5B5FC7]/10 to-[#FF9B7B]/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-[#5B5FC7]" />
              </div>
              <CardTitle className="text-lg font-bold text-[#4A5568] group-hover:text-[#5B5FC7] transition-colors">
                Voir la comparaison
              </CardTitle>
            </div>
            <CardDescription className="text-[#718096] mt-2">
              Tableau de comparaison des prix
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/dashboard/projects/${projectId}/comparison`}>
              <Button className="w-full bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#6B6FD7] text-white shadow-lg shadow-[#5B5FC7]/30 rounded-xl py-6 font-semibold transition-all hover:scale-105">
                <BarChart3 className="mr-2 h-5 w-5 text-white" />
                <span className="text-white font-semibold">Voir</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

      </div>

      {/* Bannière d'information pour les demandes de précision en attente */}
      {hasPendingClarifications && !updateSentForCurrentClarification && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="py-4">
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-semibold text-orange-900">Précisions demandées par l'administrateur</h4>
                <p className="text-sm text-orange-800">
                  Des informations supplémentaires sont nécessaires pour certains matériaux.
                  <strong> Veuillez compléter la description ou ajouter une image</strong> pour chaque matériau marqué
                  avant de pouvoir envoyer votre mise à jour.
                </p>
                <p className="text-xs text-orange-700 mt-2">
                  💡 Cliquez sur un matériau avec le badge orange pour le modifier et ajouter les informations demandées.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message de confirmation après envoi de la mise à jour */}
      {updateSentForCurrentClarification && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="py-4">
            <div className="flex gap-3 items-start">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="font-semibold text-green-900">Mise à jour envoyée avec succès</h4>
                <p className="text-sm text-green-800">
                  Votre mise à jour a été transmise à l'administrateur. Vous serez notifié en cas de nouvelles demandes de précision.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Matériaux - Style moderne */}
      <MaterialsView
        materials={materials}
        pricesByMaterial={pricesByMaterial}
        commentsByMaterial={commentsMaterialName ? {[commentsMaterialId || '']: []} : {}} // Placeholder or real data
        onEditMaterial={handleEditMaterial}
        onDeleteMaterial={(id) => handleDeleteMaterial(id)}
        onDuplicateMaterial={handleDuplicateMaterial}
        onAddMaterial={handleAddMaterial}
        onImportMaterials={() => setIsImportDialogOpen(true)}
        onExportMaterials={handleExportMaterials}
        onQuickUpdate={handleQuickUpdate}
        onMaterialUpdate={handleMaterialUpdate}
        onCategoryRename={handleCategoryRename}
        onMergeDuplicates={() => setIsDuplicatesDialogOpen(true)}
        projectId={projectId}
        suggestions={materialSuggestions.reduce((acc: any[], curr) => {
          const existing = acc.find(g => g.category === curr.category);
          if (existing) {
            existing.missingItems.push({ name: curr.name, reason: curr.reason });
          } else {
            acc.push({ category: curr.category, missingItems: [{ name: curr.name, reason: curr.reason }] });
          }
          return acc;
        }, [])}
        isLoadingSuggestions={isLoadingSuggestions}
        onAcceptSuggestion={async (item, category) => {
          const original = materialSuggestions.find(s => s.name === item.name && s.category === category);
          await handleAcceptSuggestion({
              name: item.name,
              category,
              reason: item.reason,
              priority: original?.priority || 'medium'
          });
        }}
        onDismissSuggestion={(item, category) => handleRejectSuggestion(item.name)}
        onDismissAllSuggestions={handleDismissAllSuggestions}
        onRegenerateSuggestions={handleRegenerateSuggestions}
      />

      {/* Historique du projet - Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#2D3748]">
              Historique du projet
            </DialogTitle>
            <DialogDescription>
              Consultez l'historique complet des modifications apportées à ce projet
            </DialogDescription>
          </DialogHeader>
          <ProjectHistory projectId={projectId} />
        </DialogContent>
      </Dialog>

      {/* Info */}
      {project.mapping_status === 'completed' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="text-2xl">✅</div>
              <div className="space-y-2">
                <h4 className="font-semibold text-green-900">Analyse Terminée!</h4>
                <p className="text-sm text-green-800">
                  Votre fichier a été analysé avec succès. Les matériaux ont été détectés et 
                  le mapping des colonnes a été créé.
                </p>
                {String(projectId).startsWith('mock-') && (
                  <p className="text-sm text-green-700 mt-2">
                    💡 <strong>Mode Démo:</strong> Vous utilisez le login admin. Pour voir les matériaux 
                    réellement créés dans la base de données, connectez-vous avec 
                    un compte Supabase sur <a href="/login" className="underline">/login</a>.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Modal d'édition */}
      <MaterialEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        material={editingMaterial}
        onSave={handleSaveMaterial}
        projectId={projectId}
      />

      {/* Modal d'ajout */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] border-0 bg-white/95 backdrop-blur-sm shadow-2xl overflow-hidden flex flex-col">
          <div className="h-2 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] absolute top-0 left-0 right-0 rounded-t-lg" />
          <DialogHeader className="pt-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-[#5B5FC7]/10 to-[#7B7FE8]/10 rounded-xl flex items-center justify-center">
                <Package className="h-5 w-5 text-[#5B5FC7]" />
              </div>
              Ajouter un matériau
            </DialogTitle>
            <DialogDescription className="text-[#718096]">
              Ajoutez un nouveau matériau à votre projet
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4 overflow-y-auto flex-1 px-6">
            <div className="grid gap-2">
              <Label htmlFor="new-name">Nom *</Label>
              <Input
                id="new-name"
                value={newMaterial.name || ''}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                placeholder="Nom du matériau"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-description">Description</Label>
              <Textarea
                id="new-description"
                value={newMaterial.description || ''}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value || null })}
                placeholder="Spécifications, caractéristiques, notes..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-category">Catégorie</Label>
              <Input
                id="new-category"
                value={newMaterial.category || ''}
                onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                placeholder="Ex: Matériaux de base, Ferraillage..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-quantity">Quantité</Label>
                <Input
                  id="new-quantity"
                  type="number"
                  value={newMaterial.quantity || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, quantity: parseFloat(e.target.value) || null })}
                  placeholder="0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-surface">Surface (m²)</Label>
                <Input
                  id="new-surface"
                  type="number"
                  value={newMaterial.surface || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, surface: parseFloat(e.target.value) || null })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-weight">Poids (kg)</Label>
                <Input
                  id="new-weight"
                  type="number"
                  value={newMaterial.weight || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, weight: parseFloat(e.target.value) || null })}
                  placeholder="0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-volume">Volume (m³)</Label>
                <Input
                  id="new-volume"
                  type="number"
                  value={newMaterial.volume || ''}
                  onChange={(e) => setNewMaterial({ ...newMaterial, volume: parseFloat(e.target.value) || null })}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Images Upload */}
            <div className="space-y-2">
              <Label>Images</Label>
              <ImageUpload
                images={newMaterial.images || []}
                onImagesChange={(images) => setNewMaterial({ ...newMaterial, images })}
                maxImages={5}
                bucket="project-materials"
                path={projectId}
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewMaterial({
                  name: '',
                  description: null,
                  category: null,
                  quantity: null,
                  surface: null,
                  weight: null,
                  volume: null,
                  specs: {},
                });
              }}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveNewMaterial} disabled={isSaving || !newMaterial.name}>
              {isSaving ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Import de Fichier */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        setIsImportDialogOpen(open);
        if (!open) {
          setImportFile(null);
          setImportMode(null);
          setIsImporting(false);
          setImportProgress(0);
          setImportStatus('');
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#38B2AC]" />
              Importer un fichier
            </DialogTitle>
            <DialogDescription>
              Uploadez une liste de matériaux (CSV, Excel, PDF) ou un DQE BTP
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Mode DQE actif */}
            {importMode === 'dqe' && importFile && (
              <DQEImportInline
                file={importFile}
                projectId={projectId}
                onProgress={(progress, status) => {
                  setImportProgress(progress);
                  setImportStatus(status);
                }}
                onComplete={async (result) => {
                  // Sauvegarder les matériaux extraits dans Supabase
                  const allItems = result.data.sheets.flatMap(sheet =>
                    sheet.categories.flatMap((cat: any) =>
                      cat.items.map((item: any) => ({
                        project_id: projectId,
                        name: item.designation,
                        description: item.dosage || item.dimensions || null,
                        category: item.category || cat.name || 'Non catégorisé',
                        quantity: item.quantite,
                        specs: {
                          unit: item.unite,
                          numero: item.numero,
                          prix_unitaire: item.prix_unitaire,
                          prix_total: item.prix_total,
                          lot_numero: item.lot_numero,
                          lot_nom: item.lot_nom,
                          subcategory: item.subcategory,
                          extracted_by: 'dqe-extractor',
                          source_sheet: sheet.sheet_name
                        }
                      }))
                    )
                  );

                  if (allItems.length > 0) {
                    const INSERT_BATCH_SIZE = 50;
                    for (let i = 0; i < allItems.length; i += INSERT_BATCH_SIZE) {
                      const batch = allItems.slice(i, i + INSERT_BATCH_SIZE);
                      const { error } = await supabase.from('materials').insert(batch);
                      if (error) console.error('Error inserting batch:', error);
                    }

                    // Mettre à jour le statut du projet
                    await supabase
                      .from('projects')
                      .update({ mapping_status: 'completed' } as any)
                      .eq('id', projectId);
                  }

                  toast.success(`${result.extraction_info.total_items} éléments importés depuis DQE`);
                  setIsImportDialogOpen(false);
                  setImportFile(null);
                  setImportMode(null);
                  loadMaterials();
                }}
                onCancel={() => {
                  setImportMode(null);
                  setImportFile(null);
                }}
              />
            )}

            {/* Sélection du fichier (mode normal) */}
            {!importMode && !isImporting && (
              <>
                {/* Zone de drop */}
                <div className="border-2 border-dashed border-[#E0E4FF] hover:border-[#38B2AC] rounded-xl p-8 text-center transition-colors">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf,.txt,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImportFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#38B2AC]/10 to-[#319795]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-[#38B2AC]" />
                    </div>
                    <p className="text-lg font-semibold text-[#4A5568] mb-2">
                      {importFile ? importFile.name : 'Cliquez pour sélectionner un fichier'}
                    </p>
                    <p className="text-sm text-[#718096]">
                      PDF, Excel, CSV, Word ou TXT
                    </p>
                  </label>
                </div>

                {/* Choix du mode si fichier Excel sélectionné */}
                {importFile && importFile.name.match(/\.xlsx?$/i) && (
                  <div className="bg-gradient-to-r from-[#5B5FC7]/5 to-[#7B7FE8]/5 border border-[#5B5FC7]/20 rounded-xl p-4">
                    <p className="text-sm font-semibold text-[#4A5568] mb-3">
                      🏗️ Fichier Excel détecté - Choisissez le mode d&apos;import:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setImportMode('dqe')}
                        className="p-4 border-2 border-[#5B5FC7]/30 hover:border-[#5B5FC7] bg-white rounded-xl text-left transition-all hover:shadow-lg group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-5 w-5 text-[#5B5FC7]" />
                          <span className="font-semibold text-[#4A5568] group-hover:text-[#5B5FC7]">Mode DQE</span>
                        </div>
                        <p className="text-xs text-[#718096]">
                          Devis Quantitatif Estimatif BTP avec sélection d&apos;onglets et catégorisation IA
                        </p>
                      </button>
                      <button
                        onClick={() => setImportMode('standard')}
                        className="p-4 border-2 border-[#38B2AC]/30 hover:border-[#38B2AC] bg-white rounded-xl text-left transition-all hover:shadow-lg group"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Upload className="h-5 w-5 text-[#38B2AC]" />
                          <span className="font-semibold text-[#4A5568] group-hover:text-[#38B2AC]">Mode Standard</span>
                        </div>
                        <p className="text-xs text-[#718096]">
                          Import classique avec détection automatique des colonnes
                        </p>
                      </button>
                    </div>
                  </div>
                )}

                {/* Info format */}
                {!importFile && (
                  <div className="bg-[#38B2AC]/10 border border-[#38B2AC]/20 rounded-xl p-4">
                    <p className="text-sm text-[#4A5568] font-semibold mb-2">
                      📋 Formats supportés:
                    </p>
                    <ul className="text-sm text-[#718096] space-y-1">
                      <li>• <strong>Excel DQE</strong> (.xlsx) - Sélection d&apos;onglets + IA BTP</li>
                      <li>• <strong>Excel/CSV</strong> - Extraction déterministe</li>
                      <li>• <strong>PDF</strong> (.pdf) - Extraction IA</li>
                      <li>• <strong>Word</strong> (.doc, .docx) - Extraction IA</li>
                    </ul>
                  </div>
                )}
              </>
            )}

            {/* Mode standard - import classique */}
            {importMode === 'standard' && !isImporting && (
              <div className="text-center py-4">
                <p className="text-[#4A5568] mb-4">
                  Fichier: <strong>{importFile?.name}</strong>
                </p>
                <Button
                  onClick={() => {
                    setImportMode(null);
                    setImportFile(null);
                  }}
                  variant="outline"
                  className="mr-2"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleImportFile}
                  className="bg-gradient-to-r from-[#38B2AC] to-[#319795] hover:from-[#319795] hover:to-[#2C7A7B] text-white"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Lancer l&apos;import standard
                </Button>
              </div>
            )}

            {/* Progression import standard */}
            {isImporting && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 border-4 border-[#38B2AC]/20 border-t-[#38B2AC] rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-lg font-semibold text-[#4A5568] mb-2">
                    {importStatus}
                  </p>
                  <p className="text-sm text-[#718096]">
                    {importedCount} matériaux importés
                  </p>
                </div>

                <div className="w-full bg-[#E0E4FF] rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#38B2AC] to-[#319795] transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm font-semibold text-[#38B2AC]">
                  {importProgress}%
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            {!importMode && !isImporting && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsImportDialogOpen(false);
                    setImportFile(null);
                  }}
                >
                  Annuler
                </Button>
                {importFile && !importFile.name.match(/\.xlsx?$/i) && (
                  <Button
                    onClick={handleImportFile}
                    className="bg-gradient-to-r from-[#38B2AC] to-[#319795] hover:from-[#319795] hover:to-[#2C7A7B] text-white"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Importer
                  </Button>
                )}
              </>
            )}
            {isImporting && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsImporting(false);
                  setImportProgress(0);
                  setImportStatus('');
                  setImportedCount(0);
                  setImportMode(null);
                }}
              >
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de partage de projet */}
      <ShareProjectDialog
        projectId={projectId}
        projectName={project?.name || ''}
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        onSuccess={() => {
          toast.success("Collaborateur invité avec succès");
        }}
      />

      {/* Dialog de traitement des doublons */}
      <Dialog open={isDuplicatesDialogOpen} onOpenChange={setIsDuplicatesDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Merge className="h-5 w-5 text-[#ED8936]" />
              Traitement des doublons
            </DialogTitle>
            <DialogDescription>
              Fusionnez les matériaux identiques et additionnez leurs quantités
            </DialogDescription>
          </DialogHeader>
          <DuplicatesHandler
            projectId={projectId}
            materials={materials}
            onComplete={() => {
              setIsDuplicatesDialogOpen(false);
              loadMaterials();
              toast.success("Doublons fusionnés avec succès !");
            }}
            onCancel={() => setIsDuplicatesDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog des commentaires */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commentaires</DialogTitle>
            <DialogDescription>
              Discussion sur le matériau
            </DialogDescription>
          </DialogHeader>
          {commentsMaterialId && (
            <MaterialComments
              materialId={commentsMaterialId}
              materialName={commentsMaterialName}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition du projet */}
      <Dialog open={isEditProjectDialogOpen} onOpenChange={setIsEditProjectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#2D3748]">
              Éditer le projet
            </DialogTitle>
            <DialogDescription>
              Modifiez les informations de votre projet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-project-name" className="text-[#4A5568] font-semibold">
                Nom du projet *
              </Label>
              <Input
                id="edit-project-name"
                value={editProjectData.name}
                onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })}
                placeholder="Ex: Rénovation Maison"
                className="border-[#E0E4FF] focus:border-[#5B5FC7]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-project-url" className="text-[#4A5568] font-semibold">
                URL source (optionnel)
              </Label>
              <Input
                id="edit-project-url"
                value={editProjectData.sourceUrl}
                onChange={(e) => setEditProjectData({ ...editProjectData, sourceUrl: e.target.value })}
                placeholder="https://..."
                className="border-[#E0E4FF] focus:border-[#5B5FC7]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditProjectDialogOpen(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveProject}
              disabled={isSaving}
              className="bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#5B5FC7] text-white"
            >
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription className="text-[#4A5568]">
              Cette action est irréversible. Tous les prix et commentaires associés seront également supprimés.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">
                Supprimer TOUS les {materials.length} matériaux du projet ?
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMaterials}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer définitivement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>
    </div>
  );
}
