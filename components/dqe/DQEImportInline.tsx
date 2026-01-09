'use client';

import React, { useState, useCallback } from 'react';
import {
  FileSpreadsheet, Check, ChevronDown, ChevronRight,
  Loader2, AlertCircle, Sparkles, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Types
interface SheetPreview {
  index: number;
  name: string;
  sheet_type: 'detailed' | 'summary' | 'recap' | 'unknown';
  rows_count: number;
  cols_count: number;
  estimated_items: number;
  date?: string;
  building_ref?: string;
  devis_ref?: string;
  sample_categories: string[];
  sample_items: string[];
  is_selected: boolean;
}

interface AnalysisResult {
  success: boolean;
  status: string;
  file_info: {
    name: string;
    size: number;
    total_sheets: number;
  };
  sheets: SheetPreview[];
  summary: {
    detailed_sheets: number;
    summary_sheets: number;
    recap_sheets: number;
    total_estimated_items: number;
  };
}

interface ExtractionResult {
  success: boolean;
  status: string;
  extraction_info: {
    timestamp: string;
    sheets_extracted: number;
    total_items: number;
    errors: { sheet: string; error: string }[];
  };
  data: {
    source_file: string;
    sheets: any[];
  };
  resume_categories: Record<string, { nombre: number; total: number }>;
  aggregated_materials: any[];
}

interface DQEImportInlineProps {
  file: File;
  projectId: string;
  onComplete: (result: ExtractionResult) => void;
  onCancel: () => void;
  onProgress?: (progress: number, status: string) => void;
}

export default function DQEImportInline({
  file,
  projectId,
  onComplete,
  onCancel,
  onProgress
}: DQEImportInlineProps) {
  const [step, setStep] = useState<'analyzing' | 'select' | 'extracting'>('analyzing');
  const [sheets, setSheets] = useState<SheetPreview[]>([]);
  const [summary, setSummary] = useState<AnalysisResult['summary'] | null>(null);
  const [expandedSheet, setExpandedSheet] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(true); // true = Local + amélioration catégories Gemini

  // Analyser le fichier au montage
  React.useEffect(() => {
    analyzeFile();
  }, []);

  const analyzeFile = async () => {
    onProgress?.(10, 'Analyse du fichier DQE...');
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ai/extract-dqe?action=analyze', {
        method: 'POST',
        body: formData,
      });

      const data: AnalysisResult = await response.json();

      if (!data.success) {
        throw new Error((data as any).error || 'Erreur lors de l\'analyse');
      }

      setSheets(data.sheets);
      setSummary(data.summary);
      setStep('select');
      onProgress?.(30, 'Sélectionnez les onglets à extraire');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  // Basculer la sélection d'un onglet
  const toggleSheet = useCallback((sheetIndex: number) => {
    setSheets(prev => prev.map(sheet =>
      sheet.index === sheetIndex
        ? { ...sheet, is_selected: !sheet.is_selected }
        : sheet
    ));
  }, []);

  // Tout sélectionner / désélectionner
  const selectAll = useCallback((select: boolean) => {
    setSheets(prev => prev.map(sheet => ({ ...sheet, is_selected: select })));
  }, []);

  // Sélectionner par type
  const selectByType = useCallback((type: string) => {
    setSheets(prev => prev.map(sheet => ({
      ...sheet,
      is_selected: sheet.sheet_type === type
    })));
  }, []);

  // Lancer l'extraction
  const handleExtract = async () => {
    const selectedSheetNames = sheets.filter(s => s.is_selected).map(s => s.name);
    if (!selectedSheetNames.length) {
      setError('Veuillez sélectionner au moins un onglet');
      return;
    }

    setStep('extracting');
    setError(null);
    onProgress?.(50, `Extraction de ${selectedSheetNames.length} onglet(s)...`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('selected_sheets', JSON.stringify(selectedSheetNames));
    formData.append('use_ai', useAI ? 'true' : 'false');

    // Timeout côté client de 55 secondes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    try {
      const response = await fetch('/api/ai/extract-dqe?action=extract', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Vérifier si la réponse est du JSON valide
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error('Réponse non-JSON:', text.substring(0, 200));
        throw new Error('Le serveur a renvoyé une erreur. Essayez le mode Local.');
      }

      const data: ExtractionResult = await response.json();

      if (!data.success) {
        throw new Error((data as any).error || (data as any).details || 'Erreur lors de l\'extraction');
      }

      onProgress?.(100, 'Extraction terminée !');
      onComplete(data);
    } catch (err: any) {
      clearTimeout(timeoutId);

      let errorMessage = 'Erreur inconnue';
      if (err.name === 'AbortError') {
        errorMessage = 'Timeout - Essayez le mode Local (plus rapide)';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setStep('select');
    }
  };

  // Nombre d'onglets sélectionnés
  const selectedCount = sheets.filter(s => s.is_selected).length;
  const estimatedItems = sheets.filter(s => s.is_selected).reduce((sum, s) => sum + s.estimated_items, 0);

  // Badge de type d'onglet
  const TypeBadge = ({ type }: { type: string }) => {
    const colors: Record<string, string> = {
      detailed: 'bg-blue-100 text-blue-800',
      summary: 'bg-green-100 text-green-800',
      recap: 'bg-purple-100 text-purple-800',
      unknown: 'bg-gray-100 text-gray-800',
    };

    const labels: Record<string, string> = {
      detailed: 'Détaillé',
      summary: 'Récapitulatif',
      recap: 'Totaux',
      unknown: 'Autre',
    };

    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] || colors.unknown}`}>
        {labels[type] || type}
      </span>
    );
  };

  // Affichage pendant l'analyse
  if (step === 'analyzing') {
    return (
      <div className="py-8 text-center">
        <div className="w-16 h-16 border-4 border-[#5B5FC7]/20 border-t-[#5B5FC7] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-semibold text-[#4A5568]">Analyse du fichier DQE...</p>
        <p className="text-sm text-[#718096] mt-2">{file.name}</p>
      </div>
    );
  }

  // Affichage pendant l'extraction
  if (step === 'extracting') {
    return (
      <div className="py-8 text-center">
        <div className="w-16 h-16 border-4 border-[#48BB78]/20 border-t-[#48BB78] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-semibold text-[#4A5568]">
          Extraction de {selectedCount} onglet(s)...
        </p>
        <p className="text-sm text-[#718096] mt-2">
          {useAI ? 'Avec classification IA (Gemini)' : 'Mode local rapide'}
        </p>
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

      {/* Info fichier */}
      <div className="flex items-center gap-3 p-3 bg-[#5B5FC7]/5 rounded-lg">
        <FileSpreadsheet className="w-8 h-8 text-[#5B5FC7]" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#4A5568] truncate">{file.name}</p>
          <p className="text-xs text-[#718096]">
            {sheets.length} onglets détectés | ~{summary?.total_estimated_items || 0} items estimés
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour
        </Button>
      </div>

      {/* Résumé */}
      {summary && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-blue-50 rounded-lg">
            <p className="text-lg font-bold text-blue-600">{summary.detailed_sheets}</p>
            <p className="text-xs text-slate-600">Détaillés</p>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <p className="text-lg font-bold text-green-600">{summary.summary_sheets}</p>
            <p className="text-xs text-slate-600">Récap</p>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg">
            <p className="text-lg font-bold text-purple-600">{summary.recap_sheets}</p>
            <p className="text-xs text-slate-600">Totaux</p>
          </div>
          <div className="p-2 bg-orange-50 rounded-lg">
            <p className="text-lg font-bold text-orange-600">{summary.total_estimated_items}</p>
            <p className="text-xs text-slate-600">Items</p>
          </div>
        </div>
      )}

      {/* Mode d'extraction */}
      <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-lg">
        <span className="text-sm font-medium text-amber-800">Mode d&apos;extraction</span>
        <div className="flex gap-1">
          <button
            onClick={() => setUseAI(true)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
              useAI ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-300'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            IA
          </button>
          <button
            onClick={() => setUseAI(false)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
              !useAI ? 'bg-slate-600 text-white' : 'bg-white text-slate-700 border border-slate-300'
            }`}
          >
            Local
          </button>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => selectAll(true)}
          className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
        >
          Tout
        </button>
        <button
          onClick={() => selectAll(false)}
          className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
        >
          Aucun
        </button>
        <span className="border-l border-slate-300 mx-1" />
        <button
          onClick={() => selectByType('detailed')}
          className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded"
        >
          Détaillés
        </button>
        <button
          onClick={() => selectByType('summary')}
          className="px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded"
        >
          Récap
        </button>
      </div>

      {/* Liste des onglets */}
      <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-1">
        {sheets.map((sheet) => (
          <div
            key={sheet.index}
            className={`border rounded transition-colors ${
              sheet.is_selected ? 'border-blue-300 bg-blue-50' : 'border-slate-200'
            }`}
          >
            <div
              className="flex items-center gap-2 p-2 cursor-pointer"
              onClick={() => toggleSheet(sheet.index)}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  sheet.is_selected
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {sheet.is_selected && <Check className="w-2.5 h-2.5" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm text-slate-800 truncate">{sheet.name}</span>
                  <TypeBadge type={sheet.sheet_type} />
                </div>
                <p className="text-xs text-slate-500">
                  ~{sheet.estimated_items} items | {sheet.rows_count} lignes
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedSheet(expandedSheet === sheet.index ? null : sheet.index);
                }}
                className="p-0.5 hover:bg-slate-200 rounded flex-shrink-0"
              >
                {expandedSheet === sheet.index ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Détails */}
            {expandedSheet === sheet.index && (
              <div className="px-2 pb-2 pt-0 border-t border-slate-200 mt-1">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="font-medium text-slate-700">Catégories:</p>
                    {sheet.sample_categories.length > 0 ? (
                      sheet.sample_categories.slice(0, 3).map((cat, i) => (
                        <p key={i} className="text-slate-600 truncate">• {cat}</p>
                      ))
                    ) : (
                      <p className="text-slate-400 italic">Aucune</p>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Items:</p>
                    {sheet.sample_items.length > 0 ? (
                      sheet.sample_items.slice(0, 3).map((item, i) => (
                        <p key={i} className="text-slate-600 truncate">• {item}</p>
                      ))
                    ) : (
                      <p className="text-slate-400 italic">Aucun</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-blue-600">{selectedCount}</span> onglet(s)
          {' • '}
          <span className="font-semibold text-orange-600">~{estimatedItems}</span> items
        </p>
        <Button
          onClick={handleExtract}
          disabled={selectedCount === 0}
          className="bg-gradient-to-r from-[#48BB78] to-[#38A169] hover:from-[#38A169] hover:to-[#2F855A] text-white"
        >
          <Loader2 className="w-4 h-4 mr-2 hidden" />
          Extraire
        </Button>
      </div>
    </div>
  );
}
