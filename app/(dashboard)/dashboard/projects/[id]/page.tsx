"use client";
// @ts-nocheck

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, FileText, Upload, Settings, Trash2, Edit, X, DollarSign, Image as ImageIcon, MessageSquare, BarChart3, Ship, Package, Users, UserCircle, History, TrendingUp, Shield, Send, Clock, CheckCircle2, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { createQuotationRequest } from "@/lib/quotation";
import { ShareProjectDialog } from "@/components/collaboration/ShareProjectDialog";
import { MaterialComments } from "@/components/collaboration/MaterialComments";
import { ProjectHistory } from "@/components/collaboration/ProjectHistory";
import { ImageUpload } from "@/components/project/ImageUpload";
import { MaterialsFilter } from "@/components/materials/MaterialsFilter";
import { AISuggestions } from "@/components/project/AISuggestions";
import { CategoryGroup } from "@/components/materials/CategoryGroup";
import { MaterialDetailModal } from "@/components/materials/MaterialDetailModal";
import { MaterialCard } from "@/components/materials/MaterialCard";
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
}

interface Material {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number | null;
  surface: number | null;
  weight: number | null;
  volume: number | null;
  specs: any;
  images?: string[];
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  
  // États pour l'édition
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // États pour l'ajout
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
  
  // États pour la gestion des prix
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [prices, setPrices] = useState<any[]>([]);
  const [pricesByMaterial, setPricesByMaterial] = useState<Record<string, any[]>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  
  // États pour l'ajout de prix
  const [isAddPriceDialogOpen, setIsAddPriceDialogOpen] = useState(false);
  const [newPrice, setNewPrice] = useState({
    country: '',
    supplier_name: '',
    contact_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    wechat: '',
    amount: '',
    currency: 'FCFA',
    notes: '',
    package_length: '',
    package_width: '',
    package_height: '',
    package_weight: '',
    units_per_package: '',
    variations: [] as any[],
  });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('new');
  
  // États pour les photos
  const [uploadedPhotos, setUploadedPhotos] = useState<Array<{file: File, preview: string}>>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // États pour l'édition de prix
  const [isEditPriceDialogOpen, setIsEditPriceDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<any>(null);
  
  // États pour la vue détaillée du matériau
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [detailMaterial, setDetailMaterial] = useState<Material | null>(null);

  // États pour l'import de fichier
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<string>('');
  const [importedCount, setImportedCount] = useState(0);

  // États pour la collaboration
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsMaterialId, setCommentsMaterialId] = useState<string | null>(null);
  const [commentsMaterialName, setCommentsMaterialName] = useState<string>('');

  // État pour la demande de cotation
  const [isCreatingQuotation, setIsCreatingQuotation] = useState(false);

  // États pour les suggestions IA (matériaux manquants)
  const [materialSuggestions, setMaterialSuggestions] = useState<Array<{
    name: string;
    category: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Ancien format pour compatibilité (à supprimer plus tard)
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    category: string;
    missingItems: Array<{ name: string; reason: string }>;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // États pour le drawer et les catégories
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDrawerMaterial, setSelectedDrawerMaterial] = useState<Material | null>(null);
  const [drawerPrices, setDrawerPrices] = useState<any[]>([]);
  const [drawerComments, setDrawerComments] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'categories' | 'list' | 'suggestions'>('categories');
  const [commentsByMaterial, setCommentsByMaterial] = useState<Record<string, any[]>>({});

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
  const [deleteMode, setDeleteMode] = useState<'all' | 'filtered'>('all');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProject();
    loadMaterials();
    loadAllPrices();
    checkPermissions();
  }, [params.id]);

  // Vérifier les permissions de l'utilisateur
  const checkPermissions = async () => {
    try {
      setIsLoadingPermissions(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
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
        .eq('id', params.id)
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
      const { data: collab } = await supabase
        .from('project_collaborators' as any)
        .select('role, status')
        .eq('project_id', params.id)
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .single();

      if (!collab) {
        setPermissions({
          canView: false,
          canEdit: false,
          canDelete: false,
          canManage: false,
          role: null,
        });
        return;
      }

      const role = collab.role as 'owner' | 'editor' | 'viewer';

      setPermissions({
        canView: true,
        canEdit: role === 'editor' || role === 'owner',
        canDelete: role === 'owner',
        canManage: role === 'owner',
        role: role,
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
      setPermissions({
        canView: false,
        canEdit: false,
        canDelete: false,
        canManage: false,
        role: null,
      });
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const loadProject = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Mock data pour le test
        const projectData = localStorage.getItem(`project_${params.id}`);
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
          id: params.id as string,
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
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error("Error loading project:", error);
        toast.error("Erreur lors du chargement du projet");
        router.push('/dashboard');
        return;
      }

      setProject(data as any);
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
        // Mode mock - pas de matériaux
        setIsLoadingMaterials(false);
        return;
      }

      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('project_id', params.id)
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
      if (!user) return;

      // Charger tous les matériaux du projet
      const { data: materialsData } = await supabase
        .from('materials')
        .select('id')
        .eq('project_id', params.id);

      if (!materialsData || materialsData.length === 0) return;

      const typedMaterials = materialsData as any[];
      const materialIds = typedMaterials.map(m => m.id);

      // Charger tous les prix
      const { data: pricesData } = await supabase
        .from('prices')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .in('material_id', materialIds);

      // Grouper les prix par matériau
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

  const handleSaveMaterial = async () => {
    if (!editingMaterial) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('materials')
        .update({
          name: editingMaterial.name,
          description: editingMaterial.description,
          category: editingMaterial.category,
          quantity: editingMaterial.quantity,
          surface: editingMaterial.surface,
          weight: editingMaterial.weight,
          volume: editingMaterial.volume,
          specs: editingMaterial.specs,
          images: editingMaterial.images || [],
        })
        .eq('id', editingMaterial.id);

      if (error) throw error;

      toast.success("Matériau mis à jour");
      setIsEditDialogOpen(false);
      setEditingMaterial(null);
      loadMaterials(); // Recharger la liste
    } catch (error) {
      console.error("Error updating material:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string, materialName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${materialName}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      toast.success("Matériau supprimé");
      loadMaterials(); // Recharger la liste
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Ouvrir le drawer avec un matériau
  const handleOpenDrawer = async (material: Material) => {
    setSelectedDrawerMaterial(material);
    setIsDrawerOpen(true);
    
    // Charger les prix et commentaires
    await Promise.all([
      loadDrawerPrices(material.id),
      loadDrawerComments(material.id),
    ]);
  };

  const loadDrawerPrices = async (materialId: string) => {
    try {
      const { data } = await supabase
        .from('prices')
        .select('*, supplier:suppliers(*)')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });
      setDrawerPrices(data || []);
    } catch (error) {
      console.error('Error loading prices:', error);
    }
  };

  const loadDrawerComments = async (materialId: string) => {
    try {
      const { data } = await (supabase as any)
        .from('material_comments')
        .select('*')
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });
      setDrawerComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Ajouter un prix depuis le drawer
  const handleAddPriceFromDrawer = async (priceData: any) => {
    if (!selectedDrawerMaterial) return;
    
    try {
      let supplierId = null;
      
      if (priceData.supplier_name) {
        const { data: supplierData } = await supabase
          .from('suppliers')
          .insert({
            name: priceData.supplier_name,
            country: priceData.country,
          })
          .select()
          .single();
        supplierId = supplierData?.id;
      }

      await supabase
        .from('prices')
        .insert({
          material_id: selectedDrawerMaterial.id,
          supplier_id: supplierId,
          amount: parseFloat(priceData.amount),
          currency: priceData.currency,
          country: priceData.country,
          notes: priceData.notes,
        });

      toast.success('Prix ajouté');
      await loadDrawerPrices(selectedDrawerMaterial.id);
      await loadAllPrices();
    } catch (error) {
      console.error('Error adding price:', error);
      toast.error("Erreur lors de l'ajout du prix");
    }
  };

  // Ajouter un commentaire depuis le drawer
  const handleAddCommentFromDrawer = async (content: string) => {
    if (!selectedDrawerMaterial) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await (supabase as any)
        .from('material_comments')
        .insert({
          material_id: selectedDrawerMaterial.id,
          user_id: user?.id,
          content,
          user_name: user?.email?.split('@')[0] || 'Utilisateur',
        });

      toast.success('Note ajoutée');
      await loadDrawerComments(selectedDrawerMaterial.id);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error("Erreur lors de l'ajout de la note");
    }
  };

  // Renommer une catégorie
  const handleCategoryRename = async (oldName: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({ category: newName })
        .eq('project_id', params.id)
        .eq('category', oldName);

      if (error) throw error;
      
      toast.success(`Catégorie renommée en "${newName}"`);
      loadMaterials();
    } catch (error) {
      console.error('Error renaming category:', error);
      toast.error('Erreur lors du renommage');
    }
  };

  // Toggle une catégorie
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Expand/Collapse toutes les catégories
  const expandAllCategories = () => {
    const allCategories = [...new Set(filteredMaterials.map(m => m.category || 'Sans catégorie'))];
    setExpandedCategories(new Set(allCategories));
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

  // Grouper les matériaux par catégorie
  const materialsByCategory = filteredMaterials.reduce((acc, material) => {
    const category = material.category || 'Sans catégorie';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  // Trier les catégories par nombre d'éléments
  const sortedCategories = Object.keys(materialsByCategory).sort((a, b) => {
    if (a === 'Sans catégorie') return 1;
    if (b === 'Sans catégorie') return -1;
    return materialsByCategory[b].length - materialsByCategory[a].length;
  });

  const handleImportFile = async () => {
    if (!importFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setIsImporting(true);
      setImportProgress(10);
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
        project_id: params.id,
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
        .update({ mapping_status: 'completed' })
        .eq('id', params.id);

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
          project_id: params.id,
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
      loadMaterials(); // Recharger la liste
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setIsSaving(false);
    }
  };

  // Fonction de suppression en masse des matériaux
  const handleDeleteMaterials = async (mode: 'all' | 'filtered') => {
    try {
      setIsDeleting(true);
      
      const materialsToDelete = mode === 'all' ? materials : filteredMaterials;
      const materialIds = materialsToDelete.map(m => m.id);
      
      if (materialIds.length === 0) {
        toast.error('Aucun matériau à supprimer');
        return;
      }

      // Supprimer d'abord les prix associés
      const { error: pricesError } = await supabase
        .from('prices')
        .delete()
        .in('material_id', materialIds);
      
      if (pricesError) {
        console.error('Error deleting prices:', pricesError);
      }

      // Supprimer les commentaires associés
      const { error: commentsError } = await supabase
        .from('material_comments')
        .delete()
        .in('material_id', materialIds);
      
      if (commentsError) {
        console.error('Error deleting comments:', commentsError);
      }

      // Supprimer les matériaux
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

  // Fonctions pour les suggestions IA
  const handleAcceptSuggestion = async (suggestion: { name: string; category: string; reason: string; priority: string }) => {
    try {
      // Insérer le matériau suggéré dans la base de données
      const { error } = await supabase
        .from('materials')
        .insert({
          project_id: params.id,
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

      // Retirer la suggestion de la liste
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

  // Fonction pour régénérer les suggestions
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

  // Fonctions de gestion des prix
  const loadPrices = async (materialId: string) => {
    try {
      setIsLoadingPrices(true);
      
      // Charger les prix avec les fournisseurs
      const { data: pricesData, error: pricesError } = await supabase
        .from('prices')
        .select(`
          *,
          supplier:suppliers(*)
        `)
        .eq('material_id', materialId)
        .order('created_at', { ascending: false });

      if (pricesError) throw pricesError;
      
      // Charger les photos pour chaque prix
      if (pricesData && pricesData.length > 0) {
        const priceIds = pricesData.map(p => p.id);
        const { data: photosData } = await supabase
          .from('photos')
          .select('*')
          .in('price_id', priceIds);

        // Associer les photos aux prix
        const pricesWithPhotos = pricesData.map(price => ({
          ...price,
          photos: photosData?.filter(photo => photo.price_id === price.id) || []
        }));

        setPrices(pricesWithPhotos);
      } else {
        setPrices(pricesData || []);
      }
    } catch (error) {
      console.error("Error loading prices:", error);
      toast.error("Erreur lors du chargement des prix");
    } finally {
      setIsLoadingPrices(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      // Récupérer tous les IDs de matériaux du projet
      const { data: projectMaterials, error: materialsError } = await supabase
        .from('materials')
        .select('id')
        .eq('project_id', params.id);

      if (materialsError) throw materialsError;

      const materialIds = projectMaterials?.map(m => m.id) || [];

      if (materialIds.length === 0) {
        setSuppliers([]);
        return;
      }

      // Récupérer les fournisseurs qui ont des prix pour les matériaux de ce projet
      const { data: prices, error: pricesError } = await supabase
        .from('prices')
        .select('supplier_id')
        .in('material_id', materialIds)
        .not('supplier_id', 'is', null);

      if (pricesError) throw pricesError;

      // Extraire les IDs uniques des fournisseurs
      const supplierIds = [...new Set(prices?.map(p => p.supplier_id).filter(Boolean))];

      if (supplierIds.length === 0) {
        setSuppliers([]);
        return;
      }

      // Charger les détails des fournisseurs
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .in('id', supplierIds)
        .order('name', { ascending: true });

      if (error) throw error;
      
      setSuppliers(data || []);
    } catch (error) {
      console.error("Error loading suppliers:", error);
    }
  };

  const handleOpenPriceDialog = async (material: Material) => {
    setSelectedMaterial(material);
    setIsPriceDialogOpen(true);
    await loadPrices(material.id);
    await loadSuppliers();
  };

  const handleOpenDetailView = async (material: Material) => {
    setDetailMaterial(material);
    setIsDetailViewOpen(true);
    await loadPrices(material.id);
  };

  const handleAddPrice = async () => {
    if (!selectedMaterial || !newPrice.amount || !newPrice.country) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    try {
      setIsSaving(true);

      let supplierId = null;

      // Créer un nouveau fournisseur si nécessaire
      if (selectedSupplier === 'new' && newPrice.supplier_name) {
        const { data: supplierData, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            name: newPrice.supplier_name,
            country: newPrice.country,
            contact_name: newPrice.contact_name,
            phone: newPrice.phone,
            whatsapp: newPrice.whatsapp,
            email: newPrice.email,
            wechat: newPrice.wechat,
          })
          .select()
          .single();

        if (supplierError) throw supplierError;
        supplierId = supplierData.id;
      } else if (selectedSupplier !== 'new') {
        supplierId = selectedSupplier;
      }

      // Calculer le montant converti en FCFA
      let convertedAmount = parseFloat(newPrice.amount);
      if (newPrice.currency !== 'FCFA') {
        const { data: rateData } = await supabase
          .from('exchange_rates')
          .select('rate')
          .eq('from_currency', newPrice.currency)
          .eq('to_currency', 'FCFA')
          .single();

        if (rateData) {
          convertedAmount = parseFloat(newPrice.amount) * rateData.rate;
        }
      }

      // Ajouter le prix
      const { data: priceData, error: priceError } = await supabase
        .from('prices')
        .insert({
          material_id: selectedMaterial.id,
          supplier_id: supplierId,
          country: newPrice.country,
          amount: parseFloat(newPrice.amount),
          currency: newPrice.currency,
          converted_amount: convertedAmount,
          notes: newPrice.notes,
          variations: newPrice.variations && newPrice.variations.length > 0 ? newPrice.variations : null,
        })
        .select()
        .single();

      if (priceError) throw priceError;

      // Upload et sauvegarde des photos
      if (uploadedPhotos.length > 0 && priceData) {
        const photoUrls = await uploadPhotosToStorage(priceData.id);
        await savePhotosToDatabase(priceData.id, photoUrls);
      }

      toast.success("Prix ajouté avec succès");
      setIsAddPriceDialogOpen(false);
      
      // Réinitialiser le formulaire
      setNewPrice({
        country: '',
        supplier_name: '',
        contact_name: '',
        phone: '',
        whatsapp: '',
        email: '',
        wechat: '',
        amount: '',
        currency: 'FCFA',
        notes: '',
        package_length: '',
        package_width: '',
        package_height: '',
        package_weight: '',
        units_per_package: '',
        variations: [],
      });
      setSelectedSupplier('new');
      setUploadedPhotos([]);
      
      // Recharger les prix
      await loadPrices(selectedMaterial.id);
    } catch (error) {
      console.error("Error adding price:", error);
      toast.error("Erreur lors de l'ajout du prix");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPrice = (price: any) => {
    setEditingPrice(price);
    setIsEditPriceDialogOpen(true);
  };

  const handleUpdatePrice = async () => {
    if (!editingPrice || !editingPrice.amount || !editingPrice.country) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    if (!editingPrice.id) {
      console.error("Missing price ID:", editingPrice);
      toast.error("ID du prix manquant");
      return;
    }

    try {
      setIsSaving(true);

      // Calculer le montant converti en FCFA
      let convertedAmount = parseFloat(editingPrice.amount);
      if (editingPrice.currency !== 'FCFA') {
        const { data: rateData, error: rateError } = await supabase
          .from('exchange_rates')
          .select('rate')
          .eq('from_currency', editingPrice.currency)
          .eq('to_currency', 'FCFA')
          .single();

        if (rateError) {
          console.error("Exchange rate error:", rateError);
          toast.error(`Taux de change non trouvé pour ${editingPrice.currency}. Veuillez configurer le taux dans Admin > Taux de Change.`);
          setIsSaving(false);
          return;
        } else if (rateData) {
          convertedAmount = parseFloat(editingPrice.amount) * rateData.rate;
        }
      }

      // Synchroniser le fournisseur avec les modifications du prix
      // Cela garantit la cohérence des données entre prix et fournisseur
      if (editingPrice.supplier && editingPrice.supplier.id) {
        const supplierUpdates: any = {};
        
        // Mettre à jour le pays du fournisseur si changé
        if (editingPrice.supplier.country !== editingPrice.country) {
          supplierUpdates.country = editingPrice.country;
        }
        
        // Si des mises à jour sont nécessaires, les appliquer
        if (Object.keys(supplierUpdates).length > 0) {
          const { error: supplierError } = await supabase
            .from('suppliers')
            .update(supplierUpdates)
            .eq('id', editingPrice.supplier.id);

          if (supplierError) {
            console.error("Supplier sync error:", supplierError);
            // Ne pas bloquer la mise à jour du prix si la sync fournisseur échoue
            toast.warning("Prix mis à jour mais synchronisation fournisseur échouée");
          }
        }
      }

      // Mettre à jour le prix
      const { error: updateError } = await supabase
        .from('prices')
        .update({
          country: editingPrice.country,
          amount: parseFloat(editingPrice.amount),
          currency: editingPrice.currency,
          converted_amount: convertedAmount,
          notes: editingPrice.notes || null,
        })
        .eq('id', editingPrice.id);

      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }

      // Upload et sauvegarde des nouvelles photos
      if (uploadedPhotos.length > 0) {
        try {
          const photoUrls = await uploadPhotosToStorage(editingPrice.id);
          await savePhotosToDatabase(editingPrice.id, photoUrls);
        } catch (photoError) {
          console.error("Photo upload error:", photoError);
          // Ne pas bloquer la mise à jour si les photos échouent
          toast.warning("Prix mis à jour mais erreur lors de l'upload des photos");
        }
      }

      toast.success("Prix mis à jour avec succès");
      setIsEditPriceDialogOpen(false);
      setEditingPrice(null);
      setUploadedPhotos([]);
      
      if (selectedMaterial) {
        await loadPrices(selectedMaterial.id);
      }
    } catch (error: any) {
      console.error("Error updating price:", error);
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePrice = async (priceId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce prix ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('prices')
        .delete()
        .eq('id', priceId);

      if (error) throw error;

      toast.success("Prix supprimé");
      
      if (selectedMaterial) {
        await loadPrices(selectedMaterial.id);
      }
    } catch (error) {
      console.error("Error deleting price:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Fonction pour créer une demande de cotation
  const handleCreateQuotation = async () => {
    if (!project) return;

    // Vérifier qu'il y a des matériaux
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

  // Fonctions de gestion des photos
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: Array<{file: File, preview: string}> = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 5MB)`);
        continue;
      }

      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} n'est pas une image`);
        continue;
      }

      // Créer un aperçu
      const preview = URL.createObjectURL(file);
      newPhotos.push({ file, preview });
    }

    setUploadedPhotos(prev => [...prev, ...newPhotos]);
    toast.success(`${newPhotos.length} photo(s) ajoutée(s)`);
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const uploadPhotosToStorage = async (priceId: number) => {
    if (uploadedPhotos.length === 0) return [];

    try {
      setIsUploading(true);
      const photoUrls: string[] = [];

      for (const photo of uploadedPhotos) {
        // Utiliser l'API route pour uploader (contourne RLS)
        const formData = new FormData();
        formData.append('file', photo.file);
        formData.append('userId', user?.id || '');
        formData.append('bucket', 'project-images');

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        photoUrls.push(data.publicUrl);
      }

      return photoUrls;
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Erreur lors de l\'upload des photos');
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const savePhotosToDatabase = async (priceId: number, photoUrls: string[]) => {
    if (photoUrls.length === 0) return;

    try {
      const photosData = photoUrls.map(url => ({
        price_id: priceId,
        url: url,
      }));

      const { error } = await supabase
        .from('photos')
        .insert(photosData);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving photos:', error);
      toast.error('Erreur lors de la sauvegarde des photos');
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', params.id);

      if (error) throw error;

      toast.success("Projet supprimé");
      router.push('/dashboard');
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de la suppression");
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
        .eq('id', params.id);

      if (error) throw error;

      toast.success("Projet mis à jour");
      setIsEditProjectDialogOpen(false);
      loadProject(); // Recharger le projet
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
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

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Projet non trouvé</p>
        <Link href="/dashboard">
          <Button className="mt-4">Retour au dashboard</Button>
        </Link>
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
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FF] to-[#E8EEFF] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header moderne */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button 
                variant="ghost" 
                size="icon"
                className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all border-0"
              >
                <ArrowLeft className="h-5 w-5 text-[#5B5FC7]" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] bg-clip-text text-transparent">
                {project.name}
              </h1>
              <p className="text-[#718096] mt-1">
                Créé le {new Date(project.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Badge de rôle */}
            {permissions.role && (
              <Badge 
                variant="outline"
                className={
                  permissions.role === 'owner'
                    ? 'border-purple-300 text-purple-700 bg-purple-50'
                    : permissions.role === 'editor'
                    ? 'border-green-300 text-green-700 bg-green-50'
                    : 'border-blue-300 text-blue-700 bg-blue-50'
                }
              >
                {permissions.role === 'owner' ? '👑 Propriétaire' :
                 permissions.role === 'editor' ? '✏️ Éditeur' : '👁️ Lecteur'}
              </Badge>
            )}
            
            {/* Bouton Demander une cotation */}
            {permissions.canManage && materials.length > 0 && (
              <Button 
                onClick={handleCreateQuotation}
                disabled={isCreatingQuotation}
                className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all rounded-xl"
              >
                {isCreatingQuotation ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Demander une cotation
                  </>
                )}
              </Button>
            )}
            
            {permissions.canManage && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsShareDialogOpen(true)}
                className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#5B5FC7] hover:text-white transition-all"
                title="Partager le projet"
              >
                <Users className="h-5 w-5" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
              className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#5B5FC7] hover:text-white transition-all"
              title="Historique du projet"
            >
              <History className="h-5 w-5" />
            </Button>
            {permissions.canManage && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleOpenEditProject}
                className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#5B5FC7] hover:text-white transition-all"
                title="Éditer le projet"
              >
                <Settings className="h-5 w-5" />
              </Button>
            )}
            {permissions.canDelete && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleDelete}
                className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 border-[#E0E4FF] hover:border-red-500 hover:bg-red-500 hover:text-white transition-all"
                title="Supprimer le projet"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>


      {/* Actions rapides - Style moderne */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <Link href={`/dashboard/projects/${params.id}/comparison`}>
              <Button className="w-full bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#6B6FD7] text-white shadow-lg shadow-[#5B5FC7]/30 rounded-xl py-6 font-semibold transition-all hover:scale-105">
                <BarChart3 className="mr-2 h-5 w-5 text-white" />
                <span className="text-white font-semibold">Voir</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

      </div>

      {/* Section Matériaux - Style moderne */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-[#5B5FC7] via-[#7B7FE8] to-[#FF9B7B]" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#5B5FC7]/10 to-[#FF9B7B]/10 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#5B5FC7]" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-[#4A5568]">Matériaux</CardTitle>
                <CardDescription className="text-[#718096]">
                  Liste des équipements à comparer
                </CardDescription>
              </div>
            </div>
            {materials.length > 0 && (
              <Button 
                size="sm" 
                onClick={handleAddMaterial}
                className="bg-gradient-to-r from-[#48BB78] to-[#38A169] hover:from-[#38A169] hover:to-[#2F855A] text-white shadow-lg shadow-[#48BB78]/30 rounded-xl transition-all hover:scale-105"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingMaterials ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-[#5B5FC7]/20 border-t-[#5B5FC7] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#718096] font-medium">Chargement des matériaux...</p>
            </div>
          ) : materials.length > 0 ? (
            <div className="space-y-6">
              {/* Filtrage et Recherche Dynamique */}
              <MaterialsFilter 
                materials={materials}
                onFilteredChange={setFilteredMaterials}
                showPriceSort={true}
              />

              {/* Suggestions IA d'oublis potentiels */}
              {showSuggestions && aiSuggestions.length > 0 && (
                <AISuggestions
                  suggestions={aiSuggestions}
                  onAcceptSuggestion={async (item, category) => {
                    // Ajouter l'élément suggéré comme nouveau matériau
                    try {
                      const { error } = await supabase
                        .from('materials')
                        .insert({
                          project_id: params.id,
                          name: item.name,
                          category: category,
                          description: item.reason,
                          quantity: null,
                          specs: { suggested_by_ai: true },
                        });
                      
                      if (error) throw error;
                      toast.success(`"${item.name}" ajouté à la liste`);
                      loadMaterials();
                    } catch (error) {
                      console.error('Error adding suggested item:', error);
                      toast.error("Erreur lors de l'ajout");
                    }
                  }}
                  onDismissSuggestion={(item, category) => {
                    // Retirer la suggestion de la liste
                    setAiSuggestions(prev => 
                      prev.map(s => 
                        s.category === category
                          ? { ...s, missingItems: s.missingItems.filter(i => i.name !== item.name) }
                          : s
                      ).filter(s => s.missingItems.length > 0)
                    );
                  }}
                  onDismissAll={() => {
                    setAiSuggestions([]);
                    setShowSuggestions(false);
                  }}
                />
              )}
              
              {/* Toggle vue catégories / liste / suggestions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'categories' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('categories')}
                    className={viewMode === 'categories' ? 'bg-violet-600 hover:bg-violet-700' : ''}
                  >
                    Par catégorie
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-violet-600 hover:bg-violet-700' : ''}
                  >
                    Liste
                  </Button>
                  <Button
                    variant={viewMode === 'suggestions' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('suggestions')}
                    className={viewMode === 'suggestions' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}
                  >
                    <Sparkles className="h-4 w-4 mr-1" />
                    Suggestions
                    {materialSuggestions.length > 0 && (
                      <Badge className="ml-1 bg-blue-500 text-white text-xs px-1.5">
                        {materialSuggestions.length}
                      </Badge>
                    )}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {viewMode === 'categories' && (
                    <>
                      <Button variant="ghost" size="sm" onClick={expandAllCategories}>
                        Tout ouvrir
                      </Button>
                      <Button variant="ghost" size="sm" onClick={collapseAllCategories}>
                        Tout fermer
                      </Button>
                    </>
                  )}
                  {/* Bouton de suppression */}
                  {permissions.canDelete && materials.length > 0 && viewMode !== 'suggestions' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      onClick={() => {
                        setDeleteMode(filteredMaterials.length < materials.length ? 'filtered' : 'all');
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer {filteredMaterials.length < materials.length 
                        ? `(${filteredMaterials.length} filtrés)` 
                        : `tout (${materials.length})`}
                    </Button>
                  )}
                </div>
              </div>

              {/* Vue par catégories */}
              {viewMode === 'categories' && (
                <div className="space-y-3">
                  {sortedCategories.map((category) => (
                    <CategoryGroup
                      key={category}
                      category={category}
                      materials={materialsByCategory[category]}
                      pricesByMaterial={pricesByMaterial}
                      commentsByMaterial={commentsByMaterial}
                      isExpanded={expandedCategories.has(category)}
                      onToggle={() => toggleCategory(category)}
                      onMaterialClick={handleOpenDrawer}
                      onCategoryRename={handleCategoryRename}
                    />
                  ))}
                </div>
              )}

              {/* Vue liste simple */}
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {filteredMaterials.map((material) => (
                    <MaterialCard
                      key={material.id}
                      material={material}
                      pricesCount={pricesByMaterial[material.id]?.length || 0}
                      commentsCount={commentsByMaterial[material.id]?.length || 0}
                      onClick={() => handleOpenDrawer(material)}
                    />
                  ))}
                </div>
              )}

              {/* Vue Suggestions IA */}
              {viewMode === 'suggestions' && (
                <div className="space-y-6">
                  {/* Header avec bouton de génération */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                          <Sparkles className="h-7 w-7 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-blue-900">
                            Suggestions IA
                          </h3>
                          <p className="text-sm text-blue-600">
                            L'IA analyse votre liste et suggère les matériaux potentiellement manquants
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleRegenerateSuggestions}
                        disabled={isLoadingSuggestions || materials.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isLoadingSuggestions ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            Analyse en cours...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            {materialSuggestions.length > 0 ? 'Régénérer' : 'Générer des suggestions'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Liste des suggestions */}
                  {materialSuggestions.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          {materialSuggestions.length} suggestion{materialSuggestions.length > 1 ? 's' : ''} trouvée{materialSuggestions.length > 1 ? 's' : ''}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDismissAllSuggestions}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Tout ignorer
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {materialSuggestions.map((suggestion, index) => (
                          <div
                            key={`suggestion-${index}`}
                            className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-blue-900">{suggestion.name}</span>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    suggestion.priority === 'high' 
                                      ? 'border-red-300 text-red-700 bg-red-50' 
                                      : suggestion.priority === 'medium'
                                      ? 'border-orange-300 text-orange-700 bg-orange-50'
                                      : 'border-gray-300 text-gray-600 bg-gray-50'
                                  }`}
                                >
                                  {suggestion.priority === 'high' ? '⚠️ Important' : suggestion.priority === 'medium' ? '📌 Recommandé' : '💡 Optionnel'}
                                </Badge>
                                <Badge variant="outline" className="text-xs border-blue-300 text-blue-600">
                                  {suggestion.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-blue-700">{suggestion.reason}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptSuggestion(suggestion)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Ajouter
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRejectSuggestion(suggestion.name)}
                                className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* État vide */
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-600 mb-2">
                        Aucune suggestion pour le moment
                      </h4>
                      <p className="text-sm text-gray-500 mb-4">
                        {materials.length === 0 
                          ? "Ajoutez d'abord des matériaux à votre projet"
                          : "Cliquez sur le bouton ci-dessus pour générer des suggestions"
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Material Detail Modal */}
              <MaterialDetailModal
                material={selectedDrawerMaterial}
                isOpen={isDrawerOpen}
                onClose={() => {
                  setIsDrawerOpen(false);
                  setSelectedDrawerMaterial(null);
                }}
                prices={drawerPrices}
                comments={drawerComments}
                onSave={async (updatedMaterial) => {
                  if (!updatedMaterial.id) return;
                  try {
                    const { error } = await supabase
                      .from('materials')
                      .update({
                        name: updatedMaterial.name,
                        description: updatedMaterial.description,
                        category: updatedMaterial.category,
                        quantity: updatedMaterial.quantity,
                        // surface: updatedMaterial.surface,
                        // weight: updatedMaterial.weight,
                        // volume: updatedMaterial.volume,
                      })
                      .eq('id', updatedMaterial.id);
                    
                    if (error) throw error;
                    toast.success('Matériau mis à jour');
                    loadMaterials();
                    // Mettre à jour le matériau sélectionné
                    if (selectedDrawerMaterial) {
                      setSelectedDrawerMaterial({
                        ...selectedDrawerMaterial,
                        ...updatedMaterial,
                      } as any);
                    }
                  } catch (error) {
                    console.error('Error updating material:', error);
                    toast.error('Erreur lors de la mise à jour');
                  }
                }}
                onDelete={() => {
                  if (selectedDrawerMaterial) {
                    handleDeleteMaterial(selectedDrawerMaterial.id, selectedDrawerMaterial.name);
                    setIsDrawerOpen(false);
                  }
                }}
                onAddPrice={handleAddPriceFromDrawer}
                onDeletePrice={async (priceId) => {
                  try {
                    const { error } = await supabase
                      .from('prices')
                      .delete()
                      .eq('id', priceId);
                    
                    if (error) throw error;
                    toast.success('Prix supprimé');
                    if (selectedDrawerMaterial) {
                      await loadDrawerPrices(selectedDrawerMaterial.id);
                    }
                    await loadAllPrices();
                  } catch (error) {
                    console.error('Error deleting price:', error);
                    toast.error('Erreur lors de la suppression');
                  }
                }}
                onAddComment={handleAddCommentFromDrawer}
                onUploadImage={async (file: File) => {
                  if (!selectedDrawerMaterial) return null;
                  try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${selectedDrawerMaterial.id}/${Date.now()}.${fileExt}`;
                    
                    const { error: uploadError } = await supabase.storage
                      .from('project-materials')
                      .upload(fileName, file);
                    
                    if (uploadError) throw uploadError;
                    
                    const { data: { publicUrl } } = supabase.storage
                      .from('project-materials')
                      .getPublicUrl(fileName);
                    
                    // Mettre à jour les images du matériau
                    const currentImages = selectedDrawerMaterial.images || [];
                    const { error: updateError } = await supabase
                      .from('materials')
                      .update({ 
                        specs: { 
                          ...selectedDrawerMaterial.specs,
                          images: [...currentImages, publicUrl]
                        }
                      })
                      .eq('id', selectedDrawerMaterial.id);
                    
                    if (updateError) throw updateError;
                    
                    toast.success('Photo ajoutée');
                    loadMaterials();
                    return publicUrl;
                  } catch (error) {
                    console.error('Error uploading image:', error);
                    toast.error("Erreur lors de l'upload");
                    return null;
                  }
                }}
              />
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5B5FC7]/10 to-[#FF9B7B]/10">
                <FileText className="h-10 w-10 text-[#5B5FC7]" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-[#4A5568]">Aucun matériau</h3>
              <p className="mb-8 text-[#718096] max-w-md mx-auto">
                {permissions.canEdit 
                  ? "Commencez par ajouter des matériaux à ce projet pour comparer les prix"
                  : "Ce projet ne contient pas encore de matériaux"}
              </p>
              {permissions.canEdit && (
                <Button 
                  onClick={handleAddMaterial}
                  className="bg-gradient-to-r from-[#48BB78] to-[#38A169] hover:from-[#38A169] hover:to-[#2F855A] text-white shadow-lg shadow-[#48BB78]/30 rounded-xl px-8 py-6 text-lg transition-all hover:scale-105"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Ajouter un matériau
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
          <ProjectHistory projectId={params.id as string} />
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
                {String(params.id).startsWith('mock-') && (
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
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] border-0 bg-white/95 backdrop-blur-sm shadow-2xl overflow-hidden flex flex-col">
          <div className="h-2 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] absolute top-0 left-0 right-0 rounded-t-lg" />
          <DialogHeader className="pt-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-[#5B5FC7]/10 to-[#7B7FE8]/10 rounded-xl flex items-center justify-center">
                <Edit className="h-5 w-5 text-[#5B5FC7]" />
              </div>
              Éditer le matériau
            </DialogTitle>
            <DialogDescription className="text-[#718096]">
              Modifiez les informations du matériau
            </DialogDescription>
          </DialogHeader>
          
          {editingMaterial && (
            <div className="grid gap-4 py-4 overflow-y-auto flex-1 px-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={editingMaterial.name}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                  placeholder="Nom du matériau"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingMaterial.description || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value || null })}
                  placeholder="Spécifications, caractéristiques, notes..."
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Catégorie</Label>
                <Input
                  id="category"
                  value={editingMaterial.category || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, category: e.target.value })}
                  placeholder="Ex: Matériaux de base, Ferraillage..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantité</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={editingMaterial.quantity || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, quantity: parseFloat(e.target.value) || null })}
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="surface">Surface (m²)</Label>
                  <Input
                    id="surface"
                    type="number"
                    value={editingMaterial.surface || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, surface: parseFloat(e.target.value) || null })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="weight">Poids (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={editingMaterial.weight || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, weight: parseFloat(e.target.value) || null })}
                    placeholder="0"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="volume">Volume (m³)</Label>
                  <Input
                    id="volume"
                    type="number"
                    value={editingMaterial.volume || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, volume: parseFloat(e.target.value) || null })}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Images Upload */}
              <div className="space-y-2">
                <Label>Images</Label>
                <ImageUpload
                  images={editingMaterial.images || []}
                  onImagesChange={(images) => setEditingMaterial({ ...editingMaterial, images })}
                  maxImages={5}
                  bucket="project-materials"
                  path={params.id}
                />
              </div>

            </div>
          )}

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingMaterial(null);
              }}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button onClick={handleSaveMaterial} disabled={isSaving || !editingMaterial?.name}>
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                path={params.id}
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

      {/* Modal Gérer les Prix */}
      <Dialog open={isPriceDialogOpen} onOpenChange={setIsPriceDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Prix - {selectedMaterial?.name}
            </DialogTitle>
            <DialogDescription>
              Gérez les prix de ce matériau par pays et fournisseur
            </DialogDescription>
          </DialogHeader>

          {isLoadingPrices ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : prices.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(
                prices.reduce((acc: any, price: any) => {
                  if (!acc[price.country]) acc[price.country] = [];
                  acc[price.country].push(price);
                  return acc;
                }, {})
              ).map(([country, countryPrices]: [string, any]) => (
                <div key={country} className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {country === 'Cameroun' && '📍'}
                    {country === 'Chine' && '🇨🇳'}
                    {country}
                  </h3>
                  
                  {countryPrices.map((price: any) => (
                    <Card key={price.id} className="p-4">
                      <div className="space-y-3">
                        {price.supplier && (
                          <div>
                            <p className="font-medium">{price.supplier.name}</p>
                            {price.supplier.contact_name && (
                              <p className="text-sm text-gray-600">
                                Contact: {price.supplier.contact_name}
                              </p>
                            )}
                            <div className="flex gap-3 mt-1 text-sm text-gray-600">
                              {price.supplier.phone && (
                                <span>📞 {price.supplier.phone}</span>
                              )}
                              {price.supplier.whatsapp && (
                                <span>💬 {price.supplier.whatsapp}</span>
                              )}
                              {price.supplier.wechat && (
                                <span>WeChat: {price.supplier.wechat}</span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-green-600">
                            {price.amount.toLocaleString()} {price.currency}
                          </span>
                          {price.currency !== 'FCFA' && price.converted_amount && (
                            <span className="text-sm text-gray-600">
                              (≈ {Math.round(price.converted_amount).toLocaleString()} FCFA)
                            </span>
                          )}
                        </div>

                        {country === 'Chine' && price.converted_amount && (
                          (() => {
                            const localPrice = prices.find(p => p.country === 'Cameroun');
                            if (localPrice && localPrice.converted_amount) {
                              const savings = localPrice.converted_amount - price.converted_amount;
                              const percentage = (savings / localPrice.converted_amount * 100).toFixed(0);
                              return savings > 0 ? (
                                <div className="text-sm font-medium text-green-600">
                                  💰 Économie: {Math.round(savings).toLocaleString()} FCFA ({percentage}%)
                                </div>
                              ) : null;
                            }
                            return null;
                          })()
                        )}

                        {price.notes && (
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-sm font-medium mb-1">📝 Notes:</p>
                            <p className="text-sm text-gray-700 whitespace-pre-line">
                              {price.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPrice(price)}
                            title="Éditer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePrice(price.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Aucun prix ajouté pour ce matériau</p>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button
              onClick={() => setIsAddPriceDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un Prix
            </Button>
            <Button variant="outline" onClick={() => setIsPriceDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ajouter un Prix */}
      <Dialog open={isAddPriceDialogOpen} onOpenChange={setIsAddPriceDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un Prix</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau prix pour {selectedMaterial?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="country">Pays *</Label>
              <select
                id="country"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                value={newPrice.country}
                onChange={(e) => {
                  const country = e.target.value;
                  // Auto-sélection de la devise selon le pays
                  if (country === 'Chine') {
                    setNewPrice({ ...newPrice, country, currency: 'CNY' });
                  } else if (['Cameroun', 'Sénégal', 'Côte d\'Ivoire', 'Mali', 'Burkina Faso', 'Niger', 'Togo', 'Bénin', 'Guinée-Bissau', 'Centrafrique', 'Congo', 'Gabon', 'Tchad', 'Guinée équatoriale'].includes(country)) {
                    setNewPrice({ ...newPrice, country, currency: 'FCFA' });
                  } else if (country === 'Turquie') {
                    setNewPrice({ ...newPrice, country, currency: 'TRY' });
                  } else if (country === 'Dubai') {
                    setNewPrice({ ...newPrice, country, currency: 'AED' });
                  } else {
                    setNewPrice({ ...newPrice, country });
                  }
                }}
              >
                <option value="">Sélectionner un pays</option>
                <optgroup label="Afrique">
                  <option value="Afrique du Sud">🇿🇦 Afrique du Sud</option>
                  <option value="Algérie">🇩🇿 Algérie</option>
                  <option value="Angola">🇦🇴 Angola</option>
                  <option value="Bénin">🇧🇯 Bénin</option>
                  <option value="Botswana">🇧🇼 Botswana</option>
                  <option value="Burkina Faso">🇧🇫 Burkina Faso</option>
                  <option value="Burundi">🇧🇮 Burundi</option>
                  <option value="Cameroun">🇨🇲 Cameroun</option>
                  <option value="Cap-Vert">🇨🇻 Cap-Vert</option>
                  <option value="Centrafrique">🇨🇫 Centrafrique</option>
                  <option value="Comores">🇰🇲 Comores</option>
                  <option value="Congo">🇨🇬 Congo</option>
                  <option value="Congo (RDC)">🇨🇩 Congo (RDC)</option>
                  <option value="Côte d'Ivoire">🇨🇮 Côte d'Ivoire</option>
                  <option value="Djibouti">🇩🇯 Djibouti</option>
                  <option value="Égypte">🇪🇬 Égypte</option>
                  <option value="Érythrée">🇪🇷 Érythrée</option>
                  <option value="Eswatini">🇸🇿 Eswatini</option>
                  <option value="Éthiopie">🇪🇹 Éthiopie</option>
                  <option value="Gabon">🇬🇦 Gabon</option>
                  <option value="Gambie">🇬🇲 Gambie</option>
                  <option value="Ghana">🇬🇭 Ghana</option>
                  <option value="Guinée">🇬🇳 Guinée</option>
                  <option value="Guinée-Bissau">🇬🇼 Guinée-Bissau</option>
                  <option value="Guinée équatoriale">🇬🇶 Guinée équatoriale</option>
                  <option value="Kenya">🇰🇪 Kenya</option>
                  <option value="Lesotho">🇱🇸 Lesotho</option>
                  <option value="Liberia">🇱🇷 Liberia</option>
                  <option value="Libye">🇱🇾 Libye</option>
                  <option value="Madagascar">🇲🇬 Madagascar</option>
                  <option value="Malawi">🇲🇼 Malawi</option>
                  <option value="Mali">🇲🇱 Mali</option>
                  <option value="Maroc">🇲🇦 Maroc</option>
                  <option value="Maurice">🇲🇺 Maurice</option>
                  <option value="Mauritanie">🇲🇷 Mauritanie</option>
                  <option value="Mozambique">🇲🇿 Mozambique</option>
                  <option value="Namibie">🇳🇦 Namibie</option>
                  <option value="Niger">🇳🇪 Niger</option>
                  <option value="Nigeria">🇳🇬 Nigeria</option>
                  <option value="Ouganda">🇺🇬 Ouganda</option>
                  <option value="Rwanda">🇷🇼 Rwanda</option>
                  <option value="Sao Tomé-et-Principe">🇸🇹 Sao Tomé-et-Principe</option>
                  <option value="Sénégal">🇸🇳 Sénégal</option>
                  <option value="Seychelles">🇸🇨 Seychelles</option>
                  <option value="Sierra Leone">🇸🇱 Sierra Leone</option>
                  <option value="Somalie">🇸🇴 Somalie</option>
                  <option value="Soudan">🇸🇩 Soudan</option>
                  <option value="Soudan du Sud">🇸🇸 Soudan du Sud</option>
                  <option value="Tanzanie">🇹🇿 Tanzanie</option>
                  <option value="Tchad">🇹🇩 Tchad</option>
                  <option value="Togo">🇹🇬 Togo</option>
                  <option value="Tunisie">🇹🇳 Tunisie</option>
                  <option value="Zambie">🇿🇲 Zambie</option>
                  <option value="Zimbabwe">🇿🇼 Zimbabwe</option>
                </optgroup>
                <optgroup label="Autres">
                  <option value="Chine">🇨🇳 Chine</option>
                  <option value="Dubai">🇦🇪 Dubai (EAU)</option>
                  <option value="Turquie">🇹🇷 Turquie</option>
                </optgroup>
              </select>
            </div>

            <div className="space-y-3">
              <Label>Fournisseur *</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={selectedSupplier === 'new'}
                    onChange={() => setSelectedSupplier('new')}
                  />
                  Nouveau fournisseur
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={selectedSupplier !== 'new'}
                    onChange={() => setSelectedSupplier('')}
                  />
                  Fournisseur existant
                </label>
              </div>

              {selectedSupplier !== 'new' && (
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  <option value="">Sélectionner un fournisseur</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} ({supplier.country})
                    </option>
                  ))}
                </select>
              )}

              {selectedSupplier === 'new' && (
                <>
                  <Input
                    placeholder="Nom du fournisseur"
                    value={newPrice.supplier_name}
                    onChange={(e) => setNewPrice({ ...newPrice, supplier_name: e.target.value })}
                  />
                  <Input
                    placeholder="Nom du contact"
                    value={newPrice.contact_name}
                    onChange={(e) => setNewPrice({ ...newPrice, contact_name: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Téléphone"
                      value={newPrice.phone}
                      onChange={(e) => setNewPrice({ ...newPrice, phone: e.target.value })}
                    />
                    <Input
                      placeholder="WhatsApp"
                      value={newPrice.whatsapp}
                      onChange={(e) => setNewPrice({ ...newPrice, whatsapp: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Email"
                      type="email"
                      value={newPrice.email}
                      onChange={(e) => setNewPrice({ ...newPrice, email: e.target.value })}
                    />
                    <Input
                      placeholder="WeChat"
                      value={newPrice.wechat}
                      onChange={(e) => setNewPrice({ ...newPrice, wechat: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Montant *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={newPrice.amount}
                  onChange={(e) => setNewPrice({ ...newPrice, amount: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency">Devise</Label>
                <select
                  id="currency"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={newPrice.currency}
                  onChange={(e) => setNewPrice({ ...newPrice, currency: e.target.value })}
                >
                  <option value="FCFA">FCFA (₣)</option>
                  <option value="CNY">CNY (¥)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="MOQ, délais, conditions, etc."
                rows={4}
                value={newPrice.notes}
                onChange={(e) => setNewPrice({ ...newPrice, notes: e.target.value })}
              />
            </div>

            {/* Colisage - Dimensions et Poids */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Ship className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Colisage & Logistique</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Longueur (cm)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newPrice.package_length || ''}
                    onChange={(e) => setNewPrice({ ...newPrice, package_length: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Largeur (cm)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newPrice.package_width || ''}
                    onChange={(e) => setNewPrice({ ...newPrice, package_width: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Hauteur (cm)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newPrice.package_height || ''}
                    onChange={(e) => setNewPrice({ ...newPrice, package_height: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Poids unitaire (kg)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newPrice.package_weight || ''}
                    onChange={(e) => setNewPrice({ ...newPrice, package_weight: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Unités par colis</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={newPrice.units_per_package || ''}
                    onChange={(e) => setNewPrice({ ...newPrice, units_per_package: e.target.value })}
                  />
                </div>
              </div>

              {/* Calcul CBM */}
              {newPrice.package_length && newPrice.package_width && newPrice.package_height && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Volume (CBM):</span>
                    <span className="font-bold text-blue-600">
                      {((parseFloat(newPrice.package_length) * parseFloat(newPrice.package_width) * parseFloat(newPrice.package_height)) / 1000000).toFixed(3)} m³
                    </span>
                  </div>
                  {newPrice.package_weight && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Poids:</span>
                      <span className="font-bold text-green-600">
                        {parseFloat(newPrice.package_weight).toFixed(2)} kg
                      </span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-gray-500">
                💡 Ces informations permettent d'estimer les coûts de transport maritime ou aérien
              </p>
            </div>

            {/* Variations de Prix */}
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Variations de Prix</Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Ajoutez différents prix pour différentes quantités/tailles
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newVariations = [...(newPrice.variations || []), {
                      id: Date.now().toString(),
                      label: '',
                      amount: '',
                      notes: ''
                    }];
                    setNewPrice({ ...newPrice, variations: newVariations });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une variation
                </Button>
              </div>

              {newPrice.variations && newPrice.variations.length > 0 && (
                <div className="space-y-3">
                  {newPrice.variations.map((variation: any, index: number) => (
                    <div key={variation.id || index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">
                          Variation {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newVariations = newPrice.variations.filter((_: any, i: number) => i !== index);
                            setNewPrice({ ...newPrice, variations: newVariations });
                          }}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Label</Label>
                          <Input
                            placeholder="Ex: 100-500 unités"
                            value={variation.label}
                            onChange={(e) => {
                              const newVariations = [...newPrice.variations];
                              newVariations[index].label = e.target.value;
                              setNewPrice({ ...newPrice, variations: newVariations });
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Montant</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={variation.amount}
                            onChange={(e) => {
                              const newVariations = [...newPrice.variations];
                              newVariations[index].amount = e.target.value;
                              setNewPrice({ ...newPrice, variations: newVariations });
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <Label className="text-xs">Notes</Label>
                        <Input
                          placeholder="MOQ, conditions..."
                          value={variation.notes}
                          onChange={(e) => {
                            const newVariations = [...newPrice.variations];
                            newVariations[index].notes = e.target.value;
                            setNewPrice({ ...newPrice, variations: newVariations });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Photos */}
            <div className="grid gap-2">
              <Label>📷 Photos du Produit</Label>
              <div className="border-2 border-dashed rounded-lg p-4 hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Cliquez pour ajouter des photos
                  </span>
                  <span className="text-xs text-gray-500">
                    PNG, JPG jusqu'à 5MB par photo
                  </span>
                </label>
              </div>

              {/* Aperçu des photos */}
              {uploadedPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {uploadedPhotos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo.preview}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddPriceDialogOpen(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddPrice}
              disabled={isSaving || !newPrice.amount || !newPrice.country}
            >
              {isSaving ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Éditer un Prix */}
      <Dialog open={isEditPriceDialogOpen} onOpenChange={setIsEditPriceDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Éditer le Prix</DialogTitle>
            <DialogDescription>
              Modifiez les informations du prix pour {selectedMaterial?.name}
            </DialogDescription>
          </DialogHeader>

          {editingPrice && (
            <div className="space-y-4">
              {/* Fournisseur (lecture seule) */}
              <div className="grid gap-2">
                <Label>Fournisseur</Label>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">{editingPrice.supplier?.name || 'Non spécifié'}</p>
                  {editingPrice.supplier?.contact_name && (
                    <p className="text-sm text-gray-600">
                      Contact: {editingPrice.supplier.contact_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Pays */}
              <div className="grid gap-2">
                <Label htmlFor="edit-country">Pays *</Label>
                <select
                  id="edit-country"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  value={editingPrice.country}
                  onChange={(e) => {
                    const country = e.target.value;
                    // Auto-sélection de la devise selon le pays
                    if (country === 'Chine') {
                      setEditingPrice({ ...editingPrice, country, currency: 'CNY' });
                    } else if (['Cameroun', 'Sénégal', 'Côte d\'Ivoire', 'Mali', 'Burkina Faso', 'Niger', 'Togo', 'Bénin', 'Guinée-Bissau', 'Centrafrique', 'Congo', 'Gabon', 'Tchad', 'Guinée équatoriale'].includes(country)) {
                      setEditingPrice({ ...editingPrice, country, currency: 'FCFA' });
                    } else if (country === 'Turquie') {
                      setEditingPrice({ ...editingPrice, country, currency: 'TRY' });
                    } else if (country === 'Dubai') {
                      setEditingPrice({ ...editingPrice, country, currency: 'AED' });
                    } else {
                      setEditingPrice({ ...editingPrice, country });
                    }
                  }}
                >
                  <optgroup label="Afrique">
                    <option value="Afrique du Sud">🇿🇦 Afrique du Sud</option>
                    <option value="Algérie">🇩🇿 Algérie</option>
                    <option value="Angola">🇦🇴 Angola</option>
                    <option value="Bénin">🇧🇯 Bénin</option>
                    <option value="Botswana">🇧🇼 Botswana</option>
                    <option value="Burkina Faso">🇧🇫 Burkina Faso</option>
                    <option value="Burundi">🇧🇮 Burundi</option>
                    <option value="Cameroun">🇨🇲 Cameroun</option>
                    <option value="Cap-Vert">🇨🇻 Cap-Vert</option>
                    <option value="Centrafrique">🇨🇫 Centrafrique</option>
                    <option value="Comores">🇰🇲 Comores</option>
                    <option value="Congo">🇨🇬 Congo</option>
                    <option value="Congo (RDC)">🇨🇩 Congo (RDC)</option>
                    <option value="Côte d'Ivoire">🇨🇮 Côte d'Ivoire</option>
                    <option value="Djibouti">🇩🇯 Djibouti</option>
                    <option value="Égypte">🇪🇬 Égypte</option>
                    <option value="Érythrée">🇪🇷 Érythrée</option>
                    <option value="Eswatini">🇸🇿 Eswatini</option>
                    <option value="Éthiopie">🇪🇹 Éthiopie</option>
                    <option value="Gabon">🇬🇦 Gabon</option>
                    <option value="Gambie">🇬🇲 Gambie</option>
                    <option value="Ghana">🇬🇭 Ghana</option>
                    <option value="Guinée">🇬🇳 Guinée</option>
                    <option value="Guinée-Bissau">🇬🇼 Guinée-Bissau</option>
                    <option value="Guinée équatoriale">🇬🇶 Guinée équatoriale</option>
                    <option value="Kenya">🇰🇪 Kenya</option>
                    <option value="Lesotho">🇱🇸 Lesotho</option>
                    <option value="Liberia">🇱🇷 Liberia</option>
                    <option value="Libye">🇱🇾 Libye</option>
                    <option value="Madagascar">🇲🇬 Madagascar</option>
                    <option value="Malawi">🇲🇼 Malawi</option>
                    <option value="Mali">🇲🇱 Mali</option>
                    <option value="Maroc">🇲🇦 Maroc</option>
                    <option value="Maurice">🇲🇺 Maurice</option>
                    <option value="Mauritanie">🇲🇷 Mauritanie</option>
                    <option value="Mozambique">🇲🇿 Mozambique</option>
                    <option value="Namibie">🇳🇦 Namibie</option>
                    <option value="Niger">🇳🇪 Niger</option>
                    <option value="Nigeria">🇳🇬 Nigeria</option>
                    <option value="Ouganda">🇺🇬 Ouganda</option>
                    <option value="Rwanda">🇷🇼 Rwanda</option>
                    <option value="Sao Tomé-et-Principe">🇸🇹 Sao Tomé-et-Principe</option>
                    <option value="Sénégal">🇸🇳 Sénégal</option>
                    <option value="Seychelles">🇸🇨 Seychelles</option>
                    <option value="Sierra Leone">🇸🇱 Sierra Leone</option>
                    <option value="Somalie">🇸🇴 Somalie</option>
                    <option value="Soudan">🇸🇩 Soudan</option>
                    <option value="Soudan du Sud">🇸🇸 Soudan du Sud</option>
                    <option value="Tanzanie">🇹🇿 Tanzanie</option>
                    <option value="Tchad">🇹🇩 Tchad</option>
                    <option value="Togo">🇹🇬 Togo</option>
                    <option value="Tunisie">🇹🇳 Tunisie</option>
                    <option value="Zambie">🇿🇲 Zambie</option>
                    <option value="Zimbabwe">🇿🇼 Zimbabwe</option>
                  </optgroup>
                  <optgroup label="Autres">
                    <option value="Chine">🇨🇳 Chine</option>
                    <option value="Dubai">🇦🇪 Dubai (EAU)</option>
                    <option value="Turquie">🇹🇷 Turquie</option>
                  </optgroup>
                </select>
              </div>

              {/* Prix */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">Montant *</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    placeholder="0"
                    value={editingPrice.amount}
                    onChange={(e) => setEditingPrice({ ...editingPrice, amount: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-currency">Devise</Label>
                  <select
                    id="edit-currency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={editingPrice.currency}
                    onChange={(e) => setEditingPrice({ ...editingPrice, currency: e.target.value })}
                  >
                    <option value="FCFA">FCFA (₣)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="MOQ, délais, conditions, etc."
                  rows={4}
                  value={editingPrice.notes || ''}
                  onChange={(e) => setEditingPrice({ ...editingPrice, notes: e.target.value })}
                />
              </div>

              {/* Upload Photos */}
              <div className="grid gap-2">
                <Label>📷 Ajouter des Photos</Label>
                <div className="border-2 border-dashed rounded-lg p-4 hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="edit-photo-upload"
                  />
                  <label
                    htmlFor="edit-photo-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Cliquez pour ajouter des photos
                    </span>
                    <span className="text-xs text-gray-500">
                      PNG, JPG jusqu'à 5MB par photo
                    </span>
                  </label>
                </div>

                {/* Aperçu des nouvelles photos */}
                {uploadedPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {uploadedPhotos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.preview}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditPriceDialogOpen(false);
                setEditingPrice(null);
                setUploadedPhotos([]);
              }}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdatePrice}
              disabled={isSaving || !editingPrice?.amount || !editingPrice?.country}
            >
              {isSaving ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Vue Détaillée du Matériau - Design Amélioré */}
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {/* Header avec gradient */}
          <div className="bg-gradient-to-r from-[#5B5FC7] via-[#7B7FE8] to-[#FF9B7B] p-6 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6" />
                </div>
                {detailMaterial?.name}
              </DialogTitle>
              <DialogDescription className="text-white/90 text-base mt-2">
                Comparaison des prix et fournisseurs disponibles
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Image Gallery */}
          {detailMaterial?.images && detailMaterial.images.length > 0 && (
            <div className="px-6 pt-6">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="h-5 w-5 text-[#5B5FC7]" />
                <h3 className="font-semibold text-gray-700">Images du matériau</h3>
                <Badge variant="secondary" className="ml-auto">
                  {detailMaterial.images.length} {detailMaterial.images.length > 1 ? 'images' : 'image'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {detailMaterial.images.map((imageUrl, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#5B5FC7] transition-all cursor-pointer group shadow-sm hover:shadow-md"
                    onClick={() => window.open(imageUrl, '_blank')}
                  >
                    <img 
                      src={imageUrl} 
                      alt={`${detailMaterial.name} - Image ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                        <ImageIcon className="h-5 w-5 text-[#5B5FC7]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingPrices ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5B5FC7]"></div>
              </div>
            ) : prices.length > 0 ? (
              <div className="space-y-6">
                {/* Résumé - Cards modernes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600" />
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Prix le plus bas</p>
                      </div>
                      <p className="text-3xl font-bold text-green-600">
                        {Math.min(...prices.map(p => p.converted_amount || p.amount)).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">FCFA</p>
                    </div>
                  </Card>
                  
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Fournisseurs</p>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">
                        {new Set(prices.filter(p => p.supplier_id).map(p => p.supplier_id)).size}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">disponibles</p>
                    </div>
                  </Card>
                  
                  <Card className="relative overflow-hidden border-0 shadow-lg">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-purple-600" />
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Économie max</p>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {(() => {
                          const amounts = prices.map(p => p.converted_amount || p.amount);
                          const savings = Math.max(...amounts) - Math.min(...amounts);
                          const percentage = ((savings / Math.max(...amounts)) * 100).toFixed(0);
                          return `${percentage}%`;
                        })()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {(() => {
                          const amounts = prices.map(p => p.converted_amount || p.amount);
                          const savings = Math.max(...amounts) - Math.min(...amounts);
                          return `${savings.toLocaleString()} FCFA`;
                        })()}
                      </p>
                    </div>
                  </Card>
                </div>

              {/* Liste des prix triés */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 flex-1 bg-gradient-to-r from-[#5B5FC7] to-transparent rounded" />
                  <h3 className="font-bold text-lg text-gray-800">Prix classés</h3>
                  <div className="h-1 flex-1 bg-gradient-to-l from-[#5B5FC7] to-transparent rounded" />
                </div>
                
                {prices
                  .sort((a, b) => (a.converted_amount || a.amount) - (b.converted_amount || b.amount))
                  .map((price, index) => {
                    const isLowest = index === 0;
                    const savings = isLowest ? 0 : (price.converted_amount || price.amount) - (prices[0].converted_amount || prices[0].amount);
                    
                    return (
                      <Card 
                        key={price.id} 
                        className={`relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all ${
                          isLowest ? 'ring-2 ring-green-500' : ''
                        }`}
                      >
                        {/* Barre de couleur selon le rang */}
                        <div className={`absolute top-0 left-0 w-full h-2 ${
                          isLowest ? 'bg-gradient-to-r from-green-400 to-green-600' : 
                          'bg-gradient-to-r from-gray-300 to-gray-400'
                        }`} />
                        
                        <div className="p-5 space-y-4">
                          {/* Header avec badges et pays */}
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {isLowest && (
                                <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 px-3 py-1">
                                  <span className="text-base">🏆 Meilleur prix</span>
                                </Badge>
                              )}
                              <Badge variant="outline" className="font-mono text-base px-3 py-1 border-2">
                                #{index + 1}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-lg font-semibold text-gray-700">
                              <span className="text-2xl">
                                {price.country === 'Cameroun' && '🇨🇲'}
                                {price.country === 'Gabon' && '🇬🇦'}
                                {price.country === 'Chine' && '🇨🇳'}
                                {price.country === 'France' && '🇫🇷'}
                                {price.country === 'USA' && '🇺🇸'}
                              </span>
                              <span>{price.country}</span>
                            </div>
                          </div>

                          {/* Fournisseur - Card moderne */}
                          {price.supplier && (
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-lg text-gray-800 mb-1">{price.supplier.name}</p>
                                  {price.supplier.contact_name && (
                                    <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                                      <UserCircle className="h-4 w-4" />
                                      {price.supplier.contact_name}
                                    </p>
                                  )}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                    {price.supplier.phone && (
                                      <div className="flex items-center gap-2 text-gray-700">
                                        <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                                          📞
                                        </div>
                                        <span className="truncate">{price.supplier.phone}</span>
                                      </div>
                                    )}
                                    {price.supplier.whatsapp && (
                                      <div className="flex items-center gap-2 text-gray-700">
                                        <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                                          💬
                                        </div>
                                        <span className="truncate">{price.supplier.whatsapp}</span>
                                      </div>
                                    )}
                                    {price.supplier.wechat && (
                                      <div className="flex items-center gap-2 text-gray-700">
                                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                                          💬
                                        </div>
                                        <span className="truncate">WeChat: {price.supplier.wechat}</span>
                                      </div>
                                    )}
                                    {price.supplier.email && (
                                      <div className="flex items-center gap-2 text-gray-700">
                                        <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                                          ✉️
                                        </div>
                                        <span className="truncate">{price.supplier.email}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Prix - Grande visibilité */}
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border-2 border-green-200">
                            <div className="flex flex-col gap-2">
                              <p className="text-sm font-medium text-gray-600">Prix</p>
                              {price.currency !== 'FCFA' && price.converted_amount ? (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-baseline gap-3 flex-wrap">
                                    <span className="text-4xl md:text-5xl font-bold text-green-600">
                                      {Math.round(price.converted_amount).toLocaleString()}
                                    </span>
                                    <span className="text-2xl font-semibold text-green-600">
                                      FCFA
                                    </span>
                                  </div>
                                  <p className="text-base text-gray-500">
                                    {price.amount.toLocaleString()} {price.currency}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-baseline gap-3 flex-wrap">
                                  <span className="text-4xl md:text-5xl font-bold text-green-600">
                                    {price.amount.toLocaleString()}
                                  </span>
                                  <span className="text-2xl font-semibold text-green-600">
                                    {price.currency}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Différence avec le meilleur prix */}
                          {!isLowest && savings > 0 && (
                            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 p-4 rounded-xl">
                              <p className="text-sm font-bold text-red-600 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                +{savings.toLocaleString()} FCFA par rapport au meilleur prix
                              </p>
                            </div>
                          )}

                          {/* Photos - Responsive Grid */}
                          {price.photos && price.photos.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">
                                📷 Photos ({price.photos.length})
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {price.photos.map((photo: any) => (
                                  <div
                                    key={photo.id}
                                    className="relative aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                                  >
                                    <img
                                      src={photo.url}
                                      alt="Photo produit"
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions - Responsive */}
                          {/* Hide edit buttons for Twinsk admin prices */}
                          {price.supplier?.name !== 'Twinsk Company Ltd' && (
                            <div className="flex gap-2 flex-col sm:flex-row">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIsDetailViewOpen(false);
                                  handleEditPrice(price);
                                }}
                                className="flex-1 sm:flex-none"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Éditer
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeletePrice(price.id)}
                                className="flex-1 sm:flex-none text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">Aucun prix ajouté pour ce matériau</p>
              <Button
                onClick={() => {
                  setIsDetailViewOpen(false);
                  if (detailMaterial) {
                    handleOpenPriceDialog(detailMaterial);
                  }
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un Prix
              </Button>
            </div>
          )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 p-6 border-t">
            <Button
              onClick={() => {
                setIsDetailViewOpen(false);
                if (detailMaterial) {
                  handleOpenPriceDialog(detailMaterial);
                }
              }}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un Prix
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsDetailViewOpen(false)}
              className="w-full sm:w-auto"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Import de Fichier */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-[#38B2AC]" />
              Importer un fichier
            </DialogTitle>
            <DialogDescription>
              Uploadez une liste de matériaux (CSV, Excel)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {!isImporting ? (
              <>
                {/* Zone de drop */}
                <div className="border-2 border-dashed border-[#E0E4FF] hover:border-[#38B2AC] rounded-xl p-8 text-center transition-colors">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
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
                      CSV ou Excel (XLSX, XLS)
                    </p>
                  </label>
                </div>

                {/* Info format */}
                <div className="bg-[#38B2AC]/10 border border-[#38B2AC]/20 rounded-xl p-4">
                  <p className="text-sm text-[#4A5568] font-semibold mb-2">
                    📋 Format attendu:
                  </p>
                  <ul className="text-sm text-[#718096] space-y-1">
                    <li>• <strong>Nom</strong>: Nom du matériau (obligatoire)</li>
                    <li>• <strong>Catégorie</strong>: Type de matériau (optionnel)</li>
                    <li>• <strong>Quantité</strong>: Nombre d'unités (optionnel)</li>
                    <li>• <strong>Poids</strong>: Poids unitaire en kg (optionnel)</li>
                    <li>• <strong>Volume</strong>: Volume en m³ (optionnel)</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                {/* Progression */}
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

                  {/* Barre de progression */}
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
              </>
            )}
          </div>

          <DialogFooter>
            {!isImporting ? (
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
                <Button
                  onClick={handleImportFile}
                  disabled={!importFile}
                  className="bg-gradient-to-r from-[#38B2AC] to-[#319795] hover:from-[#319795] hover:to-[#2C7A7B] text-white"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Importer
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setIsImporting(false);
                  setImportProgress(0);
                  setImportStatus('');
                  setImportedCount(0);
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
        projectId={params.id as string}
        projectName={project?.name || ''}
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        onSuccess={() => {
          toast.success("Collaborateur invité avec succès");
        }}
      />

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
                {deleteMode === 'all' 
                  ? `Supprimer TOUS les ${materials.length} matériaux du projet ?`
                  : `Supprimer les ${filteredMaterials.length} matériaux filtrés ?`
                }
              </p>
            </div>
            {filteredMaterials.length < materials.length && (
              <div className="flex gap-2">
                <Button
                  variant={deleteMode === 'filtered' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDeleteMode('filtered')}
                  className={deleteMode === 'filtered' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Filtrés ({filteredMaterials.length})
                </Button>
                <Button
                  variant={deleteMode === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDeleteMode('all')}
                  className={deleteMode === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Tous ({materials.length})
                </Button>
              </div>
            )}
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
              onClick={() => handleDeleteMaterials(deleteMode)}
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
