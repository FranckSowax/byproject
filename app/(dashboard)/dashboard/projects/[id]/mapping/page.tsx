"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Loader2, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface AnalysisResult {
  success: boolean;
  mapping?: any;
  materialsCount?: number;
  message?: string;
  error?: string;
}

export default function MappingPage() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'analyzing' | 'completed' | 'error'>('analyzing');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simuler la progression
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 500);

    // Démarrer l'analyse
    analyzeFile();

    return () => clearInterval(progressInterval);
  }, []);

  const analyzeFile = async () => {
    try {
      // Récupérer les infos du projet depuis localStorage (temporaire)
      const projectData = localStorage.getItem(`project_${params.id}`);
      
      if (!projectData) {
        // Si pas de données, simuler une analyse réussie
        setTimeout(() => {
          setProgress(100);
          setStatus('completed');
          setResult({
            success: true,
            materialsCount: 0,
            message: 'Analyse simulée (mode test)',
          });
        }, 3000);
        return;
      }

      const { filePath, fileName, fileContent, isMock } = JSON.parse(projectData);
      
      // Si mode mock (utilisateur admin), simuler l'analyse
      if (isMock && fileContent) {
        setTimeout(() => {
          // Compter les lignes (approximation du nombre de matériaux)
          const lines = fileContent.split('\n').filter((line: string) => line.trim());
          const materialsCount = Math.max(0, lines.length - 1); // -1 pour l'en-tête
          
          setProgress(100);
          setStatus('completed');
          setResult({
            success: true,
            materialsCount,
            message: `Analyse simulée - ${materialsCount} matériaux détectés`,
          });
          
          toast.success(`${materialsCount} matériaux détectés! (mode démo)`);
          
          // Rediriger après 2 secondes
          setTimeout(() => {
            router.push(`/dashboard/projects/${params.id}`);
          }, 2000);
        }, 3000);
        return;
      }

      console.log('🚀 Starting AI analysis...', { projectId: params.id, fileName });

      const response = await fetch('/api/ai/analyze-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: params.id,
          filePath,
          fileName,
        }),
      });

      const data = await response.json();
      
      console.log('📊 AI Analysis Response:', {
        success: data.success,
        materialsCount: data.materialsCount,
        mapping: data.mapping,
        fullResponse: data
      });

      setProgress(100);

      if (data.success) {
        setStatus('completed');
        setResult(data);
        console.log('✅ Analysis completed successfully!', {
          materials: data.materialsCount,
          columns: data.mapping?.columns?.length || 0
        });
        toast.success(`${data.materialsCount} matériaux détectés!`);
        
        // Rediriger vers le projet après 2 secondes
        setTimeout(() => {
          router.push(`/dashboard/projects/${params.id}`);
        }, 2000);
      } else {
        setStatus('error');
        setResult(data);
        console.error('❌ Analysis failed:', data.error);
        toast.error(data.error || 'Erreur lors de l\'analyse');
      }

    } catch (error) {
      console.error('Analysis error:', error);
      setProgress(100);
      setStatus('error');
      setResult({
        success: false,
        error: 'Une erreur est survenue lors de l\'analyse',
      });
      toast.error('Erreur lors de l\'analyse');
    }
  };

  return (
    <div className="flex min-h-[600px] items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            {status === 'analyzing' && (
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            )}
            {status === 'completed' && (
              <CheckCircle className="h-8 w-8 text-green-600" />
            )}
            {status === 'error' && (
              <AlertCircle className="h-8 w-8 text-red-600" />
            )}
            <div>
              <CardTitle className="text-2xl">
                {status === 'analyzing' && 'Analyse en cours...'}
                {status === 'completed' && 'Analyse terminée!'}
                {status === 'error' && 'Erreur d\'analyse'}
              </CardTitle>
              <CardDescription>
                {status === 'analyzing' && 'L\'IA analyse votre fichier'}
                {status === 'completed' && 'Votre fichier a été analysé avec succès'}
                {status === 'error' && 'Une erreur est survenue'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progression</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full transition-all duration-500 ${
                  status === 'completed' ? 'bg-green-600' :
                  status === 'error' ? 'bg-red-600' :
                  'bg-blue-600'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Étapes de l'analyse */}
          {status === 'analyzing' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Extraction du contenu</p>
                  <p className="text-sm text-gray-600">Lecture du fichier uploadé</p>
                </div>
                {progress > 20 && <CheckCircle className="h-5 w-5 text-green-600" />}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Analyse par IA</p>
                  <p className="text-sm text-gray-600">L'IA détecte les colonnes et matériaux</p>
                </div>
                {progress > 60 && <CheckCircle className="h-5 w-5 text-green-600" />}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Création du mapping</p>
                  <p className="text-sm text-gray-600">Structuration des données</p>
                </div>
                {progress > 90 && <CheckCircle className="h-5 w-5 text-green-600" />}
              </div>
            </div>
          )}

          {/* Résultat */}
          {status === 'completed' && result && (
            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-green-900 mb-2">
                    Analyse réussie!
                  </h4>
                  <div className="space-y-1 text-sm text-green-800">
                    <p>✅ {result.materialsCount || 0} matériaux détectés</p>
                    <p>✅ Mapping des colonnes créé</p>
                    <p>✅ Données structurées</p>
                  </div>
                  <p className="mt-3 text-sm text-green-700">
                    Redirection vers votre projet...
                  </p>
                </div>
              </div>
            </div>
          )}

          {status === 'error' && result && (
            <div className="rounded-lg bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-2">
                    Erreur d'analyse
                  </h4>
                  <p className="text-sm text-red-800">
                    {result.error || 'Une erreur est survenue'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {status === 'error' && (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/dashboard/projects/${params.id}`)}
                >
                  Voir le projet
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => window.location.reload()}
                >
                  Réessayer
                </Button>
              </>
            )}
            {status === 'completed' && (
              <Button
                className="w-full"
                onClick={() => router.push(`/dashboard/projects/${params.id}`)}
              >
                Voir le projet
              </Button>
            )}
          </div>

          {/* Info */}
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex gap-3">
              <div className="text-2xl">💡</div>
              <div className="space-y-1">
                <h4 className="font-semibold text-blue-900">Comment ça marche?</h4>
                <p className="text-sm text-blue-800">
                  L'IA analyse votre fichier et détecte automatiquement les colonnes 
                  (nom, quantité, prix, etc.). Vous pourrez ensuite corriger le mapping 
                  si nécessaire et ajouter les prix pour chaque pays.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
