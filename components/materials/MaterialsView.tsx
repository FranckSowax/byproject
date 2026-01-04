"use client";

import { useState, useMemo } from "react";
import { MaterialsToolbar } from "./MaterialsToolbar";
import { MaterialsDataGrid } from "./MaterialsDataGrid";
import { CategoryGroup } from "./CategoryGroup";
import { MaterialsFilter } from "./MaterialsFilter";
import { AISuggestions } from "@/components/project/AISuggestions";
import { ViewMode, Material } from "./types";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { MaterialDetailModal } from "./MaterialDetailModal";

interface MaterialsViewProps {
  materials: Material[];
  pricesByMaterial: Record<string, any[]>;
  commentsByMaterial: Record<string, any[]>;
  onEditMaterial: (material: Material) => void;
  onDeleteMaterial: (id: string) => Promise<void>;
  onDuplicateMaterial: (material: Material) => void;
  onAddMaterial: () => void;
  onImportMaterials: () => void;
  onExportMaterials: () => void;
  onQuickUpdate?: (id: string, field: string, value: any) => Promise<void>;
  onCategoryRename: (oldName: string, newName: string) => Promise<void>;
  // onMaterialClick removed/internalized
  projectId: string;
  
  // Suggestions AI
  suggestions?: any[];
  isLoadingSuggestions?: boolean;
  onAcceptSuggestion?: (item: any, category: string) => Promise<void>;
  onDismissSuggestion?: (item: any, category: string) => void;
  onDismissAllSuggestions?: () => void;
  onRegenerateSuggestions?: () => Promise<void>;
}

export function MaterialsView({
  materials,
  pricesByMaterial,
  commentsByMaterial,
  onEditMaterial,
  onDeleteMaterial,
  onDuplicateMaterial,
  onAddMaterial,
  onImportMaterials,
  onExportMaterials,
  onQuickUpdate,
  onCategoryRename,
  // onMaterialClick, -> Internalized
  projectId,
  suggestions = [],
  isLoadingSuggestions = false,
  onAcceptSuggestion,
  onDismissSuggestion,
  onDismissAllSuggestions,
  onRegenerateSuggestions
}: MaterialsViewProps) {
  const supabase = createClient();
  const [viewMode, setViewMode] = useState<ViewMode>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDrawerMaterial, setSelectedDrawerMaterial] = useState<Material | null>(null);
  const [drawerPrices, setDrawerPrices] = useState<any[]>([]);
  const [drawerComments, setDrawerComments] = useState<any[]>([]);

  // Drawer Logic
  const loadDrawerPrices = async (materialId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && localStorage.getItem('mockUser')) {
        setDrawerPrices([
          {
            id: 101,
            amount: 4500,
            currency: 'XAF',
            supplier: { name: 'Quincaillerie du Centre' },
            created_at: new Date().toISOString(),
            notes: 'Prix négocié'
          },
          {
            id: 102,
            amount: 4700,
            currency: 'XAF',
            supplier: { name: 'Bati-Express' },
            created_at: new Date(Date.now() - 86400000).toISOString(),
            notes: 'Prix public'
          }
        ]);
        return;
      }

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && localStorage.getItem('mockUser')) {
        setDrawerComments([
          {
            id: 'mock-c1',
            content: 'Vérifier la disponibilité en stock',
            user_name: 'Admin Test',
            created_at: new Date().toISOString()
          }
        ]);
        return;
      }

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

  const handleOpenDrawer = async (material: Material) => {
    setSelectedDrawerMaterial(material);
    setIsDrawerOpen(true);
    await Promise.all([
      loadDrawerPrices(material.id),
      loadDrawerComments(material.id),
    ]);
  };

  const handleAddPriceFromDrawer = async (priceData: any) => {
    if (!selectedDrawerMaterial) return;
    try {
      // Mock mode check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && localStorage.getItem('mockUser')) {
        const newMockPrice = {
          id: Date.now(), // Numeric ID for compatibility
          amount: parseFloat(priceData.amount),
          currency: priceData.currency,
          country: priceData.country,
          supplier: { name: priceData.supplier_name || 'Fournisseur Inconnu' },
          notes: priceData.notes,
          created_at: new Date().toISOString()
        };
        setDrawerPrices(prev => [newMockPrice, ...prev]);
        toast.success('Prix ajouté (Mode Démo)');
        return;
      }

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
    } catch (error) {
      console.error('Error adding price:', error);
      toast.error("Erreur lors de l'ajout du prix");
    }
  };

  const handleAddCommentFromDrawer = async (content: string) => {
    if (!selectedDrawerMaterial) return;
    try {
      // Mock mode check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && localStorage.getItem('mockUser')) {
        const newMockComment = {
          id: `mock-c-${Date.now()}`,
          content,
          user_name: 'Admin Test',
          created_at: new Date().toISOString()
        };
        setDrawerComments(prev => [newMockComment, ...prev]);
        toast.success('Note ajoutée (Mode Démo)');
        return;
      }

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


  const handleSaveDrawer = async (updates: Partial<Material>) => {
    if (!selectedDrawerMaterial) return;
    try {
      // Mock mode
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && localStorage.getItem('mockUser')) {
        toast.success("Modifications enregistrées (Mode Démo)");
        return;
      }

      const { error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', selectedDrawerMaterial.id);
      
      if (error) throw error;
      toast.success("Modifications enregistrées");
      // Note: Parent refresh needed for data consistency
    } catch (error) {
      console.error('Error updating material:', error);
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const handleDeleteDrawer = async () => {
    if (!selectedDrawerMaterial) return;
    await onDeleteMaterial(selectedDrawerMaterial.id);
    setIsDrawerOpen(false);
  };

  const handleUploadImageDrawer = async (file: File): Promise<string | null> => {
    // Mock upload
    return URL.createObjectURL(file);
  };

  // Filter materials based on search query
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;
    
    const query = searchQuery.toLowerCase();
    return materials.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.category?.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query)
    );
  }, [materials, searchQuery]);

  // Group by category for category view
  const materialsByCategory = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    filteredMaterials.forEach(m => {
      const cat = m.category || 'Sans catégorie';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(m);
    });
    return grouped;
  }, [filteredMaterials]);

  const categories = Object.keys(materialsByCategory).sort((a, b) => {
    if (a === 'Sans catégorie') return 1;
    if (b === 'Sans catégorie') return -1;
    return materialsByCategory[b].length - materialsByCategory[a].length;
  });

  const handleToggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (confirm(`Supprimer ${selectedIds.length} éléments ?`)) {
      for (const id of selectedIds) {
        await onDeleteMaterial(id);
      }
      setSelectedIds([]);
    }
  };

  const totalSuggestions = useMemo(() => {
    if (!suggestions) return 0;
    return suggestions.reduce((acc, cat: any) => acc + (cat.missingItems?.length || 0), 0);
  }, [suggestions]);

  return (
    <div className="space-y-4">
      <MaterialsToolbar 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCount={selectedIds.length}
        totalCount={materials.length}
        onAdd={onAddMaterial}
        onDeleteSelected={handleDeleteSelected}
        onImport={onImportMaterials}
        onExport={onExportMaterials}
        activeFiltersCount={showFilters ? 1 : 0}
        onToggleFilters={() => setShowFilters(!showFilters)}
        suggestionsCount={totalSuggestions}
      />

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
              <MaterialsFilter 
                materials={materials} 
                onFilteredChange={() => {}} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-[400px]">
        {/* Vue Suggestions IA */}
        {viewMode === 'suggestions' ? (
          <div className="space-y-6">
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
                {onRegenerateSuggestions && (
                  <Button
                    onClick={onRegenerateSuggestions}
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
                        {totalSuggestions > 0 ? 'Régénérer' : 'Générer des suggestions'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {totalSuggestions > 0 ? (
              <AISuggestions
                suggestions={suggestions}
                onAcceptSuggestion={onAcceptSuggestion || (async () => {})}
                onDismissSuggestion={onDismissSuggestion || (() => {})}
                onDismissAll={onDismissAllSuggestions || (() => {})}
                isLoading={isLoadingSuggestions}
              />
            ) : (
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
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="mx-auto h-12 w-12 text-slate-400 bg-slate-50 rounded-full flex items-center justify-center mb-3">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">Aucun matériau trouvé</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {searchQuery 
                ? "Essayez de modifier votre recherche ou vos filtres." 
                : "Commencez par ajouter des matériaux à votre projet."}
            </p>
            {!searchQuery && (
              <Button onClick={onAddMaterial}>
                Ajouter un matériau
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <MaterialsDataGrid
            materials={filteredMaterials}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
            onEdit={onEditMaterial}
            onDelete={(id) => onDeleteMaterial(id)}
            onDuplicate={onDuplicateMaterial}
            pricesByMaterial={pricesByMaterial}
            onQuickUpdate={onQuickUpdate}
          />
        ) : (
          <div className="space-y-4">
            {categories.map(category => (
              <CategoryGroup
                key={category}
                category={category}
                materials={materialsByCategory[category]}
                pricesByMaterial={pricesByMaterial}
                commentsByMaterial={commentsByMaterial}
                isExpanded={expandedCategories.has(category)}
                onToggle={() => handleToggleCategory(category)}
                onMaterialClick={handleOpenDrawer}
                onCategoryRename={onCategoryRename}
              />
            ))}
          </div>
        )}
      </div>

      <MaterialDetailModal
        material={selectedDrawerMaterial}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        prices={drawerPrices}
        comments={drawerComments}
        onSave={handleSaveDrawer}
        onDelete={handleDeleteDrawer}
        onAddPrice={handleAddPriceFromDrawer}
        onAddComment={handleAddCommentFromDrawer}
        onUploadImage={handleUploadImageDrawer}
      />
    </div>
  );
}
