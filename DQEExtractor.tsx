import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, Check, X, ChevronDown, ChevronRight, Download, Loader2, AlertCircle, Eye } from 'lucide-react';

// Types
interface SheetPreview {
  index: number;
  name: string;
  sheet_type: string;
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
  status: string;
  session_id: string;
  analysis: {
    sheets: SheetPreview[];
    summary: {
      detailed_sheets: number;
      summary_sheets: number;
      recap_sheets: number;
      total_estimated_items: number;
    };
  };
}

// Configuration API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DQEExtractor() {
  // États
  const [file, setFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetPreview[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [expandedSheet, setExpandedSheet] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [step, setStep] = useState<'upload' | 'select' | 'extract' | 'done'>('upload');

  // Upload et analyse du fichier
  const handleUpload = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/dqe/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      const data: AnalysisResult = await response.json();
      
      setSessionId(data.session_id);
      setSheets(data.analysis.sheets);
      setSummary(data.analysis.summary);
      setStep('select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [file]);

  // Basculer la sélection d'un onglet
  const toggleSheet = useCallback(async (sheetName: string) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/dqe/${sessionId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet_name: sheetName }),
      });

      const data = await response.json();
      
      setSheets(prev => prev.map(sheet => ({
        ...sheet,
        is_selected: data.selection.sheets.find((s: any) => s.name === sheet.name)?.is_selected ?? sheet.is_selected
      })));
    } catch (err) {
      console.error('Erreur toggle:', err);
    }
  }, [sessionId]);

  // Sélectionner par type
  const selectByType = useCallback(async (type: string) => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/dqe/${sessionId}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet_types: [type] }),
      });

      const data = await response.json();
      
      setSheets(prev => prev.map(sheet => ({
        ...sheet,
        is_selected: data.selection.selected_sheets.some((s: any) => s.name === sheet.name)
      })));
    } catch (err) {
      console.error('Erreur sélection:', err);
    }
  }, [sessionId]);

  // Tout sélectionner / désélectionner
  const selectAll = useCallback(async (select: boolean) => {
    if (!sessionId) return;

    const endpoint = select ? 'select/all' : 'select/none';
    
    try {
      const response = await fetch(`${API_BASE_URL}/dqe/${sessionId}/${endpoint}`, {
        method: 'POST',
      });

      const data = await response.json();
      
      setSheets(prev => prev.map(sheet => ({
        ...sheet,
        is_selected: select
      })));
    } catch (err) {
      console.error('Erreur sélection:', err);
    }
  }, [sessionId]);

  // Extraire les données
  const handleExtract = useCallback(async () => {
    if (!sessionId) return;

    setIsExtracting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/dqe/${sessionId}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ include_metadata: true, aggregate_materials: true }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'extraction');
      }

      const data = await response.json();
      setExtractionResult(data);
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsExtracting(false);
    }
  }, [sessionId]);

  // Télécharger le JSON
  const handleDownload = useCallback(async () => {
    if (!sessionId) return;

    window.open(`${API_BASE_URL}/dqe/${sessionId}/download`, '_blank');
  }, [sessionId]);

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
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Étape 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div 
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
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
                    onClick={() => toggleSheet(sheet.name)}
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
                        ~{sheet.estimated_items} items • {sheet.rows_count} lignes
                        {sheet.date && ` • ${sheet.date}`}
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
                            {sheet.sample_categories.slice(0, 4).map((cat, i) => (
                              <li key={i} className="truncate">• {cat}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-slate-700 mb-1">Exemples d'items:</p>
                          <ul className="text-slate-600 space-y-0.5">
                            {sheet.sample_items.slice(0, 4).map((item, i) => (
                              <li key={i} className="truncate">• {item}</li>
                            ))}
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
                onClick={() => {
                  setStep('upload');
                  setFile(null);
                  setSheets([]);
                  setExtractionResult(null);
                  setSessionId(null);
                }}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200"
              >
                Nouveau fichier
              </button>
            </div>

            {/* Aperçu JSON */}
            <div className="mt-6">
              <p className="font-medium text-slate-700 mb-2">Aperçu du JSON:</p>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm max-h-64">
                {JSON.stringify(extractionResult.data.sheets[0], null, 2).slice(0, 1500)}...
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
