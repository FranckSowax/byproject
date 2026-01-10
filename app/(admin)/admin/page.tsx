"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  FolderKanban,
  FileText,
  Globe,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Gift,
  Sparkles,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  totalProjects: number;
  totalTemplates: number;
  totalSupplierRequests: number;
  activeRequests: number;
  completedRequests: number;
  totalMaterials: number;
  recentActivity: number;
}

function QuoteRequestLinkCopier() {
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const quoteRequestUrl = `${baseUrl}/quote-request`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(quoteRequestUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erreur lors de la copie");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3">
        <ExternalLink className="h-5 w-5 text-white/60 shrink-0" />
        <span className="text-white font-mono text-sm truncate">
          {quoteRequestUrl || "Chargement..."}
        </span>
      </div>
      <Button
        onClick={handleCopy}
        className={`shrink-0 font-semibold rounded-xl px-6 py-6 shadow-lg transition-all gap-2 ${
          copied
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "bg-white text-purple-700 hover:bg-white/90"
        }`}
      >
        {copied ? (
          <>
            <Check className="h-5 w-5" />
            Copié !
          </>
        ) : (
          <>
            <Copy className="h-5 w-5" />
            Copier le lien
          </>
        )}
      </Button>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProjects: 0,
    totalTemplates: 0,
    totalSupplierRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    totalMaterials: 0,
    recentActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Utilisateurs',
      value: stats.totalUsers,
      icon: Users,
      change: '+12%',
      changeType: 'positive' as const,
      href: '/admin/users',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      title: 'Projets',
      value: stats.totalProjects,
      icon: FolderKanban,
      change: '+8%',
      changeType: 'positive' as const,
      href: '/admin/projects',
      color: 'from-purple-600 to-pink-600',
    },
    {
      title: 'Templates',
      value: stats.totalTemplates,
      icon: FileText,
      change: '+3',
      changeType: 'neutral' as const,
      href: '/admin/templates',
      color: 'from-orange-600 to-red-600',
    },
    {
      title: 'Cotations Chinoises',
      value: stats.totalSupplierRequests,
      icon: Globe,
      change: `${stats.activeRequests} actives`,
      changeType: 'neutral' as const,
      href: '/admin/supplier-requests',
      color: 'from-green-600 to-emerald-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="text-slate-600 mt-1">Vue d'ensemble de la plateforme Compa Chantier</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Carte promotionnelle - Lien de demande de cotation à partager */}
      <Card className="border-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 shadow-xl rounded-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <CardContent className="relative p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
                <Gift className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  <span className="text-yellow-300 text-sm font-semibold uppercase tracking-wider">
                    Lien à partager
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Demande de cotation freemium
                </h3>
                <p className="text-white/80 text-sm md:text-base max-w-xl">
                  Partagez ce lien avec vos clients pour qu'ils puissent demander une cotation.
                  Ils bénéficieront de <span className="font-semibold text-yellow-300">15 jours d'essai gratuit</span>.
                </p>
              </div>
            </div>
            <QuoteRequestLinkCopier />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      {stat.title}
                    </CardTitle>
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold text-slate-900">
                        {loading ? '...' : stat.value}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        {stat.changeType === 'positive' && (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        )}
                        {stat.changeType === 'negative' && (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${
                          stat.changeType === 'positive' ? 'text-green-600' :
                          stat.changeType === 'negative' ? 'text-red-600' :
                          'text-slate-600'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cotations Status */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Cotations Fournisseurs
            </CardTitle>
            <CardDescription>Statut des demandes chinoises</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">En cours</span>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {stats.activeRequests}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-slate-700">Complétées</span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {stats.completedRequests}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">Total</span>
              </div>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {stats.totalSupplierRequests}
              </Badge>
            </div>
            <Link href="/admin/supplier-requests">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Voir toutes les demandes
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Materials Stats */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-600" />
              Matériaux
            </CardTitle>
            <CardDescription>Catalogue global</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-6">
              <p className="text-5xl font-bold text-slate-900">{stats.totalMaterials}</p>
              <p className="text-sm text-slate-600 mt-2">Matériaux référencés</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-slate-900">--</p>
                <p className="text-xs text-slate-600 mt-1">Catégories</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-slate-900">--</p>
                <p className="text-xs text-slate-600 mt-1">Prix moyens</p>
              </div>
            </div>
            <Link href="/admin/materials">
              <Button variant="outline" className="w-full">
                Gérer le catalogue
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Actions Rapides
            </CardTitle>
            <CardDescription>Raccourcis admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                Gérer les utilisateurs
              </Button>
            </Link>
            <Link href="/admin/templates">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                Ajouter un template
              </Button>
            </Link>
            <Link href="/admin/exchange-rates">
              <Button variant="outline" className="w-full justify-start gap-2">
                <DollarSign className="h-4 w-4" />
                Mettre à jour les taux
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Activity className="h-4 w-4" />
                Configuration système
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Placeholder */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Activité Récente
          </CardTitle>
          <CardDescription>Dernières actions sur la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Aucune activité récente</p>
            <p className="text-sm mt-1">Les dernières actions s'afficheront ici</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
