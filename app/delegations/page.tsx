"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  Plane,
  Building2,
  Calendar,
  Users,
  ChevronRight,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  Globe,
  Target
} from 'lucide-react';

interface Mission {
  id: string;
  title: string;
  description: string;
  organization_name: string;
  status: string;
  completion_percentage: number;
  start_date: string;
  end_date: string;
  ai_context_data: any;
  created_at: string;
}

export default function DelegationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('missions' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMissions((data || []) as unknown as Mission[]);
    } catch (error: any) {
      console.error('Error loading missions:', error);
      toast.error("Erreur lors du chargement des missions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Brouillon', className: 'bg-slate-100 text-slate-700' },
      analyzing: { label: 'Analyse IA', className: 'bg-blue-100 text-blue-700' },
      proposal_ready: { label: 'Proposition prête', className: 'bg-purple-100 text-purple-700' },
      active: { label: 'En cours', className: 'bg-emerald-100 text-emerald-700' },
      completed: { label: 'Terminée', className: 'bg-green-100 text-green-700' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const filteredMissions = missions.filter(mission =>
    mission.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mission.organization_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-600">Chargement des missions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Plane className="h-5 w-5 text-white" />
                </div>
                Missions & Délégations
              </h1>
              <p className="text-slate-500 mt-1">
                Gérez vos missions officielles et projets d'approvisionnement
              </p>
            </div>
            <Button 
              onClick={() => router.push('/delegations/new')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle mission
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une mission..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtres
          </Button>
        </div>

        {/* Missions Grid */}
        {filteredMissions.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <Plane className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {searchQuery ? 'Aucune mission trouvée' : 'Aucune mission'}
              </h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                {searchQuery 
                  ? 'Essayez avec d\'autres termes de recherche'
                  : 'Créez votre première mission pour commencer à gérer vos délégations officielles et projets d\'approvisionnement.'
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => router.push('/delegations/new')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une mission
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMissions.map((mission) => (
              <Card 
                key={mission.id} 
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(`/delegations/${mission.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors line-clamp-1">
                        {mission.title || 'Mission sans titre'}
                      </CardTitle>
                      {mission.organization_name && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3" />
                          {mission.organization_name}
                        </CardDescription>
                      )}
                    </div>
                    {getStatusBadge(mission.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {mission.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {mission.description}
                    </p>
                  )}

                  {/* Info badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mission.ai_context_data?.dimensions?.country && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-xs text-slate-600">
                        <Globe className="h-3 w-3" />
                        {mission.ai_context_data.dimensions.country}
                      </span>
                    )}
                    {mission.ai_context_data?.dimensions?.teamSize && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-xs text-slate-600">
                        <Users className="h-3 w-3" />
                        {mission.ai_context_data.dimensions.teamSize} pers.
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  {mission.completion_percentage > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Progression</span>
                        <span className="font-medium">{mission.completion_percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${mission.completion_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      {new Date(mission.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
