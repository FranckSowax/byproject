"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  FileText, 
  Package,
  DollarSign,
  Globe,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  Shield,
  Database,
  TrendingUp,
  MessageSquare,
  Calendar,
  Download,
  Upload,
  Activity,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminNavigation = [
  {
    title: 'Vue d\'ensemble',
    items: [
      {
        name: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        badge: null,
        description: 'Vue générale et KPIs'
      },
      {
        name: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
        badge: null,
        description: 'Statistiques et graphiques'
      },
      {
        name: 'Activité',
        href: '/admin/activity',
        icon: Activity,
        badge: 'Live',
        description: 'Activité en temps réel'
      },
    ]
  },
  {
    title: 'Gestion Utilisateurs',
    items: [
      {
        name: 'Utilisateurs',
        href: '/admin/users',
        icon: Users,
        badge: null,
        description: 'Gestion des comptes'
      },
      {
        name: 'Rôles & Permissions',
        href: '/admin/roles',
        icon: Shield,
        badge: null,
        description: 'Contrôle d\'accès'
      },
    ]
  },
  {
    title: 'Contenu',
    items: [
      {
        name: 'Projets',
        href: '/admin/projects',
        icon: FolderKanban,
        badge: null,
        description: 'Tous les projets'
      },
      {
        name: 'Templates',
        href: '/admin/templates',
        icon: FileText,
        badge: null,
        description: 'Modèles de projets'
      },
      {
        name: 'Matériaux',
        href: '/admin/materials',
        icon: Package,
        badge: null,
        description: 'Catalogue matériaux'
      },
    ]
  },
  {
    title: 'Finance',
    items: [
      {
        name: 'Devises',
        href: '/admin/currencies',
        icon: DollarSign,
        badge: null,
        description: 'Gestion devises'
      },
      {
        name: 'Taux de Change',
        href: '/admin/exchange-rates',
        icon: TrendingUp,
        badge: 'Auto',
        description: 'Taux de conversion'
      },
    ]
  },
  {
    title: 'Fournisseurs',
    items: [
      {
        name: 'Quotations',
        href: '/admin/quotations',
        icon: FileCheck,
        badge: null,
        description: 'Cotations reçues'
      },
      {
        name: 'Cotations Chinoises',
        href: '/admin/supplier-requests',
        icon: Globe,
        badge: null,
        description: 'Demandes fournisseurs'
      },
      {
        name: 'Fournisseurs',
        href: '/admin/suppliers',
        icon: Users,
        badge: null,
        description: 'Base fournisseurs'
      },
    ]
  },
  {
    title: 'Système',
    items: [
      {
        name: 'Configuration',
        href: '/admin/settings',
        icon: Settings,
        badge: null,
        description: 'Paramètres système'
      },
      {
        name: 'Base de données',
        href: '/admin/database',
        icon: Database,
        badge: null,
        description: 'Backups & migrations'
      },
      {
        name: 'Logs',
        href: '/admin/logs',
        icon: MessageSquare,
        badge: null,
        description: 'Journaux système'
      },
    ]
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300 shadow-xl",
          collapsed ? "w-20" : "w-72"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900">Admin Panel</h1>
                <p className="text-xs text-slate-500">Compa Chantier</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 max-h-[calc(100vh-140px)]">
          {adminNavigation.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;

                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative",
                          isActive
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                            : "text-slate-700 hover:bg-slate-100"
                        )}
                        title={collapsed ? item.name : undefined}
                      >
                        <Icon className={cn(
                          "h-5 w-5 shrink-0",
                          isActive ? "text-white" : "text-slate-600 group-hover:text-purple-600"
                        )} />
                        {!collapsed && (
                          <>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium text-sm truncate",
                                isActive ? "text-white" : "text-slate-900"
                              )}>
                                {item.name}
                              </p>
                              <p className={cn(
                                "text-xs truncate",
                                isActive ? "text-white/80" : "text-slate-500"
                              )}>
                                {item.description}
                              </p>
                            </div>
                            {item.badge && (
                              <Badge
                                variant={isActive ? "secondary" : "outline"}
                                className={cn(
                                  "text-xs",
                                  isActive ? "bg-white/20 text-white border-white/30" : ""
                                )}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4">
          <Link href="/dashboard">
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start gap-2",
                collapsed && "justify-center"
              )}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && "Retour App"}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "ml-20" : "ml-72"
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">Admin</p>
                  <p className="text-xs text-slate-500">Super Admin</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
