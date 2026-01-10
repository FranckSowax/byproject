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
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminTopBar from '@/components/admin/AdminTopBar';
import { NotificationBell } from '@/components/notifications/NotificationBell';

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
      {
        name: 'Matériaux & Prix',
        href: '/admin/materials',
        icon: Package,
        badge: null,
        description: 'Catalogue avec prix fournisseurs'
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
    <AdminGuard>
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
        <AdminTopBar />

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
    </AdminGuard>
  );
}
