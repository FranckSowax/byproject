'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Merge, Check, ChevronDown, ChevronRight,
  AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Material } from '@/components/materials/types';

interface DuplicateGroup {
  key: string;
  normalizedName: string;
  materials: Material[];
  totalQuantity: number;
  unit: string;
  category: string;
}

interface DuplicatesHandlerProps {
  projectId: string;
  materials: Material[];
  onComplete: () => void;
  onCancel: () => void;
}

// Normaliser le nom pour la comparaison
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer accents
    .replace(/[^a-z0-9\s]/g, '') // Garder que lettres, chiffres, espaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Générer une clé de regroupement (nom normalisé + unité)
function generateGroupKey(material: Material): string {
  const normalizedName = normalizeName(material.name);
  const unit = (material.specs?.unit || '').toUpperCase();
  return `${normalizedName}__${unit}`;
}

export default function DuplicatesHandler({
  projectId,
  materials,
  onComplete,
  onCancel
}: DuplicatesHandlerProps) {
  const [step, setStep] = useState<'analyzing' | 'review' | 'processing'>('analyzing');
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showOnlyDuplicates, setShowOnlyDuplicates] = useState(true);

  const supabase = createClient();

  // Analyser les doublons au montage
  useEffect(() => {
    analyzeDuplicates();
  }, [materials]);

  const analyzeDuplicates = () => {
    setStep('analyzing');

    // Grouper les matériaux par clé normalisée
    const groups: Record<string, DuplicateGroup> = {};

    for (const material of materials) {
      const key = generateGroupKey(material);

      if (!groups[key]) {
        groups[key] = {
          key,
          normalizedName: normalizeName(material.name),
          materials: [],
          totalQuantity: 0,
          unit: material.specs?.unit || '',
          category: material.category || 'Non catégorisé'
        };
      }

      groups[key].materials.push(material);
      groups[key].totalQuantity += material.quantity || 0;

      // Garder la catégorie la plus précise
      if (material.category && material.category !== 'Non catégorisé' && material.category !== 'Divers & Imprévus') {
        groups[key].category = material.category;
      }
    }

    // Convertir en array et trier par nombre de doublons
    const groupsArray = Object.values(groups)
      .sort((a, b) => b.materials.length - a.materials.length);

    setDuplicateGroups(groupsArray);

    // Sélectionner automatiquement les groupes avec doublons
    const duplicateKeys = new Set(
      groupsArray
        .filter(g => g.materials.length > 1)
        .map(g => g.key)
    );
    setSelectedGroups(duplicateKeys);

    setStep('review');
  };

  // Stats
  const stats = useMemo(() => {
    const withDuplicates = duplicateGroups.filter(g => g.materials.length > 1);
    const totalDuplicateItems = withDuplicates.reduce((sum, g) => sum + g.materials.length, 0);
    const itemsToRemove = withDuplicates.reduce((sum, g) => sum + (g.materials.length - 1), 0);

    return {
      totalGroups: duplicateGroups.length,
      groupsWithDuplicates: withDuplicates.length,
      totalDuplicateItems,
      itemsToRemove,
      selectedCount: selectedGroups.size
    };
  }, [duplicateGroups, selectedGroups]);

  // Groupes à afficher
  const displayedGroups = useMemo(() => {
    if (showOnlyDuplicates) {
      return duplicateGroups.filter(g => g.materials.length > 1);
    }
    return duplicateGroups;
  }, [duplicateGroups, showOnlyDuplicates]);

  // Toggle sélection d'un groupe
  const toggleGroup = (key: string) => {
    setSelectedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Tout sélectionner / désélectionner
  const selectAll = (select: boolean) => {
    if (select) {
      const duplicateKeys = duplicateGroups
        .filter(g => g.materials.length > 1)
        .map(g => g.key);
      setSelectedGroups(new Set(duplicateKeys));
    } else {
      setSelectedGroups(new Set());
    }
  };

  // Lancer la fusion
  const handleMerge = async () => {
    if (selectedGroups.size === 0) {
      setError('Veuillez sélectionner au moins un groupe à fusionner');
      return;
    }

    setStep('processing');
    setError(null);
    setProgress(0);

    const groupsToProcess = duplicateGroups.filter(g =>
      selectedGroups.has(g.key) && g.materials.length > 1
    );

    let processed = 0;
    const total = groupsToProcess.length;

    try {
      for (const group of groupsToProcess) {
        // Garder le premier matériau et mettre à jour sa quantité
        const [keepMaterial, ...duplicates] = group.materials;

        // Mettre à jour le matériau principal avec la quantité totale
        const { error: updateError } = await supabase
          .from('materials')
          .update({
            quantity: group.totalQuantity,
            category: group.category,
            specs: {
              ...keepMaterial.specs,
              merged_from: duplicates.length,
              merged_at: new Date().toISOString(),
              original_sources: group.materials.map(m => m.specs?.source_sheet).filter(Boolean)
            }
          })
          .eq('id', keepMaterial.id);

        if (updateError) {
          console.error('Erreur mise à jour:', updateError);
          throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
        }

        // Supprimer les doublons
        if (duplicates.length > 0) {
          const duplicateIds = duplicates.map(d => d.id);
          const { error: deleteError } = await supabase
            .from('materials')
            .delete()
            .in('id', duplicateIds);

          if (deleteError) {
            console.error('Erreur suppression:', deleteError);
            throw new Error(`Erreur lors de la suppression: ${deleteError.message}`);
          }
        }

        processed++;
        setProgress(Math.round((processed / total) * 100));
      }

      // Terminé
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la fusion');
      setStep('review');
    }
  };

  // Affichage pendant l'analyse
  if (step === 'analyzing') {
    return (
      <div className="py-8 text-center">
        <div className="w-16 h-16 border-4 border-[#5B5FC7]/20 border-t-[#5B5FC7] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-semibold text-[#4A5568]">Analyse des doublons...</p>
        <p className="text-sm text-[#718096] mt-2">{materials.length} matériaux à analyser</p>
      </div>
    );
  }

  // Affichage pendant le traitement
  if (step === 'processing') {
    return (
      <div className="py-8 text-center">
        <div className="w-16 h-16 border-4 border-[#48BB78]/20 border-t-[#48BB78] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-semibold text-[#4A5568]">
          Fusion des doublons en cours...
        </p>
        <p className="text-sm text-[#718096] mt-2">{progress}% terminé</p>
        <div className="w-64 h-2 bg-slate-200 rounded-full mx-auto mt-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#48BB78] to-[#38A169] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Erreur */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="p-2 bg-blue-50 rounded-lg">
          <p className="text-lg font-bold text-blue-600">{stats.totalGroups}</p>
          <p className="text-xs text-slate-600">Matériaux uniques</p>
        </div>
        <div className="p-2 bg-orange-50 rounded-lg">
          <p className="text-lg font-bold text-orange-600">{stats.groupsWithDuplicates}</p>
          <p className="text-xs text-slate-600">Avec doublons</p>
        </div>
        <div className="p-2 bg-red-50 rounded-lg">
          <p className="text-lg font-bold text-red-600">{stats.itemsToRemove}</p>
          <p className="text-xs text-slate-600">A supprimer</p>
        </div>
        <div className="p-2 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-600">{stats.selectedCount}</p>
          <p className="text-xs text-slate-600">Sélectionnés</p>
        </div>
      </div>

      {/* Info */}
      {stats.groupsWithDuplicates === 0 ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <Check className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="font-semibold text-green-800">Aucun doublon détecté !</p>
          <p className="text-sm text-green-600 mt-1">
            Tous vos matériaux sont uniques.
          </p>
        </div>
      ) : (
        <>
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => selectAll(true)}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
              >
                Tout sélectionner
              </button>
              <button
                onClick={() => selectAll(false)}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
              >
                Aucun
              </button>
            </div>
            <button
              onClick={() => setShowOnlyDuplicates(!showOnlyDuplicates)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
            >
              {showOnlyDuplicates ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {showOnlyDuplicates ? 'Voir tous' : 'Doublons uniquement'}
            </button>
          </div>

          {/* Liste des groupes */}
          <div className="space-y-1 max-h-64 overflow-y-auto border rounded-lg p-1">
            {displayedGroups.map((group) => {
              const hasDuplicates = group.materials.length > 1;
              const isSelected = selectedGroups.has(group.key);
              const isExpanded = expandedGroup === group.key;

              return (
                <div
                  key={group.key}
                  className={`border rounded transition-colors ${
                    isSelected && hasDuplicates
                      ? 'border-orange-300 bg-orange-50'
                      : hasDuplicates
                      ? 'border-yellow-200 bg-yellow-50/50'
                      : 'border-slate-200'
                  }`}
                >
                  <div
                    className="flex items-center gap-2 p-2 cursor-pointer"
                    onClick={() => hasDuplicates && toggleGroup(group.key)}
                  >
                    {hasDuplicates && (
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-orange-600 border-orange-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-800 truncate">
                          {group.materials[0].name}
                        </span>
                        {hasDuplicates && (
                          <span className="px-1.5 py-0.5 bg-orange-200 text-orange-800 text-xs font-medium rounded">
                            x{group.materials.length}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {group.totalQuantity} {group.unit} | {group.category}
                      </p>
                    </div>

                    {hasDuplicates && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedGroup(isExpanded ? null : group.key);
                        }}
                        className="p-0.5 hover:bg-slate-200 rounded flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Détails des doublons */}
                  {isExpanded && hasDuplicates && (
                    <div className="px-2 pb-2 pt-0 border-t border-slate-200 mt-1">
                      <p className="text-xs font-medium text-slate-600 mb-1">
                        Détails ({group.materials.length} occurrences):
                      </p>
                      <div className="space-y-1">
                        {group.materials.map((mat, idx) => (
                          <div
                            key={mat.id}
                            className="flex items-center justify-between text-xs bg-white rounded px-2 py-1"
                          >
                            <span className="text-slate-600 truncate flex-1">
                              {idx === 0 && <span className="text-green-600 font-medium">[Garder] </span>}
                              {mat.specs?.source_sheet || 'Source inconnue'}
                            </span>
                            <span className="font-medium text-slate-800 ml-2">
                              {mat.quantity} {mat.specs?.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-dashed border-slate-200 flex justify-between text-xs">
                        <span className="text-slate-600">Total après fusion:</span>
                        <span className="font-bold text-green-600">
                          {group.totalQuantity} {group.unit}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>

        {stats.groupsWithDuplicates > 0 && (
          <Button
            onClick={handleMerge}
            disabled={stats.selectedCount === 0}
            className="bg-gradient-to-r from-[#ED8936] to-[#DD6B20] hover:from-[#DD6B20] hover:to-[#C05621] text-white"
          >
            <Merge className="w-4 h-4 mr-2" />
            Fusionner {stats.selectedCount} groupe(s)
          </Button>
        )}

        {stats.groupsWithDuplicates === 0 && (
          <Button onClick={onComplete} className="bg-green-600 hover:bg-green-700 text-white">
            <Check className="w-4 h-4 mr-2" />
            Continuer
          </Button>
        )}
      </div>
    </div>
  );
}
