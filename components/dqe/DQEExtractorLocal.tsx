'use client';

import React, { useState, useCallback } from 'react';
import {
  Upload, FileSpreadsheet, Check, ChevronDown, ChevronRight,
  Download, Loader2, AlertCircle, Eye, Sparkles, Settings2
} from 'lucide-react';

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

export default function DQEExtractorLocal() {
  // États
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetPreview[]>([]);
  const [summary, setSummary] = useState<AnalysisResult['summary'] | null>(null);
  const [fileInfo, setFileInfo] = useState<AnalysisResult['file_info'] | null>(null);
  const [expandedSheet, setExpandedSheet] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [step, setStep] = useState<'upload' | 'select' | 'extract' | 'done'>('upload');
  const [useAI, setUseAI] = useState(true);

  // Upload et analyse du fichier
  const handleUpload = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
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
      setFileInfo(data.file_info);
      setStep('select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  // Basculer la sélection d'un onglet (local)
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

  // Extraire les données
  const handleExtract = useCallback(async () => {
    if (!file) return;

    const selectedSheetNames = sheets.filter(s => s.is_selected).map(s => s.name);
    if (!selectedSheetNames.length) {
      setError('Veuillez sélectionner au moins un onglet');
      return;
    }

    setIsExtracting(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('selected_sheets', JSON.stringify(selectedSheetNames));
    formData.append('use_ai', useAI ? 'true' : 'false');

    try {
      const response = await fetch('/api/ai/extract-dqe?action=extract', {
        method: 'POST',
        body: formData,
      });

      const data: ExtractionResult = await response.json();

      if (!data.success) {
        throw new Error((data as any).error || 'Erreur lors de l\'extraction');
      }

      setExtractionResult(data);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsExtracting(false);
    }
  }, [file, sheets, useAI]);

  // Télécharger le JSON
  const handleDownload = useCallback(() => {
    if (!extractionResult) return;

    const jsonStr = JSON.stringify(extractionResult, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `dqe_extract_${fileInfo?.name?.replace(/\.xlsx?$/, '') || 'result'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [extractionResult, fileInfo]);

  // Réinitialiser
  const handleReset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setSheets([]);
    setSummary(null);
    setFileInfo(null);
    setExtractionResult(null);
    setError(null);
  }, []);

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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || colors.unknown}`}>
        {labels[type] || type}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            DQE Extractor
          </h1>
          <p className="text-slate-600">
            Extraction intelligente des données de Devis Quantitatif Estimatif
          </p>
        </div>

        {/* Étapes */}
        <div className="flex items-center justify-center mb-8 gap-4">
          {['Upload', 'Sélection', 'Extraction'].map((label, idx) => (
            <React.Fragment key={label}>
              <div className={`flex items-center gap-2 ${
                idx === ['upload', 'select', 'extract', 'done'].indexOf(step) ||
                (step === 'done' && idx === 2)
                  ? 'text-blue-600'
                  : idx < ['upload', 'select', 'extract', 'done'].indexOf(step)
                    ? 'text-green-600'
                    : 'text-slate-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  idx === ['upload', 'select', 'extract', 'done'].indexOf(step) ||
                  (step === 'done' && idx === 2)
                    ? 'bg-blue-600 text-white'
                    : idx < ['upload', 'select', 'extract', 'done'].indexOf(step)
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                }`}>
                  {idx < ['upload', 'select', 'extract', 'done'].indexOf(step) ? '✓' : idx + 1}
                </div>
                <span className="font-medium">{label}</span>
              </div>
              {idx < 2 && <div className="w-12 h-0.5 bg-slate-200" />}
            </React.Fragment>
          ))}
        </div>

        {/* Erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Étape 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                file ? 'border-blue-300 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const droppedFile = e.dataTransfer.files[0];
                if (droppedFile?.name.match(/\.xlsx?$/)) {
                  setFile(droppedFile);
                }
              }}
            >
              {file ? (
                <div className="flex flex-col items-center gap-4">
                  <FileSpreadsheet className="w-16 h-16 text-blue-500" />
                  <div>
                    <p className="font-semibold text-slate-800">{file.name}</p>
                    <p className="text-sm text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <Upload className="w-16 h-16 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-700">
                      Glissez votre fichier DQE ici
                    </p>
                    <p className="text-sm text-slate-500">
                      ou cliquez pour sélectionner (.xlsx, .xls)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {file && (
              <button
                onClick={handleUpload}
                disabled={isLoading}
                className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5" />
                    Analyser le fichier
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Étape 2: Sélection des onglets */}
        {step === 'select' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Résumé */}
            {summary && (
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{summary.detailed_sheets}</p>
                    <p className="text-sm text-slate-600">Détaillés</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{summary.summary_sheets}</p>
                    <p className="text-sm text-slate-600">Récapitulatifs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{summary.recap_sheets}</p>
                    <p className="text-sm text-slate-600">Totaux</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{summary.total_estimated_items}</p>
                    <p className="text-sm text-slate-600">Items estimés</p>
                  </div>
                </div>
              </div>
            )}

            {/* Options d'extraction */}
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Mode d&apos;extraction</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUseAI(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    useAI
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Avec IA (Gemini)
                </button>
                <button
                  onClick={() => setUseAI(false)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    !useAI
                      ? 'bg-slate-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Local (rapide)
                </button>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => selectAll(true)}
                className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Tout sélectionner
              </button>
              <button
                onClick={() => selectAll(false)}
                className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Tout désélectionner
              </button>
              <span className="border-l border-slate-300 mx-2" />
              <button
                onClick={() => selectByType('detailed')}
                className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"
              >
                Uniquement détaillés
              </button>
              <button
                onClick={() => selectByType('summary')}
                className="px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-lg"
              >
                Uniquement récapitulatifs
              </button>
            </div>

            {/* Liste des onglets */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sheets.map((sheet) => (
                <div
                  key={sheet.index}
                  className={`border rounded-lg transition-colors ${
                    sheet.is_selected ? 'border-blue-300 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => toggleSheet(sheet.index)}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        sheet.is_selected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {sheet.is_selected && <Check className="w-3 h-3" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{sheet.name}</span>
                        <TypeBadge type={sheet.sheet_type} />
                      </div>
                      <p className="text-sm text-slate-500">
                        ~{sheet.estimated_items} items | {sheet.rows_count} lignes
                        {sheet.date && ` | ${sheet.date}`}
                      </p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSheet(expandedSheet === sheet.index ? null : sheet.index);
                      }}
                      className="p-1 hover:bg-slate-200 rounded"
                    >
                      {expandedSheet === sheet.index ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Détails expandables */}
                  {expandedSheet === sheet.index && (
                    <div className="px-3 pb-3 pt-0 border-t border-slate-200 mt-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Catégories détectées:</p>
                          <ul className="text-slate-600 space-y-0.5">
                            {sheet.sample_categories.length > 0 ? (
                              sheet.sample_categories.slice(0, 4).map((cat, i) => (
                                <li key={i} className="truncate">• {cat}</li>
                              ))
                            ) : (
                              <li className="italic text-slate-400">Aucune détectée</li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Exemples d&apos;items:</p>
                          <ul className="text-slate-600 space-y-0.5">
                            {sheet.sample_items.length > 0 ? (
                              sheet.sample_items.slice(0, 4).map((item, i) => (
                                <li key={i} className="truncate">• {item}</li>
                              ))
                            ) : (
                              <li className="italic text-slate-400">Aucun détecté</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bouton d'extraction */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <p className="text-slate-600">
                  <span className="font-semibold text-blue-600">{selectedCount}</span> onglet(s) sélectionné(s)
                  {' • '}
                  <span className="font-semibold text-orange-600">~{estimatedItems}</span> items estimés
                </p>
                {useAI && (
                  <span className="flex items-center gap-1 text-sm text-amber-600">
                    <Sparkles className="w-4 h-4" />
                    Extraction IA active
                  </span>
                )}
              </div>

              <button
                onClick={handleExtract}
                disabled={selectedCount === 0 || isExtracting}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extraction en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Extraire les données
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Étape 3: Résultat */}
        {step === 'done' && extractionResult && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Extraction terminée !</h2>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {extractionResult.extraction_info.sheets_extracted}
                </p>
                <p className="text-sm text-slate-600">Onglets extraits</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {extractionResult.extraction_info.total_items}
                </p>
                <p className="text-sm text-slate-600">Items extraits</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-purple-600">
                  {extractionResult.aggregated_materials?.length || 0}
                </p>
                <p className="text-sm text-slate-600">Matériaux uniques</p>
              </div>
            </div>

            {/* Résumé par catégorie */}
            {extractionResult.resume_categories && Object.keys(extractionResult.resume_categories).length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-700 mb-3">Résumé par catégorie BTP</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(extractionResult.resume_categories)
                    .sort(([,a], [,b]) => b.nombre - a.nombre)
                    .slice(0, 8)
                    .map(([cat, data]) => (
                      <div key={cat} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <span className="text-sm text-slate-700 truncate">{cat}</span>
                        <span className="text-sm font-medium text-blue-600">{data.nombre} items</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Erreurs éventuelles */}
            {extractionResult.extraction_info.errors.length > 0 && (
              <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-yellow-800 mb-2">
                  {extractionResult.extraction_info.errors.length} erreur(s) lors de l&apos;extraction:
                </p>
                <ul className="text-sm text-yellow-700">
                  {extractionResult.extraction_info.errors.map((err, i) => (
                    <li key={i}>• {err.sheet}: {err.error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleDownload}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Télécharger le JSON
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
              >
                Nouveau fichier
              </button>
            </div>

            {/* Aperçu JSON */}
            <div className="mt-6">
              <p className="font-medium text-slate-700 mb-2">Aperçu du JSON:</p>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm max-h-64">
                {JSON.stringify(extractionResult.data.sheets[0], null, 2)?.slice(0, 2000)}...
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
