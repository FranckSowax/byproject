"use client";
// @ts-nocheck

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, FileText, Upload, Settings, Trash2, Edit, X, DollarSign, Image as ImageIcon, MessageSquare, BarChart3, Ship, Package, Users, History } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ShareProjectDialog } from "@/components/collaboration/ShareProjectDialog";
import { MaterialComments } from "@/components/collaboration/MaterialComments";
import { ProjectHistory } from "@/components/collaboration/ProjectHistory";
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
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
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

  useEffect(() => {
    loadProject();
    loadMaterials();
    loadAllPrices();
  }, [params.id]);

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

  const handleFileImport = async () => {
    if (!importFile) return;

    try {
      setIsImporting(true);
      setImportProgress(10);
      setImportStatus('Lecture du fichier...');

      const fileText = await importFile.text();
      setImportProgress(20);
      setImportStatus('Analyse avec l\'IA...');

      // Parse CSV
      const lines = fileText.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('Fichier vide ou invalide');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      
      // Préparer un échantillon pour l'IA (premières lignes)
      const sampleLines = lines.slice(0, Math.min(6, lines.length));
      const sampleData = sampleLines.join('\n');

      // Appel à l'IA pour mapper les colonnes
      setImportProgress(30);
      setImportStatus('🤖 L\'IA analyse les colonnes...');

      const mappingResponse = await fetch('/api/ai/map-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headers,
          sampleData,
          targetFields: ['name', 'category', 'quantity', 'unit', 'weight', 'volume', 'specs']
        }),
      });

      if (!mappingResponse.ok) {
        throw new Error('Erreur lors du mapping IA');
      }

      const { mapping } = await mappingResponse.json();
      console.log('Mapping IA:', mapping);

      setImportProgress(50);
      setImportStatus('Création des matériaux...');

      let imported = 0;
      const totalLines = lines.length - 1;

      // Importer les matériaux avec le mapping IA
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        // Utiliser le mapping IA pour extraire les données
        const nameValue = mapping.name !== null && mapping.name < values.length ? values[mapping.name] : null;
        
        if (!nameValue) continue;

        const materialData = {
          project_id: params.id,
          name: nameValue,
          category: mapping.category !== null && mapping.category < values.length ? values[mapping.category] : null,
          quantity: mapping.quantity !== null && mapping.quantity < values.length && values[mapping.quantity] 
            ? parseFloat(values[mapping.quantity]) 
            : null,
          weight: mapping.weight !== null && mapping.weight < values.length && values[mapping.weight]
            ? parseFloat(values[mapping.weight])
            : null,
          volume: mapping.volume !== null && mapping.volume < values.length && values[mapping.volume]
            ? parseFloat(values[mapping.volume])
            : null,
          specs: {},
        };

        const { error } = await supabase
          .from('materials')
          .insert([materialData]);

        if (error) {
          console.error('Error inserting material:', error);
          continue;
        }

        imported++;
        setImportedCount(imported);
        setImportProgress(50 + Math.floor((imported / totalLines) * 50));
      }

      setImportProgress(100);
      setImportStatus('✅ Import terminé !');
      
      setTimeout(() => {
        toast.success(`${imported} matériaux importés avec succès grâce à l'IA`);
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
      toast.error('Erreur lors de l\'import du fichier');
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
      });
      loadMaterials(); // Recharger la liste
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error("Erreur lors de l'ajout");
    } finally {
      setIsSaving(false);
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
          // Utiliser un taux par défaut si non trouvé
          const defaultRates: Record<string, number> = {
            'CNY': 85,
            'USD': 600,
            'EUR': 650,
            'TRY': 20,
            'AED': 163,
          };
          convertedAmount = parseFloat(editingPrice.amount) * (defaultRates[editingPrice.currency] || 1);
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
        const fileExt = photo.file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `prices/${priceId}/${fileName}`;

        // Upload vers Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(filePath, photo.file);

        if (uploadError) throw uploadError;

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(filePath);

        photoUrls.push(publicUrl);
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
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setIsShareDialogOpen(true)}
              className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#5B5FC7] hover:text-white transition-all"
              title="Partager le projet"
            >
              <Users className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowHistory(!showHistory)}
              className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#5B5FC7] hover:text-white transition-all"
              title="Historique du projet"
            >
              <History className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#5B5FC7] hover:text-white transition-all"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDelete}
              className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl border-2 border-[#E0E4FF] hover:border-red-500 hover:bg-red-500 hover:text-white transition-all"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

      {/* Status */}
      {project.mapping_status && (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#5B5FC7]/10 to-[#7B7FE8]/10 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-[#5B5FC7]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#4A5568]">Statut du mapping</p>
                <p className="text-sm text-[#718096]">
                  {project.mapping_status === 'pending' && 'En attente de traitement'}
                  {project.mapping_status === 'completed' && 'Mapping complété'}
                  {project.mapping_status === 'corrected' && 'Corrigé manuellement'}
                </p>
              </div>
              <Badge variant={project.mapping_status === 'completed' ? 'default' : 'secondary'}>
                {project.mapping_status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#5B5FC7]/10 to-[#FF9B7B]/10 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-[#5B5FC7]">{materials.length}</span>
                  </div>
                  <p className="text-sm font-medium text-[#4A5568]">
                    matériau{materials.length > 1 ? 'x' : ''} détecté{materials.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                {materials.map((material) => (
                  <div 
                    key={material.id} 
                    className="group relative bg-white border border-[#E0E4FF] hover:border-[#5B5FC7] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl"
                  >
                    {/* Barre de couleur en haut */}
                    <div className="h-1 bg-gradient-to-r from-[#5B5FC7] via-[#7B7FE8] to-[#FF9B7B]" />
                    
                    {/* Contenu principal */}
                    <div className="p-4 space-y-3">
                      {/* En-tête avec titre et description */}
                      <div 
                        className="cursor-pointer"
                        onClick={() => handleOpenDetailView(material)}
                      >
                        <h4 className="font-bold text-base text-[#2D3748] group-hover:text-[#5B5FC7] transition-colors leading-tight">
                          {material.name}
                        </h4>
                        {material.description && (
                          <p className="text-xs text-gray-500 italic mt-1.5 leading-relaxed">
                            {material.description}
                          </p>
                        )}
                      </div>

                      {/* Badges et métriques */}
                      <div className="flex flex-wrap gap-1.5">
                        {material.category && (
                          <Badge className="bg-[#5B5FC7]/10 text-[#5B5FC7] border-0 text-xs font-medium px-2 py-0.5">
                            {material.category}
                          </Badge>
                        )}
                        {material.quantity && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#FF9B7B]/10 text-[#FF9B7B] rounded-md text-xs font-medium">
                            <Package className="h-3 w-3" />
                            {material.quantity}
                          </div>
                        )}
                        {material.surface && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">
                            <span className="text-[10px]">📐</span>
                            {material.surface} m²
                          </div>
                        )}
                        {material.weight && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-xs font-medium">
                            <span className="text-[10px]">⚖️</span>
                            {material.weight} kg
                          </div>
                        )}
                        {material.volume && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md text-xs font-medium">
                            <span className="text-[10px]">📦</span>
                            {material.volume} m³
                          </div>
                        )}
                        {material.specs && Object.keys(material.specs).length > 0 && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-600 rounded-md text-xs">
                            <FileText className="h-3 w-3" />
                            {Object.keys(material.specs).length}
                          </div>
                        )}
                      </div>

                      {/* Actions - Grid 4 colonnes sur mobile */}
                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setCommentsMaterialId(material.id);
                            setCommentsMaterialName(material.name);
                            setShowComments(true);
                          }}
                          className="h-10 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors p-0"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenPriceDialog(material)}
                          className="h-10 rounded-xl bg-green-50 hover:bg-green-100 text-green-600 transition-colors p-0"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditMaterial(material)}
                          className="h-10 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteMaterial(material.id, material.name)}
                          className="h-10 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5B5FC7]/10 to-[#FF9B7B]/10">
                <FileText className="h-10 w-10 text-[#5B5FC7]" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-[#4A5568]">Aucun matériau</h3>
              <p className="mb-8 text-[#718096] max-w-md mx-auto">
                Commencez par ajouter des matériaux à ce projet pour comparer les prix
              </p>
              <Button 
                onClick={handleAddMaterial}
                className="bg-gradient-to-r from-[#48BB78] to-[#38A169] hover:from-[#38A169] hover:to-[#2F855A] text-white shadow-lg shadow-[#48BB78]/30 rounded-xl px-8 py-6 text-lg transition-all hover:scale-105"
              >
                <Plus className="mr-2 h-5 w-5" />
                Ajouter un matériau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historique du projet */}
      {showHistory && (
        <ProjectHistory projectId={params.id as string} />
      )}

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
                    réellement créés dans la base de données et utiliser GPT-4o, connectez-vous avec 
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
        <DialogContent className="sm:max-w-[600px] border-0 bg-white/95 backdrop-blur-sm shadow-2xl">
          <div className="h-2 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] absolute top-0 left-0 right-0 rounded-t-lg" />
          <DialogHeader className="pt-4">
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
            <div className="grid gap-4 py-4">
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

            </div>
          )}

          <DialogFooter>
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ajouter un matériau</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau matériau à votre projet
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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
          </div>

          <DialogFooter>
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

      {/* Modal Vue Détaillée du Matériau */}
      <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl flex items-center gap-2">
              📦 {detailMaterial?.name}
            </DialogTitle>
            <DialogDescription>
              Comparaison des prix et fournisseurs
            </DialogDescription>
          </DialogHeader>

          {isLoadingPrices ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : prices.length > 0 ? (
            <div className="space-y-6">
              {/* Résumé - Responsive Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-green-50 border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Prix le plus bas</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600">
                    {Math.min(...prices.map(p => p.converted_amount || p.amount)).toLocaleString()} FCFA
                  </p>
                </Card>
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Fournisseurs</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-600">
                    {new Set(prices.filter(p => p.supplier_id).map(p => p.supplier_id)).size}
                  </p>
                </Card>
                <Card className="p-4 bg-purple-50 border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Économie max</p>
                  <p className="text-lg md:text-2xl font-bold text-purple-600">
                    {(() => {
                      const amounts = prices.map(p => p.converted_amount || p.amount);
                      const savings = Math.max(...amounts) - Math.min(...amounts);
                      const percentage = ((savings / Math.max(...amounts)) * 100).toFixed(0);
                      return `${savings.toLocaleString()} FCFA (${percentage}%)`;
                    })()}
                  </p>
                </Card>
              </div>

              {/* Liste des prix triés */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Prix classés (du moins cher au plus cher)</h3>
                
                {prices
                  .sort((a, b) => (a.converted_amount || a.amount) - (b.converted_amount || b.amount))
                  .map((price, index) => {
                    const isLowest = index === 0;
                    const savings = isLowest ? 0 : (price.converted_amount || price.amount) - (prices[0].converted_amount || prices[0].amount);
                    
                    return (
                      <Card 
                        key={price.id} 
                        className={`p-4 ${isLowest ? 'border-2 border-green-500 bg-green-50' : 'hover:shadow-md transition-shadow'}`}
                      >
                        <div className="space-y-3">
                          {/* Header avec badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {isLowest && (
                              <Badge className="bg-green-600 text-white">
                                🏆 Meilleur prix
                              </Badge>
                            )}
                            <Badge variant="outline" className="font-mono">
                              #{index + 1}
                            </Badge>
                            <span className="text-lg font-semibold">
                              {price.country === 'Cameroun' && '📍'}
                              {price.country === 'Chine' && '🇨🇳'}
                              {price.country === 'France' && '🇫🇷'}
                              {price.country === 'USA' && '🇺🇸'}
                              {' '}{price.country}
                            </span>
                          </div>

                          {/* Fournisseur et Contact - Responsive */}
                          {price.supplier && (
                            <div className="bg-white p-3 rounded-lg">
                              <p className="font-medium text-lg mb-1">{price.supplier.name}</p>
                              {price.supplier.contact_name && (
                                <p className="text-sm text-gray-600 mb-2">
                                  👤 {price.supplier.contact_name}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                {price.supplier.phone && (
                                  <span className="flex items-center gap-1">
                                    📞 {price.supplier.phone}
                                  </span>
                                )}
                                {price.supplier.whatsapp && (
                                  <span className="flex items-center gap-1">
                                    💬 {price.supplier.whatsapp}
                                  </span>
                                )}
                                {price.supplier.wechat && (
                                  <span className="flex items-center gap-1">
                                    WeChat: {price.supplier.wechat}
                                  </span>
                                )}
                                {price.supplier.email && (
                                  <span className="flex items-center gap-1">
                                    ✉️ {price.supplier.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Prix - Responsive */}
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                            <span className="text-3xl md:text-4xl font-bold text-green-600">
                              {price.amount.toLocaleString()} {price.currency}
                            </span>
                            {price.currency !== 'FCFA' && price.converted_amount && (
                              <span className="text-lg text-gray-600">
                                ≈ {Math.round(price.converted_amount).toLocaleString()} FCFA
                              </span>
                            )}
                          </div>

                          {/* Différence avec le meilleur prix */}
                          {!isLowest && savings > 0 && (
                            <div className="bg-red-50 border border-red-200 p-2 rounded">
                              <p className="text-sm font-medium text-red-600">
                                +{savings.toLocaleString()} FCFA par rapport au meilleur prix
                              </p>
                            </div>
                          )}

                          {/* Notes */}
                          {price.notes && (
                            <div className="bg-gray-50 p-3 rounded">
                              <p className="text-sm font-medium mb-1">📝 Notes:</p>
                              <p className="text-sm text-gray-700 whitespace-pre-line">
                                {price.notes}
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
                          <div className="flex flex-wrap gap-2 pt-2 border-t">
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

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
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
                  onClick={handleFileImport}
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

      </div>
    </div>
  );
}
