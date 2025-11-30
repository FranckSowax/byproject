"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Calendar,
  Settings,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Truck,
  Factory,
  FileCheck,
  Send,
  Plus,
  MoreVertical,
  ChevronRight,
  Loader2,
  Building2,
  Globe,
  Target,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import AddMissionMaterialModal from '@/components/missions/AddMissionMaterialModal';

// Types
interface Mission {
  id: string;
  title: string;
  description: string;
  organization_name: string;
  status: string;
  sector: string;
  total_budget: number;
  spent_budget: number;
  completion_percentage: number;
  start_date: string;
  end_date: string;
  ai_context_data: any;
  white_label_config: any;
  created_at: string;
}

interface MissionStep {
  id: string;
  title: string;
  description: string;
  step_type: string;
  step_order: number;
  status: string;
  completion_percentage: number;
  planned_start_date: string;
  planned_end_date: string;
  actual_start_date: string;
  actual_end_date: string;
}

interface MissionMaterial {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  priority: string;
  images: string[];
  prices_count?: number;
}

interface MissionStats {
  totalMaterials: number;
  quotedMaterials: number;
  orderedMaterials: number;
  deliveredMaterials: number;
  totalRfqs: number;
  pendingRfqs: number;
}

type TabType = 'overview' | 'materials' | 'quotations' | 'timeline' | 'team' | 'documents' | 'settings';

export default function MissionDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const missionId = params.id as string;

  // États
  const [loading, setLoading] = useState(true);
  const [mission, setMission] = useState<Mission | null>(null);
  const [steps, setSteps] = useState<MissionStep[]>([]);
  const [materials, setMaterials] = useState<MissionMaterial[]>([]);
  const [stats, setStats] = useState<MissionStats>({
    totalMaterials: 0,
    quotedMaterials: 0,
    orderedMaterials: 0,
    deliveredMaterials: 0,
    totalRfqs: 0,
    pendingRfqs: 0
  });
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);

  // Charger les données de la mission
  useEffect(() => {
    loadMissionData();
  }, [missionId]);

  const loadMissionData = async () => {
    setLoading(true);
    try {
      // Charger la mission (cast as any car les types ne sont pas encore générés)
      const { data: missionData, error: missionError } = await supabase
        .from('missions' as any)
        .select('*')
        .eq('id', missionId)
        .single();

      if (missionError) throw missionError;
      setMission(missionData as unknown as Mission);

      // Charger les étapes
      const { data: stepsData } = await supabase
        .from('mission_steps' as any)
        .select('*')
        .eq('mission_id', missionId)
        .order('step_order', { ascending: true });

      setSteps((stepsData || []) as unknown as MissionStep[]);

      // Charger les matériaux
      const { data: materialsData } = await supabase
        .from('mission_materials' as any)
        .select('*')
        .eq('mission_id', missionId)
        .order('created_at', { ascending: false });

      const typedMaterials = (materialsData || []) as unknown as MissionMaterial[];
      setMaterials(typedMaterials);

      // Calculer les stats
      if (typedMaterials.length > 0) {
        setStats({
          totalMaterials: typedMaterials.length,
          quotedMaterials: typedMaterials.filter(m => m.status === 'quoted').length,
          orderedMaterials: typedMaterials.filter(m => m.status === 'ordered').length,
          deliveredMaterials: typedMaterials.filter(m => m.status === 'delivered').length,
          totalRfqs: 0,
          pendingRfqs: 0
        });
      }

    } catch (error: any) {
      console.error('Error loading mission:', error);
      toast.error("Erreur lors du chargement de la mission");
    } finally {
      setLoading(false);
    }
  };

  // Onglets de navigation
  const tabs = [
    { id: 'overview' as TabType, label: 'Vue d\'ensemble', icon: LayoutDashboard },
    { id: 'materials' as TabType, label: 'Matériaux', icon: Package, count: stats.totalMaterials },
    { id: 'quotations' as TabType, label: 'Cotations', icon: FileText, count: stats.totalRfqs },
    { id: 'timeline' as TabType, label: 'Suivi', icon: Calendar },
    { id: 'team' as TabType, label: 'Équipe', icon: Users },
    { id: 'documents' as TabType, label: 'Documents', icon: FileCheck },
    { id: 'settings' as TabType, label: 'Paramètres', icon: Settings },
  ];

  // Statut badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      draft: { label: 'Brouillon', variant: 'secondary', className: 'bg-slate-100 text-slate-700' },
      analyzing: { label: 'Analyse IA', variant: 'default', className: 'bg-blue-100 text-blue-700' },
      proposal_ready: { label: 'Proposition prête', variant: 'default', className: 'bg-purple-100 text-purple-700' },
      active: { label: 'En cours', variant: 'default', className: 'bg-emerald-100 text-emerald-700' },
      completed: { label: 'Terminée', variant: 'default', className: 'bg-green-100 text-green-700' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Step status icon
  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'blocked': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <div className="h-5 w-5 rounded-full border-2 border-slate-300" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-slate-600">Chargement de la mission...</p>
        </div>
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-semibold">Mission introuvable</h2>
            <p className="text-slate-600">Cette mission n'existe pas ou vous n'y avez pas accès.</p>
            <Button onClick={() => router.push('/dashboard')}>
              Retour au dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header avec branding white-label */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Back + Mission info */}
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/dashboard')}
                className="text-slate-600"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour
              </Button>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-slate-900 truncate max-w-[300px]">
                    {mission.title}
                  </h1>
                  {getStatusBadge(mission.status)}
                </div>
                {mission.organization_name && (
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {mission.organization_name}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Send className="h-4 w-4 mr-1.5" />
                Nouvelle cotation
              </Button>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowAddMaterialModal(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Ajouter matériau
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-xs",
                    activeTab === tab.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stats.totalMaterials}</p>
                      <p className="text-sm text-slate-500">Matériaux</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stats.quotedMaterials}</p>
                      <p className="text-sm text-slate-500">Cotés</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Truck className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stats.orderedMaterials}</p>
                      <p className="text-sm text-slate-500">Commandés</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {mission.completion_percentage || 0}%
                      </p>
                      <p className="text-sm text-slate-500">Avancement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress + Timeline */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Mission Progress */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Progression de la mission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Overall progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Avancement global</span>
                        <span className="text-sm font-bold text-blue-600">{mission.completion_percentage || 0}%</span>
                      </div>
                      <Progress value={mission.completion_percentage || 0} className="h-3" />
                    </div>

                    {/* Steps timeline */}
                    <div className="space-y-3">
                      {steps.slice(0, 5).map((step, index) => (
                        <div key={step.id} className="flex items-center gap-4">
                          {getStepStatusIcon(step.status)}
                          <div className="flex-1">
                            <p className={cn(
                              "text-sm font-medium",
                              step.status === 'completed' ? "text-emerald-700" :
                              step.status === 'in_progress' ? "text-blue-700" : "text-slate-600"
                            )}>
                              {step.title}
                            </p>
                          </div>
                          {step.completion_percentage > 0 && step.status !== 'completed' && (
                            <span className="text-xs text-slate-500">{step.completion_percentage}%</span>
                          )}
                        </div>
                      ))}
                      {steps.length > 5 && (
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab('timeline')} className="w-full">
                          Voir toutes les étapes
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Informations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mission.ai_context_data?.dimensions && (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Globe className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Destination</p>
                          <p className="font-medium text-slate-900">
                            {mission.ai_context_data.dimensions.country}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Users className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Équipe</p>
                          <p className="font-medium text-slate-900">
                            {mission.ai_context_data.dimensions.teamSize} participants
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">Période</p>
                          <p className="font-medium text-slate-900">
                            {new Date(mission.ai_context_data.dimensions.startDate).toLocaleDateString('fr-FR')}
                            {mission.ai_context_data.dimensions.endDate && (
                              <> → {new Date(mission.ai_context_data.dimensions.endDate).toLocaleDateString('fr-FR')}</>
                            )}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {mission.total_budget && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-xs text-emerald-600">Budget</p>
                        <p className="font-bold text-emerald-700">
                          {new Intl.NumberFormat('fr-FR').format(mission.total_budget)} {mission.ai_context_data?.dimensions?.currency || 'XAF'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Materials */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Matériaux récents
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('materials')}>
                  Voir tout
                </Button>
              </CardHeader>
              <CardContent>
                {materials.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p className="font-medium">Aucun matériau</p>
                    <p className="text-sm">Ajoutez des matériaux pour commencer le sourcing</p>
                    <Button className="mt-4" size="sm" onClick={() => setShowAddMaterialModal(true)}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Ajouter un matériau
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {materials.slice(0, 5).map((material) => (
                      <div key={material.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Package className="h-5 w-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{material.name}</p>
                            <p className="text-sm text-slate-500">
                              {material.quantity} {material.unit} • {material.category || 'Non catégorisé'}
                            </p>
                          </div>
                        </div>
                        <Badge className={cn(
                          material.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          material.status === 'ordered' ? 'bg-purple-100 text-purple-700' :
                          material.status === 'quoted' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        )}>
                          {material.status === 'delivered' ? 'Livré' :
                           material.status === 'ordered' ? 'Commandé' :
                           material.status === 'quoted' ? 'Coté' : 'En attente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Matériaux & Fournitures</h2>
                <p className="text-slate-500">Gérez les matériaux nécessaires à votre mission</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddMaterialModal(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Ajouter un matériau
              </Button>
            </div>

            {materials.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun matériau</h3>
                  <p className="text-slate-500 mb-6 max-w-md mx-auto">
                    Commencez par ajouter les matériaux et fournitures nécessaires à votre mission. 
                    Vous pourrez ensuite demander des cotations aux fournisseurs.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddMaterialModal(true)}>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Ajouter le premier matériau
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {materials.map((material) => (
                  <Card key={material.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center">
                            {material.images?.[0] ? (
                              <img src={material.images[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <Package className="h-8 w-8 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{material.name}</h3>
                            <p className="text-sm text-slate-500">
                              {material.quantity} {material.unit} • {material.category || 'Non catégorisé'}
                            </p>
                            {material.description && (
                              <p className="text-sm text-slate-400 mt-1 line-clamp-1">{material.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={cn(
                            material.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                            material.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            'bg-slate-100 text-slate-700'
                          )}>
                            {material.priority === 'urgent' ? 'Urgent' :
                             material.priority === 'high' ? 'Prioritaire' : 'Normal'}
                          </Badge>
                          <Badge className={cn(
                            material.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            material.status === 'ordered' ? 'bg-purple-100 text-purple-700' :
                            material.status === 'quoted' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          )}>
                            {material.status === 'delivered' ? 'Livré' :
                             material.status === 'ordered' ? 'Commandé' :
                             material.status === 'quoted' ? 'Coté' : 'En attente'}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Suivi de Mission</h2>
              <p className="text-slate-500">Suivez l'avancement de chaque étape de votre mission</p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex gap-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          step.status === 'completed' ? "bg-emerald-100" :
                          step.status === 'in_progress' ? "bg-blue-100" :
                          step.status === 'blocked' ? "bg-red-100" : "bg-slate-100"
                        )}>
                          {getStepStatusIcon(step.status)}
                        </div>
                        {index < steps.length - 1 && (
                          <div className={cn(
                            "w-0.5 flex-1 my-2",
                            step.status === 'completed' ? "bg-emerald-300" : "bg-slate-200"
                          )} />
                        )}
                      </div>

                      {/* Step content */}
                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={cn(
                              "font-semibold",
                              step.status === 'completed' ? "text-emerald-700" :
                              step.status === 'in_progress' ? "text-blue-700" : "text-slate-700"
                            )}>
                              {step.title}
                            </h3>
                            {step.description && (
                              <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                            )}
                            {step.planned_start_date && (
                              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(step.planned_start_date).toLocaleDateString('fr-FR')}
                                {step.planned_end_date && (
                                  <> → {new Date(step.planned_end_date).toLocaleDateString('fr-FR')}</>
                                )}
                              </p>
                            )}
                          </div>
                          {step.status === 'in_progress' && (
                            <Badge className="bg-blue-100 text-blue-700">En cours</Badge>
                          )}
                        </div>

                        {step.status === 'in_progress' && step.completion_percentage > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                              <span>Progression</span>
                              <span>{step.completion_percentage}%</span>
                            </div>
                            <Progress value={step.completion_percentage} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {steps.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="font-medium">Aucune étape définie</p>
                      <p className="text-sm">Les étapes seront créées automatiquement</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quotations Tab */}
        {activeTab === 'quotations' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Demandes de Cotation</h2>
                <p className="text-slate-500">Gérez vos demandes de prix aux fournisseurs</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-1.5" />
                Nouvelle demande
              </Button>
            </div>

            <Card>
              <CardContent className="py-16 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune demande de cotation</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Sélectionnez des matériaux et envoyez une demande de cotation aux fournisseurs pour recevoir leurs offres.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-1.5" />
                  Créer une demande
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Équipe de Mission</h2>
                <p className="text-slate-500">Gérez les membres de votre délégation</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-1.5" />
                Ajouter un membre
              </Button>
            </div>

            <Card>
              <CardContent className="py-16 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun membre</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Ajoutez les membres de votre délégation pour faciliter la coordination et le suivi.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Ajouter le premier membre
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Documents</h2>
                <p className="text-slate-500">Tous les documents liés à votre mission</p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-1.5" />
                Uploader un document
              </Button>
            </div>

            <Card>
              <CardContent className="py-16 text-center">
                <FileCheck className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun document</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Uploadez vos contrats, factures, certificats et autres documents importants.
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Uploader un document
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Paramètres de la Mission</h2>
              <p className="text-slate-500">Configurez les options de votre mission</p>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations générales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Nom de la mission</label>
                    <p className="text-slate-900">{mission.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Organisation</label>
                    <p className="text-slate-900">{mission.organization_name || 'Non défini'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <p className="text-slate-900">{mission.description || 'Aucune description'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Marque Blanche</CardTitle>
                  <CardDescription>Personnalisez l'apparence de votre espace mission</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-500 text-sm">
                    Configuration de la marque blanche à venir...
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Modal d'ajout de matériau */}
      <AddMissionMaterialModal
        missionId={missionId}
        isOpen={showAddMaterialModal}
        onClose={() => setShowAddMaterialModal(false)}
        onSuccess={() => {
          loadMissionData();
          setShowAddMaterialModal(false);
        }}
        suggestedMaterials={mission?.ai_context_data?.suggestedMaterials || []}
      />
    </div>
  );
}
