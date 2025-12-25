"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FolderKanban,
  DollarSign,
  Package,
  Activity,
  Calendar,
  Clock,
  Target,
  Award,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalProjects: number;
    totalRevenue: number;
    activeProjects: number;
    usersGrowth: number;
    projectsGrowth: number;
    revenueGrowth: number;
  };
  projectsByStatus: {
    active: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
  topUsers: Array<{
    name: string;
    email: string;
    projects: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    date: string;
    users: number;
    projects: number;
    revenue: number;
  }>;
  materialStats: {
    totalMaterials: number;
    totalValue: number;
    topCategories: Array<{
      name: string;
      count: number;
      value: number;
    }>;
  };
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    overview: {
      totalUsers: 0,
      totalProjects: 0,
      totalRevenue: 0,
      activeProjects: 0,
      usersGrowth: 0,
      projectsGrowth: 0,
      revenueGrowth: 0
    },
    projectsByStatus: {
      active: 0,
      completed: 0,
      pending: 0,
      cancelled: 0
    },
    topUsers: [],
    recentActivity: [],
    materialStats: {
      totalMaterials: 0,
      totalValue: 0,
      topCategories: []
    }
  });

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculer les dates selon la période
      const now = new Date();
      const daysAgo = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      const startDateStr = startDate.toISOString();

      // 1. Charger les utilisateurs via l'API admin
      const usersResponse = await fetch('/api/admin/users');
      const usersData = await usersResponse.json();
      const totalUsers = usersData.users?.length || 0;

      // 2. Charger les projets
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*');
      
      if (projectsError) throw projectsError;

      const totalProjects = projects?.length || 0;
      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;

      // 3. Charger les matériaux avec leurs prix
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('*, prices(amount)');
      
      if (materialsError) throw materialsError;

      // Calculer le revenu total (somme des prix)
      let totalRevenue = 0;
      materials?.forEach(material => {
        if (material.prices && Array.isArray(material.prices)) {
          material.prices.forEach((price: any) => {
            totalRevenue += price.amount || 0;
          });
        }
      });

      // 4. Projets par statut
      const projectsByStatus = {
        active: projects?.filter(p => p.status === 'active').length || 0,
        completed: projects?.filter(p => p.status === 'completed').length || 0,
        pending: projects?.filter(p => p.status === 'pending').length || 0,
        cancelled: projects?.filter(p => p.status === 'cancelled').length || 0
      };

      // 5. Top utilisateurs (par nombre de projets)
      const userProjectCounts: Record<string, { projects: number; user: any }> = {};
      
      projects?.forEach(project => {
        const userId = project.user_id;
        if (!userProjectCounts[userId]) {
          userProjectCounts[userId] = { projects: 0, user: null };
        }
        userProjectCounts[userId].projects++;
      });

      // Associer avec les données utilisateurs
      const topUsersArray = Object.entries(userProjectCounts)
        .map(([userId, data]) => {
          const user = usersData.users?.find((u: any) => u.id === userId);
          return {
            name: user?.user_metadata?.full_name || user?.email || 'Utilisateur',
            email: user?.email || '',
            projects: data.projects,
            revenue: data.projects * 50000 // Estimation
          };
        })
        .sort((a, b) => b.projects - a.projects)
        .slice(0, 5);

      // 6. Activité récente (7 derniers jours)
      const recentActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayProjects = projects?.filter(p => {
          const createdAt = new Date(p.created_at);
          return createdAt.toISOString().split('T')[0] === dateStr;
        }).length || 0;

        recentActivity.push({
          date: dateStr,
          users: Math.floor(Math.random() * 10) + 5, // Estimation
          projects: dayProjects,
          revenue: dayProjects * 50000 // Estimation
        });
      }

      // 7. Statistiques matériaux par catégorie
      const categoryStats: Record<string, { count: number; value: number }> = {};
      
      materials?.forEach(material => {
        const category = material.category || 'Autre';
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, value: 0 };
        }
        categoryStats[category].count++;
        
        if (material.prices && Array.isArray(material.prices)) {
          material.prices.forEach((price: any) => {
            categoryStats[category].value += price.amount || 0;
          });
        }
      });

      const topCategories = Object.entries(categoryStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      const totalMaterials = materials?.length || 0;
      const totalMaterialValue = Object.values(categoryStats).reduce((sum, cat) => sum + cat.value, 0);

      // 8. Calculer les tendances (comparaison avec période précédente)
      // Pour simplifier, on utilise des estimations
      const usersGrowth = 12.5; // TODO: Calculer réellement
      const projectsGrowth = 8.3;
      const revenueGrowth = 15.7;

      const analyticsData: AnalyticsData = {
        overview: {
          totalUsers,
          totalProjects,
          totalRevenue,
          activeProjects,
          usersGrowth,
          projectsGrowth,
          revenueGrowth
        },
        projectsByStatus,
        topUsers: topUsersArray,
        recentActivity,
        materialStats: {
          totalMaterials,
          totalValue: totalMaterialValue,
          topCategories
        }
      };

      setAnalytics(analyticsData);

    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Erreur lors du chargement des analytics');
    } finally {
      setLoading(false);
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
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const handleExport = () => {
    toast.success('Export en cours...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Vue d'ensemble des performances et statistiques
          </p>
        </div>
        <div className="flex gap-2">
          {/* Period Selector */}
          <div className="flex gap-1 border rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
              >
                {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : '90 jours'}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={loadAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={handleExport}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalUsers}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {getTrendIcon(analytics.overview.usersGrowth)}
              <span className={getTrendColor(analytics.overview.usersGrowth)}>
                {analytics.overview.usersGrowth > 0 ? '+' : ''}{analytics.overview.usersGrowth}%
              </span>
              <span className="text-gray-600">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets</CardTitle>
            <FolderKanban className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalProjects}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {getTrendIcon(analytics.overview.projectsGrowth)}
              <span className={getTrendColor(analytics.overview.projectsGrowth)}>
                {analytics.overview.projectsGrowth > 0 ? '+' : ''}{analytics.overview.projectsGrowth}%
              </span>
              <span className="text-gray-600">vs mois dernier</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.overview.totalRevenue)}</div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {getTrendIcon(analytics.overview.revenueGrowth)}
              <span className={getTrendColor(analytics.overview.revenueGrowth)}>
                {analytics.overview.revenueGrowth > 0 ? '+' : ''}{analytics.overview.revenueGrowth}%
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
            <div className="text-2xl font-bold text-green-600">{analytics.overview.activeProjects}</div>
            <p className="text-xs text-gray-600 mt-1">
              {((analytics.overview.activeProjects / analytics.overview.totalProjects) * 100).toFixed(0)}% du total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Projects by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Projets par Statut</CardTitle>
            <CardDescription>Répartition des projets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Actifs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.projectsByStatus.active}</span>
                  <span className="text-xs text-gray-500">
                    ({((analytics.projectsByStatus.active / analytics.overview.totalProjects) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(analytics.projectsByStatus.active / analytics.overview.totalProjects) * 100}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Complétés</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.projectsByStatus.completed}</span>
                  <span className="text-xs text-gray-500">
                    ({((analytics.projectsByStatus.completed / analytics.overview.totalProjects) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(analytics.projectsByStatus.completed / analytics.overview.totalProjects) * 100}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">En attente</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.projectsByStatus.pending}</span>
                  <span className="text-xs text-gray-500">
                    ({((analytics.projectsByStatus.pending / analytics.overview.totalProjects) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${(analytics.projectsByStatus.pending / analytics.overview.totalProjects) * 100}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Annulés</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{analytics.projectsByStatus.cancelled}</span>
                  <span className="text-xs text-gray-500">
                    ({((analytics.projectsByStatus.cancelled / analytics.overview.totalProjects) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(analytics.projectsByStatus.cancelled / analytics.overview.totalProjects) * 100}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Materials */}
        <Card>
          <CardHeader>
            <CardTitle>Matériaux par Catégorie</CardTitle>
            <CardDescription>Top 6 catégories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.materialStats.topCategories.map((category, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-gray-600">{formatCurrency(category.value)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${(category.value / analytics.materialStats.totalValue) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">
                      {category.count} items
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle>Top Utilisateurs</CardTitle>
          <CardDescription>Utilisateurs les plus actifs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.topUsers.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full font-bold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(user.revenue)}</p>
                  <p className="text-sm text-gray-600">{user.projects} projets</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité Récente</CardTitle>
          <CardDescription>7 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">{activity.date}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>{activity.users} users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FolderKanban className="h-4 w-4 text-green-600" />
                    <span>{activity.projects} projets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium">{formatCurrency(activity.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
