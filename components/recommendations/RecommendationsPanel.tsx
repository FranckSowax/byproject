"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  TrendingDown, 
  Package, 
  Users, 
  Clock, 
  Sparkles,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Recommendation {
  type: 'alternative' | 'bulk_discount' | 'quantity_optimization' | 'grouping' | 'timing';
  priority: 'high' | 'medium' | 'low';
  materialId: string;
  materialName: string;
  title: string;
  description: string;
  potentialSavings: number;
  savingsPercentage: number;
  actionable: boolean;
  action?: string;
  details?: any;
}

interface RecommendationsPanelProps {
  projectId: string;
}

export function RecommendationsPanel({ projectId }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadRecommendations();
  }, [projectId]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to load recommendations');
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setStatistics(data.statistics);
      
      if (data.recommendations.length > 0) {
        toast.success(`${data.recommendations.length} recommandations générées !`);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast.error('Erreur lors du chargement des recommandations');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alternative':
        return <Lightbulb className="h-5 w-5" />;
      case 'bulk_discount':
        return <Package className="h-5 w-5" />;
      case 'grouping':
        return <Users className="h-5 w-5" />;
      case 'timing':
        return <Clock className="h-5 w-5" />;
      default:
        return <TrendingDown className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'alternative':
        return 'Alternative';
      case 'bulk_discount':
        return 'Remise en gros';
      case 'grouping':
        return 'Groupement';
      case 'timing':
        return 'Timing';
      default:
        return 'Optimisation';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Recommandations IA</CardTitle>
              <CardDescription>Analyse en cours...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
            <p className="text-gray-600">Génération des recommandations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Recommandations IA</CardTitle>
              <CardDescription>Aucune recommandation disponible</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <p>Ajoutez des prix à vos matériaux pour obtenir des recommandations personnalisées.</p>
            <Button 
              onClick={loadRecommendations} 
              className="mt-4"
              variant="outline"
            >
              Rafraîchir
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Recommandations IA</CardTitle>
              <CardDescription>
                {recommendations.length} opportunités d'économies détectées
              </CardDescription>
            </div>
          </div>
          <Button 
            onClick={loadRecommendations} 
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rafraîchir'}
          </Button>
        </div>

        {/* Statistiques */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl p-4 border-2 border-purple-100">
              <p className="text-sm text-gray-600 mb-1">Économies potentielles</p>
              <p className="text-2xl font-bold text-purple-600">
                {statistics.totalPotentialSavings.toLocaleString()} FCFA
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-orange-100">
              <p className="text-sm text-gray-600 mb-1">Priorité haute</p>
              <p className="text-2xl font-bold text-orange-600">
                {statistics.highPriorityCount} recommandations
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-blue-100">
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-600">
                {statistics.totalRecommendations} opportunités
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <Card 
              key={index} 
              className="border-2 hover:shadow-lg transition-all overflow-hidden"
            >
              {/* Barre de priorité */}
              <div className={`h-2 ${
                rec.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                rec.priority === 'medium' ? 'bg-gradient-to-r from-orange-500 to-yellow-500' :
                'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`} />

              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                    rec.priority === 'medium' ? 'bg-orange-100 text-orange-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {getTypeIcon(rec.type)}
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">
                        {rec.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority === 'high' ? 'Priorité haute' :
                           rec.priority === 'medium' ? 'Priorité moyenne' :
                           'Priorité basse'}
                        </Badge>
                        <Badge variant="outline">
                          {getTypeLabel(rec.type)}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">
                      {rec.description}
                    </p>

                    {/* Économies */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-50 px-4 py-2 rounded-lg border-2 border-green-200">
                          <p className="text-sm text-green-700 font-medium">Économie estimée</p>
                          <p className="text-xl font-bold text-green-600">
                            {rec.potentialSavings.toLocaleString()} FCFA
                          </p>
                          <p className="text-xs text-green-600">
                            (-{rec.savingsPercentage.toFixed(0)}%)
                          </p>
                        </div>

                        {rec.details && rec.details.supplier && (
                          <div className="text-sm text-gray-600">
                            <p className="font-medium">Fournisseur recommandé:</p>
                            <p>{rec.details.supplier.supplier_name} ({rec.details.supplier.country})</p>
                          </div>
                        )}
                      </div>

                      {rec.actionable && rec.action && (
                        <Button 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                        >
                          {rec.action}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
