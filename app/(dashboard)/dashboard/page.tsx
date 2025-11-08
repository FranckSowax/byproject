"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Zap,
  Target,
  RefreshCw,
  ArrowUpRight,
  Minus
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Project {
  id: string;
  name: string;
  created_at: string | null;
  status?: string;
  user_id: string | null;
}

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pendingProjects: number;
  totalMaterials: number;
  totalValue: number;
  recentActivity: number;
  projectsGrowth: number;
  materialsGrowth: number;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingProjects: 0,
    totalMaterials: 0,
    totalValue: 0,
    recentActivity: 0,
    projectsGrowth: 0,
    materialsGrowth: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Charger l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (!user) {
        setIsLoading(false);
        return;
      }

      // 2. Charger les projets de l'utilisateur
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      setProjects(projectsData || []);

      // 3. Charger les matériaux de l'utilisateur
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select('*, prices(amount)')
        .in('project_id', (projectsData || []).map(p => p.id));

      if (materialsError) throw materialsError;

      // 4. Calculer les statistiques
      const totalProjects = projectsData?.length || 0;
      const activeProjects = projectsData?.filter((p: any) => p.status === 'active').length || 0;
      const completedProjects = projectsData?.filter((p: any) => p.status === 'completed').length || 0;
      const pendingProjects = projectsData?.filter((p: any) => p.status === 'pending').length || 0;
      const totalMaterials = materialsData?.length || 0;

      // Calculer la valeur totale
      let totalValue = 0;
      materialsData?.forEach((material: any) => {
        if (material.prices && Array.isArray(material.prices)) {
          material.prices.forEach((price: any) => {
            totalValue += price.amount || 0;
          });
        }
      });

      // Activité récente (projets créés dans les 7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentActivity = projectsData?.filter(p => 
        p.created_at && new Date(p.created_at) > sevenDaysAgo
      ).length || 0;

      // Estimations de croissance (TODO: calculer réellement)
      const projectsGrowth = 12.5;
      const materialsGrowth = 8.3;

      setStats({
        totalProjects,
        activeProjects,
        completedProjects,
        pendingProjects,
        totalMaterials,
        totalValue,
        recentActivity,
        projectsGrowth,
        materialsGrowth
      });

    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Erreur lors du chargement du dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: 'Actif', className: 'bg-green-100 text-green-800 border-green-200' },
      completed: { label: 'Terminé', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-800 border-red-200' }
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={`${variant.className} border`}>{variant.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de Bord
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenue {currentUser?.user_metadata?.full_name || currentUser?.email || 'Utilisateur'} 👋
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Link href="/projects/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Projet
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes Projets</CardTitle>
            <FolderOpen className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {getTrendIcon(stats.projectsGrowth)}
              <span className={getTrendColor(stats.projectsGrowth)}>
                {stats.projectsGrowth > 0 ? '+' : ''}{stats.projectsGrowth}%
              </span>
              <span className="text-gray-600">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets Actifs</CardTitle>
            <Activity className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeProjects}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalProjects > 0 
                ? `${((stats.activeProjects / stats.totalProjects) * 100).toFixed(0)}% du total`
                : 'Aucun projet'
              }
            </p>
          </CardContent>
        </Card>

        {/* Total Materials */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matériaux</CardTitle>
            <Package className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMaterials}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {getTrendIcon(stats.materialsGrowth)}
              <span className={getTrendColor(stats.materialsGrowth)}>
                {stats.materialsGrowth > 0 ? '+' : ''}{stats.materialsGrowth}%
              </span>
              <span className="text-gray-600">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            <p className="text-xs text-gray-600 mt-1">
              Tous les projets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Completed Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets Terminés</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completedProjects}</div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalProjects > 0 
                ? `${((stats.completedProjects / stats.totalProjects) * 100).toFixed(0)}% du total`
                : 'Aucun projet terminé'
              }
            </p>
          </CardContent>
        </Card>

        {/* Pending Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingProjects}</div>
            <p className="text-xs text-gray-600 mt-1">
              Projets en attente
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activité Récente</CardTitle>
            <Zap className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats.recentActivity}</div>
            <p className="text-xs text-gray-600 mt-1">
              Projets créés cette semaine
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projets Récents</CardTitle>
              <CardDescription>Vos derniers projets</CardDescription>
            </div>
            <Link href="/projects">
              <Button variant="outline" size="sm">
                Voir tout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun projet
              </h3>
              <p className="text-gray-600 mb-4">
                Commencez par créer votre premier projet
              </p>
              <Link href="/projects/new">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un projet
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <FolderOpen className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          <p className="text-sm text-gray-600">
                            {project.created_at ? new Date(project.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(project.status || 'pending')}
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
          <CardDescription>Accès rapide aux fonctionnalités principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/projects/new">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Plus className="h-6 w-6" />
                <span>Nouveau Projet</span>
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <FolderOpen className="h-6 w-6" />
                <span>Mes Projets</span>
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <BarChart3 className="h-6 w-6" />
                <span>Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
